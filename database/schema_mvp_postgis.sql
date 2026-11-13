-- =========================================================================================
-- PROJETO: MAPEAMENTO COLABORATIVO DE DESCARTE IRREGULAR DE RESÍDUOS (DESAFIO 09)
-- EQUIPE:  Enzo Alves dos Santos Souza & Clayver Alexssander
-- ARQUIVO: database/schema_mvp_postgis.sql
-- ALVO:    Supabase Free Tier (PostgreSQL 15+ com extensão PostGIS nativa)
-- =========================================================================================
--
-- 👋 OLÁ, RESPONSÁVEL PELO BACK-END / BANCO DE DADOS!
-- Este script foi preparado para você colar e rodar DE UMA SÓ VEZ no "SQL Editor" do Supabase.
-- Ele é 100% idempotente (pode ser rodado novamente sem quebrar) e já configura:
--   1. As extensões geoespaciais (PostGIS) e criptográficas (pgcrypto);
--   2. As 5 tabelas principais com índices espaciais GIST de alta performance;
--   3. As políticas de segurança (Row Level Security - RLS) para o Front-end Next.js acessar;
--   4. O Motor de Deduplicação Espacial e Visual (RPC: fn_submit_citizen_report);
--   5. O Gerador de Mapa GeoJSON para o Painel do Gestor (RPC: fn_get_active_hotspots_geojson);
--   6. A Função de Baixa "Local Limpo" (RPC: fn_resolve_cluster_clean);
--   7. Dados iniciais de teste (Seed) para vocês testarem o mapa imediatamente!
--
-- COMO EXECUTAR NO SUPABASE (PASSO A PASSO):
--   Passo 1: No painel do Supabase, vá em "SQL Editor" (ícone de terminal na barra esquerda).
--   Passo 2: Clique em "+ New query", cole TODO este arquivo e clique no botão verde "Run".
--   Passo 3: Vá em "Storage" na barra esquerda e crie 2 buckets marcados como "Public":
--            -> Bucket 1: reports-webp
--            -> Bucket 2: cleaned-photos
--   Passo 4: Pronto! As funções já estarão disponíveis automaticamente como endpoints REST/RPC
--            para o código Next.js/React do Front-end chamar via supabase.rpc(...).
-- =========================================================================================

BEGIN;

-- -----------------------------------------------------------------------------------------
-- PASSO 1: ATIVAÇÃO DE EXTENSÕES NATIVAS (GRATUITAS NO SUPABASE)
-- -----------------------------------------------------------------------------------------
-- 'postgis': Habilita tipos GEOMETRY/GEOGRAPHY e cálculos de raio em metros (ST_DWithin).
-- 'pgcrypto': Habilita geração de UUIDs seguros (gen_random_uuid).
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Sequência numérica para gerar protocolos amigáveis para o cidadão (Ex: ECO-2026-0001)
CREATE SEQUENCE IF NOT EXISTS seq_eco_protocol START WITH 1 INCREMENT BY 1;


-- -----------------------------------------------------------------------------------------
-- PASSO 2: CRIAÇÃO DAS TABELAS E ÍNDICES ESPACIAIS
-- -----------------------------------------------------------------------------------------

-- =========================================================================================
-- TABELA 1: tenants (Prefeituras, Secretarias de Obras, Concessionárias ou Bairro Piloto)
-- Por que existe? Permite que o mesmo banco atenda tanto o MVP na universidade/bairro piloto
-- quanto múltiplas prefeituras pagantes no futuro (Arquitetura SaaS Multi-Tenant).
-- =========================================================================================
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(120) NOT NULL,
    slug VARCHAR(60) UNIQUE NOT NULL, -- Usado pelo Front-end para identificar o município/piloto
    dedup_radius_meters NUMERIC(5,2) NOT NULL DEFAULT 25.00, -- Raio padrão para unificar relatos (25m)
    webhook_156_url TEXT, -- Reservado para Fase Madura (Integração API White-Label 156)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.tenants IS 'Organizações clientes (B2G/B2B) ou áreas de projeto piloto.';


-- =========================================================================================
-- TABELA 2: qr_anchors (Placas Físicas de QR Code instaladas em "Pontos Viciados")
-- Por que existe? Quando o cidadão escaneia um QR Code na rua, já sabemos a coordenada exata
-- da placa, servindo como âncora caso o GPS do celular dele esteja em "Cold Start" ou sem sinal.
-- =========================================================================================
CREATE TABLE IF NOT EXISTS public.qr_anchors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    code VARCHAR(32) UNIQUE NOT NULL, -- Código impresso na placa (Ex: 'QR-CORREGO-01')
    location GEOMETRY(Point, 4326) NOT NULL, -- Coordenada WGS84 (Longitude, Latitude)
    address_hint VARCHAR(255) NOT NULL, -- Endereço de referência humano para o motorista do caminhão
    is_eco_critical BOOLEAN NOT NULL DEFAULT FALSE, -- TRUE se for margem de córrego / área de alagamento
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice espacial GIST para localizar placas próximas rapidamente
CREATE INDEX IF NOT EXISTS idx_qr_anchors_geom
    ON public.qr_anchors USING GIST (location);


-- =========================================================================================
-- TABELA 3: incident_clusters (Os "Hotspots" Unificados — Visão da Gestora Juliana)
-- Por que existe? Em vez de a prefeitura ver 15 denúncias repetidas do mesmo monte de entulho,
-- ela enxerga apenas 1 registro nesta tabela com confirmations_count = 15!
-- =========================================================================================
CREATE TABLE IF NOT EXISTS public.incident_clusters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    protocol_code VARCHAR(24) UNIQUE NOT NULL, -- Ex: 'ECO-2026-0001'
    centroid_geom GEOMETRY(Point, 4326) NOT NULL, -- Centroide recalculado pela precisão do GPS
    weight_sum NUMERIC(14,6) NOT NULL DEFAULT 1.0, -- Acumulador estatístico de pesos (1 / accuracy^2)
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN'
        CHECK (status IN ('OPEN', 'TRIAGED', 'IN_ROUTE', 'CLEANED', 'ARCHIVED')),
    dominant_scale VARCHAR(10) NOT NULL
        CHECK (dominant_scale IN ('SMALL', 'MEDIUM', 'LARGE')),
    waste_tags TEXT[] NOT NULL DEFAULT '{}', -- Ex: ARRAY['ENTULHO', 'VOLUMOSO', 'CORREGO']
    confirmations_count INTEGER NOT NULL DEFAULT 1, -- Quantos cidadãos diferentes confirmaram este foco
    priority_score NUMERIC(8,2) NOT NULL DEFAULT 10.0, -- Score automático para ordenar a fila de caminhões
    is_eco_critical BOOLEAN NOT NULL DEFAULT FALSE, -- Herda TRUE se for próximo a córrego
    address_reference VARCHAR(255), -- Preenchido via âncora QR ou Reverse Geocoding cacheado
    sample_photo_url TEXT NOT NULL, -- Foto principal exibida no card do mapa
    cleaned_photo_url TEXT, -- Foto do "Depois" anexada pela equipe de limpeza
    cleaned_at TIMESTAMPTZ,
    first_reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ÍNDICE CRÍTICO DE PERFORMANCE:
-- Indexa espacialmente APENAS os clusters que ainda NÃO foram limpos.
-- Isso garante que a busca de deduplicação num raio de 25m rode em < 5 milissegundos!
CREATE INDEX IF NOT EXISTS idx_clusters_active_geom
    ON public.incident_clusters USING GIST (centroid_geom)
    WHERE status IN ('OPEN', 'TRIAGED', 'IN_ROUTE');

-- Índice para ordenar rapidamente a fila de despacho da prefeitura por prioridade
CREATE INDEX IF NOT EXISTS idx_clusters_priority
    ON public.incident_clusters (tenant_id, status, priority_score DESC);


-- =========================================================================================
-- TABELA 4: citizen_reports (Os Relatos Individuais Anônimos — Visão do Cidadão Marcos)
-- Por que existe? Guarda cada observação científica individual vinculada ao seu Cluster pai,
-- preservando a precisão do GPS, a escala votada e o hash perceptual de 64 bits da foto.
-- =========================================================================================
CREATE TABLE IF NOT EXISTS public.citizen_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cluster_id UUID NOT NULL REFERENCES public.incident_clusters(id) ON DELETE CASCADE,
    qr_anchor_id UUID REFERENCES public.qr_anchors(id) ON DELETE SET NULL,
    anonymous_device_hash VARCHAR(64) NOT NULL, -- Hash SHA-256 anônimo (LGPD: zero dados pessoais!)
    report_geom GEOMETRY(Point, 4326) NOT NULL,
    gps_accuracy_m NUMERIC(6,2) NOT NULL DEFAULT 15.0, -- Precisão em metros reportada pelo celular
    location_source VARCHAR(16) NOT NULL DEFAULT 'BROWSER_GPS'
        CHECK (location_source IN ('BROWSER_GPS', 'EXIF_GPS', 'QR_ANCHOR')),
    reported_scale VARCHAR(10) NOT NULL
        CHECK (reported_scale IN ('SMALL', 'MEDIUM', 'LARGE')),
    photo_webp_url TEXT NOT NULL, -- URL da imagem WebP (~140KB) salva no Supabase Storage
    image_dhash BIT(64) NOT NULL, -- Assinatura visual de 64 bits calculada no navegador mobile
    is_fresh_capture BOOLEAN NOT NULL DEFAULT TRUE, -- FALSE se for foto antiga da galeria (>48h)
    captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice Anti-Spam (Proteção Sybil):
-- Impede que o mesmo aparelho celular infle artificialmente o mesmo cluster.
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_device_per_cluster
    ON public.citizen_reports (cluster_id, anonymous_device_hash);


-- =========================================================================================
-- TABELA 5: push_subscriptions (Inscrições do Toque 3: "🔔 Me avise quando limpar")
-- Por que existe? Armazena as chaves públicas do protocolo W3C Web Push (VAPID gratuito)
-- para notificar os celulares dos moradores assim que o cluster mudar para status = 'CLEANED'.
-- =========================================================================================
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cluster_id UUID NOT NULL REFERENCES public.incident_clusters(id) ON DELETE CASCADE,
    anonymous_device_hash VARCHAR(64) NOT NULL,
    endpoint TEXT NOT NULL, -- URL do servidor Web Push do navegador (FCM / Mozilla / Apple)
    p256dh_key TEXT NOT NULL,
    auth_key TEXT NOT NULL,
    notified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (cluster_id, endpoint)
);


-- -----------------------------------------------------------------------------------------
-- PASSO 3: FUNÇÃO AUXILIAR DE CÁLCULO DE PRIORIDADE LOGÍSTICA
-- -----------------------------------------------------------------------------------------
-- Fórmula: Peso do Porte (10, 25 ou 50) + 15 * ln(1 + confirmações) + Bônus Córrego (+30)
CREATE OR REPLACE FUNCTION public.fn_calculate_priority_score(
    p_scale VARCHAR,
    p_confirmations INTEGER,
    p_is_eco_critical BOOLEAN
)
RETURNS NUMERIC AS $$
DECLARE
    v_scale_weight NUMERIC := 10.0;
    v_eco_bonus NUMERIC := 0.0;
BEGIN
    IF p_scale = 'LARGE' THEN
        v_scale_weight := 50.0;
    ELSIF p_scale = 'MEDIUM' THEN
        v_scale_weight := 25.0;
    ELSE
        v_scale_weight := 10.0;
    END IF;

    IF p_is_eco_critical THEN
        v_eco_bonus := 30.0;
    END IF;

    RETURN ROUND(
        (v_scale_weight + (15.0 * LN(1.0 + GREATEST(p_confirmations, 1))) + v_eco_bonus)::NUMERIC,
        2
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;


-- -----------------------------------------------------------------------------------------
-- PASSO 4: MOTOR PRINCIPAL DE DEDUPLICAÇÃO ESPACIAL E VISUAL (RPC PARA O FRONT-END)
-- -----------------------------------------------------------------------------------------
-- Como o Front-end chama isso no Next.js?
-- const { data, error } = await supabase.rpc('fn_submit_citizen_report', { ...parametros });
-- -----------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_submit_citizen_report(
    p_tenant_slug VARCHAR DEFAULT 'piloto-universidade',
    p_lat DOUBLE PRECISION DEFAULT NULL,
    p_lng DOUBLE PRECISION DEFAULT NULL,
    p_accuracy_m NUMERIC DEFAULT 15.0,
    p_location_source VARCHAR DEFAULT 'BROWSER_GPS',
    p_reported_scale VARCHAR DEFAULT 'MEDIUM',
    p_waste_tags TEXT[] DEFAULT '{}',
    p_photo_url TEXT DEFAULT '',
    p_image_dhash VARCHAR(64) DEFAULT '0000000000000000000000000000000000000000000000000000000000000000',
    p_device_hash VARCHAR(64) DEFAULT 'anonymous',
    p_qr_code VARCHAR DEFAULT NULL,
    p_is_fresh BOOLEAN DEFAULT TRUE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tenant_id UUID;
    v_dedup_radius NUMERIC(5,2);
    v_qr_anchor_id UUID := NULL;
    v_qr_geom GEOMETRY(Point, 4326) := NULL;
    v_qr_address VARCHAR(255) := NULL;
    v_is_eco_critical BOOLEAN := FALSE;

    v_effective_point GEOMETRY(Point, 4326);
    v_effective_source VARCHAR(16) := p_location_source;
    v_effective_accuracy NUMERIC(6,2) := GREATEST(COALESCE(p_accuracy_m, 20.0), 3.0);
    v_point_weight NUMERIC(14,6);

    v_existing_cluster RECORD;
    v_existing_device_report UUID;
    v_visual_dup_photo_url TEXT := NULL;
    v_final_photo_url TEXT := p_photo_url;

    v_new_cluster_id UUID;
    v_protocol_code VARCHAR(24);
    v_new_weight_sum NUMERIC(14,6);
    v_new_lat DOUBLE PRECISION;
    v_new_lng DOUBLE PRECISION;
    v_new_scale VARCHAR(10);
    v_new_confirmations INTEGER;
    v_new_priority NUMERIC(8,2);
    v_dhash_bits BIT(64);
BEGIN
    -- 1. Localiza o Tenant (Município / Projeto Piloto)
    SELECT id, dedup_radius_meters
      INTO v_tenant_id, v_dedup_radius
      FROM public.tenants
     WHERE slug = p_tenant_slug
     LIMIT 1;

    IF v_tenant_id IS NULL THEN
        RAISE EXCEPTION 'Tenant slug "%" não encontrado na tabela tenants.', p_tenant_slug;
    END IF;

    -- 2. Verifica se o relato veio ancorado por uma Placa Física de QR Code
    IF p_qr_code IS NOT NULL AND LENGTH(TRIM(p_qr_code)) > 0 THEN
        SELECT id, location, address_hint, is_eco_critical
          INTO v_qr_anchor_id, v_qr_geom, v_qr_address, v_is_eco_critical
          FROM public.qr_anchors
         WHERE code = TRIM(p_qr_code)
           AND tenant_id = v_tenant_id
         LIMIT 1;
    END IF;

    -- 3. Fusão Inteligente de Coordenadas (Browser GPS vs. Placa QR Code)
    -- Se o GPS do celular falhou ou estava em Cold Start (> 35m) e temos placa QR, usamos a placa!
    IF (p_lat IS NULL OR p_lng IS NULL OR v_effective_accuracy > 35.0) AND v_qr_geom IS NOT NULL THEN
        v_effective_point := v_qr_geom;
        v_effective_source := 'QR_ANCHOR';
        v_effective_accuracy := 5.0; -- Placa física tem posição fixa homologada (erro ~5m)
    ELSIF p_lat IS NOT NULL AND p_lng IS NOT NULL THEN
        -- Atenção: No PostGIS, ST_MakePoint recebe (LONGITUDE, LATITUDE) nesta ordem!
        v_effective_point := ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326);
    ELSE
        RAISE EXCEPTION 'Coordenadas GPS ausentes e nenhuma âncora QR válida informada.';
    END IF;

    -- Verifica também se a tag 'CORREGO' foi enviada pelo Front-end
    IF 'CORREGO' = ANY(p_waste_tags) THEN
        v_is_eco_critical := TRUE;
    END IF;

    -- Peso estatístico da coordenada inversamente proporcional à variância do erro do GPS
    v_point_weight := 1.0 / (v_effective_accuracy * v_effective_accuracy);

    -- Converte a string de 64 caracteres ('0' e '1') para o tipo nativo BIT(64)
    v_dhash_bits := COALESCE(NULLIF(p_image_dhash, '')::BIT(64), B'0000000000000000000000000000000000000000000000000000000000000000');

    -- =====================================================================================
    -- 4. BUSCA DE DEDUPLICAÇÃO ESPACIAL (ST_DWithin em metros usando índice GIST)
    -- Procura se já existe um Hotspot ABERTO dentro do raio configurado (padrão: 25 metros)
    -- =====================================================================================
    SELECT *
      INTO v_existing_cluster
      FROM public.incident_clusters c
     WHERE c.tenant_id = v_tenant_id
       AND c.status IN ('OPEN', 'TRIAGED', 'IN_ROUTE')
       AND ST_DWithin(
           c.centroid_geom::geography,
           v_effective_point::geography,
           v_dedup_radius
       )
     ORDER BY ST_Distance(c.centroid_geom::geography, v_effective_point::geography) ASC
     LIMIT 1
     FOR UPDATE; -- Lock transacional para evitar condição de corrida em envios simultâneos

    -- =====================================================================================
    -- CENÁRIO A: JÁ EXISTE UM HOTSPOT ABERTO NESTE LOCAL (< 25m) -> UNIFICAR (MERGE)!
    -- =====================================================================================
    IF FOUND THEN
        -- A.1. Verifica se este mesmo celular já reportou neste Hotspot (Idempotência Anti-Spam)
        SELECT id INTO v_existing_device_report
          FROM public.citizen_reports
         WHERE cluster_id = v_existing_cluster.id
           AND anonymous_device_hash = p_device_hash
         LIMIT 1;

        IF v_existing_device_report IS NOT NULL THEN
            RETURN jsonb_build_object(
                'cluster_id', v_existing_cluster.id,
                'protocol_code', v_existing_cluster.protocol_code,
                'status', v_existing_cluster.status,
                'confirmations_count', v_existing_cluster.confirmations_count,
                'priority_score', v_existing_cluster.priority_score,
                'is_merged_into_existing', TRUE,
                'is_duplicate_device', TRUE,
                'message', 'Você já confirmou este ponto anteriormente! A equipe de limpeza já foi acionada.'
            );
        END IF;

        -- A.2. Deduplicação Visual por Distância de Hamming (dHash 64-bit <= 5 bits de diferença)
        -- Se alguém reenviou a mesma foto, reaproveitamos a URL original para economizar Storage!
        SELECT photo_webp_url INTO v_visual_dup_photo_url
          FROM public.citizen_reports r
         WHERE r.cluster_id = v_existing_cluster.id
           AND bit_count(r.image_dhash # v_dhash_bits) <= 5
         LIMIT 1;

        IF v_visual_dup_photo_url IS NOT NULL THEN
            v_final_photo_url := v_visual_dup_photo_url;
        END IF;

        -- A.3. Recalcula o Centroide Ponderado pela precisão do GPS (Location Fusion)
        v_new_weight_sum := v_existing_cluster.weight_sum + v_point_weight;
        v_new_lng := ((ST_X(v_existing_cluster.centroid_geom) * v_existing_cluster.weight_sum) + (ST_X(v_effective_point) * v_point_weight)) / v_new_weight_sum;
        v_new_lat := ((ST_Y(v_existing_cluster.centroid_geom) * v_existing_cluster.weight_sum) + (ST_Y(v_effective_point) * v_point_weight)) / v_new_weight_sum;

        -- A.4. Atualiza a escala dominante (adota o porte maior para não subdimensionar o caminhão)
        v_new_scale := v_existing_cluster.dominant_scale;
        IF p_reported_scale = 'LARGE' OR v_existing_cluster.dominant_scale = 'LARGE' THEN
            v_new_scale := 'LARGE';
        ELSIF p_reported_scale = 'MEDIUM' OR v_existing_cluster.dominant_scale = 'MEDIUM' THEN
            v_new_scale := 'MEDIUM';
        END IF;

        v_new_confirmations := v_existing_cluster.confirmations_count + 1;
        v_is_eco_critical := v_existing_cluster.is_eco_critical OR v_is_eco_critical;
        v_new_priority := public.fn_calculate_priority_score(v_new_scale, v_new_confirmations, v_is_eco_critical);

        -- A.5. Atualiza o Cluster existente
        UPDATE public.incident_clusters
           SET centroid_geom = ST_SetSRID(ST_MakePoint(v_new_lng, v_new_lat), 4326),
               weight_sum = v_new_weight_sum,
               dominant_scale = v_new_scale,
               confirmations_count = v_new_confirmations,
               priority_score = v_new_priority,
               is_eco_critical = v_is_eco_critical,
               last_reported_at = NOW()
         WHERE id = v_existing_cluster.id;

        -- A.6. Insere o relato individual vinculado ao Cluster pai
        INSERT INTO public.citizen_reports (
            cluster_id, qr_anchor_id, anonymous_device_hash, report_geom,
            gps_accuracy_m, location_source, reported_scale, photo_webp_url,
            image_dhash, is_fresh_capture
        ) VALUES (
            v_existing_cluster.id, v_qr_anchor_id, p_device_hash, v_effective_point,
            v_effective_accuracy, v_effective_source, p_reported_scale, v_final_photo_url,
            v_dhash_bits, p_is_fresh
        );

        RETURN jsonb_build_object(
            'cluster_id', v_existing_cluster.id,
            'protocol_code', v_existing_cluster.protocol_code,
            'status', v_existing_cluster.status,
            'confirmations_count', v_new_confirmations,
            'priority_score', v_new_priority,
            'is_merged_into_existing', TRUE,
            'is_duplicate_device', FALSE,
            'message', FORMAT('Relato unificado! %s moradores já confirmaram este foco.', v_new_confirmations)
        );

    -- =====================================================================================
    -- CENÁRIO B: NÃO HÁ HOTSPOT PRÓXIMO -> CRIAR UM NOVO CLUSTER (CHAMADO ÚNICO)
    -- =====================================================================================
    ELSE
        v_protocol_code := 'ECO-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('seq_eco_protocol')::TEXT, 4, '0');
        v_new_priority := public.fn_calculate_priority_score(p_reported_scale, 1, v_is_eco_critical);

        INSERT INTO public.incident_clusters (
            tenant_id, protocol_code, centroid_geom, weight_sum,
            status, dominant_scale, waste_tags, confirmations_count,
            priority_score, is_eco_critical, address_reference, sample_photo_url
        ) VALUES (
            v_tenant_id, v_protocol_code, v_effective_point, v_point_weight,
            'OPEN', p_reported_scale, COALESCE(p_waste_tags, '{}'), 1,
            v_new_priority, v_is_eco_critical, v_qr_address, v_final_photo_url
        )
        RETURNING id INTO v_new_cluster_id;

        INSERT INTO public.citizen_reports (
            cluster_id, qr_anchor_id, anonymous_device_hash, report_geom,
            gps_accuracy_m, location_source, reported_scale, photo_webp_url,
            image_dhash, is_fresh_capture
        ) VALUES (
            v_new_cluster_id, v_qr_anchor_id, p_device_hash, v_effective_point,
            v_effective_accuracy, v_effective_source, p_reported_scale, v_final_photo_url,
            v_dhash_bits, p_is_fresh
        );

        RETURN jsonb_build_object(
            'cluster_id', v_new_cluster_id,
            'protocol_code', v_protocol_code,
            'status', 'OPEN',
            'confirmations_count', 1,
            'priority_score', v_new_priority,
            'is_merged_into_existing', FALSE,
            'is_duplicate_device', FALSE,
            'message', 'Novo foco de descarte mapeado com sucesso!'
        );
    END IF;
END;
$$;


-- -----------------------------------------------------------------------------------------
-- PASSO 5: FUNÇÃO GERADORA DE GEOJSON PARA O MAPA DO GESTOR (MapLibre GL JS)
-- -----------------------------------------------------------------------------------------
-- Como o Front-end chama isso no painel /admin?
-- const { data } = await supabase.rpc('fn_get_active_hotspots_geojson', { p_tenant_slug: 'piloto-universidade' });
-- -----------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_get_active_hotspots_geojson(
    p_tenant_slug VARCHAR DEFAULT 'piloto-universidade',
    p_include_cleaned BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT jsonb_build_object(
        'type', 'FeatureCollection',
        'features', COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'type', 'Feature',
                    'geometry', ST_AsGeoJSON(c.centroid_geom)::jsonb,
                    'properties', jsonb_build_object(
                        'cluster_id', c.id,
                        'protocol_code', c.protocol_code,
                        'status', c.status,
                        'dominant_scale', c.dominant_scale,
                        'waste_tags', c.waste_tags,
                        'confirmations_count', c.confirmations_count,
                        'priority_score', c.priority_score,
                        'is_eco_critical', c.is_eco_critical,
                        'address_reference', c.address_reference,
                        'sample_photo_url', c.sample_photo_url,
                        'cleaned_photo_url', c.cleaned_photo_url,
                        'first_reported_at', c.first_reported_at,
                        'last_reported_at', c.last_reported_at,
                        'cleaned_at', c.cleaned_at
                    )
                )
                ORDER BY c.priority_score DESC
            ),
            '[]'::jsonb
        )
    )
    FROM public.incident_clusters c
    JOIN public.tenants t ON t.id = c.tenant_id
    WHERE t.slug = p_tenant_slug
      AND (
          c.status IN ('OPEN', 'TRIAGED', 'IN_ROUTE')
          OR (p_include_cleaned = TRUE AND c.status = 'CLEANED')
      );
$$;


-- -----------------------------------------------------------------------------------------
-- PASSO 6: FUNÇÃO DE BAIXA "LOCAL LIMPO" (ACIONA O LOOP DE FEEDBACK CIDADÃO)
-- -----------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_resolve_cluster_clean(
    p_cluster_id UUID,
    p_cleaned_photo_url TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_protocol VARCHAR(24);
    v_subs JSONB;
BEGIN
    UPDATE public.incident_clusters
       SET status = 'CLEANED',
           cleaned_photo_url = p_cleaned_photo_url,
           cleaned_at = NOW()
     WHERE id = p_cluster_id
     RETURNING protocol_code INTO v_protocol;

    IF v_protocol IS NULL THEN
        RAISE EXCEPTION 'Cluster % não encontrado.', p_cluster_id;
    END IF;

    -- Retorna todas as inscrições Web Push pendentes daquele Cluster para disparo da notificação
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'subscription_id', s.id,
                'endpoint', s.endpoint,
                'p256dh_key', s.p256dh_key,
                'auth_key', s.auth_key
            )
        ),
        '[]'::jsonb
    )
    INTO v_subs
    FROM public.push_subscriptions s
    WHERE s.cluster_id = p_cluster_id
      AND s.notified_at IS NULL;

    -- Marca como notificados
    UPDATE public.push_subscriptions
       SET notified_at = NOW()
     WHERE cluster_id = p_cluster_id
       AND notified_at IS NULL;

    RETURN jsonb_build_object(
        'cluster_id', p_cluster_id,
        'protocol_code', v_protocol,
        'status', 'CLEANED',
        'pending_push_subscriptions', v_subs
    );
END;
$$;


-- -----------------------------------------------------------------------------------------
-- PASSO 7: POLÍTICAS DE SEGURANÇA (ROW LEVEL SECURITY - RLS) E PERMISSÕES
-- -----------------------------------------------------------------------------------------
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_anchors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.citizen_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Leitura pública para o PWA e Mapa
DROP POLICY IF EXISTS "Leitura publica tenants" ON public.tenants;
CREATE POLICY "Leitura publica tenants" ON public.tenants FOR SELECT USING (true);

DROP POLICY IF EXISTS "Leitura publica qr_anchors" ON public.qr_anchors;
CREATE POLICY "Leitura publica qr_anchors" ON public.qr_anchors FOR SELECT USING (true);

DROP POLICY IF EXISTS "Leitura publica clusters" ON public.incident_clusters;
CREATE POLICY "Leitura publica clusters" ON public.incident_clusters FOR SELECT USING (true);

DROP POLICY IF EXISTS "Leitura publica reports" ON public.citizen_reports;
CREATE POLICY "Leitura publica reports" ON public.citizen_reports FOR SELECT USING (true);

-- Permissão para o Cidadão (role anon) se inscrever no alerta Web Push ("Me avise quando limpar")
DROP POLICY IF EXISTS "Insercao anonima push_subscriptions" ON public.push_subscriptions;
CREATE POLICY "Insercao anonima push_subscriptions" ON public.push_subscriptions
    FOR INSERT WITH CHECK (true);

-- Libera a execução das 3 funções RPC para o Front-end (anon e authenticated)
GRANT EXECUTE ON FUNCTION public.fn_submit_citizen_report TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_get_active_hotspots_geojson TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_resolve_cluster_clean TO anon, authenticated;


-- -----------------------------------------------------------------------------------------
-- PASSO 8: DADOS INICIAIS DE TESTE (SEED) — PRONTO PARA TESTAR O MAPA E A DEDUPLICAÇÃO!
-- -----------------------------------------------------------------------------------------
INSERT INTO public.tenants (name, slug, dedup_radius_meters)
VALUES ('Projeto Piloto - Ciência Cidadã Ambiental', 'piloto-universidade', 25.00)
ON CONFLICT (slug) DO NOTHING;

-- Cria 2 placas físicas de QR Code para teste
INSERT INTO public.qr_anchors (tenant_id, code, location, address_hint, is_eco_critical)
SELECT
    id,
    'QR-CORREGO-01',
    ST_SetSRID(ST_MakePoint(-46.633308, -23.550520), 4326),
    'Margem do Córrego Urbano - Ponto Crítico 01',
    TRUE
FROM public.tenants WHERE slug = 'piloto-universidade'
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.qr_anchors (tenant_id, code, location, address_hint, is_eco_critical)
SELECT
    id,
    'QR-PRACA-02',
    ST_SetSRID(ST_MakePoint(-46.635100, -23.552100), 4326),
    'Esquina da Praça Central - Ponto de Descarte de Volumosos',
    FALSE
FROM public.tenants WHERE slug = 'piloto-universidade'
ON CONFLICT (code) DO NOTHING;

COMMIT;

-- =========================================================================================
-- 🧪 COMO TESTAR SE A DEDUPLICAÇÃO ESTÁ FUNCIONANDO (RODE NO SQL EDITOR APÓS O SCRIPT):
-- =========================================================================================
-- Teste 1: Simula o Cidadão 1 reportando um monte de entulho na coordenada (-23.550520, -46.633308)
-- SELECT public.fn_submit_citizen_report(
--     'piloto-universidade', -23.550520, -46.633308, 8.0, 'BROWSER_GPS',
--     'LARGE', ARRAY['ENTULHO', 'CORREGO'], 'https://exemplo.com/foto1.webp',
--     '1010101010101010101010101010101010101010101010101010101010101010', 'hash_celular_cidadao_1', 'QR-CORREGO-01', TRUE
-- );
--
-- Teste 2: Simula o Cidadão 2 a apenas ~6 metros de distância (-23.550550, -46.633330)
-- Você verá que ele NÃO cria um chamado duplicado! Ele retorna "is_merged_into_existing": true
-- e sobe "confirmations_count" para 2!
-- SELECT public.fn_submit_citizen_report(
--     'piloto-universidade', -23.550550, -46.633330, 5.0, 'BROWSER_GPS',
--     'LARGE', ARRAY['ENTULHO'], 'https://exemplo.com/foto2.webp',
--     '0101010101010101010101010101010101010101010101010101010101010101', 'hash_celular_cidadao_2', NULL, TRUE
-- );
-- =========================================================================================
