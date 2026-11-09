"use client";

import { useEffect } from "react";
import type { GameStats } from "./game";

function formatTime(t: number) {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function Trophy({ className = "" }: { className?: string }) {
  return (
    <svg className={`res-trophy ${className}`} viewBox="0 0 40 40" aria-hidden="true">
      <path
        d="M10 5h20v4h6c0 7-3 11-8 12-1 3-3 5-6 5v4h6v5H12v-5h6v-4c-3 0-5-2-6-5-5-1-8-5-8-12h6z"
        fill="#ffb400"
        stroke="#000"
        strokeWidth="2.6"
        strokeLinejoin="round"
      />
      <path d="M14 9h4v9h-4z" fill="#ffe27a" />
    </svg>
  );
}

function Coin() {
  return (
    <svg className="res-mini" viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="10" cy="10" r="8" fill="#ffb21e" stroke="#000" strokeWidth="2" />
      <circle cx="10" cy="10" r="4.5" fill="none" stroke="#c66a00" strokeWidth="1.6" />
    </svg>
  );
}

function Credit() {
  return (
    <svg className="res-mini" viewBox="0 0 20 20" aria-hidden="true">
      <rect x="2" y="3" width="16" height="14" rx="3" fill="#5ee3ff" stroke="#000" strokeWidth="2" />
      <circle cx="10" cy="10" r="3.5" fill="#fff" stroke="#000" strokeWidth="1.4" />
    </svg>
  );
}

/** Post-match results screen, Brawl-style: DEFEATED (the deadlines always win). */
export default function EndScreen({
  stats,
  onPlayAgain,
  onExit,
}: {
  stats: GameStats;
  onPlayAgain: () => void;
  onExit: () => void;
}) {
  useEffect(() => {
    const audio = new Audio("/brawl-stars-defeat-sound.mp3");
    audio.volume = 0.7;
    void audio.play().catch(() => {});
    return () => {
      audio.pause();
    };
  }, []);

  return (
    <div className="res">
      <div className="res-fade" />

      {/* Top-left: placement + trophies */}
      <div className="res-head">
        <div className="bs-text res-title">DEFEATED</div>
        <div className="res-row">
          <Trophy />
          <span className="bs-text res-plus">+{stats.kills}</span>
          <span className="bs-text res-ribbon">TAKEDOWNS</span>
          <Trophy className="res-trophy--small" />
          <span className="bs-text res-plus res-plus--small">+{stats.gems}</span>
        </div>
        <div className="res-pill">
          <Trophy className="res-trophy--small" />
          <span className="bs-text">{stats.gems}/1000</span>
        </div>
      </div>

      {/* Left: quest card */}
      <div className="res-quest">
        <div className="bs-text res-quest-tag">MEGA QUEST</div>
        <div className="bs-text res-quest-title">SUBMIT 100000 ASSIGNMENTS ON TIME</div>
        <div className="res-quest-bottom">
          <span className="bs-text res-quest-gain">+{stats.kills}</span>
          <span className="bs-text res-quest-progress">{stats.kills}/100000</span>
          <Coin />
          <span className="bs-text res-quest-reward">500</span>
          <Credit />
          <span className="bs-text res-quest-reward">1500</span>
        </div>
      </div>

      {/* Centre: David Shea pops up out of the floor */}
      <div className="res-rays" />
      <div className="res-hero">
        <picture className="res-hero-pic">
          <source srcSet="/david_new.png" type="image/png" />
          <img src="/david_new.jpg" alt="David Shea" draggable={false} />
        </picture>
        <div className="bs-text res-hero-name">DAVID SHEA</div>
      </div>

      {/* Right: rank badge */}
      <div className="res-rank">
        <div className="res-badge">
          <img src="/play/player-icon.png" alt="" draggable={false} />
          <span className="bs-text res-badge-tier">III</span>
        </div>
        <div className="bs-text res-rank-plus">+28</div>
        <div className="res-pill res-pill--right">
          <Trophy className="res-trophy--small" />
          <span className="bs-text">88171/88200</span>
        </div>
        <div className="bs-text res-survived">SURVIVED {formatTime(stats.time)}</div>
      </div>

      <button type="button" className="res-share" aria-label="Share">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 13v6h12v-6M12 4v11M7.5 8.5 12 4l4.5 4.5" fill="none" stroke="#000" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Bottom-right buttons */}
      <div className="res-buttons">
        <button type="button" className="bs-text res-btn res-btn--yellow" onClick={onPlayAgain}>
          PLAY AGAIN
        </button>
        <button type="button" className="bs-text res-btn res-btn--blue" onClick={onExit}>
          EXIT
        </button>
      </div>
    </div>
  );
}
