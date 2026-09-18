import axios, { type AxiosInstance } from "axios";

import { clearToken, getToken } from "./tokenStore";

/**
 * Adds the bearer token to every request and logs out on any 401. This is
 * the only point where auth touches the API client, so `api/client.ts` and
 * the components calling it don't know authentication exists.
 *
 * Clearing the token is enough to redirect: `RequireAuth` re-renders from
 * the token store and sends the user to /login.
 */
export function attachAuth(api: AxiosInstance): void {
  api.interceptors.request.use((config) => {
    const token = getToken();
    if (token) config.headers.set("Authorization", `Bearer ${token}`);
    return config;
  });

  // Rethrown as-is: axios chains this with `.then(_, onRejected)`, so the
  // throw reaches the caller as the same rejection it would have seen.
  api.interceptors.response.use(undefined, (error: unknown): never => {
    if (axios.isAxiosError(error) && error.response?.status === 401) clearToken();
    throw error;
  });
}
