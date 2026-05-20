-- =============================================================
-- Meu Lugarzinho — Neon PostgreSQL Schema
-- =============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================
-- USERS
-- =============================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_users_email ON users(email);

-- =============================================================
-- DIARIES
-- =============================================================
CREATE TABLE diaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_encrypted BYTEA NOT NULL,
  iv BYTEA NOT NULL,
  emotional_state TEXT NOT NULL CHECK (emotional_state IN (
    'calm', 'anxious', 'sad', 'overwhelmed', 'angry', 'numb', 'neutral'
  )),
  word_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_diaries_user_date ON diaries(user_id, created_at DESC);

-- =============================================================
-- VENT HISTORY
-- =============================================================
CREATE TABLE vent_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  response_encrypted BYTEA NOT NULL,
  iv BYTEA NOT NULL,
  sentiment_valence TEXT NOT NULL CHECK (sentiment_valence IN ('negativo', 'neutro', 'misto')),
  intensity NUMERIC(3,2) NOT NULL CHECK (intensity BETWEEN 0 AND 1),
  distortion_types TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_vent_user_date ON vent_history(user_id, created_at DESC);

-- =============================================================
-- EMOTION LOGS (calendar)
-- =============================================================
CREATE TABLE emotion_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
  emotional_state TEXT NOT NULL CHECK (emotional_state IN (
    'calm', 'anxious', 'sad', 'overwhelmed', 'angry', 'numb', 'neutral'
  )),
  UNIQUE(user_id, logged_date)
);

CREATE INDEX idx_emotion_user_date ON emotion_logs(user_id, logged_date DESC);

-- =============================================================
-- BRAIN LEARNING — Palavras aprendidas por usuário
-- =============================================================
CREATE TABLE learned_words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  associated_distortion TEXT NOT NULL,
  confidence NUMERIC(3,2) DEFAULT 0.4 CHECK (confidence BETWEEN 0 AND 1),
  seen_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, word)
);

CREATE INDEX idx_learned_user ON learned_words(user_id, confidence DESC);

-- =============================================================
-- BRAIN COOCCURRENCES — Associações de palavras
-- =============================================================
CREATE TABLE word_cooccurrences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  distortion TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_cooccur_user_word ON word_cooccurrences(user_id, word);

-- =============================================================
-- BRAIN FEEDBACK — Feedback do usuário sobre respostas
-- =============================================================
CREATE TABLE brain_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  distortion TEXT NOT NULL,
  helpful BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_feedback_user ON brain_feedback(user_id, created_at DESC);

-- =============================================================
-- USER PHRASES — Frases do usuário para aprendizado de respostas
-- =============================================================
CREATE TABLE user_phrases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text_snippet TEXT NOT NULL,
  distortion TEXT NOT NULL,
  keywords TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_phrases_user ON user_phrases(user_id, distortion, created_at DESC);

-- =============================================================
-- DIARY SESSIONS — Sessões de chat/diário encerradas
-- =============================================================
CREATE TABLE diary_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  end_time TIMESTAMPTZ,
  primary_mood TEXT NOT NULL DEFAULT 'neutral',
  vocal_intensity TEXT NOT NULL DEFAULT 'calmo',
  metadata JSONB DEFAULT '{}',
  message_count INTEGER DEFAULT 0
);

CREATE INDEX idx_sessions_user ON diary_sessions(user_id, created_at DESC);

-- =============================================================
-- DIARY MESSAGES — Mensagens individuais de cada sessão
-- =============================================================
CREATE TABLE diary_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES diary_sessions(id) ON DELETE CASCADE,
  sender TEXT NOT NULL CHECK (sender IN ('user', 'lumi')),
  message_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_messages_session ON diary_messages(session_id, created_at ASC);
