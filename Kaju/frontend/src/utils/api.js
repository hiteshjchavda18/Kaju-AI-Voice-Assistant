const API_BASE = '/api';

export async function checkHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    return await res.json();
  } catch (err) {
    return { status: 'error', error: err.message };
  }
}

export async function getVoices() {
  try {
    const res = await fetch(`${API_BASE}/voices`);
    const data = await res.json();
    return data; // returns { voices: [...] }
  } catch (err) {
    console.error('Failed to get voices:', err);
    return { voices: [] };
  }
}

export async function getModels() {
  try {
    const res = await fetch(`${API_BASE}/models`);
    const data = await res.json();
    return data; // returns { models: [...] }
  } catch (err) {
    console.error('Failed to get models:', err);
    return { models: [] };
  }
}

export async function sendChatMessage({ message, history, model, customSystemPrompt, apiKey }) {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history, model, customSystemPrompt, apiKey })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to send chat message');
  return data;
}

export async function transcribeAudioBlob(audioBlob, apiKey) {
  const formData = new FormData();
  const type = audioBlob.type || 'audio/webm';
  const ext = type.includes('wav') ? 'wav' : type.includes('mp4') ? 'mp4' : type.includes('ogg') ? 'ogg' : 'webm';
  formData.append('audio', audioBlob, `recording.${ext}`);
  if (apiKey) formData.append('apiKey', apiKey);

  const res = await fetch(`${API_BASE}/speech-to-text`, {
    method: 'POST',
    body: formData
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Transcription failed');
  return data;
}

export async function synthesizeSpeechAudio(text, voice) {
  const res = await fetch(`${API_BASE}/text-to-speech`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voice })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to synthesize speech');
  }

  const blob = await res.blob();
  const audioUrl = URL.createObjectURL(blob);
  return { audioUrl, blob };
}

export async function fetchSessions() {
  try {
    const res = await fetch(`${API_BASE}/sessions`);
    const data = await res.json();
    return data.sessions || [];
  } catch (err) {
    console.error('Failed to fetch sessions:', err);
    return [];
  }
}

export async function fetchSessionById(sessionId) {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to get session');
  return data.session;
}

export async function createNewSession(data) {
  const res = await fetch(`${API_BASE}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(typeof data === 'string' ? { title: data } : data)
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to create session');
  return json.session || json;
}

export async function appendMessageToSession(sessionId, role, content) {
  // Support both (sessionId, role, content) and (sessionId, messageData)
  const messageData = typeof role === 'string'
    ? { role, content }
    : role;

  const res = await fetch(`${API_BASE}/sessions/${sessionId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(messageData)
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to update session');
  return json.session || json;
}

export async function deleteSessionById(sessionId) {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}`, {
    method: 'DELETE'
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to delete session');
  return json;
}
