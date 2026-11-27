import { useEffect, useState } from "react";
import {
  checkBackendHealth,
  createChat,
  deleteChat,
  getAllChats,
  getChat,
  sendMessage,
} from "./api/chatApi";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";

export default function App() {
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [backendOnline, setBackendOnline] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState(
    () => localStorage.getItem("chatbot-theme") || "dark"
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("chatbot-theme", theme);
  }, [theme]);

  // Load chats & check backend health on startup
  useEffect(() => {
    async function init() {
      try {
        const [online, list] = await Promise.all([
          checkBackendHealth().catch(() => false),
          getAllChats(),
        ]);
        setBackendOnline(online);
        // Sort newest chats first
        const sorted = [...list].sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
        setChats(sorted);
        if (sorted.length > 0) {
          await handleSelectChat(sorted[0].id);
        }
      } catch (err) {
        setBackendOnline(false);
        setError(`Could not reach backend: ${err.message}`);
      }
    }
    init();
  }, []);

  // Open a specific chat -> GET /chats/{chat_id}
  async function handleSelectChat(chatId) {
    setError("");
    try {
      const chat = await getChat(chatId);
      setActiveChat(chat);
      setMessages(chat.messages || []);
    } catch (err) {
      setError(err.message);
    }
  }

  // Create a new chat -> POST /chats/
  async function handleCreateChat(title) {
    setError("");
    try {
      const created = await createChat(title);
      setBackendOnline(true);
      setChats((prev) => [
        { id: created.id, title: created.title, created_at: created.created_at },
        ...prev,
      ]);
      setActiveChat(created);
      setMessages(created.messages || []);
      return created;
    } catch (err) {
      setError(err.message);
      return null;
    }
  }

  // Delete a chat -> DELETE /chats/{chat_id}
  async function handleDeleteChat(chatId) {
    setError("");
    try {
      await deleteChat(chatId);
      const remaining = chats.filter((c) => c.id !== chatId);
      setChats(remaining);

      if (activeChat?.id === chatId) {
        if (remaining.length > 0) {
          await handleSelectChat(remaining[0].id);
        } else {
          setActiveChat(null);
          setMessages([]);
        }
      }
    } catch (err) {
      setError(err.message);
    }
  }

  // Send a message with optimistic UI -> POST /chats/{chat_id}/messages
  async function handleSendMessage(content, targetChatId = activeChat?.id) {
    if (!targetChatId) return false;
    setError("");
    setSending(true);

    // Show user's message immediately while waiting for the LLM
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      role: "user",
      content,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const result = await sendMessage(targetChatId, content);
      setBackendOnline(true);
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempId),
        result.user_message,
        result.assistant_message,
      ]);
      return true;
    } catch (err) {
      // Remove optimistic message on failure so chat stays synced with backend
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setError(err.message);
      return false;
    } finally {
      setSending(false);
    }
  }

  // Clicking a starter prompt when no chat is open creates a chat & sends it right away
  async function handleStartWithPrompt(title, prompt) {
    const created = await handleCreateChat(title);
    if (created) {
      await handleSendMessage(prompt, created.id);
    }
  }

  return (
    <div className="app-layout">
      <Sidebar
        chats={chats}
        activeChatId={activeChat?.id}
        backendOnline={backendOnline}
        theme={theme}
        collapsed={sidebarCollapsed}
        onToggleTheme={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
        onSelectChat={handleSelectChat}
        onCreateChat={handleCreateChat}
        onDeleteChat={handleDeleteChat}
      />
      <ChatWindow
        activeChat={activeChat}
        messages={messages}
        sending={sending}
        error={error}
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed((c) => !c)}
        onSendMessage={handleSendMessage}
        onStartWithPrompt={handleStartWithPrompt}
        onDismissError={() => setError("")}
      />
    </div>
  );
}
