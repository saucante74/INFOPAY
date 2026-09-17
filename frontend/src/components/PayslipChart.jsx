import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

const formatEuros = (value) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(
    value
  );

export default function PayslipChart({ payslips }) {
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
          <Tooltip formatter={(value) => formatEuros(value)} />
          <Legend />
          <Line type="monotone" dataKey="Brut" stroke="#0f766e" strokeWidth={2} dot={{ r: 3 }} />
          <Line type="monotone" dataKey="Net à payer" stroke="#111827" strokeWidth={2} dot={{ r: 3 }} />
          <Line type="monotone" dataKey="Cotisations" stroke="#b45309" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
