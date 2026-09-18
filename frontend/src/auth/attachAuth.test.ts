/**
 * Runs the interceptors on a real axios instance. The custom `adapter`
 * replaces the HTTP transport, so nothing leaves the process, but the
 * interceptor chain is axios's own.
 */
import axios, { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import { describe, expect, it } from "vitest";

import { attachAuth } from "./attachAuth";
import { getToken, setToken } from "./tokenStore";

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

  it("clears the token on a 401 and still rejects to the caller", async () => {
    setToken("expired.token.value");
    const { api } = instanceRespondingWith(401);

    await expect(api.get("/api/payslips")).rejects.toBeInstanceOf(AxiosError);
    expect(getToken()).toBeNull();
  });

  it.each([403, 429, 500])("keeps the token on a %i", async (status) => {
    setToken("valid.token.value");
    const { api } = instanceRespondingWith(status);

    await expect(api.get("/api/chat")).rejects.toBeInstanceOf(AxiosError);
    expect(getToken()).toBe("valid.token.value");
  });
});
