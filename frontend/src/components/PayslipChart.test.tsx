import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { makePayslip } from "../test/fixtures";
import PayslipChart, { sortChronologically } from "./PayslipChart";

/**
 * Recharts' `ResponsiveContainer` measures its size with a real
 * `ResizeObserver` and never mounts its children (axis, lines, tooltip)
 * without one — and jsdom doesn't implement `ResizeObserver` at all, so
 * nothing past the wrapper div ever renders here. These tests stick to the
 * conditional-rendering logic that is actually this component's own code
 * (`payslips.length < 2`), not Recharts' internal rendering — see
 * RAPPORT.md, "zones volontairement non testées".
 */
describe("PayslipChart", () => {
  it("shows the placeholder message with zero payslips", () => {
    render(<PayslipChart payslips={[]} />);

    expect(screen.getByText(/Importez au moins deux bulletins/)).toBeInTheDocument();
    expect(document.querySelector(".recharts-responsive-container")).not.toBeInTheDocument();
  });

  it("shows the placeholder message with exactly one payslip", () => {
    render(<PayslipChart payslips={[makePayslip()]} />);

    expect(screen.getByText(/Importez au moins deux bulletins/)).toBeInTheDocument();
    expect(document.querySelector(".recharts-responsive-container")).not.toBeInTheDocument();
  });

  it("renders the chart instead of the placeholder with two or more payslips", () => {
    render(
      <PayslipChart
        payslips={[makePayslip({ mois_annee: "01/2025" }), makePayslip({ mois_annee: "02/2025" })]}
      />
    );

    expect(screen.queryByText(/Importez au moins deux bulletins/)).not.toBeInTheDocument();
    expect(document.querySelector(".recharts-responsive-container")).toBeInTheDocument();
  });
});

/**
 * `sortChronologically` is the fix for the ordering bug (most-recent-first
 * bled through to the chart's left-to-right axis) — exported specifically
 * because Recharts never mounts under jsdom, so nothing about the actual
 * axis order could be asserted through rendering (see the file-level
 * comment above and CONVENTIONS.md, "Testing (frontend)").
 */
describe("sortChronologically", () => {
  it("orders payslips oldest to newest, regardless of input order", () => {
    const jan = makePayslip({ mois_annee: "01/2025" });
    const jun = makePayslip({ mois_annee: "06/2025" });
    const mar = makePayslip({ mois_annee: "03/2025" });

    expect(sortChronologically([jun, jan, mar]).map((p) => p.mois_annee)).toEqual([
      "01/2025",
      "03/2025",
      "06/2025",
    ]);
  });

  it("orders across a year boundary correctly (not lexicographically)", () => {
    // Lexicographic order on "MM/YYYY" strings would wrongly sort "01/2026"
    // before "12/2025" — this is exactly the bug being fixed.
    const dec2025 = makePayslip({ mois_annee: "12/2025" });
    const jan2026 = makePayslip({ mois_annee: "01/2026" });

    expect(sortChronologically([jan2026, dec2025]).map((p) => p.mois_annee)).toEqual([
      "12/2025",
      "01/2026",
    ]);
  });

  it("does not mutate the input array", () => {
    const jun = makePayslip({ mois_annee: "06/2025" });
    const jan = makePayslip({ mois_annee: "01/2025" });
    const input = [jun, jan];

    sortChronologically(input);

    expect(input).toEqual([jun, jan]);
  });
});
