'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

const REASON_MESSAGES: Record<string, string> = {
  session:      'Your session has expired. Please sign in again.',
  'no-profile': 'Account setup incomplete. Contact wayne@tripillarstudio.com.',
  admin:        'Admin access required.',
  'setup-failed': 'Setup link expired or invalid. Contact wayne@tripillarstudio.com.',
};

function LoginForm() {
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason') ?? '';

  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Login state
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Register state
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName,  setRegLastName]  = useState('');
  const [regEmail,     setRegEmail]     = useState('');
  const [regPasscode,  setRegPasscode]  = useState('');
  const [regPassword,  setRegPassword]  = useState('');
  const [regError,     setRegError]     = useState('');
  const [regLoading,   setRegLoading]   = useState(false);
  const [regDone,      setRegDone]      = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error ?? 'Login failed. Please try again.');
        setLoginLoading(false);
        return;
      }
      const role = data.role as string | null;
      if (role === 'super_admin') {
        window.location.href = '/facilitators/hub/dashboard';
      } else if (role === 'trainer') {
        window.location.href = '/trainers/hub/dashboard';
      } else if (role === 'org_contact') {
        window.location.href = '/org/hub';
      } else {
        window.location.href = '/facilitators/hub/dashboard';
      }
    } catch {
      setLoginError('Unexpected error signing in. Please try again.');
      setLoginLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setRegError('');
    setRegLoading(true);
    try {
      const res = await fetch('/api/facilitators/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: regFirstName,
          last_name:  regLastName,
          email:      regEmail,
          password:   regPassword,
          passcode:   regPasscode,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRegError(data.error ?? 'Registration failed. Please try again.');
        setRegLoading(false);
        return;
      }
      setRegDone(true);
    } catch {
      setRegError('Unexpected error. Please try again.');
      setRegLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F4EE] flex flex-col">
      <div className="w-full px-6 py-4 flex items-center">
        <Link href="/" className="flex items-center gap-2.5 group">
          <Image src="/logo.png" alt="Live and Grieve" width={24} height={36} className="h-8 w-auto" />
          <span className="font-serif text-lg font-bold text-navy group-hover:text-gold transition-colors">
            Tri&#8209;Pillars<sup className="text-xs text-gold">™</sup>
          </span>
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div
              className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-4"
              style={{ background: 'rgba(160,132,58,0.12)' }}
            >
              <svg className="w-7 h-7" style={{ color: '#A0843A' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h1 className="font-serif text-2xl font-bold text-navy">Facilitator Portal</h1>
            <p className="text-muted text-sm mt-1">Live and Grieve™ Certified Facilitators.</p>
          </div>

          {/* Mode toggle */}
          <div className="flex rounded-xl border border-card-border bg-white overflow-hidden mb-6 shadow-sm">
            <button
              type="button"
              onClick={() => { setMode('login'); setLoginError(''); }}
              className="flex-1 py-2.5 text-sm font-semibold transition-all"
              style={{
                background: mode === 'login' ? '#A0843A' : 'transparent',
                color:      mode === 'login' ? '#F8F4EE' : '#6B7280',
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setRegError(''); }}
              className="flex-1 py-2.5 text-sm font-semibold transition-all"
              style={{
                background: mode === 'register' ? '#A0843A' : 'transparent',
                color:      mode === 'register' ? '#F8F4EE' : '#6B7280',
              }}
            >
              New Facilitator
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-card-border p-8">
            {reason && REASON_MESSAGES[reason] && (
              <div className="mb-6 px-4 py-3 rounded-lg text-sm"
                style={{ background: '#FEF3C7', border: '1px solid #F59E0B', color: '#92400E' }}>
                {REASON_MESSAGES[reason]}
              </div>
            )}

            {/* ── SIGN IN ── */}
            {mode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-navy mb-1.5">Email address</label>
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    required autoComplete="email" placeholder="you@example.com"
                    className="w-full px-4 py-2.5 rounded-lg border border-card-border text-sm text-navy placeholder-muted/50 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold transition-colors bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy mb-1.5">Password</label>
                  <input
                    type="password" value={password} onChange={e => setPassword(e.target.value)}
                    required autoComplete="current-password" placeholder="••••••••"
                    className="w-full px-4 py-2.5 rounded-lg border border-card-border text-sm text-navy placeholder-muted/50 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold transition-colors bg-white"
                  />
                </div>
                {loginError && (
                  <div className="px-4 py-3 rounded-lg text-sm"
                    style={{ background: '#FEE2E2', border: '1px solid #EF4444', color: '#991B1B' }}>
                    {loginError}
                  </div>
                )}
                <button type="submit" disabled={loginLoading}
                  className="w-full py-3 rounded-lg text-sm font-semibold transition-all mt-2"
                  style={{
                    background: loginLoading ? '#9CA3AF' : '#A0843A', color: '#F8F4EE',
                    letterSpacing: '0.02em', cursor: loginLoading ? 'not-allowed' : 'pointer',
                    boxShadow: loginLoading ? 'none' : '0 1px 3px rgba(160,132,58,0.3)',
                  }}>
                  {loginLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Signing in…
                    </span>
                  ) : 'Sign In'}
                </button>
              </form>
            )}

            {/* ── REGISTER ── */}
            {mode === 'register' && !regDone && (
              <form onSubmit={handleRegister} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-navy mb-1.5">First Name</label>
                    <input
                      type="text" value={regFirstName} onChange={e => setRegFirstName(e.target.value)}
                      required autoComplete="given-name" placeholder="Jane"
                      className="w-full px-4 py-2.5 rounded-lg border border-card-border text-sm text-navy placeholder-muted/50 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold transition-colors bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-navy mb-1.5">Last Name</label>
                    <input
                      type="text" value={regLastName} onChange={e => setRegLastName(e.target.value)}
                      required autoComplete="family-name" placeholder="Doe"
                      className="w-full px-4 py-2.5 rounded-lg border border-card-border text-sm text-navy placeholder-muted/50 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold transition-colors bg-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy mb-1.5">Email address</label>
                  <input
                    type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)}
                    required autoComplete="email" placeholder="you@example.com"
                    className="w-full px-4 py-2.5 rounded-lg border border-card-border text-sm text-navy placeholder-muted/50 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold transition-colors bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy mb-1.5">Password</label>
                  <input
                    type="password" value={regPassword} onChange={e => setRegPassword(e.target.value)}
                    required autoComplete="new-password" placeholder="Create a password (min 8 characters)"
                    className="w-full px-4 py-2.5 rounded-lg border border-card-border text-sm text-navy placeholder-muted/50 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold transition-colors bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy mb-1.5">Passcode</label>
                  <input
                    type="text" value={regPasscode} onChange={e => setRegPasscode(e.target.value)}
                    required placeholder="Enter your passcode"
                    className="w-full px-4 py-2.5 rounded-lg border border-card-border text-sm text-navy placeholder-muted/50 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold transition-colors bg-white"
                  />
                </div>
                {regError && (
                  <div className="px-4 py-3 rounded-lg text-sm"
                    style={{ background: '#FEE2E2', border: '1px solid #EF4444', color: '#991B1B' }}>
                    {regError}
                    {regError.includes('sign in') && (
                      <button type="button" onClick={() => setMode('login')}
                        className="ml-2 underline font-semibold">
                        Sign in here
                      </button>
                    )}
                  </div>
                )}
                <button type="submit" disabled={regLoading}
                  className="w-full py-3 rounded-lg text-sm font-semibold transition-all mt-2"
                  style={{
                    background: regLoading ? '#9CA3AF' : '#A0843A', color: '#F8F4EE',
                    letterSpacing: '0.02em', cursor: regLoading ? 'not-allowed' : 'pointer',
                    boxShadow: regLoading ? 'none' : '0 1px 3px rgba(160,132,58,0.3)',
                  }}>
                  {regLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Creating account…
                    </span>
                  ) : 'Create My Account'}
                </button>
              </form>
            )}

            {/* ── REGISTER SUCCESS ── */}
            {mode === 'register' && regDone && (
              <div className="text-center py-4 space-y-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full"
                  style={{ background: 'rgba(22,163,74,0.1)' }}>
                  <svg className="w-6 h-6" style={{ color: '#16A34A' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="font-serif text-lg font-bold text-navy">Check your email.</p>
                <p className="text-sm text-muted">
                  We sent a welcome email to <strong>{regEmail}</strong> with everything you need to know
                  before your first session. Use the button below to sign in now.
                </p>
                <button
                  type="button"
                  onClick={() => { window.location.href = '/facilitators/hub/dashboard'; }}
                  className="w-full py-3 rounded-lg text-sm font-semibold transition-all"
                  style={{ background: '#A0843A', color: '#F8F4EE', letterSpacing: '0.02em' }}>
                  Go to My Hub &rarr;
                </button>
                <button type="button" onClick={() => setMode('login')}
                  className="text-sm text-navy underline underline-offset-2 hover:text-gold transition-colors">
                  Back to sign in
                </button>
              </div>
            )}
          </div>

          <p className="text-center text-xs text-muted mt-6">
            Issues accessing your account?{' '}
            <Link href="/contact"
              className="text-navy underline underline-offset-2 hover:text-gold transition-colors">
              Contact us.
            </Link>
          </p>
        </div>
      </div>

      <div className="text-center pb-6 text-xs text-muted/50">
        Tri-Pillars™ LLC · Live and Grieve™
      </div>
    </div>
  );
}

export default function FacilitatorLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
