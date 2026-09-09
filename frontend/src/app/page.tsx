'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

const LANGUAGES = [
  { code: 'en', label: 'English', emoji: '🇬🇧' },
  { code: 'hi', label: 'हिन्दी', emoji: '🇮🇳' },
  { code: 'hinglish', label: 'Hinglish', emoji: '🌐' },
];

export default function LandingPage() {
  const router = useRouter();
  const [selected, setSelected] = useState('en');

  function handleContinue() {
    localStorage.setItem('medikiosk_language', selected);
    router.push('/login');
  }

  return (
    <main className="container" style={{ paddingTop: '3rem' }}>
      <div className="card" style={{ textAlign: 'center' }}>
        <div className="logo-mark" style={{ justifyContent: 'center' }}>
          <span className="icon">🏥</span>
          <span>MediKiosk</span>
        </div>

        <h1 className="page-title">Welcome</h1>
        <p className="page-subtitle">
          AI-powered patient intake — complete your health assessment before seeing the doctor.
        </p>

        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-lg)' }}>
          Select your preferred language
        </p>

        <div className="category-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 'var(--space-xl)' }}>
          {LANGUAGES.map(lang => (
            <div
              key={lang.code}
              className={`category-card ${selected === lang.code ? 'selected' : ''}`}
              onClick={() => setSelected(lang.code)}
            >
              <span className="emoji">{lang.emoji}</span>
              {lang.label}
            </div>
          ))}
        </div>

        <button className="btn btn-primary" onClick={handleContinue}>
          Continue
        </button>
      </div>
    </main>
  );
}
