"use client";

import { useRouter } from "next/navigation";
import { startTransition, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import HScrollbar from "../components/HScrollbar";
import Paywall from "../components/Paywall";
import ShopNav from "../components/ShopNav";

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
    title: "PROJECT 1",
    artType: "box",
    extraBadge: "34%\nEXTRA",
    oldPrice: 199,
    price: 149,
  },
  {
    step: 2,
    variant: "purple",
    title: "SPECIAL CONSIDERATION ",
    artType: "box",
    extraBadge: "34%\nEXTRA",
    oldPrice: 199,
    price: 149,
  },
  {
    step: 3,
    variant: "gold",
    title: "MARKING RUBRIC",
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

function ChestArt({ isOpening, stepIndex }: { isOpening: boolean; stepIndex: number }) {
  return (
    <div
      className={`step-chest${isOpening ? " is-opening" : ""}`}
      style={{ "--chest-delay": `${stepIndex * 0.75}s` } as CSSProperties}
      aria-hidden="true"
    >
      <img
        className="step-chest-img step-chest-closed"
        src="/chest.png"
        alt=""
        draggable={false}
      />
      <img
        className="step-chest-img step-chest-open"
        src="/chestopen.png"
        alt=""
        draggable={false}
      />
    </div>
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
  return <img className="step-gem-icon" src="/gem.png" alt="" draggable={false} />;
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
  const [openingStep, setOpeningStep] = useState<number | null>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const stepsRef = useRef<HTMLDivElement>(null);

  // SK Chan's chest: it opens, then you go to the Gems page
  function handleStepClick(step: number) {
    if (openingStep !== null) return;
    setOpeningStep(step);
    setTimeout(() => {
      // This page stays alive (hidden) while you're away, so close the chest again
      // in the same update that switches pages: it's shut when you come back
      startTransition(() => {
        router.push("/gems");
        setOpeningStep(null);
      });
    }, 520);
  }

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
      <img src="/project2-b.png" alt="Brawl Stars style shop screen, Assignments tab" />

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

        <div className="steps-track" ref={stepsRef}>
          {ASSIGNMENT_STEPS.map((item, index) => (
            <div className="step-item" key={item.step}>
              <button
                type="button"
                className={`step-card step-card--${item.variant}`}
                onClick={() => handleStepClick(item.step)}
                aria-label={`Step ${item.step}: ${item.title}`}
              >
                <div className="step-card-header">
                  <span className="bs-text step-unskew">STEP {item.step}</span>
                </div>

                <div className="step-card-body">
                  <div className="step-unskew">
                    <div className="bs-text step-item-title">{item.title}</div>
                    <div className="step-art">
                      {item.artType === "box" ? (
                        <ChestArt isOpening={openingStep === item.step} stepIndex={index} />
                      ) : (
                        <PlayerIconArt />
                      )}
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

        <HScrollbar target={stepsRef} />
      </div>

      <ShopNav current="assignments" inert={isOpen} />

      <Paywall isOpen={isOpen} onClose={handleClosePaywall} />
    </div>
  );
}

