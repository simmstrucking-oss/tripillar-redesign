'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import LicenseTab from '@/components/org/LicenseTab'
import FacilitatorsTab from '@/components/org/FacilitatorsTab'
import CohortsTab from '@/components/org/CohortsTab'
import ReportsTab from '@/components/org/ReportsTab'
import SupportTab from '@/components/org/SupportTab'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function OrgHub() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [dismissed, setDismissed] = useState(false)
  const [activeTab, setActiveTab] = useState<'license' | 'facilitators' | 'cohorts' | 'reports' | 'support'>('license')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    
    if (!currentUser || currentUser.user_metadata?.role !== 'org_contact') {
      router.push('/org/login')
      return
    }

    setUser(currentUser)

    // Fetch onboarding data to check if orientation was dismissed
    const res = await fetch('/api/org/onboarding')
    if (res.ok) {
      const data = await res.json()
      setDismissed(data.dismissed_orientation || false)
    }

    setLoading(false)
  }

  const handleDismissOrientation = async () => {
    try {
      await fetch('/api/org/onboarding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dismissed_orientation: true })
      })
      setDismissed(true)
    } catch (err) {
      console.error('Failed to dismiss:', err)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  const tabs = [
    { id: 'license', label: 'License' },
    { id: 'facilitators', label: 'Facilitators' },
    { id: 'cohorts', label: 'Cohorts' },
    { id: 'reports', label: 'Reports' },
    { id: 'support', label: 'Support' }
  ] as const

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: '#F4F1EC' }}>
      <div className="max-w-5xl mx-auto">
        {/* Orientation Panel */}
        {!dismissed && (
          <div className="mb-8 p-6 rounded border-l-4" style={{ backgroundColor: '#FFFBF0', borderColor: '#B8942F' }}>
            <h2 className="text-xl font-bold mb-3" style={{ color: '#2D3142', fontFamily: 'Playfair Display, serif' }}>
              Welcome to your Partner Hub
            </h2>
            <ul className="space-y-2 mb-4 text-sm" style={{ color: '#2D3142' }}>
              <li><strong>License:</strong> View and manage your institutional license</li>
              <li><strong>Facilitators:</strong> Track facilitators' certifications and status</li>
              <li><strong>Cohorts:</strong> Monitor active and completed cohorts, enrollment, and completion rates</li>
              <li><strong>Reports:</strong> Generate impact reports showing outcomes and reach</li>
              <li><strong>Support:</strong> Submit questions or requests directly to Wayne</li>
            </ul>
            <p className="text-sm mb-4" style={{ color: '#7A7264' }}>
              Questions? Use the Support tab.
            </p>
            <button
              onClick={handleDismissOrientation}
              className="px-4 py-2 rounded text-sm font-medium"
              style={{ backgroundColor: '#B8942F', color: '#FFFFFF' }}
            >
              Got it
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-8 flex gap-2 border-b" style={{ borderColor: '#E2DDD7' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-4 py-3 font-medium text-sm transition border-b-2"
              style={{
                color: activeTab === tab.id ? '#B8942F' : '#7A7264',
                borderColor: activeTab === tab.id ? '#B8942F' : 'transparent'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'license' && <LicenseTab />}
          {activeTab === 'facilitators' && <FacilitatorsTab />}
          {activeTab === 'cohorts' && <CohortsTab />}
          {activeTab === 'reports' && <ReportsTab />}
          {activeTab === 'support' && <SupportTab />}
        </div>
      </div>
    </div>
  )
}
