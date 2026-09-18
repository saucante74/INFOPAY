import type { ReactNode } from "react";
import { Navigate } from "react-router";

import { useAuthToken } from "./tokenStore";

interface RequireAuthProps {
  children: ReactNode;
}

/**
 * Renders `children` only with a token present, otherwise redirects to
 * /login. Presence is checked, not validity: an expired token still gets
 * through here, but the first API call returns 401, `attachAuth` clears
 * the token, and this component redirects on the next render.
 */
export default function RequireAuth({ children }: RequireAuthProps) {
  const token = useAuthToken();
  return token ? children : <Navigate to="/login" replace />;
}
