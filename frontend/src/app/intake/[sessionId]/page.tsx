'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getSession, sendMessage, sendVoice, completeSession } from '@/lib/api';
import {
  IconMic,
  IconMicOff,
  IconSend,
  IconCheckCircle,
  IconAlertTriangle,
  IconActivity,
  IconX,
} from '@/components/icons';
import styles from './intake.module.scss';

interface Message {
  speaker: 'patient' | 'assistant';
  content: string;
  input_mode?: string;
  created_at?: string;
}

interface PatientCaseData {
  chief_complaint?: string;
  category?: string;
  duration?: string;
  severity?: number;
  [key: string]: unknown;
}

const CATEGORIES = [
  { id: 'fever', label: 'Fever / Infection' },
  { id: 'respiratory', label: 'Respiratory' },
  { id: 'gastrointestinal', label: 'Gastrointestinal' },
  { id: 'headache_neurological', label: 'Headache / Neuro' },
  { id: 'musculoskeletal', label: 'Pain / Muscle' },
  { id: 'skin', label: 'Skin' },
  { id: 'urinary', label: 'Urinary' },
  { id: 'chest', label: 'Chest' },
  { id: 'general_health', label: 'General / Other' },
];

type VoiceState = 'IDLE' | 'LISTENING' | 'PROCESSING' | 'SPEAKING' | 'ERROR';

export default function IntakePage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sessionStatus, setSessionStatus] = useState('active');
  const [redFlag, setRedFlag] = useState(false);
  const [surveyComplete, setSurveyComplete] = useState(false);
  const [patientCase, setPatientCase] = useState<PatientCaseData | null>(null);
  const [error, setError] = useState('');
  const [statusText, setStatusText] = useState('');

  // Voice recording
  const [voiceState, setVoiceState] = useState<VoiceState>('IDLE');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  // Load session
  useEffect(() => {
    getSession(sessionId)
      .then(data => {
        setMessages((data.messages || []).map((m: Record<string, unknown>) => ({
          speaker: m.speaker as 'patient' | 'assistant',
          content: String(m.content),
          input_mode: m.input_mode as string | undefined,
          created_at: m.created_at as string | undefined,
        })));
        const status = String((data.session as Record<string, unknown>).status || 'active');
        setSessionStatus(status);
        setSurveyComplete(status === 'completed');
        setRedFlag(status === 'red_flagged');
        if (data.case) setPatientCase(data.case);
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load session'))
      .finally(() => setLoading(false));
  }, [sessionId]);

  // Send text message
  async function handleSend() {
    if (!input.trim() || sending) return;
    const msg = input.trim();
    setInput('');
    setSending(true);
    setError('');
    setStatusText('Thinking...');

    setMessages(prev => [...prev, { speaker: 'patient', content: msg }]);

    try {
      const res = await sendMessage(sessionId, msg);
      setMessages(prev => [...prev, { speaker: 'assistant', content: res.ai_message }]);
      if (res.red_flag) setRedFlag(true);
      if (res.survey_complete) setSurveyComplete(true);
      setSessionStatus(res.session_status);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setSending(false);
      setStatusText('');
    }
  }

  // Voice recording with strict microphone checks and VOICE_DEBUG logging
  async function startRecording() {
    setError('');
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn('VOICE_DEBUG: microphone_unavailable');
      setError('Microphone is not supported in this browser. Please use text input.');
      return;
    }

    try {
      console.log('VOICE_DEBUG: microphone_permission_requested');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const audioTracks = stream.getAudioTracks();
      if (!audioTracks || audioTracks.length === 0) {
        console.warn('VOICE_DEBUG: audio_track_missing');
        setError('No audio track detected on microphone.');
        return;
      }

      console.log('VOICE_DEBUG: audio_stream_created | tracks=', audioTracks.length);
      console.log('VOICE_DEBUG: audio_track_state | state=', audioTracks[0].readyState);

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : MediaRecorder.isTypeSupported('audio/mp4')
            ? 'audio/mp4'
            : '';

      const options = mimeType ? { mimeType } : undefined;
      const recorder = new MediaRecorder(stream, options);
      chunksRef.current = [];

      recorder.ondataavailable = e => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
          console.log('VOICE_DEBUG: audio_chunk_received | size=', e.data.size);
        }
      };

      recorder.onstop = async () => {
        console.log('VOICE_DEBUG: recording_stopped');
        stream.getTracks().forEach(t => t.stop());

        const blob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' });
        console.log('VOICE_DEBUG: audio_bytes | total_size=', blob.size);

        if (blob.size < 500) {
          setVoiceState('ERROR');
          setStatusText('');
          setError('No audio recorded or recording was too short. Please hold to speak clearly.');
          return;
        }

        await handleVoiceSend(blob);
      };

      recorder.start(250); // Slice chunks every 250ms
      mediaRecorderRef.current = recorder;
      setVoiceState('LISTENING');
      setStatusText('Listening... (speak now)');
      console.log('VOICE_DEBUG: recording_started');
    } catch (err) {
      console.error('VOICE_DEBUG: microphone_permission_denied', err);
      setError('Microphone access is required for voice consultation. Please allow microphone access or use text input.');
      setVoiceState('ERROR');
      setStatusText('');
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setVoiceState('PROCESSING');
      setStatusText('Transcribing speech...');
    }
  }

  async function handleVoiceSend(blob: Blob) {
    setSending(true);
    setError('');
    setStatusText('Transcribing speech with Sarvam AI...');
    console.log('VOICE_DEBUG: stt_request_started | bytes=', blob.size);

    try {
      const res = await sendVoice(sessionId, blob);
      console.log('VOICE_DEBUG: transcript_received | transcript=', res.transcript);

      if (!res.transcript || res.transcript.trim() === '') {
        throw new Error('No speech detected. Please speak clearly into your microphone.');
      }

      setMessages(prev => [
        ...prev,
        { speaker: 'patient', content: res.transcript, input_mode: 'voice' },
        { speaker: 'assistant', content: res.ai_message },
      ]);

      // Play TTS audio if returned
      if (res.tts_audio) {
        setVoiceState('SPEAKING');
        setStatusText('Speaking...');
        try {
          const audioData = Uint8Array.from(atob(res.tts_audio), c => c.charCodeAt(0));
          const audioBlob = new Blob([audioData], { type: 'audio/wav' });
          const url = URL.createObjectURL(audioBlob);
          const audio = new Audio(url);
          audio.play().catch(e => console.warn('TTS auto-play prevented:', e));
          audio.onended = () => {
            URL.revokeObjectURL(url);
            setVoiceState('IDLE');
            setStatusText('');
          };
        } catch {
          setVoiceState('IDLE');
          setStatusText('');
        }
      } else {
        setVoiceState('IDLE');
        setStatusText('');
      }

      if (res.red_flag) setRedFlag(true);
      if (res.survey_complete) setSurveyComplete(true);
      setSessionStatus(res.session_status);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Speech recognition failed. Please try again or type your answer.';
      setError(msg);
      setVoiceState('ERROR');
      setStatusText('');
    } finally {
      setSending(false);
    }
  }

  async function handleComplete() {
    try {
      await completeSession(sessionId);
      const data = await getSession(sessionId);
      if (data.case) setPatientCase(data.case);
      setSurveyComplete(true);
      setSessionStatus('completed');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete session');
    }
  }

  if (loading) {
    return (
      <main className={styles.chatPage}>
        <div className="loading-overlay"><span className="spinner" /> Loading conversation...</div>
      </main>
    );
  }

  return (
    <main className={styles.chatPage}>
      {/* Header */}
      <header className={styles.header}>
        <button onClick={() => router.push('/dashboard')} className={styles.backBtn}>← Back</button>
        <div>
          <strong>AI Health Assessment</strong>
          <span className={styles.statusBadge} data-status={sessionStatus}>
            {sessionStatus === 'active' ? 'In Progress' : sessionStatus === 'completed' ? 'Complete' : sessionStatus === 'red_flagged' ? 'Emergency Protocol' : sessionStatus}
          </span>
        </div>
      </header>

      {/* Red flag alert */}
      {redFlag && (
        <div className="alert alert-danger" style={{ margin: 'var(--space-sm)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <IconAlertTriangle size={18} />
          <span><strong>Emergency Alert:</strong> Based on what you described, please seek immediate emergency medical care or call 108 / 911.</span>
        </div>
      )}

      {/* Messages */}
      <div className={styles.messages}>
        {messages.map((m, i) => (
          <div key={i} className={`${styles.message} ${styles[m.speaker]}`}>
            <div className={styles.bubble}>
              {m.content}
              {m.input_mode === 'voice' && (
                <span className={styles.voiceTag} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <IconMic size={12} /> Voice
                </span>
              )}
            </div>
          </div>
        ))}
        {sending && (
          <div className={`${styles.message} ${styles.assistant}`}>
            <div className={`${styles.bubble} ${styles.typing}`}>
              <span></span><span></span><span></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Live Voice / System Status Text */}
      {statusText && (
        <div style={{
          padding: '4px var(--space-md)',
          fontSize: '0.8125rem',
          color: 'var(--color-primary-dark)',
          fontWeight: 500,
          textAlign: 'center',
          background: 'var(--color-primary-light-alpha, #e6fffa)',
        }}>
          {statusText}
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="alert alert-danger" style={{ margin: 'var(--space-xs) var(--space-sm)', borderRadius: 'var(--radius-md)' }}>
          <span>{error}</span>
          <button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'inline-flex', alignItems: 'center', padding: 2 }} aria-label="Dismiss error">
            <IconX size={14} />
          </button>
        </div>
      )}

      {/* Survey complete summary */}
      {surveyComplete && patientCase && (
        <div className={styles.caseCard}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <IconCheckCircle size={20} color="var(--color-success)" />
            <span>Assessment Complete</span>
          </h3>
          <div className={styles.caseGrid}>
            {Boolean(patientCase.chief_complaint) && <div><label>Complaint</label><span>{String(patientCase.chief_complaint)}</span></div>}
            {Boolean(patientCase.category) && <div><label>Category</label><span>{String(patientCase.category)}</span></div>}
            {Boolean(patientCase.duration) && <div><label>Duration</label><span>{String(patientCase.duration)}</span></div>}
            {patientCase.severity != null && <div><label>Severity</label><span>{String(patientCase.severity)}/10</span></div>}
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: 'var(--space-sm)' }}>
            This information has been recorded for your doctor&apos;s review.
          </p>
        </div>
      )}

      {/* Input area */}
      {sessionStatus === 'active' && (
        <div className={styles.inputArea}>
          <div className={styles.inputRow}>
            {/* Real Voice button */}
            <button
              id="intake-voice-btn"
              className={`${styles.voiceBtn} ${voiceState === 'LISTENING' ? styles.recording : ''}`}
              onClick={voiceState === 'LISTENING' ? stopRecording : startRecording}
              disabled={sending || voiceState === 'PROCESSING'}
              title={voiceState === 'LISTENING' ? 'Click to finish speaking' : 'Click to speak'}
              type="button"
            >
              {voiceState === 'LISTENING' ? (
                <IconMicOff size={18} />
              ) : voiceState === 'PROCESSING' ? (
                <IconActivity size={18} />
              ) : (
                <IconMic size={18} />
              )}
            </button>

            {/* Text input */}
            <input
              id="intake-text-input"
              type="text"
              className={styles.textInput}
              placeholder={voiceState === 'LISTENING' ? 'Listening to speech...' : 'Type your symptoms or concern...'}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              disabled={sending || voiceState === 'LISTENING' || voiceState === 'PROCESSING'}
            />

            {/* Send button */}
            <button
              id="intake-send-btn"
              className={styles.sendBtn}
              onClick={handleSend}
              disabled={!input.trim() || sending || voiceState === 'LISTENING'}
              type="button"
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <IconSend size={16} />
            </button>
          </div>

          {/* Quick finish action */}
          {messages.length >= 2 && !surveyComplete && (
            <div style={{ textAlign: 'center', marginTop: 'var(--space-xs)' }}>
              <button
                id="intake-finish-btn"
                onClick={handleComplete}
                className="btn btn-secondary"
                style={{ fontSize: '0.75rem', padding: '4px 12px', width: 'auto', display: 'inline-flex' }}
                type="button"
              >
                Done / Finish Assessment
              </button>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
