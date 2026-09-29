require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/kaju_assistant';

// Middleware
app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// API Routes
app.use('/api', apiRoutes);
app.use('/', apiRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Kaju AI Voice Assistant API is running 🎙️',
    docs: '/api/health'
  });
});

// MongoDB Connection with Graceful Fallback
async function connectDB() {
  const isPlaceholder = !MONGO_URI || MONGO_URI.includes('placeholder') || MONGO_URI.includes('example');
  const isLocalhostOnCloud = (process.env.VERCEL || process.env.NODE_ENV === 'production') && (MONGO_URI.includes('127.0.0.1') || MONGO_URI.includes('localhost'));

  if (isPlaceholder || isLocalhostOnCloud) {
    console.log('📦 Using high-speed JSON / in-memory persistent storage fallback for chat sessions.');
    return;
  }

  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 2500
    });
    console.log('🍃 MongoDB connected successfully!');
  } catch (err) {
    console.warn('⚠️  MongoDB connection failed or not running locally:', err.message);
    console.log('📦 Using high-speed JSON persistent storage fallback for chat sessions.');
  }
}

// Global error handler middleware so responses are always valid JSON
app.use((err, req, res, next) => {
  console.error('[Global Server Error]:', err);
  if (res.headersSent) return next(err);
  return res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

connectDB().then(() => {
  if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    app.listen(PORT, () => {
      console.log(`🚀 Kaju Backend Server running on http://localhost:${PORT}`);
      console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
    });
  }
});

module.exports = app;
