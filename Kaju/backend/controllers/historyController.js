const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');

// Local fallback file in case MongoDB is not running locally
const FALLBACK_FILE = path.join(__dirname, '..', 'local_sessions.json');

function isMongoConnected() {
  return mongoose.connection.readyState === 1;
}

function getLocalSessions() {
  try {
    if (fs.existsSync(FALLBACK_FILE)) {
      const data = fs.readFileSync(FALLBACK_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error reading local sessions file:', e);
  }
  return [];
}

function saveLocalSessions(sessions) {
  try {
    fs.writeFileSync(FALLBACK_FILE, JSON.stringify(sessions, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving local sessions file:', e);
  }
}

/**
 * Get all conversation sessions (titles, IDs, timestamps)
 */
exports.getSessions = async (req, res) => {
  try {
    if (isMongoConnected()) {
      const sessions = await Conversation.find({}, '_id title voice model createdAt updatedAt')
        .sort({ updatedAt: -1 });
      return res.json({ sessions, source: 'mongodb' });
    } else {
      const sessions = getLocalSessions()
        .map(s => ({
          _id: s._id,
          title: s.title,
          voice: s.voice,
          model: s.model,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
          messageCount: s.messages?.length || 0
        }))
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      return res.json({ sessions, source: 'local_storage' });
    }
  } catch (error) {
    console.error('[Get Sessions Error]:', error);
    return res.status(500).json({ error: 'Failed to retrieve sessions' });
  }
};

/**
 * Get single session by ID with full message list
 */
exports.getSessionById = async (req, res) => {
  const { id } = req.params;
  try {
    if (isMongoConnected()) {
      const session = await Conversation.findById(id);
      if (!session) return res.status(404).json({ error: 'Session not found' });
      return res.json({ session });
    } else {
      const sessions = getLocalSessions();
      const session = sessions.find(s => s._id === id);
      if (!session) return res.status(404).json({ error: 'Session not found' });
      return res.json({ session });
    }
  } catch (error) {
    console.error('[Get Session By Id Error]:', error);
    return res.status(500).json({ error: 'Failed to retrieve session' });
  }
};

/**
 * Create a new conversation session
 */
exports.createSession = async (req, res) => {
  const { title = 'New Voice Chat', voice = 'en-US-AvaNeural', model = 'openai/gpt-oss-120b', initialMessage } = req.body;
  try {
    const messages = [];
    if (initialMessage) {
      messages.push({
        role: initialMessage.role || 'user',
        content: initialMessage.content,
        timestamp: new Date()
      });
    }

    if (isMongoConnected()) {
      const session = await Conversation.create({
        title: initialMessage ? initialMessage.content.slice(0, 30) + '...' : title,
        voice,
        model,
        messages
      });
      return res.status(201).json({ session, source: 'mongodb' });
    } else {
      const sessions = getLocalSessions();
      const newSession = {
        _id: 'local_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
        title: initialMessage ? initialMessage.content.slice(0, 30) + '...' : title,
        voice,
        model,
        messages,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      sessions.unshift(newSession);
      saveLocalSessions(sessions);
      return res.status(201).json({ session: newSession, source: 'local_storage' });
    }
  } catch (error) {
    console.error('[Create Session Error]:', error);
    return res.status(500).json({ error: 'Failed to create session' });
  }
};

/**
 * Append message to session
 */
exports.addMessageToSession = async (req, res) => {
  const { id } = req.params;
  const { role, content, audioData } = req.body;

  if (!role || !content) {
    return res.status(400).json({ error: 'Role and content are required' });
  }

  try {
    if (isMongoConnected()) {
      const session = await Conversation.findById(id);
      if (!session) return res.status(404).json({ error: 'Session not found' });

      // Update title if it's the default and this is first user message
      if (session.messages.length === 0 && role === 'user') {
        session.title = content.length > 30 ? content.slice(0, 30) + '...' : content;
      }

      session.messages.push({ role, content, audioData, timestamp: new Date() });
      await session.save();
      return res.json({ session });
    } else {
      const sessions = getLocalSessions();
      const sessionIndex = sessions.findIndex(s => s._id === id);
      if (sessionIndex === -1) return res.status(404).json({ error: 'Session not found' });

      const session = sessions[sessionIndex];
      if (session.messages.length === 0 && role === 'user') {
        session.title = content.length > 30 ? content.slice(0, 30) + '...' : content;
      }
      session.messages.push({ role, content, audioData, timestamp: new Date().toISOString() });
      session.updatedAt = new Date().toISOString();
      sessions[sessionIndex] = session;
      saveLocalSessions(sessions);
      return res.json({ session });
    }
  } catch (error) {
    console.error('[Add Message Error]:', error);
    return res.status(500).json({ error: 'Failed to update session' });
  }
};

/**
 * Delete a session
 */
exports.deleteSession = async (req, res) => {
  const { id } = req.params;
  try {
    if (isMongoConnected()) {
      await Conversation.findByIdAndDelete(id);
      return res.json({ success: true, message: 'Session deleted' });
    } else {
      let sessions = getLocalSessions();
      sessions = sessions.filter(s => s._id !== id);
      saveLocalSessions(sessions);
      return res.json({ success: true, message: 'Session deleted' });
    }
  } catch (error) {
    console.error('[Delete Session Error]:', error);
    return res.status(500).json({ error: 'Failed to delete session' });
  }
};
