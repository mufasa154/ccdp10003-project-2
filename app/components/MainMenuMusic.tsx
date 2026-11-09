"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { isIntroFinished, onIntroFinished } from "./SupercellIntro";

export default function MainMenuMusic() {
  const pathname = usePathname();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [introDone, setIntroDone] = useState(() => isIntroFinished());

  useEffect(() => {
    if (isIntroFinished()) {
      setIntroDone(true);
      return;
    }
    return onIntroFinished(() => setIntroDone(true));
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const shouldPlay = introDone && pathname !== "/play";

    if (!shouldPlay) {
      audio.pause();
      return;
    }

    audio.volume = 0.6;

    const tryPlay = () => {
      if (!audioRef.current) return;
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Wait for first user gesture if autoplay was blocked
        });
      }
    };

    tryPlay();

    const unlock = () => {
      if (audioRef.current && audioRef.current.paused && isIntroFinished() && window.location.pathname !== "/play") {
        void audioRef.current.play().catch(() => {});
      }
    };

    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, [introDone, pathname]);

  return <audio ref={audioRef} src="/main menu music.mp3" loop preload="auto" hidden />;
}

