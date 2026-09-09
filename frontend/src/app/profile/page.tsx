'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getProfile, updateProfile } from '@/lib/api';

export default function ProfilePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    full_name: '',
    age: '',
    gender: '',
    blood_group: '',
    phone: '',
    emergency_contact: '',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    getProfile()
      .then(data => {
        setForm({
          full_name: (data as Record<string, string>).full_name || '',
          age: String((data as Record<string, number>).age || ''),
          gender: (data as Record<string, string>).gender || '',
          blood_group: (data as Record<string, string>).blood_group || '',
          phone: (data as Record<string, string>).phone || '',
          emergency_contact: (data as Record<string, string>).emergency_contact || '',
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await updateProfile({
        ...form,
        age: form.age ? parseInt(form.age, 10) : undefined,
      });
      router.push('/documents');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <main className="container"><div className="loading-overlay"><span className="spinner" /> Loading...</div></main>;
  }

  return (
    <main className="container" style={{ paddingTop: '2rem' }}>
      <div className="card">
        <div className="logo-mark">
          <span className="icon">👤</span>
          <span>Patient Details</span>
        </div>

        <p className="page-subtitle">Please fill in your basic information</p>

        {error && <div className="alert alert-danger">⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label className="label" htmlFor="full_name">Full Name</label>
            <input id="full_name" className="input" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)' }}>
            <div className="field">
              <label className="label" htmlFor="age">Age</label>
              <input id="age" className="input" type="number" min="0" max="150" value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))} />
            </div>
            <div className="field">
              <label className="label" htmlFor="gender">Gender</label>
              <select id="gender" className="input" value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}>
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)' }}>
            <div className="field">
              <label className="label" htmlFor="blood_group">Blood Group</label>
              <select id="blood_group" className="input" value={form.blood_group} onChange={e => setForm(f => ({ ...f, blood_group: e.target.value }))}>
                <option value="">Select</option>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="label" htmlFor="phone">Phone</label>
              <input id="phone" className="input" type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
          </div>
          <div className="field">
            <label className="label" htmlFor="emergency_contact">Emergency Contact</label>
            <input id="emergency_contact" className="input" placeholder="Name & number" value={form.emergency_contact} onChange={e => setForm(f => ({ ...f, emergency_contact: e.target.value }))} />
          </div>
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? <span className="spinner" /> : 'Save & Continue'}
          </button>
        </form>
      </div>
    </main>
  );
}
