import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import PrivacyPage from "./PrivacyPage";

describe("PrivacyPage", () => {
  it("renders the page title and every numbered section heading", () => {
    render(<PrivacyPage />);

    expect(
      screen.getByRole("heading", { name: "Politique de confidentialité", level: 1 })
    ).toBeInTheDocument();

    for (const heading of [
      "1. Objet",
      "2. Responsable de traitement",
      "3. Données collectées",
      "4. Finalités du traitement",
      "5. Base légale du traitement",
      "6. Destinataires des données",
      "7. Durée de conservation",
      "8. Sécurité des données",
      "9. Vos droits",
    ]) {
      expect(screen.getByRole("heading", { name: heading, level: 2 })).toBeInTheDocument();
    }
  });

  it("states plainly that data is sent to the Claude API, not processed fully locally", () => {
    render(<PrivacyPage />);
    expect(screen.getByText(/API Claude/)).toBeInTheDocument();
  });

  it("stays honest about the absence of encryption and authentication", () => {
    render(<PrivacyPage />);
    expect(screen.getByText(/sans chiffrement particulier au repos/)).toBeInTheDocument();
    expect(screen.getByText(/aucun système d'authentification/)).toBeInTheDocument();
  });
});
