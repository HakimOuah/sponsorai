import { FileText } from "lucide-react";
import { getEmailTemplates } from "@/lib/actions/emails";
import { TemplateCard } from "@/components/emails/TemplateCard";
import { TemplateForm } from "@/components/emails/TemplateForm";

export const dynamic = "force-dynamic";

export default async function EmailTemplatesPage() {
  const templates = await getEmailTemplates();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-[#00d4aa]" />
          <h1 className="text-2xl font-bold text-white">Templates Email</h1>
        </div>
        <TemplateForm />
      </div>

      {templates.length === 0 ? (
        <div className="rounded-xl border border-white/[0.06] bg-[#0c1019] p-8 text-center">
          <FileText className="h-8 w-8 text-white/10 mx-auto mb-2" />
          <p className="text-sm text-white/40">Aucun template</p>
          <p className="text-xs text-white/20 mt-1">
            Créez un template pour standardiser vos emails de prospection
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map((template) => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </div>
      )}

      {/* Help section */}
      <div className="mt-8 rounded-xl border border-white/[0.06] bg-[#0c1019] p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-white/30 mb-2">
          Variables disponibles
        </h3>
        <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
          <Variable name="{joueur}" desc="Prénom + Nom du joueur" />
          <Variable name="{marque}" desc="Nom de l'entreprise" />
          <Variable name="{contact}" desc="Nom du contact" />
          <Variable name="{rationnel}" desc="Raison du match IA" />
          <Variable name="{secteur}" desc="Secteur de la marque" />
          <Variable name="{type_partenariat}" desc="Type de deal recommandé" />
        </div>
      </div>
    </div>
  );
}

function Variable({ name, desc }: { name: string; desc: string }) {
  return (
    <div className="flex items-start gap-2">
      <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[11px] text-[#00d4aa] shrink-0">
        {name}
      </code>
      <span className="text-white/40">{desc}</span>
    </div>
  );
}
