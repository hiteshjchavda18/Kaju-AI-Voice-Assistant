const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  audioData: {
    type: String, // Optional base64 or URL
    default: null
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const ConversationSchema = new mongoose.Schema({
  title: {
    type: String,
    default: 'New Chat'
  },
  voice: {
    type: String,
    default: 'en-US-AvaNeural'
  },
  model: {
    type: String,
    default: 'openai/gpt-oss-120b'
  },
  messages: [MessageSchema]
}, {
  timestamps: true
});

module.exports = mongoose.model('Conversation', ConversationSchema);
