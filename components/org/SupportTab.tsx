'use client'

import { useState } from 'react'

export default function SupportTab() {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [contact, setContact] = useState('Email')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    try {
      const res = await fetch('/api/org/consultation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_type: 'Org contact support request',
          description: `Subject: ${subject}\nMessage: ${message}\nPreferred contact: ${contact}`,
          submitted_by_name: '',
          submitted_by_email: '',
        }),
      })
      if (res.ok) {
        setSent(true)
        setSubject('')
        setMessage('')
        setContact('Email')
      }
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="max-w-lg">
      {sent && (
        <div className="p-4 rounded mb-6" style={{ backgroundColor: '#E8F5E9', border: '1px solid #2E7D50' }}>
          <p className="text-sm font-medium" style={{ color: '#2E7D50' }}>
            Your message has been sent. Wayne will get back to you shortly.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: '#7A7264' }}>Subject</label>
          <input
            type="text" value={subject} onChange={e => setSubject(e.target.value)}
            required
            className="w-full rounded border p-2 text-sm"
            style={{ borderColor: '#E2DDD7', color: '#2D3142' }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: '#7A7264' }}>Message</label>
          <textarea
            value={message} onChange={e => setMessage(e.target.value)}
            required rows={5}
            className="w-full rounded border p-2 text-sm"
            style={{ borderColor: '#E2DDD7', color: '#2D3142', resize: 'vertical' }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: '#7A7264' }}>Preferred contact method</label>
          <select
            value={contact} onChange={e => setContact(e.target.value)}
            className="w-full rounded border p-2 text-sm"
            style={{ borderColor: '#E2DDD7', color: '#2D3142' }}
          >
            <option>Email</option>
            <option>Phone</option>
          </select>
        </div>

        <button
          type="submit" disabled={sending}
          className="px-5 py-2 rounded font-medium text-sm"
          style={{
            backgroundColor: '#B8942F',
            color: '#FFFFFF',
            opacity: sending ? 0.7 : 1,
            cursor: sending ? 'not-allowed' : 'pointer',
          }}
        >
          {sending ? 'Sending...' : 'Submit'}
        </button>
      </form>
    </div>
  )
}
