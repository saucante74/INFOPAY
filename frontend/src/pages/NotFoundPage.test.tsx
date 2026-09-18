import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderWithRouter } from "../test/helpers";
import NotFoundPage from "./NotFoundPage";

describe("NotFoundPage", () => {
  it("renders a not-found message with a link back to the analyzer", () => {
    renderWithRouter(<NotFoundPage />);

    expect(screen.getByRole("heading", { name: "Page introuvable" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Retour à l'analyseur" })).toHaveAttribute("href", "/");
  });
});
