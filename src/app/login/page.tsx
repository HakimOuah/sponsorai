"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: "/dashboard",
      });

      if (result?.error) {
        setError("Email ou mot de passe incorrect");
        setLoading(false);
        return;
      }

      router.replace(result?.url || "/dashboard");
      router.refresh();
    } catch {
      setError("Impossible de se connecter. Réessayez.");
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#020403] px-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(62,242,160,0.16),transparent_32%),radial-gradient(circle_at_50%_86%,rgba(0,107,85,0.22),transparent_38%),linear-gradient(180deg,#020403_0%,#050A0D_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(to_right,#F8FAF7_1px,transparent_1px),linear-gradient(to_bottom,#F8FAF7_1px,transparent_1px)] [background-size:84px_84px]" />
      <div className="relative w-full max-w-md rounded-[32px] border border-[#3EF2A0]/15 bg-[#061511]/80 p-8 shadow-[0_32px_120px_rgba(0,0,0,0.46)] backdrop-blur-xl">
        <div className="text-center mb-8">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#3EF2A0]/25 bg-[#3EF2A0]/10 text-[#3EF2A0] shadow-[0_0_34px_rgba(62,242,160,0.12)]">
            V
          </div>
          <h1 className="text-3xl font-semibold tracking-[-0.03em] text-[#F8FAF7] mb-2">
            Vectis<span className="text-[#3EF2A0]">Agency</span>
          </h1>
          <p className="text-[#8FA69E] text-sm">
            Plateforme IA de sponsoring sportif
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 transition-colors focus:border-[#3EF2A0] focus:outline-none"
              placeholder="agent@sponsorai.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 transition-colors focus:border-[#3EF2A0] focus:outline-none"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-[#F8FAF7] py-3 font-semibold text-[#020403] shadow-[0_16px_44px_rgba(62,242,160,0.12)] transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_52px_rgba(62,242,160,0.2)] disabled:opacity-50"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}
