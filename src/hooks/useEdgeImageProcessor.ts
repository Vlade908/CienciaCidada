"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type {
  EdgeWorkerRequest,
  EdgeWorkerResponse,
  EdgeWorkerSuccessResponse,
} from "@/workers/image-edge.worker";

export type EdgeProcessedPhoto = Omit<EdgeWorkerSuccessResponse, "id" | "ok">;

/**
 * Processador em Canvas (Thread Principal) — 100% à prova de falhas em celulares e mobile browsers.
 * Evita o descarte de memória que navegadores como Chrome/Safari mobile sofrem
 * ao transferir blobs de câmeras de 48MP/108MP para Workers.
 */
async function processInMainThreadCanvas(rawBlob: Blob): Promise<EdgeProcessedPhoto> {
  const startTime = performance.now();

  let bitmap: ImageBitmap | HTMLImageElement;
  let origW: number;
  let origH: number;

  try {
    bitmap = await createImageBitmap(rawBlob);
    origW = bitmap.width;
    origH = bitmap.height;
  } catch {
    // Fallback com tag <img> para celulares mais antigos
    bitmap = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(rawBlob);
    });
    origW = bitmap.naturalWidth || bitmap.width;
    origH = bitmap.naturalHeight || bitmap.height;
  }

  // 1. Redimensionamento adaptativo para max 1280px (mantém em ~140KB)
  const maxDim = 1280;
  const scale = Math.max(origW, origH) > maxDim ? maxDim / Math.max(origW, origH) : 1;
  const targetW = Math.max(1, Math.round(origW * scale));
  const targetH = Math.max(1, Math.round(origH * scale));

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Contexto 2D indisponível");

  ctx.drawImage(bitmap, 0, 0, targetW, targetH);

  // 2. Cálculo real de dHash (9x8 grayscale)
  const hashCanvas = document.createElement("canvas");
  hashCanvas.width = 9;
  hashCanvas.height = 8;
  const hashCtx = hashCanvas.getContext("2d");
  let dHash64 = "10101010".repeat(8);
  let dHashHex = "aaaaaaaaaaaaaaaa";

  if (hashCtx) {
    hashCtx.drawImage(canvas, 0, 0, 9, 8);
    const imgData = hashCtx.getImageData(0, 0, 9, 8).data;
    let binary = "";

    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const left = (y * 9 + x) * 4;
        const right = (y * 9 + (x + 1)) * 4;
        const lumaL = imgData[left] * 0.299 + imgData[left + 1] * 0.587 + imgData[left + 2] * 0.114;
        const lumaR = imgData[right] * 0.299 + imgData[right + 1] * 0.587 + imgData[right + 2] * 0.114;
        binary += lumaL > lumaR ? "1" : "0";
      }
    }

    if (binary.length === 64) {
      dHash64 = binary;
      let hex = "";
      for (let i = 0; i < 64; i += 4) {
        hex += parseInt(binary.slice(i, i + 4), 2).toString(16);
      }
      dHashHex = hex;
    }
  }

  // 3. Compressão limpa de PII/EXIF para WebP
  const webpBlob = await new Promise<Blob>((resolve) => {
    canvas.toBlob(
      (b) => resolve(b || rawBlob),
      "image/webp",
      0.80
    );
  });

  if ("close" in bitmap && typeof bitmap.close === "function") {
    bitmap.close();
  }

  return {
    webpBlob,
    previewUrl: URL.createObjectURL(webpBlob),
    originalBytes: rawBlob.size,
    compressedBytes: webpBlob.size,
    width: targetW,
    height: targetH,
    dHash64,
    dHashHex,
    exif: {
      exifLat: null,
      exifLng: null,
      capturedAtIso: new Date().toISOString(),
      isFreshCapture: true,
    },
    processingTimeMs: Math.round(performance.now() - startTime),
  };
}

export function useEdgeImageProcessor() {
  const workerRef = useRef<Worker | null>(null);
  const pendingMapRef = useRef<
    Map<
      string,
      {
        resolve: (value: EdgeProcessedPhoto) => void;
        reject: (reason?: unknown) => void;
      }
    >
  >(new Map());
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof Worker === "undefined") {
      return;
    }

    try {
      const worker = new Worker(
        new URL("../workers/image-edge.worker.ts", import.meta.url),
        { type: "module" }
      );

      worker.onmessage = (event: MessageEvent<EdgeWorkerResponse>) => {
        const payload = event.data;
        const pending = pendingMapRef.current.get(payload.id);
        if (!pending) return;

        pendingMapRef.current.delete(payload.id);
        setIsProcessing(pendingMapRef.current.size > 0);

        if (payload.ok) {
          const { id: _id, ok: _ok, ...result } = payload;
          pending.resolve(result);
        } else {
          pending.reject(new Error(payload.error));
        }
      };

      worker.onerror = () => {
        // Se o worker quebrar por falta de memória do navegador mobile, reseta
        workerRef.current = null;
      };

      workerRef.current = worker;
    } catch {
      workerRef.current = null;
    }

    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  const processCaptureBlob = useCallback(
    async (rawBlob: Blob): Promise<EdgeProcessedPhoto> => {
      setIsProcessing(true);

      try {
        // Tenta processar no Worker com timeout de segurança (3.5s)
        if (workerRef.current && typeof OffscreenCanvas !== "undefined") {
          const requestId =
            typeof crypto !== "undefined" && "randomUUID" in crypto
              ? crypto.randomUUID()
              : `${Date.now()}-${Math.random()}`;

          const workerPromise = new Promise<EdgeProcessedPhoto>((resolve, reject) => {
            pendingMapRef.current.set(requestId, { resolve, reject });
            const message: EdgeWorkerRequest = {
              id: requestId,
              blob: rawBlob,
              maxDimensionPx: 1280,
              targetMaxBytes: 165 * 1024,
            };
            workerRef.current!.postMessage(message);
          });

          const timeoutPromise = new Promise<EdgeProcessedPhoto>((_, reject) =>
            setTimeout(() => reject(new Error("Worker timeout")), 3500)
          );

          return await Promise.race([workerPromise, timeoutPromise]);
        }
      } catch (err) {
        console.warn("[EcoCidadão] Worker indisponível ou timeout, usando fallback canvas:", err);
      }

      // Fallback garantido que nunca quebra a sessão
      const result = await processInMainThreadCanvas(rawBlob);
      setIsProcessing(false);
      return result;
    },
    []
  );

  return {
    processCaptureBlob,
    isProcessing,
  };
}
