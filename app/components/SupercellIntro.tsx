"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The Supercell logo video, then the Brawl Stars loading screen. Calls onDone
 * when both have finished, and stays a black screen until it's removed, so
 * nothing flashes before the next page appears. Deadline Dash decides when to
 * show it (the first time you leave the game for the shop).
 */
export default function SupercellIntro({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<"supercell" | "brawlstars">("supercell");

  const supercellVideoRef = useRef<HTMLVideoElement>(null);
  const loadingVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
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
  }, []);

  function handleSupercellEnded() {
    setPhase("brawlstars");
    const loadingVideo = loadingVideoRef.current;
    if (!loadingVideo) {
      onDone();
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
    onDone();
  }

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
