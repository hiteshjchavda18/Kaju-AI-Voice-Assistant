import sys
import os
import re
import asyncio
import argparse

def clean_text_for_speech(text: str) -> str:
    """Cleans markdown symbols, formatting, and unwanted unicode for smooth speech."""
    cleaned = re.sub(r'[*_#`~>\[\]\(\)]', '', text)
    cleaned = re.sub(r'[^\x00-\x7F]+', '', cleaned)
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    return cleaned

async def generate_speech(text: str, voice: str, output_path: str):
    cleaned = clean_text_for_speech(text)
    if not cleaned:
        cleaned = "Hello, I am Kaju."
    
    try:
        import edge_tts
        communicate = edge_tts.Communicate(cleaned, voice)
        await communicate.save(output_path)
    except Exception as e:
        print(f"Error generating Edge TTS: {e}", file=sys.stderr)
        sys.exit(1)

def main():
    parser = argparse.ArgumentParser(description="Edge-TTS Python bridge for Kaju Assistant")
    parser.add_argument("--text", type=str, required=True, help="Text to convert to speech")
    parser.add_argument("--voice", type=str, default="en-US-AvaNeural", help="Edge TTS female voice")
    parser.add_argument("--output", type=str, required=True, help="Path to save output MP3")
    
    args = parser.parse_args()
    asyncio.run(generate_speech(args.text, args.voice, args.output))

if __name__ == "__main__":
    main()
