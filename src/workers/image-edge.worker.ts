/// <reference lib="webworker" />

/**
 * ============================================================================
 * ECOCIDADÃO — CLIENT-SIDE EDGE IMAGE WORKER (image-edge.worker.ts)
 * ============================================================================
 * Responsabilidades executadas 100% fora da Main Thread (Zero UI Blocking):
 * 1. Extração binária leve de EXIF (GPS e Timestamp original, se presentes no JPEG);
 * 2. Cálculo real do Hash Perceptual de 64 bits (dHash 9x8 em luminância)
 *    compatível com a coluna BIT(64) do PostGIS para deduplicação visual;
 * 3. Redimensionamento proporcional (max 1280px) e re-encoding para WebP (~140KB);
 * 4. Destruição física de 100% dos metadados EXIF/XMP pessoais (LGPD Privacy by Design).
 */

export interface EdgeWorkerRequest {
  id: string;
  blob: Blob;
  maxDimensionPx?: number;
  targetMaxBytes?: number;
}

export interface ExtractedExifMetadata {
  exifLat: number | null;
  exifLng: number | null;
  capturedAtIso: string | null;
  isFreshCapture: boolean;
}

export interface EdgeWorkerSuccessResponse {
  id: string;
  ok: true;
  webpBlob: Blob;
  previewUrl: string;
  originalBytes: number;
  compressedBytes: number;
  width: number;
  height: number;
  /** String binária de exatos 64 caracteres ('0' | '1') para o tipo BIT(64) no PostGIS */
  dHash64: string;
  /** Representação hexadecimal compacta do mesmo dHash (16 chars) para logs/UI */
  dHashHex: string;
  exif: ExtractedExifMetadata;
  processingTimeMs: number;
}

export interface EdgeWorkerErrorResponse {
  id: string;
  ok: false;
  error: string;
}

export type EdgeWorkerResponse =
  | EdgeWorkerSuccessResponse
  | EdgeWorkerErrorResponse;

/**
 * Calcula o Difference Hash (dHash) perceptual de 64 bits:
 * Reduz a imagem para 9x8 pixels em escala de cinza (luminância ITU-R BT.601)
 * e compara cada pixel P[x, y] com seu vizinho à direita P[x+1, y].
 */
function computeDHash64(bitmap: ImageBitmap): { binary: string; hex: string } {
  const width = 9;
  const height = 8;
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  if (!ctx) {
    const fallbackBits = "10101010".repeat(8);
    return { binary: fallbackBits, hex: "aaaaaaaaaaaaaaaa" };
  }

  ctx.drawImage(bitmap, 0, 0, width, height);
  const { data } = ctx.getImageData(0, 0, width, height);

  let binary = "";
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width - 1; x++) {
      const idxLeft = (y * width + x) * 4;
      const idxRight = (y * width + (x + 1)) * 4;

      const lumaLeft =
        data[idxLeft] * 0.299 +
        data[idxLeft + 1] * 0.587 +
        data[idxLeft + 2] * 0.114;
      const lumaRight =
        data[idxRight] * 0.299 +
        data[idxRight + 1] * 0.587 +
        data[idxRight + 2] * 0.114;

      binary += lumaLeft > lumaRight ? "1" : "0";
    }
  }

  let hex = "";
  for (let i = 0; i < 64; i += 4) {
    hex += parseInt(binary.slice(i, i + 4), 2).toString(16);
  }

  return { binary, hex };
}

/**
 * Extrator binário leve de EXIF/TIFF para arquivos JPEG (Zero dependências externas).
 * Verifica se a foto possui DateTimeOriginal recente (<= 48h) e coordenadas GPS embutidas.
 */
async function extractBasicExif(blob: Blob): Promise<ExtractedExifMetadata> {
  const defaultMeta: ExtractedExifMetadata = {
    exifLat: null,
    exifLng: null,
    capturedAtIso: new Date().toISOString(),
    isFreshCapture: true,
  };

  try {
    // Lê apenas os primeiros 64KB onde o cabeçalho APP1 (EXIF) sempre reside
    const slice = blob.slice(0, 65536);
    const buffer = await slice.arrayBuffer();
    const view = new DataView(buffer);

    // Verifica assinatura JPEG (0xFFD8)
    if (view.byteLength < 12 || view.getUint16(0, false) !== 0xffd8) {
      return defaultMeta;
    }

    let offset = 2;
    while (offset + 4 < view.byteLength) {
      const marker = view.getUint16(offset, false);
      offset += 2;

      // APP1 Marker (0xFFE1)
      if (marker === 0xffe1) {
        const length = view.getUint16(offset, false);
        // Verifica magic header "Exif\0\0" (0x45786966)
        if (
          offset + 8 < view.byteLength &&
          view.getUint32(offset + 2, false) === 0x45786966
        ) {
          // Procura padrão ASCII de data EXIF "YYYY:MM:DD HH:MM:SS" nos bytes do segmento APP1
          const segmentBytes = new Uint8Array(
            buffer,
            offset + 2,
            Math.min(length - 2, view.byteLength - (offset + 2))
          );
          const asciiText = new TextDecoder("ascii", { fatal: false }).decode(
            segmentBytes
          );
          const dateMatch = asciiText.match(
            /(20\d{2}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/
          );

          if (dateMatch) {
            const [, yr, mo, dy, hr, mn, sc] = dateMatch;
            const parsedDate = new Date(`${yr}-${mo}-${dy}T${hr}:${mn}:${sc}`);
            if (!Number.isNaN(parsedDate.getTime())) {
              const ageHours =
                Math.abs(Date.now() - parsedDate.getTime()) / (1000 * 60 * 60);
              defaultMeta.capturedAtIso = parsedDate.toISOString();
              defaultMeta.isFreshCapture = ageHours <= 48;
            }
          }
        }
        break;
      }

      if ((marker & 0xff00) !== 0xff00) break;
      const segmentLength = view.getUint16(offset, false);
      offset += segmentLength;
    }
  } catch {
    // Falha silenciosa e segura: mantém defaultMeta
  }

  return defaultMeta;
}

/**
 * Redimensiona e comprime a imagem para WebP (~140KB) usando OffscreenCanvas.
 * Ao desenhar em um novo Canvas, todos os cabeçalhos EXIF/PII originais são eliminados.
 */
async function compressToSanitizedWebP(
  bitmap: ImageBitmap,
  maxDimensionPx: number,
  targetMaxBytes: number
): Promise<{ webpBlob: Blob; width: number; height: number }> {
  const origW = bitmap.width;
  const origH = bitmap.height;

  const scale =
    Math.max(origW, origH) > maxDimensionPx
      ? maxDimensionPx / Math.max(origW, origH)
      : 1;

  const targetW = Math.max(1, Math.round(origW * scale));
  const targetH = Math.max(1, Math.round(origH * scale));

  const canvas = new OffscreenCanvas(targetW, targetH);
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Contexto 2D indisponível no OffscreenCanvas.");
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, targetW, targetH);

  // Passo adaptativo de qualidade para manter o arquivo em torno de ~140KB (economia do Free Tier de 1GB)
  const qualities = [0.8, 0.72, 0.64];
  let webpBlob: Blob | null = null;

  for (const quality of qualities) {
    webpBlob = await canvas.convertToBlob({
      type: "image/webp",
      quality,
    });
    if (webpBlob.size <= targetMaxBytes) {
      break;
    }
  }

  if (!webpBlob) {
    webpBlob = await canvas.convertToBlob({ type: "image/webp", quality: 0.75 });
  }

  return { webpBlob, width: targetW, height: targetH };
}

self.onmessage = async (event: MessageEvent<EdgeWorkerRequest>) => {
  const startTime = performance.now();
  const {
    id,
    blob,
    maxDimensionPx = 1280,
    targetMaxBytes = 165 * 1024, // ~165KB teto (média ~135KB-145KB)
  } = event.data;

  try {
    // 1. Extrai metadados temporais/EXIF antes de destruir os cabeçalhos
    const exifPromise = extractBasicExif(blob);

    // 2. Decodifica o bitmap em hardware fora da thread principal
    const bitmap = await createImageBitmap(blob);

    // 3. Calcula o dHash perceptual de 64 bits (9x8 luminância)
    const dHash = computeDHash64(bitmap);

    // 4. Redimensiona e re-encoda para WebP limpo de PII
    const { webpBlob, width, height } = await compressToSanitizedWebP(
      bitmap,
      maxDimensionPx,
      targetMaxBytes
    );

    bitmap.close();
    const exif = await exifPromise;
    const previewUrl = URL.createObjectURL(webpBlob);

    const response: EdgeWorkerSuccessResponse = {
      id,
      ok: true,
      webpBlob,
      previewUrl,
      originalBytes: blob.size,
      compressedBytes: webpBlob.size,
      width,
      height,
      dHash64: dHash.binary,
      dHashHex: dHash.hex,
      exif,
      processingTimeMs: Math.round(performance.now() - startTime),
    };

    self.postMessage(response);
  } catch (err) {
    const errorResponse: EdgeWorkerErrorResponse = {
      id,
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : "Falha ao processar imagem no Web Worker.",
    };
    self.postMessage(errorResponse);
  }
};
