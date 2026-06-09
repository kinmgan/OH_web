'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import ChatMessage from './ChatMessage';
import { sendChatMessage, clearChatSession } from '@/services/chatbot.service';
import './ChatWidget.css';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  isStreaming?: boolean;
}

const SESSION_KEY = 'oh_chatbot_session_id';

const WELCOME_MESSAGE = 'Xin chào! 👋 Tôi là **Đông Y AI**, trợ lý tư vấn sản phẩm của Oriental Herbs. Tôi có thể giúp bạn tìm sản phẩm Đông Y phù hợp. Bạn đang gặp vấn đề gì ạ?';

const QUICK_SUGGESTIONS = [
  'Mất ngủ, nên dùng gì?',
  'Đau đầu, chóng mặt',
  'Tiêu hóa kém',
  'Tăng cường sức đều bàng',
  'Giảm đau nhức xương khớp',
];

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let stored = sessionStorage.getItem(SESSION_KEY);
    if (!stored) {
      stored = Date.now().toString();
      sessionStorage.setItem(SESSION_KEY, stored);
    }
    setSessionId(stored);
  }, []);

  useEffect(() => {
    if (sessionId && !messages.length) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        text: WELCOME_MESSAGE,
      }]);
    }
  }, [sessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleSend = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsgId = Date.now().toString();
    const botMsgId = (Date.now() + 1).toString();

    setMessages(prev => [
      ...prev,
      { id: userMsgId, role: 'user', text: text.trim() },
      { id: botMsgId, role: 'assistant', text: '', isStreaming: true },
    ]);
    setInput('');
    setIsLoading(true);
    setError(null);

    let currentText = '';

    try {
      await sendChatMessage(text.trim(), sessionId, {
        onChunk: (chunk) => {
          currentText += chunk;
          setMessages(prev => prev.map(msg =>
            msg.id === botMsgId
              ? { ...msg, text: currentText }
              : msg
          ));
        },
        onDone: () => {
          setMessages(prev => prev.map(msg =>
            msg.id === botMsgId
              ? { ...msg, text: currentText, isStreaming: false }
              : msg
          ));
          setIsLoading(false);
        },
        onError: (err) => {
          setError(err);
          setMessages(prev => prev.map(msg =>
            msg.id === botMsgId
              ? { ...msg, text: 'Xin lỗi, đã xảy ra lỗi. Vui lòng thử lại.', isStreaming: false }
              : msg
          ));
          setIsLoading(false);
        },
      });
    } catch {
      setMessages(prev => prev.map(msg =>
        msg.id === botMsgId
          ? { ...msg, text: 'Xin lỗi, đã xảy ra lỗi. Vui lòng thử lại.', isStreaming: false }
          : msg
      ));
      setIsLoading(false);
    }
  }, [isLoading, sessionId]);

  const handleSuggestion = useCallback((suggestion: string) => {
    handleSend(suggestion);
  }, [handleSend]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  }, [input, handleSend]);

  const handleNewChat = useCallback(() => {
    const newId = Date.now().toString();
    sessionStorage.setItem(SESSION_KEY, newId);
    setSessionId(newId);
    setMessages([{ id: 'welcome-' + Date.now(), role: 'assistant', text: WELCOME_MESSAGE }]);
    setError(null);
  }, []);

  return (
    <div className="chat-widget-root">
      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <div className="chat-header-left">
              <div className="chat-avatar-large">🌿</div>
              <div className="chat-header-info">
                <span className="chat-header-name">Đông Y AI</span>
                <span className="chat-header-status">Luôn sẵn sàng hỗ trợ</span>
              </div>
            </div>
            <div className="chat-header-actions">
              <button className="chat-action-btn" onClick={handleNewChat} title="Cuộc trò chuyện mới">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>
              <button className="chat-action-btn chat-close-btn" onClick={handleClose} title="Đóng">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="chat-body">
            {messages.map(msg => (
              <ChatMessage key={msg.id} message={msg} />
            ))}

            {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
              <div className="chat-message chat-message-bot">
                <div className="chat-avatar">🌿</div>
                <div className="chat-bubble chat-bubble-bot">
                  <div className="chat-typing">
                    <span /><span /><span />
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="chat-error">{error}</div>
            )}

            {!isLoading && messages.length > 0 && (
              <div className="chat-suggestions">
                {QUICK_SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    className="chat-suggestion-chip"
                    onClick={() => handleSuggestion(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="chat-footer">
            <textarea
              ref={inputRef}
              className="chat-input"
              placeholder="Nhập câu hỏi của bạn..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={isLoading}
            />
            <button
              className="chat-send-btn"
              onClick={() => handleSend(input)}
              disabled={!input.trim() || isLoading}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>

          <div className="chat-disclaimer">
            ⚠️ Không thay thế tư vấn y khoa. Hãy tham khảo bác sĩ/dược sĩ trước khi dùng.
          </div>
        </div>
      )}

      {!isOpen && (
        <button className="chat-fab" onClick={handleOpen} aria-label="Mở chat">
          <span className="chat-fab-icon">💬</span>
          <span className="chat-fab-pulse" />
        </button>
      )}
    </div>
  );
}
