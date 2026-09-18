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

  const data = payslips.map((p) => ({
    mois: p.mois_annee,
    Brut: p.salaire_brut,
    "Net à payer": p.net_a_payer,
    Cotisations: p.total_cotisations_salariales,
  }));

  return (
    <div className="rounded-lg border border-border bg-surface-raised p-4">
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="mois" tick={{ fontSize: 12 }} stroke="#4b5563" />
          <YAxis tick={{ fontSize: 12 }} stroke="#4b5563" tickFormatter={formatEuros} width={80} />
          <Tooltip formatter={formatTooltipValue} />
          <Legend />
          <Line type="monotone" dataKey="Brut" stroke="#0f766e" strokeWidth={2} dot={{ r: 3 }} />
          <Line
            type="monotone"
            dataKey="Net à payer"
            stroke="#111827"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="Cotisations"
            stroke="#b45309"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
