import { Trash2 } from "lucide-react";
import { useState } from "react";

import type { Payslip } from "../api/types";
import ConfirmDialog from "./ConfirmDialog";

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
  /** Deletes a payslip server-side; rejects on failure. Owned by
   * `usePayslips` — this component only decides *when* to call it
   * (after confirmation) and how to show the outcome. */
  onDelete: (id: number) => Promise<void>;
}

export default function PayslipTable({ payslips, onDelete }: PayslipTableProps) {
  // Declared before the early return below so every render calls the same
  // hooks in the same order, regardless of whether `payslips` is empty —
  // an empty list can't have a row mid-deletion anyway, but the Rules of
  // Hooks don't get to know that.
  const [pendingDeletion, setPendingDeletion] = useState<Payslip | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (payslips.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface-raised px-6 py-10 text-center text-sm text-ink-soft">
        Aucun bulletin importé pour le moment. Glissez votre premier PDF ci-dessus.
      </div>
    );
  }

  const handleConfirmDelete = async (): Promise<void> => {
    // `pendingDeletion` only ever gets set from a row's own delete button
    // below, which is only rendered when `p.id != null` — so this really is
    // just satisfying the type (`Payslip.id` is `number | null` because the
    // OpenAPI schema reflects SQLModel's pre-persistence `Optional[int]`,
    // not because a row returned by the API can actually lack one).
    if (pendingDeletion?.id == null) return;

    setIsDeleting(true);
    setError(null);
    try {
      await onDelete(pendingDeletion.id);
      setPendingDeletion(null);
    } catch {
      setError(`La suppression du bulletin de ${pendingDeletion.mois_annee} a échoué. Réessayez.`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-border bg-surface-raised">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-ink-soft">
              {COLUMNS.map((col) => (
                <th key={col.key} className="whitespace-nowrap px-4 py-3 font-medium">
                  {col.label}
                </th>
              ))}
              <th className="px-4 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {payslips.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0">
                <td className="whitespace-nowrap px-4 py-3 font-medium">{p.mois_annee}</td>
                <td className="tabular whitespace-nowrap px-4 py-3">
                  {formatEuros(p.salaire_brut)}
                </td>
                <td className="tabular whitespace-nowrap px-4 py-3">
                  {formatEuros(p.net_a_payer)}
                </td>
                <td className="tabular whitespace-nowrap px-4 py-3">
                  {formatEuros(p.total_cotisations_salariales)}
                </td>
                <td className="tabular whitespace-nowrap px-4 py-3">
                  {formatEuros(p.cotisations_retraite)}
                </td>
                <td className="tabular whitespace-nowrap px-4 py-3">
                  {formatEuros(p.prelevement_source)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  {p.id != null && (
                    <button
                      type="button"
                      onClick={() => {
                        setError(null);
                        setPendingDeletion(p);
                      }}
                      aria-label={`Supprimer le bulletin de ${p.mois_annee}`}
                      className="rounded-md p-1.5 text-ink-soft transition-colors hover:bg-surface hover:text-alert"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {error && (
        <p role="alert" className="mt-2 text-sm text-alert">
          {error}
        </p>
      )}

      <ConfirmDialog
        isOpen={pendingDeletion !== null}
        title="Supprimer ce bulletin ?"
        message={
          pendingDeletion
            ? `Le bulletin de ${pendingDeletion.mois_annee} sera définitivement supprimé, ` +
              "ainsi que son contenu indexé pour l'assistant. Cette action est irréversible."
            : ""
        }
        confirmLabel="Supprimer"
        isConfirming={isDeleting}
        onConfirm={() => {
          void handleConfirmDelete();
        }}
        onCancel={() => {
          setPendingDeletion(null);
        }}
      />
    </div>
  );
}
