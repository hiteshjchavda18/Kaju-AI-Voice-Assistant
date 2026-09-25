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

# Apply nest_asyncio so asyncio works seamlessly in both terminal and Jupyter notebooks
nest_asyncio.apply()

# Suppress pygame startup prompt
os.environ['PYGAME_HIDE_SUPPORT_PROMPT'] = '1'
import pygame
import edge_tts
import pyttsx3
import sounddevice as sd
import scipy.io.wavfile as wav
import numpy as np

# Ensure UTF-8 console output on Windows
if sys.platform == "win32":
    try:
        if hasattr(sys.stdout, 'reconfigure'):
            sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        if hasattr(sys.stderr, 'reconfigure'):
            sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

# ==============================================================================
# 1. PATHS & CONFIGURATION
# ==============================================================================

# Determine base directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Female Voice Options:
# - "en-US-AvaNeural"     : Highly natural, expressive American English female (Default)
# - "en-US-EmmaNeural"    : Friendly, warm American English female
# - "en-US-JennyNeural"   : Professional assistant female
# - "en-IN-NeerjaNeural"  : Indian English female voice
# - "en-GB-SoniaNeural"   : British English female voice
FEMALE_VOICE = "en-US-AvaNeural"

# API Key & Model Configuration
DEFAULT_GROQ_KEY = os.getenv("GROQ_API_KEY", "")
API_KEY_FILE = os.path.join(BASE_DIR, "Groq api key.txt")
API_KEY_EXT = "C:/Users/hites/OneDrive/Documents/5th Sem/ML/MLAPIGRAQ/Groq_api_key.txt"

def load_api_key() -> str:
    """Finds the Groq API key from environment, key files, or project configs."""
    # 1. Environment variable
    env_key = os.getenv("GROQ_API_KEY", "").strip()
    if env_key:
        return env_key

    # 2. Local or external key files
    for path in [
        API_KEY_FILE,
        os.path.join(BASE_DIR, "groq_api_key.txt"),
        os.path.join(BASE_DIR, ".env"),
        os.path.join(BASE_DIR, "backend", ".env"),
        API_KEY_EXT
    ]:
        if os.path.exists(path):
            try:
                with open(path, "r", encoding="utf-8") as f:
                    content = f.read().strip()
                    if path.endswith(".env"):
                        for line in content.splitlines():
                            if line.strip().startswith("GROQ_API_KEY="):
                                k = line.strip().split("=", 1)[1].strip().strip('"').strip("'")
                                if k:
                                    return k
                    elif content:
                        return content
            except Exception:
                pass

    # 3. Fallback to active key
    return DEFAULT_GROQ_KEY

API_KEY = load_api_key()

LLM_MODEL = "openai/gpt-oss-120b"
STT_MODEL = "whisper-large-v3-turbo"
CHAT_URL = "https://api.groq.com/openai/v1/chat/completions"
STT_URL = "https://api.groq.com/openai/v1/audio/transcriptions"

SYSTEM_INSTRUCTION = """
You are Kaju, a friendly, intelligent, and helpful female voice assistant.
Guidelines:
- Always respond in a warm, polite, and natural conversational tone.
- Keep your answers concise, clear, and easy to understand when spoken aloud (usually 1-3 sentences unless asked for more).
- Avoid complex bullet lists or markdown symbols unless necessary, because your response is converted directly into speech.
- If asked who you are, introduce yourself as Kaju.
"""

# ==============================================================================
# 2. HELPER FUNCTIONS
# ==============================================================================

def run_async(coroutine):
    """Safely runs an async coroutine in both standard Python and Jupyter Notebooks."""
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    return loop.run_until_complete(coroutine)

def clean_text_for_speech(text: str) -> str:
    """Cleans markdown symbols, formatting, and emojis for smooth, human-like speech."""
    replacements = {
        '’': "'", '‘': "'", '“': '"', '”': '"',
        '—': ' - ', '–': ' - ', '…': '...'
    }
    for orig, rep in replacements.items():
        text = text.replace(orig, rep)
    cleaned = re.sub(r'[*_#`~>\[\]\(\)]', '', text)
    cleaned = re.sub(r'[^\x00-\x7F]+', '', cleaned)
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    return cleaned

# ==============================================================================
# 3. SPEECH-TO-TEXT (STT) - VOICE INPUT (PRESS ENTER TO START & STOP)
# ==============================================================================

def record_microphone() -> str:
    """
    Records audio from the microphone with manual start & stop:
    - User speaks as long as they like.
    - Press [ENTER] to stop recording.
    """
    temp_wav = tempfile.NamedTemporaryFile(delete=False, suffix='.wav')
    temp_wav_path = temp_wav.name
    temp_wav.close()

    try:
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
            # Wait for user to press ENTER to stop recording
            input()

        print("⚡ Recording STOPPED. Transcribing your voice...")

        # Gather all recorded audio chunks
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
    """
    Transcribes audio to text using Groq's high-speed Whisper AI model.
    """
    if not audio_path or not os.path.exists(audio_path):
        return ""

    headers = {"Authorization": f"Bearer {api_key}"}
    try:
        with open(audio_path, "rb") as f:
            files = {"file": (os.path.basename(audio_path), f, "audio/wav")}
            data = {"model": STT_MODEL}
            response = requests.post(STT_URL, headers=headers, files=files, data=data, timeout=15)
            result = response.json()

            if "text" in result:
                return result["text"].strip()
            else:
                print(f"[STT Error] {result.get('error', {}).get('message', 'Failed to transcribe')}")
                return ""
    except Exception as e:
        print(f"[STT Connection Error] {e}")
        return ""
    finally:
        # Clean up temporary recording file
        if os.path.exists(audio_path):
            try:
                os.remove(audio_path)
            except Exception:
                pass


# ==============================================================================
# 4. TEXT-TO-SPEECH (TTS) - VOICE OUTPUT
# ==============================================================================

async def _synthesize_edge_tts(text: str, voice: str, output_path: str):
    """Asynchronously generates neural speech file via edge-tts."""
    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(output_path)

def speak_offline_fallback(text: str):
    """Fallback TTS using Windows built-in SAPI5 female voice (e.g. Zira)."""
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
        print(f"[Offline TTS Warning] {e}")

def speak(text: str, voice: str = FEMALE_VOICE):
    """
    Speaks the given text using 100% free Microsoft Edge Neural Female Voice.
    Falls back to offline Windows SAPI5 voice if internet is unavailable.
    """
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
        pygame.mixer.music.unload()  # Release Windows file lock

    except Exception:
        speak_offline_fallback(clean_text)

    finally:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass


# ==============================================================================
# 5. CONVERSATION / LLM ENGINE
# ==============================================================================

class KajuAssistant:
    def __init__(self, api_key: str = API_KEY, model: str = LLM_MODEL, voice: str = FEMALE_VOICE):
        self.api_key = api_key
        self.model = model
        self.voice = voice
        self.chat_history = [{"role": "system", "content": SYSTEM_INSTRUCTION}]

    def ask(self, message: str) -> str:
        """Sends user query to LLM, prints response, and speaks in female voice."""
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
                error_msg = f"API Error: {data['error'].get('message', 'Unknown error')}"
                print(f"\n[Error] {error_msg}")
                return ""

            reply = data["choices"][0]["message"]["content"].strip()
            self.chat_history.append({"role": "assistant", "content": reply})

            # 1. Print Text Response
            print(f"\nKaju: {reply}")

            # 2. Speak Response in Female Voice
            speak(reply, voice=self.voice)

            return reply

        except requests.exceptions.RequestException as e:
            print(f"\n[Connection Error] Could not connect to API: {e}")
            return ""

    def save_history(self, filename: str = "kaju_chat_history.json"):
        """Saves current conversation history to a JSON file."""
        filepath = os.path.join(BASE_DIR, filename)
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(self.chat_history, f, indent=2)
        print(f"[Saved] Conversation history saved to '{filename}'.")


# ==============================================================================
# 6. DUAL-INPUT INTERACTIVE LOOP (VOICE OR TEXT)
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

    # Initial greeting
    greeting = "Hello! I am Kaju. You can type or speak to me anytime!"
    print(f"\nKaju: {greeting}")
    speak(greeting, voice=FEMALE_VOICE)

    while True:
        try:
            prompt_str = input("\nYou [Type message OR press Enter for Voice 🎙️]: ").strip()

            # If user types exit / quit / bye
            if prompt_str.lower() in ["quit", "exit", "bye", "stop"]:
                farewell = "Goodbye! Talk to you soon."
                print(f"\nKaju: {farewell}")
                speak(farewell, voice=FEMALE_VOICE)
                assistant.save_history()
                break

            # If user pressed Enter (empty) or typed 'v' / 'voice' / 'mic' -> TRIGGER VOICE RECORDING
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
                # User typed a regular text message
                assistant.ask(prompt_str)

        except (KeyboardInterrupt, EOFError):
            print("\nSession ended.")
            break

if __name__ == "__main__":
    main()
