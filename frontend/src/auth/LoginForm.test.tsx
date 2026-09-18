import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getToken } from "./tokenStore";
import LoginForm from "./LoginForm";

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

// localStorage (and therefore the token) is cleared after each test by
// src/test/setup.ts.

async function submit(username: string, password: string) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Identifiant"), username);
  await user.type(screen.getByLabelText("Mot de passe"), password);
  await user.click(screen.getByRole("button", { name: "Se connecter" }));
}

describe("LoginForm", () => {
  it("stores the token and calls onSuccess on success", async () => {
    mockLogin.mockResolvedValueOnce("jwt.token.value");
    const onSuccess = vi.fn();
    render(<LoginForm onSuccess={onSuccess} />);

    await submit("admin", "secret");

    expect(mockLogin).toHaveBeenCalledWith({ username: "admin", password: "secret" });
    expect(getToken()).toBe("jwt.token.value");
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it("works with no onSuccess at all (LoginPage's usage)", async () => {
    mockLogin.mockResolvedValueOnce("jwt.token.value");
    render(<LoginForm />);

    await submit("admin", "secret");

    expect(getToken()).toBe("jwt.token.value");
  });

  it("shows the backend's message on bad credentials, without calling onSuccess", async () => {
    mockLogin.mockRejectedValueOnce(new Error("401"));
    mockGetApiErrorMessage.mockReturnValueOnce("Identifiant ou mot de passe incorrect.");
    const onSuccess = vi.fn();
    render(<LoginForm onSuccess={onSuccess} />);

    await submit("admin", "wrong");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Identifiant ou mot de passe incorrect."
    );
    expect(screen.getByRole("button", { name: "Se connecter" })).toBeEnabled();
    expect(getToken()).toBeNull();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("falls back to a connection message when the backend is unreachable", async () => {
    mockLogin.mockRejectedValueOnce(new Error("Network Error"));
    render(<LoginForm />);

    await submit("admin", "secret");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Connexion impossible. Vérifiez que le serveur backend est bien lancé."
    );
  });
});
