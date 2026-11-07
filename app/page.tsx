"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type CSSProperties, type MouseEvent } from "react";
import Paywall from "./components/Paywall";
import SupercellIntro from "./components/SupercellIntro";

type HotspotStyle = CSSProperties & {
  "--x": number;
  "--y": number;
  "--w": number;
  "--h": number;
};

export default function ShopPage() {
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
      <SupercellIntro />

      <img src="/shop.png" alt="Brawl Stars style shop screen" />

      <div className="shop-buttons" id="shop-buttons" inert={isOpen}>
        <button
          className="hotspot"
          id="btn-back"
          aria-label="Back"
          style={{ "--x": 0, "--y": 0, "--w": 188, "--h": 133 } as HotspotStyle}
          onClick={openPaywall}
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
        />
        <button
          className="hotspot"
          id="btn-assignments"
          aria-label="Assignments"
          style={{ "--x": 734, "--y": 1000, "--w": 378, "--h": 70 } as HotspotStyle}
          onClick={() => router.push("/assignments")}
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
