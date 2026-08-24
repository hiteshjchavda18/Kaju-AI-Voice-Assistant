import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Volume2, Copy, Check, Sparkles, Loader2 } from 'lucide-react';

const SUGGESTIONS = [
  'Who are you and what can you do?',
  'Explain Artificial Intelligence in two simple sentences',
  'Give me a creative daily productivity tip',
  'What are some interesting facts about space?'
];

export function ChatDrawer({
  messages,
  isProcessing,
  onSendMessage,
  onPlayAudio,
  onToggleRecord,
  isRecording
}) {
  const [inputText, setInputText] = useState('');
  const [copiedIndex, setCopiedIndex] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim() || isProcessing) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="glass-panel" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      maxHeight: 'calc(100vh - 120px)',
      overflow: 'hidden',
      position: 'relative',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 20px',
        borderBottom: '1px solid var(--border-glass)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(15, 10, 26, 0.5)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={16} color="#c084fc" />
          <span style={{ fontWeight: '600', fontSize: '0.95rem', color: '#f3e8ff' }}>Conversation History</span>
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', background: 'rgba(168, 85, 247, 0.1)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
          {messages.length} messages
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {messages.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: 'var(--text-dim)',
            textAlign: 'center',
            padding: '20px'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(168, 85, 247, 0.12)',
              border: '1px solid rgba(168, 85, 247, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.6rem',
              marginBottom: '14px',
              boxShadow: '0 0 25px rgba(168, 85, 247, 0.2)'
            }}>
              ✨
            </div>
            <h3 style={{ fontSize: '1.15rem', color: '#fcfaff', fontWeight: '600', marginBottom: '6px' }}>
              How can Kaju 🥜 assist you today?
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '320px', marginBottom: '24px' }}>
              Use your voice or type your inquiry below.
            </p>

            {/* Quick Starter Suggestions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', maxWidth: '360px' }}>
              {SUGGESTIONS.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => onSendMessage(item)}
                  className="glass-card"
                  style={{
                    padding: '11px 16px',
                    fontSize: '0.84rem',
                    textAlign: 'left',
                    color: '#e9d5ff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderRadius: 'var(--radius-sm)'
                  }}
                >
                  <span>{item}</span>
                  <span style={{ color: 'var(--purple-400)', fontSize: '0.95rem' }}>→</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className={`chat-message ${msg.role}`}>
              <div className={`avatar-badge ${msg.role}`}>
                {msg.role === 'assistant' ? '🎙️' : '👤'}
              </div>

              <div className="message-bubble">
                <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {msg.content}
                </div>

                {/* Message Actions */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginTop: '8px',
                  paddingTop: '6px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                  fontSize: '0.72rem',
                  color: 'var(--text-muted)'
                }}>
                  <span>{new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>

                  {msg.role === 'assistant' && (
                    <button
                      onClick={() => onPlayAudio(msg.content)}
                      className="btn btn-secondary"
                      style={{
                        padding: '2px 8px',
                        fontSize: '0.72rem',
                        height: '22px',
                        borderRadius: 'var(--radius-full)'
                      }}
                      title="Speak / Replay this response"
                    >
                      <Volume2 size={12} color="#c084fc" />
                      <span>Replay</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleCopy(msg.content, idx)}
                    className="btn btn-secondary"
                    style={{
                      padding: '2px 8px',
                      fontSize: '0.72rem',
                      height: '22px',
                      borderRadius: 'var(--radius-full)'
                    }}
                    title="Copy message"
                  >
                    {copiedIndex === idx ? <Check size={12} color="#a855f7" /> : <Copy size={12} />}
                    <span>{copiedIndex === idx ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Processing / Thinking State */}
        {isProcessing && (
          <div className="chat-message assistant">
            <div className="avatar-badge assistant">🎙️</div>
            <div className="message-bubble" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Loader2 size={16} className="animate-spin" color="#a855f7" />
              <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>Kaju is preparing response...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <form onSubmit={handleSubmit} style={{
        padding: '14px 18px',
        borderTop: '1px solid var(--border-glass)',
        background: 'rgba(15, 10, 26, 0.65)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <button
          type="button"
          onClick={onToggleRecord}
          className={`btn ${isRecording ? 'btn-primary' : 'btn-secondary'} btn-icon`}
          style={{
            width: '42px',
            height: '42px',
            background: isRecording ? '#f43f5e' : undefined
          }}
          title={isRecording ? 'Stop Recording' : 'Voice Input'}
        >
          <Mic size={18} />
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask Kaju anything, or speak into microphone..."
          disabled={isProcessing}
          style={{
            flex: 1,
            padding: '12px 18px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-glass)',
            background: 'rgba(255, 255, 255, 0.04)',
            color: 'var(--text-main)',
            fontSize: '0.92rem',
            outline: 'none',
            fontFamily: 'var(--font-sans)',
            transition: 'border-color 0.2s ease'
          }}
          onFocus={(e) => e.target.style.borderColor = 'var(--purple-400)'}
          onBlur={(e) => e.target.style.borderColor = 'var(--border-glass)'}
        />

        <button
          type="submit"
          disabled={!inputText.trim() || isProcessing}
          className="btn btn-primary"
          style={{
            padding: '11px 18px',
            opacity: !inputText.trim() ? 0.6 : 1,
            borderRadius: 'var(--radius-sm)'
          }}
        >
          <Send size={16} />
          <span>Send</span>
        </button>
      </form>
    </div>
  );
}
