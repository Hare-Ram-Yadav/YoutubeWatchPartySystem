import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage, EmojiReaction } from '../types';
import { Send, Smile, MessageSquare } from 'lucide-react';

interface LiveChatProps {
  chatHistory: ChatMessage[];
  onSendChat: (text: string) => void;
  onSendReaction: (emoji: string) => void;
  reactions?: EmojiReaction[];
}

const EMOJIS = ['👍', '🔥', '🎉', '❤️', '👏', '🚀'];

export const LiveChat: React.FC<LiveChatProps> = ({
  chatHistory,
  onSendChat,
  onSendReaction,
}) => {
  const [inputText, setInputText] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendChat(inputText.trim());
    setInputText('');
  };

  return (
    <div style={{
      backgroundColor: '#FFFFFF',
      border: '1px solid #E2E8F0',
      borderRadius: '0.75rem',
      padding: '1rem',
      display: 'flex',
      flexDirection: 'column',
      height: '380px',
      justifyContent: 'space-between',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <MessageSquare size={16} color="#DC2626" />
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: '#0F172A' }}>
            Live Room Chat
          </h3>
        </div>
        <span style={{ fontSize: '0.7rem', color: '#64748B' }}>
          Real-time feed
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '0.5rem 0',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.6rem',
      }}>
        {chatHistory.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem', marginTop: '2rem' }}>
            No messages yet. Start the conversation!
          </div>
        ) : (
          chatHistory.map((msg) => (
            <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0F172A' }}>
                  {msg.username}
                </span>
                <span style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  color: msg.userRole === 'host' ? '#DC2626' : msg.userRole === 'moderator' ? '#2563EB' : '#64748B',
                  backgroundColor: msg.userRole === 'host' ? '#FEE2E2' : msg.userRole === 'moderator' ? '#DBEAFE' : '#F1F5F9',
                  padding: '0.1rem 0.4rem',
                  borderRadius: '9999px',
                }}>
                  {msg.userRole}
                </span>
                <span style={{ fontSize: '0.65rem', color: '#94A3B8', marginLeft: 'auto' }}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div style={{
                fontSize: '0.85rem',
                color: '#334155',
                backgroundColor: '#F8FAFC',
                padding: '0.4rem 0.65rem',
                borderRadius: '0.375rem',
                border: '1px solid #F1F5F9',
                wordBreak: 'break-word',
              }}>
                {msg.text}
              </div>
            </div>
          ))
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* Floating Emoji Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        padding: '0.4rem 0',
        borderTop: '1px solid #F1F5F9',
      }}>
        <Smile size={16} color="#64748B" />
        <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Reactions:</span>
        <div style={{ display: 'flex', gap: '0.35rem' }}>
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => onSendReaction(emoji)}
              style={{
                background: '#F1F5F9',
                border: '1px solid #E2E8F0',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontSize: '1rem',
                padding: '0.15rem 0.4rem',
                transition: 'transform 0.1s ease',
              }}
              onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(1.2)')}
              onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Message Input Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Write a message to room..."
          style={{
            flex: 1,
            padding: '0.45rem 0.75rem',
            borderRadius: '0.5rem',
            border: '1px solid #CBD5E1',
            fontSize: '0.85rem',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          className="btn-primary"
          style={{ padding: '0.45rem 0.75rem', borderRadius: '0.5rem' }}
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
};
