import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { makePayslip } from "../test/fixtures";
import PayslipTable from "./PayslipTable";

/** Same formatter the component uses, so expectations don't hardcode a
 * locale-specific string (fr-FR's thousands separator is a narrow
 * no-break space, easy to get wrong by typing it by hand). */
const formatEuros = (value: number): string =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(value);

/**
 * Testing Library's default text normalizer collapses whitespace runs to a
 * single ASCII space in the DOM text it matches against, but does *not*
 * apply that same normalization to a string matcher — so a query built from
 * `formatEuros()` (whose narrow no-break space, U+202F, is real fr-FR
 * currency formatting, not incidental whitespace) silently fails to match
 * the now-collapsed DOM text. Disabling normalization compares both sides
 * as the exact same bytes, which they are.
 */
const exact = { normalizer: (text: string): string => text };

describe("PayslipTable", () => {
  it("shows the empty-state message and no table when there are no payslips", () => {
    render(<PayslipTable payslips={[]} onDelete={vi.fn()} />);

    expect(screen.getByText(/Aucun bulletin importé/)).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("renders one row per payslip with formatted amounts", () => {
    const payslips = [
      makePayslip({
        mois_annee: "01/2025",
        nom_entreprise: "ACME SARL",
        salaire_brut: 3000,
        net_imposable: 2400,
        net_a_payer: 2300,
        total_cotisations_patronales: 900,
      }),
      makePayslip({
        mois_annee: "02/2025",
        nom_entreprise: "Autre Entreprise SAS",
        salaire_brut: 3100,
        net_imposable: 2450,
        net_a_payer: 2380,
        total_cotisations_patronales: 910,
      }),
    ];
    render(<PayslipTable payslips={payslips} onDelete={vi.fn()} />);

    expect(screen.queryByText(/Aucun bulletin importé/)).not.toBeInTheDocument();

    const table = screen.getByRole("table");
    const rows = screen.getAllByRole("row");
    // header row + one per payslip
    expect(rows).toHaveLength(payslips.length + 1);

    expect(screen.getByText("01/2025")).toBeInTheDocument();
    expect(screen.getByText("02/2025")).toBeInTheDocument();
    expect(screen.getByText("ACME SARL")).toBeInTheDocument();
    expect(screen.getAllByText(formatEuros(3000), exact)).toHaveLength(1);
    expect(screen.getAllByText(formatEuros(2400), exact)).toHaveLength(1);
    expect(screen.getAllByText(formatEuros(2300), exact)).toHaveLength(1);
    expect(screen.getAllByText(formatEuros(900), exact)).toHaveLength(1);

    // Column headers are the labels, not the raw backend field names.
    expect(table).toHaveTextContent("Mois");
    expect(table).toHaveTextContent("Entreprise");
    expect(table).toHaveTextContent("Net imposable");
    expect(table).toHaveTextContent("Net à payer");
    expect(table).toHaveTextContent("Cotis. patronales");
    expect(table).toHaveTextContent("Prélèvement source");
  });

  it("shows a placeholder instead of a blank cell when nom_entreprise is null", () => {
    const payslip = makePayslip({ mois_annee: "01/2025", nom_entreprise: null });
    render(<PayslipTable payslips={[payslip]} onDelete={vi.fn()} />);

    expect(screen.getByText("Non renseigné")).toBeInTheDocument();
  });

  it("renders a delete button per row, one per payslip", () => {
    const payslips = [
      makePayslip({ mois_annee: "01/2025" }),
      makePayslip({ mois_annee: "02/2025" }),
    ];
    render(<PayslipTable payslips={payslips} onDelete={vi.fn()} />);

    expect(
      screen.getByRole("button", { name: "Supprimer le bulletin de 01/2025" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Supprimer le bulletin de 02/2025" })
    ).toBeInTheDocument();
  });

  it("clicking the delete icon asks for confirmation before calling onDelete", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn().mockResolvedValue(undefined);
    const payslip = makePayslip({ mois_annee: "01/2025" });
    render(<PayslipTable payslips={[payslip]} onDelete={onDelete} />);

    await user.click(screen.getByRole("button", { name: "Supprimer le bulletin de 01/2025" }));

    expect(screen.getByRole("dialog", { name: "Supprimer ce bulletin ?" })).toBeInTheDocument();
    expect(onDelete).not.toHaveBeenCalled();
  });

  it("cancelling the confirmation does not call onDelete and keeps the row", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn().mockResolvedValue(undefined);
    const payslip = makePayslip({ mois_annee: "01/2025" });
    render(<PayslipTable payslips={[payslip]} onDelete={onDelete} />);

    await user.click(screen.getByRole("button", { name: "Supprimer le bulletin de 01/2025" }));
    await user.click(screen.getByRole("button", { name: "Annuler" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(onDelete).not.toHaveBeenCalled();
    expect(screen.getByText("01/2025")).toBeInTheDocument();
  });

  it("confirming calls onDelete with the row's id and closes the dialog on success", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn().mockResolvedValue(undefined);
    const payslip = makePayslip({ id: 42, mois_annee: "01/2025" });
    render(<PayslipTable payslips={[payslip]} onDelete={onDelete} />);

    await user.click(screen.getByRole("button", { name: "Supprimer le bulletin de 01/2025" }));
    await user.click(screen.getByRole("button", { name: "Supprimer" }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith(42);
  });

  it("shows a clear error message, without crashing, when the deletion fails", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn().mockRejectedValue(new Error("network down"));
    const payslip = makePayslip({ mois_annee: "01/2025" });
    render(<PayslipTable payslips={[payslip]} onDelete={onDelete} />);

    await user.click(screen.getByRole("button", { name: "Supprimer le bulletin de 01/2025" }));
    await user.click(screen.getByRole("button", { name: "Supprimer" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "La suppression du bulletin de 01/2025 a échoué. Réessayez."
    );
    // The dialog stays open and the row is still there — a failed delete
    // doesn't silently drop the payslip from view.
    expect(screen.getByRole("dialog", { name: "Supprimer ce bulletin ?" })).toBeInTheDocument();
    expect(screen.getByText("01/2025")).toBeInTheDocument();
  });
});
