import { useEffect, useState } from "react";
import {
  checkBackendHealth,
  createChat,
  deleteChat,
  getAllChats,
  getChat,
  getMe,
  loginUser,
  logoutUser,
  registerUser,
  sendMessage,
} from "./api/chatApi";
import AuthScreen from "./components/AuthScreen";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";

export default function App() {
  const [user, setUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);
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

  async function loadUserChats() {
    const list = await getAllChats();
    const sorted = [...list].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );
    setChats(sorted);
    if (sorted.length > 0) {
      await handleSelectChat(sorted[0].id);
    } else {
      setActiveChat(null);
      setMessages([]);
    }
  }

  // Check backend health & whether user already has a valid auth cookie
  useEffect(() => {
    async function init() {
      try {
        const [online, me] = await Promise.all([
          checkBackendHealth().catch(() => false),
          getMe().catch(() => null),
        ]);
        setBackendOnline(online);
        if (me) {
          setUser(me);
          await loadUserChats();
        }
      } catch (err) {
        setBackendOnline(false);
        setError(`Could not reach backend: ${err.message}`);
      } finally {
        setAuthChecking(false);
      }
    }
    init();
  }, []);

  async function handleLogin(credentials) {
    const loggedInUser = await loginUser(credentials);
    setBackendOnline(true);
    setUser(loggedInUser);
    await loadUserChats();
  }

  async function handleRegister(details) {
    const newUser = await registerUser(details);
    setBackendOnline(true);
    setUser(newUser);
    await loadUserChats();
  }

  async function handleLogout() {
    try {
      await logoutUser();
    } catch {
      // clear local state even if request fails
    }
    setUser(null);
    setChats([]);
    setActiveChat(null);
    setMessages([]);
    setError("");
  }

  // Open a specific chat -> GET /chats/{chat_id}
  async function handleSelectChat(chatId) {
    setError("");
    try {
      const chat = await getChat(chatId);
      setActiveChat(chat);
      setMessages(chat.messages || []);
    } catch (err) {
      if (err.status === 401) {
        setUser(null);
        return;
      }
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
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setError(err.message);
      return false;
    } finally {
      setSending(false);
    }
  }

  async function handleStartWithPrompt(title, prompt) {
    const created = await handleCreateChat(title);
    if (created) {
      await handleSendMessage(prompt, created.id);
    }
  }

  if (authChecking) {
    return (
      <div className="auth-page">
        <div className="auth-loading">Loading workspace...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <AuthScreen
        theme={theme}
        backendOnline={backendOnline}
        onToggleTheme={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
        onLogin={handleLogin}
        onRegister={handleRegister}
      />
    );
  }

  return (
    <div className="app-layout">
      <Sidebar
        user={user}
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
        onLogout={handleLogout}
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
