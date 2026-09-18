import { act, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, it } from "vitest";

import RequireAuth from "./RequireAuth";
import { clearToken, setToken } from "./tokenStore";

function renderProtectedHome() {
  render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route
          path="/"
          element={
            <RequireAuth>
              <p>Contenu protégé</p>
            </RequireAuth>
          }
        />
        <Route path="/login" element={<p>Page de connexion</p>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("RequireAuth", () => {
  it("redirects to /login without a token", () => {
    renderProtectedHome();

    expect(screen.getByText("Page de connexion")).toBeInTheDocument();
    expect(screen.queryByText("Contenu protégé")).not.toBeInTheDocument();
  });

  it("renders the protected content with a token", () => {
    setToken("jwt.token.value");
    renderProtectedHome();

    expect(screen.getByText("Contenu protégé")).toBeInTheDocument();
  });

  it("redirects as soon as the token disappears (logout, or a 401)", () => {
    setToken("jwt.token.value");
    renderProtectedHome();

    act(() => {
      clearToken();
    });

    expect(screen.getByText("Page de connexion")).toBeInTheDocument();
  });
});
