import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getToken, setToken } from "../auth/tokenStore";
import LoginPage from "./LoginPage";

vi.mock("../api/client", () => ({
  login: vi.fn(),
  getApiErrorMessage: vi.fn(),
}));

import { getApiErrorMessage, login } from "../api/client";

const mockLogin = vi.mocked(login);
const mockGetApiErrorMessage = vi.mocked(getApiErrorMessage);

beforeEach(() => {
  mockLogin.mockReset();
  mockGetApiErrorMessage.mockReset();
});

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

async function submit(username: string, password: string) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Identifiant"), username);
  await user.type(screen.getByLabelText("Mot de passe"), password);
  await user.click(screen.getByRole("button", { name: "Se connecter" }));
}

describe("LoginPage", () => {
  it("stores the token and goes to the analyzer on success", async () => {
    mockLogin.mockResolvedValueOnce("jwt.token.value");
    renderLogin();

    await submit("admin", "secret");

    expect(await screen.findByText("Analyseur")).toBeInTheDocument();
    expect(mockLogin).toHaveBeenCalledWith({ username: "admin", password: "secret" });
    expect(getToken()).toBe("jwt.token.value");
  });

  it("shows the backend's message on bad credentials and stays on the page", async () => {
    mockLogin.mockRejectedValueOnce(new Error("401"));
    mockGetApiErrorMessage.mockReturnValueOnce("Identifiant ou mot de passe incorrect.");
    renderLogin();

    await submit("admin", "wrong");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Identifiant ou mot de passe incorrect."
    );
    expect(screen.getByRole("button", { name: "Se connecter" })).toBeEnabled();
    expect(getToken()).toBeNull();
  });

  it("falls back to a connection message when the backend is unreachable", async () => {
    mockLogin.mockRejectedValueOnce(new Error("Network Error"));
    renderLogin();

    await submit("admin", "secret");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Connexion impossible. Vérifiez que le serveur backend est bien lancé."
    );
  });

  it("redirects straight to the analyzer when already logged in", () => {
    setToken("jwt.token.value");
    renderLogin();

    expect(screen.getByText("Analyseur")).toBeInTheDocument();
    expect(screen.queryByLabelText("Identifiant")).not.toBeInTheDocument();
  });
});
