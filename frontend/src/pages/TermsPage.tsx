import { Link } from "react-router";

/**
 * The "/conditions-utilisation" route. Deliberately minimal: this is a
 * portfolio/demo project, not a commercial product, so there is no real
 * contractual relationship to document — the honest content is saying so
 * plainly, not padding out a template ToS this project doesn't need.
 */
export default function TermsPage() {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <h1 className="text-2xl font-bold">Conditions d'utilisation</h1>
      <p className="mt-1 text-sm text-ink-soft">Ce que ce projet est, et ce qu'il n'est pas.</p>

      <div className="mt-6 space-y-6 rounded-lg border border-border bg-surface-raised p-4">
        <section>
          <h2 className="text-sm font-semibold text-ink">Un projet de démonstration</h2>
          <p className="mt-2 text-sm text-ink-soft">
            InfoPay AI est une démonstration technique, réalisée à titre de portfolio. Ce n'est pas
            un service commercial, il n'y a pas d'abonnement, pas de compte, et aucune garantie de
            disponibilité, de continuité ou de support n'est offerte.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-ink">Fourni tel quel</h2>
          <p className="mt-2 text-sm text-ink-soft">
            L'application est fournie « telle quelle », sans garantie d'exactitude des données
            extraites ou calculées. Voir la page{" "}
            <Link to="/confidentialite" className="underline hover:text-ink">
              Confidentialité
            </Link>{" "}
            pour le détail réel du traitement de vos données.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-ink">Ne pas utiliser pour de vraies données</h2>
          <p className="mt-2 text-sm text-ink-soft">
            Ce projet n'a pas été audité ni conçu pour un usage en production. N'y importez pas de
            bulletins de paie réels ou de données personnelles que vous ne souhaitez pas voir
            transiter par un service tiers (voir la page Confidentialité).
          </p>
        </section>
      </div>
    </div>
  );
}
