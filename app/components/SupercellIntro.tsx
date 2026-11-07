"use client";

import { useEffect, useRef, useState } from "react";

// Track within the client session so navigating back to "/" from "/assignments"
// doesn't replay the intro, while a full page load/refresh always plays it.
let introPlayedThisLoad = false;

export default function SupercellIntro() {
  const [phase, setPhase] = useState<"supercell" | "brawlstars" | "done">(
    introPlayedThisLoad ? "done" : "supercell"
  );

  const supercellVideoRef = useRef<HTMLVideoElement>(null);
  const loadingVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (introPlayedThisLoad) {
      setPhase("done");
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
  }, []);

  function handleSupercellEnded() {
    setPhase("brawlstars");
    const loadingVideo = loadingVideoRef.current;
    if (!loadingVideo) {
      introPlayedThisLoad = true;
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
    introPlayedThisLoad = true;
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
