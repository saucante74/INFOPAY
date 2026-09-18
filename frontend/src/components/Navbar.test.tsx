import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router";
import { describe, expect, it } from "vitest";

import LoginModal from "../auth/LoginModal";
import { getToken, setToken } from "../auth/tokenStore";
import { renderWithRouter } from "../test/helpers";
import Navbar from "./Navbar";

describe("Navbar", () => {
  it("marks 'Analyseur' as the current page on '/'", () => {
    renderWithRouter(<Navbar />, "/");

    expect(screen.getByText("InfoPay AI")).toBeInTheDocument();

    const analyzer = screen.getByRole("link", { name: "Analyseur" });
    expect(analyzer).toHaveAttribute("aria-current", "page");
    expect(analyzer).toHaveAttribute("href", "/");

    const aide = screen.getByRole("link", { name: "Aide" });
    expect(aide).not.toHaveAttribute("aria-current");
    expect(aide).toHaveAttribute("href", "/aide");
  });

  it("marks 'Aide' as the current page on '/aide', not 'Analyseur'", () => {
    renderWithRouter(<Navbar />, "/aide");

    expect(screen.getByRole("link", { name: "Aide" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Analyseur" })).not.toHaveAttribute("aria-current");
  });

  it("renders the theme toggle with a clear aria-label", () => {
    renderWithRouter(<Navbar />);

    // ThemeToggle's own label depends on the resolved theme; asserting an
    // accessible name exists (rather than a specific one) keeps this test
    // decoupled from ThemeToggle's own tested behaviour.
    expect(screen.getByRole("button", { name: /Passer en thème/ })).toBeInTheDocument();
  });

  it("wraps the nav items in a labelled <nav> landmark", () => {
    renderWithRouter(<Navbar />);
    expect(screen.getByRole("navigation", { name: "Navigation principale" })).toBeInTheDocument();
  });

  it("shows 'Se connecter', not 'Se déconnecter', when logged out", () => {
    renderWithRouter(<Navbar />);
    expect(screen.queryByRole("button", { name: "Se déconnecter" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Se connecter" })).toBeInTheDocument();
  });

  it("shows 'Se déconnecter', not 'Se connecter', when logged in", () => {
    setToken("jwt.token.value");
    renderWithRouter(<Navbar />);
    expect(screen.getByRole("button", { name: "Se déconnecter" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Se connecter" })).not.toBeInTheDocument();
  });

  it("clicking 'Se déconnecter' asks for confirmation before clearing the token", async () => {
    const user = userEvent.setup();
    setToken("jwt.token.value");
    renderWithRouter(<Navbar />);

    await user.click(screen.getByRole("button", { name: "Se déconnecter" }));

    expect(screen.getByRole("dialog", { name: "Se déconnecter ?" })).toBeInTheDocument();
    expect(getToken()).toBe("jwt.token.value");
  });

  it("cancelling the logout confirmation leaves the session untouched", async () => {
    const user = userEvent.setup();
    setToken("jwt.token.value");
    renderWithRouter(<Navbar />);

    await user.click(screen.getByRole("button", { name: "Se déconnecter" }));
    await user.click(screen.getByRole("button", { name: "Annuler" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(getToken()).toBe("jwt.token.value");
    expect(screen.getByRole("button", { name: "Se déconnecter" })).toBeInTheDocument();
  });

  it("confirming the logout clears the token without navigating anywhere — '/' is public, there's nowhere it needs to send you", async () => {
    const user = userEvent.setup();
    setToken("jwt.token.value");
    renderWithRouter(
      <>
        <Navbar />
        <Routes>
          <Route path="/aide" element={<p>Page Aide</p>} />
          <Route path="/login" element={<p>Page de connexion</p>} />
        </Routes>
      </>,
      "/aide"
    );

    await user.click(screen.getByRole("button", { name: "Se déconnecter" }));
    // The dialog's confirm button shares the trigger's accessible name
    // ("Se déconnecter"), so it's queried scoped to the dialog itself.
    const dialog = screen.getByRole("dialog", { name: "Se déconnecter ?" });
    await user.click(within(dialog).getByRole("button", { name: "Se déconnecter" }));

    expect(getToken()).toBeNull();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("Page Aide")).toBeInTheDocument();
    expect(screen.queryByText("Page de connexion")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Se connecter" })).toBeInTheDocument();
  });

  it("opens the shared login modal from 'Se connecter', in place, without navigating", async () => {
    const user = userEvent.setup();
    renderWithRouter(
      <>
        <Navbar />
        <LoginModal />
      </>
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Se connecter" }));

    expect(screen.getByRole("dialog", { name: "Connexion" })).toBeInTheDocument();
  });
});
