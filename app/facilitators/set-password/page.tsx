'use client';

import { useState } from 'react';
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useRouter } from 'next/navigation';

export default function SetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = getSupabaseBrowser();
  // eslint-disable-next-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      router.push('/facilitators/hub/dashboard');
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f9f6f1',
      fontFamily: 'Georgia, serif',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '12px',
        padding: '48px 40px',
        maxWidth: '420px',
        width: '100%',
        boxShadow: '0 2px 20px rgba(0,0,0,0.08)',
      }}>
        <h1 style={{ fontSize: '24px', color: '#1a1a1a', marginBottom: '8px' }}>
          Set Your Password
        </h1>
        <p style={{ color: '#666', fontSize: '15px', marginBottom: '32px' }}>
          Choose a password to secure your Facilitator Hub account.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', color: '#333', marginBottom: '6px' }}>
              New Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '15px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', color: '#333', marginBottom: '6px' }}>
              Confirm Password
            </label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '15px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {error && (
            <p style={{ color: '#c0392b', fontSize: '14px', marginBottom: '16px' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              background: '#A0843A',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Saving…' : 'Set Password & Enter Hub →'}
          </button>
        </form>
      </div>
    </div>
  );
}
