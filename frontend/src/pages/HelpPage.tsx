import FaqAccordion from "../components/FaqAccordion";

/**
 * The "/aide" route. Previously a modal (`HelpModal.tsx`, now removed) —
 * per user feedback, real pages were preferred once the app grew to 3
 * routes. `FaqAccordion` is reused unchanged in content; only the
 * surrounding chrome changed from dialog (backdrop, focus trap,
 * Escape-to-close) to a plain page. See RAPPORT.md.
 *
 * No outer wrapping card here (unlike the first version of this page):
 * `FaqAccordion` now renders each question as its own card, so a second
 * card wrapped around all of them would nest cards inside a card for no
 * reason — the accordion sits directly on the page background instead.
 */
export default function HelpPage() {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <h1 className="text-2xl font-bold">Aide</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Réponses aux questions les plus fréquentes sur InfoPay AI.
      </p>

      <div className="mt-6">
        <FaqAccordion />
      </div>
    </div>
  );
}
