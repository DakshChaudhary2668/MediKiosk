'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  getDoctorQueue,
  callPatientTurn,
  startConsultation,
  submitConsultation,
  QueueItem,
  PrescriptionItem,
  clearToken,
} from '@/lib/api';

const PRIORITY_BADGES: Record<string, { label: string; bg: string; text: string }> = {
  P0: { label: 'P0 Emergency', bg: '#FEF2F2', text: '#DC2626' },
  P1: { label: 'P1 Urgent', bg: '#FFF7ED', text: '#EA580C' },
  P2: { label: 'P2 Standard', bg: '#EFF6FF', text: '#2563EB' },
  P3: { label: 'P3 Routine', bg: '#F0FDF4', text: '#16A34A' },
};

export default function DoctorPortalPage() {
  const router = useRouter();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePatient, setActivePatient] = useState<QueueItem | null>(null);

  // Consultation form state
  const [diagnosis, setDiagnosis] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([
    { medicine_name: '', dosage: '', frequency: '1-0-1 (After Food)', duration_days: 5, instructions: '' },
  ]);
  const [followUpAdvice, setFollowUpAdvice] = useState('Return in 5 days if symptoms do not improve.');
  const [referralSpecialty, setReferralSpecialty] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [consultSuccessMsg, setConsultSuccessMsg] = useState<string | null>(null);

  async function loadQueue() {
    try {
      const data = await getDoctorQueue();
      setQueue(data);
      // Auto-select if currently none selected or if active consultation exists
      const inConsult = data.find((p) => p.status === 'in_consultation' || p.status === 'called');
      if (inConsult && !activePatient) {
        setActivePatient(inConsult);
      } else if (data.length > 0 && !activePatient) {
        setActivePatient(data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadQueue();
    const timer = setInterval(loadQueue, 8000);
    return () => clearInterval(timer);
  }, []);

  async function handleCallPatient(patient: QueueItem) {
    try {
      await callPatientTurn(patient.session_id);
      setActivePatient({ ...patient, status: 'called' });
      await loadQueue();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to call patient');
    }
  }

  async function handleStartConsult(patient: QueueItem) {
    try {
      await startConsultation(patient.session_id);
      setActivePatient({ ...patient, status: 'in_consultation' });
      await loadQueue();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to start consultation');
    }
  }

  function handleAddPrescription() {
    setPrescriptions([
      ...prescriptions,
      { medicine_name: '', dosage: '', frequency: '1-0-1 (After Food)', duration_days: 5, instructions: '' },
    ]);
  }

  function handleRemovePrescription(index: number) {
    if (prescriptions.length === 1) return;
    setPrescriptions(prescriptions.filter((_, i) => i !== index));
  }

  function updatePrescriptionField(index: number, field: keyof PrescriptionItem, val: string | number) {
    const updated = [...prescriptions];
    updated[index] = { ...updated[index], [field]: val };
    setPrescriptions(updated);
  }

  async function handleFinishConsultation() {
    if (!activePatient) return;
    if (!diagnosis.trim()) {
      alert('Please enter a clinical diagnosis.');
      return;
    }

    const validRx = prescriptions.filter((p) => p.medicine_name.trim().length > 0);
    if (validRx.length === 0) {
      if (!confirm('No prescription items added. Complete consultation with advice only?')) {
        return;
      }
    }

    setSubmitting(true);
    try {
      await submitConsultation(activePatient.session_id, {
        diagnosis,
        clinical_notes: clinicalNotes,
        prescriptions: validRx,
        follow_up_advice: followUpAdvice,
        referral_specialty: referralSpecialty,
      });

      setConsultSuccessMsg(`✅ Consultation completed for Token #${activePatient.token_number}. Digital Rx issued.`);
      // Reset form
      setDiagnosis('');
      setClinicalNotes('');
      setPrescriptions([
        { medicine_name: '', dosage: '', frequency: '1-0-1 (After Food)', duration_days: 5, instructions: '' },
      ]);
      setReferralSpecialty('');
      setActivePatient(null);
      await loadQueue();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to submit consultation');
    } finally {
      setSubmitting(false);
    }
  }

  function handleSignOut() {
    clearToken();
    router.push('/');
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', padding: '1.5rem' }}>
      {/* Top Header */}
      <header
        style={{
          maxWidth: '1300px',
          margin: '0 auto 1.5rem auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--color-surface)',
          padding: '1rem 1.5rem',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-sm)',
          border: '1px solid var(--color-border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="logo-mark" style={{ marginBottom: 0 }}>
            <span className="icon">🩺</span>
            <span>MediKiosk Doctor Portal</span>
          </div>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              background: 'rgba(59, 130, 246, 0.1)',
              color: 'var(--color-secondary)',
              padding: '0.25rem 0.625rem',
              borderRadius: 'var(--radius-full)',
            }}
          >
            OPD Clinical Turn Queue
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link
            href="/admin"
            style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--color-primary)',
              padding: '0.5rem 0.875rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-bg)',
            }}
          >
            🛡️ Admin Triage Gate
          </Link>
          <Link
            href="/dashboard"
            style={{
              fontSize: '0.875rem',
              fontWeight: 500,
              color: 'var(--color-text-secondary)',
            }}
          >
            Patient Dashboard
          </Link>
          <button
            onClick={handleSignOut}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div style={{ maxWidth: '1300px', margin: '0 auto' }}>
        {consultSuccessMsg && (
          <div
            className="alert alert-success"
            style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <span>{consultSuccessMsg}</span>
            <button
              onClick={() => setConsultSuccessMsg(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}
            >
              ✕
            </button>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '1.5rem', alignItems: 'start' }}>
          {/* Left Column: Live Doctor Turn Queue */}
          <section
            style={{
              background: 'var(--color-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border)',
              padding: '1.25rem',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-text)' }}>
                Waiting Queue ({queue.filter((q) => q.status !== 'completed').length})
              </h2>
              <button
                onClick={loadQueue}
                style={{
                  background: 'none',
                  border: '1px solid var(--color-border)',
                  padding: '0.25rem 0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                }}
              >
                ↻ Refresh
              </button>
            </div>

            {loading && queue.length === 0 ? (
              <div className="loading-overlay">
                <span className="spinner" /> Loading queue...
              </div>
            ) : queue.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-text-secondary)' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>☕</div>
                <div style={{ fontWeight: 600, fontSize: '1rem' }}>Queue is Empty</div>
                <p style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                  Patients approved by the Admin Triage gate will appear here in priority order.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {queue.map((item) => {
                  const pBadge = PRIORITY_BADGES[item.priority] || PRIORITY_BADGES.P2;
                  const isSelected = activePatient?.session_id === item.session_id;
                  const isDone = item.status === 'completed';

                  return (
                    <div
                      key={item.session_id}
                      onClick={() => !isDone && setActivePatient(item)}
                      style={{
                        padding: '1rem',
                        borderRadius: 'var(--radius-md)',
                        border: `2px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                        background: isDone
                          ? 'var(--color-surface-alt)'
                          : isSelected
                          ? 'rgba(13, 148, 136, 0.04)'
                          : 'var(--color-surface)',
                        opacity: isDone ? 0.6 : 1,
                        cursor: isDone ? 'default' : 'pointer',
                        transition: 'all var(--transition)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span
                            style={{
                              fontWeight: 800,
                              fontSize: '1rem',
                              color: 'var(--color-primary-dark)',
                              background: 'rgba(13, 148, 136, 0.1)',
                              padding: '0.15rem 0.5rem',
                              borderRadius: 'var(--radius-sm)',
                            }}
                          >
                            #{item.token_number}
                          </span>
                          <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{item.patient_name}</span>
                        </div>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '0.15rem 0.45rem',
                            borderRadius: 'var(--radius-sm)',
                            background: pBadge.bg,
                            color: pBadge.text,
                          }}
                        >
                          {item.priority}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
                        {item.chief_complaint || 'General medical consultation'}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color:
                              item.status === 'in_consultation'
                                ? 'var(--color-primary)'
                                : item.status === 'called'
                                ? 'var(--color-warning)'
                                : 'var(--color-text-muted)',
                          }}
                        >
                          Status: {item.status.replace('_', ' ').toUpperCase()}
                        </span>

                        {!isDone && (
                          <div style={{ display: 'flex', gap: '0.35rem' }}>
                            {item.status === 'queued' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCallPatient(item);
                                }}
                                className="btn btn-secondary"
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                              >
                                📢 Call In
                              </button>
                            )}
                            {(item.status === 'called' || item.status === 'queued') && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartConsult(item);
                                }}
                                className="btn btn-primary"
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                              >
                                Start
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Right Column: Clinical Intake Summary + Rx Prescription Workstation */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {activePatient ? (
              <>
                {/* 1. AI Intake & Triage Overview Card */}
                <div
                  style={{
                    background: 'var(--color-surface)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--color-border)',
                    padding: '1.5rem',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderBottom: '1px solid var(--color-border)',
                      paddingBottom: '0.875rem',
                      marginBottom: '1rem',
                    }}
                  >
                    <div>
                      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)' }}>
                        Token #{activePatient.token_number} — {activePatient.patient_name}
                      </h2>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                        Category: <strong style={{ textTransform: 'capitalize' }}>{activePatient.category || 'General'}</strong> · Priority:{' '}
                        <strong>{activePatient.priority}</strong> · Status:{' '}
                        <strong style={{ color: 'var(--color-primary)' }}>{activePatient.status.toUpperCase()}</strong>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {activePatient.status === 'queued' && (
                        <button
                          onClick={() => handleCallPatient(activePatient)}
                          className="btn btn-secondary"
                          style={{ padding: '0.5rem 1rem' }}
                        >
                          📢 Call Patient
                        </button>
                      )}
                      {activePatient.status !== 'in_consultation' && (
                        <button
                          onClick={() => handleStartConsult(activePatient)}
                          className="btn btn-primary"
                          style={{ padding: '0.5rem 1rem' }}
                        >
                          ▶ Begin Consultation
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Clinical Dossier Quick Facts */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div style={{ background: 'var(--color-surface-alt)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                        CHIEF COMPLAINT
                      </div>
                      <div style={{ fontWeight: 600, color: 'var(--color-text)', fontSize: '0.875rem' }}>
                        {activePatient.case?.chief_complaint || 'Acute symptoms'}
                      </div>
                    </div>

                    <div style={{ background: 'var(--color-surface-alt)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                        DURATION & SEVERITY
                      </div>
                      <div style={{ fontWeight: 600, color: 'var(--color-text)', fontSize: '0.875rem' }}>
                        {activePatient.case?.duration || 'Unknown'} · Severity: {activePatient.case?.severity || 'N/A'}/10
                      </div>
                    </div>

                    <div style={{ background: 'var(--color-surface-alt)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                        REPORTED SYMPTOMS
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--color-text)' }}>
                        {activePatient.case?.symptoms?.length ? activePatient.case.symptoms.join(', ') : 'None listed'}
                      </div>
                    </div>
                  </div>

                  {/* AI Clinical Urgency Note */}
                  {activePatient.assessment && (
                    <div
                      style={{
                        background: 'rgba(13, 148, 136, 0.05)',
                        borderLeft: '4px solid var(--color-primary)',
                        padding: '0.75rem 1rem',
                        borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                        fontSize: '0.8125rem',
                      }}
                    >
                      <strong>🤖 AI Triage Brief:</strong>{' '}
                      {activePatient.assessment?.uncertainty?.reasons?.length
                        ? activePatient.assessment.uncertainty.reasons.join('. ')
                        : activePatient.assessment?.safety_flags?.length
                        ? `Safety flags: ${activePatient.assessment.safety_flags.join(', ')}`
                        : 'Standard clinical intake completed. Pre-triage priority assigned.'}
                    </div>
                  )}
                </div>

                {/* 2. Doctor Consultation & Prescription Builder */}
                <div
                  style={{
                    background: 'var(--color-surface)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--color-border)',
                    padding: '1.5rem',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--color-text)' }}>
                    📝 Clinical Diagnosis & Digital Prescription (Rx)
                  </h3>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                    <div className="field" style={{ marginBottom: 0 }}>
                      <label className="label">Confirmed Diagnosis *</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="e.g. Acute Upper Respiratory Tract Infection (URTI)"
                        value={diagnosis}
                        onChange={(e) => setDiagnosis(e.target.value)}
                      />
                    </div>

                    <div className="field" style={{ marginBottom: 0 }}>
                      <label className="label">Referral / Specialty Follow-up (Optional)</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="e.g. Pulmonology / ENT Specialist"
                        value={referralSpecialty}
                        onChange={(e) => setReferralSpecialty(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="field">
                    <label className="label">Doctor's Clinical Notes & Observations</label>
                    <textarea
                      className="input"
                      rows={2}
                      placeholder="e.g. Chest clear on auscultation. Throat congested without exudates. Advised hydration and rest."
                      value={clinicalNotes}
                      onChange={(e) => setClinicalNotes(e.target.value)}
                      style={{ resize: 'vertical' }}
                    />
                  </div>

                  {/* Prescription Item List */}
                  <div style={{ marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <label className="label" style={{ marginBottom: 0 }}>
                        Rx Medications
                      </label>
                      <button
                        type="button"
                        onClick={handleAddPrescription}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--color-primary)',
                          fontWeight: 600,
                          fontSize: '0.8125rem',
                          cursor: 'pointer',
                        }}
                      >
                        + Add Medicine
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {prescriptions.map((rx, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '2fr 1fr 1.5fr 1fr 2fr auto',
                            gap: '0.5rem',
                            alignItems: 'center',
                            background: 'var(--color-surface-alt)',
                            padding: '0.5rem',
                            borderRadius: 'var(--radius-md)',
                          }}
                        >
                          <input
                            type="text"
                            className="input"
                            style={{ padding: '0.4rem 0.6rem', fontSize: '0.8125rem' }}
                            placeholder="Medicine Name (e.g. Paracetamol)"
                            value={rx.medicine_name}
                            onChange={(e) => updatePrescriptionField(idx, 'medicine_name', e.target.value)}
                          />
                          <input
                            type="text"
                            className="input"
                            style={{ padding: '0.4rem 0.6rem', fontSize: '0.8125rem' }}
                            placeholder="Dosage (500mg)"
                            value={rx.dosage}
                            onChange={(e) => updatePrescriptionField(idx, 'dosage', e.target.value)}
                          />
                          <select
                            className="input"
                            style={{ padding: '0.4rem 0.6rem', fontSize: '0.8125rem' }}
                            value={rx.frequency}
                            onChange={(e) => updatePrescriptionField(idx, 'frequency', e.target.value)}
                          >
                            <option value="1-0-1 (After Food)">1-0-1 (Morning & Night)</option>
                            <option value="1-1-1 (After Food)">1-1-1 (Thrice daily)</option>
                            <option value="0-0-1 (At Bedtime)">0-0-1 (Bedtime)</option>
                            <option value="1-0-0 (Morning)">1-0-0 (Morning)</option>
                            <option value="SOS (As needed)">SOS (When needed)</option>
                          </select>
                          <input
                            type="number"
                            className="input"
                            style={{ padding: '0.4rem 0.6rem', fontSize: '0.8125rem' }}
                            placeholder="Days"
                            value={rx.duration_days}
                            onChange={(e) => updatePrescriptionField(idx, 'duration_days', parseInt(e.target.value) || 1)}
                          />
                          <input
                            type="text"
                            className="input"
                            style={{ padding: '0.4rem 0.6rem', fontSize: '0.8125rem' }}
                            placeholder="Instructions"
                            value={rx.instructions || ''}
                            onChange={(e) => updatePrescriptionField(idx, 'instructions', e.target.value)}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemovePrescription(idx)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--color-danger)',
                              cursor: 'pointer',
                              fontSize: '1rem',
                              padding: '0.25rem',
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="field">
                    <label className="label">Follow-up & Patient Care Advice</label>
                    <input
                      type="text"
                      className="input"
                      value={followUpAdvice}
                      onChange={(e) => setFollowUpAdvice(e.target.value)}
                    />
                  </div>

                  {/* Submission Button */}
                  <button
                    type="button"
                    onClick={handleFinishConsultation}
                    disabled={submitting}
                    className="btn btn-primary"
                    style={{ height: '48px', fontSize: '1rem', marginTop: '0.5rem' }}
                  >
                    {submitting ? 'Generating Digital Rx...' : '✓ Complete Consultation & Issue Digital Rx'}
                  </button>
                </div>
              </>
            ) : (
              <div
                style={{
                  background: 'var(--color-surface)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--color-border)',
                  padding: '5rem 1rem',
                  textAlign: 'center',
                  color: 'var(--color-text-secondary)',
                }}
              >
                <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>👈</div>
                <div style={{ fontWeight: 600, fontSize: '1.125rem' }}>Select a Patient from Queue</div>
                <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
                  Click on any patient in the waiting queue on the left to start their consultation.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
