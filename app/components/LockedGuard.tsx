"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useGems } from "./gems";

/**
 * Assignments and Offers (and their Gems pages) stay locked until all three
 * Timeline games are bought, i.e. the gem balance is 0. Visiting one of them
 * any other way (typing the address, reloading) sends you to Timeline instead.
 * Used by the layout.tsx files in app/assignments, app/offers and app/gems.
 */
export default function LockedGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const locked = useGems() > 0;

  useEffect(() => {
    if (locked) router.replace("/timeline");
  }, [locked, router]);

  // The page is still rendered (Next.js checks every page has content) but kept
  // hidden while it redirects, so the locked page never flashes up.
  // (.locked-guard is display: contents, so the wrapper doesn't affect the layout)
  return (
    <div className="locked-guard" hidden={locked}>
      {children}
    </div>
  );
}
