"use client";

import { useState, useTransition } from "react";
import { Save, Loader2 } from "lucide-react";
import { updateProfile } from "@/lib/actions/settings";

interface ProfileFormProps {
  user: { id: string; name: string; email: string };
}

export function ProfileForm({ user }: ProfileFormProps) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  const hasChanges = name !== user.name || email !== user.email;

  const handleSave = () => {
    startTransition(async () => {
      await updateProfile(user.id, { name, email });
      setMessage("Profil mis à jour");
      setTimeout(() => setMessage(""), 3000);
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-[11px] font-medium uppercase tracking-wider text-white/30 mb-1 block">
            Nom
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder-white/20 focus:border-[#00d4aa]/30 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-[11px] font-medium uppercase tracking-wider text-white/30 mb-1 block">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder-white/20 focus:border-[#00d4aa]/30 focus:outline-none"
          />
        </div>
      </div>

      {message && (
        <p className="text-sm text-[#00d4aa]">{message}</p>
      )}

      <button
        onClick={handleSave}
        disabled={isPending || !hasChanges}
        className="flex items-center gap-1.5 rounded-lg bg-[#00d4aa] px-4 py-2 text-sm font-semibold text-[#07090f] hover:bg-[#00e4ba] transition-colors disabled:opacity-40"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Sauvegarder
      </button>
    </div>
  );
}
