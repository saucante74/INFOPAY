import { Outlet } from "react-router";

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
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      {/* `max-w-[1800px]`, not the old `max-w-7xl` (1280px) — see
          RAPPORT.md for the 1440/1920 numbers behind this value.
          Navbar/Footer share it so their edges still line up with
          `<main>`'s; `AnalyzerPage`'s `[1fr_380px]` grid hands all the
          gained width to the table, the chat card staying at 380px. */}
      <main className="mx-auto flex w-full max-w-[1800px] flex-1 flex-col gap-4 p-4">
        <Outlet />
      </main>

      <Footer />
      <LoginModal />
    </div>
  );
}
