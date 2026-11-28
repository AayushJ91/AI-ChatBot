// Match the current browser host (localhost vs 127.0.0.1) so SameSite=Lax cookies always attach
const defaultHost =
  typeof window !== "undefined" ? window.location.hostname : "127.0.0.1";
const API_BASE_URL =
  import.meta.env.VITE_API_URL || `http://${defaultHost}:8000`;

async function handleResponse(res) {
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const err = await res.json();
      if (Array.isArray(err?.detail)) {
        message = err.detail.map((d) => d.msg).join(" • ");
      } else if (typeof err?.detail === "string") {
        message = err.detail;
      }
    } catch {
      // ignore JSON parse errors on non-JSON error responses
    }
    const error = new Error(message);
    error.status = res.status;
    throw error;
  }
  if (res.status === 204) {
    return null;
  }
  return res.json();
}

function apiFetch(path, options = {}) {
  return fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    ...options,
  });
}

// 0. GET / -> Quick health check to show Online/Offline status
export async function checkBackendHealth() {
  const res = await apiFetch("/");
  return res.ok;
}

// --- Auth Endpoints ---

// GET /auth/me -> Return current user from HttpOnly cookie (or null if 401)
export async function getMe() {
  const res = await apiFetch("/auth/me");
  if (res.status === 401) {
    return null;
  }
  return handleResponse(res);
}

// POST /auth/register -> Create account + set HttpOnly cookie
export async function registerUser({ username, email, password }) {
  const res = await apiFetch("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });
  return handleResponse(res);
}

// POST /auth/login -> Verify credentials + set HttpOnly cookie
export async function loginUser({ email, password }) {
  const res = await apiFetch("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse(res);
}

// POST /auth/logout -> Clear HttpOnly cookie
export async function logoutUser() {
  const res = await apiFetch("/auth/logout", {
    method: "POST",
  });
  return handleResponse(res);
}

// --- Chat Endpoints (protected by auth cookie) ---

// 1. GET /chats/ -> Retrieve all chats for logged-in user
export async function getAllChats() {
  const res = await apiFetch("/chats/");
  return handleResponse(res);
}

// 2. POST /chats/ -> Create a new chat
export async function createChat(title = "New Chat") {
  const trimmed = title.trim();
  const res = await apiFetch("/chats/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: trimmed || "New Chat" }),
  });
  return handleResponse(res);
}

// 3. GET /chats/{chat_id} -> Retrieve a specific chat (metadata + messages)
export async function getChat(chatId) {
  const res = await apiFetch(`/chats/${chatId}`);
  return handleResponse(res);
}

// 4. GET /chats/{chat_id}/messages -> Retrieve messages belonging to a chat
export async function getMessages(chatId) {
  const res = await apiFetch(`/chats/${chatId}/messages`);
  return handleResponse(res);
}

// 5. POST /chats/{chat_id}/messages -> Send a user message and get AI reply
export async function sendMessage(chatId, content) {
  const res = await apiFetch(`/chats/${chatId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  return handleResponse(res);
}

// 6. DELETE /chats/{chat_id} -> Delete a chat
export async function deleteChat(chatId) {
  const res = await apiFetch(`/chats/${chatId}`, {
    method: "DELETE",
  });
  return handleResponse(res);
}
