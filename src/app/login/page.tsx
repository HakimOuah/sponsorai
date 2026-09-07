"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { VectisMark, VectisWordmark } from "@/components/brand/VectisLogo";

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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0B0D12] px-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(255,107,61,0.16),transparent_32%),radial-gradient(circle_at_50%_86%,rgba(130,140,255,0.12),transparent_38%),linear-gradient(180deg,#0B0D12_0%,#11141D_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(to_right,#F6F4EF_1px,transparent_1px),linear-gradient(to_bottom,#F6F4EF_1px,transparent_1px)] [background-size:84px_84px]" />
      <div className="relative w-full max-w-md rounded-[32px] border border-[#FF6B3D]/15 bg-[#141720]/80 p-8 shadow-[0_32px_120px_rgba(0,0,0,0.46)] backdrop-blur-xl">
        <div className="text-center mb-8">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.10] bg-white/[0.05] text-[#F6F4EF] shadow-[0_0_34px_rgba(255,107,61,0.10)]">
            <VectisMark className="h-8 w-8" />
          </div>
          <h1 className="mb-2 flex justify-center text-[#F6F4EF]">
            <VectisWordmark size="lg" />
          </h1>
          <p className="text-[#969BA8] text-sm">
            Prospection sponsoring pour représentants de sportifs
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
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 transition-colors focus:border-[#FF6B3D] focus:outline-none"
              placeholder="vous@votre-agence.fr"
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
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 transition-colors focus:border-[#FF6B3D] focus:outline-none"
              placeholder="••••••••"
              required
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-[#FF6B3D] py-3 font-semibold text-[#0B0D12] shadow-[0_16px_44px_rgba(255,107,61,0.12)] transition-all hover:-translate-y-0.5 hover:bg-[#FF865F] hover:shadow-[0_18px_52px_rgba(255,107,61,0.2)] disabled:opacity-50"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <div className="mt-6 flex flex-wrap justify-center gap-x-4 gap-y-1 border-t border-white/[0.08] pt-5 text-[11px] text-[#969BA8]">
          <Link href="/" className="transition hover:text-white">Retour au site</Link>
          <Link href="/legal/mentions-legales" className="transition hover:text-white">Mentions légales</Link>
          <Link href="/legal/confidentialite" className="transition hover:text-white">Confidentialité</Link>
          <Link href="/legal/cgu" className="transition hover:text-white">CGU</Link>
        </div>
      </div>
    </div>
  );
}
