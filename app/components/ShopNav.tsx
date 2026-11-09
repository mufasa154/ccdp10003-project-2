"use client";

import { useRouter } from "next/navigation";
import type { CSSProperties } from "react";

type HotspotStyle = CSSProperties & {
  "--x": number;
  "--y": number;
  "--w": number;
  "--h": number;
};

export type ShopTab = "timeline" | "assignments" | "offers";

const GEMS = 999;

// Bottom tabs on project2-a/b/c.png, in design pixels (1920 x 1080).
// The ASSIGNMENTS spot stops before the +99 banner.
const TABS: { tab: ShopTab; label: string; href: string; spot: HotspotStyle }[] = [
  {
    tab: "timeline",
    label: "Timeline",
    href: "/timeline",
    spot: { "--x": 200, "--y": 1000, "--w": 263, "--h": 70 },
  },
  {
    tab: "assignments",
    label: "Assignments",
    href: "/assignments",
    spot: { "--x": 734, "--y": 1000, "--w": 378, "--h": 70 },
  },
  {
    tab: "offers",
    label: "Offers",
    href: "/offers",
    spot: { "--x": 1461, "--y": 1000, "--w": 203, "--h": 70 },
  },
];

/**
 * Gem count, back/home buttons and the TIMELINE / ASSIGNMENTS / OFFERS tabs
 * shared by the pages that use project2-a/b/c.png.
 */
export default function ShopNav({
  current,
  backTo = "/timeline",
  inert = false,
}: {
  /** The tab whose page you're on: clicking it does nothing */
  current?: ShopTab;
  /** Where the back arrow goes; null = it does nothing (on the Timeline page itself) */
  backTo?: string | null;
  inert?: boolean;
}) {
  const router = useRouter();

  return (
    <>
      <div className="gem-count">{GEMS}</div>

      <div className="shop-buttons" id="shop-buttons" inert={inert}>
        <button
          className="hotspot"
          id="btn-back"
          aria-label="Back"
          style={{ "--x": 0, "--y": 0, "--w": 188, "--h": 133 } as HotspotStyle}
          onClick={backTo === null ? undefined : () => router.push(backTo)}
        />
        <button
          className="hotspot"
          id="btn-home"
          aria-label="Home"
          style={{ "--x": 1732, "--y": 0, "--w": 188, "--h": 124 } as HotspotStyle}
          // Home = Deadline Dash, the first page of the site
          onClick={() => router.push("/")}
        />
        {TABS.map(({ tab, label, href, spot }) => (
          <button
            key={tab}
            className="hotspot"
            id={`btn-${tab}`}
            aria-label={label}
            aria-current={tab === current ? "page" : undefined}
            style={spot}
            // The tab you're already on stays clickable but does nothing
            onClick={tab === current ? undefined : () => router.push(href)}
          />
        ))}
      </div>
    </>
  );
}
