'use client'

import { useEffect, useState } from 'react'

interface Cohort {
  total_enrolled: number
  total_completed: number
  book_module: string
}

export default function ReportsTab() {
  const [cohorts, setCohorts] = useState<Cohort[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    fetchCohorts()
  }, [])

  const fetchCohorts = async () => {
    try {
      const res = await fetch('/api/org/cohorts')
      if (res.ok) {
        const data = await res.json()
        // Need to fetch full cohort data for stats
        const fullRes = await fetch('/api/org/cohorts')
        if (fullRes.ok) {
          const fullData = await fullRes.json()
          // Reconstruct with needed fields
          setCohorts(fullData.map((c: any) => ({
            total_enrolled: c.enrolled,
            total_completed: Math.round((c.completionRate / 100) * c.enrolled),
            book_module: c.book
          })))
        }
      }
    } catch (err) {
      console.error('Failed to fetch cohorts:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateReport = async () => {
    setGenerating(true)
    try {
      const res = await fetch('/api/org/reports/generate', {
        method: 'POST'
      })

      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'impact-report.pdf'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    } catch (err) {
      console.error('Failed to generate report:', err)
    } finally {
      setGenerating(false)
    }
  }

  if (loading) return <div>Loading report data...</div>

  const totalParticipants = cohorts.reduce((sum, c) => sum + c.total_enrolled, 0)
  const totalCompleted = cohorts.reduce((sum, c) => sum + c.total_completed, 0)
  const avgCompletionRate = cohorts.length > 0 ? Math.round((totalCompleted / totalParticipants) * 100) : 0
  const cohortsRun = cohorts.length
  const booksCovered = new Set(cohorts.map(c => c.book_module)).size

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-6">
        <div className="p-6 rounded border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E2DDD7' }}>
          <p className="text-sm font-medium mb-2" style={{ color: '#7A7264' }}>
            Total Participants Served
          </p>
          <p className="text-3xl font-bold" style={{ color: '#2D3142' }}>
            {totalParticipants}
          </p>
        </div>

        <div className="p-6 rounded border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E2DDD7' }}>
          <p className="text-sm font-medium mb-2" style={{ color: '#7A7264' }}>
            Average Completion Rate
          </p>
          <p className="text-3xl font-bold" style={{ color: '#2D3142' }}>
            {avgCompletionRate}%
          </p>
        </div>

        <div className="p-6 rounded border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E2DDD7' }}>
          <p className="text-sm font-medium mb-2" style={{ color: '#7A7264' }}>
            Cohorts Run
          </p>
          <p className="text-3xl font-bold" style={{ color: '#2D3142' }}>
            {cohortsRun}
          </p>
        </div>

        <div className="p-6 rounded border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E2DDD7' }}>
          <p className="text-sm font-medium mb-2" style={{ color: '#7A7264' }}>
            Books Covered
          </p>
          <p className="text-3xl font-bold" style={{ color: '#2D3142' }}>
            {booksCovered}
          </p>
        </div>
      </div>

      {/* Download Report Button */}
      <div className="p-6 rounded border text-center" style={{ backgroundColor: '#FFFFFF', borderColor: '#E2DDD7' }}>
        <p className="text-sm mb-4" style={{ color: '#7A7264' }}>
          Generate a detailed PDF report of your organization's impact.
        </p>
        <button
          onClick={handleGenerateReport}
          disabled={generating}
          className="px-6 py-2 rounded font-medium transition disabled:opacity-50"
          style={{ backgroundColor: '#B8942F', color: '#FFFFFF' }}
        >
          {generating ? 'Generating...' : 'Download Impact Report (PDF)'}
        </button>
      </div>
    </div>
  )
}
