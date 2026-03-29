'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface OnboardingData {
  onboarding_progress: Record<number, boolean>
  onboarding_complete: boolean
  training_requested: boolean
  facilitator_candidate_name: string | null
  facilitator_candidate_email: string | null
  target_cohort_date: string | null
  dismissed_orientation: boolean
}

export default function OnboardingPage() {
  const router = useRouter()
  const [data, setData] = useState<OnboardingData | null>(null)
  const [orgName, setOrgName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Step-specific state
  const [facilitatorName, setFacilitatorName] = useState('')
  const [facilitatorEmail, setFacilitatorEmail] = useState('')
  const [description, setDescription] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [groupSize, setGroupSize] = useState('1')
  const [format, setFormat] = useState('In-person')
  const [workbookOrdered, setWorkbookOrdered] = useState(false)

  useEffect(() => {
    fetchOnboarding()
  }, [])

  const fetchOnboarding = async () => {
    try {
      const res = await fetch('/api/org/onboarding')
      if (!res.ok) throw new Error('Failed to fetch')
      const onbData = await res.json()
      setData(onbData)

      // Load initial values
      setFacilitatorName(onbData.facilitator_candidate_name || '')
      setFacilitatorEmail(onbData.facilitator_candidate_email || '')
      setTargetDate(onbData.target_cohort_date || '')
      setWorkbookOrdered(onbData.onboarding_progress?.[6] || false)

      // Fetch org name
      const orgRes = await fetch('/api/org/info')
      if (orgRes.ok) {
        const orgData = await orgRes.json()
        setOrgName(orgData.name)
        setDescription(`${orgData.name} — Facilitator candidate: [name]`)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const markComplete = async (step: number) => {
    const progress = data?.onboarding_progress || {}
    progress[step] = true
    
    const payload: any = { onboarding_progress: progress }
    const completedCount = Object.values(progress).filter(Boolean).length

    if (completedCount === 7) {
      payload.onboarding_complete = true
    }

    try {
      const res = await fetch('/api/org/onboarding', {
        method: 'PATCH',
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        const updated = await res.json()
        setData(updated)
      }
    } catch (err) {
      console.error('Failed to update:', err)
    }
  }

  const handleFacilitatorSave = async () => {
    if (!facilitatorName || !facilitatorEmail) {
      alert('Please fill in both name and email')
      return
    }

    try {
      const res = await fetch('/api/org/onboarding', {
        method: 'PATCH',
        body: JSON.stringify({
          facilitator_candidate_name: facilitatorName,
          facilitator_candidate_email: facilitatorEmail,
          onboarding_progress: { ...data?.onboarding_progress, 4: true }
        })
      })

      if (res.ok) {
        const updated = await res.json()
        setData(updated)
        await markComplete(4)
      }
    } catch (err) {
      console.error('Failed to save:', err)
    }
  }

  const handleTrainingRequest = async () => {
    try {
      const res = await fetch('/api/org/consultation', {
        method: 'POST',
        body: JSON.stringify({
          request_type: 'Facilitator certification training request',
          description: description || `${orgName} — Facilitator candidate: ${facilitatorName}`,
          submitted_by_name: facilitatorName,
          submitted_by_email: facilitatorEmail
        })
      })

      if (res.ok) {
        await fetch('/api/org/onboarding', {
          method: 'PATCH',
          body: JSON.stringify({
            training_requested: true,
            onboarding_progress: { ...data?.onboarding_progress, 5: true }
          })
        })
        await fetchOnboarding()
      }
    } catch (err) {
      console.error('Failed to submit training request:', err)
    }
  }

  const handleCohortSave = async () => {
    if (!targetDate) {
      alert('Please select a start date')
      return
    }

    try {
      const res = await fetch('/api/org/onboarding', {
        method: 'PATCH',
        body: JSON.stringify({
          target_cohort_date: targetDate,
          onboarding_progress: { ...data?.onboarding_progress, 7: true }
        })
      })

      if (res.ok) {
        await markComplete(7)
      }
    } catch (err) {
      console.error('Failed to save cohort:', err)
    }
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>

  const progress = data?.onboarding_progress || {}
  const completedCount = Object.values(progress).filter(Boolean).length

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: '#F4F1EC' }}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <h1 className="text-4xl font-bold mb-2" style={{ color: '#2D3142', fontFamily: 'Playfair Display, serif' }}>
          Welcome to the Live and Grieve™ Partner Hub
        </h1>
        <p className="text-base mb-8" style={{ color: '#7A7264' }}>
          Your license is active. Here are the steps to get your organization ready to launch.
        </p>

        {/* Progress Banner */}
        <div className="mb-8 p-6 rounded" style={{ backgroundColor: '#B8942F', color: '#FFFFFF' }}>
          <p className="text-lg font-semibold">
            {completedCount} of 7 steps complete
          </p>
          <div className="mt-2 bg-white rounded-full h-2" style={{ backgroundColor: '#FDF8EE' }}>
            <div
              className="h-2 rounded-full transition-all"
              style={{
                width: `${(completedCount / 7) * 100}%`,
                backgroundColor: '#2E7D50'
              }}
            />
          </div>
        </div>

        {/* Checklist Items */}
        <div className="space-y-4">
          {/* Step 1: Review ILA */}
          <ChecklistItem
            number={1}
            title="Review your Institutional License Agreement"
            completed={progress[1]}
            onComplete={() => markComplete(1)}
          >
            <button
              onClick={async () => {
                const res = await fetch('/api/org/documents?file=ila')
                if (res.ok) {
                  const { url } = await res.json()
                  window.open(url, '_blank')
                  await markComplete(1)
                }
              }}
              className="px-4 py-2 rounded text-sm font-medium transition"
              style={{ backgroundColor: '#B8942F', color: '#FFFFFF' }}
            >
              Open Document
            </button>
          </ChecklistItem>

          {/* Step 2: Program Overview */}
          <ChecklistItem
            number={2}
            title="Review the Program Overview"
            completed={progress[2]}
            onComplete={() => markComplete(2)}
          >
            <button
              onClick={async () => {
                const res = await fetch('/api/org/documents?file=program-overview')
                if (res.ok) {
                  const { url } = await res.json()
                  window.open(url, '_blank')
                  await markComplete(2)
                }
              }}
              className="px-4 py-2 rounded text-sm font-medium transition"
              style={{ backgroundColor: '#B8942F', color: '#FFFFFF' }}
            >
              Open Document
            </button>
          </ChecklistItem>

          {/* Step 3: Appropriateness Guide */}
          <ChecklistItem
            number={3}
            title="Review the Participant Appropriateness Guide"
            completed={progress[3]}
            onComplete={() => markComplete(3)}
          >
            <p className="text-sm mb-3" style={{ color: '#7A7264' }}>
              Understanding who this program serves will help you identify the right participants for your first cohort.
            </p>
            <button
              onClick={async () => {
                const res = await fetch('/api/org/documents?file=appropriateness-guide')
                if (res.ok) {
                  const { url } = await res.json()
                  window.open(url, '_blank')
                  await markComplete(3)
                }
              }}
              className="px-4 py-2 rounded text-sm font-medium transition"
              style={{ backgroundColor: '#B8942F', color: '#FFFFFF' }}
            >
              Open Document
            </button>
          </ChecklistItem>

          {/* Step 4: Facilitator Candidate */}
          <ChecklistItem
            number={4}
            title="Identify your facilitator candidate"
            completed={progress[4]}
          >
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#2D3142' }}>
                  Name
                </label>
                <input
                  type="text"
                  value={facilitatorName}
                  onChange={(e) => setFacilitatorName(e.target.value)}
                  className="w-full px-3 py-2 border rounded text-sm"
                  style={{ borderColor: '#E2DDD7' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#2D3142' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={facilitatorEmail}
                  onChange={(e) => setFacilitatorEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded text-sm"
                  style={{ borderColor: '#E2DDD7' }}
                />
              </div>
              <button
                onClick={handleFacilitatorSave}
                className="px-4 py-2 rounded text-sm font-medium transition"
                style={{ backgroundColor: '#B8942F', color: '#FFFFFF' }}
              >
                Save
              </button>
            </div>
          </ChecklistItem>

          {/* Step 5: Facilitator Training */}
          <ChecklistItem
            number={5}
            title="Request facilitator certification training"
            completed={progress[5]}
          >
            {!progress[5] && (
              <button
                onClick={handleTrainingRequest}
                disabled={!facilitatorName || !facilitatorEmail}
                className="px-4 py-2 rounded text-sm font-medium transition disabled:opacity-50"
                style={{ backgroundColor: '#B8942F', color: '#FFFFFF' }}
              >
                Submit Request
              </button>
            )}
            {progress[5] && (
              <p className="text-sm" style={{ color: '#2E7D50' }}>
                ✓ Training request submitted. Wayne will confirm your facilitator's certification.
              </p>
            )}
          </ChecklistItem>

          {/* Step 6: Workbooks */}
          <ChecklistItem
            number={6}
            title="Order participant workbooks"
            completed={progress[6]}
          >
            <div className="space-y-3">
              <div className="flex gap-3">
                <a
                  href="https://www.amazon.com/dp/PLACEHOLDER"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded text-sm font-medium transition"
                  style={{ backgroundColor: '#B8942F', color: '#FFFFFF' }}
                >
                  Order on Amazon
                </a>
                <a
                  href="/contact?inquiry=bulk-workbook-order"
                  className="px-4 py-2 rounded text-sm font-medium transition"
                  style={{ backgroundColor: '#B8942F', color: '#FFFFFF' }}
                >
                  Bulk order (10+ copies)
                </a>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={workbookOrdered}
                  onChange={(e) => {
                    setWorkbookOrdered(e.target.checked)
                    if (e.target.checked) {
                      markComplete(6)
                    }
                  }}
                />
                <span className="text-sm" style={{ color: '#2D3142' }}>
                  I've placed my order
                </span>
              </label>
            </div>
          </ChecklistItem>

          {/* Step 7: Cohort Launch */}
          <ChecklistItem
            number={7}
            title="Confirm cohort launch readiness"
            completed={progress[7]}
          >
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#2D3142' }}>
                  Target cohort start date
                </label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded text-sm"
                  style={{ borderColor: '#E2DDD7' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#2D3142' }}>
                  Group size
                </label>
                <select
                  value={groupSize}
                  onChange={(e) => setGroupSize(e.target.value)}
                  className="w-full px-3 py-2 border rounded text-sm"
                  style={{ borderColor: '#E2DDD7' }}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#2D3142' }}>
                  Format
                </label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className="w-full px-3 py-2 border rounded text-sm"
                  style={{ borderColor: '#E2DDD7' }}
                >
                  <option>In-person</option>
                  <option>Virtual</option>
                  <option>Hybrid</option>
                </select>
              </div>
              <button
                onClick={handleCohortSave}
                className="px-4 py-2 rounded text-sm font-medium transition"
                style={{ backgroundColor: '#B8942F', color: '#FFFFFF' }}
              >
                Save
              </button>
            </div>
          </ChecklistItem>
        </div>

        {/* Completion Message & Continue Button */}
        <div className="mt-12">
          {data?.onboarding_complete ? (
            <div className="p-6 rounded mb-6" style={{ backgroundColor: '#E8F5E9', borderLeft: '4px solid #2E7D50' }}>
              <p className="font-semibold mb-2" style={{ color: '#2E7D50' }}>
                ✓ Launch preparation complete
              </p>
              <p className="text-sm" style={{ color: '#2E7D50' }}>
                Your facilitator certification training will be confirmed by Wayne shortly.
              </p>
            </div>
          ) : null}

          <Link
            href="/org/hub"
            className="inline-block px-6 py-3 rounded font-medium transition"
            style={{ backgroundColor: '#B8942F', color: '#FFFFFF' }}
          >
            Continue to Hub →
          </Link>
        </div>
      </div>
    </div>
  )
}

function ChecklistItem({
  number,
  title,
  completed,
  onComplete,
  children
}: {
  number: number
  title: string
  completed: boolean
  onComplete?: () => void
  children: React.ReactNode
}) {
  return (
    <div
      className="p-6 rounded border"
      style={{
        backgroundColor: '#FFFFFF',
        borderColor: completed ? '#2E7D50' : '#E2DDD7'
      }}
    >
      <div className="flex items-start gap-4">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm"
          style={{
            backgroundColor: completed ? '#2E7D50' : '#E2DDD7',
            color: completed ? '#FFFFFF' : '#7A7264'
          }}
        >
          {completed ? '✓' : number}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold mb-3" style={{ color: '#2D3142' }}>
            {title}
          </h3>
          <div className="text-sm">{children}</div>
        </div>
      </div>
    </div>
  )
}
