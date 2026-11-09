"use client";

import { useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import HScrollbar from "../components/HScrollbar";
import Paywall from "../components/Paywall";
import ShopNav from "../components/ShopNav";
import { MysteryBoxArt } from "./SkinArt";

type Rarity = "rare" | "super-rare" | "epic" | "mythic" | "legendary" | "mystery";

const RARITY_LABEL: Record<Rarity, string> = {
  rare: "RARE",
  "super-rare": "SUPER RARE",
  epic: "EPIC",
  mythic: "MYTHIC",
  legendary: "LEGENDARY",
  mystery: "???",
};

interface SkinOffer {
  id: string;
  name: string;
  rarity: Rarity;
  /** Drawn artwork, used when there's no `image` */
  art: ReactNode;
  /** Your own picture, e.g. "/skins/late-ghost.png" (file goes in public/skins/) */
  image?: string;
  /** Rectangular picture (not a cut-out icon): shown with a black border, like a photo */
  photo?: boolean;
  tagline?: string;
  price: number;
  oldPrice?: number;
  ribbon?: string;
  banner?: string;
  priceSuffix?: string;
  special?: "timer" | "stock" | "rising" | "hecs" | "odds";
}

const SKINS: SkinOffer[] = [
  {
    id: "sleep",
    name: "SLEEP-DEPRIVED STUDENT",
    rarity: "legendary",
    art: null,
    image: "/skins/sleep.webp",
    price: 2999,
    oldPrice: 3499,
    banner: "MOST POPULAR",
  },
  {
    id: "carry",
    name: "GROUP PROJECT CARRY",
    rarity: "epic",
    art: null,
    image: "/skins/angry.webp",
    price: 299,
    priceSuffix: "x4",
    ribbon: "SQUAD DEAL",
  },
  {
    id: "medcert",
    name: "MEDICAL CERTIFICATE",
    rarity: "mythic",
    art: null,
    image: "/skins/medical-certificate.png",
    photo: true,
    price: 1499,
    oldPrice: 1999,
    special: "timer",
  },
  {
    id: "monster",
    name: "MONSTER",
    rarity: "legendary",
    art: null,
    image: "/skins/monster.png",
    price: 1499,
    oldPrice: 4999,
    ribbon: "70% OFF!!!",
    banner: "BEST VALUE",
  },
  {
    id: "exam",
    name: "EXAM WEEK SURVIVOR",
    rarity: "super-rare",
    art: null,
    image: "/skins/examweek.jpg",
    photo: true,
    price: 499,
    special: "stock",
  },
  {
    id: "ghost",
    name: "LATE SUBMISSION",
    rarity: "rare",
    art: null,
    image: "/skins/late-submission.png",
    price: 149,
    special: "rising",
  },
  {
    id: "failed",
    name: "FAILED EXAM",
    rarity: "legendary",
    art: null,
    image: "/skins/failed-exam.jpg",
    photo: true,
    price: 99999,
    special: "hecs",
  },
  {
    id: "mystery",
    name: "MYSTERY SKIN BOX",
    rarity: "mystery",
    art: <MysteryBoxArt />,
    price: 99,
    special: "odds",
  },
];

const FAKE_PURCHASES = [
  "JAKE JUST BOUGHT A MONSTER!",
  "YOUR TUTOR JUST BOUGHT SLEEP-DEPRIVED STUDENT!",
  "3 CLASSMATES BOUGHT GROUP PROJECT CARRY!",
  "PRIYA JUST OPENED A MYSTERY SKIN BOX! (DUPLICATE)",
  "SOMEONE JUST FINANCED A FAILED EXAM!",
];

function GemIcon() {
  return <img className="step-gem-icon" src="/gem.png" alt="" draggable={false} />;
}

function formatTime(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

export default function OffersPage() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  // "Limited time" countdown: starts fresh on every page load, and quietly
  // restarts when it reaches zero. The offer never actually ends.
  const [secondsLeft, setSecondsLeft] = useState(59 * 60 + 59);
  // Late Submission Ghost gets 10% pricier every few seconds you hesitate
  const [ghostPrice, setGhostPrice] = useState(149);
  // Fake "someone just bought this" toast
  const [toastIndex, setToastIndex] = useState<number | null>(null);

  useEffect(() => {
    const tick = setInterval(() => {
      setSecondsLeft((s) => (s <= 1 ? 59 * 60 + 59 : s - 1));
    }, 1000);
    const rise = setInterval(() => {
      setGhostPrice((p) => Math.round(p * 1.1));
    }, 4000);
    return () => {
      clearInterval(tick);
      clearInterval(rise);
    };
  }, []);

  useEffect(() => {
    let i = 0;
    let hideTimer: ReturnType<typeof setTimeout>;
    const show = () => {
      setToastIndex(i % FAKE_PURCHASES.length);
      i += 1;
      hideTimer = setTimeout(() => setToastIndex(null), 3500);
    };
    const first = setTimeout(show, 2500);
    const loop = setInterval(show, 8000);
    return () => {
      clearTimeout(first);
      clearTimeout(hideTimer);
      clearInterval(loop);
    };
  }, []);

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
      <img src="/project2-c.png" alt="Brawl Stars style shop screen, Offers tab" />

      <div className="offers-overlay" inert={isOpen}>
        <div className="bs-text offers-title">SKIN OFFERS</div>

        <div className="offers-track" ref={trackRef}>
          {SKINS.map((skin) => {
            const price = skin.special === "rising" ? ghostPrice : skin.price;
            return (
              <div className="offer-item" key={skin.id}>
                <button
                  type="button"
                  className={`offer-card offer-card--${skin.rarity}`}
                  // "Buying" a skin sends you to the gem shop (with OFFERS still lit)
                  onClick={() => router.push("/offers/gems")}
                  aria-label={`${skin.name}, ${RARITY_LABEL[skin.rarity]} skin, ${price.toLocaleString("en-US")} gems`}
                >
                  <div className="offer-card-header">
                    <span className="bs-text offer-unskew">{RARITY_LABEL[skin.rarity]}</span>
                  </div>

                  <div className="offer-card-body">
                    <div className="offer-unskew">
                      <div className="bs-text offer-name">{skin.name}</div>
                      <div className="offer-art">
                        {skin.image ? (
                          <img
                            src={skin.image}
                            alt=""
                            draggable={false}
                            className={skin.photo ? "offer-photo" : undefined}
                          />
                        ) : (
                          skin.art
                        )}
                      </div>
                      {skin.tagline && <div className="bs-text offer-tagline">{skin.tagline}</div>}

                      {skin.special === "timer" && (
                        <div className="bs-text offer-pill offer-pill--timer">
                          ENDS IN {formatTime(secondsLeft)}
                        </div>
                      )}
                      {skin.special === "stock" && (
                        <div className="bs-text offer-pill offer-pill--stock">ONLY 3 LEFT!</div>
                      )}
                      {skin.special === "rising" && (
                        <div className="bs-text offer-pill offer-pill--rising">
                          PRICE +10% WHILE YOU THINK
                        </div>
                      )}
                      {skin.special === "odds" && (
                        <div className="offer-odds">
                          <div className="bs-text">LEGENDARY 0.0001%</div>
                          <div className="bs-text">DUPLICATE 99.9999%</div>
                        </div>
                      )}
                    </div>

                    {skin.ribbon && <div className="bs-text offer-ribbon">{skin.ribbon}</div>}
                  </div>

                  {skin.banner && (
                    <div className="bs-text offer-banner">
                      <span className="offer-unskew">{skin.banner}</span>
                    </div>
                  )}

                  <div className="offer-card-footer">
                    <div className="offer-unskew offer-price-row">
                      {skin.oldPrice && (
                        <span className="bs-text step-old-price">
                          {skin.oldPrice.toLocaleString("en-US")}
                        </span>
                      )}
                      <GemIcon />
                      <span className="bs-text step-price">{price.toLocaleString("en-US")}</span>
                      {skin.priceSuffix && (
                        <span className="bs-text offer-price-suffix">{skin.priceSuffix}</span>
                      )}
                    </div>
                  </div>
                </button>

                {skin.special === "hecs" && (
                  <button type="button" className="bs-text offer-hecs" onClick={openPaywall}>
                    FINANCE WITH HECS?
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <HScrollbar target={trackRef} />
      </div>

      {toastIndex !== null && (
        <div className="bs-text offers-toast" key={toastIndex} role="status">
          {FAKE_PURCHASES[toastIndex]}
        </div>
      )}

      <ShopNav current="offers" inert={isOpen} />

      <Paywall isOpen={isOpen} onClose={handleClosePaywall} />
    </div>
  );
}
