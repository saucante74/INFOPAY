import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import PrivacyPage from "./PrivacyPage";

describe("PrivacyPage", () => {
  it("renders the page title and every section heading", () => {
    render(<PrivacyPage />);

    expect(screen.getByRole("heading", { name: "Confidentialité", level: 1 })).toBeInTheDocument();

    for (const heading of [
      "Quelles données sont traitées",
      "Un service tiers est impliqué dans le traitement",
      "Où vos données sont stockées",
      "Aucun système de comptes",
      "Statut de ce projet",
    ]) {
      expect(screen.getByRole("heading", { name: heading, level: 2 })).toBeInTheDocument();
    }
  });

  it("states plainly that data is sent to the Claude API, not processed fully locally", () => {
    render(<PrivacyPage />);
    expect(screen.getByText(/API Claude d'Anthropic/)).toBeInTheDocument();
  });
});
