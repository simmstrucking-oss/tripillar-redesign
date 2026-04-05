'use client';

import { useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    // Supabase puts the session tokens in the URL hash after a recovery/magic link click.
    // onAuthStateChange fires once the client parses the hash and establishes a session.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        // Redirect to set-password page so the user can choose their password
        router.replace('/facilitators/set-password');
      }
    });

    // Fallback: if already signed in (hash already consumed), go to set-password
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace('/facilitators/set-password');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f9f6f1',
      fontFamily: 'Georgia, serif',
      color: '#555',
      fontSize: '16px',
    }}>
      Setting up your account…
    </div>
  );
}
