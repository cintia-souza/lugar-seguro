# Meu Lugarzinho — Resumo Técnico para Copiloto de IA

> Gerado automaticamente para handoff de contexto entre sessões de desenvolvimento.
> Última atualização: Motor Conversacional v5 (Angústia Aguda + Autenticidade Adaptativa)

---

## 1. OBJETIVO DO PROJETO

Plataforma web de **autocuidado emocional gratuita e privada** voltada para pessoas com ansiedade, depressão e neurodivergência. O sistema oferece:

- **Chat conversacional com Lumi** — IA de suporte emocional 100% client-side (sem LLM externo), baseada em pattern-matching, TCC e validação Rogeriana
- **Diário emocional encantado** — fluxo multi-etapa com capa temática, fonte manuscrita, calendário de humor
- **Exercícios terapêuticos** — respiração guiada (3 técnicas), puzzles cognitivos (ColorPuzzle + BlockPuzzle)
- **Relatório clínico** — documento estruturado para levar ao psicólogo/psiquiatra
- **Mascote Lumi** — personagem reativa com 8 expressões, presente em todas as páginas

**Idioma:** 100% PT-BR. **Público:** usuários com ansiedade, depressão, autismo, esquizofrenia.

---

## 2. STACK TECNOLÓGICA

| Camada | Tecnologia | Versão |
|---|---|---|
| Framework | Next.js (App Router) | 16.2.6 |
| Linguagem | TypeScript strict mode | ^5 |
| UI | Tailwind CSS | ^4 |
| Animações | Framer Motion | ^12.39.0 |
| Banco de dados | Neon PostgreSQL (serverless) | `@neondatabase/serverless ^1.1.0` |
| Autenticação | JWT via `jose` + `bcryptjs` | jose ^6.2.3 / bcryptjs ^3.0.3 |
| React | React 19 | 19.2.4 |
| Fontes | Geist (sistema) + Caveat (diário) | Google Fonts |
| Player | YouTube IFrame API | nativo |

**Sem Prisma.** O schema é SQL puro em `/supabase/schema.sql`, executado diretamente no Neon via SQL Editor.

---

## 3. SCHEMA DO BANCO DE DADOS

Arquivo: `/supabase/schema.sql` — PostgreSQL com extensão `pgcrypto`.

### Tabelas e Relações

```
users (1)
  ├── diaries (N)           — entradas do diário (conteúdo criptografado BYTEA + IV)
  ├── vent_history (N)      — histórico de desabafos (resposta criptografada + distorções)
  ├── emotion_logs (N)      — calendário de humor (1 registro por dia, UNIQUE user+date)
  ├── learned_words (N)     — palavras aprendidas pela IA (confidence 0-1, UNIQUE user+word)
  ├── word_cooccurrences (N)— associações palavra↔distorção para aprendizado
  ├── brain_feedback (N)    — feedback "isso ajudou?" por distorção
  ├── user_phrases (N)      — snippets de frases para respostas progressivas
  ├── diary_sessions (N)    — sessões de chat encerradas (metadata JSONB)
  └── diary_messages (N)    — mensagens individuais de cada sessão (sender: user|lumi)
```

### Campos críticos

- `diaries.content_encrypted` / `.iv` — conteúdo AES criptografado
- `emotion_logs` — UNIQUE(user_id, logged_date) — 1 emoção por dia
- `learned_words.confidence` — NUMERIC(3,2) entre 0 e 1
- `diary_sessions.metadata` — JSONB livre para dados extras

---

## 4. ARQUITETURA DE ROTAS

### Pages (`/src/app/`)

| Rota | Proteção | Componente principal | Função |
|---|---|---|---|
| `/` | Pública | `page.tsx` | Dashboard: saudação, streak, painel emocional, player Lo-Fi, dica, resumo semanal |
| `/desabafo` | Pública | `LumiChat.tsx` | Chat conversacional com Lumi (motor v5) |
| `/diario` | **Login obrigatório** | `DiaryBook.tsx` | Diário encantado multi-etapa |
| `/respirar` | Pública | `BreathingExercise.tsx` | 3 técnicas de respiração animadas |
| `/relaxar` | Pública | `ColorPuzzle.tsx` + `BlockPuzzle.tsx` | Puzzles terapêuticos |
| `/perfil` | **Login obrigatório** | `perfil/page.tsx` | Stats, tema, relatório clínico, emergência |
| `/login` | Pública | `login/page.tsx` | Login (Lumi oculta) |
| `/cadastro` | Pública | `cadastro/page.tsx` | Cadastro (Lumi oculta) |
| `/recuperar-senha` | Pública | `recuperar-senha/page.tsx` | Reset de senha (Lumi oculta) |

### API Routes (`/src/app/api/`)

```
/api/auth/
  ├── signup          POST — bcrypt.hash → INSERT users → JWT cookie
  ├── login           POST — bcrypt.compare → JWT cookie
  ├── logout          POST — delete cookie
  ├── me              GET  — JWT verify → user data
  ├── reset-password  POST — reset de senha
  └── update-profile  PUT  — atualiza nome/email

/api/brain/
  ├── data            GET  — carrega learned_words do servidor (cache)
  ├── learn           POST — sync palavras novas aprendidas
  ├── feedback        POST — registra "isso ajudou?" (helpful: boolean)
  ├── responses       POST — sync frases do usuário (user_phrases)
  ├── weekly          GET  — relatório semanal (distorções + temas + progresso)
  └── clinical-report GET  — relatório clínico completo (?days=7|14|30, máx 90)

/api/chat/
  └── route.ts        POST — salva sessões de chat no banco
```

---

## 5. STATUS ATUAL E REGRAS DE NEGÓCIO

### ✅ Funcionando

**Autenticação**
- JWT HS256 em cookie `httpOnly`, `secure` em produção, `sameSite: lax`, 30 dias
- Cookie name: `meu-lugarzinho-session`
- Payload: `{ userId, email, name }`
- Rate limiting: 10 req/min auth, 30 req/min brain (in-memory, reseta no deploy)
- Rotas protegidas: `/diario` e `/perfil` redirecionam para `/login`

**Motor Conversacional Lumi v5** (`/src/lib/conversationalEngine.ts`)
- **14 intenções classificadas:** `desabafo`, `crise`, `distorcao`, `chitchat`, `chitchat-estagnado`, `companhia`, `resposta-curta`, `repetição`, `mudanca-tema`, `pergunta`, `desconexo`, `hook-ativo`, `recusa-profunda`, `fora-escopo`
- **Filtro de escopo:** bloqueia tokens técnicos (código, traduzir, calcular, etc.)
- **companionMode:** ativado quando usuário pede só companhia — desativa perguntas clínicas
- **Angústia Aguda (Camada 0):** intercepta auto-ódio, vontade de gritar, culpa antes de qualquer análise
- **Autenticidade Adaptativa:** input ≤4 palavras → resposta curta (1 frase)
- **Stagnation Detection:** `preguiça + tema mundano` → resposta empática (não "Que delícia!")
- **Memória de sessão:** persiste no localStorage com expiração de 2h
- **Anti-papagaio:** blacklist de palavras que geram frases artificiais (`vontade`, `momento`, `situação`, etc.)

**Brain Engine** (`/src/lib/brainEngine.ts`)
- Detecta 6 distorções cognitivas (TCC): catastrofização, tudo-ou-nada, leitura-mental, raciocínio-emocional, rotulação, supergeneralização
- Threshold de intervenção: confidence > 0.7 (não interrompe conversa leve)
- Respostas progressivas: 2x → 3x → 5x → 8x (sugere profissional)
- Aprendizado por co-ocorrência: palavra aparece 3x com distorção → vira trigger

**Analisador Clínico** (`/src/lib/clinicalAnalyzer.ts`)
- Detecta 4 condições: ansiedade, depressão, autismo/sobrecarga sensorial, esquizofrenia
- Protocolos de crise com safety bridge (CVV 188, SAMU 192)

**Relatório Clínico** (`/src/lib/clinicalReportGenerator.ts` + `/api/brain/clinical-report`)
- Consulta 8 tabelas em paralelo
- Gera 10 seções: engajamento, padrão emocional, distorções, temas, sinais clínicos, padrões temporais, sintomas auto-reportados, observações comportamentais, evolução, resposta às intervenções
- Exportável como PDF (print) ou .txt

**Mascote Lumi** (`/src/hooks/useLumiBrain.ts` + `LumiMascot.tsx`)
- 8 expressões com imagens PNG em `/public/lumi/`
- Reage à rota, emoção selecionada e texto digitado
- Debounce de 6s entre mudanças de expressão
- Oculta em `/login`, `/cadastro`, `/recuperar-senha`

**Temas Visuais**
- 3 temas: Padrão (`#FAFBFD`), Escuro (`#0f172a`), Alto Contraste (`#000000`)
- Aplicados via `data-theme` no `<html>`, salvos no localStorage
- Selecionáveis em `/perfil`

**Offline-first**
- Toda a inteligência roda client-side
- localStorage como fallback quando não logado
- Sync com Neon quando logado (fire-and-forget)

### ⚠️ Regras de Negócio Importantes

1. **Sem Prisma** — SQL puro via `neon()` client, tipagem manual com interfaces TypeScript
2. **Sem `any`** — TypeScript strict mode, todos os casts usam `as unknown as T`
3. **Sem analytics/tracking** — privacidade por design
4. **Conteúdo do diário criptografado** — BYTEA + IV no banco, nunca texto plano
5. **Lumi não é LLM** — toda resposta é determinística (pattern-matching + templates)
6. **companionMode persiste na sessão** — só desativa se usuário volta a desabafar ativamente
7. **Relatório clínico ≠ diagnóstico** — aviso explícito no documento gerado

### 🔧 Variáveis de Ambiente

```env
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require
JWT_SECRET=string-de-32-chars-minimo
```

---

## 6. ESTRUTURA DE ARQUIVOS CHAVE

```
src/
├── lib/
│   ├── conversationalEngine.ts  ← Motor principal Lumi v5 (EDITAR COM CUIDADO)
│   ├── brainEngine.ts           ← TCC + distorções + aprendizado
│   ├── clinicalAnalyzer.ts      ← 4 condições clínicas + protocolos de crise
│   ├── clinicalReportGenerator.ts ← Gerador de relatório para profissionais
│   ├── brainLearning.ts         ← Co-ocorrência + sync Neon
│   ├── brainResponses.ts        ← Respostas progressivas (2x→8x)
│   ├── expressiveAnalyzer.ts    ← Sinais textuais (kkk, aaaa, buaaa)
│   ├── behavioralIntelligence.ts ← Keystroke tracking + horário
│   ├── session.ts               ← JWT create/verify/destroy
│   ├── db.ts                    ← Cliente Neon
│   └── sounds.ts                ← Web Audio API (lock click, chime)
├── hooks/
│   ├── useLumiChat.ts           ← Hook do chat (processingRef guard, memória)
│   ├── useLumiBrain.ts          ← Hook da mascote global
│   └── useBlockPuzzle.ts        ← Engine do puzzle de blocos
├── config/
│   ├── lumiExpressions.ts       ← 8 expressões + triggers + speeches + actions
│   └── mediaMapping.ts          ← Mapeamento YouTube por emoção
└── context/
    ├── AppContext.tsx            ← emotionalState + sensoryMode global
    └── AuthContext.tsx           ← user session + isLoading
```

---

## 7. PRÓXIMOS PONTOS DE ATENÇÃO

- `middleware.ts` usa rate limiting **in-memory** — reseta no deploy. Para produção, migrar para Redis/Upstash
- `diary_sessions` e `diary_messages` têm tabelas no banco mas o sync ainda é parcial (localStorage-first)
- `word_cooccurrences` cresce indefinidamente — considerar limpeza periódica de registros antigos
- A função `capitalize` em `conversationalEngine.ts` está declarada mas não usada após a v5 — pode ser removida
