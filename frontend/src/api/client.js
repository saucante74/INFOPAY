import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
});

export async function uploadPayslip(file) {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post("/api/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function fetchPayslips() {
  const { data } = await api.get("/api/payslips");
  return data;
}

export async function sendChatMessage(message) {
  const { data } = await api.post("/api/chat", { message });
  return data.reply;
}
