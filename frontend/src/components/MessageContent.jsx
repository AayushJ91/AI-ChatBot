import { useState } from "react";

function CodeBlock({ language, code }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard unavailable
    }
  }

  return (
    <div className="code-block">
      <div className="code-block-header">
        <span>{language || "code"}</span>
        <button type="button" className="copy-code-btn" onClick={handleCopy}>
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
}

// Renders inline **bold**, *italic*, and `inline code`
function renderInline(text) {
  const tokens = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return tokens.map((token, idx) => {
    if (token.startsWith("`") && token.endsWith("`") && token.length > 2) {
      return (
        <code key={idx} className="inline-code">
          {token.slice(1, -1)}
        </code>
      );
    }
    if (token.startsWith("**") && token.endsWith("**") && token.length > 4) {
      return <strong key={idx}>{token.slice(2, -2)}</strong>;
    }
    if (token.startsWith("*") && token.endsWith("*") && token.length > 2) {
      return <em key={idx}>{token.slice(1, -1)}</em>;
    }
    return token;
  });
}

function renderTextBlock(block, keyPrefix) {
  const lines = block.split("\n");
  const elements = [];
  let listItems = [];
  let listType = null;

  function flushList(keySuffix) {
    if (listItems.length === 0) return;
    const Tag = listType === "ol" ? "ol" : "ul";
    elements.push(
      <Tag key={`${keyPrefix}-list-${keySuffix}`} className="md-list">
        {listItems.map((item, i) => (
          <li key={i}>{renderInline(item)}</li>
        ))}
      </Tag>
    );
    listItems = [];
    listType = null;
  }

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    if (/^[-*]\s+/.test(trimmed)) {
      if (listType && listType !== "ul") flushList(idx);
      listType = "ul";
      listItems.push(trimmed.replace(/^[-*]\s+/, ""));
      return;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      if (listType && listType !== "ol") flushList(idx);
      listType = "ol";
      listItems.push(trimmed.replace(/^\d+\.\s+/, ""));
      return;
    }

    flushList(idx);

    if (trimmed === "") {
      elements.push(<div key={`${keyPrefix}-sp-${idx}`} className="md-spacer" />);
      return;
    }

    const headingMatch = trimmed.match(/^(#{1,3})\s+(.*)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      elements.push(
        <div key={`${keyPrefix}-h-${idx}`} className={`md-heading md-h${level}`}>
          {renderInline(headingMatch[2])}
        </div>
      );
      return;
    }

    elements.push(
      <p key={`${keyPrefix}-p-${idx}`} className="md-paragraph">
        {renderInline(line)}
      </p>
    );
  });

  flushList("end");
  return elements;
}

export default function MessageContent({ content }) {
  // Split content into fenced code blocks and normal markdown text
  const parts = [];
  const codeRegex = /```(\w*)\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = codeRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", value: content.slice(lastIndex, match.index) });
    }
    parts.push({
      type: "code",
      language: match[1],
      value: match[2].replace(/\n$/, ""),
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push({ type: "text", value: content.slice(lastIndex) });
  }

  return (
    <div className="message-content">
      {parts.map((part, idx) =>
        part.type === "code" ? (
          <CodeBlock key={idx} language={part.language} code={part.value} />
        ) : (
          <div key={idx}>{renderTextBlock(part.value, idx)}</div>
        )
      )}
    </div>
  );
}
