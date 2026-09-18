import { Outlet } from "react-router";

import Footer from "../components/Footer";
import Navbar from "../components/Navbar";

/**
 * Chrome shared by every route: `Navbar` + `Footer` around a react-router
 * `<Outlet />`, in the same `min-h-screen flex-col` sticky-footer shell
 * `App.tsx` used before routes existed (see RAPPORT.md, "Navbar + Footer")
 * — moved here so it applies to all pages, not just the analyzer.
 */
export default function RootLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 p-4">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}
