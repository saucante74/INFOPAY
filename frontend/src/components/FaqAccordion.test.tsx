import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import FaqAccordion from "./FaqAccordion";

describe("FaqAccordion", () => {
  it("renders every question, collapsed by default", () => {
    render(<FaqAccordion />);

    const questions = [
      "Quels formats de bulletins de paie sont acceptés ?",
      "Comment fonctionne l'extraction des données ?",
      "Quel type de questions puis-je poser à l'assistant ?",
      "Que faire si l'extraction d'un bulletin échoue ou semble incorrecte ?",
      "Mes bulletins de paie sont des données sensibles : sont-elles protégées ?",
    ];

    for (const question of questions) {
      const details = screen.getByText(question).closest("details");
      expect(details).not.toBeNull();
      expect(details).not.toHaveAttribute("open");
    }
  });

  it("opens a question to reveal its answer, and can close it again", async () => {
    const user = userEvent.setup();
    render(<FaqAccordion />);

    const question = screen.getByText("Quels formats de bulletins de paie sont acceptés ?");
    const details = question.closest("details");
    expect(details).not.toBeNull();

    await user.click(question);
    expect(details).toHaveAttribute("open");
    expect(screen.getByText(/Seuls les fichiers PDF sont acceptés/)).toBeInTheDocument();

    await user.click(question);
    expect(details).not.toHaveAttribute("open");
  });
});
