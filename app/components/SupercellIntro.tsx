"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// Track within the client session so navigating back to "/" from "/assignments"
// doesn't replay the intro, while a full page load/refresh always plays it.
let introPlayedThisLoad = false;
const introListeners = new Set<() => void>();

export function isIntroFinished() {
  return introPlayedThisLoad;
}

export function onIntroFinished(listener: () => void) {
  introListeners.add(listener);
  return () => {
    introListeners.delete(listener);
  };
}

function markIntroFinished() {
  if (introPlayedThisLoad) return;
  introPlayedThisLoad = true;
  introListeners.forEach((fn) => fn());
}

export default function SupercellIntro() {
  const router = useRouter();
  const [phase, setPhase] = useState<"supercell" | "brawlstars" | "done">(
    introPlayedThisLoad ? "done" : "supercell"
  );

  const supercellVideoRef = useRef<HTMLVideoElement>(null);
  const loadingVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Prefetch all routes and game sprites immediately on website load
    router.prefetch("/play");
    router.prefetch("/assignments");
    router.prefetch("/gems");
    for (const src of [
      "/gem.png",
      "/chest.png",
      "/chestopen.png",
      "/play/david-shea.png",
      "/play/david-shea-full.png",
      "/play/goblin.png",
    ]) {
      const img = new Image();
      img.src = src;
    }

    if (introPlayedThisLoad) {
      return;
    }

    const video = supercellVideoRef.current;
    if (!video) return;

    video.muted = false;
    video.volume = 1;

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch((err: unknown) => {
        // Only if the browser strictly blocks unmuted autoplay (NotAllowedError),
        // start muted and unmute on the first user action.
        if (err instanceof DOMException && err.name === "NotAllowedError") {
          video.muted = true;
          void video.play();

          const unlockAudio = () => {
            if (supercellVideoRef.current) {
              supercellVideoRef.current.muted = false;
              supercellVideoRef.current.volume = 1;
              void supercellVideoRef.current.play();
            }
            if (loadingVideoRef.current) {
              loadingVideoRef.current.muted = false;
              loadingVideoRef.current.volume = 1;
            }
          };

          window.addEventListener("pointerdown", unlockAudio, { once: true });
          window.addEventListener("keydown", unlockAudio, { once: true });
        }
      });
    }
  }, [router]);

  function handleSupercellEnded() {
    setPhase("brawlstars");
    const loadingVideo = loadingVideoRef.current;
    if (!loadingVideo) {
      markIntroFinished();
      setPhase("done");
      return;
    }

    loadingVideo.muted = false;
    loadingVideo.volume = 1;

    const playPromise = loadingVideo.play();
    if (playPromise !== undefined) {
      playPromise.catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "NotAllowedError") {
          loadingVideo.muted = true;
          void loadingVideo.play();
        }
      });
    }
  }

  function handleLoadingEnded() {
    markIntroFinished();
    setPhase("done");
  }

  if (phase === "done") return null;

  return (
    <div className="supercell-intro" role="presentation">
      <video
        ref={supercellVideoRef}
        className="supercell-intro-video"
        src="/supercell-intro.mp4#t=2.4"
        playsInline
        preload="auto"
        hidden={phase !== "supercell"}
        onEnded={handleSupercellEnded}
      />

      <video
        ref={loadingVideoRef}
        className="brawlstars-loading-video"
        src="/loading-screen.mp4"
        playsInline
        preload="auto"
        hidden={phase !== "brawlstars"}
        onEnded={handleLoadingEnded}
      />
    </div>
  );
}
