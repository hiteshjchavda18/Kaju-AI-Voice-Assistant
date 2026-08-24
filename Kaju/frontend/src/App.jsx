import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { VoiceOrb } from './components/VoiceOrb';
import { MicButton } from './components/MicButton';
import { ChatDrawer } from './components/ChatDrawer';
import { Sidebar } from './components/Sidebar';
import { SettingsModal } from './components/SettingsModal';
import { AudioRecorder } from './utils/audioRecorder';
import {
  checkHealth,
  getVoices,
  getModels,
  sendChatMessage,
  transcribeAudioBlob,
  synthesizeSpeechAudio,
  fetchSessions,
  fetchSessionById,
  createNewSession,
  appendMessageToSession,
  deleteSessionById
} from './utils/api';

const DEFAULT_PROMPT = `You are Kaju, a friendly, intelligent, and helpful voice assistant.
Guidelines:
- Always respond in a warm, polite, and natural conversational tone.
- Keep your answers concise, clear, and easy to understand when spoken aloud.
- Avoid complex bullet lists or markdown unless asked.
- If asked who you are, introduce yourself as Kaju.`;

export function App() {
  const [mode, setMode] = useState('split');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [status, setStatus] = useState('idle');
  const [volume, setVolume] = useState(0);
  const [frequencyData, setFrequencyData] = useState(null);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [mongoConnected, setMongoConnected] = useState(false);

  const [voices, setVoices] = useState([
    { id: 'en-US-AvaNeural', name: 'Ava (US Natural)', language: 'English (US)' },
    { id: 'en-IN-NeerjaNeural', name: 'Neerja (Indian English)', language: 'English (India)' },
    { id: 'en-US-EmmaNeural', name: 'Emma (Warm)', language: 'English (US)' },
    { id: 'en-US-JennyNeural', name: 'Jenny (US)', language: 'English (US)' },
    { id: 'en-GB-SoniaNeural', name: 'Sonia (UK)', language: 'English (UK)' },
    { id: 'en-AU-NatashaNeural', name: 'Natasha (Australian)', language: 'English (Australia)' },
    { id: 'hi-IN-SwaraNeural', name: 'Swara (Hindi)', language: 'Hindi (India)' }
  ]);
  const [currentVoice, setCurrentVoice] = useState(() => localStorage.getItem('kaju_voice') || 'en-US-AvaNeural');

  const [models, setModels] = useState([
    { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile' },
    { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant' },
    { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B 32k' }
  ]);
  const [currentModel, setCurrentModel] = useState(() => localStorage.getItem('kaju_model') || 'llama-3.3-70b-versatile');
  const [customPrompt, setCustomPrompt] = useState(() => localStorage.getItem('kaju_prompt') || DEFAULT_PROMPT);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('kaju_api_key') || '');

  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [messages, setMessages] = useState([{
    id: 'welcome',
    role: 'assistant',
    content: 'Hello! I am Kaju, your AI voice assistant. How can I help you today?',
    timestamp: new Date().toISOString()
  }]);

  const recorderRef = useRef(null);
  const audioPlayerRef = useRef(new Audio());

  useEffect(() => {
    async function init() {
      try {
        const health = await checkHealth();
        setMongoConnected(!!health.mongoConnected);
      } catch (e) {}

      try {
        const vData = await getVoices();
        if (vData?.voices?.length) setVoices(vData.voices);
      } catch (e) {}

      try {
        const mData = await getModels();
        if (mData?.models?.length) setModels(mData.models);
      } catch (e) {}

      try {
        const list = await fetchSessions();
        if (list?.length) {
          setSessions(list);
        }
      } catch (e) {}
    }
    init();
  }, []);

  // Voice fallback using browser speech synthesis
  const fallbackSpeak = (text, voiceId) => {
    if (!('speechSynthesis' in window)) { setStatus('idle'); return; }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const vList = window.speechSynthesis.getVoices();
    if (voiceId && voiceId.includes('en-IN')) {
      u.voice = vList.find(v => v.lang.includes('IN') || v.name.includes('India')) || null;
      u.pitch = 1.05;
    } else if (voiceId && voiceId.includes('en-GB')) {
      u.voice = vList.find(v => v.lang.includes('GB') || v.name.includes('UK')) || null;
    } else if (voiceId && voiceId.includes('hi-IN')) {
      u.voice = vList.find(v => v.lang.includes('hi') || v.name.includes('Hindi')) || null;
    } else {
      u.voice = vList.find(v => v.name.includes('Zira') || v.name.includes('Samantha') || (v.lang.startsWith('en') && v.name.includes('Female'))) || null;
    }
    u.onend = () => { setStatus('idle'); setVolume(0); };
    u.onerror = () => { setStatus('idle'); setVolume(0); };
    window.speechSynthesis.speak(u);
  };

  const playSpeechAudio = async (text, voiceOverride) => {
    const vId = voiceOverride || currentVoice;
    setStatus('speaking');
    try {
      const { audioUrl } = await synthesizeSpeechAudio(text, vId);
      const player = audioPlayerRef.current;
      player.src = audioUrl;
      player.onplay = () => setStatus('speaking');
      player.onended = () => { setStatus('idle'); setVolume(0); setFrequencyData(null); };
      player.onerror = () => fallbackSpeak(text, vId);
      await player.play();
    } catch (err) {
      fallbackSpeak(text, vId);
    }
  };

  const handleSendMessage = async (text) => {
    if (!text || !text.trim() || status === 'thinking') return;

    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toISOString()
    };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setStatus('thinking');

    try {
      // Create session if needed
      let sId = currentSessionId;
      if (!sId) {
        try {
          const newSess = await createNewSession({ title: text.trim().substring(0, 40), voice: currentVoice, model: currentModel });
          sId = newSess?._id || newSess?.id;
          if (sId) {
            setCurrentSessionId(sId);
            setSessions(prev => [newSess, ...prev]);
          }
        } catch (e) {}
      }

      // Save user message to session
      if (sId) {
        try { await appendMessageToSession(sId, 'user', text.trim()); } catch (e) {}
      }

      // Send to AI
      const res = await sendChatMessage({
        message: text.trim(),
        history: newHistory.slice(-8),
        model: currentModel,
        customSystemPrompt: customPrompt,
        apiKey: apiKey
      });

      const reply = res.assistantReply || 'I am sorry, I did not receive a response.';
      const assistantMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: reply,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, assistantMsg]);

      // Save assistant message to session
      if (sId) {
        try { await appendMessageToSession(sId, 'assistant', reply); } catch (e) {}
      }

      if (autoSpeak) {
        playSpeechAudio(reply);
      } else {
        setStatus('idle');
      }
    } catch (error) {
      const errMsg = error.message || 'Error communicating with assistant.';
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${errMsg}. Please check your API key in Settings.`,
        timestamp: new Date().toISOString()
      }]);
      setStatus('idle');
    }
  };

  const handleToggleRecord = async () => {
    if (status === 'speaking') {
      audioPlayerRef.current.pause();
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setStatus('idle');
      return;
    }

    if (status === 'listening') {
      setStatus('thinking');
      if (recorderRef.current) {
        try {
          const blob = await recorderRef.current.stop();
          recorderRef.current = null;
          if (liveTranscript.trim()) {
            const t = liveTranscript.trim();
            setLiveTranscript('');
            handleSendMessage(t);
          } else if (blob && blob.size > 2000) {
            const data = await transcribeAudioBlob(blob, apiKey);
            const t = data?.text || data;
            if (t && typeof t === 'string' && t.trim()) {
              handleSendMessage(t.trim());
            } else {
              setStatus('idle');
            }
          } else {
            setStatus('idle');
          }
        } catch (e) {
          setStatus('idle');
        }
      }
    } else {
      try {
        setLiveTranscript('');
        recorderRef.current = new AudioRecorder({
          onVolumeChange: v => setVolume(v),
          onFrequencyData: d => setFrequencyData(d),
          onTranscriptChange: t => setLiveTranscript(t)
        });
        await recorderRef.current.start();
        setStatus('listening');
      } catch (err) {
        setStatus('idle');
        alert('Could not access microphone. Please allow microphone permissions.');
      }
    }
  };

  const currentVoiceObj = voices.find(v => v.id === currentVoice) || voices[0];
  const voiceDisplayName = currentVoiceObj?.name?.split(' ')[0] || 'Ava';

  return (
    <div style={{ minHeight: '100vh', minHeight: '100dvh', display: 'flex', flexDirection: 'column', width: '100%', overflowX: 'hidden' }}>
      {/* Navbar */}
      <div style={{ width: '100%', maxWidth: '1300px', margin: '0 auto', padding: '0 16px' }}>
        <Navbar
          mode={mode}
          setMode={setMode}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          autoSpeak={autoSpeak}
          setAutoSpeak={setAutoSpeak}
          currentVoice={voiceDisplayName}
          mongoConnected={mongoConnected}
        />
      </div>

      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={async (id) => {
          try {
            setCurrentSessionId(id);
            const session = await fetchSessionById(id);
            if (session) setMessages(session.messages || []);
            setIsSidebarOpen(false);
          } catch (e) {}
        }}
        onNewSession={() => {
          setCurrentSessionId(null);
          setMessages([{ id: 'welcome', role: 'assistant', content: 'New session started. How can I help you?', timestamp: new Date().toISOString() }]);
          setIsSidebarOpen(false);
        }}
        onDeleteSession={async (id) => {
          try {
            await deleteSessionById(id);
            setSessions(prev => prev.filter(s => (s._id || s.id) !== id));
            if (currentSessionId === id) {
              setCurrentSessionId(null);
              setMessages([{ id: 'welcome', role: 'assistant', content: 'How can I help you?', timestamp: new Date().toISOString() }]);
            }
          } catch (e) {}
        }}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        voices={voices}
        currentVoice={currentVoice}
        onSelectVoice={(id) => { setCurrentVoice(id); localStorage.setItem('kaju_voice', id); }}
        onTestVoice={playSpeechAudio}
        models={models}
        currentModel={currentModel}
        onSelectModel={(id) => { setCurrentModel(id); localStorage.setItem('kaju_model', id); }}
        customPrompt={customPrompt}
        onSaveCustomPrompt={(p) => { setCustomPrompt(p); localStorage.setItem('kaju_prompt', p); }}
        apiKey={apiKey}
        onSaveApiKey={(k) => { setApiKey(k); localStorage.setItem('kaju_api_key', k); }}
      />

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '1300px', margin: '0 auto', padding: '0 16px 20px', boxSizing: 'border-box' }}>
        {mode === 'voice' ? (
          /* Voice-only Mode */
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 'calc(100vh - 160px)',
            minHeight: 'calc(100dvh - 160px)',
            textAlign: 'center',
            gap: '20px'
          }}>
            <VoiceOrb
              status={status}
              volume={volume}
              frequencyData={frequencyData}
              onOrbClick={handleToggleRecord}
              liveTranscript={liveTranscript}
            />
            <MicButton
              isRecording={status === 'listening'}
              isProcessing={status === 'thinking'}
              onToggleRecord={handleToggleRecord}
            />
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted, #94a3b8)', margin: 0 }}>
              {status === 'listening'
                ? 'Listening... Speak now'
                : status === 'thinking'
                ? 'Thinking...'
                : status === 'speaking'
                ? 'Speaking... Click to stop'
                : 'Click the orb or mic button to speak with Kaju'}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', maxWidth: '600px' }}>
              {['Tell me a fun science fact', 'What is artificial intelligence?', 'Give me a 3-day workout routine', 'Write a short inspirational poem'].map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(prompt)}
                  style={{
                    fontSize: '0.8rem',
                    padding: '7px 14px',
                    borderRadius: '20px',
                    background: 'rgba(168, 85, 247, 0.1)',
                    border: '1px solid rgba(168, 85, 247, 0.25)',
                    color: '#e9d5ff',
                    cursor: 'pointer'
                  }}
                >
                  ✨ {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Split Mode */
          <div className="app-main-layout" style={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: 'minmax(300px, 380px) 1fr',
            gap: '20px',
            alignItems: 'stretch',
            height: 'calc(100vh - 130px)',
            height: 'calc(100dvh - 130px)'
          }}>
            {/* Left: Voice Panel */}
            <div className="glass-panel" style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '28px 20px',
              gap: '20px',
              height: '100%'
            }}>
              <VoiceOrb
                status={status}
                volume={volume}
                frequencyData={frequencyData}
                onOrbClick={handleToggleRecord}
                liveTranscript={liveTranscript}
              />
              <MicButton
                isRecording={status === 'listening'}
                isProcessing={status === 'thinking'}
                onToggleRecord={handleToggleRecord}
              />
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted, #94a3b8)', textAlign: 'center', margin: 0 }}>
                {status === 'listening' ? 'Listening...' : status === 'thinking' ? 'Thinking...' : status === 'speaking' ? 'Speaking...' : 'Click mic to speak'}
              </p>
            </div>

            {/* Right: Chat Panel */}
            <div style={{ height: '100%', minHeight: 0 }}>
              <ChatDrawer
                messages={messages}
                onSendMessage={handleSendMessage}
                onPlayAudio={playSpeechAudio}
                isProcessing={status === 'thinking'}
              />
            </div>
          </div>
        )}
      </main>

      {/* Responsive CSS */}
      <style>{`
        @media (max-width: 768px) {
          .app-main-layout {
            grid-template-columns: 1fr !important;
            height: auto !important;
          }
          .app-main-layout .glass-panel {
            min-height: 300px;
          }
        }
      `}</style>
    </div>
  );
}
