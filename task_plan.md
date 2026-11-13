# Task Plan: Mapeamento Colaborativo de Descarte Irregular de Resíduos (Desafio 09)

> **Metodologia:** `planning-with-files` & `plan-writing`
> **Equipe:** Enzo Alves dos Santos Souza & Clayver Alexssander
> **Objetivo:** Materializar a documentação estratégica, arquitetural, de UX Mobile-First (Front-end Next.js/React) e de Engenharia de Dados Geoespaciais (Back-end Supabase PostGIS) com estratégia **MVP 100% Gratuito (Free Tier) $\rightarrow$ Escala B2B/B2G Paga (AWS/GCP)**.

---

## 📋 Fases de Execução e Status

- [x] **Fase 0: Alinhamento e Planejamento Arquitetural (`/plan`)**
  - Leitura da Ficha de Desafio 09, Pitch Deck da equipe e Business Model Canvas.
  - Acionamento das skills (`product-manager-toolkit`, `mobile-design`, `ux-flow`, `senior-architect`, `database`, `api-patterns`, `gdpr-data-handling`, `plan-writing`, `planning-with-files`).
  - Aprovação do `implementation_plan.md` pelo usuário.

- [x] **Fase 1: Inicialização dos Arquivos de Memória (`planning-with-files`)**
  - Criados `task_plan.md`, `findings.md` e `progress.md` na raiz do repositório.

- [x] **Fase 2: Entregável 1 — Concepção, Funcionalidades e UX Mobile-First (`docs/01-concepcao-ux-mobile-first.md`)**
  - Documentada a "Inversão de Esforço" em 3 toques na *Thumb Zone* (`mobile-design` + `ux-flow`).
  - **Diretriz Especial Front-end:** Documentado e implementado o estado de **Cold Start do GPS (`Geolocation API`)** com feedback visual não-bloqueante (*"🛰️ Buscando satélites..."* $\rightarrow$ *"📍 GPS Preciso (±6m)"*), incluindo código completo em React/TypeScript (`useHighAccuracyGps.ts` + `<GpsStatusPill />`).

- [x] **Fase 3: Entregável 2 — Arquitetura de Software e Engenharia de Dados Free $\rightarrow$ Paid (`docs/02-arquitetura-free-to-paid-e-dados.md`)**
  - Definida a stack 100% gratuita do MVP (Vercel + Supabase PostGIS + Storage 1GB + MapLibre/OSM + Web Push VAPID) vs. Escala Enterprise (AWS/GCP).
  - Explicado o algoritmo de deduplicação espacial e visual (`ST_DWithin` 25m + `dHash` 64-bit no MVP $\rightarrow$ `Uber H3` + `ST-DBSCAN` + `CLIP/YOLO` na escala).

- [x] **Fase 4: Entregável 3 — Do MVP Custo Zero ao Produto Maduro (`docs/03-mvp-custo-zero-ao-produto-maduro.md`)**
  - Priorização MoSCoW e RICE (`product-manager-toolkit`), protocolo científico (Ficha de Desafio 09) e evolução para IA de volumetria ($\text{m}^3$), Roteirização de Frota (CVRP com OR-Tools) e API White-Label 156.

- [x] **Fase 5: Entregável 4 & Script SQL — Roadmap, Divisão de Tarefas, APIs e Schema PostGIS (`docs/04-roadmap-functions-e-banco-dados.md` & `database/schema_mvp_postgis.sql`)**
  - **Diretriz Especial Back-end:** Criado `database/schema_mvp_postgis.sql` amplamente comentado passo a passo, pronto para o colega de equipe colar e rodar no **Supabase SQL Editor**, incluindo dados de seed e script de teste da deduplicação.
  - Documentada a divisão clara de trabalho entre **Front-end (Next.js/PWA)** e **Back-end (Supabase/PostGIS/Edge Functions)**.

- [x] **Fase 6: Portal Principal do Repositório (`README.md`) & Verificação Final**
  - Consolidado o `README.md` executivo na raiz com índice navegável, Canvas e guia rápido para a dupla.

---

## 🛠️ Decisões Técnicas Registradas

| Decisão | Escolha Técnica | Justificativa |
| :--- | :--- | :--- |
| **Interface Cidadão** | PWA Mobile-First (Next.js + React) | Zero fricção de loja de aplicativos; acesso imediato via QR Code físico na rua. |
| **UX do Cold Start de GPS** | Badge progressivo não-bloqueante + Web Worker | Evita que o usuário ache que a câmera travou enquanto o GPS converge para $<10\text{m}$. |
| **Storage no MVP ($0)** | Compressão Client-Side WebP (~140KB) | Multiplica a capacidade do Supabase Free (1GB) de ~200 fotos brutas para >7.100 fotos. |
| **Motor de Deduplicação MVP** | Stored Procedure `PL/pgSQL` + PostGIS `ST_DWithin` | Executa em $<15\text{ms}$ dentro do banco gratuito sem precisar pagar servidor de background. |
| **Mapas no MVP ($0)** | MapLibre GL JS + OpenStreetMap Tiles | Elimina cobrança por requisição e exigência de cartão de crédito da API do Google Maps. |
