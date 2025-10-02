import { fetchWithAuth } from "./auth";
import { ENDPOINTS } from "./endpoints";

export async function createChat({ chat_name, agent = null, model }) {
  const resp = await fetchWithAuth(ENDPOINTS.CHATS, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_name, agent, model }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Ошибка создания чата: ${resp.status} ${text}`);
  }

  return resp.json();
}
