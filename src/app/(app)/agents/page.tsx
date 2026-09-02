import { Bot } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { AgentCatalog } from "@/components/agents/AgentCatalog";
import { getCurrentUserAccess } from "@/lib/auth/access";

export const dynamic = "force-dynamic";

export default async function AgentsPage({
  searchParams,
}: {
  searchParams: { prospect?: string };
}) {
  const access = await getCurrentUserAccess();
  const [players, recentScans, contactedProspects, companies] = await Promise.all([
    prisma.player.findMany({
      where: { active: true },
      select: { id: true, firstName: true, lastName: true, club: true },
      orderBy: { lastName: "asc" },
    }),
    prisma.scan.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        brandsFound: true,
        brandsScored: true,
        duration: true,
        createdAt: true,
        player: { select: { firstName: true, lastName: true } },
      },
    }),
    prisma.prospect.findMany({
      where: {
        emails: {
          some: { status: { in: ["sent", "opened"] } },
        },
      },
      select: {
        id: true,
        status: true,
        company: { select: { name: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 50,
    }),
    prisma.company.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        country: true,
        contacts: {
          where: { active: true },
          orderBy: [{ contactScore: "desc" }, { relevanceScore: "desc" }],
          select: {
            id: true,
            fullName: true,
            roleRaw: true,
            employmentStatus: true,
            contactability: true,
            contactScore: true,
            contactEmails: {
              where: { status: { in: ["verified", "public_source"] } },
              orderBy: [{ isPrimary: "desc" }, { verifiedAt: "desc" }],
              take: 1,
              select: {
                email: true,
                source: true,
                evidence: true,
              },
            },
          },
        },
        prospects: {
          orderBy: { score: "desc" },
          select: {
            id: true,
            player: {
              select: {
                firstName: true,
                lastName: true,
                club: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const relanceurProspects = contactedProspects.map((p) => ({
    id: p.id,
    companyName: p.company.name,
    status: p.status,
  }));
  const companyOptions = companies.map((company) => ({
    id: company.id,
    name: company.name,
    country: company.country,
    contacts: company.contacts.map((contact) => {
      const email = contact.contactEmails[0];

      return {
        id: contact.id,
        name: access.isAdmin ? contact.fullName : null,
        role: contact.roleRaw,
        currentRoleVerified:
          contact.employmentStatus === "verified_current",
        contactability: contact.contactability as
          | "verified"
          | "public_source"
          | "guessed"
          | "missing",
        score: contact.contactScore,
        email: access.isAdmin ? email?.email || null : null,
        emailSource: access.isAdmin ? email?.source || null : null,
        emailKind: email
          ? isFunctionalEmail(email.email)
            ? ("functional_generic" as const)
            : ("personal_professional" as const)
          : ("unknown" as const),
      };
    }),
    prospects: company.prospects.map((prospect) => ({
      id: prospect.id,
      athleteName: `${prospect.player.firstName} ${prospect.player.lastName}`,
      club: prospect.player.club,
    })),
  }));

  return (
    <div className="min-w-0">
      <div className="mb-6 flex items-center gap-3">
        <Bot className="h-6 w-6 text-[#FF6B3D]" />
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-[#F6F4EF] sm:text-3xl">
          Agents IA
        </h1>
      </div>
      <p className="mb-6 max-w-3xl text-sm leading-relaxed text-[#969BA8]">
        Cliquez sur un agent pour comprendre son rôle, voir ce qu’il peut faire
        et démarrer la bonne action avec le contexte nécessaire.
      </p>

      <AgentCatalog
        players={players}
        companies={companyOptions}
        contactedProspects={relanceurProspects}
        defaultProspectId={searchParams.prospect}
        canOperate={access.canOperate}
        canViewContactDetails={access.isAdmin}
      />

      {/* Recent scans */}
      {recentScans.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#969BA8] mb-3">
            Scans récents
          </h2>
          <div className="app-panel overflow-x-auto">
            <table className="min-w-[620px] w-full text-sm">
              <thead>
                <tr className="border-b border-[#FF6B3D]/10 text-left text-xs text-[#969BA8]">
                  <th className="px-4 py-2.5 font-medium">Profil</th>
                  <th className="px-4 py-2.5 font-medium">Statut</th>
                  <th className="px-4 py-2.5 font-medium">Marques</th>
                  <th className="px-4 py-2.5 font-medium">Durée</th>
                  <th className="px-4 py-2.5 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentScans.map((scan) => (
                  <tr
                    key={scan.id}
                    className="border-b border-white/[0.04] last:border-0"
                  >
                    <td className="px-4 py-2.5 text-white/80">
                      {scan.player.firstName} {scan.player.lastName}
                    </td>
                    <td className="px-4 py-2.5">
                      <ScanStatusBadge status={scan.status} />
                    </td>
                    <td className="px-4 py-2.5 font-mono text-white/50">
                      {scan.brandsFound ?? "—"} / {scan.brandsScored ?? "—"}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-white/50">
                      {scan.duration ? `${scan.duration}s` : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-[#969BA8]">
                      {scan.createdAt.toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function isFunctionalEmail(email: string): boolean {
  const localPart = email.split("@")[0]?.toLowerCase() || "";
  return /^(contact|info|hello|marketing|communication|communications|partnerships|partenariats|sponsoring|sponsorship|press|presse|media)([._-]|$)/.test(
    localPart,
  );
}

function ScanStatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string }> = {
    running: { bg: "bg-[#C8CEFF]/10", text: "text-[#C8CEFF]" },
    completed: { bg: "bg-[#FF6B3D]/10", text: "text-[#FF6B3D]" },
    failed: { bg: "bg-red-500/10", text: "text-red-400" },
  };
  const c = config[status] || config.running;
  return (
    <span
      className={`rounded-full px-2 py-0.5 font-mono text-[11px] capitalize ${c.bg} ${c.text}`}
    >
      {status}
    </span>
  );
}
