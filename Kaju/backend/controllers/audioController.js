const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');
const axios = require('axios');
const FormData = require('form-data');

const GROQ_STT_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';
const STT_MODEL = 'whisper-large-v3-turbo';

const VOICES = [
  { id: 'en-US-AvaNeural', name: 'Ava (US Natural - Default)', language: 'English (US)', gender: 'Female' },
  { id: 'en-IN-NeerjaNeural', name: 'Neerja (Indian English)', language: 'English (India)', gender: 'Female' },
  { id: 'en-US-EmmaNeural', name: 'Emma (US Warm & Friendly)', language: 'English (US)', gender: 'Female' },
  { id: 'en-US-JennyNeural', name: 'Jenny (US Professional)', language: 'English (US)', gender: 'Female' },
  { id: 'en-GB-SoniaNeural', name: 'Sonia (British English)', language: 'English (UK)', gender: 'Female' },
  { id: 'en-AU-NatashaNeural', name: 'Natasha (Australian English)', language: 'English (Australia)', gender: 'Female' }
];

/**
 * Transcribes audio file from browser recording using Groq Whisper
 */
exports.speechToText = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No audio file received.' });
  }

  const filePath = req.file.path;
  const apiKey = req.body.apiKey || process.env.GROQ_API_KEY;

  if (!apiKey) {
    cleanupFile(filePath);
    return res.status(500).json({ error: 'Groq API key not configured.' });
  }

  try {
    const rawMime = req.file.mimetype || 'audio/webm';
    const originalName = req.file.originalname || '';

    // Correct extension mapping so Whisper decodes properly
    let ext = 'webm';
    let cleanMime = 'audio/webm';

    if (rawMime.includes('wav') || originalName.endsWith('.wav')) {
      ext = 'wav';
      cleanMime = 'audio/wav';
    } else if (rawMime.includes('mp4') || rawMime.includes('m4a') || originalName.endsWith('.mp4') || originalName.endsWith('.m4a')) {
      ext = 'mp4';
      cleanMime = 'audio/mp4';
    } else if (rawMime.includes('ogg') || originalName.endsWith('.ogg')) {
      ext = 'ogg';
      cleanMime = 'audio/ogg';
    } else if (rawMime.includes('mp3') || originalName.endsWith('.mp3')) {
      ext = 'mp3';
      cleanMime = 'audio/mpeg';
    }

    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath), {
      filename: `recording.${ext}`,
      contentType: cleanMime
    });
    formData.append('model', STT_MODEL);
    formData.append('response_format', 'json');

    const response = await axios.post(GROQ_STT_URL, formData, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        ...formData.getHeaders()
      },
      timeout: 25000
    });

    const text = response.data.text || '';
    cleanupFile(filePath);

    return res.json({
      success: true,
      text: text.trim()
    });

  } catch (error) {
    cleanupFile(filePath);
    console.error('[STT Controller Error]:', error.response?.data || error.message);
    return res.status(500).json({
      error: error.response?.data?.error?.message || 'Transcription failed',
      details: error.response?.data || null
    });
  }
};

/**
 * Synthesizes text into high-quality neural speech using Edge-TTS
 */
exports.textToSpeech = async (req, res) => {
  const { text, voice = process.env.DEFAULT_VOICE || 'en-US-AvaNeural' } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Text is required for TTS synthesis.' });
  }

  const tempOutputPath = path.join(os.tmpdir(), `kaju_tts_${Date.now()}_${Math.random().toString(36).substring(7)}.mp3`);
  const bridgeScript = path.join(__dirname, '..', 'tts_bridge.py');

  try {
    // Run Python bridge with edge-tts
    await new Promise((resolve, reject) => {
      const pythonProcess = spawn('python', [
        bridgeScript,
        '--text', text,
        '--voice', voice,
        '--output', tempOutputPath
      ]);

      let stderr = '';
      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code === 0 && fs.existsSync(tempOutputPath)) {
          resolve();
        } else {
          reject(new Error(stderr || `Python TTS process exited with code ${code}`));
        }
      });

      pythonProcess.on('error', (err) => {
        reject(err);
      });
    });

    // Read generated MP3 and return
    const audioBuffer = fs.readFileSync(tempOutputPath);
    cleanupFile(tempOutputPath);

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length,
      'Cache-Control': 'no-cache'
    });

    return res.send(audioBuffer);

  } catch (error) {
    cleanupFile(tempOutputPath);
    console.error('[TTS Controller Error]:', error.message);
    return res.status(500).json({
      error: 'Speech synthesis failed',
      details: error.message
    });
  }
};

/**
 * Returns available neural female voices
 */
exports.getAvailableVoices = (req, res) => {
  return res.json({ voices: VOICES });
};

function cleanupFile(filePath) {
  if (filePath && fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (e) {
      // ignore cleanup errors
    }
  }
}
