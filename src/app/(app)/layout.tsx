import { AppShell } from "@/components/layout/AppShell";
import { getCurrentUserAccess } from "@/lib/auth/access";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const access = await getCurrentUserAccess();

  return (
    <AppShell isAdmin={access.isAdmin} isReadOnly={access.isFreeUser}>
      {children}
    </AppShell>
  );
}
