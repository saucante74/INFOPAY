import { ChevronDown } from "lucide-react";

/**
 * Grounded in this app's actual behaviour (see RAPPORT.md for the file-by-file
 * check), not a generic FAQ template. In particular the extraction/privacy
 * answers state only what `extraction.py`, `vectorstore.py` and `upload.py`
 * actually do — no encryption-at-rest or "fully local" claim the backend
 * doesn't back up.
 *
 * Content unchanged from the original visual pass — this file's only change
 * since then is presentational (individual cards instead of a compact
 * divided list), per the visual-refresh RAPPORT.md.
 */
const FAQ_ITEMS = [
  {
    question: "Quels formats de bulletins de paie sont acceptés ?",
    answer:
      "Seuls les fichiers PDF sont acceptés, un seul à la fois. Le PDF doit contenir " +
      "du texte sélectionnable : un bulletin scanné sous forme d'image, sans couche de " +
      "texte, ne peut pas être traité (l'application ne fait pas de reconnaissance " +
      "optique de caractères).",
  },
  {
    question: "Comment fonctionne l'extraction des données ?",
    answer:
      "Le texte du PDF est d'abord extrait localement, puis envoyé à un modèle d'IA " +
      "(l'API Claude d'Anthropic) qui identifie les huit champs clés du bulletin " +
      "(salaire brut, net à payer, cotisations, etc.) et les structure. Ces valeurs " +
      "sont ensuite stockées pour permettre des calculs exacts : l'IA sert à lire et " +
      "structurer le bulletin, jamais à faire elle-même un calcul.",
  },
  {
    question: "Quel type de questions puis-je poser à l'assistant ?",
    answer:
      "Deux types : des questions chiffrées, calculées exactement à partir de vos " +
      "bulletins importés (« Quel est le total de mes cotisations retraite sur les 4 " +
      "derniers mois ? », « Somme des cotisations sociales sur 6 mois », « Quelle est " +
      "la moyenne de mon net à payer ? »), et des questions explicatives sur une ligne " +
      "précise d'un bulletin (« À quoi correspond la ligne Sécurité Sociale " +
      "Déplafonnée ? »).",
  },
  {
    question: "Que faire si l'extraction d'un bulletin échoue ou semble incorrecte ?",
    answer:
      "Un échec affiche un message sous la zone d'import — le plus souvent parce que " +
      "le PDF est un scan sans texte, illisible ou n'est pas un bulletin de paie. " +
      "Vérifiez que le PDF s'ouvre normalement et que son texte est sélectionnable, " +
      "puis réessayez. Si les valeurs extraites semblent incorrectes, il n'existe pas " +
      "encore de fonction pour corriger ou supprimer un bulletin déjà importé — c'est " +
      "une limite connue de cette version.",
  },
  {
    question: "Mes bulletins de paie sont des données sensibles : sont-elles protégées ?",
    answer:
      "En toute transparence sur ce que cette version garantit réellement : le texte " +
      "de vos bulletins est envoyé à l'API Claude d'Anthropic pour l'extraction et " +
      "pour répondre à vos questions — ce n'est donc pas un traitement 100 % local. " +
      "Les données extraites et le texte brut sont ensuite stockés sur la machine qui " +
      "exécute l'application (base SQLite et index ChromaDB locaux), sans chiffrement " +
      "particulier au repos, et sans système de comptes utilisateurs : toute personne " +
      "ayant accès à l'interface a accès à tous les bulletins importés. Cette version " +
      "est un prototype, pas une solution conçue pour héberger des données de " +
      "production.",
  },
] as const satisfies readonly { question: string; answer: string }[];

export default function FaqAccordion() {
  return (
    <div className="space-y-4">
      {FAQ_ITEMS.map(({ question, answer }) => (
        <details
          key={question}
          className="faq-item group overflow-hidden rounded-lg border border-border bg-surface-raised"
        >
          <summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-5 py-4 text-base font-semibold text-ink marker:content-none">
            {question}
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface text-ink-soft transition-colors group-open:text-accent">
              <ChevronDown className="h-4 w-4 transition-transform duration-200 group-open:rotate-180" />
            </span>
          </summary>
          <p className="px-5 pb-5 text-sm leading-relaxed text-ink-soft">{answer}</p>
        </details>
      ))}
    </div>
  );
}
