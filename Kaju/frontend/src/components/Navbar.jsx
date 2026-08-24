import React from 'react';
import { Mic, MessageSquare, Settings, Volume2, VolumeX, Menu } from 'lucide-react';
import { CashewMoonIcon } from './CashewMoonIcon';

export function Navbar({
  mode,
  setMode,
  onOpenSettings,
  onToggleSidebar,
  autoSpeak,
  setAutoSpeak,
  currentVoice,
  mongoConnected
}) {
  return (
    <header className="navbar-container glass-panel" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 24px',
      margin: '16px 20px 20px',
      zIndex: 50,
      borderRadius: 'var(--radius-md)',
      boxShadow: '0 4px 30px rgba(0, 0, 0, 0.4)'
    }}>
      {/* Left: Branding & Drawer Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <button
          onClick={onToggleSidebar}
          className="btn btn-secondary btn-icon"
          title="Past Conversations"
          style={{ width: '38px', height: '38px' }}
        >
          <Menu size={18} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #c084fc 0%, #7e22ce 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(168, 85, 247, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.25)'
          }}>
            <CashewMoonIcon size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontWeight: '800',
                fontSize: '1.25rem',
                letterSpacing: '-0.02em',
                background: 'linear-gradient(135deg, #ffffff 0%, #e9d5ff 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                KAJU
                <CashewMoonIcon size={24} />
              </span>
              <span style={{
                fontSize: '0.68rem',
                fontWeight: '600',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(168, 85, 247, 0.18)',
                color: '#d8b4fe',
                border: '1px solid rgba(168, 85, 247, 0.35)',
                letterSpacing: '0.04em'
              }}>
                VOICE AI
              </span>
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Intelligent Voice Assistant
            </p>
          </div>
        </div>
      </div>

      {/* Center: Mode Tabs (Voice Orb vs Chat View) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        background: 'rgba(15, 10, 26, 0.65)',
        padding: '4px',
        borderRadius: 'var(--radius-full)',
        border: '1px solid var(--border-glass)'
      }}>
        <button
          onClick={() => setMode('voice')}
          className={`btn ${mode === 'voice' ? 'btn-primary' : 'btn-secondary'}`}
          style={{
            padding: '7px 18px',
            fontSize: '0.85rem',
            borderRadius: 'var(--radius-full)',
            border: mode === 'voice' ? '1px solid rgba(233, 213, 255, 0.25)' : 'none',
            background: mode !== 'voice' ? 'transparent' : undefined
          }}
        >
          <Mic size={15} />
          <span>Voice Orb</span>
        </button>
        <button
          onClick={() => setMode('split')}
          className={`btn ${mode === 'split' ? 'btn-primary' : 'btn-secondary'}`}
          style={{
            padding: '7px 18px',
            fontSize: '0.85rem',
            borderRadius: 'var(--radius-full)',
            border: mode === 'split' ? '1px solid rgba(233, 213, 255, 0.25)' : 'none',
            background: mode !== 'split' ? 'transparent' : undefined
          }}
        >
          <MessageSquare size={15} />
          <span>Chat View</span>
        </button>
      </div>

      {/* Right: Auto-Speech Toggle, Status Dot, Settings */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Voice Speech Toggle */}
        <button
          onClick={() => setAutoSpeak(!autoSpeak)}
          className="btn btn-secondary"
          style={{
            padding: '7px 14px',
            fontSize: '0.82rem',
            background: autoSpeak ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255, 255, 255, 0.04)',
            border: `1px solid ${autoSpeak ? 'rgba(168, 85, 247, 0.45)' : 'var(--border-glass)'}`,
            color: autoSpeak ? '#e9d5ff' : 'var(--text-dim)',
            borderRadius: 'var(--radius-full)'
          }}
          title={autoSpeak ? 'Voice response enabled' : 'Voice response muted'}
        >
          {autoSpeak ? <Volume2 size={15} color="#c084fc" /> : <VolumeX size={15} />}
          <span>{autoSpeak ? 'Voice Active' : 'Muted'}</span>
        </button>

        {/* Status Indicator */}
        <div className="status-pill" title="Assistant Status" style={{ padding: '6px 12px' }}>
          <span className="status-dot active"></span>
          <span style={{ color: '#d8b4fe' }}>Connected</span>
        </div>

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          className="btn btn-secondary btn-icon"
          title="Settings & Voices"
          style={{ width: '38px', height: '38px' }}
        >
          <Settings size={17} />
        </button>
      </div>
    </header>
  );
}
