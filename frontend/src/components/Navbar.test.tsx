import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import Navbar from "./Navbar";

describe("Navbar", () => {
  it("renders the wordmark and both nav items, with only the current page marked", () => {
    render(<Navbar />);

    expect(screen.getByText("InfoPay AI")).toBeInTheDocument();

    const current = screen.getByRole("button", { name: "Analyseur" });
    expect(current).toHaveAttribute("aria-current", "page");

    const aide = screen.getByRole("button", { name: "Aide" });
    expect(aide).toBeInTheDocument();
    expect(aide).not.toHaveAttribute("aria-current");
  });

  it("renders the theme toggle with a clear aria-label", () => {
    render(<Navbar />);

    // ThemeToggle's own label depends on the resolved theme; asserting an
    // accessible name exists (rather than a specific one) keeps this test
    // decoupled from ThemeToggle's own tested behaviour.
    expect(screen.getByRole("button", { name: /Passer en thème/ })).toBeInTheDocument();
  });

  it("the placeholder nav link is a real, clickable button that does nothing yet", async () => {
    // Not "silently non-clickable": it's a focusable, real <button> with no
    // destination — see RAPPORT.md, "Navigation without a destination".
    // This just confirms clicking it doesn't throw.
    const user = userEvent.setup();
    render(<Navbar />);

    await expect(user.click(screen.getByRole("button", { name: "Aide" }))).resolves.not.toThrow();
  });

  it("wraps the nav items in a labelled <nav> landmark", () => {
    render(<Navbar />);
    expect(screen.getByRole("navigation", { name: "Navigation principale" })).toBeInTheDocument();
  });
});
