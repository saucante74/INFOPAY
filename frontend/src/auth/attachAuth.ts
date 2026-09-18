import axios, { type AxiosInstance } from "axios";

import { requireAuth } from "./authModal";
import { clearToken, getToken } from "./tokenStore";

/**
 * Adds the bearer token to every request, and on any 401 (session expired
 * or never started) clears it and opens the shared login modal — this is
 * the "token expires mid-session" half of `requireAuth`'s job, the other
 * half being the explicit checks in UploadZone/ChatPanel/Navbar. This is
 * the only point where auth touches the API client, so `api/client.ts` and
 * the components calling it don't know authentication exists.
 *
 * No pending action is attached here (`requireAuth()`, no argument):
 * unlike a fresh upload/chat attempt, the request that just failed already
 * ran and its caller is already handling the rejection in its own catch
 * block — retrying it automatically would mean safely replaying an
 * arbitrary axios request (including a multipart body) from a generic
 * interceptor, which is real complexity for a rare case. The modal still
 * opens so the user can log back in; the interrupted action itself is
 * simply retried by hand, same as any other failed request. See RAPPORT.md.
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
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      clearToken();
      requireAuth();
    }
    throw error;
  });
}
