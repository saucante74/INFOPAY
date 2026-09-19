import { MessageSquare, Upload } from "lucide-react";
import type { ComponentType } from "react";
import { useEffect, useRef, useState } from "react";

import type { RateLimits, RateLimitStatus } from "../api/types";
import { refreshRateLimits } from "../hooks/useRateLimits";

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

function secondsUntil(isoDate: string): number {
  return Math.max(0, Math.round((new Date(isoDate).getTime() - Date.now()) / 1000));
}

/** "3h 42min" / "42min" / "< 1 min" — compact enough for the navbar, and
 * granular enough that the display only changes once a minute (the
 * countdown's own interval still ticks every second, purely so the zero
 * crossing — which triggers a refetch — is caught within a second of it
 * actually happening, not so this text updates that often). */
function formatCountdown(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return `${String(hours)}h ${String(minutes)}min`;
  if (minutes > 0) return `${String(minutes)}min`;
  return "< 1 min";
}

/** Which of the two scopes resets first, and when. */
function pickSoonestReset(limits: RateLimits): { scope: "upload" | "chat"; resetAt: string } {
  const scope = limits.upload.reset_at <= limits.chat.reset_at ? "upload" : "chat";
  return { scope, resetAt: limits[scope].reset_at };
}

/**
 * Countdown to the soonest of the two scopes' `reset_at` — reused from
 * `limits`, the same prop the gauges already render from, so this adds no
 * network call of its own (per the brief). Ticks client-side from a
 * `setInterval`, not a per-second refetch.
 *
 * Rendered with `key={resetAt}` by `RateLimitBadge` below: when `resetAt`
 * changes (a new window opened after a refetch, or the soonest-resetting
 * scope switched), React remounts this component from scratch instead of
 * this effect reaching back to resync `secondsLeft` itself — the same
 * "reset state via `key`" pattern React's own docs recommend over calling
 * `setState` synchronously inside an effect (flagged by this project's
 * `react-hooks/set-state-in-effect` lint rule).
 *
 * Hidden once it reaches zero rather than showing "0h 0min": at that point
 * the window has already slid open server-side, so the honest state is
 * "quota renewed," not "still counting down." A single `refreshRateLimits()`
 * call (guarded by `hasRefreshedRef` so it fires once, not every remaining
 * tick of the interval) brings `limits` back in sync — `Navbar`'s own
 * `useRateLimits()` re-renders this component with the fresh numbers once
 * that resolves, same as after any other `decrementRateLimit`/refetch.
 */
function Countdown({ scope, resetAt }: { scope: "upload" | "chat"; resetAt: string }) {
  const [secondsLeft, setSecondsLeft] = useState(() => secondsUntil(resetAt));
  const hasRefreshedRef = useRef(false);

  useEffect(() => {
    const id = setInterval(() => {
      setSecondsLeft(secondsUntil(resetAt));
    }, 1000);
    return () => {
      clearInterval(id);
    };
  }, [resetAt]);

  useEffect(() => {
    if (secondsLeft <= 0 && !hasRefreshedRef.current) {
      hasRefreshedRef.current = true;
      refreshRateLimits().catch(() => {
        // Intentionally silent — same convention as useRateLimits' own
        // fetch: a failed resync just leaves the badge as-is until the next
        // successful upload/chat call or page load reconciles it.
      });
    }
  }, [secondsLeft]);

  if (secondsLeft <= 0) return null;

  const scopeLabel = scope === "upload" ? "d'imports" : "de questions";
  return (
    <span
      className="text-xs whitespace-nowrap text-ink-soft"
      aria-label={`Réinitialisation du quota ${scopeLabel} dans ${formatCountdown(secondsLeft)}`}
      title={`Réinitialisation du quota ${scopeLabel}`}
    >
      {formatCountdown(secondsLeft)}
    </span>
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
  const { scope, resetAt } = pickSoonestReset(limits);
  return (
    <div className="flex items-center gap-3">
      <Countdown key={resetAt} scope={scope} resetAt={resetAt} />
      <Gauge status={limits.upload} icon={Upload} noun="imports" remainingWord="restants" />
      <Gauge status={limits.chat} icon={MessageSquare} noun="questions" remainingWord="restantes" />
    </div>
  );
}
