/**
 * Enhanced Audio Recorder with:
 * 1. Web Speech API for real-time live transcription feedback
 * 2. High-fidelity MediaRecorder for Groq Whisper fallback
 * 3. Web Audio API Analyser for dynamic soundwave visuals
 */
export class AudioRecorder {
  /**
   * @param {Object} callbacks
   * @param {Function} callbacks.onVolumeChange   - called with (volume, dataArray)
   * @param {Function} callbacks.onFrequencyData  - called with frequency Uint8Array
   * @param {Function} callbacks.onTranscriptChange - called with live transcript string
   */
  constructor({ onVolumeChange, onFrequencyData, onTranscriptChange } = {}) {
    this.onVolumeChange = onVolumeChange || null;
    this.onFrequencyData = onFrequencyData || null;
    this.onTranscriptChange = onTranscriptChange || null;

    this.mediaRecorder = null;
    this.audioChunks = [];
    this.audioContext = null;
    this.analyser = null;
    this.source = null;
    this.stream = null;
    this.isRecording = false;
    this.animationFrameId = null;
    this.dataArray = null;

    // Web Speech Recognition support
    this.recognition = null;
    this.liveTranscript = '';
  }

  async start() {
    if (this.isRecording) return;

    this.liveTranscript = '';

    try {
      // 1. Request microphone with optimal voice settings
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1
        }
      });

      // 2. Setup Web Audio Analyser for reactive visuals
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioCtx();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.75;

      this.source = this.audioContext.createMediaStreamSource(this.stream);
      this.source.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);

      // Volume & frequency monitoring loop
      const updateVolume = () => {
        if (!this.isRecording) return;
        this.analyser.getByteFrequencyData(this.dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += this.dataArray[i];
        }
        const average = sum / bufferLength;
        const normalizedVolume = Math.min(1, (average / 100) * 1.2);

        if (this.onVolumeChange) {
          this.onVolumeChange(normalizedVolume);
        }
        if (this.onFrequencyData) {
          this.onFrequencyData(this.dataArray.slice());
        }

        this.animationFrameId = requestAnimationFrame(updateVolume);
      };

      // 3. Setup Browser Live Speech Recognition (if available)
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          this.recognition = new SpeechRecognition();
          this.recognition.continuous = true;
          this.recognition.interimResults = true;
          this.recognition.lang = 'en-US';

          this.recognition.onresult = (event) => {
            let fullText = '';
            for (let i = 0; i < event.results.length; i++) {
              fullText += event.results[i][0].transcript + ' ';
            }
            this.liveTranscript = fullText.trim();
            if (this.onTranscriptChange) {
              this.onTranscriptChange(this.liveTranscript);
            }
          };

          this.recognition.onerror = (e) => {
            console.warn('[WebSpeech Warning]:', e.error);
          };

          this.recognition.start();
        } catch (e) {
          console.warn('SpeechRecognition initialization error:', e);
        }
      }

      // 4. Setup MediaRecorder with best supported mimeType
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
          mimeType = 'audio/ogg';
        } else {
          mimeType = '';
        }
      }

      this.audioChunks = [];
      const options = mimeType ? { mimeType } : {};
      this.mediaRecorder = new MediaRecorder(this.stream, options);

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(250);
      this.isRecording = true;
      updateVolume();

      return true;
    } catch (err) {
      console.error('Microphone access denied or error:', err);
      throw err;
    }
  }

  /**
   * Stops recording and returns the audio Blob directly.
   * @returns {Promise<Blob>} the recorded audio blob
   */
  stop() {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || !this.isRecording) {
        resolve(null);
        return;
      }

      this.isRecording = false;

      // Stop speech recognition
      if (this.recognition) {
        try {
          this.recognition.stop();
        } catch (e) {}
      }

      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }

      // Request any pending chunks before stopping
      try {
        if (this.mediaRecorder.state === 'recording') {
          this.mediaRecorder.requestData();
        }
      } catch (e) {}

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, {
          type: this.mediaRecorder.mimeType || 'audio/webm'
        });

        // Stop all audio tracks
        if (this.stream) {
          this.stream.getTracks().forEach((track) => track.stop());
          this.stream = null;
        }

        if (this.audioContext && this.audioContext.state !== 'closed') {
          this.audioContext.close();
        }

        resolve(audioBlob);
      };

      this.mediaRecorder.stop();
    });
  }
}
