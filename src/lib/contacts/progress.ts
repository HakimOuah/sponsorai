/** User-facing stages only: never forward provider payloads, names or coordinates to SSE. */
export function enrichmentProgress(message: string): { progress: number; detail: string } {
  const value = message.toLowerCase();
  if (value.includes("boîte fonctionnelle")) return { progress: 85, detail: "Recherche d’une boîte officielle pour transmettre votre proposition au bon service." };
  if (value.includes("domaines email") || value.includes("sources officielles")) return { progress: 15, detail: "Vérification de l’entreprise, de sa page LinkedIn et de ses domaines email." };
  if (value.includes("linkedin")) return { progress: 35, detail: "Recherche des interlocuteurs actuels sur LinkedIn : sponsoring, partenariats et communication." };
  if (value.includes("puis vérifie") || value.includes("vérification technique") || value.includes("catch-all")) return { progress: 65, detail: "Recherche des emails et contrôle technique de leur joignabilité." };
  if (value.includes("recherche publique") || value.includes("web search") || value.includes("secours")) return { progress: 70, detail: "La recherche se poursuit sur les sources publiques officielles." };
  if (value.includes("apollo") || value.includes("sources structurées")) return { progress: 40, detail: "Recherche dans les sources de contacts disponibles." };
  if (value.includes("fiche entreprise") || value.includes("consolid")) return { progress: 95, detail: "Enregistrement des contacts et préparation du relais vers Rédacteur." };
  return { progress: 10, detail: "Enrichisseur prépare et vérifie les contacts de l’entreprise." };
}
