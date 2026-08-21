"use client";

import { useTransition } from "react";
import {
  createSendingIdentity,
  setDefaultSendingIdentity,
} from "@/lib/actions/settings";

interface Identity {
  id: string;
  email: string;
  displayName: string | null;
  provider: string;
  status: string;
  isDefault: boolean;
}

export function SendingIdentityForm({ identities }: { identities: Identity[] }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {identities.map((identity) => (
          <div key={identity.id} className="flex flex-col gap-2 rounded-xl border border-white/[0.08] p-3 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-white">{identity.displayName || identity.email}</p>
              <p className="text-xs text-[#8FA69E]">{identity.email} · {identity.provider} · {identity.status}</p>
            </div>
            {identity.isDefault ? (
              <span className="text-xs text-[#3EF2A0]">Identité par défaut</span>
            ) : identity.status === "active" ? (
              <button
                type="button"
                disabled={pending}
                onClick={() => startTransition(() => setDefaultSendingIdentity(identity.id))}
                className="rounded-full border border-[#3EF2A0]/20 px-3 py-1.5 text-xs text-[#3EF2A0]"
              >
                Définir par défaut
              </button>
            ) : (
              <span className="text-xs text-[#f59e0b]">À relier aux identifiants SMTP</span>
            )}
          </div>
        ))}
      </div>

      <form action={createSendingIdentity} className="grid max-w-xl gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <input name="displayName" placeholder="Nom d’expéditeur" className={inputClass} />
        <input name="email" type="email" required placeholder="agent@agence.com" className={inputClass} />
        <button disabled={pending} className="rounded-full bg-[#F8FAF7] px-4 py-2 text-sm font-semibold text-[#020403]">
          Ajouter
        </button>
      </form>
      <p className="text-xs text-[#8FA69E]">
        Une identité devient active uniquement si son adresse correspond à la configuration SMTP du serveur. Les emails transactionnels restent séparés.
      </p>
    </div>
  );
}

const inputClass = "rounded-xl border border-white/[0.08] bg-[#020403] px-3 py-2 text-sm text-white placeholder:text-[#8FA69E]/50";
