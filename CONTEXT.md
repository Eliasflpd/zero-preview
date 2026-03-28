# CONTEXT.md — Zero Preview
> Atualizado em: 28/03/2026
> Propósito: Contexto compartilhado entre Claude.ai, Claude Code e Claudin

---

## O QUE É O ZERO PREVIEW
Plataforma que gera apps React+TypeScript+Tailwind completos a partir de linguagem natural.
Público geral — não precisa saber programar.
Stack: Vite + React + TypeScript (frontend) + Node.js Railway (backend)
Deploy: Vercel (frontend) + Railway (backend)
Repo frontend: Eliasflpd/zero-preview (branch main)
Repo backend: Eliasflpd/zero-backend (branch main)

---

## ⚠️ PROBLEMA CENTRAL — 5 DIAS SEM RESOLVER (PRIORIDADE MÁXIMA)

**O código gerado pela IA QUEBRA no preview do WebContainer.**

Sintomas recorrentes:
- Erros de sintaxe (strings não terminadas, brackets desbalanceados)
- JSX inválido (tags não fechadas, typed arrows quebrando Babel)
- Hooks fora de ordem (chamados após early return)
- Imports errados ou faltando
- TypeScript generics confundidos com JSX
- Hex hardcoded em vez de CSS variables
- "// ... keep existing code" não resolvido (fica literal no código)
- Respostas vazias ou muito curtas dos providers
- Código truncado (arquivo cortado no meio)

**14 camadas de defesa já criadas — nenhuma resolveu definitivamente:**
1. Syntax Validator (detecta 5 tipos de erro)
2. Auto-fix local (Shadcn tags, typed arrows — zero tokens)
3. Auto-fix via API (manda código com erros pra AI corrigir)
4. CSS Enforcer (converte hex → CSS variables)
5. Retry invisível frontend (2 tentativas, simplifica prompt)
6. Retry backend (2 tentativas, COMPACT_SYSTEM)
7. Engineering System Prompt (regras rigorosas de arquitetura)
8. Patch Engine (parser de múltiplos formatos de output)
9. Dual-Model Pipeline (Modelo 1 gera diff, Modelo 2 reconstrói)
10. Error Capture (escuta erros do preview e alimenta retry)
11. Retry Engine (3 tentativas com escalada de estratégia)
12. Project Context (memória persistente entre gerações)
13. Generation Orchestrator (une todos os mecanismos)
14. fixRechartsJSX (corrige JSX inline do Recharts)

**Hipóteses da causa raiz:**
- Providers gratuitos (Groq, Gemini, HuggingFace) fracos demais pra React+TS
- System prompt grande demais → modelos menores cortam/ignoram
- Formato livre de output impossível de parsear com 100% de acurácia
- Cada camada adiciona complexidade sem resolver o core problem
- Abordagem fundamentalmente errada (deveria ser template-based ou AST-based?)

---

## ARQUITETURA — 12 AGENTES

| # | Agente | Arquivo | Usa IA? | Tokens |
|---|--------|---------|---------|--------|
| 1 | VELOCISTA | generator.js + cache.js | Não | 0 |
| 2 | SOMMELIER | niches.js + generator.js | Às vezes | ~100 |
| 3 | ARQUITETO | architect.js | Não | 0 |
| 4 | EXECUTOR | prompts.js + generator.js | Sim | ~10000 |
| 5 | CRÍTICO | validator.js | Não | 0 |
| 6 | REVIEWER | prompts.js + generator.js | Condicional | ~8000 |
| 7 | MEMORIALISTA | cache.js + generator.js | Não | 0 |
| 8 | SPLITTER | splitter.js | Não | 0 |
| 9 | COMPACT | server.js | Sim (providers alt.) | ~2500 |
| 10 | CLAUDE AGENT | server.js | Sim (loop 10x) | ~20000-30000 |
| 11 | RETRY SIMPLE | server.js | Sim (emergência) | ~8000 |
| 12 | KNOWLEDGE | knowledge.js | Não | ~200 |

Pipeline: VELOCISTA → SOMMELIER → ARQUITETO → EXECUTOR → CRÍTICO → REVIEWER → SPLITTER → MEMORIALISTA

Edit mode (dual-model): Modelo 1 (diff) → Modelo 2 (reconstrói via /reconstruct)

---

## 14 MECANISMOS DE DEFESA

| # | Mecanismo | Arquivo |
|---|-----------|---------|
| 1 | Engineering Prompt | engineeringPrompt.js |
| 2 | Error Capture | errorCapture.js |
| 3 | Patch Engine | patchEngine.js |
| 4 | Project Context | projectContext.js |
| 5 | Retry Engine | retryEngine.js |
| 6 | Generation Orchestrator | generationOrchestrator.js |
| 7 | Syntax Validator | syntaxValidator.js |
| 8 | CSS Enforcer | cssEnforcer.js |
| 9 | Model 2 Reconstructor | model2Reconstructor.js |
| 10 | Validator/Crítico | validator.js |
| 11 | Retry frontend | api.js |
| 12 | Retry backend | server.js |
| 13 | Splitter | splitter.js |
| 14 | Reviewer | generator.js |

---

## REGRAS DO SISTEMA

### Cores — REGRA ABSOLUTA
- NUNCA hex hardcoded (#XXXXXX)
- SEMPRE CSS variables: var(--accent), var(--bg), var(--sidebar), var(--text), var(--border), var(--card)
- CSS Enforcer converte automaticamente

### Limite de linhas: 400 em todo o sistema

### REVIEWER: score < 70 → revisa | score < 40 → regenera (max 2x)

### CRÍTICO V6: rejeita hex, exige CSS variables

---

## PROVIDERS — 10 disponíveis

| Provider | Status |
|----------|--------|
| Claude Sonnet 4 | Sem crédito até 01/04 |
| Gemini | Funciona (quota diária) |
| Groq | Funciona (100k/dia) |
| DeepSeek | Key inválida |
| Cerebras | Key inválida |
| SambaNova | Funciona |
| Mistral | Funciona |
| HuggingFace | Funciona (novo 26/03) |
| Scaleway | Funciona (novo 26/03) |
| Cloudflare | Funciona (novo 26/03) |

Circuit breaker: 2 falhas → skip 5 min
x-preferred-provider: usuário escolhe

---

## 20 NICHOS
beauty, food, finance, fitness, church, retail, construction,
education, health, creative, law, vet, languages, petshop,
pharmacy, realestate, ministry, automotive, events, crafts + generic

---

## FEATURES IMPLEMENTADAS

### 28/03
- Motor de geração robusto (7 mecanismos anti-falha)
- Dual-Model Pipeline (diff + /reconstruct)
- Fix React Error #310, typed arrows em JSX

### 27/03
- Painel navegador embutido

### 26/03
- Escritório (chat WhatsApp entre agentes, @menções, upload, endpoints)
- Orquestrador Fase 1 (loop autônomo)
- 3 novos providers (HuggingFace, Scaleway, Cloudflare)
- CSS Enforcer, Syntax Validator, Retry invisível
- Slash Commands + /rewind, Diff Review + ZIP Export
- Project Knowledge, CONTEXT.md + MESSAGES.md

### 25/03
- Estabilização (17 arquivos restaurados, ErrorBoundary)
- Theme v3 (visual premium dark)
- Backend: Supabase REST, streaming SSE, Mistral, Circuit breaker

---

## PLANO APROVADO — IMPLEMENTAR EM 30-31/03/2026 (segunda/terça)

### DIAGNÓSTICO (Fabian/Claude.ai — 28/03)
- Causa raiz: modelos gratuitos NÃO conseguem gerar React+TS livre de forma consistente
- 14 camadas de defesa = sintoma de approach errado ("catedral em areia")
- Regra: se precisa de >3 camadas pro mesmo problema, a premissa está errada
- Solução: mudar pra Template Engine + JSON Intent Extraction

### FASE 1 — Template Engine + JSON Intent (fazer PRIMEIRO)

**Conceito:** modelo fraco NUNCA mais gera código livre. Só extrai intenção em JSON.

```
[User prompt] → [Modelo fraco extrai JSON] → [Template engine injeta no template] → [WebContainer recebe código limpo]
```

**Implementar:**

1. `src/lib/templateEngine.js` — motor de templates
   - Recebe JSON de intenção + template base
   - Injeta valores nos {{SLOTS}}
   - Retorna código 100% válido sempre

2. `src/templates/` — 5 templates base (cada um é .tsx válido com slots)
   - `dashboard.tsx` — CRUD com tabela, filtros, stats cards
   - `landing.tsx` — hero, features, CTA, footer
   - `form.tsx` — formulário multi-step com validação
   - `chat.tsx` — interface de chat/mensagens
   - `crud.tsx` — lista + criar + editar + deletar

3. `src/lib/intentExtractor.js` — prompt de extração
   - Pede ao modelo: `{ appName, niche, primaryColor, fields[], features[], sections[] }`
   - Modelo fraco consegue fazer isso com ~100% de acerto
   - Output é JSON puro, fácil de validar

4. Integrar no `generator.js`:
   - Se provider é gratuito → usa templateEngine
   - Se provider é tier-1 (Claude, GPT-4o) → usa geração livre (Fase 2)

**Templates devem ter:**
- CSS variables (var(--accent) etc) — nunca hex
- Dados BR (R$, PIX, nomes BR, datas DD/MM)
- Responsivo
- Lucide icons
- Shadcn-style components
- Max 400 linhas cada

### FASE 2 — Claude Sonnet (01/04+)
- Claude volta com crédito
- Geração livre com SÓ 2 camadas: Babel parse + retry se truncar
- Jogar fora 12 das 14 camadas atuais
- Manter apenas: Syntax Validator (simplificado) + CSS Enforcer

### FASE 3 — Modelo por função
- Groq/Gemini → extração de intenção JSON (rápido/barato)
- Claude Sonnet → geração de código completo
- Gemini Flash → explicações, documentação inline
- Cada modelo faz o que faz BEM. Modelo fraco NUNCA gera código livre.

### PENDENTE (após Fases 1-2)
- Trocar keys DeepSeek e Cerebras
- Supabase integrado (sair de mockados)
- GitHub automático
- Skills por nicho, Terminal interativo

---

## INSTRUÇÕES PARA CLAUDE CODE
1. Ler este arquivo antes de qualquer intervenção
2. NÃO adicionar mais camadas de defesa sem resolver causa raiz
3. Respeitar regras (CSS vars, 400 linhas, REVIEWER threshold)
4. Após implementar — atualizar este arquivo
5. Push direto e avisar Claudin

## INSTRUÇÕES PARA CLAUDIN
1. Ler este arquivo para saber estado atual
2. Testar geração e reportar se preview funciona
3. Reportar score, provider e erros
4. @Claudin no Escritório → executar teste e reportar

---

Dono: Elias (mc1ar)
Repos: Eliasflpd/zero-preview | Eliasflpd/zero-backend
Deploy: zero-preview-six.vercel.app
