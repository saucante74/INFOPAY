import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { closeAuthModal, requireAuth } from "./authModal";
import LoginModal from "./LoginModal";
import { getToken } from "./tokenStore";

vi.mock("../api/client", () => ({
  login: vi.fn(),
  getApiErrorMessage: vi.fn(),
}));

import { login } from "../api/client";

const mockLogin = vi.mocked(login);

beforeEach(() => {
  mockLogin.mockReset();
});

// localStorage (and therefore the token) is cleared after each test by
// src/test/setup.ts, but `authModal`'s own open/pending-action state is a
// plain module-level variable — nothing else resets it between tests, so
// it's done explicitly here.
afterEach(() => {
  closeAuthModal();
});

describe("LoginModal", () => {
  it("renders nothing when closed", () => {
    render(<LoginModal />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders the dialog and focuses the first field when requireAuth opens it", () => {
    render(<LoginModal />);

    act(() => {
      requireAuth();
    });

    const dialog = screen.getByRole("dialog", { name: "Connexion" });
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(screen.getByLabelText("Identifiant")).toHaveFocus();
  });

  it("closes on the close button, without running the pending action", async () => {
    const user = userEvent.setup();
    const action = vi.fn();
    render(<LoginModal />);
    act(() => {
      requireAuth(action);
    });

    await user.click(screen.getByRole("button", { name: "Fermer" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(action).not.toHaveBeenCalled();
  });

  it("closes on Escape, without running the pending action", async () => {
    const user = userEvent.setup();
    const action = vi.fn();
    render(<LoginModal />);
    act(() => {
      requireAuth(action);
    });

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(action).not.toHaveBeenCalled();
  });

  it("closes on a backdrop click, without running the pending action", async () => {
    const user = userEvent.setup();
    const action = vi.fn();
    render(<LoginModal />);
    act(() => {
      requireAuth(action);
    });

    const backdrop = document.querySelector('[aria-hidden="true"]');
    expect(backdrop).not.toBeNull();
    if (backdrop) await user.click(backdrop);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(action).not.toHaveBeenCalled();
  });

  it("logging in successfully closes the modal and runs the pending action", async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValueOnce("jwt.token.value");
    const action = vi.fn();
    render(<LoginModal />);
    act(() => {
      requireAuth(action);
    });

    await user.type(screen.getByLabelText("Identifiant"), "admin");
    await user.type(screen.getByLabelText("Mot de passe"), "secret");
    await user.click(screen.getByRole("button", { name: "Se connecter" }));

    expect(getToken()).toBe("jwt.token.value");
    expect(action).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
