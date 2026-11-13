# Findings & Descobertas de Produto e Arquitetura (Desafio 09)

> **Metodologia:** `planning-with-files` + `product-manager-toolkit`
> **Fonte Primária:** Ficha de Desafio 09 (Ciência Cidadã NASA / GLOBE Observer), Apresentação de Validação da Equipe (Enzo Alves dos Santos Souza & Clayver Alexssander) e Business Model Canvas.

---

## 1. Síntese do Problema e Evidências de Campo

1. **O Fenômeno Ambiental Escolhido:**
   - Acúmulo e descarte irregular de resíduos sólidos urbanos (entulho de obra, móveis volumosos, lixo domiciliar e podas) em calçadas, terrenos públicos e margens de córregos.
2. **Descobertas das Entrevistas de Validação (Método Imparcial Focado no Passado):**
   - **Barreira dos 30 Segundos (Persona Marcos — Cidadão Coletor):** O morador sente indignação ao passar pelo entulho, mas desiste de denunciar quando o canal oficial (ex: 156 ou Ouvidoria) exige login, preenchimento de CPF, endereço por extenso e múltiplos cliques ($> 30\text{s}$). Além disso, áreas próximas a córregos frequentemente apresentam **sinal de internet instável**.
   - **Inutilidade do Dado em Redes Sociais:** Quando o morador tira uma foto e manda em grupos de WhatsApp ou Facebook do bairro, o aplicativo **remove automaticamente os metadados EXIF de GPS** durante a compressão da imagem. A prefeitura recebe a foto, mas não sabe onde o entulho está.
   - **Custo de Triagem e Chamados Duplicados (Persona Juliana — Gestora Decisora):** O maior gargalo operacional das Secretarias de Obras e Concessionárias é o tempo perdido filtrando dezenas de chamados repetidos para o mesmo monte de entulho e despachando caminhões de porte errado por falta de dimensionamento visual.

---

## 2. Restrições Críticas do Desafio 09 e Como a Arquitetura as Resolve

| Restrição / Critério (Ficha de Desafio 09) | Solução Técnica Adotada no Projeto |
| :--- | :--- |
| **Tensão entre simplicidade e estruturação científica** | **Inversão de Esforço:** O cidadão dá apenas 3 toques (Foto $\rightarrow$ Porte P/M/G $\rightarrow$ Alerta Push). O Web Worker no celular e o PostGIS estruturam coordenadas, acurácia, azimute, timestamp e hash visual automaticamente. |
| **Não alegar validade científica apenas por volume** | Protocolo Mínimo de Observação verificável: exige foto fresca (`is_fresh_capture`), precisão métrica do GPS (`gps_accuracy_m`), escala logística padronizada e contagem de **confirmações independentes por múltiplos observadores** no mesmo cluster. |
| **A solução não precisa usar IA obrigatoriamente** | No **MVP Custo Zero**, toda a classificação de porte é feita pela escolha visual de 3 botões (P/M/G) e a deduplicação usa geometria espacial determinística (`PostGIS ST_DWithin`) + hash perceptual (`dHash` 64-bit). A IA entra apenas na fase comercial madura. |
| **Privacidade e segurança em propriedades privadas** | Strip completo de EXIF pessoal no cliente antes do upload, identificação anônima por hash criptográfico (`HMAC-SHA256`), borramento de rostos/placas e orientação de enquadramento restrita à via pública. |
| **Custo Zero no MVP ($0/mês)** | Uso combinado de **Vercel Free** (Next.js PWA), **Supabase Free** (PostgreSQL + PostGIS + Storage 1GB + Edge Functions), **MapLibre GL + OpenStreetMap** e **W3C Web Push VAPID**. |

---

## 3. Limites Técnicos do "Free Tier" e Engenharia de Contorno

- **Supabase Database Free Limit:** `500 MB`.
  - *Contorno:* Cada relato ocupa ~400 bytes na tabela `citizen_reports`. Com 500 MB cabem mais de **800.000 relatos georreferenciados**.
- **Supabase Storage Free Limit:** `1 GB`.
  - *Contorno:* O upload de fotos cruas da câmera (5 MB em média) esgotaria o bucket com apenas 200 relatos. Por isso, o **Front-end (Next.js)** converte a imagem em `OffscreenCanvas` para `WebP (1280px, qualidade 0.80)` gerando arquivos de **~140 KB** (permitindo **> 7.100 fotos gratuitas**) e descarta uploads duplicados via `dHash`.
- **Cold Start do GPS Mobile (`Geolocation API`):**
  - *Contorno:* Em celulares abrindo o navegador na rua, o A-GPS leva de `1.5s` a `6s` para refinar a precisão de `150m` (torre de celular) para `< 10m` (satélite GNSS). A UI mostra um indicador vivo (*"🛰️ Calibrando GPS..."*) e permite bater a foto sem travar a tela, aguardando até `2.5s` em background no Toque 2 ou usando a coordenada física do QR Code como âncora.
