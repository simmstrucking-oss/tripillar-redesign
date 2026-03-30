'use client'

import { useEffect, useState } from 'react'

interface Cohort {
  book_module: string
  total_enrolled: number
  total_completed: number
}

export default function ReportsTab() {
  const [cohorts, setCohorts] = useState<Cohort[]>([])
  const [loading, setLoading] = useState(true)
  const [pdfLoading, setPdfLoading] = useState(false)

  useEffect(() => {
    fetchCohorts()
  }, [])

  const fetchCohorts = async () => {
    try {
      const res = await fetch('/api/org/cohorts')
      if (res.ok) {
        const data = await res.json()
        setCohorts(data.cohorts ?? (Array.isArray(data) ? data : []))
      }
    } catch (err) {
      console.error('Failed to fetch cohorts:', err)
    } finally {
      setLoading(false)
    }
  }

  const downloadPdf = async () => {
    setPdfLoading(true)
    try {
      const res = await fetch('/api/org/reports/generate', { method: 'POST' })
      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'impact-report.pdf'
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)
      }
    } finally {
      setPdfLoading(false)
    }
  }

  if (loading) return <div>Loading reports...</div>

  const totalParticipants = cohorts.reduce((s, c) => s + (c.total_enrolled || 0), 0)
  const totalCompleted = cohorts.reduce((s, c) => s + (c.total_completed || 0), 0)
  const avgCompletion = totalParticipants > 0
    ? ((totalCompleted / totalParticipants) * 100).toFixed(1) + '%'
    : '0%'
  const booksCovered = new Set(cohorts.map(c => c.book_module).filter(Boolean)).size

  const stats = [
    { label: 'Total Participants', value: totalParticipants },
    { label: 'Avg Completion', value: avgCompletion },
    { label: 'Cohorts Run', value: cohorts.length },
    { label: 'Books Covered', value: booksCovered },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(s => (
          <div
            key={s.label}
            className="p-4 rounded text-center"
            style={{ backgroundColor: '#FDF8EE', border: '1px solid #E2DDD7' }}
          >
            <div className="text-2xl font-bold" style={{ color: '#1c3028', fontFamily: 'Playfair Display, serif' }}>
              {s.value}
            </div>
            <div className="text-xs mt-1" style={{ color: '#7A7264' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <button
        onClick={downloadPdf}
        disabled={pdfLoading}
        className="px-5 py-2 rounded font-medium text-sm"
        style={{
          backgroundColor: '#B8942F',
          color: '#FFFFFF',
          opacity: pdfLoading ? 0.7 : 1,
          cursor: pdfLoading ? 'not-allowed' : 'pointer',
        }}
      >
        {pdfLoading ? 'Generating...' : 'Download Impact Report (PDF)'}
      </button>
    </div>
  )
}
