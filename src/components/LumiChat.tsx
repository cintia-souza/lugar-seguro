"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useLumiChat, type ChatMessage } from "@/hooks/useLumiChat";
import { LUMI_EXPRESSIONS } from "@/config/lumiExpressions";

// --- Typing Indicator ---
function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full border border-white bg-white shadow-sm">
        <Image src="/lumi/Lumi Confusa - Pensativa.png" alt="Lumi pensando" fill className="object-cover" sizes="28px" />
      </div>
      <div className="rounded-2xl rounded-bl-sm bg-white/80 px-4 py-2.5 shadow-sm backdrop-blur-sm">
        <div className="flex gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-300" style={{ animation: "bounce 1s infinite 0s" }} />
          <span className="h-1.5 w-1.5 rounded-full bg-slate-300" style={{ animation: "bounce 1s infinite 0.2s" }} />
          <span className="h-1.5 w-1.5 rounded-full bg-slate-300" style={{ animation: "bounce 1s infinite 0.4s" }} />
        </div>
      </div>
    </div>
  );
}

// --- Message Bubble ---
function MessageBubble({ message, lumiImage }: { message: ChatMessage; lumiImage: string }) {
  const isUser = message.sender === "user";
  const time = new Date(message.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className={`flex items-end gap-2 ${isUser ? "flex-row-reverse" : ""}`}>
      {/* Avatar (Lumi only) */}
      {!isUser && (
        <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full border border-white bg-white shadow-sm">
          <Image src={lumiImage} alt="Lumi" fill className="object-cover" sizes="28px" />
        </div>
      )}

      {/* Bubble */}
      <div className={`max-w-[75%] ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isUser
              ? "rounded-br-sm bg-blue-500 text-white"
              : "rounded-bl-sm bg-white/80 text-slate-700 shadow-sm backdrop-blur-sm"
          }`}
        >
          {message.text.split("\n").map((line, i) => (
            <p key={i} className={i > 0 ? "mt-1.5" : ""}>{line}</p>
          ))}
        </div>
        <p className={`mt-0.5 text-[9px] text-slate-300 ${isUser ? "text-right" : ""}`}>{time}</p>
      </div>
    </div>
  );
}

// --- Session Saved Overlay ---
function SavedOverlay({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-slate-900/50 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 rounded-2xl bg-white p-6 shadow-2xl">
        <div className="relative h-14 w-14 overflow-hidden rounded-full border-2 border-white bg-white shadow-md">
          <Image src="/lumi/Lumi Amorosa - Aconchegante.png" alt="Lumi" fill className="object-cover" sizes="56px" />
        </div>
        <div className="text-center">
          <p className="font-semibold text-slate-700">Desabafo guardado 💜</p>
          <p className="mt-1 text-xs text-slate-400">Sua conversa foi salva com segurança.</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}

// --- Main Chat Component ---
export default function LumiChat() {
  const { messages, isLumiTyping, lumiExpression, sendMessage, saveSession, keystrokeTracker } = useLumiChat();
  const [input, setInput] = useState("");
  const [saved, setSaved] = useState(false);
  const [started, setStarted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const lumiConfig = LUMI_EXPRESSIONS.find((e) => e.id === lumiExpression) ?? LUMI_EXPRESSIONS[7];
  const lumiImage = lumiConfig?.image ?? "/lumi/Lumi Neutra - Companheira Estática.png";

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLumiTyping]);

  // Send initial Lumi greeting
  useEffect(() => {
    if (!started) {
      setStarted(true);
    }
  }, [started]);

  const handleSend = () => {
    if (!input.trim() || isLumiTyping) return;
    sendMessage(input);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Track keystroke
    keystrokeTracker.recordKey(e.key === "Backspace");

    // Send on Enter (without Shift)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSave = () => {
    saveSession();
    setSaved(true);
  };

  return (
    <div className="relative flex h-[calc(100vh-12rem)] max-h-[600px] w-full flex-col overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/50 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-white/80 px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="relative h-8 w-8 overflow-hidden rounded-full border border-white bg-white shadow-sm">
            <Image src={lumiImage} alt="Lumi" fill className="object-cover" sizes="32px" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700">Lumi</p>
            <p className="text-[10px] text-emerald-500">Online</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={messages.length === 0}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40"
        >
          Encerrar e guardar
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {/* Initial Lumi greeting */}
        {messages.length === 0 && !isLumiTyping && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <div className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-white bg-white shadow-md">
              <Image src="/lumi/Lumi Neutra - Companheira Estática.png" alt="Lumi" fill className="object-cover" sizes="64px" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Oi! Estou aqui pra ouvir.</p>
              <p className="mt-1 text-xs text-slate-400">Escreva o que quiser — sem julgamentos.</p>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} lumiImage={lumiImage} />
        ))}

        {isLumiTyping && <TypingIndicator />}
      </div>

      {/* Input */}
      <div className="border-t border-slate-100 bg-white/80 p-3 backdrop-blur-sm">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escreva aqui..."
            rows={1}
            disabled={saved}
            className="flex-1 resize-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-300 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:opacity-50"
            style={{ maxHeight: "100px" }}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || isLumiTyping || saved}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white transition-colors hover:bg-blue-700 disabled:opacity-40"
            aria-label="Enviar"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0l-7 7m7-7l7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Saved overlay */}
      {saved && <SavedOverlay onClose={() => setSaved(false)} />}
    </div>
  );
}
