import type { Metadata } from "next";
import { LEGAL_UPDATED_AT, Todo } from "../Todo";

export const metadata: Metadata = {
  title: "Conditions générales d'utilisation — Vectis Agency",
  description:
    "Règles d'accès et d'utilisation de la plateforme Vectis.",
  robots: { index: false },
};

export default function CguPage() {
  return (
    <>
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#FF6B3D]">
        Dernière mise à jour : {LEGAL_UPDATED_AT}
      </p>
      <h1 className="mt-4">Conditions générales d&apos;utilisation</h1>
      <p>
        Les présentes conditions régissent l&apos;accès et l&apos;utilisation
        de la plateforme Vectis, éditée par <Todo>raison sociale</Todo>{" "}
        (« Vectis »). En utilisant la plateforme, vous les acceptez sans
        réserve.
      </p>

      <h2>1. Objet</h2>
      <p>
        Vectis est un logiciel en ligne qui aide les représentants de sportifs
        et de clubs à identifier des marques partenaires, à trouver les
        interlocuteurs en charge des partenariats, à rédiger et envoyer des
        e-mails de prospection, et à suivre les opportunités jusqu&apos;à la
        signature. Vectis fournit un outil, pas un service de représentation :
        les échanges avec les marques sont menés par l&apos;utilisateur, en son
        nom.
      </p>

      <h2>2. Accès</h2>
      <p>
        La plateforme est actuellement proposée en bêta privée, sur invitation.
        Les comptes sont créés par Vectis. L&apos;utilisateur garde ses
        identifiants confidentiels et est responsable de toute activité
        réalisée depuis son compte. Vectis peut suspendre un compte en cas de
        manquement aux présentes conditions.
      </p>

      <h2>3. Utilisation conforme</h2>
      <p>L&apos;utilisateur s&apos;engage à :</p>
      <ul>
        <li>
          utiliser la plateforme dans un cadre professionnel, pour des
          sportifs et clubs qu&apos;il représente effectivement ;
        </li>
        <li>
          relire et valider chaque e-mail avant envoi, et assumer le contenu
          des messages envoyés depuis sa boîte ;
        </li>
        <li>
          respecter la réglementation applicable à la prospection
          commerciale, notamment le RGPD et les règles relatives aux
          sollicitations B2B ;
        </li>
        <li>
          ne pas exporter, revendre ou détourner les données de contact mises
          à disposition, ni contourner les protections qui les encadrent ;
        </li>
        <li>
          ne pas utiliser la plateforme pour envoyer des messages massifs,
          trompeurs ou non sollicités hors de son objet.
        </li>
      </ul>

      <h2>4. Intelligence artificielle</h2>
      <p>
        Les résultats produits par les agents (marques proposées, scores,
        interlocuteurs, brouillons d&apos;e-mails, classification des réponses)
        sont générés automatiquement à partir de sources publiques et de
        modèles d&apos;IA. Ils peuvent contenir des erreurs ou des
        approximations. Ils constituent une aide à la décision, pas un
        conseil, et doivent être vérifiés par l&apos;utilisateur avant toute
        action.
      </p>

      <h2>5. Données</h2>
      <p>
        L&apos;utilisateur reste propriétaire des données qu&apos;il saisit sur
        ses sportifs et clubs. Il garantit disposer du droit de les traiter et
        d&apos;en informer les personnes concernées. Vectis agit comme
        sous-traitant pour ces données et comme responsable de traitement pour
        les données de contact des marques, dans les conditions décrites dans
        la <a href="/legal/confidentialite">politique de confidentialité</a>.
        Les résultats de campagne peuvent être utilisés sous forme agrégée
        pour améliorer les recommandations de la plateforme.
      </p>

      <h2>6. Propriété intellectuelle</h2>
      <p>
        La plateforme, sa marque, son code et son interface restent la
        propriété de Vectis. L&apos;utilisateur bénéficie d&apos;un droit
        d&apos;usage personnel, non exclusif et non cessible, pour la durée de
        son accès.
      </p>

      <h2>7. Responsabilité</h2>
      <p>
        Vectis met en œuvre des moyens raisonnables pour assurer la
        disponibilité et la sécurité du service, sans garantie de résultat.
        Vectis ne garantit ni le taux de réponse des marques ni la conclusion
        de contrats. La responsabilité de Vectis ne saurait être engagée pour
        les messages envoyés par l&apos;utilisateur, les décisions prises sur
        la base des résultats de la plateforme, ou l&apos;indisponibilité des
        services tiers connectés.
      </p>

      <h2>8. Durée et résiliation</h2>
      <p>
        L&apos;accès est accordé pour la durée de la bêta puis selon les
        conditions commerciales convenues. Chaque partie peut y mettre fin par
        e-mail. À la clôture, les données du portefeuille sont supprimées dans
        les délais indiqués dans la politique de confidentialité, sur simple
        demande d&apos;export préalable.
      </p>

      <h2>9. Droit applicable</h2>
      <p>
        Les présentes conditions sont soumises au droit français. À défaut
        d&apos;accord amiable, tout litige relève des tribunaux compétents de{" "}
        <Todo>ville du siège social</Todo>.
      </p>

      <h2>Contact</h2>
      <p>
        <a href="mailto:contact@vectis.agency">contact@vectis.agency</a>
      </p>
    </>
  );
}
