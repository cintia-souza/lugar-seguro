"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAppContext } from "@/context/AppContext";
import { getMediaScene, type MediaScene } from "@/config/mediaMapping";

type PlayerState = "loading" | "playing" | "transitioning";

// YouTube IFrame API types
interface YTPlayer {
  setVolume: (vol: number) => void;
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
  destroy: () => void;
}

interface YTPlayerEvent {
  target: YTPlayer;
}

declare global {
  interface Window {
    YT?: {
      Player: new (el: string, config: {
        videoId: string;
        playerVars: Record<string, string | number>;
        events: {
          onReady?: (e: YTPlayerEvent) => void;
          onStateChange?: (e: { data: number }) => void;
        };
      }) => YTPlayer;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

function loadYTApi(): Promise<void> {
  return new Promise((resolve) => {
    if (window.YT) { resolve(); return; }
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    window.onYouTubeIframeAPIReady = () => resolve();
    document.head.appendChild(tag);
  });
}

export default function AmbientPlayer() {
  const { emotionalState } = useAppContext();
  const [scene, setScene] = useState<MediaScene>(getMediaScene(emotionalState));
  const [playerState, setPlayerState] = useState<PlayerState>("loading");
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(8);
  const [isVisible, setIsVisible] = useState(true);
  const playerRef = useRef<YTPlayer | null>(null);
  const containerIdRef = useRef("yt-player");
  const prevEmotionRef = useRef(emotionalState);

  // Initialize YouTube player
  useEffect(() => {
    let mounted = true;

    async function init() {
      await loadYTApi();
      if (!mounted || !window.YT) return;

      playerRef.current = new window.YT.Player(containerIdRef.current, {
        videoId: scene.media.videoId,
        playerVars: {
          autoplay: 1,
          loop: 1,
          mute: 1,
          controls: 0,
          showinfo: 0,
          rel: 0,
          modestbranding: 1,
          playlist: scene.media.videoId,
        },
        events: {
          onReady: (e: YTPlayerEvent) => {
            e.target.setVolume(volume);
            e.target.mute();
            setPlayerState("playing");
          },
        },
      });
    }

    init();

    return () => { mounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle emotion change
  useEffect(() => {
    if (emotionalState === prevEmotionRef.current) return;
    prevEmotionRef.current = emotionalState;

    const newScene = getMediaScene(emotionalState);
    setScene(newScene);
    setVolume(newScene.media.defaultVolume);

    // Reload player with new video
    if (playerRef.current) {
      playerRef.current.destroy();
      playerRef.current = null;
    }

    setPlayerState("loading");

    // Small delay then recreate
    setTimeout(() => {
      if (!window.YT) return;
      playerRef.current = new window.YT.Player(containerIdRef.current, {
        videoId: newScene.media.videoId,
        playerVars: {
          autoplay: 1,
          loop: 1,
          mute: isMuted ? 1 : 0,
          controls: 0,
          showinfo: 0,
          rel: 0,
          modestbranding: 1,
          playlist: newScene.media.videoId,
        },
        events: {
          onReady: (e: YTPlayerEvent) => {
            e.target.setVolume(newScene.media.defaultVolume);
            if (isMuted) e.target.mute();
            setPlayerState("playing");
          },
        },
      });
    }, 500);
  }, [emotionalState, isMuted]);

  // Volume change
  const handleVolumeChange = useCallback((newVol: number) => {
    setVolume(newVol);
    if (playerRef.current) {
      playerRef.current.setVolume(newVol);
    }
  }, []);

  // Mute toggle
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (playerRef.current) {
        if (next) {
          playerRef.current.mute();
        } else {
          playerRef.current.unMute();
          playerRef.current.setVolume(volume);
        }
      }
      return next;
    });
  }, [volume]);

  const toggleVisibility = () => setIsVisible((prev) => !prev);

  if (!isVisible) {
    return (
      <button
        type="button"
        onClick={toggleVisibility}
        className="rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-sm transition-all hover:shadow-md"
        aria-label="Mostrar player ambiente"
      >
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
          <span>Abrir ambiente</span>
        </div>
      </button>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white/90 shadow-sm" role="region" aria-label={scene.media.label}>
      {/* Video container */}
      <div className={`relative aspect-video overflow-hidden ${scene.loadingBg}`}>
        {playerState === "loading" && (
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-blue-500" />
          </div>
        )}

        {/* YouTube player target */}
        <div id={containerIdRef.current} className="absolute inset-0 h-full w-full" />

        {/* Overlay for controls */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/20 to-transparent" />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 px-4 py-2.5">
        {/* Mute */}
        <button
          type="button"
          onClick={toggleMute}
          aria-label={isMuted ? "Ativar som" : "Silenciar"}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100"
        >
          {isMuted ? (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          ) : (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          )}
        </button>

        {/* Volume slider — now actually controls the player */}
        <input
          type="range"
          min={0}
          max={100}
          value={volume}
          onChange={(e) => handleVolumeChange(Number(e.target.value))}
          aria-label="Volume"
          className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-slate-200 accent-blue-500 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500"
        />

        <span className="min-w-[2rem] text-right text-[10px] text-slate-400">{volume}%</span>

        {/* Minimize */}
        <button
          type="button"
          onClick={toggleVisibility}
          aria-label="Minimizar"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Label */}
      <div className="border-t border-slate-50 px-4 py-2">
        <p className="text-[10px] text-slate-400">{scene.media.ambientDescription}</p>
      </div>
    </div>
  );
}
