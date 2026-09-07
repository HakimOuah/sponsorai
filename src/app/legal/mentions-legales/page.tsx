import type { Metadata } from "next";
import { LEGAL_UPDATED_AT, Todo } from "../Todo";

export const metadata: Metadata = {
  title: "Mentions légales — Vectis Agency",
  description:
    "Éditeur, hébergeur et informations légales du site vectis.agency.",
  robots: { index: false },
};

export default function MentionsLegalesPage() {
  return (
    <>
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#FF6B3D]">
        Dernière mise à jour : {LEGAL_UPDATED_AT}
      </p>
      <h1 className="mt-4">Mentions légales</h1>
      <p>
        Conformément à l&apos;article 6-III de la loi n° 2004-575 du 21 juin
        2004 pour la confiance dans l&apos;économie numérique, voici les
        informations relatives à l&apos;éditeur et à l&apos;hébergeur du site
        vectis.agency.
      </p>

      <h2>Éditeur du site</h2>
      <ul>
        <li>
          Dénomination : <Todo>raison sociale et forme juridique</Todo>
        </li>
        <li>
          Capital social : <Todo>montant</Todo>
        </li>
        <li>
          Siège social : <Todo>adresse complète</Todo>
        </li>
        <li>
          Immatriculation : <Todo>numéro SIREN et ville du RCS</Todo>
        </li>
        <li>
          Numéro de TVA intracommunautaire : <Todo>numéro</Todo>
        </li>
        <li>
          Directeur de la publication : <Todo>nom et prénom</Todo>
        </li>
        <li>
          Contact :{" "}
          <a href="mailto:contact@vectis.agency">contact@vectis.agency</a>
        </li>
      </ul>

      <h2>Hébergement</h2>
      <p>
        Le site est hébergé par Vercel Inc., 440 N Barranca Ave #4133, Covina,
        CA 91723, États-Unis (<a href="https://vercel.com">vercel.com</a>). La
        base de données est hébergée par Neon Inc. sur des serveurs situés dans
        l&apos;Union européenne (région AWS Francfort).
      </p>

      <h2>Propriété intellectuelle</h2>
      <p>
        La structure du site, les textes, la marque Vectis, le logo et les
        éléments graphiques sont la propriété de l&apos;éditeur. Toute
        reproduction, représentation ou adaptation, totale ou partielle, sans
        autorisation écrite préalable est interdite. Les marques et noms de
        sociétés cités sur la plateforme appartiennent à leurs titulaires
        respectifs.
      </p>

      <h2>Données personnelles</h2>
      <p>
        Le traitement des données personnelles est décrit dans la{" "}
        <a href="/legal/confidentialite">politique de confidentialité</a>.
        L&apos;utilisation de la plateforme est régie par les{" "}
        <a href="/legal/cgu">conditions générales d&apos;utilisation</a>.
      </p>
    </>
  );
}
