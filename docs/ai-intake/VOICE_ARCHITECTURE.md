# MediKiosk Voice Architecture

## 1. Pipeline Overview

The voice input pipeline routes browser microphone audio directly to the backend for speech recognition via Groq Whisper (`whisper-large-v3`), before passing the resulting transcript to the shared conversation engine.

```text
Browser Microphone
      │
      ▼
MediaRecorder API (audio/webm, audio/mp4, audio/wav)
      │
      ▼
Audio Blob (max 25MB)
      │
      ▼
HTTP POST /api/ai/voice/transcribe (or /api/ai/intake/voice)
      │
      ▼
FastAPI Backend (MIME validation, size check)
      │
      ▼
Groq Cloud Whisper API (whisper-large-v3, multilingual: hi, en, Hinglish)
      │
      ▼
Structured Transcript Response { transcript, language, confidence }
      │
      ▼
Conversation Manager (identical flow to text input)
```

## 2. Voice UI State Machine

The frontend enforces an explicit 7-state cycle so the patient always knows the system state:
1. `IDLE`: Microphone ready, prompt to tap.
2. `RECORDING`: Actively capturing audio, pulsing animation, "Listening...".
3. `PROCESSING_AUDIO`: Microphone stopped, preparing audio blob.
4. `TRANSCRIBING`: Uploading to backend and running Whisper STT ("Understanding your response...").
5. `AI_PROCESSING`: Transcript fed into LLM for response and state extraction ("Preparing next question...").
6. `RESPONSE_READY`: AI question rendered on screen and ready for next turn.
7. `ERROR`: Graceful message with retry button and seamless fallback to text input.

## 3. Supported Audio Codecs & Fallbacks
- Primary: `audio/webm;codecs=opus` (Chrome, Edge, Firefox, Android)
- Secondary: `audio/mp4` / `audio/aac` (Safari, iOS)
- Tertiary: `audio/wav` / `audio/ogg`
- Backend supports: `audio/webm`, `audio/wav`, `audio/mp4`, `audio/mpeg`, `audio/ogg`, `audio/m4a`.
