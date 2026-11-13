-- =========================================================================================
-- PROJETO: ECOCIDADÃO (DESAFIO 09) - POLÍTICAS DE RLS PARA O SUPABASE STORAGE
-- ARQUIVO: database/storage_policies.sql
-- =========================================================================================
--
-- O QUE ESTE SCRIPT FAZ:
-- Libera o envio (INSERT) anônimo e a visualização pública (SELECT) de fotos nos buckets:
--   - 'reports-webp' (fotos dos descartes enviadas pelo cidadão)
--   - 'cleaned-photos' (fotos de comprovação de limpeza enviadas pela prefeitura)
--
-- COMO EXECUTAR:
-- Basta colar no SQL Editor do Supabase e clicar em "Run".
-- =========================================================================================

BEGIN;

-- 1. Garante que qualquer pessoa possa visualizar fotos públicas nos dois buckets
DROP POLICY IF EXISTS "Leitura publica de fotos storage" ON storage.objects;
CREATE POLICY "Leitura publica de fotos storage"
    ON storage.objects
    FOR SELECT
    USING (bucket_id IN ('reports-webp', 'cleaned-photos'));

-- 2. Permite que o cidadão anônimo (anon) e autenticado façam upload no bucket reports-webp
DROP POLICY IF EXISTS "Upload anonimo de relatos" ON storage.objects;
CREATE POLICY "Upload anonimo de relatos"
    ON storage.objects
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (bucket_id = 'reports-webp');

-- 3. Permite upload de fotos de limpeza
DROP POLICY IF EXISTS "Upload de fotos limpas" ON storage.objects;
CREATE POLICY "Upload de fotos limpas"
    ON storage.objects
    FOR INSERT
    TO anon, authenticated, service_role
    WITH CHECK (bucket_id = 'cleaned-photos');

COMMIT;
