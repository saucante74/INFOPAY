/**
 * The login flow through the real route tree in App.tsx (its own
 * BrowserRouter, RequireAuth, LoginPage, Navbar). Only the API client is
 * mocked, per the suite's convention.
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import App from "./App";

vi.mock("./api/client", () => ({
  login: vi.fn(),
  fetchPayslips: vi.fn(),
  uploadPayslip: vi.fn(),
  sendChatMessage: vi.fn(),
  getApiErrorMessage: vi.fn(),
  getRateLimit: vi.fn(),
  formatRetryDelay: vi.fn(),
}));

import { fetchPayslips, login } from "./api/client";

beforeEach(() => {
  vi.mocked(login).mockReset().mockResolvedValue("jwt.token.value");
  vi.mocked(fetchPayslips).mockReset().mockResolvedValue([]);
  // App owns a BrowserRouter, which reads the real (jsdom) URL.
  window.history.pushState({}, "", "/");
});

afterEach(() => {
  window.history.pushState({}, "", "/");
});

describe("App login flow", () => {
  it("sends a visitor to /login, lets them in, then back out on logout", async () => {
    const user = userEvent.setup();
    render(<App />);

    // "/" is protected: the login form shows instead of the analyzer.
    expect(await screen.findByRole("heading", { name: "Connexion" })).toBeInTheDocument();
    expect(window.location.pathname).toBe("/login");
    expect(fetchPayslips).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText("Identifiant"), "admin");
    await user.type(screen.getByLabelText("Mot de passe"), "secret");
    await user.click(screen.getByRole("button", { name: "Se connecter" }));

    expect(
      await screen.findByRole("heading", { name: "Assistant & Analytics de fiches de paie" })
    ).toBeInTheDocument();
    expect(window.location.pathname).toBe("/");
    expect(fetchPayslips).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Se déconnecter" }));

    expect(await screen.findByRole("heading", { name: "Connexion" })).toBeInTheDocument();
    expect(window.location.pathname).toBe("/login");
  });

  it("keeps the help and legal pages public", async () => {
    window.history.pushState({}, "", "/confidentialite");
    render(<App />);

    expect(
      await screen.findByRole("heading", { name: "Politique de confidentialité" })
    ).toBeInTheDocument();
  });
});
