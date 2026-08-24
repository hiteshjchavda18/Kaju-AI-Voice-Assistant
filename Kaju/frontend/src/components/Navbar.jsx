import React from 'react';
import {
  Sparkles,
  Settings,
  History,
  Volume2,
  VolumeX,
  Radio,
  Columns,
  Mic2
} from 'lucide-react';

export function Navbar({
  mode,
  setMode,
  onOpenSettings,
  onToggleSidebar,
  autoSpeak,
  setAutoSpeak,
  currentVoice = 'Ava',
  mongoConnected = false
}) {
  return (
    <header className="navbar-container" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 18px',
      margin: '12px 0 16px',
      borderRadius: '12px',
      background: 'rgba(20, 13, 36, 0.75)',
      backdropFilter: 'blur(16px)',
      border: '1px solid rgba(168, 85, 247, 0.2)',
      gap: '12px',
      flexWrap: 'wrap'
    }}>
      {/* Left: History + Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={onToggleSidebar}
          className="btn btn-secondary btn-icon"
          title="Chat History"
          style={{ width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <History size={18} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden'
          }}>
            <Sparkles size={20} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontSize: '1.2rem',
                fontWeight: '800',
                background: 'linear-gradient(135deg, #ffffff 0%, #e9d5ff 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Kaju AI
              </span>
              <span style={{
                fontSize: '0.68rem',
                padding: '2px 8px',
                background: 'rgba(168,85,247,0.2)',
                borderRadius: '10px',
                color: '#c084fc'
              }}>
                v2.0
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: '#94a3b8' }}>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#10b981',
                display: 'inline-block'
              }} />
              <span>Ready</span>
              {mongoConnected && <span>&bull; Cloud Synced</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Right: Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        {/* Mode toggle */}
        <div style={{
          display: 'flex',
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '3px',
          borderRadius: '8px',
          border: '1px solid rgba(168, 85, 247, 0.2)'
        }}>
          <button
            onClick={() => setMode('voice')}
            className={"btn " + (mode === 'voice' ? 'btn-primary' : 'btn-secondary')}
            style={{ padding: '6px 12px', fontSize: '0.8rem', height: '32px', border: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <Radio size={14} />
            <span>Voice</span>
          </button>
          <button
            onClick={() => setMode('split')}
            className={"btn " + (mode === 'split' ? 'btn-primary' : 'btn-secondary')}
            style={{ padding: '6px 12px', fontSize: '0.8rem', height: '32px', border: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <Columns size={14} />
            <span>Split</span>
          </button>
        </div>

        {/* Voice pill */}
        <button
          onClick={onOpenSettings}
          className="btn btn-secondary"
          style={{ padding: '6px 12px', fontSize: '0.8rem', height: '34px', display: 'flex', alignItems: 'center', gap: '6px' }}
          title="Change Voice in Settings"
        >
          <Mic2 size={14} color="#c084fc" />
          <span>Voice: <strong style={{ color: '#fff' }}>{currentVoice}</strong></span>
        </button>

        {/* Auto-speak toggle */}
        <button
          onClick={() => setAutoSpeak(!autoSpeak)}
          className="btn btn-secondary"
          style={{ width: '36px', height: '36px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          title={autoSpeak ? 'Voice Output: ON' : 'Voice Output: OFF'}
        >
          {autoSpeak ? <Volume2 size={17} color="#c084fc" /> : <VolumeX size={17} color="#94a3b8" />}
        </button>

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          className="btn btn-secondary btn-icon"
          title="Settings"
          style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Settings size={17} />
        </button>
      </div>
    </header>
  );
}
