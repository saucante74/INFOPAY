import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import ConfirmDialog from "./ConfirmDialog";

describe("ConfirmDialog", () => {
  it("renders nothing when closed", () => {
    render(
      <ConfirmDialog
        isOpen={false}
        title="Supprimer ?"
        message="Confirmez."
        confirmLabel="Supprimer"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders the dialog and focuses the first button when open", () => {
    render(
      <ConfirmDialog
        isOpen={true}
        title="Supprimer ce bulletin ?"
        message="Confirmez."
        confirmLabel="Supprimer"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    const dialog = screen.getByRole("dialog", { name: "Supprimer ce bulletin ?" });
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(screen.getByRole("button", { name: "Annuler" })).toHaveFocus();
  });

  it("calls onCancel, not onConfirm, on Escape", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        isOpen={true}
        title="Supprimer ?"
        message="Confirmez."
        confirmLabel="Supprimer"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    await user.keyboard("{Escape}");

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("calls onCancel, not onConfirm, on a backdrop click", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        isOpen={true}
        title="Supprimer ?"
        message="Confirmez."
        confirmLabel="Supprimer"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    const backdrop = document.querySelector('[aria-hidden="true"]');
    expect(backdrop).not.toBeNull();
    if (backdrop) await user.click(backdrop);

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("calls onCancel, not onConfirm, when clicking Annuler", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        isOpen={true}
        title="Supprimer ?"
        message="Confirmez."
        confirmLabel="Supprimer"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    await user.click(screen.getByRole("button", { name: "Annuler" }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("calls onConfirm when clicking the confirm button", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        isOpen={true}
        title="Supprimer ?"
        message="Confirmez."
        confirmLabel="Supprimer"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    await user.click(screen.getByRole("button", { name: "Supprimer" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("disables both buttons while isConfirming is true", () => {
    render(
      <ConfirmDialog
        isOpen={true}
        title="Supprimer ?"
        message="Confirmez."
        confirmLabel="Supprimer"
        isConfirming={true}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "Annuler" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Supprimer" })).toBeDisabled();
  });
});
