// Base URL of your FastAPI backend
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

async function handleResponse(res) {
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const err = await res.json();
      if (err?.detail) {
        message = typeof err.detail === "string" ? err.detail : JSON.stringify(err.detail);
      }
    } catch {
      // ignore JSON parse errors on non-JSON error responses
    }
    throw new Error(message);
  }
  if (res.status === 204) {
    return null;
  }
  return res.json();
}

// 0. GET / -> Quick health check to show Online/Offline status in the sidebar
export async function checkBackendHealth() {
  const res = await fetch(`${API_BASE_URL}/`);
  return res.ok;
}

// 1. GET /chats/ -> Retrieve all chats (metadata only: id, title, created_at)
export async function getAllChats() {
  const res = await fetch(`${API_BASE_URL}/chats/`);
  return handleResponse(res);
}

// 2. POST /chats/ -> Create a new chat
export async function createChat(title = "New Chat") {
  const trimmed = title.trim();
  const res = await fetch(`${API_BASE_URL}/chats/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: trimmed || "New Chat" }),
  });
  return handleResponse(res);
}

// 3. GET /chats/{chat_id} -> Retrieve a specific chat (metadata + messages)
export async function getChat(chatId) {
  const res = await fetch(`${API_BASE_URL}/chats/${chatId}`);
  return handleResponse(res);
}

// 4. GET /chats/{chat_id}/messages -> Retrieve messages belonging to a chat
export async function getMessages(chatId) {
  const res = await fetch(`${API_BASE_URL}/chats/${chatId}/messages`);
  return handleResponse(res);
}

// 5. POST /chats/{chat_id}/messages -> Send a user message and get AI reply
export async function sendMessage(chatId, content) {
  const res = await fetch(`${API_BASE_URL}/chats/${chatId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  return handleResponse(res);
}

// 6. DELETE /chats/{chat_id} -> Delete a chat
export async function deleteChat(chatId) {
  const res = await fetch(`${API_BASE_URL}/chats/${chatId}`, {
    method: "DELETE",
  });
  return handleResponse(res);
}
