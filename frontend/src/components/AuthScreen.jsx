import { useState } from "react";

export default function AuthScreen({
  theme,
  backendOnline,
  onToggleTheme,
  onLogin,
  onRegister,
}) {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (mode === "register") {
        await onRegister({ username: username.trim(), email: email.trim(), password });
      } else {
        await onLogin({ email: email.trim(), password });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <button
        type="button"
        className="icon-btn auth-theme-btn"
        title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        onClick={onToggleTheme}
      >
        {theme === "dark" ? "☀" : "☾"}
      </button>

      <div className="auth-card">
        <div className="auth-brand">
          <span className="brand-icon" aria-hidden="true">✦</span>
          <div>
            <h1>AI ChatBot</h1>
            <p>
              {mode === "login"
                ? "Sign in to access your conversations"
                : "Create an account to start chatting"}
            </p>
          </div>
        </div>

        <div className="auth-tabs">
          <button
            type="button"
            className={mode === "login" ? "active" : ""}
            onClick={() => {
              setMode("login");
              setError("");
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={mode === "register" ? "active" : ""}
            onClick={() => {
              setMode("register");
              setError("");
            }}
          >
            Create Account
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === "register" && (
            <label>
              <span>Username</span>
              <input
                type="text"
                placeholder="Aayush"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                minLength={2}
                maxLength={50}
                required
              />
            </label>
          )}

          <label>
            <span>Email</span>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label>
            <span>Password</span>
            <input
              type="password"
              placeholder={mode === "register" ? "At least 6 characters" : "Your password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={mode === "register" ? 6 : 1}
              required
            />
          </label>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="primary-btn auth-submit" disabled={submitting}>
            {submitting
              ? "Please wait..."
              : mode === "login"
              ? "Sign In"
              : "Create Account"}
          </button>
        </form>

        <div className="auth-footer">
          <span
            className={`status-dot ${
              backendOnline === null
                ? "checking"
                : backendOnline
                ? "online"
                : "offline"
            }`}
          />
          <span>
            {backendOnline === null
              ? "Checking API..."
              : backendOnline
              ? "FastAPI Connected"
              : "Backend Offline — start uvicorn on port 8000"}
          </span>
        </div>
      </div>
    </div>
  );
}
