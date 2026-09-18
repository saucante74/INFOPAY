import { MessageSquare, Upload } from "lucide-react";
import type { ComponentType } from "react";
import { useState } from "react";

import type { RateLimits, RateLimitStatus } from "../api/types";

/** Matches the brief's own "≤ 3 restants" example — not tied to any
 * particular `limit` value, so it still means something whether the
 * configured quota is 20 or 5. */
const LOW_QUOTA_THRESHOLD = 3;

interface RateLimitBadgeProps {
  limits: RateLimits;
}

interface GaugeProps {
  status: RateLimitStatus;
  icon: ComponentType<{ className?: string }>;
  /** Plural noun, e.g. "imports" — used in the tooltip/aria-label text. */
  noun: string;
  /** French grammatical agreement for "restant(e)(s)" — "restants" or
   * "restantes" — kept as an explicit prop rather than derived, since
   * `noun`'s gender isn't something a generic pluralization rule can
   * infer ("imports" is masculine, "questions" is feminine). */
  remainingWord: string;
}

/**
 * One battery-style gauge: a thin outlined rectangle, filled left-to-right
 * in proportion to `remaining / limit`. `role="meter"` (a quantity within a
 * known range, which is exactly what a quota is — not `progressbar`, which
 * implies movement toward a fixed goal) carries the same detail as the
 * visual tooltip via `aria-label`, so a screen reader gets the full
 * sentence regardless of whether the tooltip itself ever renders for that
 * user. `aria-valuenow`/`aria-valuemin`/`aria-valuemax` are the structured
 * numbers alongside that free-text label.
 *
 * The tooltip is driven by a small local `isVisible` state, not pure CSS
 * `:hover`/`:focus` — the brief itself offers this as one of two equally
 * acceptable "no external dependency" options. Chosen over pure CSS
 * specifically because it's what's actually testable without a real
 * browser: jsdom (this project's test environment) never matches `:hover`
 * at all, so a CSS-only tooltip has no way for a test to observe it
 * appearing. `onMouseEnter`/`onMouseLeave` and `onFocus`/`onBlur` both
 * toggle the same state, so keyboard focus reveals the identical bubble
 * mouse hover does. `tabIndex={0}` makes the otherwise non-interactive
 * meter focusable at all. The bubble's own text is `aria-hidden`: it's a
 * visual duplicate of the `aria-label` a screen reader already has
 * unconditionally, and without `aria-hidden` a screen reader that also
 * happens to expose this hover-revealed DOM text would announce the same
 * sentence twice.
 */
function Gauge({ status, icon: Icon, noun, remainingWord }: GaugeProps) {
  const [isVisible, setIsVisible] = useState(false);
  const isLow = status.remaining <= LOW_QUOTA_THRESHOLD;
  const percentage = status.limit > 0 ? (100 * status.remaining) / status.limit : 0;
  const detail = `${String(status.remaining)} ${noun} ${remainingWord} sur ${String(status.limit)}`;

  return (
    <div
      role="meter"
      aria-label={detail}
      aria-valuenow={status.remaining}
      aria-valuemin={0}
      aria-valuemax={status.limit}
      tabIndex={0}
      onMouseEnter={() => {
        setIsVisible(true);
      }}
      onMouseLeave={() => {
        setIsVisible(false);
      }}
      onFocus={() => {
        setIsVisible(true);
      }}
      onBlur={() => {
        setIsVisible(false);
      }}
      className="relative flex items-center gap-1 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <Icon aria-hidden="true" className="h-4 w-4 shrink-0 text-ink-soft" />
      <span
        aria-hidden="true"
        className="h-2 w-[22px] shrink-0 overflow-hidden rounded-[2px] border border-border bg-surface"
      >
        <span
          style={{ width: `${String(percentage)}%` }}
          className={`block h-full rounded-[1px] transition-[width] ${isLow ? "bg-alert" : "bg-accent"}`}
        />
      </span>

      {/* No `role="tooltip"`: that role would only matter to assistive
          tech, which already has the full sentence via this meter's own
          `aria-label` — pairing it with `aria-hidden` would be
          contradictory, so this is plain presentational markup. */}
      {isVisible && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-full left-1/2 z-10 mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-xs text-surface"
        >
          {detail}
        </span>
      )}
    </div>
  );
}

/**
 * Battery-style quota gauges, one per rate-limited scope — replaces the
 * previous plain-text "15/20 imports · 18/20 questions" badge with the
 * same underlying data and update strategy (`useRateLimits.ts`,
 * `decrementRateLimit`, fetch-once-then-decrement-locally — none of that
 * changed here, only this component's rendering). Still placed in
 * `Navbar`'s icon cluster, immediately before the login/logout control,
 * for the same reason as before: both are session-scoped status, grouped
 * together rather than scattered near the logo.
 *
 * Low quota (`≤ 3`) still tints just that scope's own fill with the
 * existing `alert` token, independently per scope — see RAPPORT.md for the
 * real WCAG contrast numbers behind `bg-accent`/`bg-alert` against the
 * gauge's `bg-surface` track in both themes.
 */
export default function RateLimitBadge({ limits }: RateLimitBadgeProps) {
  return (
    <div className="flex items-center gap-3">
      <Gauge status={limits.upload} icon={Upload} noun="imports" remainingWord="restants" />
      <Gauge status={limits.chat} icon={MessageSquare} noun="questions" remainingWord="restantes" />
    </div>
  );
}
