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
 * Estrutura pública do protocolo para acompanhamento transparente do cidadão
 */
export interface ProtocolDetails {
  id: string;
  protocol_code: string;
  status: "OPEN" | "TRIAGED" | "IN_ROUTE" | "CLEANED" | "ARCHIVED";
  dominant_scale: "SMALL" | "MEDIUM" | "LARGE";
  waste_tags: string[];
  confirmations_count: number;
  priority_score: number;
  is_eco_critical: boolean;
  address_reference?: string;
  sample_photo_url: string;
  cleaned_photo_url?: string | null;
  first_reported_at: string;
  last_reported_at: string;
  cleaned_at?: string | null;
}

// Conjunto de demonstração inicial caso o banco ainda não possua o registro digitado
const SEED_PROTOCOLS: Record<string, ProtocolDetails> = {
  "ECO-2026-0001": {
    id: "c1a2b3c4-d5e6-7890-abcd-111122223333",
    protocol_code: "ECO-2026-0001",
    status: "OPEN",
    dominant_scale: "LARGE",
    waste_tags: ["ENTULHO", "CORREGO", "CONSTRUCAO"],
    confirmations_count: 7,
    priority_score: 92.5,
    is_eco_critical: true,
    address_reference: "Margem do Córrego Limpo, próximo ao viaduto",
    sample_photo_url: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=600&q=80",
    first_reported_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    last_reported_at: new Date().toISOString(),
  },
  "ECO-2026-0002": {
    id: "c2b3c4d5-e6f7-8901-bcde-222233334444",
    protocol_code: "ECO-2026-0002",
    status: "IN_ROUTE",
    dominant_scale: "MEDIUM",
    waste_tags: ["MOVEIS_VELHOS", "COLCHAO"],
    confirmations_count: 4,
    priority_score: 68.0,
    is_eco_critical: false,
    address_reference: "Rua das Flores, altura do número 450",
    sample_photo_url: "https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=600&q=80",
    first_reported_at: new Date(Date.now() - 3600000 * 11).toISOString(),
    last_reported_at: new Date().toISOString(),
  },
  "ECO-2026-0003": {
    id: "c3c4d5e6-f7a8-9012-cdef-333344445555",
    protocol_code: "ECO-2026-0003",
    status: "OPEN",
    dominant_scale: "SMALL",
    waste_tags: ["LIXO_DOMESTICO"],
    confirmations_count: 2,
    priority_score: 34.0,
    is_eco_critical: false,
    address_reference: "Travessa da Esperança com Av. Central",
    sample_photo_url: "https://images.unsplash.com/photo-1528323273322-d81458248d40?auto=format&fit=crop&w=600&q=80",
    first_reported_at: new Date(Date.now() - 3600000 * 18).toISOString(),
    last_reported_at: new Date().toISOString(),
  },
  "ECO-2026-0004": {
    id: "c4d5e6f7-a8b9-0123-def0-444455556666",
    protocol_code: "ECO-2026-0004",
    status: "CLEANED",
    dominant_scale: "MEDIUM",
    waste_tags: ["PNEUS", "DENGUE"],
    confirmations_count: 5,
    priority_score: 81.0,
    is_eco_critical: true,
    address_reference: "Rua Bela Vista, terreno baldio ao lado da praça",
    sample_photo_url: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=600&q=80",
    cleaned_photo_url: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80",
    first_reported_at: new Date(Date.now() - 3600000 * 36).toISOString(),
    last_reported_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    cleaned_at: new Date(Date.now() - 3600000 * 8).toISOString(),
  },
};

/**
 * Consulta os detalhes públicos de um protocolo de descarte
 * @param protocolCode Código no formato 'ECO-2026-XXXX'
 */
export async function fetchProtocolDetails(
  protocolCode: string
): Promise<ProtocolDetails | null> {
  const normalized = protocolCode.trim().toUpperCase();
  if (!normalized) return null;

  try {
    const { data, error } = await supabase
      .from("incident_clusters")
      .select(`
        id,
        protocol_code,
        status,
        dominant_scale,
        waste_tags,
        confirmations_count,
        priority_score,
        is_eco_critical,
        address_reference,
        sample_photo_url,
        cleaned_photo_url,
        first_reported_at,
        last_reported_at,
        cleaned_at
      `)
      .eq("protocol_code", normalized)
      .maybeSingle();

    if (error) {
      console.warn("[EcoCidadão] Erro na consulta do protocolo:", error.message);
      return SEED_PROTOCOLS[normalized] || null;
    }

    if (data) {
      return data as ProtocolDetails;
    }

    // Se não encontrou no banco, checa nos dados seed de demonstração
    return SEED_PROTOCOLS[normalized] || null;
  } catch (err) {
    console.error("[EcoCidadão] Falha na rede ao consultar protocolo:", err);
    return SEED_PROTOCOLS[normalized] || null;
  }
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
