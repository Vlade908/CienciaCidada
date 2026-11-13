# 🌍 EcoCidadão — Monitoramento Colaborativo de Descarte Irregular de Resíduos

> **Desafio 09 — Ciência Cidadã e Dados Ambientais (Análise e Desenvolvimento de Sistemas — Empreendedorismo)**
> **Equipe:** Enzo Alves dos Santos Souza & Clayver Alexssander

---

## 📌 Visão Executiva do Projeto

> **"Transformar a indignação do cidadão em um dado geoespacial instantaneamente acionável."**

O **EcoCidadão** é uma plataforma **Mobile-First (PWA)** de Ciência Cidadã e Zeladoria Urbana Inteligente criada para eliminar a tensão histórica entre **facilitar a participação popular** e **garantir dados estruturados, geolocalizados e sem duplicidade** para o poder público (Secretarias de Obras/Meio Ambiente — **B2G**) e concessionárias de coleta (**B2B**).

### Por que as soluções atuais falham?
1. **Canais Oficiais (Ouvidorias / 156):** Exigem cadastros burocráticos (CPF, senha, endereço completo digitado manualmente), levando mais de 5 minutos. O cidadão desiste após **30 segundos**.
2. **Redes Sociais (WhatsApp / Facebook):** Os moradores tiram fotos rapidamente, mas **o WhatsApp destrói os metadados EXIF de GPS** ao comprimir a imagem e gera dezenas de mensagens repetidas sobre o mesmo entulho, inviabilizando a triagem da prefeitura.

### A Nossa Solução: "Inversão de Esforço" + Deduplicação Espacial PostGIS
- **Para o Cidadão (Marcos):** Denúncia 100% anônima em **menos de 3 toques e < 15 segundos** direto pelo navegador do celular (sem baixar app em loja), com feedback visual de calibração de satélites GPS e notificação assíncrona no celular quando o **local for limpo**.
- **Para a Gestora Pública (Juliana):** Algoritmos espaciais (`PostGIS ST_DWithin` + `dHash` perceptual de 64 bits $\rightarrow$ `Uber H3` + `ST-DBSCAN`) fundem automaticamente dezenas de fotos do mesmo monte de entulho em **um único Hotspot priorizado**, dimensionado por porte de caminhão (`Pequeno`, `Médio`, `Grande`).

---

## 🗂️ Índice da Documentação Técnica e Estratégica

Toda a especificação foi construída aplicando metodologias de arquitetura de software, produto e UX/UI Mobile-First, separando claramente a **Arquitetura 100% Gratuita do MVP (R$ 0/mês)** da **Arquitetura de Escala Comercial B2B/B2G (AWS/GCP)**:

| Documento / Artefato | Conteúdo Principal | Responsável Direto |
| :--- | :--- | :--- |
| 📄 **[Entregável 1: Concepção, Funcionalidades e UX Mobile-First](file:///home/inovia-g15/Documentos/projetos/GitHub/ProjetoEmpreendedorismo/docs/01-concepcao-ux-mobile-first.md)** | Inversão de Esforço em 3 toques na *Thumb Zone*, Índice MFRI, **UX e código React para Cold Start do GPS (`<GpsStatusPill />`)**, processamento Edge/Client-side (`WebP ~140KB` + `dHash` + remoção de PII/LGPD) e fluxo "Local Limpo". | **Front-end Lead (Next.js / React)** |
| 🏗️ **[Entregável 2: Arquitetura Free $\rightarrow$ Paid e Engenharia de Dados](file:///home/inovia-g15/Documentos/projetos/GitHub/ProjetoEmpreendedorismo/docs/02-arquitetura-free-to-paid-e-dados.md)** | Stack Custo Zero (Vercel + Supabase PostGIS + MapLibre/OSM + Web Push VAPID) vs. Escala Paga (AWS/GCP), segurança LGPD e equações matemáticas do motor de deduplicação espacial e visual. | **Arquitetura & Dados** |
| 🚀 **[Entregável 3: Do MVP Custo Zero ao Produto Maduro](file:///home/inovia-g15/Documentos/projetos/GitHub/ProjetoEmpreendedorismo/docs/03-mvp-custo-zero-ao-produto-maduro.md)** | Matriz RICE e MoSCoW do MVP gratuito, protocolo científico verificável (Ficha de Desafio 09) e evolução para **IA de cubagem ($\text{m}^3$)**, **Roteirização de Frota (OR-Tools CVRP)** e **API White-Label 156**. | **Product Management** |
| 🗺️ **[Entregável 4: Roadmap Ágil, Divisão da Dupla, APIs e Schema](file:///home/inovia-g15/Documentos/projetos/GitHub/ProjetoEmpreendedorismo/docs/04-roadmap-functions-e-banco-dados.md)** | Cronograma de 4 Sprints para o MVP, divisão clara entre Front-end e Back-end, contratos JSON das RPCs, Diagrama ER e passo a passo de configuração no Supabase. | **Front-end & Back-end** |
| 🐘 **[Script SQL Executável: `database/schema_mvp_postgis.sql`](file:///home/inovia-g15/Documentos/projetos/GitHub/ProjetoEmpreendedorismo/database/schema_mvp_postgis.sql)** | Script DDL + Stored Procedures `PL/pgSQL` amplamente comentado e pronto para colar no **Supabase SQL Editor**, incluindo índices espaciais `GIST`, políticas RLS e dados de Seed. | **Back-end Lead (Supabase / SQL)** |
| 🧠 **[Arquivos de Gestão: `task_plan.md`](file:///home/inovia-g15/Documentos/projetos/GitHub/ProjetoEmpreendedorismo/task_plan.md) · [`findings.md`](file:///home/inovia-g15/Documentos/projetos/GitHub/ProjetoEmpreendedorismo/findings.md) · [`progress.md`](file:///home/inovia-g15/Documentos/projetos/GitHub/ProjetoEmpreendedorismo/progress.md)** | Memória persistente do projeto (`planning-with-files`), síntese das entrevistas de validação e registro de decisões arquiteturais. | **Toda a Equipe** |

---

## 📊 Business Model Canvas Integrado à Arquitetura

| Bloco do Canvas | Definição Estratégica Validada | Reflexo Direto na Arquitetura Técnica |
| :--- | :--- | :--- |
| **1. Segmentos de Clientes** | **Usuários:** Moradores urbanos e coletivos de bairro.<br/>**Pagadores:** Secretarias de Obras/Meio Ambiente (B2G) e Concessionárias (B2B). | Interface Cidadã ultraleve (PWA) separada do Dashboard Multi-Tenant de Gestão e Roteirização (`tenant_id`). |
| **2. Proposta de Valor** | **Cidadão:** Denúncia anônima em 3 toques sem cadastro.<br/>**B2G/B2B:** Fim dos chamados duplicados e roteirização otimizada de frota. | Câmera *Zero-Login* + Stored Procedure PostGIS `fn_submit_citizen_report` unificando relatos num raio de `25m`. |
| **3. Canais** | QR Codes físicos instalados nos pontos crônicos; PWA direto no navegador mobile; vendas diretas B2B/B2G e editais/CPSI. | Tabela `qr_anchors` que injeta coordenada homologada via query string (`?qr=QR-CORREGO-01`) como fallback de GPS. |
| **4. Relacionamento** | Notificações de **"Local Limpo"** (Antes/Depois) para cidadãos; relatórios executivos de ROI e Customer Success para gestores. | Tabela `push_subscriptions` (protocolo W3C VAPID gratuito) disparada pela RPC `fn_resolve_cluster_clean`. |
| **5. Fontes de Receita** | Assinatura SaaS mensal escalonada pelo tamanho da frota + Setup e volume de requisições na API White-Label. | Rate-limiting e telemetria de uso por `tenant_id` no API Gateway. |
| **6. Recursos-Chave** | Metodologia de UX de "Inversão de Esforço", algoritmo proprietário de deduplicação espacial/visual e infraestrutura Cloud. | Código Front-end (Web Worker + GPS Hook) e motor espacial PostGIS/H3. |
| **7. Atividades-Chave** | Calibração de clusterização espacial e detecção de pontos viciados; ciclo consultivo de vendas B2G. | Job analítico `ST_ClusterDBSCAN` para mapear reincidência de descarte crônico. |
| **8. Parcerias-Chave** | Hubs de inovação e universidades (validação científica e dados abertos); lideranças comunitárias e associações de bairro. | Endpoint de exportação `GeoJSON` padronizado para pesquisa acadêmica sem expor dados pessoais (LGPD). |
| **9. Estrutura de Custos** | **MVP:** **R$ 0,00** (100% Free Tier + Compressão Client-Side WebP 140KB).<br/>**Escala:** Storage de alta resolução, GPUs de IA, APIs de tráfego e vendas B2G. | Compressão na borda (celular) economiza 97% de storage no MVP; arquitetura pronta para migrar para AWS/GCP quando faturar. |
