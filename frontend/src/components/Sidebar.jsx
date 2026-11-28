import { useState } from "react";

function formatShortDate(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  const today = new Date();
  const isToday =
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function Sidebar({
  user,
  chats,
  activeChatId,
  backendOnline,
  theme,
  collapsed,
  onToggleTheme,
  onToggleCollapse,
  onSelectChat,
  onCreateChat,
  onDeleteChat,
  onLogout,
}) {
  const [newTitle, setNewTitle] = useState("");
  const [search, setSearch] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const filteredChats = chats.filter((chat) =>
    chat.title.toLowerCase().includes(search.trim().toLowerCase())
  );

  async function handleSubmit(e) {
    e.preventDefault();
    await onCreateChat(newTitle || "New Chat");
    setNewTitle("");
  }

  function handleDeleteClick(e, chatId) {
    e.stopPropagation();
    if (confirmDeleteId === chatId) {
      setConfirmDeleteId(null);
      onDeleteChat(chatId);
    } else {
      setConfirmDeleteId(chatId);
    }
  }

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-header">
        <div className="brand">
          <span className="brand-icon" aria-hidden="true">✦</span>
          <h1>AI ChatBot</h1>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="icon-btn"
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            onClick={onToggleTheme}
          >
            {theme === "dark" ? "☀" : "☾"}
          </button>
          <button
            type="button"
            className="icon-btn"
            title="Hide sidebar"
            onClick={onToggleCollapse}
          >
            ✕
          </button>
        </div>
      </div>

      <form className="new-chat-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="New chat title (optional)..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          maxLength={100}
        />
        <button type="submit" className="primary-btn">
          <span>+</span> New Chat
        </button>
      </form>

      <div className="search-box">
        <input
          type="text"
          placeholder="Search conversations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button
            type="button"
            className="clear-search-btn"
            onClick={() => setSearch("")}
            title="Clear search"
          >
            ×
          </button>
        )}
      </div>

      <div className="chat-list-label">
        <span>Conversations</span>
        <span className="chat-count">{filteredChats.length}</span>
      </div>

      <div className="chat-list">
        {filteredChats.length === 0 ? (
          <p className="empty-hint">
            {chats.length === 0
              ? "No chats yet. Start one above!"
              : "No matching conversations."}
          </p>
        ) : (
          filteredChats.map((chat) => {
            const isConfirming = confirmDeleteId === chat.id;
            return (
              <div
                key={chat.id}
                className={`chat-item ${chat.id === activeChatId ? "active" : ""}`}
                onClick={() => {
                  setConfirmDeleteId(null);
                  onSelectChat(chat.id);
                }}
                onMouseLeave={() => {
                  if (isConfirming) setConfirmDeleteId(null);
                }}
              >
                <div className="chat-item-info">
                  <span className="chat-title" title={chat.title}>
                    {chat.title}
                  </span>
                  <span className="chat-date">
                    {formatShortDate(chat.created_at)}
                  </span>
                </div>
                <button
                  type="button"
                  className={`delete-btn ${isConfirming ? "confirming" : ""}`}
                  title={isConfirming ? "Click again to confirm delete" : "Delete chat"}
                  onClick={(e) => handleDeleteClick(e, chat.id)}
                >
                  {isConfirming ? "Sure?" : "×"}
                </button>
              </div>
            );
          })
        )}
      </div>

      <div className="sidebar-footer">
        <div className="user-badge">
          <div className="user-avatar" aria-hidden="true">
            {user?.username?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="user-info">
            <span className="user-name" title={user?.username}>
              {user?.username}
            </span>
            <span className="user-status">
              <span
                className={`status-dot ${
                  backendOnline === null
                    ? "checking"
                    : backendOnline
                    ? "online"
                    : "offline"
                }`}
              />
              {backendOnline ? "Connected" : "Offline"}
            </span>
          </div>
        </div>
        <button
          type="button"
          className="logout-btn"
          title="Log out"
          onClick={onLogout}
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
