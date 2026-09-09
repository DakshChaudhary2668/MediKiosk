# MediKiosk AI Intake Edge Cases & Handling

## 1. Silent or Inaudible Audio
- Symptom: Audio recorded with no speech or below threshold.
- Action: Return 400/STT response with `success: false, error: "no_speech_detected"`.
- User UI: "I couldn't detect any speech. Please try speaking closer to the microphone or use the text box below."

## 2. Unknown or Forgotten Answers ("I don't know")
- Symptom: Patient cannot recall duration or medications.
- Action: Store value `null`, set field status as `unknown`. Do not badger or repeat question.

## 3. Patient Explicit Refusal
- Symptom: Patient refuses an inquiry ("I don't want to answer that").
- Action: Store field as `declined`, proceed to subsequent section smoothly.

## 4. Multi-Language Code Switching
- Symptom: Patient starts in English, switches to Hindi in turn 2, then Hinglish.
- Action: Detect language dynamically per turn, reflect in output `language` property, preserve verbatim text.

## 5. Network Drop / Disconnect
- Symptom: Device drops Wi-Fi or API timeouts.
- Action: Client saves unsent message locally, preserves active `session_id`, provides one-click "Retry" button.

## 6. Provider Error / Malformed LLM Output
- Symptom: Groq API timeout or invalid JSON output.
- Action: Fallback parser attempts extraction; if failing, a safe conversational question is generated from `QUESTION_BANK.json` without dropping conversation state.
