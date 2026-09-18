import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  /** Disables both buttons and reflects an in-flight confirm action —
   * `PayslipTable` passes this while the delete request is pending, so a
   * slow network can't be double-clicked into two DELETE calls. */
  isConfirming?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * A generic yes/no confirmation dialog — same accessible-dialog pattern as
 * `auth/LoginModal.tsx` (`createPortal`, `role="dialog"`/`aria-modal`, a
 * Tab/Shift+Tab focus trap, Escape and a backdrop click both cancelling,
 * focus restored on close), reused here rather than reinvented for a
 * second modal in this codebase. Chosen over `window.confirm()` for this
 * exact reason: a native `confirm()` can't be styled (it would show the
 * browser's own dialog, unthemed, breaking dark mode) and is a blocking
 * call the rest of this app avoids — see RAPPORT.md.
 *
 * Generic on purpose (title/message/labels as props, not "delete a
 * payslip" hardcoded) since a second confirm-before-destructive-action
 * need is a very ordinary thing for this kind of app to grow — but still
 * concrete enough to add in one sitting: no config beyond what
 * `PayslipTable` actually needs today.
 */
export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel,
  isConfirming = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const firstButton = dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    firstButton?.focus();

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        onCancel();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/50" aria-hidden="true" onClick={onCancel} />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
        className="relative w-full max-w-sm rounded-lg border border-border bg-surface-raised p-6"
      >
        <h2 id="confirm-dialog-title" className="text-lg font-bold">
          {title}
        </h2>
        <p id="confirm-dialog-message" className="mt-2 text-sm text-ink-soft">
          {message}
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isConfirming}
            className="rounded-md px-4 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-surface hover:text-ink disabled:opacity-60"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isConfirming}
            className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
