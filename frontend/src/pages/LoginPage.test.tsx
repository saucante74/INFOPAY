import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, it, vi } from "vitest";

import { setToken } from "../auth/tokenStore";
import LoginPage from "./LoginPage";

// Detailed form behaviour (submitting, error messages, onSuccess) lives in
// auth/LoginForm.test.tsx, since LoginPage only wraps that shared
// component in page chrome — see RAPPORT.md, "Architecture".
vi.mock("../api/client", () => ({
  login: vi.fn(),
  getApiErrorMessage: vi.fn(),
}));

function renderLogin() {
  render(
    <MemoryRouter initialEntries={["/login"]}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<p>Analyseur</p>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("LoginPage", () => {
  it("renders the logo, heading and the shared login form", () => {
    renderLogin();

    expect(screen.getByRole("heading", { name: "Connexion", level: 1 })).toBeInTheDocument();
    expect(screen.getByLabelText("Identifiant")).toBeInTheDocument();
    expect(screen.getByLabelText("Mot de passe")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Se connecter" })).toBeInTheDocument();
  });

  it("redirects straight to the analyzer when already logged in", () => {
    setToken("jwt.token.value");
    renderLogin();

    expect(screen.getByText("Analyseur")).toBeInTheDocument();
    expect(screen.queryByLabelText("Identifiant")).not.toBeInTheDocument();
  });
});
