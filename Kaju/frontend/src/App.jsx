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

const DEFAULT_PROMPT = `You are Kaju, a friendly, intelligent, and helpful female voice assistant.
Guidelines:
- Always respond in a warm, polite, and natural conversational tone.
- Keep your answers concise, clear, and easy to understand when spoken aloud (usually 1-3 sentences unless asked for more).
- Avoid complex bullet lists or markdown symbols unless necessary, because your response is converted directly into speech.
- If asked who you are, introduce yourself as Kaju.`;

export function App() {
  // App Modes & Navigation
  const [mode, setMode] = useState('split'); // 'voice' or 'split'
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Assistant State
  const [status, setStatus] = useState('idle'); // 'idle' | 'listening' | 'thinking' | 'speaking'
  const [volume, setVolume] = useState(0);
  const [frequencyData, setFrequencyData] = useState(null);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [mongoConnected, setMongoConnected] = useState(true);

  // Settings & Configuration
  const [voices, setVoices] = useState([]);
  const [currentVoice, setCurrentVoice] = useState('en-US-AvaNeural');
  const [models, setModels] = useState([]);
  const [currentModel, setCurrentModel] = useState('openai/gpt-oss-120b');
  const [customPrompt, setCustomPrompt] = useState(DEFAULT_PROMPT);
  const [apiKey, setApiKey] = useState('');

  // Conversation & Session Management
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [messages, setMessages] = useState([]);

  // Audio Instances
  const recorderRef = useRef(new AudioRecorder());
  const audioPlayerRef = useRef(new Audio());
  const audioContextRef = useRef(null);

  // 1. Initial Load: Fetch status, voices, models, sessions
  useEffect(() => {
    async function init() {
      // Check backend health
      const health = await checkHealth();
      if (health.status === 'ok') {
        console.log('✅ Backend API connected:', health);
      }

      // Fetch voices & models
      const fetchedVoices = await getVoices();
      if (fetchedVoices.length > 0) setVoices(fetchedVoices);

      const fetchedModels = await getModels();
      if (fetchedModels.length > 0) setModels(fetchedModels);

      // Fetch saved sessions
      loadSessions();
    }
    init();
  }, []);

  const loadSessions = async () => {
    try {
      const list = await fetchSessions();
      setSessions(list);
      if (list.length > 0 && !currentSessionId) {
        handleSelectSession(list[0]._id);
      }
    } catch (err) {
      console.error('Error loading sessions:', err);
    }
  };

  const handleSelectSession = async (sessionId) => {
    try {
      setCurrentSessionId(sessionId);
      const session = await fetchSessionById(sessionId);
      if (session) {
        setMessages(session.messages || []);
      }
    } catch (err) {
      console.error('Failed to select session:', err);
    }
  };

  const handleNewSession = async () => {
    try {
      const newSession = await createNewSession({
        title: 'New Voice Chat',
        voice: currentVoice,
        model: currentModel
      });
      setSessions((prev) => [newSession, ...prev]);
      setCurrentSessionId(newSession._id);
      setMessages([]);
    } catch (err) {
      console.error('Failed to create new session:', err);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    try {
      await deleteSessionById(sessionId);
      setSessions((prev) => prev.filter((s) => s._id !== sessionId));
      if (currentSessionId === sessionId) {
        const remaining = sessions.filter((s) => s._id !== sessionId);
        if (remaining.length > 0) {
          handleSelectSession(remaining[0]._id);
        } else {
          setCurrentSessionId(null);
          setMessages([]);
        }
      }
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  };

  // 2. Play Audio with Speech Waveform Sync
  const playSpeechAudio = async (text, voice = currentVoice) => {
    setStatus('speaking');
    try {
      const { audioUrl } = await synthesizeSpeechAudio(text, voice);
      const player = audioPlayerRef.current;
      player.src = audioUrl;

      // Setup audio analyzer for speaking visuals
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }

      player.onplay = () => {
        setStatus('speaking');
      };

      player.onended = () => {
        setStatus('idle');
        setVolume(0);
        setFrequencyData(null);
      };

      player.onerror = () => {
        fallbackBrowserSpeech(text);
      };

      await player.play();
    } catch (err) {
      console.warn('Server TTS failed, falling back to Browser Speech Synthesis:', err.message);
      fallbackBrowserSpeech(text);
    }
  };

  const fallbackBrowserSpeech = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      const femaleVoice = voices.find((v) =>
        v.name.includes('Female') || v.name.includes('Google US English') || v.name.includes('Zira') || v.name.includes('Samantha')
      );
      if (femaleVoice) utterance.voice = femaleVoice;
      utterance.rate = 1.0;
      utterance.pitch = 1.05;

      utterance.onstart = () => setStatus('speaking');
      utterance.onend = () => {
        setStatus('idle');
        setVolume(0);
      };
      utterance.onerror = () => {
        setStatus('idle');
        setVolume(0);
      };

      window.speechSynthesis.speak(utterance);
    } else {
      setStatus('idle');
    }
  };

  // 3. Send Message to Assistant (Text or Transcribed Speech)
  const handleSendMessage = async (userText) => {
    if (!userText.trim()) return;

    // Ensure we have an active session
    let sessionId = currentSessionId;
    if (!sessionId) {
      const newSession = await createNewSession({
        title: userText.slice(0, 30),
        voice: currentVoice,
        model: currentModel
      });
      sessionId = newSession._id;
      setCurrentSessionId(sessionId);
      setSessions((prev) => [newSession, ...prev]);
    }

    const newMsg = { role: 'user', content: userText, timestamp: new Date() };
    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);
    setStatus('thinking');

    try {
      // Save user message to database
      appendMessageToSession(sessionId, newMsg).catch(console.error);

      // Call LLM Chat Completion
      const res = await sendChatMessage({
        message: userText,
        history: messages,
        model: currentModel,
        customSystemPrompt: customPrompt,
        apiKey: apiKey || undefined
      });

      const reply = res.assistantReply || "I'm here to help!";
      const assistantMsg = { role: 'assistant', content: reply, timestamp: new Date() };
      setMessages([...updatedMessages, assistantMsg]);

      // Save assistant reply to database
      appendMessageToSession(sessionId, assistantMsg).catch(console.error);

      // Speak reply if autoSpeak is enabled
      if (autoSpeak) {
        await playSpeechAudio(reply, currentVoice);
      } else {
        setStatus('idle');
      }

    } catch (err) {
      console.error('Error in conversation flow:', err);
      const errorMsg = {
        role: 'assistant',
        content: `Sorry, I ran into an error: ${err.message}`,
        timestamp: new Date()
      };
      setMessages([...updatedMessages, errorMsg]);
      setStatus('idle');
    }
  };

  // 4. Microphone Toggle / Recording Flow
  const handleToggleRecord = async () => {
    const recorder = recorderRef.current;

    if (recorder.isRecording) {
      // Stop recording
      setStatus('thinking');
      const { blob: audioBlob, liveTranscript: transcriptFromMic } = await recorder.stop();
      setVolume(0);
      setFrequencyData(null);
      setLiveTranscript('');

      let finalUserText = transcriptFromMic ? transcriptFromMic.trim() : '';

      // Fallback to Groq Whisper STT if live speech recognition was empty
      if (!finalUserText && audioBlob && audioBlob.size > 0) {
        try {
          const whisperText = await transcribeAudioBlob(audioBlob, apiKey || undefined);
          if (whisperText && whisperText.trim()) {
            finalUserText = whisperText.trim();
          }
        } catch (err) {
          console.error('Groq Whisper STT Error:', err);
        }
      }

      if (finalUserText) {
        await handleSendMessage(finalUserText);
      } else {
        console.warn('No speech detected');
        setStatus('idle');
      }
    } else {
      // Stop any current playing audio
      audioPlayerRef.current.pause();
      setLiveTranscript('');

      // Start recording
      try {
        await recorder.start({
          onVolumeChange: (vol, freq) => {
            setVolume(vol);
            setFrequencyData(freq);
          },
          onLiveTranscript: (text) => {
            setLiveTranscript(text);
          }
        });
        setStatus('listening');
      } catch (err) {
        console.error('Microphone error:', err);
        alert('Could not access microphone. Please allow microphone permissions in your browser.');
        setStatus('idle');
      }
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navigation */}
      <Navbar
        mode={mode}
        setMode={setMode}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        autoSpeak={autoSpeak}
        setAutoSpeak={setAutoSpeak}
        currentVoice={currentVoice}
        mongoConnected={mongoConnected}
      />

      {/* Sidebar Drawer */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={handleSelectSession}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        voices={voices}
        currentVoice={currentVoice}
        onSelectVoice={setCurrentVoice}
        models={models}
        currentModel={currentModel}
        onSelectModel={setCurrentModel}
        customPrompt={customPrompt}
        onSaveCustomPrompt={setCustomPrompt}
        apiKey={apiKey}
        onSaveApiKey={setApiKey}
      />

      {/* Main Content Area */}
      <main style={{
        flex: 1,
        display: 'flex',
        padding: '0 20px 20px',
        gap: '20px',
        maxWidth: '1440px',
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        {mode === 'voice' ? (
          /* Fullscreen Voice Mode */
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '65vh'
          }}>
            <VoiceOrb
              status={status}
              volume={volume}
              frequencyData={frequencyData}
              onOrbClick={handleToggleRecord}
              liveTranscript={liveTranscript}
            />

            <div style={{ marginTop: '30px' }}>
              <MicButton
                isRecording={status === 'listening'}
                isProcessing={status === 'thinking'}
                onToggleRecord={handleToggleRecord}
              />
            </div>

            <p style={{ marginTop: '20px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Press the orb or microphone button to speak with Kaju
            </p>
          </div>
        ) : (
          /* Split View: Voice Orb on Left, Chat on Right */
          <div style={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: 'minmax(320px, 420px) 1fr',
            gap: '20px',
            alignItems: 'stretch'
          }}>
            {/* Left Column: Voice Orb & Controls */}
            <div className="glass-panel" style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '30px 20px',
              position: 'relative'
            }}>
              <VoiceOrb
                status={status}
                volume={volume}
                frequencyData={frequencyData}
                onOrbClick={handleToggleRecord}
                liveTranscript={liveTranscript}
              />

              <div style={{ marginTop: '30px' }}>
                <MicButton
                  isRecording={status === 'listening'}
                  isProcessing={status === 'thinking'}
                  onToggleRecord={handleToggleRecord}
                />
              </div>

              <div style={{
                marginTop: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '0.78rem',
                color: 'var(--text-muted)',
                background: 'rgba(168, 85, 247, 0.08)',
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border-glass)'
              }}>
                <span>Voice: <strong style={{ color: '#e9d5ff' }}>{currentVoice.replace('Neural', '')}</strong></span>
                <span style={{ color: 'var(--border-glow)' }}>•</span>
                <span>Model: <strong style={{ color: '#d8b4fe' }}>{currentModel.split('/')[1] || currentModel}</strong></span>
              </div>
            </div>

            {/* Right Column: Chat Stream */}
            <div style={{ height: '100%' }}>
              <ChatDrawer
                messages={messages}
                isProcessing={status === 'thinking'}
                onSendMessage={handleSendMessage}
                onPlayAudio={(text) => playSpeechAudio(text, currentVoice)}
                onToggleRecord={handleToggleRecord}
                isRecording={status === 'listening'}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
