import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

import LoginForm from "./LoginForm";
import { closeAuthModal, resolveAuthModal, useAuthModalState } from "./authModal";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

/**
 * Opened by `requireAuth()` from anywhere (Navbar's "Se connecter",
 * UploadZone, ChatPanel, a 401 mid-session) rather than a route — unlike
 * `/aide`'s history, this one has to work while the visitor stays on
 * whatever page triggered it, so a route redirect isn't an option here.
 *
 * Same accessible-dialog pattern this codebase used for the pre-route
 * `HelpModal.tsx` (removed once Aide became a page — no code survives to
 * reuse verbatim, checked via `git log`, so this is rebuilt from the same
 * approach rather than copied): `createPortal` to `document.body`,
 * `role="dialog"`/`aria-modal`, a Tab/Shift+Tab focus trap, Escape and a
 * backdrop click both closing it, and focus restored to whatever was
 * focused before opening.
 */
export default function LoginModal() {
  const { isOpen } = useAuthModalState();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    // Deliberately narrower than `FOCUSABLE_SELECTOR`: the close button is
    // first in DOM order (top-right of the dialog, before the form), so
    // querying the general selector would focus it, not the username
    // field — worse for both a mouse user glancing where to type first and
    // a screen-reader user landing straight on the form's purpose.
    const firstField = dialogRef.current?.querySelector<HTMLElement>("input, textarea, select");
    firstField?.focus();

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        closeAuthModal();
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
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Also blocks pointer interaction with whatever's behind it — the
          reason two gated actions can never race each other for the one
          `pendingAction` slot in authModal.ts: nothing behind this overlay
          is reachable until the modal is closed one way or the other. */}
      <div className="absolute inset-0 bg-ink/50" aria-hidden="true" onClick={closeAuthModal} />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-modal-title"
        className="relative w-full max-w-sm rounded-lg border border-border bg-surface-raised p-6"
      >
        <div className="flex items-center justify-between">
          <h2 id="login-modal-title" className="text-lg font-bold">
            Connexion
          </h2>
          <button
            type="button"
            onClick={closeAuthModal}
            aria-label="Fermer"
            className="flex h-8 w-8 items-center justify-center rounded-md text-ink-soft transition-colors hover:bg-surface hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-1 text-sm text-ink-soft">Connectez-vous pour continuer.</p>

        <div className="mt-6">
          <LoginForm onSuccess={resolveAuthModal} />
        </div>
      </div>
    </div>,
    document.body
  );
}
