'use client';

import React, { useEffect, useRef } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  isStreaming?: boolean;
}

interface ChatMessageProps {
  message: Message;
}

function parseMarkdown(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  // Match links [text](url), code blocks, inline code, bold, italic, and newlines.
  const regex = /(\[.+?\]\([^\)]+?\))|(```[\s\S]*?```)|(`[^`]+`)|(\*\*[^*\n]+\*\*)|(\*(?!\s)[^*\n]+\*)|(\n)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<span key={`text-${lastIndex}`}>{text.slice(lastIndex, match.index)}</span>);
    }

    const m = match[0];

    if (m.startsWith('[') && m.includes('](')) {
      const linkMatch = m.match(/\[(.+?)\]\((.+?)\)/);
      if (linkMatch) {
        let href = linkMatch[2];
        // Ensure valid relative or absolute URL
        if (!href.startsWith('http') && !href.startsWith('/')) {
            href = '/' + href;
        }
        parts.push(
          <a
            key={`link-${match.index}`}
            href={href}
            className="chat-product-link"
            onClick={(e) => e.stopPropagation()}
            target={href.startsWith('http') ? '_blank' : undefined}
          >
            <span className="chat-link-icon">🌿</span>
            {linkMatch[1]}
          </a>
        );
      } else {
        parts.push(<span key={`text-err-${match.index}`}>{m}</span>);
      }
    } else if (m.startsWith('```')) {
      parts.push(
        <pre key={`code-${match.index}`} className="chat-code-block">
          <code>{m.replace(/```\n?/g, '')}</code>
        </pre>
      );
    } else if (m.startsWith('`')) {
      parts.push(
        <code key={`inline-${match.index}`} className="chat-inline-code">
          {m.slice(1, -1)}
        </code>
      );
    } else if (m.startsWith('**')) {
      parts.push(
        <strong key={`bold-${match.index}`}>{m.slice(2, -2)}</strong>
      );
    } else if (m.startsWith('*')) {
      parts.push(
        <em key={`italic-${match.index}`}>{m.slice(1, -1)}</em>
      );
    } else if (m === '\n') {
      parts.push(<br key={`br-${match.index}`} />);
    } else {
      parts.push(<span key={`text-${match.index}`}>{m}</span>);
    }

    lastIndex = match.index + m.length;
  }

  if (lastIndex < text.length) {
    parts.push(<span key={`text-${lastIndex}`}>{text.slice(lastIndex)}</span>);
  }

  return parts.length > 0 ? parts : text;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [message.text, message.isStreaming]);

  if (message.role === 'user') {
    return (
      <div className="chat-message chat-message-user" ref={ref}>
        <div className="chat-bubble chat-bubble-user">
          {message.text}
        </div>
      </div>
    );
  }

  return (
    <div className="chat-message chat-message-bot" ref={ref}>
      <div className="chat-avatar">🌿</div>
      <div className="chat-bubble chat-bubble-bot">
        {parseMarkdown(message.text)}
        {message.isStreaming && <span className="chat-cursor" />}
      </div>
    </div>
  );
}
