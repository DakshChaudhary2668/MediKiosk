/**
 * Typed API client for MediKiosk backend.
 * All requests go through Next.js rewrite → FastAPI.
 */

const API_BASE = '';  // uses Next.js rewrites to proxy /api/* → FastAPI

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('medikiosk_token');
}

export function setToken(token: string) {
  localStorage.setItem('medikiosk_token', token);
}

export function clearToken() {
  localStorage.removeItem('medikiosk_token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  // Only set Content-Type for non-FormData requests
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errBody.detail || `Request failed: ${res.status}`);
  }

  return res.json();
}

// --- Auth ---

export async function register(email: string, password: string, fullName?: string) {
  return request<{ user_id: string; email: string }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, full_name: fullName }),
  });
}

export async function login(email: string, password: string) {
  const data = await request<{
    access_token: string;
    refresh_token: string;
    user_id: string;
    email: string;
  }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setToken(data.access_token);
  return data;
}

export async function getMe() {
  return request<{ user_id: string; email: string }>('/api/auth/me');
}

// --- Patient ---

export async function getProfile() {
  return request<Record<string, unknown>>('/api/patient/profile');
}

export async function updateProfile(data: Record<string, unknown>) {
  return request('/api/patient/profile', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function recordConsent(consentGiven: boolean) {
  return request('/api/patient/consent', {
    method: 'POST',
    body: JSON.stringify({ consent_given: consentGiven }),
  });
}

export async function listSessions() {
  return request<Array<Record<string, unknown>>>('/api/patient/sessions');
}

export async function uploadDocument(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return request<{ storage_path: string; file_name: string }>('/api/patient/documents/upload', {
    method: 'POST',
    body: formData,
  });
}

export async function listDocuments() {
  return request<Array<Record<string, unknown>>>('/api/patient/documents');
}

// --- Intake ---

export async function createSession(category?: string, language: string = 'en') {
  return request<{ session_id: string; greeting: string }>('/api/intake/session', {
    method: 'POST',
    body: JSON.stringify({ category, language }),
  });
}

export async function sendMessage(sessionId: string, message: string, inputMode: string = 'text') {
  return request<{
    ai_message: string;
    category: string | null;
    red_flag: boolean;
    survey_complete: boolean;
    session_status: string;
    answered_fields: string[];
    missing_fields: string[];
  }>('/api/intake/message', {
    method: 'POST',
    body: JSON.stringify({ session_id: sessionId, message, input_mode: inputMode }),
  });
}

export async function sendVoice(sessionId: string, audioBlob: Blob) {
  const formData = new FormData();
  formData.append('session_id', sessionId);
  formData.append('audio', audioBlob, 'recording.webm');
  return request<{
    ai_message: string;
    transcript: string;
    category: string | null;
    red_flag: boolean;
    survey_complete: boolean;
    session_status: string;
    tts_audio?: string;
  }>('/api/intake/voice', {
    method: 'POST',
    body: formData,
  });
}

export async function getSession(sessionId: string) {
  return request<{
    session: Record<string, unknown>;
    messages: Array<Record<string, unknown>>;
    case: Record<string, unknown> | null;
  }>(`/api/intake/session/${sessionId}`);
}

export async function completeSession(sessionId: string) {
  return request<{ status: string }>(`/api/intake/session/${sessionId}/complete`, {
    method: 'POST',
  });
}

// --- Triage (Admin Gate) ---

export interface EvidenceItem {
  source?: string;
  field: string;
  summary: string;
}

export interface UncertaintyInfo {
  needs_human_review?: boolean;
  reasons?: string[];
  missing_information?: string[];
  contradictions?: string[];
}

export interface PreTriageAssessment {
  assessment_id: string;
  intake_id: string;
  patient_id: string;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  confidence_band?: 'high' | 'medium' | 'low';
  confidence_score?: number;
  uncertainty?: UncertaintyInfo;
  safety_flags?: string[];
  evidence?: EvidenceItem[];
  recommended_next_action?: string;
  generated_at?: string;
  status?: string;
}

export interface PendingTriageItem {
  assessment: PreTriageAssessment;
  case: Record<string, any>;
  patient_id: string;
  session_id: string;
  submitted_at: string;
  status: string;
}

export async function getPendingTriage() {
  return request<PendingTriageItem[]>('/api/triage/pending');
}

export async function triggerPreTriage(sessionId: string) {
  return request<PreTriageAssessment>(`/api/triage/assess?session_id=${encodeURIComponent(sessionId)}`, {
    method: 'POST',
  });
}

export async function reviewTriage(
  assessmentId: string,
  action: 'approve' | 'override' | 'escalate' | 'reject',
  priority?: 'P0' | 'P1' | 'P2' | 'P3',
  overrideReason?: string,
  notes?: string,
) {
  return request<{
    message: string;
    token_number?: number;
    priority?: string;
    status: string;
  }>(`/api/triage/${assessmentId}/review`, {
    method: 'POST',
    body: JSON.stringify({
      action,
      priority,
      override_reason: overrideReason,
      notes,
    }),
  });
}

// --- Doctor Queue & Consultation ---

export interface QueueItem {
  token_number: number;
  session_id: string;
  patient_id: string;
  patient_name: string;
  age?: number;
  gender?: string;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  status: 'queued' | 'called' | 'in_consultation' | 'completed';
  chief_complaint?: string;
  category?: string;
  arrival_time: string;
  approved_at: string;
  case?: Record<string, any>;
  assessment?: PreTriageAssessment;
}

export interface PrescriptionItem {
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration_days: number;
  instructions?: string;
}

export interface ConsultationRecord {
  consultation_id: string;
  session_id: string;
  patient_id: string;
  doctor_id: string;
  token_number: number;
  diagnosis: string;
  clinical_notes: string;
  prescriptions: PrescriptionItem[];
  follow_up_advice?: string;
  referral_specialty?: string;
  created_at: string;
}

export async function getDoctorQueue() {
  return request<QueueItem[]>('/api/doctor/queue');
}

export async function callPatientTurn(sessionId: string) {
  return request<{ status: string; message: string }>(`/api/doctor/turn/${sessionId}/call`, {
    method: 'POST',
  });
}

export async function startConsultation(sessionId: string) {
  return request<{ status: string; message: string }>(`/api/doctor/turn/${sessionId}/start`, {
    method: 'POST',
  });
}

export async function submitConsultation(
  sessionId: string,
  data: {
    diagnosis: string;
    clinical_notes: string;
    prescriptions: PrescriptionItem[];
    follow_up_advice?: string;
    referral_specialty?: string;
  },
) {
  return request<ConsultationRecord>(`/api/doctor/turn/${sessionId}/consult`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// --- Patient Live Tracker ---

export interface PatientQueueStatus {
  has_active_intake: boolean;
  status: 'intake' | 'awaiting_triage' | 'queued' | 'called' | 'in_consultation' | 'completed';
  token_number?: number;
  priority?: 'P0' | 'P1' | 'P2' | 'P3';
  queue_position?: number;
  estimated_wait_minutes?: number;
  consultation?: ConsultationRecord;
  session_id?: string;
}

export async function getPatientQueueStatus(sessionId?: string) {
  const query = sessionId ? `?session_id=${encodeURIComponent(sessionId)}` : '';
  return request<PatientQueueStatus>(`/api/patient/queue-status${query}`);
}
