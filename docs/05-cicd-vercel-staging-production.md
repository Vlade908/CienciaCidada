# 🚀 Guia de CI/CD: Vercel (Staging & Production)

Este projeto já está configurado com um pipeline automatizado de **Integração Contínua (CI)** e **Entrega Contínua (CD)** via **GitHub Actions** e **Vercel** (`.github/workflows/deploy.yml`).

---

## 🏗️ 1. Como Funciona a Estrutura de Ambientes

| Ambiente | Branch Git | Quando o Deploy Acontece? | URL Gerada na Vercel |
| :--- | :--- | :--- | :--- |
| **🟢 Produção (Production)** | `main` | Push ou Merge na branch `main` | `ecocidadao.vercel.app` (ou domínio próprio) |
| **🟡 Homologação (Staging)** | `staging` | Push na branch `staging` ou criação de Pull Requests | `ecocidadao-git-staging-....vercel.app` (Preview seguro) |

---

## ⚙️ 2. Como Ativar na Vercel (Opção mais Simples & Automática)

A Vercel possui integração nativa com o GitHub que detecta Next.js automaticamente.

### Opção A: Integração Nativa via Painel da Vercel (Recomendada - 2 Minutos)
1. Acesse [vercel.com](https://vercel.com) e faça login com sua conta do GitHub;
2. Clique em **"Add New..."** ➔ **"Project"**;
3. Localize e selecione o repositório `Vlade908/CienciaCidada`;
4. Na tela de configuração **"Environment Variables"**, adicione:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://mvewdlmysnaqlfzelscw.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `sb_publishable_4OJLZUZ0QS6O4OkK-zfCHA_boeH9Dtm`
5. Clique em **"Deploy"**.

**Pronto!** A partir desse momento:
- Qualquer `git push origin main` publica na **Produção**;
- Qualquer `git push origin staging` ou Pull Request gera um ambiente de **Staging** com URL temporária para testes antes de ir para o ar.

---

### Opção B: Ativar via GitHub Actions (Pipeline Personalizado)

Se você quiser que o GitHub Actions gerencie o deploy explicitamente, adicione os seguintes **Secrets** no seu repositório no GitHub (**Settings ➔ Secrets and variables ➔ Actions ➔ New repository secret**):

1. `VERCEL_TOKEN`: Crie em [vercel.com/account/tokens](https://vercel.com/account/tokens);
2. `VERCEL_ORG_ID`: Encontrado nas configurações da conta/equipe na Vercel;
3. `VERCEL_PROJECT_ID`: Encontrado em **Project Settings ➔ General** na Vercel;
4. `NEXT_PUBLIC_SUPABASE_URL`: `https://mvewdlmysnaqlfzelscw.supabase.co`;
5. `NEXT_PUBLIC_SUPABASE_ANON_KEY`: `sb_publishable_4OJLZUZ0QS6O4OkK-zfCHA_boeH9Dtm`.

---

## 🌿 3. Criando a Branch de Staging no Git

Para começar a usar o fluxo de dois ambientes no seu repositório local:

```bash
# Cria e envia a branch de staging para o GitHub
git checkout -b staging
git push -u origin staging

# Volta para a main para trabalhar
git checkout main
```
