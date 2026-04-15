"use client";

import { useState, useTransition } from "react";
import { Send, Save, Trash2, Loader2 } from "lucide-react";
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
    company: { name: string; contactEmail: string | null };
    prospect: {
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
        setMessage("Erreur lors de l'envoi. Vérifiez la config SMTP.");
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
      <div className="flex flex-wrap items-center gap-3 text-xs text-white/40">
        <span>
          À : <span className="text-white/60">{email.company.contactEmail || "Pas de contact"}</span>
        </span>
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

      {/* Subject */}
      <div>
        <label className="text-[11px] font-medium uppercase tracking-wider text-white/30 mb-1 block">
          Objet
        </label>
        {isDraft ? (
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder-white/20 focus:border-[#00d4aa]/30 focus:outline-none"
          />
        ) : (
          <p className="text-sm font-medium text-white">{subject}</p>
        )}
      </div>

      {/* Body */}
      <div>
        <label className="text-[11px] font-medium uppercase tracking-wider text-white/30 mb-1 block">
          Corps
        </label>
        {isDraft ? (
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={12}
            className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white/80 placeholder-white/20 focus:border-[#00d4aa]/30 focus:outline-none leading-relaxed resize-y"
          />
        ) : (
          <div className="rounded-lg bg-white/[0.03] p-4 text-sm text-white/70 whitespace-pre-wrap leading-relaxed">
            {body}
          </div>
        )}
      </div>

      {/* Message */}
      {message && (
        <div className="rounded-lg border border-[#00d4aa]/20 bg-[#00d4aa]/5 px-4 py-2 text-sm text-[#00d4aa]">
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
              disabled={isPending || !email.company.contactEmail}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-40 ${
                sendConfirm
                  ? "bg-[#f59e0b] text-[#07090f] hover:bg-[#f59e0b]/80"
                  : "bg-[#00d4aa] text-[#07090f] hover:bg-[#00e4ba]"
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
                className="text-xs text-white/30 hover:text-white/60"
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
              : "text-white/30 hover:text-red-400"
          }`}
        >
          <Trash2 className="h-4 w-4" />
          {deleteConfirm ? "Confirmer" : "Supprimer"}
        </button>
        {deleteConfirm && (
          <button
            onClick={() => setDeleteConfirm(false)}
            className="text-xs text-white/30 hover:text-white/60"
          >
            Annuler
          </button>
        )}
      </div>
    </div>
  );
}
