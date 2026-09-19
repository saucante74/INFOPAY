import { useEffect } from "react";
import { Outlet, useLocation } from "react-router";

import LoginModal from "../auth/LoginModal";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";

/**
 * Chrome shared by every route: `Navbar` + `Footer` around a react-router
 * `<Outlet />`, in the same `min-h-screen flex-col` sticky-footer shell
 * `App.tsx` used before routes existed (see RAPPORT.md, "Navbar + Footer")
 * — moved here so it applies to all pages, not just the analyzer.
 *
 * `LoginModal` mounted once here, not per-route: it's opened by
 * `requireAuth()` from anywhere (Navbar, UploadZone, ChatPanel, a 401), and
 * `RootLayout` is the one element react-router keeps mounted across every
 * route change, so it's a stable place for it to live regardless of which
 * page is showing underneath. It renders `null` while closed either way.
 */
export default function RootLayout() {
  const location = useLocation();

  // Plain `<Routes>`/`<Route>` (not a data router) does no scroll handling
  // of its own — `<ScrollRestoration>`'s hash support is data-router-only —
  // so a link like `/aide#exemples` would otherwise land on "/aide" at the
  // top of the page instead of at the anchored section. Re-runs on every
  // navigation (`RootLayout` stays mounted across all of them, per the
  // class comment above), and does nothing when there's no hash.
  useEffect(() => {
    if (!location.hash) return;
    document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: "smooth" });
  }, [location.pathname, location.hash]);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      {/* `max-w-[1540px]` — the literal midpoint between the old
          `max-w-7xl` (1280px) and a previous session's `max-w-[1800px]`,
          which was judged too wide (margins too thin). See RAPPORT.md for
          the real getBoundingClientRect() measurements confirming the
          9-column table still fits comfortably at this width and at
          1440px, with no need to revert that session's `px-2`/`text-xs`
          table-density changes. Navbar/Footer share this value so their
          edges still line up with `<main>`'s; `AnalyzerPage`'s
          `[1fr_380px]` grid hands all the gained width to the table, the
          chat card staying at 380px. */}
      <main className="mx-auto flex w-full max-w-[1540px] flex-1 flex-col gap-4 p-4">
        <Outlet />
      </main>

      <Footer />
      <LoginModal />
    </div>
  );
}
