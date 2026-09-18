/**
 * Runs the interceptors on a real axios instance. The custom `adapter`
 * replaces the HTTP transport, so nothing leaves the process, but the
 * interceptor chain is axios's own.
 */
import { renderHook } from "@testing-library/react";
import axios, { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import { afterEach, describe, expect, it } from "vitest";

import { attachAuth } from "./attachAuth";
import { closeAuthModal, useAuthModalState } from "./authModal";
import { getToken, setToken } from "./tokenStore";

// `authModal`'s open/closed state is a plain module-level variable, not
// reset by localStorage clearing — done explicitly so no test starts with
// a stray open modal left by the previous one.
afterEach(() => {
  closeAuthModal();
});

function instanceRespondingWith(status: number) {
  const sent: InternalAxiosRequestConfig[] = [];
  const api = axios.create({
    adapter: (config) => {
      sent.push(config);
      const response: AxiosResponse = { data: {}, status, statusText: "", headers: {}, config };
      return status < 400
        ? Promise.resolve(response)
        : Promise.reject(new AxiosError("failed", "ERR_BAD_RESPONSE", config, null, response));
    },
  });
  attachAuth(api);
  return { api, sent };
}

describe("attachAuth", () => {
  it("sends the stored token as a bearer header", async () => {
    setToken("jwt.token.value");
    const { api, sent } = instanceRespondingWith(200);

    await api.get("/api/payslips");

    expect(sent[0]?.headers.get("Authorization")).toBe("Bearer jwt.token.value");
  });

  it("sends no Authorization header when logged out", async () => {
    const { api, sent } = instanceRespondingWith(200);

    await api.get("/api/payslips");

    expect(sent[0]?.headers.has("Authorization")).toBe(false);
  });

  it("clears the token on a 401, opens the shared login modal, and still rejects to the caller", async () => {
    setToken("expired.token.value");
    const { result } = renderHook(() => useAuthModalState());
    const { api } = instanceRespondingWith(401);

    await expect(api.get("/api/payslips")).rejects.toBeInstanceOf(AxiosError);

    expect(getToken()).toBeNull();
    expect(result.current.isOpen).toBe(true);
  });

  it.each([403, 429, 500])(
    "keeps the token, and doesn't open the modal, on a %i",
    async (status) => {
      setToken("valid.token.value");
      const { result } = renderHook(() => useAuthModalState());
      const { api } = instanceRespondingWith(status);

      await expect(api.get("/api/chat")).rejects.toBeInstanceOf(AxiosError);

      expect(getToken()).toBe("valid.token.value");
      expect(result.current.isOpen).toBe(false);
    }
  );
});
