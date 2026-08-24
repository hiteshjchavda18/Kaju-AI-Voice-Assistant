const express = require('express');
const router = express.Router();
const multer = require('multer');
const os = require('os');
const path = require('path');

const chatController = require('../controllers/chatController');
const audioController = require('../controllers/audioController');
const historyController = require('../controllers/historyController');

// Multer setup for handling audio uploads from microphone
const upload = multer({
  dest: path.join(os.tmpdir(), 'kaju_uploads'),
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB max
});

// Chat routes
router.post('/chat', chatController.handleChatMessage);
router.get('/models', chatController.getAvailableModels);

// Audio routes (Voice assistant)
router.post('/speech-to-text', upload.single('audio'), audioController.speechToText);
router.post('/text-to-speech', audioController.textToSpeech);
router.get('/voices', audioController.getAvailableVoices);

// History & Session routes
router.get('/sessions', historyController.getSessions);
router.post('/sessions', historyController.createSession);
router.get('/sessions/:id', historyController.getSessionById);
router.post('/sessions/:id/messages', historyController.addMessageToSession);
router.delete('/sessions/:id', historyController.deleteSession);

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    service: 'Kaju AI Backend API'
  });
});

module.exports = router;
