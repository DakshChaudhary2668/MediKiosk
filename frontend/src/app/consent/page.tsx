'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { recordConsent } from '@/lib/api';
import { IconHospital, IconAlertTriangle } from "@/components/icons";

export default function ConsentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleConsent(agreed: boolean) {
    if (!agreed) {
      router.push('/login');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await recordConsent(true);
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to record consent');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container" style={{ paddingTop: '3rem' }}>
      <div className="card">
        <div className="logo-mark" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <IconHospital size={22} color="var(--mk-primary)" />
          <span>MediKiosk</span>
        </div>

        <h1 className="page-title">Patient Consent</h1>

        <div style={{ background: 'var(--color-bg)', padding: 'var(--space-lg)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-xl)', fontSize: '0.875rem', lineHeight: 1.7 }}>
          <p style={{ fontWeight: 600, marginBottom: 'var(--space-sm)' }}>
            Before we proceed, please review the following:
          </p>
          <ul style={{ paddingLeft: 'var(--space-lg)' }}>
            <li>An AI assistant will ask questions about your health concern.</li>
            <li>This is <strong>not</strong> a medical diagnosis or treatment.</li>
            <li>The information you provide will be shared with the attending doctor.</li>
            <li>Your data is stored securely and handled with confidentiality.</li>
            <li>You can stop the AI intake at any time.</li>
            <li>The doctor remains the final decision-maker for your care.</li>
          </ul>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <IconAlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          <button className="btn btn-secondary" onClick={() => handleConsent(false)} disabled={loading}>
            Decline
          </button>
          <button className="btn btn-primary" onClick={() => handleConsent(true)} disabled={loading}>
            {loading ? <span className="spinner" /> : 'I Agree'}
          </button>
        </div>
      </div>
    </main>
  );
}
