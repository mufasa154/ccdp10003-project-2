import LockedGuard from "../components/LockedGuard";

// Locked until all three Timeline games are bought (covers /offers/gems too)
export default function OffersLayout({ children }: { children: React.ReactNode }) {
  return <LockedGuard>{children}</LockedGuard>;
}
