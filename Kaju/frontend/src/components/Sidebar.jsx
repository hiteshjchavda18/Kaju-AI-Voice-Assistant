import React, { useState } from 'react';
import { Plus, MessageSquare, Trash2, X, Search, Sparkles } from 'lucide-react';

export function Sidebar({
  isOpen,
  onClose,
  sessions,
  currentSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSessions = sessions.filter((s) =>
    (s.title || 'New Chat').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(5, 3, 10, 0.75)',
            backdropFilter: 'blur(6px)',
            zIndex: 90
          }}
        />
      )}

      {/* Drawer Container */}
      <aside
        className="glass-panel"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: '310px',
          zIndex: 100,
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '15px 0 45px rgba(0, 0, 0, 0.6)',
          background: 'rgba(14, 9, 24, 0.96)',
          borderRight: '1px solid var(--border-glass)'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '18px 20px',
          borderBottom: '1px solid var(--border-glass)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="#c084fc" />
            <span style={{ fontWeight: '700', fontSize: '1.05rem', color: '#fcfaff' }}>Saved Chats</span>
          </div>
          <button onClick={onClose} className="btn btn-secondary btn-icon" style={{ width: '32px', height: '32px' }}>
            <X size={16} />
          </button>
        </div>

        {/* New Chat Button */}
        <div style={{ padding: '16px 20px 10px' }}>
          <button
            onClick={() => {
              onNewSession();
              onClose();
            }}
            className="btn btn-primary"
            style={{ width: '100%', gap: '8px', padding: '11px 18px' }}
          >
            <Plus size={18} />
            <span>New Conversation</span>
          </button>
        </div>

        {/* Search */}
        <div style={{ padding: '6px 20px 14px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-glass)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 12px'
          }}>
            <Search size={14} color="var(--text-dim)" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-main)',
                fontSize: '0.85rem',
                outline: 'none',
                width: '100%'
              }}
            />
          </div>
        </div>

        {/* Sessions List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 14px 20px' }}>
          {filteredSessions.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px 10px',
              color: 'var(--text-dim)',
              fontSize: '0.85rem'
            }}>
              No conversation history found.
            </div>
          ) : (
            filteredSessions.map((session) => {
              const isSelected = session._id === currentSessionId;
              return (
                <div
                  key={session._id}
                  onClick={() => {
                    onSelectSession(session._id);
                    onClose();
                  }}
                  className="glass-card"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '11px 14px',
                    marginBottom: '8px',
                    cursor: 'pointer',
                    borderRadius: 'var(--radius-sm)',
                    background: isSelected ? 'rgba(168, 85, 247, 0.22)' : 'rgba(255, 255, 255, 0.03)',
                    borderColor: isSelected ? 'rgba(168, 85, 247, 0.6)' : 'var(--border-glass)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <MessageSquare size={16} color={isSelected ? '#e9d5ff' : '#a855f7'} style={{ flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{
                        fontSize: '0.88rem',
                        fontWeight: isSelected ? '600' : '400',
                        color: isSelected ? '#fff' : '#cbd5e1',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {session.title || 'Untitled Chat'}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                        {new Date(session.updatedAt || session.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(session._id);
                    }}
                    className="btn-icon"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-dim)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '28px',
                      height: '28px',
                      flexShrink: 0
                    }}
                    title="Delete conversation"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </aside>
    </>
  );
}
