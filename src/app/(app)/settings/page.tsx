import { Settings, User, Lock, Mail, Key, Bot, Download } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { PasswordForm } from "@/components/settings/PasswordForm";
import { ExportButtons } from "@/components/settings/ExportButtons";
import { SendingIdentityForm } from "@/components/settings/SendingIdentityForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    select: {
      id: true,
      name: true,
      email: true,
      sendingIdentities: {
        where: { purpose: "outreach" },
        orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
        select: {
          id: true,
          email: true,
          displayName: true,
          provider: true,
          status: true,
          isDefault: true,
        },
      },
    },
  });

  if (!user) redirect("/login");

  return (
    <div className="min-w-0">
      <div className="mb-6 flex items-center gap-3">
        <Settings className="h-6 w-6 text-[#FF6B3D]" />
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-[#F6F4EF] sm:text-3xl">
          Paramètres
        </h1>
      </div>

      <div className="space-y-6">
        {/* Profile */}
        <Section icon={User} title="Profil">
          <ProfileForm user={user} />
        </Section>

        {/* Password */}
        <Section icon={Lock} title="Mot de passe">
          <PasswordForm userId={user.id} />
        </Section>

        {/* SMTP */}
        <Section icon={Mail} title="Configuration SMTP">
          <div className="grid max-w-lg grid-cols-1 gap-4 sm:grid-cols-2">
            <EnvField label="Host" value={process.env.SMTP_HOST} />
            <EnvField label="Port" value={process.env.SMTP_PORT} />
            <EnvField label="Secure" value={process.env.SMTP_SECURE} />
            <EnvField label="User" value={process.env.SMTP_USER} />
            <EnvField label="From" value={process.env.SMTP_FROM} />
            <EnvField label="Reply-To" value={process.env.SMTP_REPLY_TO} />
            <EnvField
              label="Password"
              value={process.env.SMTP_PASS ? "••••••••" : undefined}
            />
          </div>
          <p className="mt-3 text-xs text-[#969BA8]/55">
            Modifiable dans le fichier .env ou les variables
            d&apos;environnement du serveur.
          </p>
        </Section>

        <Section icon={Mail} title="Identités de prospection">
          <SendingIdentityForm identities={user.sendingIdentities} />
        </Section>

        {/* API Keys */}
        {isAdmin ? <Section icon={Key} title="Clés API">
          <div className="space-y-3 max-w-lg">
            <EnvField
              label="Grok API Key"
              value={
                (process.env.GROK_API_KEY || process.env.XAI_API_KEY)
                  ? "Configurée"
                  : undefined
              }
            />
            <EnvField
              label="Claude API Key"
              value={process.env.ANTHROPIC_API_KEY ? "Configurée" : undefined}
            />
            <EnvField
              label="Monid · LinkedIn et emails"
              value={process.env.MONID_API_KEY?.trim() ? "Configurée — source prioritaire" : undefined}
              placeholder="Définir MONID_API_KEY sur le serveur"
            />
            <EnvField
              label="Apollo.io API Key"
              value={process.env.APOLLO_API_KEY ? "Configurée" : undefined}
            />
          </div>
          <p className="mt-3 text-xs text-[#969BA8]/55">
            Monid donne accès aux fournisseurs LinkedIn et Hunter sans clé Hunter séparée.
            Configuration dans les variables d&apos;environnement du serveur ; les clés ne sont jamais affichées ici.
          </p>
        </Section> : null}

        {/* Agent config */}
        <Section icon={Bot} title="Configuration Agents">
          <div className="grid grid-cols-1 gap-4 max-w-lg sm:grid-cols-3">
            <ConfigCard
              label="Score minimum"
              value="5/10"
              description="Seuil de scoring pour les prospects B+"
            />
            <ConfigCard
              label="Volume par scan"
              value="12-15"
              description="Marques qualifiées par scan Scout"
            />
            <ConfigCard
              label="Délais relance"
              value="J+4 / J+10"
              description="Intervalles entre les relances email"
            />
          </div>
          <p className="mt-3 text-xs text-[#969BA8]/55">
            Configuration avancée des agents disponible dans une prochaine
            version.
          </p>
        </Section>

        {/* Export */}
        <Section icon={Download} title="Export CSV">
          <p className="text-sm text-[#969BA8] mb-3">
            Téléchargez vos données au format CSV (séparateur point-virgule,
            UTF-8 BOM).
          </p>
          <ExportButtons />
        </Section>
      </div>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Settings;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="app-panel p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="h-4 w-4 text-[#FF6B3D]" />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-white/50">
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}

function EnvField({
  label,
  value,
  placeholder,
}: {
  label: string;
  value?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wider text-[#969BA8] mb-1">
        {label}
      </p>
      <div className="overflow-hidden rounded-lg border border-[#FF6B3D]/10 bg-white/[0.02] px-3 py-2 font-mono text-sm">
        {value ? (
          <span className="break-all text-white/60">{value}</span>
        ) : (
          <span className="text-white/15">
            {placeholder || "Non configuré"}
          </span>
        )}
      </div>
    </div>
  );
}

function ConfigCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-[#FF6B3D]/10 bg-white/[0.02] p-3">
      <p className="text-xs text-[#969BA8] mb-1">{label}</p>
      <p className="font-mono text-sm font-bold text-white mb-1">{value}</p>
      <p className="text-[10px] text-[#969BA8]/55">{description}</p>
    </div>
  );
}
