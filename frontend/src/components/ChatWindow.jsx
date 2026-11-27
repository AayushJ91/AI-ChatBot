import { useEffect, useRef, useState } from "react";
import MessageContent from "./MessageContent";

const STARTER_PROMPTS = [
  {
    icon: "⚡",
    title: "Explain FastAPI",
    prompt: "Explain how FastAPI works with Pydantic schemas in simple terms with a tiny example.",
  },
  {
    icon: "🐍",
    title: "Write Python Code",
    prompt: "Write a clean Python function to find duplicate items in a list and explain its time complexity.",
  },
  {
    icon: "💡",
    title: "Project Ideas",
    prompt: "Suggest 3 cool next features I can add to my FastAPI + React AI chatbot project.",
  },
  {
    icon: "🗄️",
    title: "JSON to PostgreSQL",
    prompt: "What steps should a beginner follow to migrate a Python app from JSON file storage to PostgreSQL?",
  },
];

function formatTime(isoString) {
  if (!isoString) return "";
  return new Date(isoString).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function MessageBubble({ msg }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(msg.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // clipboard unavailable
    }
  }

  const isUser = msg.role === "user";

  return (
    <div className={`message-row ${msg.role}`}>
      <div className={`avatar ${msg.role}`} aria-hidden="true">
        {isUser ? "You" : "✦"}
      </div>
      <div className={`message ${msg.role}`}>
        <div className="message-meta">
          <span className="message-role">{isUser ? "You" : "Assistant"}</span>
          <div className="message-meta-right">
            <span className="message-time">{formatTime(msg.created_at)}</span>
            <button
              type="button"
              className="copy-msg-btn"
              title="Copy message"
              onClick={handleCopy}
            >
              {copied ? "✓" : "⧉"}
            </button>
          </div>
        </div>
        <MessageContent content={msg.content} />
      </div>
    </div>
  );
}

export default function ChatWindow({
  activeChat,
  messages,
  sending,
  error,
  sidebarCollapsed,
  onToggleSidebar,
  onSendMessage,
  onStartWithPrompt,
  onDismissError,
}) {
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  // Auto-grow textarea height as user types multiple lines
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [input]);

  async function submitMessage() {
    const trimmed = input.trim();
    if (!trimmed || sending || !activeChat) return;
    setInput("");
    const ok = await onSendMessage(trimmed);
    if (!ok) {
      setInput(trimmed); // restore message if send failed
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    submitMessage();
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitMessage();
    }
  }

  return (
    <main className="chat-window">
      <header className="chat-header">
        <div className="chat-header-left">
          {sidebarCollapsed && (
            <button
              type="button"
              className="icon-btn"
              title="Show sidebar"
              onClick={onToggleSidebar}
            >
              ☰
            </button>
          )}
          <div>
            <h2>{activeChat ? activeChat.title : "Welcome to AI ChatBot"}</h2>
            {activeChat && (
              <span className="chat-subtitle">
                {messages.length} {messages.length === 1 ? "message" : "messages"}
              </span>
            )}
          </div>
        </div>
        {activeChat && (
          <span className="chat-id" title={activeChat.id}>
            #{activeChat.id.slice(0, 8)}
          </span>
        )}
      </header>

      <section className="messages">
        {!activeChat || messages.length === 0 ? (
          <div className="starter-container">
            <div className="starter-hero">
              <div className="hero-badge">✦ AI Workspace</div>
              <h3>
                {activeChat
                  ? `Start chatting in "${activeChat.title}"`
                  : "What would you like to explore today?"}
              </h3>
              <p>
                Pick a starter prompt below or type your own message. Everything is saved
                automatically to your FastAPI backend.
              </p>
            </div>

            <div className="starter-grid">
              {STARTER_PROMPTS.map((item) => (
                <button
                  key={item.title}
                  type="button"
                  className="starter-card"
                  disabled={sending}
                  onClick={() =>
                    activeChat
                      ? onSendMessage(item.prompt)
                      : onStartWithPrompt(item.title, item.prompt)
                  }
                >
                  <span className="starter-icon">{item.icon}</span>
                  <span className="starter-title">{item.title}</span>
                  <span className="starter-preview">{item.prompt}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)
        )}

        {sending && (
          <div className="message-row assistant">
            <div className="avatar assistant" aria-hidden="true">✦</div>
            <div className="message assistant typing-bubble">
              <div className="typing-dots" aria-label="Assistant is thinking">
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </section>

      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button
            type="button"
            className="dismiss-error-btn"
            onClick={onDismissError}
            title="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      {activeChat && (
        <form className="message-form" onSubmit={handleSubmit}>
          <div className="composer-box">
            <textarea
              ref={textareaRef}
              rows={1}
              placeholder="Ask anything... (Enter to send, Shift+Enter for new line)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={sending}
            />
            <button
              type="submit"
              className="send-btn"
              disabled={sending || !input.trim()}
              title="Send message"
            >
              {sending ? "•••" : "Send ↑"}
            </button>
          </div>
        </form>
      )}
    </main>
  );
}
