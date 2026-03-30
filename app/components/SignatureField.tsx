'use client';

import { useState } from 'react';

const C = {
  navy: '#1c3028', gold: '#B8942F', goldLt: '#F5EDD5', bg: '#F5F4F0',
  white: '#FFFFFF', border: '#DDD9D0', muted: '#6B7280',
  danger: '#DC2626', success: '#16A34A',
};

interface SignatureFieldProps {
  documentName: string;
  documentVersion?: string;
  onSuccess?: (result: { pdf_url: string; signed_at: string }) => void;
}

export default function SignatureField({ documentName, documentVersion, onSuccess }: SignatureFieldProps) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ pdf_url: string; signed_at: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) { setError('Please type your full legal name.'); return; }
    setLoading(true); setError('');

    const res = await fetch('/api/hub/sign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        document_name: documentName,
        document_version: documentVersion,
        signature_text: name.trim(),
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok || !data.success) {
      setError(data.error || 'Signature failed. Please try again.');
      return;
    }

    const r = { pdf_url: data.pdf_url ?? '', signed_at: data.signed_at };
    setResult(r);
    onSuccess?.(r);
  }

  if (result) {
    const d = new Date(result.signed_at);
    return (
      <div style={{ background: C.success + '12', border: `1px solid ${C.success}40`, borderRadius: 8,
        padding: '1rem 1.25rem', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ color: C.success, fontWeight: 600, fontSize: '0.9rem', marginBottom: 6 }}>
          &#10003; Signed by {name} on {d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {result.pdf_url && (
            <button onClick={() => window.open(result.pdf_url, '_blank')}
              style={{ background: C.navy, color: '#fff', border: 'none', borderRadius: 6,
                padding: '0.4rem 0.9rem', fontSize: '0.8rem', fontWeight: 600,
                fontFamily: 'Inter, sans-serif', cursor: 'pointer' }}>
              Download PDF
            </button>
          )}
          <button onClick={() => window.print()}
            style={{ background: C.bg, color: C.navy, border: `1px solid ${C.border}`, borderRadius: 6,
              padding: '0.4rem 0.9rem', fontSize: '0.8rem', fontWeight: 600,
              fontFamily: 'Inter, sans-serif', cursor: 'pointer' }}>
            Print
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} style={{ fontFamily: 'Inter, sans-serif' }}>
      <p style={{ fontSize: '0.75rem', color: C.muted, margin: '0 0 8px', lineHeight: 1.5 }}>
        By signing, you confirm this is your legal signature. Your name, timestamp, and IP address will be recorded for verification purposes.
      </p>
      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: C.navy,
        marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        Type your full legal name as your digital signature
      </label>
      <div style={{ display: 'flex', gap: 8, alignItems: 'stretch', flexWrap: 'wrap' }}>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Your full legal name"
          required
          disabled={loading}
          style={{
            flex: 1, minWidth: 200, padding: '0.5rem 0.75rem',
            border: `1px solid ${C.border}`, borderRadius: 6,
            fontSize: '1rem', fontFamily: 'Inter, sans-serif',
            fontStyle: 'italic', color: C.navy, background: C.white,
          }}
        />
        <button type="submit" disabled={loading || name.trim().length < 2}
          style={{
            background: C.gold, color: '#fff', border: 'none', borderRadius: 6,
            padding: '0.5rem 1.25rem', fontSize: '0.875rem', fontWeight: 600,
            fontFamily: 'Inter, sans-serif', cursor: loading ? 'wait' : 'pointer',
            opacity: loading || name.trim().length < 2 ? 0.6 : 1,
            whiteSpace: 'nowrap',
          }}>
          {loading ? 'Signing...' : 'Sign Document'}
        </button>
      </div>
      {error && (
        <p style={{ color: C.danger, fontSize: '0.8rem', margin: '6px 0 0' }}>{error}</p>
      )}
    </form>
  );
}
