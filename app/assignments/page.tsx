"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type CSSProperties, type MouseEvent } from "react";
import Paywall from "../components/Paywall";

type HotspotStyle = CSSProperties & {
  "--x": number;
  "--y": number;
  "--w": number;
  "--h": number;
};

interface AssignmentStep {
  step: number;
  variant: "purple" | "gold";
  title: string;
  artType: "box" | "icon";
  extraBadge?: string;
  quantity?: number;
  oldPrice?: number;
  price?: number;
  isFree?: boolean;
}

const ASSIGNMENT_STEPS: AssignmentStep[] = [
  {
    step: 1,
    variant: "purple",
    title: "ASSIGNMENT 1 BRIEF",
    artType: "box",
    extraBadge: "34%\nEXTRA",
    oldPrice: 199,
    price: 149,
  },
  {
    step: 2,
    variant: "purple",
    title: "MARKING RUBRIC",
    artType: "box",
    extraBadge: "34%\nEXTRA",
    oldPrice: 199,
    price: 149,
  },
  {
    step: 3,
    variant: "gold",
    title: "SAMPLE HD ESSAY",
    artType: "box",
    isFree: true,
  },
  {
    step: 4,
    variant: "gold",
    title: "TURNITIN BADGE",
    artType: "icon",
    isFree: true,
  },
  {
    step: 5,
    variant: "purple",
    title: "48HR EXTENSION",
    artType: "box",
    quantity: 2,
    oldPrice: 398,
    price: 248,
  },
];

function CoffinBoxArt() {
  return (
    <svg viewBox="0 0 140 125" aria-hidden="true">
      {/* Top handle */}
      <path
        d="M46 24 C46 10, 94 10, 94 24 L84 28 C84 18, 56 18, 56 28 Z"
        fill="#39f0ba"
        stroke="#000"
        strokeWidth="5"
        strokeLinejoin="round"
      />
      {/* Main 3D box body */}
      <polygon
        points="16,38 92,28 124,42 120,104 90,116 20,102"
        fill="#1dd39b"
        stroke="#000"
        strokeWidth="5.5"
        strokeLinejoin="round"
      />
      {/* Front face */}
      <polygon
        points="18,40 90,32 88,114 20,102"
        fill="#2df2b5"
        stroke="#000"
        strokeWidth="4.5"
        strokeLinejoin="round"
      />
      {/* Right side face */}
      <polygon
        points="90,32 124,42 120,104 88,114"
        fill="#16a982"
        stroke="#000"
        strokeWidth="4.5"
        strokeLinejoin="round"
      />
      {/* Purple metal straps */}
      <polygon
        points="14,42 92,32 92,48 15,56"
        fill="#9a5bff"
        stroke="#000"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <polygon
        points="22,28 36,26 34,106 20,103"
        fill="#8c49ff"
        stroke="#000"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <polygon
        points="76,24 90,22 88,114 74,111"
        fill="#8c49ff"
        stroke="#000"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      {/* Angry cross-eyes */}
      <polygon points="39,58 55,66 51,74 35,66" fill="#000" />
      <polygon points="55,58 39,66 43,74 59,66" fill="#000" />
      <polygon points="57,58 73,66 69,74 53,66" fill="#000" />
      <polygon points="73,58 57,66 61,74 77,66" fill="#000" />
      <circle cx="44" cy="63" r="2.2" fill="#ffe600" />
      <circle cx="66" cy="63" r="2.2" fill="#ffe600" />
      {/* Gold side lock */}
      <ellipse
        cx="114"
        cy="74"
        rx="9"
        ry="13"
        fill="#ffcf26"
        stroke="#000"
        strokeWidth="4"
      />
      <circle cx="115" cy="74" r="4" fill="#5e2a00" />
    </svg>
  );
}

function PlayerIconArt() {
  return (
    <svg viewBox="0 0 120 120" aria-hidden="true">
      <rect
        x="8"
        y="8"
        width="104"
        height="104"
        rx="6"
        fill="#111827"
        stroke="#000"
        strokeWidth="6"
      />
      {/* Diagonal neon background */}
      <polygon points="12,12 108,12 108,76 12,108" fill="#46c915" />
      <polygon points="12,108 108,68 108,108" fill="#0ea5e9" />
      {/* Glowing skull emblem */}
      <circle
        cx="56"
        cy="54"
        r="32"
        fill="#a3ff12"
        stroke="#000"
        strokeWidth="5.5"
      />
      <circle
        cx="54"
        cy="54"
        r="24"
        fill="#1d3b1a"
        stroke="#000"
        strokeWidth="4"
      />
      <ellipse cx="45" cy="52" rx="7" ry="9" fill="#e2ff44" />
      <ellipse cx="64" cy="55" rx="6" ry="7" fill="#e2ff44" />
      {/* Cyan energy splash */}
      <path
        d="M66 76 C78 68, 96 72, 102 86 C94 98, 72 102, 58 94 Z"
        fill="#38bdf8"
        stroke="#000"
        strokeWidth="4.5"
      />
    </svg>
  );
}

function GemIcon() {
  return (
    <svg className="step-gem-icon" viewBox="0 0 36 36" aria-hidden="true">
      <circle cx="18" cy="18" r="16" fill="#22c55e" stroke="#000" strokeWidth="3" />
      <polygon points="18,5 28,13 24,28 12,28 8,13" fill="#86efac" />
      <polygon points="18,9 25,15 22,25 14,25 11,15" fill="#bef264" />
    </svg>
  );
}

function StepArrow() {
  return (
    <svg className="step-arrow" viewBox="0 0 46 64" aria-hidden="true">
      <polygon
        points="4,20 22,20 22,6 42,32 22,58 22,44 4,44"
        fill="#ffffff"
        stroke="#000000"
        strokeWidth="4.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function AssignmentsPage() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const openerRef = useRef<HTMLButtonElement | null>(null);

  function openPaywall(event: MouseEvent<HTMLButtonElement>) {
    openerRef.current = event.currentTarget;
    setIsOpen(true);
  }

  function handleClosePaywall() {
    setIsOpen(false);
    openerRef.current?.focus();
  }

  return (
    <div className="stage">
      <img src="/shop.png" alt="Brawl Stars style shop screen" />

      <div className="assignments-overlay" inert={isOpen}>
        <button
          type="button"
          className="reward-chances"
          onClick={openPaywall}
          aria-label="Reward chances"
        >
          <span className="bs-text reward-chances-label">REWARD CHANCES</span>
          <span className="bs-text reward-chances-icon">?</span>
        </button>

        <div className="steps-track">
          {ASSIGNMENT_STEPS.map((item, index) => (
            <div className="step-item" key={item.step}>
              <button
                type="button"
                className={`step-card step-card--${item.variant}`}
                onClick={() => router.push("/gems")}
                aria-label={`Step ${item.step}: ${item.title}`}
              >
                <div className="step-card-header">
                  <span className="bs-text step-unskew">STEP {item.step}</span>
                </div>

                <div className="step-card-body">
                  <div className="step-unskew">
                    <div className="bs-text step-item-title">{item.title}</div>
                    <div className="step-art">
                      {item.artType === "box" ? <CoffinBoxArt /> : <PlayerIconArt />}
                    </div>
                    {item.quantity && (
                      <div className="bs-text step-qty-pill">{item.quantity}</div>
                    )}
                  </div>

                  {item.extraBadge && (
                    <div className="bs-text step-extra-badge">
                      {item.extraBadge.split("\n").map((line, i) => (
                        <div key={i}>{line}</div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="step-card-footer">
                  {item.isFree ? (
                    <span className="bs-text step-unskew step-free">FREE</span>
                  ) : (
                    <div
                      className="step-unskew"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.45cqw",
                      }}
                    >
                      {item.oldPrice && (
                        <span className="bs-text step-old-price">{item.oldPrice}</span>
                      )}
                      <GemIcon />
                      <span className="bs-text step-price">{item.price}</span>
                    </div>
                  )}
                </div>
              </button>

              {index < ASSIGNMENT_STEPS.length - 1 && <StepArrow />}
            </div>
          ))}
        </div>
      </div>

      <div className="shop-buttons" id="shop-buttons" inert={isOpen}>
        <button
          className="hotspot"
          id="btn-back"
          aria-label="Back"
          style={{ "--x": 0, "--y": 0, "--w": 188, "--h": 133 } as HotspotStyle}
          onClick={() => router.push("/")}
        />
        <button
          className="hotspot"
          id="btn-home"
          aria-label="Home"
          style={{ "--x": 1732, "--y": 0, "--w": 188, "--h": 124 } as HotspotStyle}
          onClick={openPaywall}
        />
        <button
          className="hotspot"
          id="btn-offers"
          aria-label="Offers"
          style={{ "--x": 176, "--y": 1000, "--w": 202, "--h": 70 } as HotspotStyle}
          onClick={() => router.push("/offers")}
        />
        <button
          className="hotspot"
          id="btn-assignments"
          aria-label="Assignments"
          style={{ "--x": 734, "--y": 1000, "--w": 378, "--h": 70 } as HotspotStyle}
        />
        <button
          className="hotspot"
          id="btn-timetable"
          aria-label="Timetable"
          style={{ "--x": 1485, "--y": 1000, "--w": 296, "--h": 70 } as HotspotStyle}
          onClick={openPaywall}
        />
      </div>

      <Paywall isOpen={isOpen} onClose={handleClosePaywall} />
    </div>
  );
}

