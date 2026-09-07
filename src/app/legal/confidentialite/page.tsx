import type { Metadata } from "next";
import { LEGAL_UPDATED_AT, Todo } from "../Todo";

export const metadata: Metadata = {
  title: "Politique de confidentialité — Vectis Agency",
  description:
    "Quelles données Vectis traite, pourquoi, avec quels prestataires, et comment exercer vos droits.",
  robots: { index: false },
};

export default function ConfidentialitePage() {
  return (
    <>
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#FF6B3D]">
        Dernière mise à jour : {LEGAL_UPDATED_AT}
      </p>
      <h1 className="mt-4">Politique de confidentialité</h1>
      <p>
        Vectis est une plateforme de prospection sponsoring destinée aux
        représentants de sportifs. Cette page décrit les données que nous
        traitons, pourquoi, pendant combien de temps, avec quels prestataires,
        et comment exercer vos droits au titre du Règlement général sur la
        protection des données (RGPD) et de la loi Informatique et Libertés.
      </p>

      <h2>Responsable du traitement</h2>
      <p>
        <Todo>raison sociale</Todo>, <Todo>adresse du siège</Todo>. Contact
        pour toute question relative aux données :{" "}
        <a href="mailto:contact@vectis.agency">contact@vectis.agency</a>.
      </p>

      <h2>Quelles données, pour quelles personnes</h2>

      <h3>Visiteurs du site vectis.agency</h3>
      <p>
        Le site public ne dépose aucun cookie de mesure d&apos;audience ni de
        publicité. Les journaux techniques de l&apos;hébergeur (adresse IP,
        pages consultées, navigateur) sont conservés pour la sécurité et le bon
        fonctionnement du service.
      </p>

      <h3>Utilisateurs de la plateforme</h3>
      <p>
        Pour ouvrir et gérer votre compte : nom, adresse e-mail professionnelle,
        mot de passe (stocké sous forme hachée), rôle, journaux de connexion et
        d&apos;activité. Si vous connectez une boîte Gmail, Google Workspace,
        Outlook ou Microsoft 365, nous conservons les jetons d&apos;accès
        nécessaires pour envoyer vos e-mails depuis votre adresse et lire les
        réponses aux messages envoyés via la plateforme. Nous n&apos;accédons pas
        au reste de votre boîte. Vous pouvez révoquer cet accès à tout moment
        depuis les paramètres ou depuis votre compte Google ou Microsoft.
      </p>

      <h3>Sportifs et clubs représentés</h3>
      <p>
        Les informations que vous saisissez sur les sportifs et clubs de votre
        portefeuille : identité, club, discipline, comptes de réseaux sociaux
        publics et audiences, positionnement, langues, notes. Vous êtes
        responsable d&apos;informer les personnes concernées de ce traitement.
        Vectis agit pour ces données en qualité de sous-traitant, conformément
        aux <a href="/legal/cgu">conditions d&apos;utilisation</a>.
      </p>

      <h3>Contacts professionnels au sein des marques</h3>
      <p>
        Pour vous permettre de contacter le bon interlocuteur, Vectis collecte
        des données professionnelles sur les responsables partenariats,
        marketing et sponsoring des entreprises identifiées : nom, fonction,
        entreprise, adresse e-mail professionnelle, adresse de profil public.
        Ces données proviennent de sources publiques (site de
        l&apos;entreprise, communiqués, profils professionnels publics) et de
        prestataires d&apos;enrichissement B2B.
      </p>
      <p>
        Ce traitement repose sur l&apos;intérêt légitime de Vectis et de ses
        utilisateurs à proposer des partenariats commerciaux à des
        professionnels dans le cadre de leurs fonctions. Nous limitons ce
        traitement de plusieurs manières : les coordonnées ne sont jamais
        affichées aux utilisateurs non administrateurs ni exportées, chaque
        premier e-mail est validé par un humain avant envoi, les relances ne
        sont envoyées qu&apos;en l&apos;absence de réponse, et toute demande
        d&apos;opposition met fin aux sollicitations.
      </p>
      <p>
        Si vous êtes un professionnel contacté via Vectis et souhaitez ne plus
        l&apos;être, écrivez à{" "}
        <a href="mailto:contact@vectis.agency">contact@vectis.agency</a> ou
        répondez simplement au message reçu. Votre demande est prise en compte
        sans justification.
      </p>

      <h2>Finalités</h2>
      <ul>
        <li>Fournir la plateforme et gérer les comptes utilisateurs.</li>
        <li>
          Rechercher et évaluer des marques cohérentes avec le profil
          d&apos;un sportif.
        </li>
        <li>
          Identifier, vérifier et contacter les interlocuteurs en charge des
          partenariats.
        </li>
        <li>
          Rédiger, envoyer et suivre les e-mails de prospection et leurs
          réponses.
        </li>
        <li>
          Améliorer les recommandations à partir des résultats des campagnes
          (réponses, rendez-vous, contrats), sous forme de statistiques
          agrégées par rôle, secteur et taille d&apos;entreprise.
        </li>
        <li>Assurer la sécurité du service et respecter nos obligations légales.</li>
      </ul>

      <h2>Prestataires et transferts</h2>
      <p>
        Nous faisons appel aux prestataires suivants, chacun n&apos;accédant
        qu&apos;aux données nécessaires à sa mission :
      </p>
      <ul>
        <li>
          <strong>Vercel Inc.</strong> (États-Unis) : hébergement de
          l&apos;application.
        </li>
        <li>
          <strong>Neon Inc.</strong> : base de données, serveurs situés dans
          l&apos;Union européenne (Francfort).
        </li>
        <li>
          <strong>Anthropic PBC</strong> (États-Unis) : modèles d&apos;IA
          utilisés pour la recherche de marques, le scoring, la rédaction des
          e-mails et la classification des réponses. Les données transmises ne
          sont pas utilisées pour entraîner les modèles.
        </li>
        <li>
          <strong>xAI Corp.</strong> (États-Unis) : modèle d&apos;IA avec
          recherche web, utilisé pour la découverte de marques.
        </li>
        <li>
          <strong>Monid</strong>, <strong>Hunter</strong> et{" "}
          <strong>Apollo</strong> : identification et vérification des
          contacts professionnels des marques.
        </li>
        <li>
          <strong>Google LLC</strong> et <strong>Microsoft Corporation</strong>{" "}
          : envoi et réception d&apos;e-mails via la boîte que vous connectez.
        </li>
      </ul>
      <p>
        Les transferts hors Union européenne sont encadrés par les clauses
        contractuelles types de la Commission européenne ou par le Data
        Privacy Framework UE–États-Unis lorsque le prestataire y est certifié.
      </p>

      <h2>Durées de conservation</h2>
      <ul>
        <li>
          Compte utilisateur et données du portefeuille : pendant la durée de
          la relation contractuelle, puis <Todo>durée, par ex. 12 mois</Todo>{" "}
          après la clôture du compte.
        </li>
        <li>
          Contacts professionnels des marques : <Todo>durée, par ex. 3 ans</Todo>{" "}
          à compter du dernier échange, puis suppression ou anonymisation.
        </li>
        <li>Journaux techniques et de sécurité : 12 mois.</li>
        <li>
          Statistiques d&apos;apprentissage : conservées sous forme agrégée,
          sans identification directe des personnes.
        </li>
      </ul>

      <h2>Vos droits</h2>
      <p>
        Vous disposez d&apos;un droit d&apos;accès, de rectification,
        d&apos;effacement, de limitation, d&apos;opposition et de portabilité
        de vos données. Pour l&apos;exercer, écrivez à{" "}
        <a href="mailto:contact@vectis.agency">contact@vectis.agency</a>. Nous
        répondons dans un délai d&apos;un mois. Vous pouvez également saisir la
        CNIL (<a href="https://www.cnil.fr">cnil.fr</a>).
      </p>

      <h2>Cookies</h2>
      <p>
        La plateforme utilise uniquement un cookie de session strictement
        nécessaire à l&apos;authentification. Aucun cookie tiers, publicitaire
        ou de mesure d&apos;audience n&apos;est déposé.
      </p>

      <h2>Modifications</h2>
      <p>
        Cette politique peut évoluer avec le service. La date de mise à jour
        figure en haut de page. En cas de changement substantiel, les
        utilisateurs de la plateforme en sont informés par e-mail.
      </p>
    </>
  );
}
