import { redirect } from "next/navigation";
import { ShieldCheck, UserRound, UsersRound } from "lucide-react";
import { getAdminUsers } from "@/lib/actions/admin-users";
import { UserRoleManager } from "@/components/admin/UserRoleManager";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const data = await getAdminUsers();
  if (!data) redirect("/dashboard");

  const adminCount = data.users.filter((user) => user.role === "admin").length;
  const clientCount = data.users.length - adminCount;

  return (
    <div className="min-w-0 space-y-6">
      <div>
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#FF6B3D]">
          <ShieldCheck className="h-3.5 w-3.5" /> Administration
        </div>
        <h1 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#F6F4EF] sm:text-3xl">
          Utilisateurs et rôles
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#969BA8]">
          Les administrateurs voient les coordonnées de prospection. Les clients
          utilisent les agents et l’envoi sans pouvoir extraire ces données.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard
          icon={UsersRound}
          label="Utilisateurs"
          value={data.users.length}
          accent="text-[#F6F4EF]"
        />
        <SummaryCard
          icon={ShieldCheck}
          label="Administrateurs"
          value={adminCount}
          accent="text-[#FF6B3D]"
        />
        <SummaryCard
          icon={UserRound}
          label="Clients"
          value={clientCount}
          accent="text-[#C8CEFF]"
        />
      </div>

      <section className="app-panel p-4 sm:p-5">
        <div className="mb-4 flex flex-col gap-1">
          <h2 className="text-base font-semibold text-white/85">
            Accès à Vectis
          </h2>
          <p className="text-xs leading-relaxed text-[#969BA8]">
            Votre propre rôle est verrouillé pour éviter de perdre l’accès à
            l’administration.
          </p>
        </div>
        <UserRoleManager
          initialUsers={data.users}
          currentUserId={data.currentUserId}
        />
      </section>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof UsersRound;
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="app-panel p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-[#969BA8]">{label}</span>
        <Icon className={`h-4 w-4 ${accent}`} />
      </div>
      <p className={`mt-2 font-mono text-2xl font-semibold ${accent}`}>
        {value}
      </p>
    </div>
  );
}
