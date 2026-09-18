/**
 * The "/confidentialite" route. Every claim here is restricted to what's
 * actually verifiable in this codebase (checked file by file — see
 * RAPPORT.md, "Confidentialité"): no claim about encryption, third-party
 * data retention, or production-grade security is made unless the backend
 * actually implements it.
 */
export default function PrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <h1 className="text-2xl font-bold">Confidentialité</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Ce que cette version d'InfoPay AI fait réellement de vos données — sans rien promettre de
        plus.
      </p>

      <div className="mt-6 space-y-6 rounded-lg border border-border bg-surface-raised p-4">
        <section>
          <h2 className="text-sm font-semibold text-ink">Quelles données sont traitées</h2>
          <p className="mt-2 text-sm text-ink-soft">
            Le contenu des bulletins de paie PDF que vous importez : le texte brut du document, et
            les huit champs qui en sont extraits (mois, salaire brut, net à payer, cotisations,
            prélèvement à la source). Ce sont des données personnelles sensibles (rémunération) et
            elles sont traitées avec cette sensibilité en tête.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-ink">
            Un service tiers est impliqué dans le traitement
          </h2>
          <p className="mt-2 text-sm text-ink-soft">
            Le texte de vos bulletins est envoyé à l'API Claude d'Anthropic, à la fois pour
            l'extraction des données structurées et pour répondre à vos questions dans l'assistant.
            Ce n'est donc pas un traitement 100&nbsp;% local : une partie du contenu de vos
            bulletins quitte la machine qui exécute l'application le temps de cet appel.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-ink">Où vos données sont stockées</h2>
          <p className="mt-2 text-sm text-ink-soft">
            Les données extraites et le texte brut sont ensuite stockés localement, sur la machine
            qui exécute l'application (une base SQLite et un index ChromaDB), sans chiffrement
            particulier au repos.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-ink">Aucun système de comptes</h2>
          <p className="mt-2 text-sm text-ink-soft">
            L'application ne dispose d'aucune authentification ni de comptes utilisateurs : toute
            personne ayant accès à l'interface a accès à l'ensemble des bulletins déjà importés.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-ink">Statut de ce projet</h2>
          <p className="mt-2 text-sm text-ink-soft">
            InfoPay AI est un prototype de démonstration technique, pas une solution conçue ou
            validée pour héberger des données de production. N'y importez pas de bulletins de paie
            réels si cette description ne vous convient pas.
          </p>
        </section>
      </div>
    </div>
  );
}
