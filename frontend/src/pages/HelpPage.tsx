import FaqAccordion from "../components/FaqAccordion";

/**
 * The "/aide" route. Previously a modal (`HelpModal.tsx`, now removed) —
 * per user feedback, real pages were preferred once the app grew to 3
 * routes. `FaqAccordion` is reused unchanged; only the surrounding chrome
 * changed from dialog (backdrop, focus trap, Escape-to-close) to a plain
 * page, since none of that machinery has a purpose once this is real,
 * navigable content instead of an overlay. See RAPPORT.md.
 */
export default function HelpPage() {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <h1 className="text-2xl font-bold">Aide</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Réponses aux questions les plus fréquentes sur InfoPay AI.
      </p>

      <div className="mt-6 rounded-lg border border-border bg-surface-raised px-4 py-2">
        <FaqAccordion />
      </div>
    </div>
  );
}
