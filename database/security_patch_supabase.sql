-- =========================================================================================
-- PROJETO: ECOCIDADÃO (DESAFIO 09) - PATCH DE SEGURANÇA E HARDENING (SUPABASE LINTER)
-- ARQUIVO: database/security_patch_supabase.sql
-- ALVO:    Supabase Security Advisor (PostgreSQL 15+ / PostGIS)
-- =========================================================================================
--
-- NOTA SOBRE O ERRO "must be owner of table spatial_ref_sys":
-- A tabela spatial_ref_sys pertence ao usuário interno do sistema (supabase_admin)
-- por ter sido criada pela extensão PostGIS. Usuários do painel (postgres) não têm
-- permissão de alterar o RLS dela diretamente.
--
-- De acordo com a documentação oficial do Supabase, o aviso de RLS na spatial_ref_sys
-- é um "Falso Positivo" conhecido e esperado da extensão PostGIS.
-- Portanto, removemos o ALTER TABLE spatial_ref_sys deste script.
-- =========================================================================================

BEGIN;

-- =========================================================================================
-- 1. CORREÇÃO: "Function Search Path Mutable"
-- Trava o search_path em 'public, pg_temp' para mitigar sequestro de schemas temporários.
-- =========================================================================================

ALTER FUNCTION public.fn_calculate_priority_score(VARCHAR, INTEGER, BOOLEAN)
    SET search_path = public, pg_temp;

ALTER FUNCTION public.fn_submit_citizen_report(
    VARCHAR, DOUBLE PRECISION, DOUBLE PRECISION, NUMERIC, VARCHAR,
    VARCHAR, TEXT[], TEXT, VARCHAR, VARCHAR, VARCHAR, BOOLEAN
)
    SET search_path = public, pg_temp;

ALTER FUNCTION public.fn_get_active_hotspots_geojson(VARCHAR, BOOLEAN)
    SET search_path = public, pg_temp;

ALTER FUNCTION public.fn_resolve_cluster_clean(UUID, TEXT)
    SET search_path = public, pg_temp;


-- =========================================================================================
-- 2. CORREÇÃO: "Public Can Execute SECURITY DEFINER Function"
-- Revoga do grupo genérico PUBLIC e concede exclusivamente às roles da API do Supabase.
-- =========================================================================================

REVOKE EXECUTE ON FUNCTION public.fn_calculate_priority_score(VARCHAR, INTEGER, BOOLEAN) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.fn_submit_citizen_report(
    VARCHAR, DOUBLE PRECISION, DOUBLE PRECISION, NUMERIC, VARCHAR,
    VARCHAR, TEXT[], TEXT, VARCHAR, VARCHAR, VARCHAR, BOOLEAN
) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.fn_get_active_hotspots_geojson(VARCHAR, BOOLEAN) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.fn_resolve_cluster_clean(UUID, TEXT) FROM PUBLIC;

-- Roles de acesso da aplicação
GRANT EXECUTE ON FUNCTION public.fn_calculate_priority_score(VARCHAR, INTEGER, BOOLEAN) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_submit_citizen_report(
    VARCHAR, DOUBLE PRECISION, DOUBLE PRECISION, NUMERIC, VARCHAR,
    VARCHAR, TEXT[], TEXT, VARCHAR, VARCHAR, VARCHAR, BOOLEAN
) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_get_active_hotspots_geojson(VARCHAR, BOOLEAN) TO anon, authenticated;

-- Função restrita apenas a usuários logados (gestores) e à chave de serviço privada
GRANT EXECUTE ON FUNCTION public.fn_resolve_cluster_clean(UUID, TEXT) TO authenticated, service_role;


-- =========================================================================================
-- 3. CORREÇÃO: "RLS Policy Always True on push_subscriptions"
-- Valida dados obrigatórios no INSERT e bloqueia leitura (SELECT) de outros cidadãos.
-- =========================================================================================

DROP POLICY IF EXISTS "Insercao anonima push_subscriptions" ON public.push_subscriptions;

CREATE POLICY "Insercao segura push_subscriptions"
    ON public.push_subscriptions
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (
        endpoint IS NOT NULL AND LENGTH(TRIM(endpoint)) > 10 AND
        p256dh_key IS NOT NULL AND LENGTH(TRIM(p256dh_key)) > 0 AND
        auth_key IS NOT NULL AND LENGTH(TRIM(auth_key)) > 0 AND
        cluster_id IS NOT NULL
    );

DROP POLICY IF EXISTS "Leitura exclusiva servico push_subscriptions" ON public.push_subscriptions;
CREATE POLICY "Leitura exclusiva servico push_subscriptions"
    ON public.push_subscriptions
    FOR SELECT
    TO service_role
    USING (true);

COMMIT;
