import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { Payslip } from "../api/types";

const formatEuros = (value: number): string =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);

/**
 * Recharts types a tooltip value as `number | string | (number | string)[]`,
 * because a tooltip can front a stacked or range series. Ours are plain
 * numeric `dataKey`s, so the number branch is the only one reached at
 * runtime — but it's narrowed rather than asserted, and the other branches
 * fall back to plain text instead of feeding a non-number to
 * `Intl.NumberFormat`.
 */
const formatTooltipValue = (value: unknown): string =>
  typeof value === "number" ? formatEuros(value) : String(value);

/**
 * `mois_annee` is "MM/YYYY" (see `analytics.py`'s own parsing of the same
 * field). Turned into a single comparable integer rather than a `Date` —
 * no timezone/day-of-month ambiguity to introduce for a value that's only
 * ever a month and a year.
 */
const monthIndex = (moisAnnee: string): number => {
  const [month, year] = moisAnnee.split("/");
  return Number(year) * 12 + Number(month);
};

/**
 * Exported so the ordering fix has a direct unit test: Recharts'
 * `ResponsiveContainer` never mounts under jsdom (no `ResizeObserver`, see
 * `PayslipChart.test.tsx`), so nothing about the actual chart's data order
 * can be asserted through rendering. Oldest first — a time-evolution chart
 * reads left-to-right like any other, and the API isn't guaranteed to hand
 * payslips back in chronological order (see RAPPORT.md).
 */
export function sortChronologically(payslips: readonly Payslip[]): Payslip[] {
  return [...payslips].sort((a, b) => monthIndex(a.mois_annee) - monthIndex(b.mois_annee));
}

interface PayslipChartProps {
  payslips: readonly Payslip[];
}

export default function PayslipChart({ payslips }: PayslipChartProps) {
  if (payslips.length < 2) {
    return (
      <div className="rounded-lg border border-border bg-surface-raised px-6 py-10 text-center text-sm text-ink-soft">
        Importez au moins deux bulletins pour voir apparaître l'évolution.
      </div>
    );
  }

  const data = sortChronologically(payslips).map((p) => ({
    mois: p.mois_annee,
    Brut: p.salaire_brut,
    "Net imposable": p.net_imposable,
    "Net à payer": p.net_a_payer,
    Cotisations: p.total_cotisations_salariales,
  }));

  return (
    <div className="rounded-lg border border-border bg-surface-raised p-4">
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="3 3" />
          <XAxis
            dataKey="mois"
            tick={{ fontSize: 12, fill: "var(--color-ink-soft)" }}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "var(--color-ink-soft)" }}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={formatEuros}
            width={80}
          />
          <Tooltip
            formatter={formatTooltipValue}
            contentStyle={{
              backgroundColor: "var(--color-surface-raised)",
              border: "1px solid var(--color-border)",
              borderRadius: "0.5rem",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            }}
            labelStyle={{ color: "var(--color-ink)", fontWeight: 600, marginBottom: 4 }}
            itemStyle={{ color: "var(--color-ink-soft)" }}
            cursor={{ stroke: "var(--color-border)", strokeWidth: 1 }}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: "var(--color-ink-soft)" }} />
          <Line
            type="monotone"
            dataKey="Brut"
            stroke="var(--color-accent)"
            strokeWidth={2.5}
            strokeLinecap="round"
            dot={{ r: 3, strokeWidth: 2, fill: "var(--color-surface-raised)" }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="Net imposable"
            stroke="var(--color-chart-net-imposable)"
            strokeWidth={2.5}
            strokeLinecap="round"
            dot={{ r: 3, strokeWidth: 2, fill: "var(--color-surface-raised)" }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="Net à payer"
            stroke="var(--color-chart-net)"
            strokeWidth={2.5}
            strokeLinecap="round"
            dot={{ r: 3, strokeWidth: 2, fill: "var(--color-surface-raised)" }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="Cotisations"
            stroke="var(--color-chart-cotisations)"
            strokeWidth={2.5}
            strokeLinecap="round"
            dot={{ r: 3, strokeWidth: 2, fill: "var(--color-surface-raised)" }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
