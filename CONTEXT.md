# CONTEXT.md — Zero Preview
> Atualizado em: 26/03/2026
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

Pipeline principal:
VELOCISTA → SOMMELIER → ARQUITETO → EXECUTOR → CRÍTICO → REVIEWER → SPLITTER

---

## REGRAS DO SISTEMA

### Cores — REGRA ABSOLUTA
- NUNCA hex hardcoded (#XXXXXX) em lugar nenhum
- SEMPRE CSS variables: var(--accent), var(--bg), var(--sidebar), var(--text), var(--border), var(--card)
- CSS Enforcer (src/lib/cssEnforcer.js) converte automaticamente antes do CRÍTICO

### Limite de linhas
- 400 linhas em TODO o sistema (EXECUTOR, AGENT, COMPACT)
- Padronizado em 26/03/2026 — não alterar

### REVIEWER
- Só aciona quando score < 70
- Score >= 70 → pula direto pro SPLITTER
- Score < 40 → regenera (máximo 2x)

### CRÍTICO V6
- Rejeita hex hardcoded — exige CSS variables
- Aprova apenas var(--) ou THEME/COLORS como constante

---

## PROVIDERS DISPONÍVEIS (Multi-AI)
1. Auto (padrão — seleção automática)
2. Claude Sonnet 4 (principal)
3. Gemini
4. Groq
5. DeepSeek
6. Cerebras
7. SambaNova
8. Mistral

Seleção persistida em localStorage("zp_provider")
Header enviado: x-preferred-provider
Backend reordena providers conforme seleção

---

## 20 NICHOS SUPORTADOS
beauty, food, finance, fitness, church, retail, construction,
education, health, creative, law, vet, languages, petshop,
pharmacy, realestate, ministry, automotive, events, crafts + generic

Mapeamentos especiais:
- ecommerce → retail
- shop → retail
- medical → health
- school → education

---

## HISTÓRICO DE CORREÇÕES — 26/03/2026

### Auditoria completa — 9 problemas corrigidos
1. ✅ Limite de linhas padronizado — 400 em todo sistema
2. ✅ CRÍTICO V6 rejeita hex hardcoded
3. ✅ COMPACT alinhado com EXECUTOR (CSS vars, Lucide, Shadcn, sem placeholders)
4. ✅ CLAUDE AGENT com CONTEXTO_BR + validação pós-loop
5. ✅ Detecção de nicho centralizada (knowledge.js alinhado com niches.js)
6. ✅ RETRY SIMPLE implementado no server.js
7. ✅ REVIEWER enxuto — 300 tokens economizados por chamada
8. ✅ ecommerce→retail mapeado no NICHE_ALIAS_MAP
9. ✅ NICHE_DETECT_PROMPT simplificado — 200 tokens economizados

### Fixes adicionais
- ✅ CSS Enforcer (src/lib/cssEnforcer.js) — converte hex automaticamente
- ✅ Retry silencioso no frontend (3 tentativas, delay 3s/6s/9s)
- ✅ Multi-AI com x-preferred-provider end-to-end
- ✅ Botão Multi-AI funcional com dropdown 8 providers
- ✅ Validador de sintaxe TypeScript (syntaxValidator.js) — badge verde funcionando
- ✅ SYSTEM_PROMPT enxuto — 257 linhas → 80 linhas
- ✅ Orquestrador Fase 1 (src/lib/orchestrator.js + OrchestratorPanel.jsx) — loop autonomo de agentes

### Impacto
Tokens por geração:
Antes:  ~35000
Depois: ~18000
Economia: ~48%

---

## PROBLEMAS CONHECIDOS ATUAIS
- "Resposta vazia do Claude" ainda aparece ocasionalmente (intermitente)
- Preview WebContainer às vezes demora para iniciar
- COMPACT com providers alternativos não validado ainda

---

## PRÓXIMOS PASSOS PRIORITÁRIOS

### Alta prioridade
1. Validar COMPACT com Gemini/Groq após correções
2. Validar CLAUDE AGENT gerando dados BR
3. Monitorar "Resposta vazia" após retry silencioso

### Média prioridade
4. Supabase integrado — sair de dados mockados para banco real
5. GitHub automático — cada geração vira commit automático
6. Preview WebContainer estável definitivo

### Futuro
7. Ambiente colaborativo Claude.ai + Claude Code + Claudin unificado
8. Modo de edição visual inline
9. Autenticação gerada automaticamente nos apps

---

## INSTRUÇÕES PARA CLAUDE CODE
Antes de qualquer intervenção no Zero Preview:
1. Ler este arquivo
2. Verificar histórico de correções para não reverter o que já foi feito
3. Respeitar regras do sistema (cores, limite de linhas, REVIEWER threshold)
4. Após implementar — atualizar seção "Histórico de Correções"
5. Nunca usar hex — sempre CSS variables

## INSTRUÇÕES PARA CLAUDIN
Antes de qualquer teste:
1. Ler este arquivo para saber o estado atual
2. Priorizar testes dos "Problemas Conhecidos Atuais"
3. Reportar score, provider usado e qualquer hex detectado
4. Atualizar seção "Problemas Conhecidos" com novos achados

---

## CONTATO DO PROJETO
Dono: Elias (mc1ar)
Repo frontend: Eliasflpd/zero-preview
Repo backend: Eliasflpd/zero-backend
Deploy: zero-preview-six.vercel.app
