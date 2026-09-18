import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderWithRouter } from "../test/helpers";
import TermsPage from "./TermsPage";

describe("TermsPage", () => {
  it("renders the page title and states this is a demo project, not a commercial product", () => {
    renderWithRouter(<TermsPage />);

    expect(
      screen.getByRole("heading", { name: "Conditions d'utilisation", level: 1 })
    ).toBeInTheDocument();
    expect(screen.getByText(/démonstration technique/)).toBeInTheDocument();
  });

  it("links back to the privacy page", () => {
    renderWithRouter(<TermsPage />);
    expect(screen.getByRole("link", { name: "Confidentialité" })).toHaveAttribute(
      "href",
      "/confidentialite"
    );
  });
});
