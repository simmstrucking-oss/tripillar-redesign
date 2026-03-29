'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function OrgLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (signInError) {
        setError(signInError.message)
        setLoading(false)
        return
      }

      if (data.user?.user_metadata?.role !== 'org_contact') {
        setError('You do not have organization contact access.')
        await supabase.auth.signOut()
        setLoading(false)
        return
      }

      router.push('/org/hub')
    } catch (err: any) {
      setError('An unexpected error occurred.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F4F1EC' }}>
      <div className="w-full max-w-md" style={{ padding: '40px', backgroundColor: '#FFFFFF', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <h1 className="text-3xl font-bold mb-2" style={{ color: '#2D3142', fontFamily: 'Playfair Display, serif' }}>
          Partner Login
        </h1>
        <p className="text-sm mb-8" style={{ color: '#7A7264' }}>
          Sign in to your organization account
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#2D3142' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded"
              style={{ borderColor: '#E2DDD7', color: '#2D3142' }}
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#2D3142' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded"
              style={{ borderColor: '#E2DDD7', color: '#2D3142' }}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="p-3 rounded text-sm" style={{ backgroundColor: '#FDE8E8', color: '#C0392B' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded font-medium transition"
            style={{
              backgroundColor: loading ? '#D4C5A9' : '#B8942F',
              color: '#FFFFFF'
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: '#7A7264' }}>
          Issues signing in?{' '}
          <Link href="/contact?inquiry=org-access" className="underline" style={{ color: '#B8942F' }}>
            Contact support
          </Link>
        </p>
      </div>
    </div>
  )
}
