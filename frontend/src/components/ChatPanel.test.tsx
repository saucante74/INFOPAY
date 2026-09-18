import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ChatPanel from "./ChatPanel";

vi.mock("../api/client", () => ({
  sendChatMessage: vi.fn(),
}));

import { sendChatMessage } from "../api/client";

const mockSendChatMessage = vi.mocked(sendChatMessage);

function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

function getSubmitButton(): HTMLElement {
  return screen.getByRole("button", { name: "" });
}

beforeEach(() => {
  mockSendChatMessage.mockReset();
});

describe("ChatPanel", () => {
  it("shows the suggestions before any message is sent", () => {
    render(<ChatPanel />);

    expect(screen.getByText("Suggestions")).toBeInTheDocument();
    expect(screen.getByText("Somme des cotisations sociales sur 6 mois")).toBeInTheDocument();
    expect(mockSendChatMessage).not.toHaveBeenCalled();
  });

  it("clicking a suggestion sends it and hides the suggestions", async () => {
    const { promise, resolve } = deferred<string>();
    mockSendChatMessage.mockReturnValueOnce(promise);
    render(<ChatPanel />);

    const suggestion = "Quelle est la moyenne de mon net à payer ?";
    await userEvent.click(screen.getByText(suggestion));

    expect(mockSendChatMessage).toHaveBeenCalledWith(suggestion);
    expect(screen.queryByText("Suggestions")).not.toBeInTheDocument();
    // The suggestion text now lives in the user's own message bubble.
    expect(screen.getByText(suggestion)).toBeInTheDocument();

    resolve("Le net à payer moyen est de 2 340 €.");
    expect(await screen.findByText("Le net à payer moyen est de 2 340 €.")).toBeInTheDocument();
  });

  it("shows a loading indicator while the reply is pending, and disables the submit button", async () => {
    const user = userEvent.setup();
    const { promise, resolve } = deferred<string>();
    mockSendChatMessage.mockReturnValueOnce(promise);
    render(<ChatPanel />);

    const input = screen.getByPlaceholderText("Posez une question sur vos bulletins…");
    await user.type(input, "Bonjour");
    const submitButton = getSubmitButton();
    expect(submitButton).toBeEnabled();

    await user.click(submitButton);

    expect(input).toHaveValue(""); // cleared immediately on send
    expect(screen.getByText("Analyse en cours…")).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    resolve("Bonjour ! Comment puis-je vous aider ?");

    await waitFor(() => {
      expect(screen.queryByText("Analyse en cours…")).not.toBeInTheDocument();
    });
    expect(screen.getByText("Bonjour ! Comment puis-je vous aider ?")).toBeInTheDocument();
  });

  it("shows a fallback error message when the request fails", async () => {
    const user = userEvent.setup();
    mockSendChatMessage.mockRejectedValueOnce(new Error("network down"));
    render(<ChatPanel />);

    const input = screen.getByPlaceholderText("Posez une question sur vos bulletins…");
    await user.type(input, "Une question{enter}");

    expect(
      await screen.findByText(
        "Désolé, une erreur est survenue. Vérifiez que le serveur backend est bien lancé."
      )
    ).toBeInTheDocument();
  });

  it("does not send an empty or whitespace-only message", async () => {
    const user = userEvent.setup();
    render(<ChatPanel />);

    const submitButton = getSubmitButton();
    expect(submitButton).toBeDisabled();

    const input = screen.getByPlaceholderText("Posez une question sur vos bulletins…");
    await user.type(input, "   ");
    expect(submitButton).toBeDisabled();

    await user.click(submitButton);
    expect(mockSendChatMessage).not.toHaveBeenCalled();
    expect(screen.getByText("Suggestions")).toBeInTheDocument();
  });

  it("aligns the user's message to the right and the assistant's reply to the left", async () => {
    const user = userEvent.setup();
    mockSendChatMessage.mockResolvedValueOnce("Réponse de l'assistant.");
    render(<ChatPanel />);

    const input = screen.getByPlaceholderText("Posez une question sur vos bulletins…");
    await user.type(input, "Ma question{enter}");
    await screen.findByText("Réponse de l'assistant.");

    const userRow = screen.getByText("Ma question").closest(".flex");
    const assistantRow = screen.getByText("Réponse de l'assistant.").closest(".flex");
    expect(userRow?.className).toContain("justify-end");
    expect(assistantRow?.className).toContain("justify-start");
  });
});
