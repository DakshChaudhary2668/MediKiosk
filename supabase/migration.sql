-- MediKiosk Supabase Schema Migration
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- 1. patients (extends auth.users)
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  age INTEGER,
  gender TEXT,
  blood_group TEXT,
  phone TEXT,
  emergency_contact TEXT,
  consent_given BOOLEAN DEFAULT FALSE,
  consent_given_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. patient_sessions
CREATE TABLE IF NOT EXISTS patient_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'red_flagged', 'cancelled')),
  category TEXT,
  language TEXT DEFAULT 'en',
  input_mode TEXT DEFAULT 'text',
  conversation_state JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 3. conversation_messages
CREATE TABLE IF NOT EXISTS conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES patient_sessions(id) ON DELETE CASCADE,
  speaker TEXT NOT NULL CHECK (speaker IN ('patient', 'assistant')),
  content TEXT NOT NULL,
  original_text TEXT,
  language TEXT,
  input_mode TEXT DEFAULT 'text',
  audio_path TEXT,
  stt_confidence NUMERIC,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. patient_cases (structured output)
CREATE TABLE IF NOT EXISTS patient_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID UNIQUE NOT NULL REFERENCES patient_sessions(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  chief_complaint TEXT,
  category TEXT,
  duration TEXT,
  severity INTEGER,
  symptoms JSONB DEFAULT '[]',
  negative_symptoms JSONB DEFAULT '[]',
  relevant_history JSONB DEFAULT '[]',
  current_medications JSONB DEFAULT '[]',
  allergies JSONB DEFAULT '[]',
  patient_concerns TEXT,
  red_flag_detected BOOLEAN DEFAULT FALSE,
  red_flag_details JSONB,
  completion_status TEXT DEFAULT 'incomplete',
  raw_extracted_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. medical_documents
CREATE TABLE IF NOT EXISTS medical_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  file_name TEXT,
  file_type TEXT,
  storage_path TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. triage_assessments (Super Admin Review Gate & AI Acuity)
CREATE TABLE IF NOT EXISTS triage_assessments (
  assessment_id TEXT PRIMARY KEY,
  intake_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  patient_id TEXT NOT NULL,
  priority TEXT CHECK (priority IN ('P0', 'P1', 'P2', 'P3')),
  confidence_band TEXT DEFAULT 'medium',
  confidence_score NUMERIC DEFAULT 0.8,
  uncertainty JSONB DEFAULT '{}',
  safety_flags JSONB DEFAULT '[]',
  evidence JSONB DEFAULT '[]',
  recommended_next_action TEXT DEFAULT 'human_review',
  status TEXT NOT NULL DEFAULT 'awaiting_review' CHECK (status IN ('awaiting_review', 'approved', 'overridden', 'escalated', 'p0_escalated', 'rejected', 'assessment_failed')),
  final_priority TEXT,
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  override_reason TEXT,
  review_notes TEXT,
  case_snapshot JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. doctor_queue_items (Active Clinical Queue: P1, P2, P3 only. P0 bypasses directly to ER)
CREATE TABLE IF NOT EXISTS doctor_queue_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_number BIGINT UNIQUE NOT NULL,
  session_id TEXT UNIQUE NOT NULL,
  patient_id TEXT NOT NULL,
  patient_name TEXT NOT NULL,
  age INTEGER,
  gender TEXT,
  priority TEXT NOT NULL CHECK (priority IN ('P1', 'P2', 'P3')),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'called', 'in_consultation', 'completed', 'skipped')),
  chief_complaint TEXT,
  category TEXT,
  arrival_time TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ DEFAULT NOW(),
  called_at TIMESTAMPTZ,
  consultation_started_at TIMESTAMPTZ,
  consultation_completed_at TIMESTAMPTZ,
  case_snapshot JSONB DEFAULT '{}',
  assessment_snapshot JSONB DEFAULT '{}'
);

-- 9. consultation_records (Doctor-authored official diagnosis & prescriptions)
CREATE TABLE IF NOT EXISTS consultation_records (
  consultation_id TEXT PRIMARY KEY,
  session_id TEXT UNIQUE NOT NULL,
  patient_id TEXT NOT NULL,
  doctor_id TEXT NOT NULL,
  doctor_name TEXT DEFAULT 'Dr. Clinical Consultant',
  token_number BIGINT,
  diagnosis TEXT NOT NULL,
  clinical_notes TEXT NOT NULL,
  prescriptions JSONB DEFAULT '[]',
  follow_up_days INTEGER,
  general_advice TEXT,
  referral_specialty TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. emergency_events (P0 immediate emergency audit & coordination timeline)
CREATE TABLE IF NOT EXISTS emergency_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  patient_id TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'P0',
  signal_ids JSONB DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'p0_escalated' CHECK (status IN ('p0_escalated', 'alert_fired', 'acknowledged', 'handover', 'resolved')),
  coordination_notes TEXT,
  acknowledged_by TEXT,
  acknowledged_at TIMESTAMPTZ,
  timeline JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- === ROW LEVEL SECURITY ===

ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE triage_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_queue_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_events ENABLE ROW LEVEL SECURITY;

-- Patients: own data only
CREATE POLICY "patients_select_own" ON patients FOR SELECT USING (id = auth.uid());
CREATE POLICY "patients_update_own" ON patients FOR UPDATE USING (id = auth.uid());
CREATE POLICY "patients_insert_own" ON patients FOR INSERT WITH CHECK (id = auth.uid());

-- Sessions: own data only
CREATE POLICY "sessions_select_own" ON patient_sessions FOR SELECT USING (patient_id = auth.uid());
CREATE POLICY "sessions_insert_own" ON patient_sessions FOR INSERT WITH CHECK (patient_id = auth.uid());
CREATE POLICY "sessions_update_own" ON patient_sessions FOR UPDATE USING (patient_id = auth.uid());

-- Messages: own sessions only
CREATE POLICY "messages_select_own" ON conversation_messages FOR SELECT
  USING (session_id IN (SELECT id FROM patient_sessions WHERE patient_id = auth.uid()));
CREATE POLICY "messages_insert_own" ON conversation_messages FOR INSERT
  WITH CHECK (session_id IN (SELECT id FROM patient_sessions WHERE patient_id = auth.uid()));
CREATE POLICY "messages_update_own" ON conversation_messages FOR UPDATE
  USING (session_id IN (SELECT id FROM patient_sessions WHERE patient_id = auth.uid()));

-- Cases: own data only
CREATE POLICY "cases_select_own" ON patient_cases FOR SELECT USING (patient_id = auth.uid());
CREATE POLICY "cases_insert_own" ON patient_cases FOR INSERT WITH CHECK (patient_id = auth.uid());
CREATE POLICY "cases_update_own" ON patient_cases FOR UPDATE USING (patient_id = auth.uid());

-- Documents: own data only
CREATE POLICY "docs_select_own" ON medical_documents FOR SELECT USING (patient_id = auth.uid());
CREATE POLICY "docs_insert_own" ON medical_documents FOR INSERT WITH CHECK (patient_id = auth.uid());

-- Consultations: patient sees own consultation; doctor/admin see all
CREATE POLICY "consultations_select_own" ON consultation_records FOR SELECT
  USING (patient_id = auth.uid() OR auth.jwt() ->> 'role' IN ('doctor', 'admin', 'service_role'));

-- Doctor queue: patients can see their own item; doctor/admin can see queue
CREATE POLICY "queue_select_patient" ON doctor_queue_items FOR SELECT
  USING (patient_id = auth.uid() OR auth.jwt() ->> 'role' IN ('doctor', 'admin', 'service_role'));

-- === INDEXES ===

CREATE INDEX IF NOT EXISTS idx_sessions_patient ON patient_sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_messages_session ON conversation_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_cases_session ON patient_cases(session_id);
CREATE INDEX IF NOT EXISTS idx_cases_patient ON patient_cases(patient_id);
CREATE INDEX IF NOT EXISTS idx_docs_patient ON medical_documents(patient_id);
CREATE INDEX IF NOT EXISTS idx_triage_session ON triage_assessments(session_id);
CREATE INDEX IF NOT EXISTS idx_triage_patient ON triage_assessments(patient_id);
CREATE INDEX IF NOT EXISTS idx_triage_status ON triage_assessments(status);
CREATE INDEX IF NOT EXISTS idx_queue_status_priority ON doctor_queue_items(status, priority, arrival_time);
CREATE INDEX IF NOT EXISTS idx_consultation_session ON consultation_records(session_id);
CREATE INDEX IF NOT EXISTS idx_consultation_patient ON consultation_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_emergency_session ON emergency_events(session_id);

-- === STORAGE BUCKET ===
-- Create via Supabase Dashboard: Storage > New Bucket
-- Name: medical-documents
-- Public: OFF (private)
-- Allowed MIME types: image/*, application/pdf
-- Max file size: 10 MB
