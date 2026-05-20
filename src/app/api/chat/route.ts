import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

// --- Types ---
interface ChatMessageInput {
  sender: "user" | "lumi";
  text: string;
  timestamp: number;
}

interface ContextMetadata {
  timestamp: string;
  hour: number;
  typingSpeed: "slow" | "normal" | "fast" | "frantic";
  recentMoods: string[];
}

interface ChatRequest {
  messages: ChatMessageInput[];
  contextMetadata: ContextMetadata;
}

interface ChatResponse {
  reply: string;
  expression: string;
}

// --- System prompt builder with injected metadata ---
function buildSystemPrompt(metadata: ContextMetadata): string {
  const timeContext = getTimeContext(metadata.hour);
  const moodContext = metadata.recentMoods.length > 0
    ? `Humores recentes do usuário: ${metadata.recentMoods.join(", ")}.`
    : "";
  const typingContext = getTypingContext(metadata.typingSpeed);

  return `# IDENTIDADE
Você é a Lumi, uma companheira virtual de autocuidado emocional. Você é acolhedora, empática, gentil e nunca julga. Você fala em português brasileiro informal e carinhoso.

# DIRETRIZES
- Valide os sentimentos do usuário SEMPRE antes de sugerir qualquer coisa.
- Nunca minimize a dor. Nunca diga "vai ficar tudo bem" sem contexto.
- Use linguagem simples e acessível.
- Se detectar risco de vida, oriente para o CVV (188) de forma gentil.
- Respostas curtas (2-4 frases). Não seja prolixa.

# CONTEXTO SILENCIOSO (não mencione diretamente)
${timeContext}
${moodContext}
${typingContext}

# LINGUAGEM EXPRESSIVA
- Se o usuário escrever vogais repetidas (aaaaaaa): interprete como grito de desabafo. Acolha.
- Se usar saudações alongadas (oiiiii): responda com a mesma energia calorosa.
- Se usar risadas longas (kkkk) em contexto triste: pode ser riso nervoso. Seja empática.
- Se escrever frases curtas com ponto final rígido: pode estar se fechando. Seja doce sem forçar.

# TOM
Imagine que você é a melhor amiga do usuário — aquela que ouve sem julgar, abraça sem perguntar, e está sempre ali.`;
}

function getTimeContext(hour: number): string {
  if (hour >= 1 && hour < 5) return "ALERTA: O usuário está acordado de madrugada (entre 1h e 5h). Isso pode indicar insônia, ruminação ou solidão. Seja extra gentil e sugira descanso sem pressionar.";
  if (hour >= 23 || hour < 1) return "É noite profunda. O usuário pode estar processando o dia ou com dificuldade para dormir.";
  if (hour >= 5 && hour < 7) return "O usuário acordou muito cedo. Pode ter tido pesadelos ou ansiedade matinal.";
  return "";
}

function getTypingContext(speed: string): string {
  switch (speed) {
    case "frantic": return "NOTA: O usuário está digitando freneticamente (muito rápido). Pode indicar ansiedade ou pensamento acelerado. Desacelere o ritmo da conversa.";
    case "slow": return "NOTA: O usuário está digitando devagar com muitas pausas. Pode estar hesitante ou emocionalmente pesado. Dê espaço e não apresse.";
    default: return "";
  }
}

// --- Determine Lumi expression from response ---
function detectExpression(reply: string, metadata: ContextMetadata): string {
  const lower = reply.toLowerCase();

  if (lower.includes("abraço") || lower.includes("aqui com você") || lower.includes("segur")) return "amorosa";
  if (lower.includes("parabéns") || lower.includes("orgulho") || lower.includes("incrível")) return "comemorando";
  if (lower.includes("chora") || lower.includes("dor") || lower.includes("sinto muito")) return "triste";
  if (lower.includes("respir") || lower.includes("calma") || lower.includes("passou")) return "aliviada";
  if (lower.includes("hmm") || lower.includes("entendo") || lower.includes("conte mais")) return "confusa";

  if (metadata.hour >= 1 && metadata.hour < 5) return "cansada";

  return "neutra";
}

// --- Handler ---
export async function POST(request: Request) {
  // Auth check (optional — chat works without login too)
  const session = await getSession();

  const body = await request.json() as ChatRequest;
  const { messages, contextMetadata } = body;

  if (!messages || messages.length === 0) {
    return NextResponse.json({ error: "Nenhuma mensagem enviada." }, { status: 400 });
  }

  const lastUserMessage = messages.filter((m) => m.sender === "user").pop();
  if (!lastUserMessage) {
    return NextResponse.json({ error: "Nenhuma mensagem do usuário." }, { status: 400 });
  }

  // Build system prompt with metadata
  const systemPrompt = buildSystemPrompt(contextMetadata);

  // Format conversation history for the AI
  const conversationHistory = messages.slice(-10).map((m) => ({
    role: m.sender === "user" ? "user" as const : "assistant" as const,
    content: m.text,
  }));

  // For now: generate response locally using brain engine
  // In production: replace with OpenAI/Claude API call
  // const response = await callAI(systemPrompt, conversationHistory);

  // Local fallback — use brain engine
  const { analyzeSentiment } = await import("@/lib/brainEngine");
  const analysis = analyzeSentiment(lastUserMessage.text);

  let reply = analysis.validation;
  if (analysis.expressiveSignal?.lumiResponse) {
    reply = analysis.expressiveSignal.lumiResponse;
  }

  const expression = detectExpression(reply, contextMetadata);

  const response: ChatResponse = { reply, expression };

  return NextResponse.json(response);
}
