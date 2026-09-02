import type { UserAccess } from "@/lib/auth/access";
import { qualificationView, type ScanQualification } from "./scan-qualification";

export interface QualificationHandlerDependencies {
  getAccess: () => Promise<UserAccess>;
  list: (userId: string) => Promise<ScanQualification[]>;
  read: (id: string) => Promise<ScanQualification | null>;
  advance: (id: string, userId: string, isAdmin: boolean) => Promise<ScanQualification | null>;
}
const headers = { "Cache-Control": "private, no-store" };
export function createQualificationHandlers(deps: QualificationHandlerDependencies) {
  return {
    GET: async () => {
      const access = await deps.getAccess().catch(() => null);
      if (!access) return Response.json({ error: "Authentification temporairement indisponible." }, { status: 503, headers });
      if (!access.authenticated || !access.userId) return Response.json({ error: "Connexion requise." }, { status: 401, headers });
      if (!access.canOperate) return Response.json({ error: "Mode découverte." }, { status: 403, headers });
      try {
        const jobs = await deps.list(access.userId);
        return Response.json({ jobs: jobs.filter((job) => job.ownerUserId === access.userId).map((job) => qualificationView(job, access.isAdmin)) }, { headers });
      } catch {
        return Response.json({ error: "Suivi des contacts temporairement indisponible." }, { status: 503, headers });
      }
    },
    POST: async (request: Request) => {
      const access = await deps.getAccess().catch(() => null);
      if (!access) return Response.json({ error: "Authentification temporairement indisponible." }, { status: 503, headers });
      if (!access.authenticated || !access.userId) return Response.json({ error: "Connexion requise." }, { status: 401, headers });
      if (!access.canOperate) return Response.json({ error: "Mode découverte." }, { status: 403, headers });
      const body: unknown = await request.json().catch(() => null);
      const id = body && typeof body === "object" && "id" in body ? body.id : null;
      if (typeof id !== "string" || id.trim() !== id || !/^scan-qualification:[a-zA-Z0-9_-]{1,100}$/.test(id)) {
        return Response.json({ error: "Qualification invalide." }, { status: 400, headers });
      }
      try {
        const existing = await deps.read(id);
        if (!existing || (existing.ownerUserId !== access.userId && !access.isAdmin)) return Response.json({ error: "Qualification introuvable." }, { status: 404, headers });
        const job = await deps.advance(id, access.userId, access.isAdmin);
        if (!job) return Response.json({ error: "Qualification introuvable." }, { status: 404, headers });
        return Response.json({ job: qualificationView(job, access.isAdmin) }, { headers });
      } catch {
        // Do not expose raw storage/provider errors or imply that retrying a paid request is safe.
        return Response.json({ error: "Le suivi va relire l’état enregistré avant de poursuivre." }, { status: 503, headers });
      }
    },
  };
}
