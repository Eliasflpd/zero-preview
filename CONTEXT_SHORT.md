# CONTEXT_SHORT.md — Zero Preview (resumo)
> Para contexto completo: CONTEXT.md

## Stack
- Frontend: React 18 + Vite + TypeScript + Tailwind — Vercel (zero-preview-six.vercel.app)
- Backend: Node.js + Express — Railway (zero-backend-production-7b37.up.railway.app)
- Repos: Eliasflpd/zero-preview (frontend) | Eliasflpd/zero-backend (backend)

## Pipeline: 12 agentes
VELOCISTA → SOMMELIER → ARQUITETO → EXECUTOR → CSS Enforcer → CRITICO → REVIEWER → SPLITTER

## Regras absolutas
- NUNCA hex hardcoded — sempre CSS variables: var(--accent), var(--bg), var(--sidebar)
- Maximo 400 linhas por arquivo gerado
- CSS Enforcer (src/lib/cssEnforcer.js) converte hex automaticamente
- CRITICO V6 rejeita hex — exige var(--)
- IDs de projeto: UUID v4 (crypto.randomUUID), nunca p_timestamp

## Providers (11 no dropdown)
Auto, Claude Sonnet 4, DeepSeek, Gemini, Groq, Cerebras, SambaNova, Mistral, HuggingFace, Scaleway, Cloudflare
Header: x-preferred-provider | Persistido: localStorage("zp_provider")

## 20 nichos
beauty, food, finance, fitness, church, retail, construction, education, health, creative, law, vet, languages, petshop, pharmacy, realestate, ministry, automotive, events, crafts + generic

## Problemas conhecidos
- "Resposta vazia do Claude" intermitente (retry silencioso implementado)
- Preview WebContainer lento ao iniciar
- Providers novos (HuggingFace, Scaleway, Cloudflare) dependem de keys no Railway

## Proximos passos
1. Validar providers novos com keys ativas
2. Validar UUID fix no salvamento
3. Monitorar Orquestrador com prompt JSON corrigido
4. Supabase integrado (sair de dados mockados)
5. GitHub automatico (geracao vira commit)
