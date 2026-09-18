import axios from "axios";

import type { ApiErrorBody, ChatResponse, Payslip } from "./types";

export const api = axios.create({
  // `||`, not `??`: an env var set but left empty (`VITE_API_URL=` in a
  // .env file) is a misconfiguration, and falling back to localhost is
  // better than a `""` baseURL silently pointing requests at the frontend
  // origin. `??` would only guard against `undefined`.
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- empty string must fall back too
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
});

export async function uploadPayslip(file: File): Promise<Payslip> {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post<Payslip>("/api/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function fetchPayslips(): Promise<Payslip[]> {
  const { data } = await api.get<Payslip[]>("/api/payslips");
  return data;
}

export async function sendChatMessage(message: string): Promise<string> {
  const { data } = await api.post<ChatResponse>("/api/chat", { message });
  return data.reply;
}

/**
 * Pulls the human-readable message out of a failed request, or `undefined`
 * when there isn't one and the caller should fall back to its own wording.
 *
 * Kept here rather than in the components so that axios stays an
 * implementation detail of the API layer: `UploadZone` shouldn't need to know
 * which HTTP client the app uses to render an error string.
 */
export function getApiErrorMessage(error: unknown): string | undefined {
  // `ApiErrorBody | undefined`: axios types `response.data` as always
  // present, but an error response can genuinely have no body (or a
  // non-JSON one), so the optional chain below is real protection rather
  // than a redundant check the linter would flag.
  if (!axios.isAxiosError<ApiErrorBody | undefined>(error)) return undefined;
  const detail = error.response?.data?.detail;
  // Only the string form is a message meant for a human; FastAPI's
  // validation-error array is a payload shape, not a sentence.
  return typeof detail === "string" ? detail : undefined;
}
