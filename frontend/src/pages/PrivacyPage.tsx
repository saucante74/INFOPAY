/**
 * The "/confidentialite" route.
 *
 * ⚠️ NOT A LEGAL REVIEW. This content was written to be structurally
 * complete and factually accurate about what this specific codebase does,
 * but it has not been reviewed by a legal professional. It must be
 * validated by qualified counsel before this application is used with
 * real users or real payslip data. See RAPPORT.md for the same notice and
 * the list of remaining [À COMPLÉTER] placeholders.
 *
 * Every factual claim below (data flows, storage, absence of
 * authentication/encryption) is restricted to what's actually verifiable
 * in this codebase — checked file by file, see RAPPORT.md's "Section 8 —
 * Sécurité des données" entry for the specific files. Nothing here asserts
 * a security or retention measure the backend doesn't actually implement.
 */
export default function PrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <h1 className="text-2xl font-bold">Politique de confidentialité</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Dernière mise à jour : [À COMPLÉTER : date de mise à jour]
      </p>

      <div className="mt-6 space-y-6 rounded-lg border border-border bg-surface-raised p-4">
        <section>
          <h2 className="text-sm font-semibold text-ink">1. Objet</h2>
          <p className="mt-2 text-sm text-ink-soft">
            La présente politique de confidentialité décrit la manière dont InfoPay AI (ci-après «
            le Service ») collecte, utilise et conserve les données à caractère personnel des
            utilisateurs, conformément au Règlement (UE) 2016/679 du 27 avril 2016 (« RGPD ») et à
            la loi n° 78-17 du 6 janvier 1978 modifiée (« Loi Informatique et Libertés »).
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-ink">2. Responsable de traitement</h2>
          <p className="mt-2 text-sm text-ink-soft">
            Le responsable du traitement des données collectées via le Service est InfoPay AI.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-ink">3. Données collectées</h2>
          <p className="mt-2 text-sm text-ink-soft">
            Le Service traite les catégories de données suivantes :
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-soft">
            <li>
              Le fichier PDF du bulletin de paie importé par l'utilisateur, et le texte brut qui en
              est extrait ;
            </li>
            <li>
              Les huit champs structurés extraits de ce texte (mois et année, salaire brut, net
              imposable, net à payer, total des cotisations salariales, total des cotisations
              patronales, cotisations retraite, prélèvement à la source) ;
            </li>
            <li>
              Le contenu des questions posées à l'assistant conversationnel, dans la mesure où il
              est transmis pour générer une réponse.
            </li>
          </ul>
          <p className="mt-2 text-sm text-ink-soft">
            Ces données constituent des données à caractère personnel au sens de l'article 4 du
            RGPD, et relèvent en particulier de données de rémunération, considérées comme sensibles
            au sens usuel du terme (elles ne relèvent toutefois pas des catégories « particulières »
            de l'article 9 du RGPD, qui concernent la santé, l'origine raciale, les opinions
            politiques, etc.).
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-ink">4. Finalités du traitement</h2>
          <p className="mt-2 text-sm text-ink-soft">
            Les données sont traitées aux seules fins suivantes :
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-soft">
            <li>Extraction automatisée des informations structurées d'un bulletin de paie ;</li>
            <li>
              Calcul de statistiques exactes (sommes, moyennes, évolutions) à partir des bulletins
              importés par l'utilisateur ;
            </li>
            <li>
              Réponse aux questions posées par l'utilisateur à l'assistant conversationnel, y
              compris par recherche explicative dans le contenu des bulletins déjà importés.
            </li>
          </ul>
          <p className="mt-2 text-sm text-ink-soft">
            Aucune donnée n'est utilisée à des fins de profilage, de prospection commerciale ou de
            cession à des tiers autres que ceux mentionnés à la section 6.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-ink">5. Base légale du traitement</h2>
          <p className="mt-2 text-sm text-ink-soft">
            Le traitement repose sur le consentement de l'utilisateur (article 6.1.a du RGPD),
            matérialisé par l'action volontaire d'importer un bulletin de paie dans le Service. Ce
            consentement peut être retiré à tout moment en cessant d'utiliser le Service ; voir la
            section 10 pour l'exercice de vos droits sur les données déjà importées.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-ink">6. Destinataires des données</h2>
          <p className="mt-2 text-sm text-ink-soft">
            Le texte extrait de vos bulletins est transmis à l'API Claude, opérée par Anthropic, à
            des fins d'extraction structurée des données et de génération des réponses de
            l'assistant conversationnel. Il s'agit du seul destinataire tiers des données traitées
            par le Service ; aucune autre transmission à un tiers n'est effectuée.
          </p>
          <p className="mt-2 text-sm text-ink-soft">
            Ce traitement par un prestataire situé hors de l'Union européenne peut constituer un
            transfert de données hors UE au sens du chapitre V du RGPD. [À COMPLÉTER : référence aux
            garanties contractuelles applicables auprès d'Anthropic, par exemple clauses
            contractuelles types, si un accord de traitement des données a été signé avec ce
            prestataire — non vérifiable depuis le code de ce dépôt].
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-ink">7. Durée de conservation</h2>
          <p className="mt-2 text-sm text-ink-soft">
            En l'état actuel du Service, les bulletins importés et les données qui en sont extraites
            sont conservés indéfiniment : aucune purge automatique ni fonction de suppression
            accessible à l'utilisateur n'est actuellement implémentée. [À COMPLÉTER : durée de
            conservation cible, une fois qu'une politique de purge et/ou une fonctionnalité de
            suppression seront mises en place]. Jusqu'à cette évolution, toute demande de
            suppression doit être adressée au responsable de traitement (section 2), qui devra
            intervenir manuellement sur la base de données.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-ink">8. Sécurité des données</h2>
          <p className="mt-2 text-sm text-ink-soft">
            En toute transparence sur les mesures réellement en place à ce stade : les données
            extraites et le texte brut des bulletins sont stockés localement (base SQLite et index
            ChromaDB) sans chiffrement particulier au repos, et le Service ne dispose actuellement
            d'aucun système d'authentification ni de comptes utilisateurs — toute personne ayant
            accès à l'interface a accès à l'ensemble des bulletins déjà importés. Aucune mesure de
            sécurité supplémentaire (chiffrement, contrôle d'accès, journalisation) n'est
            actuellement implémentée dans le code du Service. InfoPay AI est un prototype de
            démonstration technique, non audité et non conçu pour un usage en production avec des
            données réelles.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-ink">9. Vos droits</h2>
          <p className="mt-2 text-sm text-ink-soft">
            Conformément aux articles 15 à 21 du RGPD, vous disposez, sur les données vous
            concernant, d'un droit d'accès, de rectification, d'effacement, de limitation du
            traitement, d'opposition et de portabilité. Compte tenu de l'absence de comptes
            utilisateurs (section 8), ces droits ne peuvent pas être exercés en libre-service depuis
            l'interface actuelle : ils doivent être exercés en contactant le responsable de
            traitement identifié à la section 2, qui traitera la demande manuellement.
          </p>
          <p className="mt-2 text-sm text-ink-soft">
            Vous disposez également du droit d'introduire une réclamation auprès de la Commission
            Nationale de l'Informatique et des Libertés (CNIL), autorité de contrôle française, si
            vous estimez que le traitement de vos données constitue une violation du RGPD.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-ink">10. Contact</h2>
          <p className="mt-2 text-sm text-ink-soft">
            Pour toute question relative à la présente politique ou pour exercer vos droits : [À
            COMPLÉTER : adresse e-mail de contact ou du délégué à la protection des données, si
            applicable].
          </p>
        </section>
      </div>
    </div>
  );
}
