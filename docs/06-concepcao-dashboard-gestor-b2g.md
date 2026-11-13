# Concepção, UX e Arquitetura: Dashboard Gestor B2G/B2B (EcoCidadão)

> **Documento de Especificação de Produto & Engenharia de UX**  
> **Branch de Desenvolvimento:** `staging`  
> **Público-Alvo:** Gestores Municipais (Prefeituras/156) e Coordenadores de Concessionárias de Limpeza Urbana  
> **Modo de Design (`impeccable`):** *Operate* (Produtividade intensiva, alta densidade informacional, mapas imersivos, baixa carga cognitiva)  
> **Custo de Operação:** 100% Gratuito (MapLibre GL + OSM Tiles + Supabase PostGIS RPC + Vercel)

---

## 1. Visão de Produto & Escopo do MVP (`product-manager-toolkit`)

### 1.1. O Problema B2G/B2B Validado
Nas prefeituras e concessionárias de limpeza urbana, o canal 156 tradicional sofre com dois extremos críticos:
1. **Inundação de Chamados Duplicados:** O mesmo sofá abandonado na calçada gera 15 ligações e 15 chamados avulsos no sistema, fazendo com que 3 equipes diferentes sejam despachadas para o mesmo endereço ao longo da semana.
2. **Cegueira Espacial:** As denúncias chegam em texto corrido ("*Rua das Flores perto da padaria*"), impossibilitando o roteamento eficiente de caminhões de caçamba e retroescavadeiras.

### 1.2. A Proposta de Valor do Dashboard EcoCidadão
O Dashboard Gestor é a **central de comando e inteligência geoespacial** da prefeitura. Sua missão primária é transformar o caos dos relatos populares em ordens de serviço unificadas e priorizadas.

```
┌──────────────────────────────────────────────────────────┐
│      "DE 120 RELATOS POPULARES A 8 PONTOS CRÍTICOS"      │
│      Taxa de Deduplicação Geoespacial no MVP: > 85%      │
│   Economia direta em deslocamentos de caminhões caçamba  │
└──────────────────────────────────────────────────────────┘
```

### 1.3. Matriz de Escopo (O que entra no MVP vs. O que fica para Escala Paga)

| Funcionalidade | Escopo MVP (Branch `staging`) | Escala Paga Enterprise (Roadmap) |
| :--- | :---: | :---: |
| **Mapa Interativo** | MapLibre GL + OpenStreetMap (R$ 0,00) | Mapbox HD / Google Maps Satellite 3D |
| **Deduplicação Visualizada** | Exibição da métrica: *"X cidadãos relataram este foco"* | Análise temporal com gráfico de reincidência |
| **Filtros e Triagem** | Ordenação por `priority_score`, filtros por Escala (P/M/G) | Filtros por bairro, zona eleitoral e bacia hidrográfica |
| **Resolução de Ponto** | Upload de foto do local limpo + fechamento via `fn_resolve_cluster_clean` | Assinatura digital do motorista do caminhão |
| **Despacho de Equipe** | Impressão de ficha de serviço / Compartilhamento de rota | Roteirização dinâmica de frota (Google OR-Tools CVRP) |
| **Integração 156** | Exportação CSV/GeoJSON dos focos filtrados | Webhook bidirecional REST com API municipal |

---

## 2. Jornada do Usuário & Fluxos de Uso (`ux-flow`)

O operador do sistema atua sob o padrão de navegação **Hub & Spoke** (Centro de Controle $\leftrightarrow$ Detalhes do Ponto).

```
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                           1. TELA PRINCIPAL (/admin)                        │
 │                                                                             │
 │  ┌───────────────────────────────────┐ ┌─────────────────────────────────┐  │
 │  │      PAINEL LATERAL (TRIAGEM)     │ │        MAPA GEOESPACIAL         │  │
 │  │                                   │ │                                 │  │
 │  │  [KPIs: 18 Focos | 84 Relatos]    │ │    (Hotspots com cores de calor)│  │
 │  │  [Filtros: Alta Prioridade | M/G] │ │                                 │  │
 │  │                                   │ │          🔴 Foco #01 (Score 92) │  │
 │  │  Card 1: Rua dos Ipês (9 relatos) │ │          🟡 Foco #02 (Score 61) │  │
 │  │  Card 2: Córrego Limpo (6 relatos)│ │          🟢 Foco #03 (Score 35) │  │
 │  └───────────────────────────────────┘ └─────────────────────────────────┘  │
 └──────────────────────┬──────────────────────────────────────────────────────┘
                        │ (Clique no Card ou no Marcador do Mapa)
                        ▼
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                 2. GAVETA DE INSPEÇÃO TÉCNICA (DRAWER)                      │
 │                                                                             │
 │  - Protocolo: ECO-2026-0004 | Status: ABERTO                                │
 │  - Score de Prioridade: 92/100 (⚠️ Risco Hídrico + Entulho Grande)         │
 │  - Deduplicação: 9 cidadãos unificados em raio de 18 metros                │
 │  - Galeria de Fotos recebidas dos cidadãos com timestamps                   │
 │                                                                             │
 │               [ BOTAO DE AÇÃO: 'MARCAR COMO LIMPO' ]                        │
 └──────────────────────┬──────────────────────────────────────────────────────┘
                        │ (Clique para registrar limpeza)
                        ▼
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                 3. MODAL DE FINALIZAÇÃO E COMPROVAÇÃO                       │
 │                                                                             │
 │  - Upload da foto do local limpo (comprova o serviço realizado)             │
 │  - Destino dos resíduos (ex: 'Ecoponto Central - 6m³')                      │
 │  - Ação: Executa `fn_resolve_cluster_clean`                                 │
 │  - Resultado: Foco muda para 'RESOLVIDO' e Web Push é disparado aos cidadãos│
 └─────────────────────────────────────────────────────────────────────────────┘
```

### Regras Ergonômicas do Fluxo:
1. **Regra dos 2 Cliques:** O gestor nunca deve dar mais de 2 cliques para acessar todas as fotos e detalhes técnicos de qualquer foco irregular da cidade.
2. **Sincronia Bidirecional (Mapa $\leftrightarrow$ Lista):**
   - Ao passar o mouse (*hover*) em um card da lista, o pino correspondente no mapa pulsa e se destaca.
   - Ao clicar em um pino no mapa, a lista rola automaticamente para o card correspondente e abre a gaveta de detalhes.
3. **Prevenção de Erros de Baixa:** O botão de "Marcar como Limpo" exige obrigatoriamente a foto do local limpo como evidência de governança (evita fraudes de fechamento indevido).

---

## 3. Identidade Visual & Diretrizes de UI (`impeccable`)

Seguindo o modo **Operate**, a interface adota a estética **"SaaS Enterprise Utilitário"**:

### 3.1. Paleta de Cores e Semântica de Alta Prioridade
- **Superfície / Background:** `zinc-950` (modo escuro de alto contraste) e `zinc-900` (painéis secundários), reduzindo a fadiga visual em turnos de monitoramento de 8 horas.
- **Tipografia:** Fonte sem serifa com números tabulares (`font-mono` para contadores, coordenadas e scores) garantindo alinhamento perfeito de colunas numéricas.
- **Gradiente Térmico de Gravidade:**
  - 🔴 **Crítico (`priority_score >= 75`):** `#EF4444` (Red-500) — Entulho em córregos, carcaças ou focos com $>5$ confirmações.
  - 🟡 **Médio (`priority_score 40..74`):** `#F59E0B` (Amber-500) — Volume médio em calçadas sem risco imediato.
  - 🟢 **Baixo (`priority_score < 40`):** `#10B981` (Emerald-500) — Pequenos volumes ou focos isolados recém-relatados.
  - 🟣 **Resolvido:** `#8B5CF6` (Violet-500) — Histórico de locais limpos.

### 3.2. Micro-Interações e Ergonomia
- **Badge de Deduplicação com Efeito Halo:** Focos com mais de 3 relatos exibem uma tag de destaque: `🔥 7 Cidadãos Unificados`, transmitindo imediatamente a validação social do problema.
- **Layout Focado em Painel Dividido (Split View):**
  - Desktop: 420px de largura fixa para o feed de triagem à esquerda + viewport de mapa expansível à direita.
  - Tablet/Mobile Gestor: Alternância suave via abas inferiores `[ 📋 Lista de Triagem ]` e `[ 🗺️ Mapa Global ]`.

---

## 4. Arquitetura de Componentes Front-end (`Next.js 15 App Router`)

Para manter isolamento absoluto do app mobile do cidadão e zero impacto em produção, todos os arquivos serão hospedados na pasta isolada `src/app/admin/`:

```
src/
├── app/
│   ├── admin/
│   │   ├── layout.tsx              # Shell corporativo do dashboard (sem interferir na rota '/')
│   │   ├── page.tsx                # Orquestrador de estado do painel gestor
│   │   └── actions.ts              # Server Actions / Chamadas tipadas do Supabase
│   └── page.tsx                    # PWA do Cidadão (inalterado)
│
├── components/
│   └── admin/
│       ├── AdminHeader.tsx         # Barra superior: Logo B2G, Tenant Selector, Botão Atualizar
│       ├── AdminKpiStrip.tsx       # 4 Métricas de topo: Focos Ativos, Relatos Deduplicados, Taxa %, Resolvidos
│       ├── HotspotMap.tsx          # Wrapper MapLibre GL com renderização GeoJSON nativa
│       ├── HotspotSidebar.tsx      # Coluna de triagem: Busca por protocolo, filtros e lista de cards
│       ├── HotspotCard.tsx         # Item individual da lista com tags de escala, score e confirmações
│       ├── HotspotDetailDrawer.tsx # Drawer lateral com fotos originais, EXIF, tags e mapa ampliado
│       └── ResolveCleanModal.tsx   # Modal de finalização com upload de foto comprobatória da limpeza
│
└── lib/
    ├── admin-supabase.ts           # Consultas tipadas para `fn_get_active_hotspots_geojson` e `fn_resolve_cluster_clean`
    └── map-styles.ts               # Estilos de mapa OpenStreetMap / CartoDB gratuitos (sem API Key paga)
```

---

## 5. Contratos de Dados do Dashboard

### 5.1. Consulta dos Hotspots Ativos no Mapa (`rpc/fn_get_active_hotspots_geojson`)
A Stored Procedure que já criamos no Supabase retorna a coleção GeoJSON pronta:
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": { "type": "Point", "coordinates": [-46.633308, -23.550520] },
      "properties": {
        "cluster_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
        "protocol_code": "ECO-2026-0001",
        "priority_score": 88.5,
        "confirmations_count": 6,
        "first_reported_at": "2026-11-12T20:15:00Z",
        "dominant_scale": "LARGE",
        "latest_photo_url": "https://mvewdlmysnaqlfzelscw.supabase.co/storage/v1/object/public/reports-webp/foto1.webp"
      }
    }
  ]
}
```

### 5.2. Resolução do Chamado com Foto da Limpeza (`rpc/fn_resolve_cluster_clean`)
Ao concluir o serviço, o gestor envia a comprovação:
```json
{
  "p_cluster_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "p_cleaned_by": "Equipe Coleta Caçamba #03 - Zona Leste",
  "p_cleaned_photo_url": "https://mvewdlmysnaqlfzelscw.supabase.co/storage/v1/object/public/cleaned-photos/limpeza-001.webp",
  "p_notes": "Recolhidos 5m³ de entulho e descartados no Ecoponto Municipal."
}
```

---

## 6. Próximo Passo Imediato (Passo 5 - Codificação na Branch `staging`)
Com o plano aprovado:
1. Instalar a biblioteca de mapa leve `@types/maplibre-gl` e `maplibre-gl`.
2. Desenvolver o `layout.tsx` e `page.tsx` dentro de `src/app/admin/`.
3. Conectar a consulta em tempo real no Supabase.
4. Fazer o commit e push exclusivamente na branch `staging`, permitindo teste imediato no subdomínio de preview da Vercel sem tocar na `main`.
