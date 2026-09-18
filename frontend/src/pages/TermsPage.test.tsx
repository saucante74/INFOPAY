import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderWithRouter } from "../test/helpers";
import TermsPage from "./TermsPage";

describe("TermsPage", () => {
  it("renders the page title and every numbered section heading", () => {
    renderWithRouter(<TermsPage />);

    expect(
      screen.getByRole("heading", { name: "Conditions générales d'utilisation", level: 1 })
    ).toBeInTheDocument();

    for (const heading of [
      "1. Objet",
      "2. Acceptation des conditions",
      "3. Description du service",
      "4. Obligations de l'utilisateur",
      "5. Limitation de responsabilité",
      "6. Propriété intellectuelle",
      "7. Disponibilité du service",
      "8. Modification des conditions",
      "9. Droit applicable et juridiction",
    ]) {
      expect(screen.getByRole("heading", { name: heading, level: 2 })).toBeInTheDocument();
    }
  });

  it("states this is a demo project, not a commercial product, with no availability guarantee", () => {
    renderWithRouter(<TermsPage />);
    expect(screen.getAllByText(/démonstration technique/).length).toBeGreaterThan(0);
    expect(screen.getByText(/aucune garantie de disponibilité/)).toBeInTheDocument();
  });

  it("links to the privacy page", () => {
    renderWithRouter(<TermsPage />);
    const links = screen.getAllByRole("link", { name: "politique de confidentialité" });
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link).toHaveAttribute("href", "/confidentialite");
    }
  });
});
