'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  listSessions,
  createSession,
  getPatientQueueStatus,
  PatientQueueStatus,
  clearToken,
} from '@/lib/api';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active: { label: 'In Progress', color: 'var(--color-warning)' },
  completed: { label: 'Completed', color: 'var(--color-success)' },
  red_flagged: { label: 'Emergency Flagged', color: 'var(--color-danger)' },
  cancelled: { label: 'Cancelled', color: 'var(--color-text-muted)' },
};

export default function DashboardPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Array<Record<string, unknown>>>([]);
  const [queueStatus, setQueueStatus] = useState<PatientQueueStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  async function loadData() {
    try {
      const [sessList, qStatus] = await Promise.all([
        listSessions().catch(() => []),
        getPatientQueueStatus().catch(() => null),
      ]);
      setSessions(sessList);
      setQueueStatus(qStatus);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 6000);
    return () => clearInterval(timer);
  }, []);

  async function handleNewIntake() {
    setCreating(true);
    try {
      const lang = localStorage.getItem('medikiosk_language') || 'en';
      const data = await createSession(undefined, lang);
      router.push(`/intake/${data.session_id}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create session');
    } finally {
      setCreating(false);
    }
  }

  function handleLogout() {
    clearToken();
    localStorage.removeItem('medikiosk_user_id');
    router.push('/');
  }

  return (
    <main className="container" style={{ maxWidth: '720px', paddingTop: '1.5rem', paddingBottom: '3rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div className="logo-mark" style={{ marginBottom: 0 }}>
          <span className="icon">🏥</span>
          <span>MediKiosk</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link
            href="/admin"
            style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-primary-dark)' }}
          >
            🛡️ Admin Gate
          </Link>
          <Link
            href="/doctor"
            style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-secondary)' }}
          >
            🩺 Doctor Queue
          </Link>
          <button
            onClick={handleLogout}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              fontSize: '0.8125rem',
            }}
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Live OPD Queue Tracker Card (When Active) */}
      {queueStatus && queueStatus.has_active_intake && (
        <div
          className="card"
          style={{
            marginBottom: '1.5rem',
            border: '2px solid var(--color-primary)',
            background: 'linear-gradient(180deg, #FFFFFF, #F0FDFA)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.25rem' }}>🎫</span>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-text)' }}>
                Live OPD Token Tracker
              </h3>
            </div>
            {queueStatus.token_number && (
              <span
                style={{
                  fontSize: '1.125rem',
                  fontWeight: 800,
                  color: 'white',
                  background: 'var(--color-primary)',
                  padding: '0.25rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                Token #{queueStatus.token_number}
              </span>
            )}
          </div>

          {/* Progress Timeline Stepper */}
          <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', marginBottom: '1.5rem' }}>
            {[
              { key: 'intake', label: '1. AI Intake' },
              { key: 'awaiting_triage', label: '2. Clinical Triage' },
              { key: 'queued', label: '3. In Queue' },
              { key: 'in_consultation', label: '4. Consultation' },
              { key: 'completed', label: '5. Rx Ready' },
            ].map((step, idx) => {
              const stepKeys = ['intake', 'awaiting_triage', 'queued', 'called', 'in_consultation', 'completed'];
              const currentIdx = stepKeys.indexOf(queueStatus.status);
              const targetIdx = stepKeys.indexOf(step.key);
              const isDone = currentIdx >= targetIdx;
              const isCurrent =
                queueStatus.status === step.key ||
                (step.key === 'in_consultation' && queueStatus.status === 'called');

              return (
                <div key={idx} style={{ textAlign: 'center', flex: 1, zIndex: 1 }}>
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      margin: '0 auto 0.25rem auto',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: isDone ? 'var(--color-primary)' : 'var(--color-border)',
                      color: isDone ? 'white' : 'var(--color-text-muted)',
                      boxShadow: isCurrent ? '0 0 0 3px rgba(13, 148, 136, 0.25)' : 'none',
                    }}
                  >
                    {isDone ? '✓' : idx + 1}
                  </div>
                  <div
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: isCurrent ? 700 : 500,
                      color: isCurrent ? 'var(--color-primary-dark)' : 'var(--color-text-secondary)',
                    }}
                  >
                    {step.label}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dynamic Status Callout Banner */}
          {queueStatus.status === 'awaiting_triage' && (
            <div className="alert alert-warning" style={{ marginBottom: 0 }}>
              <span>
                ⏳ <strong>AI Intake submitted.</strong> Awaiting quick Super Admin review & priority confirmation before
                doctor queue admission.
              </span>
            </div>
          )}

          {queueStatus.status === 'queued' && (
            <div className="alert alert-success" style={{ marginBottom: 0 }}>
              <span>
                🩺 <strong>You are in the Doctor Queue!</strong> Your position is{' '}
                <strong>#{queueStatus.queue_position || 1}</strong> in line (~{queueStatus.estimated_wait_minutes || 5} min
                estimated wait).
              </span>
            </div>
          )}

          {queueStatus.status === 'called' && (
            <div
              className="alert alert-warning"
              style={{
                background: '#FEF3C7',
                borderColor: '#F59E0B',
                color: '#92400E',
                animation: 'pulse 1.5s infinite',
                marginBottom: 0,
              }}
            >
              <span>
                📢 <strong>Doctor is calling your token now!</strong> Please proceed to <strong>Consultation Room 3</strong>.
              </span>
            </div>
          )}

          {queueStatus.status === 'in_consultation' && (
            <div className="alert alert-success" style={{ marginBottom: 0 }}>
              <span>
                🩺 <strong>Consultation in progress</strong> with Doctor.
              </span>
            </div>
          )}

          {/* 5. Completed Digital Prescription Box */}
          {queueStatus.status === 'completed' && queueStatus.consultation && (
            <div
              style={{
                background: 'white',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                marginTop: '1rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                  📄 Official Digital Prescription (Rx)
                </h4>
                <button
                  onClick={() => window.print()}
                  className="btn btn-secondary"
                  style={{ width: 'auto', padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}
                >
                  🖨 Print / Save
                </button>
              </div>

              <div style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                <strong>Confirmed Diagnosis:</strong> {queueStatus.consultation.diagnosis}
              </div>

              {queueStatus.consultation.clinical_notes && (
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginBottom: '0.75rem' }}>
                  <strong>Doctor Notes:</strong> {queueStatus.consultation.clinical_notes}
                </div>
              )}

              {queueStatus.consultation.prescriptions?.length > 0 && (
                <div style={{ marginTop: '0.75rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: '0.35rem' }}>
                    MEDICATIONS
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {queueStatus.consultation.prescriptions.map((p, i) => (
                      <div
                        key={i}
                        style={{
                          background: 'var(--color-surface-alt)',
                          padding: '0.5rem 0.75rem',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.8125rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div>
                          <strong>{p.medicine_name}</strong> {p.dosage && `(${p.dosage})`}
                          {p.instructions && <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{p.instructions}</div>}
                        </div>
                        <div style={{ textAlign: 'right', fontWeight: 600, color: 'var(--color-primary-dark)' }}>
                          {p.frequency} · {p.duration_days} days
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {queueStatus.consultation.follow_up_advice && (
                <div style={{ fontSize: '0.8125rem', marginTop: '0.75rem', color: 'var(--color-text-secondary)' }}>
                  <strong>Advice:</strong> {queueStatus.consultation.follow_up_advice}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Start New AI Health Intake CTA */}
      <div
        className="card"
        style={{
          marginBottom: '1.5rem',
          textAlign: 'center',
          background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
          color: 'white',
          border: 'none',
        }}
      >
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 'var(--space-sm)' }}>
          Start AI Health Assessment
        </h2>
        <p style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '1.25rem' }}>
          Answer a few voice/text questions about your health concern before seeing the doctor
        </p>
        <button
          className="btn"
          onClick={handleNewIntake}
          disabled={creating}
          style={{ background: 'white', color: 'var(--color-primary)', fontWeight: 700, maxWidth: '240px', margin: '0 auto' }}
        >
          {creating ? <span className="spinner" /> : '🩺 Begin New Intake'}
        </button>
      </div>

      {/* Past Sessions List */}
      <div className="card">
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 'var(--space-md)' }}>Past Intake Sessions</h3>
        {loading ? (
          <div className="loading-overlay">
            <span className="spinner" /> Loading...
          </div>
        ) : sessions.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: 'var(--space-lg) 0' }}>
            No sessions yet. Start your first AI intake above!
          </p>
        ) : (
          sessions.map((s, i) => {
            const status = STATUS_LABELS[String(s.status)] || STATUS_LABELS.active;
            return (
              <div
                key={i}
                onClick={() => router.push(`/intake/${s.id}`)}
                style={{
                  padding: 'var(--space-md)',
                  background: 'var(--color-surface-alt)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: 'var(--space-sm)',
                  cursor: 'pointer',
                  transition: 'all var(--transition)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                    {String(s.category || 'General Intake').replace(/_/g, ' ')}
                  </div>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                    {new Date(String(s.started_at)).toLocaleDateString()} ·{' '}
                    {new Date(String(s.started_at)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: status.color,
                    background: `${status.color}15`,
                    padding: '0.25rem 0.5rem',
                    borderRadius: 'var(--radius-full)',
                  }}
                >
                  {status.label}
                </span>
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}
