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

-- === ROW LEVEL SECURITY ===

ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_documents ENABLE ROW LEVEL SECURITY;

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

-- Audit logs: service role only (no RLS policy for anon/authenticated)
-- The backend uses service_role key so RLS is bypassed for audit writes

-- === INDEXES ===

CREATE INDEX IF NOT EXISTS idx_sessions_patient ON patient_sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_messages_session ON conversation_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_cases_session ON patient_cases(session_id);
CREATE INDEX IF NOT EXISTS idx_cases_patient ON patient_cases(patient_id);
CREATE INDEX IF NOT EXISTS idx_docs_patient ON medical_documents(patient_id);

-- === STORAGE BUCKET ===
-- Create via Supabase Dashboard: Storage > New Bucket
-- Name: medical-documents
-- Public: OFF (private)
-- Allowed MIME types: image/*, application/pdf
-- Max file size: 10 MB
