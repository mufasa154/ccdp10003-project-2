"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * SK Chan's main menu music. Loops on every shop page and stays quiet on "/",
 * where Deadline Dash and the Supercell intro have their own sound (so it
 * starts as the intro hands over to Timeline). Browsers only allow sound after
 * a click or key press, so if it's blocked it starts on the next one.
 */
export default function MainMenuMusic() {
  const pathname = usePathname();
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (pathname === "/") {
      audio.pause();
      return;
    }

    audio.volume = 0.15;
    void audio.play().catch(() => {
      // Blocked until the user clicks or presses a key (see below)
    });

    const unlock = () => {
      if (audio.paused && window.location.pathname !== "/") {
        void audio.play().catch(() => {});
      }
    };
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, [pathname]);

  return <audio ref={audioRef} src="/main menu music.mp3" loop preload="auto" hidden />;
}
