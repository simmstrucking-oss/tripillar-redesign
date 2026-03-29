'use client'

import { useState } from 'react'

export default function SupportTab() {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [contact, setContact] = useState('Email')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const res = await fetch('/api/org/consultation', {
        method: 'POST',
        body: JSON.stringify({
          request_type: 'Org contact support request',
          description: `Subject: ${subject}\n\nMessage: ${message}\n\nPreferred contact: ${contact}`,
          submitted_by_name: 'Org Contact',
          submitted_by_email: ''
        })
      })

      if (res.ok) {
        setSubmitted(true)
        setSubject('')
        setMessage('')
        setTimeout(() => setSubmitted(false), 5000)
      } else {
        setError('Failed to submit request. Please try again.')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <form onSubmit={handleSubmit} className="p-6 rounded border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E2DDD7' }}>
        <h3 className="text-lg font-bold mb-4" style={{ color: '#2D3142' }}>
          Submit a Support Request
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#2D3142' }}>
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded text-sm"
              style={{ borderColor: '#E2DDD7' }}
              placeholder="Brief subject of your request"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#2D3142' }}>
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded text-sm"
              style={{ borderColor: '#E2DDD7' }}
              rows={6}
              placeholder="Tell us more about your question or issue"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#2D3142' }}>
              Preferred Contact Method
            </label>
            <select
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className="w-full px-4 py-2 border rounded text-sm"
              style={{ borderColor: '#E2DDD7' }}
            >
              <option>Email</option>
              <option>Phone</option>
            </select>
          </div>

          {error && (
            <div className="p-3 rounded text-sm" style={{ backgroundColor: '#FDE8E8', color: '#C0392B' }}>
              {error}
            </div>
          )}

          {submitted && (
            <div className="p-3 rounded text-sm" style={{ backgroundColor: '#E8F5E9', color: '#2E7D50' }}>
              ✓ Your request has been submitted. Wayne will respond shortly.
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || submitted}
            className="w-full py-2 rounded font-medium transition disabled:opacity-50"
            style={{ backgroundColor: '#B8942F', color: '#FFFFFF' }}
          >
            {submitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>

      <div className="mt-6 p-4 rounded" style={{ backgroundColor: '#FDF8EE', borderLeft: '4px solid #B8942F' }}>
        <p className="text-sm font-semibold mb-2" style={{ color: '#2D3142' }}>
          Need immediate assistance?
        </p>
        <p className="text-sm" style={{ color: '#7A7264' }}>
          Contact Wayne directly at <strong>wayne@tripillarstudio.com</strong>
        </p>
      </div>
    </div>
  )
}
