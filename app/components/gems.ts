import { useSyncExternalStore } from "react";

/**
 * The gem balance shown in the top bar, shared by every page.
 * It lasts for the visit: reloading the page puts it back to START_GEMS.
 */
export const START_GEMS = 999;

let gems = START_GEMS;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The current balance; the component re-renders whenever it changes */
export function useGems() {
  return useSyncExternalStore(
    subscribe,
    () => gems,
    () => START_GEMS // what the server renders
  );
}

/** Take gems off the balance (it never goes below 0) */
export function spendGems(amount: number) {
  gems = Math.max(0, gems - amount);
  listeners.forEach((listener) => listener());
}

/*
  The Timeline games you've bought (by year). Each can only be bought once:
  its card then says PURCHASED instead of the price. Lasts for the visit too.
*/
const NONE_PURCHASED: readonly number[] = [];
let purchased = NONE_PURCHASED;

/** Years of the Timeline games bought so far */
export function usePurchased() {
  return useSyncExternalStore(
    subscribe,
    () => purchased,
    () => NONE_PURCHASED // what the server renders (the same array each time)
  );
}

/** Buy a Timeline game: its price comes off and it's marked as bought */
export function buyTimelineGame(year: number, price: number) {
  if (purchased.includes(year)) return;
  purchased = [...purchased, year];
  spendGems(price); // also tells every listener
}

/*
  Timeline purchases: once you've clicked PAY, your card is "saved", so later
  games are bought in one click (no "Are you sure?", no pay wall).
  This lasts for the visit too.
*/
let paidOnce = false;

export const timelinePurchase = {
  hasPaid: () => paidOnce,
  markPaid: () => {
    paidOnce = true;
  },
};
