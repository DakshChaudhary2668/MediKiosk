'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { uploadDocument, listDocuments } from '@/lib/api';

export default function DocumentsPage() {
  const router = useRouter();
  const [docs, setDocs] = useState<Array<Record<string, unknown>>>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listDocuments()
      .then(setDocs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError('File too large (max 10 MB)');
      return;
    }
    setUploading(true);
    setError('');
    try {
      const result = await uploadDocument(file);
      setDocs(prev => [{ file_name: result.file_name, storage_path: result.storage_path, uploaded_at: new Date().toISOString() }, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  return (
    <main className="container" style={{ paddingTop: '2rem' }}>
      <div className="card">
        <div className="logo-mark">
          <span className="icon">📋</span>
          <span>Medical Documents</span>
        </div>

        <p className="page-subtitle">Upload any relevant medical reports, prescriptions, or test results (optional)</p>

        {error && <div className="alert alert-danger">⚠️ {error}</div>}

        <div style={{ marginBottom: 'var(--space-lg)' }}>
          <label className="btn btn-secondary" style={{ position: 'relative', overflow: 'hidden' }}>
            {uploading ? <span className="spinner" /> : '📎 Upload Document'}
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={handleUpload}
              style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer', top: 0, left: 0 }}
              disabled={uploading}
            />
          </label>
        </div>

        {loading ? (
          <div className="loading-overlay"><span className="spinner" /> Loading...</div>
        ) : docs.length > 0 ? (
          <div>
            <p className="label" style={{ marginBottom: 'var(--space-sm)' }}>Uploaded ({docs.length})</p>
            {docs.map((doc, i) => (
              <div key={i} style={{ padding: 'var(--space-sm) var(--space-md)', background: 'var(--color-surface-alt)', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-xs)', fontSize: '0.8125rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>📄 {String(doc.file_name)}</span>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                  {new Date(String(doc.uploaded_at)).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', textAlign: 'center' }}>
            No documents uploaded yet
          </p>
        )}

        <button className="btn btn-primary" onClick={() => router.push('/dashboard')} style={{ marginTop: 'var(--space-lg)' }}>
          Continue to Dashboard →
        </button>
      </div>
    </main>
  );
}
