// Matriz de Mídia Ambiente — Mapeamento de estados emocionais para cenários audiovisuais
import type { EmotionalState } from "@/context/AppContext";

export interface MediaSource {
  /** YouTube video ID for the lofi/ambient visual loop */
  videoId: string;
  /** Descriptive label for accessibility */
  label: string;
  /** Tags for categorization */
  tags: string[];
  /** Default volume 0-100 */
  defaultVolume: number;
  /** Whether to start muted */
  startMuted: boolean;
  /** Ambient sound description */
  ambientDescription: string;
}

export interface MediaScene {
  media: MediaSource;
  /** Background color while loading */
  loadingBg: string;
  /** Accent color for controls */
  accent: string;
}

const MEDIA_SCENES: Record<EmotionalState, MediaScene> = {
  anxious: {
    media: {
      videoId: "mPZkdNFkNps",
      label: "Chuva calma na janela com batidas lo-fi suaves",
      tags: ["chuva", "lofi", "calma", "ansiedade"],
      defaultVolume: 8,
      startMuted: true,
      ambientDescription: "Som de chuva suave com música lo-fi para desacelerar",
    },
    loadingBg: "bg-slate-100",
    accent: "blue",
  },

  sad: {
    media: {
      videoId: "rPjez8z61rI",
      label: "Cafeteria aconchegante com lareira e lo-fi melódico",
      tags: ["cafeteria", "lareira", "aconchego", "depressão"],
      defaultVolume: 8,
      startMuted: true,
      ambientDescription: "Ambiente de cafeteria com lareira e música reconfortante",
    },
    loadingBg: "bg-amber-50",
    accent: "amber",
  },

  overwhelmed: {
    media: {
      videoId: "t0UMFnVBHjQ",
      label: "Céu estrelado minimalista com ruído branco suave",
      tags: ["estrelas", "minimalista", "silêncio", "sobrecarga"],
      defaultVolume: 5,
      startMuted: true,
      ambientDescription: "Céu noturno com mínimo estímulo visual e sonoro",
    },
    loadingBg: "bg-indigo-950",
    accent: "indigo",
  },

  calm: {
    media: {
      videoId: "lTRiuFIWV54",
      label: "Campo ensolarado com pássaros e brisa",
      tags: ["natureza", "sol", "pássaros", "calma"],
      defaultVolume: 8,
      startMuted: true,
      ambientDescription: "Paisagem natural com sons de pássaros e brisa leve",
    },
    loadingBg: "bg-emerald-50",
    accent: "emerald",
  },

  angry: {
    media: {
      videoId: "mPZkdNFkNps",
      label: "Tempestade distante com batidas lo-fi profundas",
      tags: ["tempestade", "lofi", "profundo", "raiva"],
      defaultVolume: 8,
      startMuted: true,
      ambientDescription: "Tempestade distante para canalizar a energia",
    },
    loadingBg: "bg-slate-200",
    accent: "slate",
  },

  numb: {
    media: {
      videoId: "rPjez8z61rI",
      label: "Ambiente aquecido com tons suaves e lo-fi gentil",
      tags: ["aconchego", "calor", "gentil", "entorpecimento"],
      defaultVolume: 5,
      startMuted: true,
      ambientDescription: "Ambiente morno e acolhedor para reconectar",
    },
    loadingBg: "bg-orange-50",
    accent: "orange",
  },

  neutral: {
    media: {
      videoId: "lTRiuFIWV54",
      label: "Paisagem tranquila com lo-fi ambiente",
      tags: ["natureza", "neutro", "lofi"],
      defaultVolume: 5,
      startMuted: true,
      ambientDescription: "Cenário natural relaxante",
    },
    loadingBg: "bg-slate-50",
    accent: "blue",
  },
};

export function getMediaScene(emotion: EmotionalState): MediaScene {
  return MEDIA_SCENES[emotion];
}

export function getYouTubeEmbedUrl(videoId: string, muted: boolean): string {
  const params = new URLSearchParams({
    autoplay: "1",
    loop: "1",
    mute: muted ? "1" : "0",
    controls: "0",
    showinfo: "0",
    rel: "0",
    modestbranding: "1",
    playlist: videoId,
  });
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}
