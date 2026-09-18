import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { createMatchMediaStub } from "../test/helpers";
import ThemeToggle from "./ThemeToggle";

const STORAGE_KEY = "infopay-theme";

describe("ThemeToggle", () => {
  it("follows the system preference when nothing is stored (light)", () => {
    window.matchMedia = createMatchMediaStub(false); // system prefers light
    render(<ThemeToggle />);

    // Light -> offers to switch to dark: Moon icon, matching aria-label.
    expect(screen.getByRole("button", { name: "Passer en thème sombre" })).toBeInTheDocument();
    expect(document.documentElement.getAttribute("data-theme")).toBeNull();
  });

  it("follows the system preference when nothing is stored (dark)", () => {
    window.matchMedia = createMatchMediaStub(true); // system prefers dark
    render(<ThemeToggle />);

    // Dark -> offers to switch to light: Sun icon, matching aria-label.
    expect(screen.getByRole("button", { name: "Passer en thème clair" })).toBeInTheDocument();
    // No manual override yet: the CSS media query handles it, not data-theme.
    expect(document.documentElement.getAttribute("data-theme")).toBeNull();
  });

  it("toggling sets an explicit override and applies data-theme", async () => {
    const user = userEvent.setup();
    window.matchMedia = createMatchMediaStub(false); // system prefers light
    render(<ThemeToggle />);

    await user.click(screen.getByRole("button", { name: "Passer en thème sombre" }));

    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(screen.getByRole("button", { name: "Passer en thème clair" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Passer en thème clair" }));

    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(screen.getByRole("button", { name: "Passer en thème sombre" })).toBeInTheDocument();
  });

  it("persists the manual choice to localStorage", async () => {
    const user = userEvent.setup();
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem");
    window.matchMedia = createMatchMediaStub(false);
    render(<ThemeToggle />);

    await user.click(screen.getByRole("button", { name: "Passer en thème sombre" }));

    expect(setItemSpy).toHaveBeenCalledWith(STORAGE_KEY, "dark");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("dark");

    setItemSpy.mockRestore();
  });

  it("honours a stored choice on mount, even against the system preference", () => {
    localStorage.setItem(STORAGE_KEY, "dark");
    window.matchMedia = createMatchMediaStub(false); // system prefers light
    render(<ThemeToggle />);

    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(screen.getByRole("button", { name: "Passer en thème clair" })).toBeInTheDocument();
  });

  it("has an accessible label at all times", () => {
    window.matchMedia = createMatchMediaStub(false);
    render(<ThemeToggle />);

    const button = screen.getByRole("button");
    expect(button).toHaveAccessibleName();
  });
});
