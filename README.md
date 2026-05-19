# Meu Lugarzinho

**Plataforma gratuita e privada de autocuidado emocional para ansiedade, depressão e neurodivergência.**

---

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Tecnologias](#tecnologias)
- [Arquitetura](#arquitetura)
- [Instalação](#instalação)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Banco de Dados](#banco-de-dados)
- [Funcionalidades](#funcionalidades)
- [Sistema de Autenticação](#sistema-de-autenticação)
- [Brain Engine (IA Local)](#brain-engine-ia-local)
- [Mascote Lumi](#mascote-lumi)
- [SEO e Segurança](#seo-e-segurança)
- [Temas Visuais](#temas-visuais)
- [Estrutura de Pastas](#estrutura-de-pastas)
- [Deploy](#deploy)

---

## Visão Geral

Meu Lugarzinho é uma aplicação web de autoajuda focada em:

- **Ansiedade** — exercícios de respiração, grounding, validação empática
- **Depressão** — diário emocional, registro de humor, ativação comportamental
- **Autismo/Neurodivergência** — redução sensorial, puzzles de foco, modo low-stimulation
- **Esquizofrenia** — âncora física, validação sem julgamento, ponte de crise

### Princípios

1. **Privacidade por design** — dados criptografados, sem analytics, sem rastreamento
2. **Acessibilidade** — modo low-stimulation, alto contraste, respeito a `prefers-reduced-motion`
3. **Gratuito** — sem paywalls, sem assinaturas
4. **Offline-first** — funciona com localStorage quando não há conexão com banco

---

## Tecnologias

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 16 (App Router) |
| Linguagem | TypeScript (strict mode) |
| Estilização | Tailwind CSS 4 |
| Animações | Framer Motion |
| Banco de dados | Neon PostgreSQL (serverless) |
| Autenticação | JWT (jose) + bcryptjs |
| Fontes | Geist (sistema) + Caveat (diário) |
| Player | YouTube IFrame API |

---

## Arquitetura

```
┌─────────────────────────────────────────────────┐
│                   CLIENTE                         │
│                                                   │
│  Context (App + Auth) → Components → Pages        │
│         ↓                                         │
│  Brain Engine (local) ← brainLearning + Responses │
│         ↓                                         │
│  localStorage (fallback offline)                  │
└──────────────────────┬────────────────────────────┘
                       │ fetch
┌──────────────────────▼────────────────────────────┐
│                 API ROUTES                          │
│                                                    │
│  /api/auth/*     → JWT + bcrypt + Neon             │
│  /api/brain/*    → Aprendizado + Feedback + Weekly │
└──────────────────────┬─────────────────────────────┘
                       │ SQL
┌──────────────────────▼────────────────────────────┐
│              NEON POSTGRESQL                        │
│                                                    │
│  users, diaries, vent_history, emotion_logs,       │
│  learned_words, word_cooccurrences,                │
│  brain_feedback, user_phrases                      │
└────────────────────────────────────────────────────┘
```

---

## Instalação

```bash
# Clonar
git clone <repo-url>
cd meu-lugarzinho

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.local.example .env.local
# Editar .env.local com suas credenciais

# Rodar em desenvolvimento
npm run dev

# Build de produção
npm run build
npm start
```

---

## Variáveis de Ambiente

Criar `.env.local` na raiz:

```env
# Neon PostgreSQL
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require

# JWT Secret (gerar com: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_SECRET=sua-string-secreta-de-32-caracteres-minimo
```

---

## Banco de Dados

### Setup

1. Criar projeto em [neon.tech](https://neon.tech)
2. Copiar a connection string para `DATABASE_URL`
3. Rodar o schema no SQL Editor do Neon:

```sql
-- Arquivo: /supabase/schema.sql (nome legado, funciona com Neon)
```

### Tabelas

| Tabela | Função |
|--------|--------|
| `users` | Cadastro com senha bcrypt |
| `diaries` | Entradas do diário (criptografadas) |
| `vent_history` | Histórico de desabafos |
| `emotion_logs` | Registro diário de humor (calendário) |
| `learned_words` | Palavras aprendidas pela IA |
| `word_cooccurrences` | Associações de palavras |
| `brain_feedback` | Feedback do usuário sobre respostas |
| `user_phrases` | Frases para aprendizado de respostas |

---

## Funcionalidades

### 1. Home (Dashboard)

- Saudação por horário (bom dia/tarde/noite)
- Streak de dias consecutivos
- Frase motivacional
- Painel "Como você está?" (6 emoções)
- Player ambiente Lo-Fi (YouTube, reativo à emoção)
- Dica terapêutica do dia
- Resumo semanal
- Sugestão contextual baseada na emoção
- Respiração rápida inline

### 2. Desabafo (`/desabafo`)

- Textarea para escrita livre
- Animação de "explosão de palavras" ao enviar
- Análise pelo Brain Engine:
  - Validação empática
  - Exercício de grounding
  - Reenquadramento cognitivo
  - Dica prática
- Detecção de distorções cognitivas
- Feedback "Isso te ajudou?" (treina a IA)
- Safety bridge em caso de crise (CVV 188)

### 3. Diário (`/diario`) — Requer login

- Capa customizável (4 temas visuais)
- Cadeado com som de click ao abrir
- Fluxo em 3 etapas:
  1. "Como está se sentindo?" (6 emoções)
  2. "Algum sintoma?" (12 chips selecionáveis)
  3. Escrita livre com fonte manuscrita (Caveat)
- Página interna com tema da capa (cores das linhas mudam)
- Lumi observando enquanto escreve
- Som de chime ao salvar
- Calendário de humor (DiarySummary)
- Sumário com histórico de entradas

### 4. Descontração (`/relaxar`)

- Puzzle de cores (ordenar do claro ao escuro)
- Feedback do Brain Engine ao completar
- Ativa córtex pré-frontal (terapia ocupacional)

### 5. Respirar (`/respirar`)

- 3 técnicas: 4-7-8, Caixa, Calma
- Círculo animado que expande/contrai
- Countdown numérico
- Barra de progresso de ciclos
- Tela de conclusão

### 6. Perfil (`/perfil`) — Requer login

- Estatísticas (diário, desabafos, dias ativos)
- Editar nome e email
- Alterar senha
- Seletor de tema visual (Padrão, Escuro, Alto Contraste)
- Relatório semanal com gráfico SVG
- Contatos de emergência (terapeuta + CVV 188)
- Exportar relatório (PDF via print)

---

## Sistema de Autenticação

### Fluxo

```
Cliente → /api/auth/signup → bcrypt.hash → INSERT users → JWT cookie
Cliente → /api/auth/login  → bcrypt.compare → JWT cookie
Cliente → /api/auth/me     → JWT verify → user data
Cliente → /api/auth/logout → delete cookie
```

### Segurança

- Senhas: bcrypt com salt 10
- Sessão: JWT HS256 em cookie httpOnly
- Cookie: secure em produção, sameSite lax, 30 dias
- Rate limiting: 10 req/min por IP em auth routes

### Rotas protegidas

- `/diario` — redireciona para `/login` se não autenticado
- `/perfil` — redireciona para `/login` se não autenticado

---

## Brain Engine (IA Local)

### Arquitetura

```
Texto do usuário
    ↓
detectTriggers() → palavras-chave conhecidas + aprendidas
    ↓
detectDistortions() → 6 tipos de distorção cognitiva
    ↓
analyzeUserSymptoms() → análise clínica (ansiedade, depressão, autismo, esquizofrenia)
    ↓
getContextualResponse() → resposta progressiva baseada no histórico
    ↓
BrainResponse {
  validation, grounding, reframe, practicalTip, clinicalReport
}
```

### Distorções Cognitivas Detectadas

| Tipo | Exemplo de trigger |
|------|-------------------|
| Catastrofização | "fim do mundo", "não vou aguentar" |
| Tudo ou Nada | "sempre", "nunca", "impossível" |
| Leitura Mental | "me odeiam", "estão rindo de mim" |
| Raciocínio Emocional | "eu sinto", "deve ser verdade" |
| Rotulação | "inútil", "fracasso", "lixo" |
| Supergeneralização | "ninguém", "todo mundo vai embora" |

### Sistema de Aprendizado

1. **Detecção de palavras novas** — extrai palavras desconhecidas do texto
2. **Associação** — vincula palavras a distorções quando aparecem juntas
3. **Promoção** — após 3 co-ocorrências, palavra vira trigger aprendido
4. **Feedback** — "Isso te ajudou?" ajusta confiança das associações
5. **Persistência** — localStorage (offline) + Neon (logado)

### Respostas Progressivas

| Frequência | Tipo de resposta |
|-----------|-----------------|
| 1-2x | Pool padrão (5 variações por distorção) |
| 3-4x | "Percebi que esse sentimento tem aparecido..." |
| 5-7x | "Que tal tentar algo diferente?" + exercício |
| 8+x | "Considere buscar apoio profissional" + CVV |

### Analisador Clínico

Detecta 4 condições com protocolos específicos:

| Condição | Protocolo de crise |
|----------|-------------------|
| Ansiedade (pânico) | Respiração caixa + 5-4-3-2-1 |
| Depressão (ideação) | Validação + CVV 188 |
| Autismo (meltdown) | Redução sensorial total |
| Esquizofrenia (paranoia) | Âncora física + SAMU 192 |

---

## Mascote Lumi

### Expressões (8 estados)

| Estado | Imagem | Triggers |
|--------|--------|----------|
| Cansada | `Lumi Cansada - Exausta.png` | vazio, exausta, fardo |
| Confusa | `Lumi Confusa - Pensativa.png` | medo, pânico, ansiedade |
| Comemorando | `Lumi Comemorando - Vitoriosa.png` | consegui, vitória |
| Triste | `Lumi Triste - Chorando.png` | chorar, dor, socorro |
| Amorosa | `Lumi Amorosa - Aconchegante.png` | amor, seguro, paz |
| Aliviada | `Lumi Aliviada - Respirando.png` | alívio, calma, passou |
| Brincalhona | `Lumi Brincalhona - Terapêutica.png` | jogar, puzzle |
| Neutra | `Lumi Neutra - Companheira Estática.png` | padrão |

### Comportamento

- Reage à **rota** (desabafo → confusa, respirar → aliviada)
- Reage à **emoção** selecionada no painel
- Reage ao **texto** escrito pelo usuário
- **Debounce** de 6 segundos entre mudanças
- **Ações de redirecionamento** — sugere páginas relevantes
- **Primeiro acesso** — apresentação completa em 5 passos
- **Visitas seguintes** — saudação por horário

---

## SEO e Segurança

### SEO

- Metadata completa com Open Graph + Twitter Cards
- JSON-LD structured data (WebApplication schema)
- Sitemap dinâmico (`/sitemap.xml`)
- `robots.txt` com bloqueio de rotas privadas
- Keywords long-tail em PT-BR
- Google Search Console verification ready
- Imagens otimizadas (AVIF + WebP)

### Security Headers

| Header | Proteção |
|--------|----------|
| HSTS | Força HTTPS |
| X-Frame-Options | Anti-clickjacking |
| X-Content-Type-Options | Anti-MIME sniffing |
| X-XSS-Protection | Anti-XSS refletido |
| Referrer-Policy | Limita referrer |
| Permissions-Policy | Bloqueia câmera/mic/geo |

### Rate Limiting (Middleware)

- Auth: 10 req/min por IP
- Brain: 30 req/min por IP
- Retorna 429 com mensagem amigável

---

## Temas Visuais

| Tema | Fundo | Texto | Uso |
|------|-------|-------|-----|
| Padrão | `#FAFBFD` | `#1e293b` | Uso geral |
| Escuro | `#0f172a` | `#e2e8f0` | Noturno, fotossensibilidade |
| Alto Contraste | `#000000` | `#ffffff` + `#fbbf24` | Daltonismo, baixa visão |

Selecionável em Perfil → salva no localStorage → aplica via `data-theme` no `<html>`.

---

## Estrutura de Pastas

```
src/
├── app/
│   ├── api/
│   │   ├── auth/          # signup, login, logout, me, reset-password, update-profile
│   │   └── brain/         # data, feedback, learn, responses, weekly
│   ├── cadastro/          # Criar conta
│   ├── desabafo/          # Explosão de palavras
│   ├── diario/            # Diário encantado (protegido)
│   ├── login/             # Login
│   ├── perfil/            # Dados do usuário (protegido)
│   ├── recuperar-senha/   # Reset de senha
│   ├── relaxar/           # Puzzle terapêutico
│   ├── respirar/          # Exercícios de respiração
│   ├── globals.css        # Estilos globais + temas
│   ├── layout.tsx         # Layout raiz
│   ├── page.tsx           # Home
│   └── sitemap.ts         # Sitemap dinâmico
├── components/
│   ├── AmbientPlayer.tsx  # Player Lo-Fi YouTube
│   ├── BackButton.tsx     # Botão voltar
│   ├── BaseCard.tsx       # Card anti-overflow
│   ├── BreathingExercise.tsx # Exercícios de respiração
│   ├── ColorPuzzle.tsx    # Puzzle de cores
│   ├── ContextualSuggestion.tsx # Sugestão por emoção
│   ├── DailyTip.tsx       # Dica do dia
│   ├── DiaryBook.tsx      # Diário encantado completo
│   ├── DiarySummary.tsx   # Calendário + sumário
│   ├── Footer.tsx         # Rodapé
│   ├── LayoutWrapper.tsx  # Wrapper de centralização
│   ├── LumiMascot.tsx     # Mascote interativa
│   ├── LumiWelcome.tsx    # Onboarding + saudação
│   ├── MotivationalPhrase.tsx # Frase motivacional
│   ├── Navbar.tsx         # Navegação
│   ├── PageTransition.tsx # Animação de entrada
│   ├── QuickBreath.tsx    # Respiração rápida (home)
│   ├── SelfCareStreak.tsx # Contador de dias
│   ├── SensoryPanel.tsx   # Painel emocional
│   ├── ThemeLoader.tsx    # Carrega tema salvo
│   ├── TimeGreeting.tsx   # Saudação por horário
│   ├── VentSection.tsx    # Seção de desabafo
│   └── WeeklySummary.tsx  # Resumo semanal
├── config/
│   ├── lumiExpressions.ts # Expressões da Lumi
│   └── mediaMapping.ts   # Mapeamento de mídia ambiente
├── context/
│   ├── AppContext.tsx     # Estado emocional + sensory mode
│   └── AuthContext.tsx    # Sessão do usuário
├── hooks/
│   └── useLumiBrain.ts   # Motor de reação da Lumi
└── lib/
    ├── auth.ts           # Cliente de autenticação
    ├── brainEngine.ts    # Motor CBT principal
    ├── brainLearning.ts  # Sistema de aprendizado
    ├── brainResponses.ts # Respostas progressivas
    ├── clinicalAnalyzer.ts # Analisador clínico
    ├── db.ts             # Cliente Neon
    ├── session.ts        # JWT + cookies
    └── sounds.ts         # Efeitos sonoros (Web Audio)
```

---

## Deploy

### Vercel (recomendado)

1. Conectar repositório no [vercel.com](https://vercel.com)
2. Adicionar variáveis de ambiente:
   - `DATABASE_URL`
   - `JWT_SECRET`
3. Deploy automático a cada push

### Outras plataformas

Funciona em qualquer plataforma que suporte Next.js:
- Netlify
- Railway
- AWS Amplify
- Docker (self-hosted)

---

## Licença

Projeto privado. Todos os direitos reservados.

---

## Contato de Crise

Se você ou alguém que conhece está em sofrimento:

- **CVV** — 188 (24h, gratuito, sigilo total)
- **SAMU** — 192
- **Bombeiros** — 193

*Este aplicativo não substitui acompanhamento profissional.*
