
import { useState } from 'react'
import './App.css'

const API_BASE = 'http://127.0.0.1:8000'

function App() {
  const [form, setForm] = useState({
    name: '',
    incident: 'Medical',
    block: '',
    floor: '',
    message: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const updateField = (event) => {
    const { name, value } = event.target
    setForm((previous) => ({ ...previous, [name]: value }))
  }

  const submitSOS = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch(`${API_BASE}/api/sos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.detail || 'Unable to submit SOS')
      }

      setResult(data)
    } catch (err) {
      setError(err.message || 'Could not connect to the FIREFLY backend.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="sender-shell">
      <header className="sender-header">
        <div className="sender-logo">F</div>
        <div>
          <strong>FIREFLY</strong>
          <span> / SOS SENDER</span>
        </div>
        <span className="sender-live"><i /> SYSTEM READY</span>
      </header>

      <section className="sender-content">
        <p className="sender-eyebrow">EMERGENCY MESH / INCIDENT REPORTING</p>
        <h1>Send an <span>SOS.</span></h1>
        <p className="sender-subtitle">
          Report an incident to the FIREFLY emergency response network.
        </p>

        <form className="sender-form" onSubmit={submitSOS}>
          <label>
            Your name
            <input
              name="name"
              value={form.name}
              onChange={updateField}
              placeholder="Enter your name"
              required
            />
          </label>

          <label>
            Incident type
            <select name="incident" value={form.incident} onChange={updateField}>
              <option>Medical</option>
              <option>Fire</option>
              <option>Security</option>
              <option>Accident</option>
              <option>Other</option>
            </select>
          </label>

          <div className="sender-two-col">
            <label>
              Building / Block
              <input
                name="block"
                value={form.block}
                onChange={updateField}
                placeholder="e.g. Block A"
                required
              />
            </label>

            <label>
              Floor / Location
              <input
                name="floor"
                value={form.floor}
                onChange={updateField}
                placeholder="e.g. Floor 2"
                required
              />
            </label>
          </div>

          <label>
            Emergency details
            <textarea
              name="message"
              value={form.message}
              onChange={updateField}
              placeholder="Briefly describe the situation..."
              rows={4}
              required
            />
          </label>

          {error && <div className="sender-error" role="alert">{error}</div>}

          <button className="sender-submit" type="submit" disabled={loading}>
            {loading ? 'Sending SOS...' : 'Send Emergency SOS →'}
          </button>

          {result && (
            <section className="sender-result" aria-live="polite">
              <span className="result-label">SOS SUBMITTED</span>
              <h2>Alert received by FIREFLY</h2>
              <p>Alert ID: <strong>{result.id || result.alert_id || 'Created'}</strong></p>
              {Array.isArray(result.route) && (
                <p>Route: {result.route.join(' → ')}</p>
              )}
              <p>Status: {result.status || 'Submitted'}</p>
            </section>
          )}
        </form>
      </section>
    </main>
  )
}

export default App
