'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

interface ContactModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ContactModal({ isOpen, onClose }: ContactModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  // Prevent scrolling on the main page when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setErrorMessage('')

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send message')
      }

      setStatus('success')
      setFormData({ name: '', email: '', message: '' })
    } catch (error) {
      setStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Failed to send message')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          ✕
        </button>

        <div className="modal-postcard">
          <div className="modal-stamp-corner">
            <Image src="/stamp.png" alt="Stamp" width={150} height={41} />
          </div>

          <div className="modal-header">
            <div className="modal-logo">
              <Image src="/logo.png" alt="WhataGoodealTX" width={200} height={200} />
            </div>
            <h2>Send us a postcard!</h2>
          </div>

          {status === 'success' ? (
            <div className="success-message">
              <div className="success-icon">✓</div>
              <h3>Message sent!</h3>
              <p>We'll get back to you soon!</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="contact-form">
              <div className="form-group">
                <label htmlFor="name">Your Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  disabled={status === 'loading'}
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Your Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={status === 'loading'}
                />
              </div>

              <div className="form-group">
                <label htmlFor="message">Your Message</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  disabled={status === 'loading'}
                  rows={5}
                />
              </div>

              {status === 'error' && (
                <div className="error-message">
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                className="submit-button"
                disabled={status === 'loading'}
              >
                {status === 'loading' ? 'Sending...' : 'Send it!'}
              </button>
            </form>
          )}

          <div className="modal-footer">
            <p>✉️ We'll reply to you soon! ✉️</p>
          </div>
        </div>
      </div>
    </div>
  )
}
