import LockedGuard from "../components/LockedGuard";

// The Assignments Gems page: locked until all three Timeline games are bought
export default function AssignmentsGemsLayout({ children }: { children: React.ReactNode }) {
  return <LockedGuard>{children}</LockedGuard>;
}
