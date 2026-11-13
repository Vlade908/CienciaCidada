import { createClient } from "@supabase/supabase-js";
import type { LocationSource } from "@/hooks/useHighAccuracyGps";
import type { WasteScale } from "@/components/camera/ScaleBottomSheet";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "[EcoCidadão] Variáveis NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_ANON_KEY não encontradas no ambiente."
  );
}

/**
 * Cliente Supabase seguro para uso Client-Side no PWA.
 * Utiliza estritamente as credenciais públicas (Anon Key),
 * respeitando as políticas de Row Level Security (RLS) configuradas no banco.
 */
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-anon-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

/**
 * Parâmetros de entrada para submissão do relato pelo Front-end
 */
export interface SubmitReportInput {
  tenantSlug?: string;
  lat: number | null;
  lng: number | null;
  accuracyMeters: number;
  locationSource: LocationSource;
  reportedScale: WasteScale;
  wasteTags: string[];
  imageDHash64: string;
  anonymousDeviceHash: string;
  qrCode?: string | null;
  isFreshCapture: boolean;
}

/**
 * Resposta tipada retornada pela Stored Procedure `fn_submit_citizen_report`
 */
export interface SubmitReportResult {
  cluster_id: string;
  protocol_code: string;
  status: "OPEN" | "TRIAGED" | "IN_ROUTE" | "CLEANED";
  confirmations_count: number;
  priority_score: number;
  is_merged_into_existing: boolean;
  is_duplicate_device: boolean;
  message: string;
  photo_url: string;
}

/**
 * Envia o relato completo para o Supabase (Upload da foto WebP + Execução da RPC PostGIS).
 *
 * @param payload Dados georreferenciados e metadados de observação
 * @param webpBlob Blob da foto otimizada (~140KB) gerada no Web Worker
 * @returns Resposta com ID do cluster, código de protocolo e status de unificação
 */
export async function submitReportToDatabase(
  payload: SubmitReportInput,
  webpBlob: Blob
): Promise<SubmitReportResult> {
  const bucketName = "reports-webp";

  // 1. Gera nome único e previsível para a imagem no bucket
  const fileExt = "webp";
  const timestamp = Date.now();
  const randomSuffix =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).substring(2, 10);
  const fileName = `${payload.tenantSlug || "piloto"}/${timestamp}-${randomSuffix}.${fileExt}`;

  // 2. Upload do Blob WebP para o Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(fileName, webpBlob, {
      contentType: "image/webp",
      cacheControl: "31536000", // 1 ano de cache estático
      upsert: false,
    });

  if (uploadError) {
    throw new Error(
      `Falha no upload da foto (${bucketName}): ${uploadError.message}`
    );
  }

  // 3. Obtém a URL pública oficial do objeto no Storage
  const { data: publicUrlData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(fileName);

  const photoPublicUrl = publicUrlData.publicUrl;

  // 4. Executa a RPC transacional de deduplicação espacial e visual no PostGIS
  const { data: rpcData, error: rpcError } = await supabase.rpc(
    "fn_submit_citizen_report",
    {
      p_tenant_slug: payload.tenantSlug || "piloto-universidade",
      p_lat: payload.lat,
      p_lng: payload.lng,
      p_accuracy_m: payload.accuracyMeters,
      p_location_source: payload.locationSource,
      p_reported_scale: payload.reportedScale,
      p_waste_tags: payload.wasteTags,
      p_photo_url: photoPublicUrl,
      p_image_dhash: payload.imageDHash64,
      p_device_hash: payload.anonymousDeviceHash,
      p_qr_code: payload.qrCode || null,
      p_is_fresh: payload.isFreshCapture,
    }
  );

  if (rpcError) {
    throw new Error(
      `Erro ao processar deduplicação espacial no banco: ${rpcError.message}`
    );
  }

  return {
    ...(rpcData as Omit<SubmitReportResult, "photo_url">),
    photo_url: photoPublicUrl,
  };
}
