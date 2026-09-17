import type { Payslip } from "../api/types";

const formatEuros = (value: number): string =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(value);

/**
 * `satisfies` rather than a type annotation: the literal keeps its exact
 * shape (so `COLUMNS` stays a readonly tuple of literal strings) while still
 * being checked against the contract below. A `key` that no longer exists on
 * `Payslip` — after a backend field rename plus a `npm run generate:api-types`
 * — is a compile error here, which is the point.
 */
const COLUMNS = [
  { key: "mois_annee", label: "Mois" },
  { key: "salaire_brut", label: "Brut" },
  { key: "net_a_payer", label: "Net à payer" },
  { key: "total_cotisations_salariales", label: "Cotis. salariales" },
  { key: "cotisations_retraite", label: "Retraite" },
  { key: "prelevement_source", label: "Prélèvement source" },
] as const satisfies readonly { key: keyof Payslip; label: string }[];

interface PayslipTableProps {
  payslips: readonly Payslip[];
}

export default function PayslipTable({ payslips }: PayslipTableProps) {
  if (payslips.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface-raised px-6 py-10 text-center text-sm text-ink-soft">
        Aucun bulletin importé pour le moment. Glissez votre premier PDF ci-dessus.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-surface-raised">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-ink-soft">
            {COLUMNS.map((col) => (
              <th key={col.key} className="whitespace-nowrap px-4 py-3 font-medium">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {payslips.map((p) => (
            <tr key={p.id} className="border-b border-border last:border-0">
              <td className="whitespace-nowrap px-4 py-3 font-medium">{p.mois_annee}</td>
              <td className="tabular whitespace-nowrap px-4 py-3">{formatEuros(p.salaire_brut)}</td>
              <td className="tabular whitespace-nowrap px-4 py-3">{formatEuros(p.net_a_payer)}</td>
              <td className="tabular whitespace-nowrap px-4 py-3">
                {formatEuros(p.total_cotisations_salariales)}
              </td>
              <td className="tabular whitespace-nowrap px-4 py-3">
                {formatEuros(p.cotisations_retraite)}
              </td>
              <td className="tabular whitespace-nowrap px-4 py-3">
                {formatEuros(p.prelevement_source)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
