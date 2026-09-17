import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import Navbar from "./Navbar";

describe("Navbar", () => {
  it("renders the wordmark and all four nav items, with only the current page marked", () => {
    render(<Navbar />);

    expect(screen.getByText("InfoPay AI")).toBeInTheDocument();

    const current = screen.getByRole("button", { name: "Tableau de bord" });
    expect(current).toHaveAttribute("aria-current", "page");

    for (const label of ["Historique", "Rapports", "Aide"]) {
      const link = screen.getByRole("button", { name: label });
      expect(link).toBeInTheDocument();
      expect(link).not.toHaveAttribute("aria-current");
    }
  });

  it("renders the theme toggle, notifications and account buttons with clear aria-labels", () => {
    render(<Navbar />);

    // ThemeToggle's own label depends on the resolved theme; asserting an
    // accessible name exists (rather than a specific one) keeps this test
    // decoupled from ThemeToggle's own tested behaviour.
    expect(screen.getByRole("button", { name: /Passer en thème/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Notifications" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Compte utilisateur" })).toBeInTheDocument();
  });

  it("the placeholder nav links are real, clickable buttons that do nothing yet", async () => {
    // Not "silently non-clickable": they are focusable, real <button>s with
    // no destination — see RAPPORT.md, "Navigation without a destination".
    // This just confirms clicking one doesn't throw.
    const user = userEvent.setup();
    render(<Navbar />);

    await expect(
      user.click(screen.getByRole("button", { name: "Historique" }))
    ).resolves.not.toThrow();
  });

  it("wraps the nav items in a labelled <nav> landmark", () => {
    render(<Navbar />);
    expect(screen.getByRole("navigation", { name: "Navigation principale" })).toBeInTheDocument();
  });
});
