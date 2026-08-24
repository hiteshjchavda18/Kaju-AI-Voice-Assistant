import React, { useState } from 'react';
import { X, Volume2, Key, Cpu, Sparkles, Check, Play, Loader2 } from 'lucide-react';
import { synthesizeSpeechAudio } from '../utils/api';

export function SettingsModal({
  isOpen,
  onClose,
  voices,
  currentVoice,
  onSelectVoice,
  models,
  currentModel,
  onSelectModel,
  customPrompt,
  onSaveCustomPrompt,
  apiKey,
  onSaveApiKey
}) {
  const [promptInput, setPromptInput] = useState(customPrompt);
  const [keyInput, setKeyInput] = useState(apiKey || '');
  const [testingVoiceId, setTestingVoiceId] = useState(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleTestVoice = async (voiceId) => {
    try {
      setTestingVoiceId(voiceId);
      const sampleText = "Hello! I am Kaju. This is how my voice sounds.";
      const { audioUrl } = await synthesizeSpeechAudio(sampleText, voiceId);
      const audio = new Audio(audioUrl);
      audio.onended = () => setTestingVoiceId(null);
      audio.onerror = () => setTestingVoiceId(null);
      await audio.play();
    } catch (err) {
      console.error('Error testing voice sample:', err);
      setTestingVoiceId(null);
    }
  };

  const handleSave = () => {
    onSaveCustomPrompt(promptInput);
    onSaveApiKey(keyInput.trim());
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(5, 3, 10, 0.8)',
      backdropFilter: 'blur(10px)',
      zIndex: 120,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '560px',
        maxHeight: '90vh',
        overflowY: 'auto',
        background: 'rgba(16, 10, 28, 0.96)',
        border: '1px solid var(--border-glow)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--glow-purple-lg)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-glass)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={20} color="#c084fc" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#fcfaff' }}>Kaju 🥜 Settings & Voices</h2>
          </div>
          <button onClick={onClose} className="btn btn-secondary btn-icon" style={{ width: '34px', height: '34px' }}>
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '22px' }}>

          {/* 1. Voice Selection */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: '600', marginBottom: '10px', color: '#e9d5ff' }}>
              <Volume2 size={16} color="#c084fc" />
              <span>Neural Female Voice</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '8px' }}>
              {voices.map((v) => {
                const isSelected = v.id === currentVoice;
                return (
                  <div
                    key={v.id}
                    onClick={() => onSelectVoice(v.id)}
                    className="glass-card"
                    style={{
                      padding: '10px 14px',
                      cursor: 'pointer',
                      borderRadius: 'var(--radius-sm)',
                      background: isSelected ? 'rgba(168, 85, 247, 0.25)' : 'rgba(255, 255, 255, 0.03)',
                      borderColor: isSelected ? 'rgba(168, 85, 247, 0.75)' : 'var(--border-glass)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: isSelected ? '600' : '400', color: isSelected ? '#fff' : '#e2e8f0' }}>
                        {v.name}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                        {v.language}
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTestVoice(v.id);
                      }}
                      className="btn btn-secondary"
                      style={{ padding: '4px 8px', fontSize: '0.7rem', height: '26px' }}
                      title="Preview voice"
                    >
                      {testingVoiceId === v.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Play size={10} fill="#c084fc" color="#c084fc" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Model Selection */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px', color: '#e9d5ff' }}>
              <Cpu size={16} color="#c084fc" />
              <span>Intelligence Engine (Groq LLM)</span>
            </label>
            <select
              value={currentModel}
              onChange={(e) => onSelectModel(e.target.value)}
              style={{
                width: '100%',
                padding: '11px 16px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(26, 17, 44, 0.9)',
                border: '1px solid var(--border-glass)',
                color: '#fff',
                fontSize: '0.9rem',
                outline: 'none',
                fontFamily: 'var(--font-sans)'
              }}
            >
              {models.map((m) => (
                <option key={m.id} value={m.id} style={{ background: '#120b20', color: '#fff' }}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* 3. API Key Override */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px', color: '#e9d5ff' }}>
              <Key size={16} color="#c084fc" />
              <span>Groq API Key (Optional)</span>
            </label>
            <input
              type="password"
              placeholder="Default key active"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              style={{
                width: '100%',
                padding: '11px 16px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-glass)',
                color: '#fff',
                fontSize: '0.85rem',
                outline: 'none',
                fontFamily: 'var(--font-mono)'
              }}
            />
          </div>

          {/* 4. System Prompt */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px', color: '#e9d5ff' }}>
              <Sparkles size={16} color="#c084fc" />
              <span>System Persona Instruction</span>
            </label>
            <textarea
              rows={4}
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-glass)',
                color: '#fff',
                fontSize: '0.82rem',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'var(--font-sans)',
                lineHeight: '1.4'
              }}
            />
          </div>

        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--border-glass)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '12px',
          background: 'rgba(10, 6, 18, 0.5)'
        }}>
          <button onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button onClick={handleSave} className="btn btn-primary" style={{ minWidth: '110px' }}>
            {savedSuccess ? (
              <>
                <Check size={16} />
                <span>Saved</span>
              </>
            ) : (
              <span>Save Changes</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
