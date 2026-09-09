# Voice & Speech Pipeline

MediKiosk features an end-to-end voice intake pipeline engineered for clinical accuracy in Indian healthcare settings. It uses **Sarvam AI Saaras** for speech recognition (STT) and **Sarvam AI Bulbul** for speech synthesis (TTS), with strict zero-hallucination validation and anti-dummy fallbacks.

---

## 🎙️ End-to-End Voice Flow

```mermaid
sequenceDiagram
    autonumber
    actor Patient as Patient (Kiosk / Mobile)
    participant UI as Next.js Web Client
    participant API as FastAPI Backend (/api/intake/voice)
    participant STT as Sarvam Saaras STT
    participant Safety as Deterministic Safety Filter
    participant AI as Groq LLaMA Engine
    participant TTS as Sarvam Bulbul TTS

    Patient->>UI: Speaks into microphone (e.g. "Mujhe do din se bukhar hai")
    UI->>UI: MediaRecorder captures Opus/WebM audio
    UI->>API: POST /api/intake/voice (FormData: session_id + audio)
    API->>API: Validate audio bytes (> 100 bytes)
    API->>STT: POST https://api.sarvam.ai/speech-to-text
    STT-->>API: Returns transcript ("Mujhe do din se bukhar hai")
    API->>API: Verify non-empty transcript
    API->>Safety: Check emergency regex patterns
    Safety-->>API: Clean (No red flags)
    API->>AI: Process transcript through prompt & history
    AI-->>API: Returns IntakeResponse (JSON)
    API->>TTS: POST https://api.sarvam.ai/text-to-speech (AI text)
    TTS-->>API: Returns base64 WAV audio
    API-->>UI: Returns { ai_message, transcript, tts_audio, ... }
    UI->>Patient: Plays audio response & renders transcript in chat
```

---

## 🗣️ Speech-to-Text (STT) Implementation (`app/services/stt.py`)

- **Provider:** Sarvam AI
- **Endpoint:** `https://api.sarvam.ai/speech-to-text`
- **Model:** `saaras:v3` (configured via `SARVAM_STT_MODEL`)
- **Headers:** `api-subscription-key: <SARVAM_API_KEY>`
- **Language Mapping:**
  ```python
  _LANG_MAP = {
      "en": "en-IN",
      "hi": "hi-IN",
      "hinglish": "unknown",  # Code-mixed auto-detect
      "bn": "bn-IN",
      "kn": "kn-IN",
      "ml": "ml-IN",
      "mr": "mr-IN",
      "od": "od-IN",
      "pa": "pa-IN",
      "ta": "ta-IN",
      "te": "te-IN",
      "gu": "gu-IN",
  }
  ```
- **Diagnostic Tracing:** Logs request duration and payload size using `VOICE_DEBUG:` prefixes.

---

## 🔊 Text-to-Speech (TTS) Implementation (`app/services/tts.py`)

- **Provider:** Sarvam AI
- **Endpoint:** `https://api.sarvam.ai/text-to-speech`
- **Model:** `bulbul:v3` (configured via `SARVAM_TTS_MODEL`)
- **Language Codes:** `en-IN`, `hi-IN`
- **Audio Output:** Decodes base64 string from Sarvam JSON response into raw WAV bytes.

---

## 🛡️ Strict Defensive Voice Rules

1. **Zero Dummy Fallbacks:**
   - The voice pipeline **never** injects mock transcripts when the microphone is silent.
   - If audio bytes are empty or `< 100 bytes`, the API immediately raises HTTP `422 Unprocessable Entity` (`"Recorded audio was empty or too short"`).
2. **Empty Transcript Rejection:**
   - If Sarvam STT detects no audible speech, the API raises HTTP `422` (`"No speech detected in the audio. Please speak clearly."`).
   - Groq is **not** called with blank strings, preventing hallucinated symptoms.
3. **Graceful TTS Degradation:**
   - If Sarvam TTS fails due to rate limits or network issues, the text response is still delivered to the client, allowing the visual conversation to continue uninterrupted.
4. **Browser Audio Slicing:**
   - `src/app/intake/[sessionId]/page.tsx` starts `MediaRecorder` with `recorder.start(250)` to ensure all recorded PCM/Opus chunks are flushed before upload.
