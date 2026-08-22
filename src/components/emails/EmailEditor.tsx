"use client";

import { useState, useTransition } from "react";
import { ExternalLink, Send, Save, Trash2, Loader2 } from "lucide-react";
import { updateEmail, deleteEmail, sendEmail } from "@/lib/actions/emails";
import { useRouter } from "next/navigation";

interface EmailEditorProps {
  email: {
    id: string;
    subject: string;
    body: string;
    status: string;
    type: string;
    sentAt: Date | null;
    createdAt: Date;
    company: {
      name: string;
      contactRole?: string | null;
      contactEmailStatus?: string | null;
      outreachReady?: boolean | null;
    };
    contactReady: boolean;
    canViewContactDetails: boolean;
    recipient: {
      name: string | null;
      role: string | null;
      email: string | null;
      status: string;
      source: string | null;
      evidence: string | null;
      kind: "personal_professional" | "functional_generic" | "unknown";
    };
    prospect: {
      outreachApprovedAt: Date | null;
      player: { firstName: string; lastName: string };
    } | null;
  };
}

export function EmailEditor({ email }: EmailEditorProps) {
  const router = useRouter();
  const [subject, setSubject] = useState(email.subject);
  const [body, setBody] = useState(email.body);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [sendConfirm, setSendConfirm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const isDraft = email.status === "draft";
  const hasChanges = subject !== email.subject || body !== email.body;
  const sendable = Boolean(
    email.contactReady &&
    (email.type !== "first_contact" || email.prospect?.outreachApprovedAt),
  );

  const handleSave = () => {
    startTransition(async () => {
      await updateEmail(email.id, { subject, body });
      setMessage("Sauvegardé");
      setTimeout(() => setMessage(""), 3000);
    });
  };

  const handleSend = () => {
    if (!sendConfirm) {
      setSendConfirm(true);
      return;
    }
    startTransition(async () => {
      try {
        if (hasChanges) {
          await updateEmail(email.id, { subject, body });
        }
        await sendEmail(email.id);
        setMessage("Email envoyé !");
        setSendConfirm(false);
      } catch {
        setMessage(
          "Envoi bloqué : vérifiez le contact, l'email et la config SMTP.",
        );
      }
      setTimeout(() => setMessage(""), 5000);
    });
  };

  const handleDelete = () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }
    startTransition(async () => {
      await deleteEmail(email.id);
      router.push("/emails");
    });
  };

  return (
    <div className="space-y-4">
      {/* Meta info */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-[#969BA8]">
        <span>
          À :{" "}
          <span className="text-white/60">
            {email.canViewContactDetails && email.recipient.name
              ? `${email.recipient.name} — ${email.recipient.role || "Décideur qualifié"}`
              : email.recipient.role ||
                email.company.contactRole ||
                "Décideur qualifié"}
          </span>
        </span>
        {email.contactReady && (
          <>
            <span>·</span>
            <span className={sendable ? "text-[#FF6B3D]" : "text-[#f59e0b]"}>
              {sendable
                ? "Contact vérifié et outreach approuvé"
                : "Validation humaine requise"}
            </span>
          </>
        )}
        <span>·</span>
        <span>{email.company.name}</span>
        {email.prospect && (
          <>
            <span>·</span>
            <span>
              {email.prospect.player.firstName} {email.prospect.player.lastName}
            </span>
          </>
        )}
        <span>·</span>
        <span className="capitalize">{email.status}</span>
        {email.sentAt && (
          <>
            <span>·</span>
            <span>
              Envoyé le{" "}
              {email.sentAt.toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </>
        )}
      </div>

      {email.canViewContactDetails ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-xs ${
            email.recipient.email
              ? "border-emerald-400/15 bg-emerald-400/[0.05] text-emerald-100/75"
              : "border-[#F59E0B]/20 bg-[#F59E0B]/[0.05] text-[#F6C978]"
          }`}
        >
          {email.recipient.email ? (
            <>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-white/45">Adresse d’envoi :</span>
                <span className="font-mono">{email.recipient.email}</span>
                <span className="rounded-full border border-white/[0.09] px-2 py-0.5 text-[9px] uppercase tracking-wider text-white/40">
                  {email.recipient.kind === "functional_generic"
                    ? "boîte fonctionnelle"
                    : "email professionnel"}
                </span>
                {isHttpUrl(email.recipient.source) ? (
                  <a
                    href={email.recipient.source}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[#C8CEFF] hover:underline"
                  >
                    Vérifier la source <ExternalLink className="h-3 w-3" />
                  </a>
                ) : null}
              </div>
              {email.recipient.evidence ? (
                <p className="mt-2 leading-relaxed text-white/45">
                  {email.recipient.evidence}
                </p>
              ) : null}
            </>
          ) : (
            "Aucune adresse exploitable n’est associée à ce brouillon."
          )}
        </div>
      ) : email.contactReady ? (
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] px-4 py-3 text-xs text-white/50">
          Une adresse qualifiée est disponible et protégée dans Vectis.
        </div>
      ) : null}

      {/* Subject */}
      <div>
        <label className="text-[11px] font-medium uppercase tracking-wider text-[#969BA8] mb-1 block">
          Objet
        </label>
        {isDraft ? (
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full rounded-2xl border border-white/[0.10] bg-white/[0.045] px-4 py-2.5 text-sm text-white placeholder-white/20 focus:border-[#FF6B3D]/30 focus:outline-none"
          />
        ) : (
          <p className="text-sm font-medium text-white">{subject}</p>
        )}
      </div>

      {/* Body */}
      <div>
        <label className="text-[11px] font-medium uppercase tracking-wider text-[#969BA8] mb-1 block">
          Corps
        </label>
        {isDraft ? (
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={12}
            className="w-full rounded-2xl border border-white/[0.10] bg-white/[0.045] px-4 py-3 text-sm text-white/80 placeholder-white/20 focus:border-[#FF6B3D]/30 focus:outline-none leading-relaxed resize-y"
          />
        ) : (
          <div className="rounded-lg bg-white/[0.045] p-4 text-sm text-white/70 whitespace-pre-wrap leading-relaxed">
            {body}
          </div>
        )}
      </div>

      {/* Message */}
      {message && (
        <div className="rounded-lg border border-[#FF6B3D]/20 bg-[#FF6B3D]/5 px-4 py-2 text-sm text-[#FF6B3D]">
          {message}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2">
        {isDraft && (
          <>
            <button
              onClick={handleSave}
              disabled={isPending || !hasChanges}
              className="flex items-center gap-1.5 rounded-lg bg-white/[0.06] px-4 py-2 text-sm text-white/60 hover:bg-white/[0.1] transition-colors disabled:opacity-40"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Sauvegarder
            </button>

            <button
              onClick={handleSend}
              disabled={isPending || !sendable}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-40 ${
                sendConfirm
                  ? "bg-[#f59e0b] text-[#0B0D12] hover:bg-[#f59e0b]/80"
                  : "bg-[#FF6B3D] text-[#0B0D12] hover:bg-[#FF865F]"
              }`}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {sendConfirm ? "Confirmer l'envoi" : "Envoyer"}
            </button>
            {sendConfirm && (
              <button
                onClick={() => setSendConfirm(false)}
                className="text-xs text-[#969BA8] hover:text-white/60"
              >
                Annuler
              </button>
            )}
          </>
        )}

        <button
          onClick={handleDelete}
          disabled={isPending}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition-colors ml-auto ${
            deleteConfirm
              ? "bg-red-500/20 text-red-400"
              : "text-[#969BA8] hover:text-red-400"
          }`}
        >
          <Trash2 className="h-4 w-4" />
          {deleteConfirm ? "Confirmer" : "Supprimer"}
        </button>
        {deleteConfirm && (
          <button
            onClick={() => setDeleteConfirm(false)}
            className="text-xs text-[#969BA8] hover:text-white/60"
          >
            Annuler
          </button>
        )}
      </div>
    </div>
  );
}

function isHttpUrl(value?: string | null): value is string {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
