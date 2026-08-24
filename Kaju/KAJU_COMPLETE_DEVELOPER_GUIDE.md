# 🧠 Kaju AI Voice Assistant — The Complete Developer Guide & Architecture Manual
> **Build, Understand, Customize, and Extend Your Voice Assistant from Scratch**

---

## 📑 Table of Contents
1. [Project Overview & Architecture](#1-project-overview--architecture)
2. [Why This Tech Stack? (Deep Comparison & Trade-offs)](#2-why-this-tech-stack-deep-comparison--trade-offs)
3. [Core System Components (What, Why, and How)](#3-core-system-components-what-why-and-how)
   - [3.1 Audio Input & Microphone Capture](#31-audio-input--microphone-capture)
   - [3.2 Speech-to-Text (STT) Transcription](#32-speech-to-text-stt-transcription)
   - [3.3 Language Model (LLM) Brain](#33-language-model-llm-brain)
   - [3.4 Text Cleaning for Speech](#34-text-cleaning-for-speech)
   - [3.5 Text-to-Speech (TTS) Voice Engine](#35-text-to-speech-tts-voice-engine)
   - [3.6 Audio Playback & Windows Resource Management](#36-audio-playback--windows-resource-management)
   - [3.7 Event Loop Management (`nest_asyncio`)](#37-event-loop-management-nest_asyncio)
4. [Step-by-Step Build From Scratch](#4-step-by-step-build-from-scratch)
   - [Environment Setup & Installation](#environment-setup--installation)
   - [Project Directory Structure](#project-directory-structure)
   - [Complete Annotated Source Code (`kaju.py`)](#complete-annotated-source-code-kajupy)
5. [Future Customization & Upgrade Cookbook](#5-future-customization--upgrade-cookbook)
   - [Changing Voice, Accent, Speed, and Pitch](#changing-voice-accent-speed-and-pitch)
   - [Switching LLM Models (Groq, Gemini, Local Ollama)](#switching-llm-models-groq-gemini-local-ollama)
   - [Adding Automatic Silence Detection (VAD)](#adding-automatic-silence-detection-vad)
   - [Adding Web Search & Tools (Weather, Wikipedia)](#adding-web-search--tools-weather-wikipedia)
   - [Building a Web UI / Desktop GUI (Streamlit / Tkinter)](#building-a-web-ui--desktop-gui-streamlit--tkinter)
6. [Troubleshooting & Common Gotchas](#6-troubleshooting--common-gotchas)

---

## 1. Project Overview & Architecture

**Kaju** is a modular, real-time AI Voice Assistant capable of:
1. **Dual Input**: Accepting either typed text or live microphone speech.
2. **Conversational Intelligence**: Generating natural, context-aware responses using advanced Large Language Models.
3. **Natural Voice Output**: Replying back in an expressive, human-like **female voice** that is **100% free forever** with no time limits or trial expirations.

### The Modular Pipeline

```
                              ┌───────────────────────────┐
                              │  USER INPUT (Text/Voice)  │
                              └─────────────┬─────────────┘
                                            │
                   ┌────────────────────────┴────────────────────────┐
                   │                                                 │
          [Option A: Text]                                  [Option B: Voice]
                   │                                                 │
                   │                                      Microphone Streaming
                   │                                    (sounddevice + Enter Stop)
                   │                                                 │
                   │                                           WAV Audio File
                   │                                                 │
                   │                                      Groq Whisper AI STT
                   │                                   (whisper-large-v3-turbo)
                   │                                                 │
                   └────────────────────────┬────────────────────────┘
                                            │ Transcribed / Typed Text
                                            ▼
                              ┌───────────────────────────┐
                              │     LLM BRAIN (Groq)      │
                              │    (openai/gpt-oss-120b)  │
                              │   Context + System Prompt │
                              └─────────────┬─────────────┘
                                            │ AI Text Response
                                            ▼
                              ┌───────────────────────────┐
                              │   Text Preprocessing      │
                              │ (Strip Markdown / Emojis) │
                              └─────────────┬─────────────┘
                                            │ Clean Speech Text
                                            ▼
                              ┌───────────────────────────┐
                              │      TTS VOICE ENGINE     │
                              │  Microsoft Edge Neural    │
                              │   (en-US-AvaNeural / Zira)│
                              └─────────────┬─────────────┘
                                            │ MP3 Audio Stream
                                            ▼
                              ┌───────────────────────────┐
                              │     AUDIO PLAYBACK        │
                              │      (pygame.mixer)       │
                              │  Auto-clean Temp Storage  │
                              └───────────────────────────┘
```

---

## 2. Why This Tech Stack? (Deep Comparison & Trade-offs)

When designing a voice assistant, selecting the right tools determines whether your project is fast, reliable, and completely free—or frustrating, slow, and expensive.

### 🎙️ Speech-to-Text (STT) Comparison

| Tool / API | Cost | Speed | Accuracy | Verdict for Kaju |
| :--- | :--- | :--- | :--- | :--- |
| **Groq Whisper AI (`whisper-large-v3-turbo`)** | **100% Free** (on Groq tier) | ⚡ ~250ms | ⭐⭐⭐⭐⭐ (State of the art) | **Selected**: Extremely fast, multi-lingual, high accuracy even with background noise. |
| **Google Web Speech API (`speech_recognition`)** | Free | ~1.5s | ⭐⭐⭐ (Average) | **Alternative**: Unofficial endpoint; can be throttled or fail without internet. |
| **Local Whisper (`whisper.cpp` / `faster-whisper`)** | Free | Depends on GPU | ⭐⭐⭐⭐⭐ | **Great for 100% Offline**: Requires installing PyTorch/C++ binaries. |
| **OpenAI Whisper Paid API** | $0.006 / min | ~1.2s | ⭐⭐⭐⭐⭐ | **Rejected**: Requires paid credit card billing. |

---

### 🔊 Text-to-Speech (TTS) Comparison

| Tool / Library | Cost & Limits | Voice Quality | Why Selected or Rejected |
| :--- | :--- | :--- | :--- |
| **Microsoft Edge Neural TTS (`edge-tts`)** | **100% Free Forever**, No API key, Unlimited | ⭐⭐⭐⭐⭐ (Human-like neural) | **Primary Choice**: Crystal clear female voices, zero subscription, natural cadence. |
| **ElevenLabs** | Paid (10k chars/mo free limit) | ⭐⭐⭐⭐⭐ (Studio quality) | **Rejected**: 10k characters runs out in ~20 minutes of chat, then locks you out. |
| **`pyttsx3` (Windows SAPI5)** | 100% Free & Offline | ⭐⭐⭐ (Robotic / Classic) | **Used as Offline Fallback**: Zero internet required, uses built-in Microsoft Zira. |
| **`gTTS` (Google Translate TTS)** | Free | ⭐⭐ (Monotone robotic) | **Rejected**: Noticeable lag, internet-dependent, robotic tone. |
| **Piper TTS / Kokoro** | 100% Free (Local Model) | ⭐⭐⭐⭐⭐ (Neural local) | **Alternative for local GPU**: Requires ONNX runtime or PyTorch. |

---

### 🧠 LLM Brain Comparison

| Provider | Model | Latency | Free Tier Policy |
| :--- | :--- | :--- | :--- |
| **Groq API** | `openai/gpt-oss-120b`, `llama-3.3-70b`, `qwen/qwen3.6-27b` | ⚡ <400ms | **Very generous**: Thousands of requests per day free with high token speeds. |
| **Google Gemini API** | `gemini-1.5-flash`, `gemini-2.0-flash` | ~800ms | **Generous**: 15 requests per minute, 1,500 per day free. |
| **OpenAI API** | GPT-4o, GPT-3.5-turbo | ~1.2s | **Paid only**: No permanent free tier. |
| **Ollama (Local)** | `llama3.2:3b`, `qwen2.5:3b` | 500ms - 2s | **100% Free & Offline**: Runs on local CPU/GPU. |

---

## 3. Core System Components (What, Why, and How)

### 3.1 Audio Input & Microphone Capture
- **Library**: `sounddevice` + `scipy.io.wavfile` + `queue.Queue`
- **What it does**: Streams live PCM audio chunks from your default microphone into a memory queue while you speak, then concatenates them into a standard 16-bit WAV file once you press Enter.
- **Why dynamic channels?**: Some USB microphones require 2 channels (stereo), while standard headsets support 1 channel (mono). Our code dynamically inspects `max_input_channels` so it never crashes with `PortAudioError: Invalid number of channels`.

### 3.2 Speech-to-Text (STT) Transcription
- **Endpoint**: `https://api.groq.com/openai/v1/audio/transcriptions`
- **Model**: `whisper-large-v3-turbo`
- **What it does**: Uploads the recorded WAV binary to Groq's cloud-accelerated Whisper model and receives the exact transcribed text string in milliseconds.

### 3.3 Language Model (LLM) Brain
- **Endpoint**: `https://api.groq.com/openai/v1/chat/completions`
- **Model**: `openai/gpt-oss-120b` (or `llama-3.3-70b-versatile` / `qwen/qwen3.6-27b`)
- **System Instruction**: Explicitly prompts the model to act as **Kaju**, keeping answers warm, conversational, concise (1–3 sentences), and avoiding complex markdown/tables that cannot be easily spoken.
- **Context Memory**: Stores previous turns in `chat_history = [{"role": "system", ...}, {"role": "user", ...}, {"role": "assistant", ...}]` so Kaju remembers past context during the conversation.

### 3.4 Text Cleaning for Speech
- **Why it matters**: LLMs often generate markdown like `**Hello!**` or emojis like `😊`. When a TTS engine encounters symbols or non-ASCII emojis, it can either pronounce them weirdly (e.g. "asterisk asterisk hello asterisk asterisk smiling face with smiling eyes") or glitch.
- **How it works**: Regex removes `*`, `_`, `#`, `~`, non-ASCII emojis, and multiple white spaces before synthesis.

### 3.5 Text-to-Speech (TTS) Voice Engine
- **Library**: `edge_tts`
- **Voice**: `en-US-AvaNeural` (American female) or `en-IN-NeerjaNeural` (Indian female).
- **What it does**: Connects via websocket to Microsoft's Edge neural speech service, converts text into high-fidelity MP3 audio stream, and saves it to a temporary file.

### 3.6 Audio Playback & Windows Resource Management
- **Library**: `pygame.mixer`
- **Crucial Step**: On Windows, when `pygame.mixer.music.load("file.mp3")` is called, Windows places an OS file lock on that file. If you try to delete or overwrite it immediately, Python crashes with `PermissionError: [Errno 13]`.
- **The Solution**:
  ```python
  pygame.mixer.music.stop()
  pygame.mixer.music.unload()  # Releases the OS file lock immediately!
  os.remove(temp_path)        # Now deletes cleanly without errors
  ```

### 3.7 Event Loop Management (`nest_asyncio`)
- **Why it is needed**: `edge-tts` is built with Python's asynchronous `async/await`. In standard Python scripts, you run `asyncio.run()`. But inside Jupyter Notebooks (`.ipynb`), an event loop is **already running**. Calling `asyncio.run()` inside Jupyter raises:
  `RuntimeError: asyncio.run() cannot be called from a running event loop`
- **The Solution**: `nest_asyncio.apply()` patches Python's `asyncio` to allow re-entrant, nested event loops seamlessly in both terminal scripts and Jupyter notebooks.

---

## 4. Step-by-Step Build From Scratch

### Environment Setup & Installation

Open your terminal or Anaconda prompt and install all required packages:

```bash
pip install requests edge-tts pygame pyttsx3 sounddevice scipy numpy nest_asyncio
```

---

### Project Directory Structure

```text
Kaju/
│
├── Groq api key.txt           # File containing your Groq API Key (gsk_...)
├── kaju.py                    # Complete standalone Python application
├── Kaju.ipynb                 # Interactive Jupyter Notebook version
├── kaju_chat_history.json     # Saved conversation logs (auto-generated)
└── KAJU_COMPLETE_DEVELOPER_GUIDE.md # This guide
```

---

### Complete Annotated Source Code (`kaju.py`)

Here is the complete, self-contained, production-ready code:

```python
"""
Kaju AI Voice Assistant
Full Implementation: Dual Input (Text / Push-to-Talk Voice) -> Groq LLM -> Edge Neural Female TTS
"""

import os
import re
import sys
import json
import time
import queue
import asyncio
import tempfile
import threading
import requests
import nest_asyncio

# 1. Enable nested asyncio support (essential for Jupyter & background loops)
nest_asyncio.apply()

# 2. Suppress pygame welcome message
os.environ['PYGAME_HIDE_SUPPORT_PROMPT'] = '1'
import pygame
import edge_tts
import pyttsx3
import sounddevice as sd
import scipy.io.wavfile as wav
import numpy as np

# ==============================================================================
# CONFIGURATION
# ==============================================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Female Voice Selection:
# "en-US-AvaNeural"     : Very natural, expressive American English female (Default)
# "en-US-EmmaNeural"    : Warm and friendly American English female
# "en-IN-NeerjaNeural"  : Crisp Indian English female
# "en-GB-SoniaNeural"   : British English female
FEMALE_VOICE = "en-US-AvaNeural"

# API Key Loading
API_KEY_FILE = os.path.join(BASE_DIR, "Groq api key.txt")
if os.path.exists(API_KEY_FILE):
    with open(API_KEY_FILE, "r", encoding="utf-8") as f:
        API_KEY = f.read().strip()
else:
    API_KEY = os.getenv("GROQ_API_KEY", "")

# Models & Endpoints
LLM_MODEL = "openai/gpt-oss-120b"
STT_MODEL = "whisper-large-v3-turbo"
CHAT_URL = "https://api.groq.com/openai/v1/chat/completions"
STT_URL = "https://api.groq.com/openai/v1/audio/transcriptions"

# Assistant Persona
SYSTEM_INSTRUCTION = """
You are Kaju, a friendly, intelligent, and helpful female voice assistant.
Guidelines:
- Always respond in a warm, polite, and natural conversational tone.
- Keep answers concise and clear when spoken aloud (usually 1-3 sentences).
- Avoid complex bullet lists or markdown symbols unless necessary.
- If asked who you are, introduce yourself as Kaju.
"""

# ==============================================================================
# HELPER FUNCTIONS
# ==============================================================================

def run_async(coroutine):
    """Safely runs async functions in any environment."""
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    return loop.run_until_complete(coroutine)

def clean_text_for_speech(text: str) -> str:
    """Strips markdown and emojis for clean, natural speech pronunciation."""
    cleaned = re.sub(r'[*_#`~]', '', text)
    cleaned = re.sub(r'[^\x00-\x7F]+', '', cleaned)
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    return cleaned

# ==============================================================================
# SPEECH-TO-TEXT (STT) - PUSH-TO-TALK RECORDING
# ==============================================================================

def record_microphone() -> str:
    """
    Streams microphone audio until the user presses [ENTER] to stop.
    Saves to a temporary WAV file and returns the file path.
    """
    temp_wav = tempfile.NamedTemporaryFile(delete=False, suffix='.wav')
    temp_wav_path = temp_wav.name
    temp_wav.close()

    try:
        # Detect safe channels & sample rate
        device_info = sd.query_devices(kind='input')
        channels = min(2, max(1, device_info.get('max_input_channels', 1)))
        sample_rate = int(device_info.get('default_samplerate', 44100))

        audio_queue = queue.Queue()

        def audio_callback(indata, frames, time_info, status):
            audio_queue.put(indata.copy())

        print("\n" + "-" * 55)
        print(" 🎙️  RECORDING STARTED! Speak into your microphone...")
        print(" 👉 Press [ENTER] when you are finished speaking to STOP")
        print("-" * 55)

        stream = sd.InputStream(samplerate=sample_rate, channels=channels, dtype='int16', callback=audio_callback)
        with stream:
            input()  # Block until user hits ENTER

        print("⚡ Recording STOPPED. Transcribing your voice...")

        chunks = []
        while not audio_queue.empty():
            chunks.append(audio_queue.get())

        if not chunks:
            print("[Warning] No audio was captured.")
            if os.path.exists(temp_wav_path):
                os.remove(temp_wav_path)
            return ""

        audio_data = np.concatenate(chunks, axis=0)
        wav.write(temp_wav_path, sample_rate, audio_data)
        return temp_wav_path

    except Exception as e:
        print(f"\n[Microphone Error] {e}")
        if os.path.exists(temp_wav_path):
            os.remove(temp_wav_path)
        return ""

def transcribe_audio(audio_path: str, api_key: str = API_KEY) -> str:
    """Transcribes audio using Groq Whisper API."""
    if not audio_path or not os.path.exists(audio_path):
        return ""

    headers = {"Authorization": f"Bearer {api_key}"}
    try:
        with open(audio_path, "rb") as f:
            files = {"file": (os.path.basename(audio_path), f, "audio/wav")}
            data = {"model": STT_MODEL}
            response = requests.post(STT_URL, headers=headers, files=files, data=data, timeout=15)
            result = response.json()
            return result.get("text", "").strip()
    except Exception as e:
        print(f"[STT Error] {e}")
        return ""
    finally:
        if os.path.exists(audio_path):
            try:
                os.remove(audio_path)
            except Exception:
                pass

# ==============================================================================
# TEXT-TO-SPEECH (TTS) - VOICE OUTPUT
# ==============================================================================

async def _synthesize_edge_tts(text: str, voice: str, output_path: str):
    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(output_path)

def speak_offline_fallback(text: str):
    """Fallback to Windows SAPI5 voice if offline."""
    try:
        engine = pyttsx3.init()
        voices = engine.getProperty('voices')
        for v in voices:
            if "female" in v.name.lower() or "zira" in v.name.lower() or "heera" in v.name.lower():
                engine.setProperty('voice', v.id)
                break
        engine.setProperty('rate', 175)
        engine.say(text)
        engine.runAndWait()
    except Exception as e:
        print(f"[Offline TTS Notice] {e}")

def speak(text: str, voice: str = FEMALE_VOICE):
    """Speaks text using 100% free Microsoft Edge Neural Voice."""
    clean_text = clean_text_for_speech(text)
    if not clean_text:
        return

    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.mp3')
    temp_path = temp_file.name
    temp_file.close()

    try:
        run_async(_synthesize_edge_tts(clean_text, voice, temp_path))

        if not pygame.mixer.get_init():
            pygame.mixer.init()
        
        pygame.mixer.music.load(temp_path)
        pygame.mixer.music.play()

        while pygame.mixer.music.get_busy():
            time.sleep(0.05)

        pygame.mixer.music.stop()
        pygame.mixer.music.unload()  # Critical to release Windows file lock

    except Exception:
        speak_offline_fallback(clean_text)

    finally:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass

# ==============================================================================
# ASSISTANT CLASS & LLM INTERFACE
# ==============================================================================

class KajuAssistant:
    def __init__(self, api_key: str = API_KEY, model: str = LLM_MODEL, voice: str = FEMALE_VOICE):
        self.api_key = api_key
        self.model = model
        self.voice = voice
        self.chat_history = [{"role": "system", "content": SYSTEM_INSTRUCTION}]

    def ask(self, message: str) -> str:
        if not message.strip():
            return ""

        self.chat_history.append({"role": "user", "content": message})
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": self.model,
            "messages": self.chat_history,
            "temperature": 0.7,
            "max_tokens": 300
        }

        try:
            response = requests.post(CHAT_URL, headers=headers, json=payload, timeout=20)
            data = response.json()

            if "error" in data:
                print(f"\n[API Error] {data['error'].get('message', 'Error')}")
                return ""

            reply = data["choices"][0]["message"]["content"].strip()
            self.chat_history.append({"role": "assistant", "content": reply})

            print(f"\nKaju: {reply}")
            speak(reply, voice=self.voice)
            return reply

        except requests.exceptions.RequestException as e:
            print(f"\n[Connection Error] {e}")
            return ""

    def save_history(self, filename: str = "kaju_chat_history.json"):
        filepath = os.path.join(BASE_DIR, filename)
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(self.chat_history, f, indent=2)
        print(f"[Saved] Chat history saved to '{filename}'.")

# ==============================================================================
# MAIN INTERACTIVE LOOP
# ==============================================================================

def main():
    print("=" * 65)
    print(" 🌟 KAJU - DUAL MODE AI VOICE ASSISTANT 🌟")
    print("=" * 65)
    print(f" • Voice Output : {FEMALE_VOICE} (Free Unlimited Neural TTS)")
    print(" • To Type      : Type your message and hit Enter")
    print(" • To Speak     : Press Enter (or type 'v') ➡️ Speak ➡️ Press Enter to Stop")
    print(" • Exit         : Type 'exit', 'quit', or 'bye'")
    print("=" * 65)

    if not API_KEY:
        print("\n[Warning] API key not found in 'Groq api key.txt' or environment.")
        return

    assistant = KajuAssistant(api_key=API_KEY, voice=FEMALE_VOICE)

    greeting = "Hello! I am Kaju. You can type or speak to me anytime!"
    print(f"\nKaju: {greeting}")
    speak(greeting, voice=FEMALE_VOICE)

    while True:
        try:
            prompt_str = input("\nYou [Type message OR press Enter for Voice 🎙️]: ").strip()

            if prompt_str.lower() in ["quit", "exit", "bye", "stop"]:
                farewell = "Goodbye! Talk to you soon."
                print(f"\nKaju: {farewell}")
                speak(farewell, voice=FEMALE_VOICE)
                assistant.save_history()
                break

            # Voice Input Trigger
            if prompt_str == "" or prompt_str.lower() in ["v", "voice", "mic", "speak"]:
                audio_file = record_microphone()
                if not audio_file:
                    continue

                user_text = transcribe_audio(audio_file, api_key=API_KEY)
                if not user_text:
                    print("Could not detect any clear speech. Please try again.")
                    continue

                print(f"\n🗣️  You (Voice): \"{user_text}\"")
                assistant.ask(user_text)

            else:
                # Text Input Trigger
                assistant.ask(prompt_str)

        except (KeyboardInterrupt, EOFError):
            print("\nSession ended.")
            break

if __name__ == "__main__":
    main()
```

---

## 5. Future Customization & Upgrade Cookbook

### Changing Voice, Accent, Speed, and Pitch

You can easily change `FEMALE_VOICE` in `kaju.py` or `Kaju.ipynb` to any of these popular neural voices:

| Voice Identifier | Description | Language / Accent |
| :--- | :--- | :--- |
| `"en-US-AvaNeural"` | Expressive, modern female *(Default)* | US English |
| `"en-US-EmmaNeural"` | Warm, friendly female | US English |
| `"en-US-JennyNeural"` | Professional assistant female | US English |
| `"en-IN-NeerjaNeural"` | Clear, natural Indian female | Indian English |
| `"hi-IN-SwaraNeural"` | Expressive Hindi female | Hindi / Hinglish |
| `"en-GB-SoniaNeural"` | British English female | UK English |
| `"en-AU-NatashaNeural"`| Australian English female | Australian English |

#### How to Adjust Pitch or Speed:
To make Kaju speak 10% faster or adjust pitch, change the `_synthesize_edge_tts` function:
```python
# Rate can be "+10%", "+20%", "-10%"
# Pitch can be "+5Hz", "+10Hz", "-5Hz"
communicate = edge_tts.Communicate(text, voice, rate="+10%", pitch="+2Hz")
await communicate.save(output_path)
```

---

### Switching LLM Models (Groq, Gemini, Local Ollama)

#### Option A: Switch Groq Models
In `kaju.py`, simply change:
```python
LLM_MODEL = "qwen/qwen3.6-27b"  # or "openai/gpt-oss-120b" or "groq/compound-mini"
```

#### Option B: Switch to Google Gemini API (1,500 free requests/day)
1. Install: `pip install google-generativeai`
2. Update the `ask` function:
   ```python
   import google.generativeai as genai
   genai.configure(api_key="YOUR_GEMINI_API_KEY")
   model = genai.GenerativeModel('gemini-1.5-flash', system_instruction=SYSTEM_INSTRUCTION)
   
   def ask_gemini(message):
       response = model.generate_content(message)
       reply = response.text
       print(f"\nKaju: {reply}")
       speak(reply)
       return reply
   ```

#### Option C: Switch to 100% Offline Local LLM (Ollama)
1. Download Ollama from [ollama.com](https://ollama.com) and run: `ollama run llama3.2`
2. Point your request to your local machine:
   ```python
   payload = {
       "model": "llama3.2",
       "prompt": message,
       "stream": False
   }
   res = requests.post("http://localhost:11434/api/generate", json=payload)
   reply = res.json()["response"]
   ```

---

### Adding Web Search & Tools (Weather, Wikipedia)

To give Kaju live real-time internet knowledge (e.g. weather, news, calculations):
```python
import wikipedia

def ask_with_tools(message):
    if "who is" in message.lower() or "what is" in message.lower():
        try:
            summary = wikipedia.summary(message, sentences=2)
            print(f"\nKaju (Wiki): {summary}")
            speak(summary)
            return summary
        except Exception:
            pass
    # Fallback to standard LLM
    return assistant.ask(message)
```

---

### Building a Web UI / Desktop GUI (Streamlit / Tkinter)

#### Example: 1-File Streamlit Web App (`app.py`)
Run with: `pip install streamlit` ➡️ `streamlit run app.py`

```python
import streamlit as st
import kaju

st.set_page_config(page_title="Kaju AI Voice Assistant", page_icon="🎙️")
st.title("🌟 Kaju - AI Voice Assistant")

if "assistant" not in st.session_state:
    st.session_state.assistant = kaju.KajuAssistant()

user_input = st.chat_input("Ask Kaju something...")
if user_input:
    st.chat_message("user").write(user_input)
    with st.spinner("Kaju is thinking..."):
        reply = st.session_state.assistant.ask(user_input)
    st.chat_message("assistant").write(reply)
```

---

## 6. Troubleshooting & Common Gotchas

### 1. `RuntimeError: asyncio.run() cannot be called from a running event loop`
- **Cause**: Trying to call async `edge-tts` inside Jupyter Notebooks or an already running event loop.
- **Fix**: Always call `nest_asyncio.apply()` at the top of your script/notebook, and use `run_async(coro)`.

### 2. `PermissionError: [Errno 13] Permission denied: '...mp3'`
- **Cause**: On Windows, `pygame.mixer` locks audio files until unloaded.
- **Fix**: Always call `pygame.mixer.music.stop()` and `pygame.mixer.music.unload()` before attempting `os.remove()`.

### 3. `PortAudioError: Invalid number of channels`
- **Cause**: Hardcoding `channels=1` when using a 2-channel stereo USB microphone.
- **Fix**: Query device capabilities with `sd.query_devices(kind='input')` and clamp channels dynamically (`channels = min(2, max(1, max_channels))`).

### 4. `API Error: Model does not exist`
- **Cause**: Groq occasionally updates model IDs (e.g. deprecating older preview names).
- **Fix**: Check available models dynamically:
  ```python
  import requests
  headers = {"Authorization": f"Bearer {API_KEY}"}
  res = requests.get("https://api.groq.com/openai/v1/models", headers=headers)
  print([m["id"] for m in res.json()["data"]])
  ```

---

## 🏁 Summary

You now have a complete, production-grade AI Voice Assistant architecture that:
- Runs **100% free forever** with zero paid subscription limits.
- Supports **both typed text and microphone speech** with push-to-talk convenience.
- Speaks with a **natural neural female voice** and has an offline fallback.
- Is **fully modular**, allowing you to change voices, LLM providers, STT engines, or UIs anytime you want!
