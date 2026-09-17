import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

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
    render(<PayslipTable payslips={[]} />);

    expect(screen.getByText(/Aucun bulletin importé/)).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("renders one row per payslip with formatted amounts", () => {
    const payslips = [
      makePayslip({ mois_annee: "01/2025", salaire_brut: 3000, net_a_payer: 2300 }),
      makePayslip({ mois_annee: "02/2025", salaire_brut: 3100, net_a_payer: 2380 }),
    ];
    render(<PayslipTable payslips={payslips} />);

    expect(screen.queryByText(/Aucun bulletin importé/)).not.toBeInTheDocument();

    const table = screen.getByRole("table");
    const rows = screen.getAllByRole("row");
    // header row + one per payslip
    expect(rows).toHaveLength(payslips.length + 1);

    expect(screen.getByText("01/2025")).toBeInTheDocument();
    expect(screen.getByText("02/2025")).toBeInTheDocument();
    expect(screen.getAllByText(formatEuros(3000), exact)).toHaveLength(1);
    expect(screen.getAllByText(formatEuros(2300), exact)).toHaveLength(1);

    // Column headers are the labels, not the raw backend field names.
    expect(table).toHaveTextContent("Mois");
    expect(table).toHaveTextContent("Net à payer");
    expect(table).toHaveTextContent("Prélèvement source");
  });
});
