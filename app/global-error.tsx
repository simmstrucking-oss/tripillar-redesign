'use client';
/**
 * global-error.tsx — catches unhandled errors in the root layout.
 * Reports them to Sentry before showing a fallback UI.
 */
import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body style={{ fontFamily: 'Georgia, serif', textAlign: 'center', padding: '80px 24px', color: '#1c3028' }}>
        <p style={{ fontSize: 48, marginBottom: 16 }}>🌿</p>
        <h2 style={{ fontSize: 22, marginBottom: 8 }}>Something went wrong</h2>
        <p style={{ color: '#6b7280', marginBottom: 24, fontSize: 14 }}>
          The team has been notified. We'll look into it.
        </p>
        <button
          onClick={reset}
          style={{
            background: '#1c3028', color: '#faf8f5', border: 'none',
            borderRadius: 6, padding: '10px 24px', cursor: 'pointer', fontSize: 14,
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
