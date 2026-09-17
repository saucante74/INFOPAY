import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { makePayslip } from "../test/fixtures";
import PayslipChart from "./PayslipChart";

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
