"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, ShieldCheck, UserRound, UsersRound } from "lucide-react";
import { updateUserRole } from "@/lib/actions/admin-users";
import type { AppRole } from "@/lib/auth/roles";

interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  createdAt: string;
  updatedAt: string;
}

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

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Rechercher un utilisateur…"
          className="w-full rounded-2xl border border-white/[0.09] bg-white/[0.035] py-2.5 pl-10 pr-4 text-sm text-white outline-none transition-colors placeholder:text-white/25 focus:border-[#C8CEFF]/35"
        />
      </div>

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
                    <option value="admin">Administrateur</option>
                  </select>
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

function formatDate(value: string) {
  return userDateFormatter.format(new Date(value));
}

const userDateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});
