import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import HelpPage from "./HelpPage";

describe("HelpPage", () => {
  it("renders the page title and the FAQ content", () => {
    render(<HelpPage />);

    expect(screen.getByRole("heading", { name: "Aide", level: 1 })).toBeInTheDocument();
    expect(
      screen.getByText("Quels formats de bulletins de paie sont acceptés ?")
    ).toBeInTheDocument();
  });
});

describe("HelpPage — sample payslip downloads", () => {
  const EXAMPLE_FILES = [
    "bulletin_paie_01_2026.pdf",
    "bulletin_paie_02_2026.pdf",
    "bulletin_paie_03_2026.pdf",
    "bulletin_paie_04_2026.pdf",
    "bulletin_batirenov_06_2022.pdf",
    "bulletin_pharmaouest_03_2023.pdf",
    "bulletin_clinique_11_2024.pdf",
    "bulletin_aerospace_08_2025.pdf",
  ] as const;

  it("has a linkable #exemples section", () => {
    render(<HelpPage />);

    expect(screen.getByRole("heading", { name: "Exemples à télécharger" })).toBeInTheDocument();
    expect(document.getElementById("exemples")).toBeInTheDocument();
  });

  it.each(EXAMPLE_FILES)(
    "links to /exemples/%s with a download attribute, forcing a save",
    (file) => {
      render(<HelpPage />);

      const link = document.querySelector(`a[href="/exemples/${file}"]`);
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("download");
    }
  );
});
