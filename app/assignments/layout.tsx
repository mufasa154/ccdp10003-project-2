import LockedGuard from "../components/LockedGuard";

// Locked until all three Timeline games are bought
export default function AssignmentsLayout({ children }: { children: React.ReactNode }) {
  return <LockedGuard>{children}</LockedGuard>;
}
