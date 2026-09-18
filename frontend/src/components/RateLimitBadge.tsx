import type { RateLimits, RateLimitStatus } from "../api/types";

/** Matches the brief's own "≤ 3 restants" example — not tied to any
 * particular `limit` value, so it still means something whether the
 * configured quota is 20 or 5. */
const LOW_QUOTA_THRESHOLD = 3;

interface RateLimitBadgeProps {
  limits: RateLimits;
}

function Scope({ status, label }: { status: RateLimitStatus; label: string }) {
  const isLow = status.remaining <= LOW_QUOTA_THRESHOLD;
  return (
    <span className={isLow ? "text-alert" : undefined}>
      {status.remaining}/{status.limit} {label}
    </span>
  );
}

/**
 * A compact, always-plain-text quota indicator — not a gauge/progress-bar:
 * with only two scopes and a handful of possible values, a mini visual
 * gauge would take about as much navbar width as the text itself while
 * adding a visual element this design system doesn't otherwise have, for a
 * number that reads perfectly well as text. Low quota (`≤ 3`, per the
 * brief's own example) tints just that scope's own text with the existing
 * `alert` token — no icon, no background fill, no animation — so it stays
 * the "discreet" signal the brief asked for rather than a warning banner.
 *
 * Placed in `Navbar`'s icon cluster, immediately before the login/logout
 * control: both are session-scoped status (only meaningful once logged in,
 * per the brief itself), so grouping them together reads as "everything
 * about your current session" rather than scattering it near the logo,
 * which is pure branding and unrelated to any account state.
 */
export default function RateLimitBadge({ limits }: RateLimitBadgeProps) {
  return (
    <div className="flex items-center gap-1 text-xs text-ink-soft">
      <Scope status={limits.upload} label="imports" />
      <span aria-hidden="true">·</span>
      <Scope status={limits.chat} label="questions" />
    </div>
  );
}
