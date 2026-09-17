import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import Footer from "./Footer";

describe("Footer", () => {
  it("renders the copyright line with the current year", () => {
    render(<Footer />);

    const year = String(new Date().getFullYear());
    expect(screen.getByText(`© ${year} InfoPay AI. Tous droits réservés.`)).toBeInTheDocument();
  });

  it("renders the three legal/contact links as real, focusable buttons", () => {
    render(<Footer />);

    for (const label of ["Confidentialité", "Conditions d'utilisation", "Contact"]) {
      const link = screen.getByRole("button", { name: label });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAccessibleName();
    }
  });

  it("the placeholder links do nothing yet, without throwing", async () => {
    const user = userEvent.setup();
    render(<Footer />);

    await expect(
      user.click(screen.getByRole("button", { name: "Contact" }))
    ).resolves.not.toThrow();
  });
});
