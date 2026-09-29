const API_BASE = '/api';

/**
 * Safely parse JSON or text from fetch Response without throwing SyntaxError: Unexpected token
 */
async function safeParseResponse(res, fallbackMessage = 'Request failed') {
  const text = await res.text();
  let data = null;

  try {
    data = JSON.parse(text);
  } catch (e) {
    // Response was not JSON (e.g. Vercel plain text "A server error has occurred" or HTML)
    data = null;
  }

  if (!res.ok) {
    const message = data?.error?.message || data?.error || data?.message || (text && text.length < 200 ? text : null) || `Server Error (${res.status}): ${res.statusText || fallbackMessage}`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data !== null ? data : { raw: text };
}

/**
 * Direct browser fallback to Groq API if backend serverless function is unreachable
 */
async function directGroqChat({ message, history = [], model = 'openai/gpt-oss-120b', customSystemPrompt, apiKey }) {
  const GROQ_CHAT_URL = 'https://api.groq.com/openai/v1/chat/completions';
  const effectiveKey = apiKey || localStorage.getItem('kaju_api_key');

  if (!effectiveKey) {
    throw new Error('Groq API Key is not configured. Please enter your API key in Settings.');
  }

  const DEFAULT_SYSTEM_INSTRUCTION = `You are Kaju, a friendly, intelligent, and helpful female voice assistant.
Guidelines:
- Always respond in a warm, polite, and natural conversational tone.
- Keep your answers concise, clear, and easy to understand when spoken aloud (usually 1-3 sentences unless asked for more).
- Avoid complex bullet lists, weird markdown symbols, or code blocks unless explicitly asked, because your response is converted directly into speech.
- If asked who you are, introduce yourself as Kaju.`;

  const formattedMessages = [
    {
      role: 'system',
      content: customSystemPrompt || DEFAULT_SYSTEM_INSTRUCTION
    },
    ...history.map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content
    })),
    {
      role: 'user',
      content: message.trim()
    }
  ];

  const payload = {
    model: model || 'openai/gpt-oss-120b',
    messages: formattedMessages,
    temperature: 0.7,
    max_tokens: 350
  };

  const res = await fetch(GROQ_CHAT_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${effectiveKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const data = await safeParseResponse(res, 'Direct Groq chat completion failed');
  const reply = data.choices?.[0]?.message?.content?.trim() || '';

  return {
    success: true,
    userMessage: message.trim(),
    assistantReply: reply,
    modelUsed: model
  };
}

/**
 * Direct browser fallback for Whisper STT via Groq
 */
async function directGroqTranscribe(audioBlob, apiKey) {
  const GROQ_STT_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';
  const effectiveKey = apiKey || localStorage.getItem('kaju_api_key');

  if (!effectiveKey) {
    throw new Error('Groq API Key is required for speech recognition. Please enter it in Settings.');
  }

  const type = audioBlob.type || 'audio/webm';
  const ext = type.includes('wav') ? 'wav' : type.includes('mp4') ? 'mp4' : type.includes('ogg') ? 'ogg' : 'webm';

  const formData = new FormData();
  formData.append('file', audioBlob, `recording.${ext}`);
  formData.append('model', 'whisper-large-v3-turbo');
  formData.append('response_format', 'json');

  const res = await fetch(GROQ_STT_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${effectiveKey}`
    },
    body: formData
  });

  const data = await safeParseResponse(res, 'Groq Whisper STT failed');
  return {
    success: true,
    text: data.text || ''
  };
}

// Local storage session fallback helpers
const LOCAL_SESSIONS_KEY = 'kaju_local_chat_sessions';

function getClientLocalSessions() {
  try {
    const raw = localStorage.getItem(LOCAL_SESSIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveClientLocalSessions(sessions) {
  try {
    localStorage.setItem(LOCAL_SESSIONS_KEY, JSON.stringify(sessions));
  } catch (e) {}
}

export async function checkHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    return await safeParseResponse(res, 'Health check failed');
  } catch (err) {
    return { status: 'error', error: err.message };
  }
}

export async function getVoices() {
  try {
    const res = await fetch(`${API_BASE}/voices`);
    return await safeParseResponse(res, 'Failed to fetch voices');
  } catch (err) {
    return {
      voices: [
        { id: 'en-US-AvaNeural', name: 'Ava (US Natural - Default)', language: 'English (US)', gender: 'Female' },
        { id: 'en-IN-NeerjaNeural', name: 'Neerja (Indian English)', language: 'English (India)', gender: 'Female' },
        { id: 'en-US-EmmaNeural', name: 'Emma (US Warm & Friendly)', language: 'English (US)', gender: 'Female' },
        { id: 'en-US-JennyNeural', name: 'Jenny (US Professional)', language: 'English (US)', gender: 'Female' },
        { id: 'en-GB-SoniaNeural', name: 'Sonia (British English)', language: 'English (UK)', gender: 'Female' },
        { id: 'en-AU-NatashaNeural', name: 'Natasha (Australian English)', language: 'English (Australia)', gender: 'Female' },
        { id: 'hi-IN-SwaraNeural', name: 'Swara (Hindi)', language: 'Hindi (India)', gender: 'Female' }
      ]
    };
  }
}

export async function getModels() {
  try {
    const res = await fetch(`${API_BASE}/models`);
    return await safeParseResponse(res, 'Failed to fetch models');
  } catch (err) {
    return {
      models: [
        { id: 'openai/gpt-oss-120b', name: 'GPT OSS 120B (Default - High Quality)', description: 'Fast, articulate & natural reasoning' },
        { id: 'openai/gpt-oss-20b', name: 'GPT OSS 20B (Ultra Fast)', description: 'Low latency reasoning' },
        { id: 'qwen/qwen3.8-27b', name: 'Qwen 3.8 27B', description: 'Multilingual conversational model' },
        { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile', description: 'Meta powerful conversational model' },
        { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant', description: 'Ultra-fast low-latency responses' }
      ]
    };
  }
}

export async function sendChatMessage({ message, history, model, customSystemPrompt, apiKey }) {
  try {
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history, model, customSystemPrompt, apiKey })
    });
    return await safeParseResponse(res, 'Failed to send chat message');
  } catch (error) {
    console.warn('[Backend Chat Error, attempting direct fallback]:', error.message);
    const effectiveKey = apiKey || localStorage.getItem('kaju_api_key');
    if (effectiveKey) {
      return await directGroqChat({ message, history, model, customSystemPrompt, apiKey: effectiveKey });
    }
    throw error;
  }
}

export async function transcribeAudioBlob(audioBlob, apiKey) {
  try {
    const formData = new FormData();
    const type = audioBlob.type || 'audio/webm';
    const ext = type.includes('wav') ? 'wav' : type.includes('mp4') ? 'mp4' : type.includes('ogg') ? 'ogg' : 'webm';
    formData.append('audio', audioBlob, `recording.${ext}`);
    if (apiKey) formData.append('apiKey', apiKey);

    const res = await fetch(`${API_BASE}/speech-to-text`, {
      method: 'POST',
      body: formData
    });
    return await safeParseResponse(res, 'Transcription failed');
  } catch (error) {
    console.warn('[Backend STT Error, attempting direct fallback]:', error.message);
    const effectiveKey = apiKey || localStorage.getItem('kaju_api_key');
    if (effectiveKey) {
      return await directGroqTranscribe(audioBlob, effectiveKey);
    }
    throw error;
  }
}

export async function synthesizeSpeechAudio(text, voice) {
  const res = await fetch(`${API_BASE}/text-to-speech`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voice })
  });

  if (!res.ok) {
    const errorData = await safeParseResponse(res, 'Speech synthesis failed').catch(e => ({ error: e.message }));
    throw new Error(errorData.error || 'Failed to synthesize speech');
  }

  const blob = await res.blob();
  const audioUrl = URL.createObjectURL(blob);
  return { audioUrl, blob };
}

export async function fetchSessions() {
  try {
    const res = await fetch(`${API_BASE}/sessions`);
    const data = await safeParseResponse(res, 'Failed to fetch sessions');
    return data.sessions || [];
  } catch (err) {
    return getClientLocalSessions();
  }
}

export async function fetchSessionById(sessionId) {
  try {
    const res = await fetch(`${API_BASE}/sessions/${sessionId}`);
    const data = await safeParseResponse(res, 'Failed to get session');
    return data.session;
  } catch (err) {
    const local = getClientLocalSessions();
    return local.find(s => (s._id || s.id) === sessionId) || null;
  }
}

export async function createNewSession(data) {
  const payload = typeof data === 'string' ? { title: data } : data;
  try {
    const res = await fetch(`${API_BASE}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await safeParseResponse(res, 'Failed to create session');
    return json.session || json;
  } catch (err) {
    const sessions = getClientLocalSessions();
    const newSession = {
      _id: 'client_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      title: payload?.title || 'New Voice Chat',
      voice: payload?.voice || 'en-US-AvaNeural',
      model: payload?.model || 'openai/gpt-oss-120b',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    sessions.unshift(newSession);
    saveClientLocalSessions(sessions);
    return newSession;
  }
}

export async function appendMessageToSession(sessionId, role, content) {
  const messageData = typeof role === 'string'
    ? { role, content }
    : role;

  try {
    const res = await fetch(`${API_BASE}/sessions/${sessionId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messageData)
    });
    const json = await safeParseResponse(res, 'Failed to update session');
    return json.session || json;
  } catch (err) {
    const sessions = getClientLocalSessions();
    const idx = sessions.findIndex(s => (s._id || s.id) === sessionId);
    if (idx !== -1) {
      sessions[idx].messages = sessions[idx].messages || [];
      sessions[idx].messages.push({
        role: messageData.role,
        content: messageData.content,
        timestamp: new Date().toISOString()
      });
      sessions[idx].updatedAt = new Date().toISOString();
      saveClientLocalSessions(sessions);
      return sessions[idx];
    }
    return null;
  }
}

export async function deleteSessionById(sessionId) {
  try {
    const res = await fetch(`${API_BASE}/sessions/${sessionId}`, {
      method: 'DELETE'
    });
    return await safeParseResponse(res, 'Failed to delete session');
  } catch (err) {
    const sessions = getClientLocalSessions().filter(s => (s._id || s.id) !== sessionId);
    saveClientLocalSessions(sessions);
    return { success: true };
  }
}
