import React, { useState } from 'react';
import { X, Volume2, Sparkles, Key, Cpu, Play, CheckCircle2, Loader2 } from 'lucide-react';

export function SettingsModal({
  isOpen,
  onClose,
  voices = [],
  currentVoice,
  onSelectVoice,
  onTestVoice,
  models = [],
  currentModel,
  onSelectModel,
  customPrompt,
  onSaveCustomPrompt,
  apiKey,
  onSaveApiKey
}) {
  const [promptInput, setPromptInput] = useState(customPrompt || '');
  const [keyInput, setKeyInput] = useState(apiKey || '');
  const [testingVoiceId, setTestingVoiceId] = useState(null);

  if (!isOpen) return null;

  const handleSave = () => {
    if (onSaveCustomPrompt) onSaveCustomPrompt(promptInput);
    if (onSaveApiKey) onSaveApiKey(keyInput);
    onClose();
  };

  const handleTestVoice = (voiceId) => {
    setTestingVoiceId(voiceId);
    if (onSelectVoice) onSelectVoice(voiceId);
    if (onTestVoice) onTestVoice('Hello! I am Kaju. How can I help you today?', voiceId);
    setTimeout(() => setTestingVoiceId(null), 2000);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(5, 3, 10, 0.85)',
      backdropFilter: 'blur(12px)',
      zIndex: 120,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '580px',
        maxHeight: '92vh',
        overflowY: 'auto',
        background: 'rgba(16, 10, 28, 0.98)',
        border: '1px solid rgba(168, 85, 247, 0.3)',
        borderRadius: '16px',
        boxShadow: '0 0 60px rgba(168, 85, 247, 0.25)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={20} color="#c084fc" />
            <h2 style={{ fontSize: '1.18rem', fontWeight: '700', color: '#fcfaff', margin: 0 }}>
              Settings &amp; Voice Selector
            </h2>
          </div>
          <button
            onClick={onClose}
            className="btn btn-secondary"
            style={{ width: '34px', height: '34px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Voice Selection */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.92rem', fontWeight: '600', color: '#e9d5ff' }}>
                <Volume2 size={16} color="#c084fc" />
                <span>Select Assistant Voice</span>
              </label>
              <span style={{ fontSize: '0.75rem', color: '#c084fc' }}>Click to preview &amp; select</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px' }}>
              {voices.map((v) => {
                const isSelected = v.id === currentVoice;
                const isTesting = testingVoiceId === v.id;
                return (
                  <div
                    key={v.id}
                    onClick={() => handleTestVoice(v.id)}
                    style={{
                      padding: '12px 14px',
                      cursor: 'pointer',
                      borderRadius: '10px',
                      background: isSelected ? 'rgba(168, 85, 247, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                      border: `1px solid ${isSelected ? '#a855f7' : 'rgba(255,255,255,0.1)'}`,
                      boxShadow: isSelected ? '0 0 16px rgba(168, 85, 247, 0.35)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: isSelected ? '#a855f7' : 'rgba(255,255,255,0.08)',
                        flexShrink: 0
                      }}>
                        {isSelected
                          ? <CheckCircle2 size={16} color="#fff" />
                          : <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(255,255,255,0.3)' }} />
                        }
                      </div>
                      <div>
                        <div style={{ fontSize: '0.88rem', fontWeight: isSelected ? '600' : '500', color: isSelected ? '#fff' : '#e2e8f0' }}>
                          {v.name}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: isSelected ? '#e9d5ff' : '#94a3b8' }}>
                          {v.language}
                        </div>
                      </div>
                    </div>
                    <div style={{
                      width: '30px',
                      height: '30px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                      background: 'rgba(168,85,247,0.15)',
                      flexShrink: 0
                    }}>
                      {isTesting
                        ? <Loader2 size={14} color="#c084fc" style={{ animation: 'spin 1s linear infinite' }} />
                        : <Play size={13} color="#c084fc" />
                      }
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Model Selection */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.92rem', fontWeight: '600', color: '#e9d5ff', marginBottom: '10px' }}>
              <Cpu size={16} color="#c084fc" />
              <span>AI Model</span>
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {models.map((m) => (
                <div
                  key={m.id}
                  onClick={() => onSelectModel && onSelectModel(m.id)}
                  style={{
                    padding: '10px 14px',
                    cursor: 'pointer',
                    borderRadius: '10px',
                    background: currentModel === m.id ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${currentModel === m.id ? '#a855f7' : 'rgba(255,255,255,0.1)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span style={{ fontSize: '0.88rem', fontWeight: '500', color: currentModel === m.id ? '#fff' : '#e2e8f0' }}>
                    {m.name}
                  </span>
                  {currentModel === m.id && <CheckCircle2 size={16} color="#a855f7" />}
                </div>
              ))}
            </div>
          </div>

          {/* API Key */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.92rem', fontWeight: '600', color: '#e9d5ff', marginBottom: '10px' }}>
              <Key size={16} color="#c084fc" />
              <span>Groq API Key</span>
            </label>
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="gsk_..."
              className="input-field"
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          {/* System Prompt */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.92rem', fontWeight: '600', color: '#e9d5ff', marginBottom: '10px' }}>
              <Sparkles size={16} color="#c084fc" />
              <span>System Prompt</span>
            </label>
            <textarea
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              rows={4}
              className="input-field"
              style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical', minHeight: '80px' }}
              placeholder="You are Kaju, a helpful AI voice assistant..."
            />
          </div>

          {/* Footer Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button onClick={onClose} className="btn btn-secondary" style={{ padding: '8px 20px' }}>
              Cancel
            </button>
            <button onClick={handleSave} className="btn btn-primary" style={{ padding: '8px 24px' }}>
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
