import { Link } from "react-router";

/**
 * The "/conditions-utilisation" route.
 *
 * ⚠️ NOT A LEGAL REVIEW. This content was written to be structurally
 * complete (the sections a real terms-of-service document for this kind
 * of application would typically cover) and honest about what this
 * project actually is, but it has not been reviewed by a legal
 * professional. It must be validated by qualified counsel before this
 * application is used with real users. See RAPPORT.md for the same
 * notice and the list of remaining [À COMPLÉTER] placeholders.
 *
 * A professional tone does not translate into false claims: every
 * statement about the service's nature (prototype, no uptime guarantee,
 * no authentication) stays consistent with PrivacyPage.tsx and with
 * what's actually true of this codebase.
 */
export default function TermsPage() {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <h1 className="text-2xl font-bold">Conditions générales d'utilisation</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Dernière mise à jour : 17 Septembre 2026
      </p>

      <div className="mt-6 space-y-6 rounded-lg border border-border bg-surface-raised p-4">
        <section>
          <h2 className="text-sm font-semibold text-ink">1. Objet</h2>
          <p className="mt-2 text-sm text-ink-soft">
            Les présentes conditions générales d'utilisation (« CGU ») régissent l'accès et
            l'utilisation d'InfoPay AI (« le Service »), une application de démonstration technique
            permettant d'importer des bulletins de paie au format PDF, d'en extraire automatiquement
            certaines données, et d'interroger un assistant conversationnel à leur sujet.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-ink">2. Acceptation des conditions</h2>
          <p className="mt-2 text-sm text-ink-soft">
            L'utilisation du Service, notamment l'import d'un bulletin de paie, vaut acceptation
            pleine et entière des présentes CGU ainsi que de la{" "}
            <Link to="/confidentialite" className="underline hover:text-ink">
              politique de confidentialité
            </Link>
            . Si vous n'acceptez pas ces conditions, vous ne devez pas utiliser le Service.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-ink">3. Description du service</h2>
          <p className="mt-2 text-sm text-ink-soft">
            InfoPay AI est un projet de démonstration technique, réalisé à titre de portfolio. Ce
            n'est pas un service commercial : il n'existe pas d'abonnement, de compte utilisateur,
            de contrat de service (SLA) ni d'engagement de niveau de service d'aucune sorte. Le
            Service traite les bulletins importés au moyen d'une extraction automatisée assistée par
            un modèle d'intelligence artificielle tiers (voir la{" "}
            <Link to="/confidentialite" className="underline hover:text-ink">
              politique de confidentialité
            </Link>
            ), dont les résultats peuvent contenir des erreurs.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-ink">4. Obligations de l'utilisateur</h2>
          <p className="mt-2 text-sm text-ink-soft">L'utilisateur s'engage à :</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-soft">
            <li>
              Ne pas importer de bulletins de paie réels ou de données personnelles qu'il ne
              souhaite pas voir transmises à un service tiers, compte tenu de la nature de
              démonstration du Service (voir la politique de confidentialité) ;
            </li>
            <li>
              N'importer que des documents dont il est le propriétaire légitime ou qu'il est
              autorisé à traiter ;
            </li>
            <li>
              Ne pas utiliser le Service à des fins illicites ou de nature à porter atteinte aux
              droits de tiers ;
            </li>
            <li>
              Ne pas tenter de contourner les limitations techniques du Service ou d'accéder à des
              données autres que les siennes.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-ink">5. Limitation de responsabilité</h2>
          <p className="mt-2 text-sm text-ink-soft">
            Le Service est fourni « en l'état » et « selon disponibilité », sans garantie d'aucune
            sorte, expresse ou implicite, notamment quant à l'exactitude, la fiabilité ou
            l'exhaustivité des données extraites ou des calculs produits. L'utilisateur reconnaît
            que le Service constitue un prototype non audité et s'interdit de fonder une décision
            financière, fiscale ou juridique sur les résultats qu'il produit sans vérification
            indépendante. Dans toute la mesure permise par la loi applicable, l'éditeur du Service
            ne saurait être tenu responsable des dommages directs ou indirects résultant de
            l'utilisation ou de l'impossibilité d'utiliser le Service.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-ink">6. Propriété intellectuelle</h2>
          <p className="mt-2 text-sm text-ink-soft">
            Le code source, les marques, logos et éléments graphiques du Service sont la propriété
            de leur auteur ou de leurs ayants droit respectifs. Les bulletins de paie importés par
            l'utilisateur et les données qui en sont extraites restent la propriété de l'utilisateur
            ; leur import ne confère à l'éditeur du Service aucun droit de propriété intellectuelle
            sur ce contenu, dans les limites de ce qui est décrit à la politique de confidentialité
            quant à leur traitement.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-ink">7. Disponibilité du service</h2>
          <p className="mt-2 text-sm text-ink-soft">
            Compte tenu de la nature de démonstration technique de ce projet, aucune garantie de
            disponibilité, de continuité, de maintenance corrective ou d'assistance n'est offerte.
            Le Service peut être interrompu, modifié ou arrêté à tout moment, sans préavis.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-ink">8. Modification des conditions</h2>
          <p className="mt-2 text-sm text-ink-soft">
            Les présentes CGU peuvent être modifiées à tout moment. La date de dernière mise à jour
            figurant en tête de cette page fait foi. Il appartient à l'utilisateur de consulter
            régulièrement cette page.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-ink">9. Droit applicable et juridiction</h2>
          <p className="mt-2 text-sm text-ink-soft">
            Les présentes CGU sont soumises au droit français. À défaut de résolution amiable, tout
            litige relatif à leur interprétation ou leur exécution relève de la compétence exclusive
            des tribunaux compétents.
          </p>
        </section>

      </div>
    </div>
  );
}
