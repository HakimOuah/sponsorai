"use client";

import { type FormEvent, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  Plus,
  Search,
  ShieldCheck,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import {
  createUserAccount,
  updateUserRole,
  type ManagedUser,
} from "@/lib/actions/admin-users";
import { APP_ROLE_LABELS, type AppRole } from "@/lib/auth/roles";

const EMPTY_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  temporaryPassword: "",
  role: "client" as AppRole,
};

export function UserRoleManager({
  initialUsers,
  currentUserId,
}: {
  initialUsers: ManagedUser[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [query, setQuery] = useState("");
  const [feedback, setFeedback] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isPending, startTransition] = useTransition();

  const normalizedQuery = query.trim().toLowerCase();
  const visibleUsers = useMemo(
    () =>
      normalizedQuery
        ? users.filter((user) =>
            `${user.name} ${user.email}`.toLowerCase().includes(normalizedQuery),
          )
        : users,
    [normalizedQuery, users],
  );

  const changeRole = (userId: string, nextRole: AppRole) => {
    setFeedback("");
    startTransition(async () => {
      const result = await updateUserRole(userId, nextRole);
      if (result.ok) {
        setUsers((current) =>
          current.map((user) =>
            user.id === userId ? { ...user, role: result.role } : user,
          ),
        );
        setFeedback("Rôle mis à jour.");
        router.refresh();
      } else {
        setFeedback(result.error);
      }
    });
  };

  const createAccount = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback("");
    startTransition(async () => {
      const result = await createUserAccount(form);
      if (result.ok) {
        setUsers((current) => [result.user, ...current]);
        setForm(EMPTY_FORM);
        setShowPassword(false);
        setCreateOpen(false);
        setFeedback(`Compte créé pour ${result.user.name}.`);
        router.refresh();
      } else {
        setFeedback(result.error);
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher un utilisateur…"
            className="w-full rounded-2xl border border-white/[0.09] bg-white/[0.035] py-2.5 pl-10 pr-4 text-sm text-white outline-none transition-colors placeholder:text-white/25 focus:border-[#C8CEFF]/35"
          />
        </div>
        <button
          type="button"
          onClick={() => {
            setFeedback("");
            setCreateOpen((current) => !current);
          }}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#FF6B3D] px-4 py-2.5 text-sm font-semibold text-[#0B0D12] transition-colors hover:bg-[#FF865F]"
        >
          {createOpen ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {createOpen ? "Fermer" : "Créer un compte"}
        </button>
      </div>

      {createOpen ? (
        <form
          onSubmit={createAccount}
          className="rounded-3xl border border-[#FF6B3D]/20 bg-[linear-gradient(135deg,rgba(255,107,61,0.08),rgba(200,206,255,0.035))] p-4 sm:p-5"
        >
          <div className="mb-4">
            <h3 className="text-base font-semibold text-white/85">
              Nouveau compte
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-[#969BA8]">
              Définissez un mot de passe temporaire et transmettez-le par un
              canal sécurisé à la personne invitée.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <AccountField label="Prénom">
              <input
                required
                minLength={2}
                autoComplete="given-name"
                value={form.firstName}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    firstName: event.target.value,
                  }))
                }
                className={inputClassName}
              />
            </AccountField>
            <AccountField label="Nom">
              <input
                required
                minLength={2}
                autoComplete="family-name"
                value={form.lastName}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    lastName: event.target.value,
                  }))
                }
                className={inputClassName}
              />
            </AccountField>
            <AccountField label="Adresse email">
              <input
                required
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
                className={inputClassName}
              />
            </AccountField>
            <AccountField label="Rôle">
              <select
                value={form.role}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    role: event.target.value as AppRole,
                  }))
                }
                className={inputClassName}
              >
                <option value="client">Client</option>
                <option value="free_user">Free user — lecture seule</option>
                <option value="admin">Administrateur</option>
              </select>
            </AccountField>
            <AccountField label="Mot de passe temporaire" className="sm:col-span-2">
              <div className="relative">
                <input
                  required
                  minLength={10}
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={form.temporaryPassword}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      temporaryPassword: event.target.value,
                    }))
                  }
                  className={`${inputClassName} pr-11`}
                  placeholder="10 caractères minimum"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-white/35 hover:bg-white/[0.06] hover:text-white/70"
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </AccountField>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center justify-center rounded-full bg-[#F6F4EF] px-5 py-2.5 text-sm font-semibold text-[#0B0D12] disabled:opacity-50"
            >
              {isPending ? "Création…" : "Créer le compte"}
            </button>
          </div>
        </form>
      ) : null}

      {feedback ? (
        <p
          className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white/65"
          role="status"
        >
          {feedback}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0B0D12]/55">
        <div className="hidden grid-cols-[minmax(0,1fr)_minmax(0,1fr)_160px] gap-4 border-b border-white/[0.07] px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35 md:grid">
          <span>Utilisateur</span>
          <span>Email</span>
          <span>Rôle</span>
        </div>
        <div className="divide-y divide-white/[0.06]">
          {visibleUsers.map((user) => {
            const isCurrentUser = user.id === currentUserId;

            return (
              <div
                key={user.id}
                className="grid gap-3 px-4 py-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_160px] md:items-center md:gap-4 md:px-5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.045]">
                    {user.role === "admin" ? (
                      <ShieldCheck className="h-4 w-4 text-[#FF6B3D]" />
                    ) : user.role === "free_user" ? (
                      <Eye className="h-4 w-4 text-[#C8CEFF]" />
                    ) : (
                      <UserRound className="h-4 w-4 text-[#C8CEFF]" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white/85">
                      {user.name}
                    </p>
                    <p className="mt-0.5 text-[11px] text-white/35">
                      Inscrit le {formatDate(user.createdAt)}
                      {isCurrentUser ? " · Vous" : ""}
                    </p>
                  </div>
                </div>
                <p className="truncate text-sm text-white/55">{user.email}</p>
                <label className="space-y-1 md:space-y-0">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/35 md:sr-only">
                    Rôle de {user.name}
                  </span>
                  <select
                    value={user.role}
                    onChange={(event) =>
                      changeRole(user.id, event.target.value as AppRole)
                    }
                    disabled={isCurrentUser || isPending}
                    className="w-full rounded-xl border border-white/[0.10] bg-[#11141D] px-3 py-2 text-sm text-white/75 outline-none transition-colors focus:border-[#FF6B3D]/40 disabled:cursor-not-allowed disabled:opacity-45"
                    aria-label={`Rôle de ${user.name}`}
                  >
                    <option value="client">Client</option>
                    <option value="free_user">Free user</option>
                    <option value="admin">Administrateur</option>
                  </select>
                  <span className="mt-1 block text-[10px] text-white/30">
                    {user.role === "free_user"
                      ? "Lecture seule"
                      : APP_ROLE_LABELS[user.role]}
                  </span>
                </label>
              </div>
            );
          })}
        </div>

        {visibleUsers.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-12 text-center">
            <UsersRound className="h-7 w-7 text-white/20" />
            <p className="mt-3 text-sm text-white/45">
              Aucun utilisateur ne correspond à cette recherche.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function AccountField({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`space-y-1.5 ${className || ""}`}>
      <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/40">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputClassName =
  "w-full rounded-2xl border border-white/[0.10] bg-[#0B0D12]/75 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#FF6B3D]/40";

function formatDate(value: string) {
  return userDateFormatter.format(new Date(value));
}

const userDateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});
