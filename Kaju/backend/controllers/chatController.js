const axios = require('axios');

const DEFAULT_SYSTEM_INSTRUCTION = `You are Kaju, a friendly, intelligent, and helpful female voice assistant.
Guidelines:
- Always respond in a warm, polite, and natural conversational tone.
- Keep your answers concise, clear, and easy to understand when spoken aloud (usually 1-3 sentences unless asked for more).
- Avoid complex bullet lists, weird markdown symbols, or code blocks unless explicitly asked, because your response is converted directly into speech.
- If asked who you are, introduce yourself as Kaju.`;

const GROQ_CHAT_URL = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * Handle sending a message to Groq LLM
 */
exports.handleChatMessage = async (req, res) => {
  try {
    const {
      message,
      history = [],
      model = process.env.DEFAULT_MODEL || 'openai/gpt-oss-120b',
      customSystemPrompt,
      apiKey = process.env.GROQ_API_KEY
    } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty.' });
    }

    if (!apiKey) {
      return res.status(500).json({ error: 'Groq API Key is not configured.' });
    }

    // Build context array with System Instruction + Past messages + New message
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
      model: model,
      messages: formattedMessages,
      temperature: 0.7,
      max_tokens: 350
    };

    const response = await axios.post(GROQ_CHAT_URL, payload, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 25000
    });

    const reply = response.data.choices?.[0]?.message?.content?.trim() || '';

    return res.json({
      success: true,
      userMessage: message.trim(),
      assistantReply: reply,
      modelUsed: model
    });

  } catch (error) {
    console.error('[Chat Controller Error]:', error.response?.data || error.message);
    const errorMsg = error.response?.data?.error?.message || error.message || 'Failed to generate response';
    return res.status(500).json({
      error: errorMsg,
      details: error.response?.data || null
    });
  }
};

/**
 * Return available models
 */
exports.getAvailableModels = (req, res) => {
  const models = [
    { id: 'openai/gpt-oss-120b', name: 'GPT OSS 120B (High Quality)', description: 'Fast, articulate & natural reasoning' },
    { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile', description: 'Meta latest powerful conversational model' },
    { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant', description: 'Ultra-fast low-latency responses' },
    { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B 32k', description: 'High context mixture of experts' }
  ];
  return res.json({ models });
};
