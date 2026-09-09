'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  getPendingTriage,
  reviewTriage,
  PendingTriageItem,
  clearToken,
} from '@/lib/api';

const PRIORITY_THEMES: Record<string, { label: string; bg: string; text: string; border: string }> = {
  P0: { label: 'P0 — Emergency (Immediate)', bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' },
  P1: { label: 'P1 — Urgent (< 15 min)', bg: '#FFF7ED', text: '#EA580C', border: '#FED7AA' },
  P2: { label: 'P2 — Standard (< 60 min)', bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE' },
  P3: { label: 'P3 — Non-Urgent / Routine', bg: '#F0FDF4', text: '#16A34A', border: '#BBF7D0' },
};

export default function AdminTriagePage() {
  const router = useRouter();
  const [pendingList, setPendingList] = useState<PendingTriageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<PendingTriageItem | null>(null);

  // Override modal state
  const [overridePriority, setOverridePriority] = useState<'P0' | 'P1' | 'P2' | 'P3'>('P1');
  const [overrideReason, setOverrideReason] = useState('');
  const [notes, setNotes] = useState('');
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  async function loadPending() {
    try {
      const data = await getPendingTriage();
      setPendingList(data || []);
      if (data && data.length > 0) {
        setSelectedItem((prev) => {
          if (!prev) return data[0];
          const exists = data.find((d) => d.assessment?.assessment_id === prev.assessment?.assessment_id);
          return exists || data[0];
        });
      } else {
        setSelectedItem(null);
      }
    } catch (err) {
      console.error('Failed to load pending triage:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPending();
    const interval = setInterval(loadPending, 5000);
    return () => clearInterval(interval);
  }, []);

  async function handleApprove(item: PendingTriageItem) {
    const assessId = item.assessment?.assessment_id;
    if (!assessId) return;
    setActioningId(assessId);
    try {
      const res = await reviewTriage(assessId, 'approve');
      setStatusMessage(`✅ Patient approved into Doctor Queue with Token #${res.token_number}`);
      await loadPending();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Approval failed');
    } finally {
      setActioningId(null);
    }
  }

  async function handleEscalate(item: PendingTriageItem) {
    const assessId = item.assessment?.assessment_id;
    if (!assessId) return;
    if (!confirm('Are you sure you want to escalate this case directly to Emergency Resuscitation (P0)?')) return;
    setActioningId(assessId);
    try {
      await reviewTriage(assessId, 'escalate');
      setStatusMessage('🚨 Emergency protocol activated: Patient escalated to ER.');
      await loadPending();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Escalation failed');
    } finally {
      setActioningId(null);
    }
  }

  async function handleOverrideSubmit() {
    if (!selectedItem?.assessment?.assessment_id) return;
    if (!overrideReason.trim()) {
      alert('Please provide a clinical rationale for overriding AI priority.');
      return;
    }
    const assessId = selectedItem.assessment.assessment_id;
    setActioningId(assessId);
    try {
      const res = await reviewTriage(
        assessId,
        'override',
        overridePriority,
        overrideReason,
        notes
      );
      setStatusMessage(`✅ Priority overridden to ${overridePriority}. Patient queued with Token #${res.token_number}`);
      setShowOverrideModal(false);
      setOverrideReason('');
      setNotes('');
      await loadPending();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Override failed');
    } finally {
      setActioningId(null);
    }
  }

  async function handleSeedDemo() {
    setLoading(true);
    try {
      const res = await fetch('/api/triage/seed-demo', { method: 'POST' });
      const data = await res.json();
      setStatusMessage(`✨ Seeded ${data.count} diverse test patient assessments across P0-P3 acuity bands!`);
      await loadPending();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Seeding failed');
    } finally {
      setLoading(false);
    }
  }

  function handleSignOut() {
    clearToken();
    router.push('/');
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', padding: '1.5rem' }}>
      {/* Top Navigation Bar */}
      <header
        style={{
          maxWidth: '1200px',
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
            <span className="icon">🛡️</span>
            <span>MediKiosk Admin</span>
          </div>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              background: 'rgba(13, 148, 136, 0.1)',
              color: 'var(--color-primary-dark)',
              padding: '0.25rem 0.625rem',
              borderRadius: 'var(--radius-full)',
            }}
          >
            Clinical Triage Safety Gate
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={handleSeedDemo}
            disabled={loading}
            style={{
              background: 'linear-gradient(135deg, #0D9488, #0F766E)',
              color: 'white',
              border: 'none',
              padding: '0.5rem 0.875rem',
              borderRadius: 'var(--radius-md)',
              fontWeight: 600,
              fontSize: '0.8125rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            ⚡ Seed Test Intakes
          </button>
          <Link
            href="/doctor"
            style={{
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: 'var(--color-secondary)',
              padding: '0.5rem 0.875rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-bg)',
            }}
          >
            🩺 Doctor Queue →
          </Link>
          <Link
            href="/dashboard"
            style={{
              fontSize: '0.8125rem',
              fontWeight: 500,
              color: 'var(--color-text-secondary)',
            }}
          >
            Patient App
          </Link>
          <button
            onClick={handleSignOut}
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
      </header>

      {/* Main Container */}
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {statusMessage && (
          <div
            className="alert alert-success"
            style={{
              marginBottom: '1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>{statusMessage}</span>
            <button
              onClick={() => setStatusMessage(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}
            >
              ✕
            </button>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '1.5rem', alignItems: 'start' }}>
          {/* Left Column: Pending Intakes List */}
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
                Incoming Intakes ({pendingList.length})
              </h2>
              <button
                onClick={() => {
                  setLoading(true);
                  loadPending();
                }}
                disabled={loading}
                style={{
                  background: 'none',
                  border: '1px solid var(--color-border)',
                  padding: '0.25rem 0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                }}
              >
                {loading ? '⟳' : '↻ Refresh'}
              </button>
            </div>

            {loading && pendingList.length === 0 ? (
              <div className="loading-overlay">
                <span className="spinner" /> Loading pending intakes...
              </div>
            ) : pendingList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-text-secondary)' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>✨</div>
                <div style={{ fontWeight: 600, fontSize: '1rem' }}>All Caught Up!</div>
                <p style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                  No pending patient intakes awaiting review. Completed intakes will appear here automatically.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '70vh', overflowY: 'auto' }}>
                {pendingList.map((item) => {
                  const priority = item.assessment?.priority || 'P2';
                  const pTheme = PRIORITY_THEMES[priority] || PRIORITY_THEMES.P2;
                  const isSelected = selectedItem?.assessment?.assessment_id === item.assessment?.assessment_id;
                  const chiefComplaint = item.case?.chief_complaint || 'General medical intake';
                  const category = item.case?.category || 'General';

                  return (
                    <div
                      key={item.assessment?.assessment_id || item.session_id}
                      onClick={() => setSelectedItem(item)}
                      style={{
                        padding: '1rem',
                        borderRadius: 'var(--radius-md)',
                        border: `2px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                        background: isSelected ? 'rgba(13, 148, 136, 0.04)' : 'var(--color-surface)',
                        cursor: 'pointer',
                        transition: 'all var(--transition)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '0.2rem 0.5rem',
                            borderRadius: 'var(--radius-sm)',
                            background: pTheme.bg,
                            color: pTheme.text,
                            border: `1px solid ${pTheme.border}`,
                          }}
                        >
                          {priority}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          {item.submitted_at ? new Date(item.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>

                      <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--color-text)', marginBottom: '0.25rem' }}>
                        {chiefComplaint}
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                        Category: <strong style={{ textTransform: 'capitalize' }}>{category}</strong>
                        {item.case?.duration ? ` · ${item.case.duration}` : ''}
                      </div>

                      <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApprove(item);
                          }}
                          disabled={actioningId === item.assessment?.assessment_id}
                          className="btn btn-primary"
                          style={{ padding: '0.4rem 0.75rem', fontSize: '0.8125rem' }}
                        >
                          {actioningId === item.assessment?.assessment_id ? '...' : '✓ Approve'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedItem(item);
                            setOverridePriority(item.assessment?.priority || 'P2');
                            setShowOverrideModal(true);
                          }}
                          className="btn btn-secondary"
                          style={{ padding: '0.4rem 0.75rem', fontSize: '0.8125rem' }}
                        >
                          Override
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Right Column: Detailed Clinical Dossier & AI Evidence */}
          <section
            style={{
              background: 'var(--color-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border)',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            {selectedItem ? (
              <div>
                {/* Header of Dossier */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    borderBottom: '1px solid var(--color-border)',
                    paddingBottom: '1rem',
                    marginBottom: '1.25rem',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
                      <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--color-text)' }}>
                        Clinical Dossier & Triage Review
                      </h2>
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                      Session ID: <code>{selectedItem.session_id}</code>
                      {selectedItem.submitted_at && ` · Submitted at ${new Date(selectedItem.submitted_at).toLocaleTimeString()}`}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    {(() => {
                      const priority = selectedItem.assessment?.priority || 'P2';
                      const pTheme = PRIORITY_THEMES[priority] || PRIORITY_THEMES.P2;
                      return (
                        <div
                          style={{
                            padding: '0.5rem 1rem',
                            borderRadius: 'var(--radius-md)',
                            background: pTheme.bg,
                            color: pTheme.text,
                            border: `1px solid ${pTheme.border}`,
                            fontWeight: 700,
                            fontSize: '0.9375rem',
                          }}
                        >
                          AI Rec: {pTheme.label}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* AI Explanation & Confidence */}
                <div
                  style={{
                    background: 'var(--color-surface-alt)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem',
                    marginBottom: '1.25rem',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>🤖 AI Clinical Acuity Rationale</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                      Confidence: {Math.round((selectedItem.assessment?.confidence_score ?? 0.8) * 100)}% ({selectedItem.assessment?.confidence_band || 'medium'})
                    </span>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-text)', lineHeight: 1.5 }}>
                    {selectedItem.assessment?.uncertainty?.reasons?.length
                      ? selectedItem.assessment.uncertainty.reasons.join('. ')
                      : `Patient completed AI intake with ${selectedItem.case?.category || 'general'} symptoms. Clinical triage review recommended.`}
                  </p>
                  {selectedItem.assessment?.recommended_next_action && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.8125rem', color: 'var(--color-primary-dark)', fontWeight: 600 }}>
                      Recommended Action: <span style={{ textTransform: 'capitalize' }}>{selectedItem.assessment.recommended_next_action.replace(/_/g, ' ')}</span>
                    </div>
                  )}
                </div>

                {/* Patient Case Facts Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div style={{ background: 'var(--color-bg)', padding: '0.875rem', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                      CHIEF COMPLAINT
                    </div>
                    <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>
                      {selectedItem.case?.chief_complaint || 'Not specified'}
                    </div>
                  </div>

                  <div style={{ background: 'var(--color-bg)', padding: '0.875rem', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                      DURATION & SEVERITY
                    </div>
                    <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>
                      Duration: {selectedItem.case?.duration || 'Recent'} · Severity: {selectedItem.case?.severity || 'N/A'}/10
                    </div>
                  </div>

                  <div style={{ background: 'var(--color-bg)', padding: '0.875rem', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                      REPORTED SYMPTOMS
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text)' }}>
                      {selectedItem.case?.symptoms?.length ? selectedItem.case.symptoms.join(', ') : 'None extracted'}
                    </div>
                  </div>

                  <div style={{ background: 'var(--color-bg)', padding: '0.875rem', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                      MEDICATIONS & ALLERGIES
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text)' }}>
                      Meds: {selectedItem.case?.current_medications?.length ? selectedItem.case.current_medications.join(', ') : 'None'}
                      <br />
                      Allergies: {selectedItem.case?.allergies?.length ? selectedItem.case.allergies.join(', ') : 'NKDA'}
                    </div>
                  </div>
                </div>

                {/* Uncertainty & Safety Flags Section */}
                {(selectedItem.assessment?.uncertainty?.missing_information?.length || selectedItem.assessment?.safety_flags?.length) ? (
                  <div
                    style={{
                      background: '#FFFBEB',
                      border: '1px solid #FDE68A',
                      borderRadius: 'var(--radius-md)',
                      padding: '1rem',
                      marginBottom: '1.25rem',
                    }}
                  >
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#92400E', marginBottom: '0.5rem' }}>
                      🔍 Uncertainty & Safety Flags
                    </h4>
                    {selectedItem.assessment?.safety_flags && selectedItem.assessment.safety_flags.length > 0 && (
                      <div style={{ fontSize: '0.8125rem', color: '#B45309', marginBottom: '0.35rem', fontWeight: 600 }}>
                        ⚠️ Safety Flags: {selectedItem.assessment.safety_flags.join(', ')}
                      </div>
                    )}
                    {selectedItem.assessment?.uncertainty?.missing_information && selectedItem.assessment.uncertainty.missing_information.length > 0 && (
                      <div style={{ fontSize: '0.8125rem', color: '#92400E' }}>
                        <strong>Missing Info:</strong> {selectedItem.assessment.uncertainty.missing_information.join('; ')}
                      </div>
                    )}
                  </div>
                ) : null}

                {/* Evidence Tracing */}
                {selectedItem.assessment?.evidence && selectedItem.assessment.evidence.length > 0 && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.5rem' }}>
                      📑 Evidence Provenance (Patient Quotes)
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {selectedItem.assessment.evidence.map((ev, i) => (
                        <div
                          key={i}
                          style={{
                            background: 'var(--color-surface-alt)',
                            borderLeft: '3px solid var(--color-primary)',
                            padding: '0.5rem 0.75rem',
                            borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                            fontSize: '0.8125rem',
                          }}
                        >
                          <strong style={{ color: 'var(--color-text)', textTransform: 'capitalize' }}>
                            {ev.field.replace(/_/g, ' ')}:
                          </strong>{' '}
                          <span style={{ color: 'var(--color-text-secondary)' }}>{ev.summary}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Primary Action Buttons */}
                <div
                  style={{
                    display: 'flex',
                    gap: '1rem',
                    borderTop: '1px solid var(--color-border)',
                    paddingTop: '1.25rem',
                  }}
                >
                  <button
                    onClick={() => handleApprove(selectedItem)}
                    disabled={actioningId === selectedItem.assessment?.assessment_id}
                    className="btn btn-primary"
                    style={{ flex: 2, height: '48px', fontSize: '1rem' }}
                  >
                    {actioningId === selectedItem.assessment?.assessment_id
                      ? 'Admitting...'
                      : `✓ Approve ${selectedItem.assessment?.priority || 'P2'} & Queue Patient`}
                  </button>

                  <button
                    onClick={() => {
                      setOverridePriority(selectedItem.assessment?.priority || 'P2');
                      setShowOverrideModal(true);
                    }}
                    className="btn btn-secondary"
                    style={{ flex: 1, height: '48px' }}
                  >
                    ⚙ Override Priority
                  </button>

                  <button
                    onClick={() => handleEscalate(selectedItem)}
                    className="btn btn-danger"
                    style={{ flex: 1, height: '48px' }}
                  >
                    🚨 Escalate to ER
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '5rem 1rem', color: 'var(--color-text-secondary)' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>👈</div>
                <div style={{ fontWeight: 600, fontSize: '1rem' }}>Select an Intake to Review</div>
                <p style={{ fontSize: '0.8125rem' }}>
                  Click on any patient intake card on the left to inspect evidence and approve for consultation.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Override Modal */}
      {showOverrideModal && selectedItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: '520px',
              width: '100%',
              background: 'var(--color-surface)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.5rem',
            }}
          >
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Override AI Triage Acuity
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '1.25rem' }}>
              Original AI recommendation was{' '}
              <strong>{selectedItem.assessment?.priority || 'P2'} ({PRIORITY_THEMES[selectedItem.assessment?.priority || 'P2']?.label})</strong>.
            </p>

            <div className="field">
              <label className="label">Select New Clinical Priority</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                {(['P0', 'P1', 'P2', 'P3'] as const).map((p) => {
                  const theme = PRIORITY_THEMES[p];
                  const active = overridePriority === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setOverridePriority(p)}
                      style={{
                        padding: '0.625rem',
                        borderRadius: 'var(--radius-md)',
                        border: `2px solid ${active ? theme.text : 'var(--color-border)'}`,
                        background: active ? theme.bg : 'var(--color-surface)',
                        color: theme.text,
                        fontWeight: 700,
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                      }}
                    >
                      {theme.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="field">
              <label className="label">Clinical Override Reason (Mandatory)</label>
              <textarea
                className="input"
                rows={3}
                placeholder="e.g. Patient looks pale in waiting room; history of acute CAD."
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </div>

            <div className="field">
              <label className="label">Internal Doctor Handover Notes (Optional)</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Check blood glucose stat upon entry"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button
                type="button"
                onClick={() => setShowOverrideModal(false)}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleOverrideSubmit}
                disabled={actioningId === selectedItem.assessment?.assessment_id}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                Confirm & Queue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
