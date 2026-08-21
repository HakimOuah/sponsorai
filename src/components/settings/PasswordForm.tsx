"use client";

import { useState, useTransition } from "react";
import { Lock, Loader2 } from "lucide-react";
import { changePassword } from "@/lib/actions/settings";

interface PasswordFormProps {
  userId: string;
}

export function PasswordForm({ userId }: PasswordFormProps) {
  const [current, setCurrent] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    setError("");
    setMessage("");

    if (newPwd.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }
    if (newPwd !== confirm) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    startTransition(async () => {
      try {
        await changePassword(userId, current, newPwd);
        setMessage("Mot de passe modifié");
        setCurrent("");
        setNewPwd("");
        setConfirm("");
        setTimeout(() => setMessage(""), 3000);
      } catch {
        setError("Mot de passe actuel incorrect");
      }
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-[11px] font-medium uppercase tracking-wider text-[#969BA8] mb-1 block">
          Mot de passe actuel
        </label>
        <input
          type="password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          className="w-full max-w-sm rounded-full border border-white/[0.10] bg-white/[0.045] px-4 py-2.5 text-sm text-white placeholder-white/20 focus:border-[#FF6B3D]/30 focus:outline-none"
        />
      </div>
      <div className="grid max-w-sm grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="text-[11px] font-medium uppercase tracking-wider text-[#969BA8] mb-1 block">
            Nouveau
          </label>
          <input
            type="password"
            value={newPwd}
            onChange={(e) => setNewPwd(e.target.value)}
            className="w-full rounded-2xl border border-white/[0.10] bg-white/[0.045] px-4 py-2.5 text-sm text-white placeholder-white/20 focus:border-[#FF6B3D]/30 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-[11px] font-medium uppercase tracking-wider text-[#969BA8] mb-1 block">
            Confirmer
          </label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full rounded-2xl border border-white/[0.10] bg-white/[0.045] px-4 py-2.5 text-sm text-white placeholder-white/20 focus:border-[#FF6B3D]/30 focus:outline-none"
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {message && <p className="text-sm text-[#FF6B3D]">{message}</p>}

      <button
        onClick={handleSubmit}
        disabled={isPending || !current || !newPwd}
        className="flex w-full items-center justify-center gap-1.5 rounded-full bg-white/[0.06] px-4 py-2.5 text-sm text-white/60 transition-colors hover:bg-white/[0.1] disabled:opacity-40 sm:w-auto sm:py-2"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Lock className="h-4 w-4" />
        )}
        Changer le mot de passe
      </button>
    </div>
  );
}
