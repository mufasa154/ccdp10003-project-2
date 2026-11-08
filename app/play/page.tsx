"use client";

import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Paywall from "../components/Paywall";
import EndScreen from "./EndScreen";
import StarDrop from "./StarDrop";
import { Game, H, W, screenToWorld, type GameStats, type Input } from "./game";

// "locked" = frozen behind the pay wall because you tried to shoot with no ammo
// "stardrop" = the single star drop you get after pressing EXIT on the results screen
type Screen = "start" | "playing" | "paused" | "over" | "locked" | "stardrop";

export default function PlayPage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const inputRef = useRef<Input>({ keys: new Set(), mouse: { x: W / 2, y: 0 }, mouseDown: false, clicked: false });
  const screenRef = useRef<Screen>("start");

  const [screen, setScreenState] = useState<Screen>("start");
  const [stats, setStats] = useState<GameStats>({ time: 0, gems: 0, kills: 0 });
  const [paywallOpen, setPaywallOpen] = useState(false);

  function setScreen(s: Screen) {
    screenRef.current = s;
    setScreenState(s);
  }

  // Next.js keeps pages you leave alive in the background (React <Activity>), so
  // coming back would show whatever screen you left on (e.g. the goblin).
  // Reset to the start screen whenever this page is hidden.
  useLayoutEffect(() => {
    return () => {
      screenRef.current = "start";
      setScreenState("start");
      setPaywallOpen(false);
    };
  }, []);

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const game = new Game();
    gameRef.current = game;

    let raf = 0;
    let stopped = false;
    let last = performance.now();
    const frame = (now: number) => {
      if (stopped) return;
      // Clamp the step so a background tab doesn't teleport everything
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (screenRef.current === "locked") {
        // Behind the pay wall every enemy keeps crawling towards you
        game.creep(dt);
        if (game.over) {
          setPaywallOpen(false);
          setStats(game.stats());
          setScreen("over");
        }
      } else if (screenRef.current === "playing") {
        game.update(dt, inputRef.current);
        if (game.wantsAmmo) {
          // Every shot needs to be paid for first
          inputRef.current.mouseDown = false;
          inputRef.current.clicked = false;
          inputRef.current.keys.clear();
          setScreen("locked");
          setPaywallOpen(true);
        } else if (game.over) {
          setStats(game.stats());
          setScreen("over");
        }
      }
      game.draw(ctx);
      raf = requestAnimationFrame(frame);
    };

    // Draw the first frame once the Supercell font is ready
    // (the `stopped` flag also covers the case where we unmount before the font loads)
    document.fonts.load('40px "Supercell-Magic"').finally(() => {
      if (stopped) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    });
    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
    };
  }, []);

  // Keyboard + mouse
  useEffect(() => {
    const input = inputRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === "escape") {
        if (screenRef.current === "playing") setScreen("paused");
        else if (screenRef.current === "paused") setScreen("playing");
        return;
      }
      if (["w", "a", "s", "d", " ", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) {
        e.preventDefault();
        input.keys.add(key);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => input.keys.delete(e.key.toLowerCase());
    const toGame = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      // Undo the camera tilt so you aim at the spot under the cursor
      const world = screenToWorld(
        ((e.clientX - rect.left) / rect.width) * W,
        ((e.clientY - rect.top) / rect.height) * H
      );
      input.mouse.x = world.x;
      input.mouse.y = world.y;
    };
    const onDown = (e: PointerEvent) => {
      toGame(e);
      input.mouseDown = true;
      input.clicked = true;
    };
    const onUp = () => {
      input.mouseDown = false;
    };
    const onBlur = () => {
      input.keys.clear();
      input.mouseDown = false;
      if (screenRef.current === "playing") setScreen("paused");
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("pointermove", toGame);
    canvas.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("pointermove", toGame);
      canvas.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  function start() {
    gameRef.current?.reset();
    inputRef.current.mouseDown = false;
    inputRef.current.clicked = false;
    setScreen("playing");
  }

  function handleClosePaywall() {
    setPaywallOpen(false);
    if (screenRef.current === "locked") {
      // "Purchase" complete: hand over an ammo pack and carry on
      gameRef.current?.buyAmmo();
      inputRef.current.mouseDown = false;
      inputRef.current.clicked = false;
      setScreen("playing");
    } else if (screenRef.current === "stardrop") {
      router.push("/");
    }
  }

  return (
    <div className="stage">
      <canvas ref={canvasRef} className="play-canvas" width={W} height={H} />

      {(screen === "start" || screen === "paused") && (
        <div className="play-overlay" inert={paywallOpen}>
          {screen === "start" && (
            <div className="play-panel">
              <div className="bs-text play-title">DEADLINE DASH</div>
              <div className="bs-text play-sub">
                DEADLINES ARE COMING. SHOOT THEM BEFORE THEY GET YOU.
              </div>
              <div className="play-controls">
                <div className="bs-text"><span className="play-key">WASD</span> MOVE</div>
                <div className="bs-text"><span className="play-key">MOUSE</span> AIM</div>
                <div className="bs-text"><span className="play-key">CLICK</span> SHOOT*</div>
                <div className="bs-text"><span className="play-key">ESC</span> PAUSE</div>
              </div>
              <div className="bs-text play-fineprint">*AMMO SOLD SEPARATELY</div>
              <div className="play-buttons">
                <button type="button" className="bs-text play-btn play-btn--yellow" onClick={start}>
                  PLAY
                </button>
                <button type="button" className="bs-text play-btn play-btn--blue" onClick={() => router.push("/")}>
                  SHOP
                </button>
              </div>
            </div>
          )}

          {screen === "paused" && (
            <div className="play-panel">
              <div className="bs-text play-title">PAUSED</div>
              <div className="play-buttons">
                <button type="button" className="bs-text play-btn play-btn--yellow" onClick={() => setScreen("playing")}>
                  RESUME
                </button>
                <button type="button" className="bs-text play-btn play-btn--blue" onClick={() => router.push("/")}>
                  QUIT
                </button>
              </div>
            </div>
          )}

        </div>
      )}

      {screen === "over" && (
        <EndScreen stats={stats} onPlayAgain={start} onExit={() => setScreen("stardrop")} />
      )}

      {screen === "stardrop" && <StarDrop onOpenPaywall={() => setPaywallOpen(true)} />}

      <Paywall isOpen={paywallOpen} onClose={handleClosePaywall} />
    </div>
  );
}
