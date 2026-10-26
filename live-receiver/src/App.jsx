
import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'

const API_BASE = 'http://127.0.0.1:8000'
const WS_URL = 'ws://127.0.0.1:8000/ws'

function App() {
  const [connected, setConnected] = useState(false)
  const [events, setEvents] = useState([])
  const [alerts, setAlerts] = useState([])
  const [error, setError] = useState('')
  const socketRef = useRef(null)
  const reconnectTimer = useRef(null)
  const reconnectDelay = useRef(1000)
  const mounted = useRef(false)

  const loadAlerts = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/alerts`)
      if (!response.ok) throw new Error('Unable to load alerts')
      const data = await response.json()
      setAlerts(data)
      setError('')
    } catch {
      setError('Backend unavailable. Check that FastAPI is running on port 8000.')
    }
  }, [])

  const acknowledgeAlert = async (alertId) => {
    try {
      const response = await fetch(
        `${API_BASE}/api/alerts/${encodeURIComponent(alertId)}/acknowledge`,
        { method: 'POST' },
      )
      const data = await response.json()
      if (!response.ok) throw new Error(data.detail || 'Acknowledgement failed')
      setAlerts((previous) =>
        previous.map((alert) => alert.id === alertId ? data : alert),
      )
      setError('')
    } catch (err) {
      setError(err.message || 'Unable to acknowledge alert.')
    }
  }

  useEffect(() => {
    mounted.current = true
    let socket

    const connect = () => {
      if (!mounted.current) return

      socket = new WebSocket(WS_URL)
      socketRef.current = socket

      socket.onopen = () => {
        if (!mounted.current) return
        setConnected(true)
        setError('')
        reconnectDelay.current = 1000
      }

      socket.onmessage = (message) => {
        try {
          const payload = JSON.parse(message.data)

          if (payload.type === 'event' && payload.data) {
            const incoming = payload.data
            setEvents((previous) => {
              if (previous.some((event) => event.id === incoming.id)) return previous
              return [incoming, ...previous].slice(0, 100)
            })

            // Refresh the authoritative alert list when an SOS-related event arrives.
            if (incoming.alert_id) {
              fetch(`${API_BASE}/api/alerts`)
                .then((response) => response.json())
                .then((data) => {
                  if (mounted.current && Array.isArray(data)) setAlerts(data)
                })
                .catch(() => {})
            }
          }
        } catch {
          setError('Received an unreadable WebSocket message.')
        }
      }

      socket.onclose = () => {
        if (!mounted.current) return
        setConnected(false)
        reconnectTimer.current = setTimeout(connect, reconnectDelay.current)
        reconnectDelay.current = Math.min(reconnectDelay.current * 2, 10000)
      }

      socket.onerror = () => {
        if (mounted.current) setConnected(false)
        socket.close()
      }
    }

    loadAlerts()
    connect()

    return () => {
      mounted.current = false
      clearTimeout(reconnectTimer.current)
      socket?.close()
      socketRef.current = null
    }
  }, [loadAlerts])

  const activeCount = alerts.filter(
    (alert) => !alert.acknowledged && alert.status !== 'Failed',
  ).length

  return (
    <main className="receiver-shell">
      <header className="receiver-topbar">
        <a className="receiver-brand" href="/" aria-label="FIREFLY receiver home">
          <span className="receiver-mark">F</span>
          <span>FIREFLY <span className="brand-muted">/ COMMAND</span></span>
        </a>
        <div className={`connection-pill ${connected ? 'is-connected' : 'is-disconnected'}`}>
          <span className="status-dot" />
          {connected ? 'LIVE CONNECTION' : 'RECONNECTING'}
        </div>
      </header>

      <section className="receiver-content">
        <div className="receiver-eyebrow">EMERGENCY RESPONSE SYSTEM / COMMAND GATEWAY</div>
        <div className="receiver-title-row">
          <div>
            <h1>Incident <span>command.</span></h1>
            <p>Monitor incoming SOS alerts and mesh network events in real time.</p>
          </div>
          <div className="gateway-status">
            <span className="status-dot" />
            <span><strong>GW-01</strong><small>COMMAND GATEWAY</small></span>
          </div>
        </div>

        {error && <div className="receiver-error" role="alert">{error}</div>}

        <section className="receiver-stats">
          <div className="stat-card">
            <span>ACTIVE ALERTS</span>
            <strong>{activeCount.toString().padStart(2, '0')}</strong>
          </div>
          <div className="stat-card">
            <span>RECENT EVENTS</span>
            <strong>{events.length.toString().padStart(2, '0')}</strong>
          </div>
          <div className="stat-card">
            <span>CONNECTION</span>
            <strong className={connected ? 'green-text' : 'red-text'}>
              {connected ? 'ONLINE' : 'OFFLINE'}
            </strong>
          </div>
        </section>

        <div className="receiver-grid">
          <section className="panel alert-panel">
            <div className="panel-heading">
              <div>
                <span className="panel-kicker">PRIORITY QUEUE</span>
                <h2>Incoming alerts</h2>
              </div>
              <span className="count-chip">{alerts.length} TOTAL</span>
            </div>

            {alerts.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">⌁</span>
                <strong>No alerts received</strong>
                <p>New SOS alerts will appear here when submitted.</p>
              </div>
            ) : (
              <div className="alert-list">
                {alerts.map((alert) => (
                  <article className={`alert-card ${alert.status === 'Failed' ? 'alert-failed' : ''}`} key={alert.id}>
                    <div className="alert-card-top">
                      <span className={`incident-badge ${alert.status === 'Failed' ? 'badge-failed' : alert.acknowledged ? 'badge-ack' : 'badge-active'}`}>
                        {alert.status === 'Failed' ? 'FAILED' : alert.acknowledged ? 'ACKNOWLEDGED' : 'SOS ALERT'}
                      </span>
                      <time>{alert.time || '—'}</time>
                    </div>
                    <h3>{alert.incident || 'Emergency'} incident</h3>
                    <p className="alert-location">{alert.block || 'Unknown block'} · {alert.floor || 'Location unavailable'}</p>
                    <p className="alert-id">ID: {alert.id}</p>
                    {alert.message && <p className="alert-message">{alert.message}</p>}
                    <div className="route-box">
                      <span>SELECTED ROUTE</span>
                      <strong>{alert.route?.length ? alert.route.join(' → ') : 'No route available'}</strong>
                    </div>
                    {alert.failure_message && <p className="failure-note">{alert.failure_message}</p>}
                    {!alert.acknowledged && alert.status !== 'Failed' && (
                      <button className="ack-button" onClick={() => acknowledgeAlert(alert.id)}>
                        Acknowledge alert →
                      </button>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="panel event-panel">
            <div className="panel-heading">
              <div>
                <span className="panel-kicker">WEBSOCKET / LIVE STREAM</span>
                <h2>Event timeline</h2>
              </div>
              <span className={`stream-indicator ${connected ? 'stream-live' : ''}`}>
                {connected ? '● LIVE' : '○ WAITING'}
              </span>
            </div>

            {events.length === 0 ? (
              <div className="empty-state compact-empty">
                <span className="empty-icon">⌁</span>
                <strong>Waiting for events</strong>
                <p>Keep this screen open while an SOS is submitted.</p>
              </div>
            ) : (
              <div className="event-list">
                {events.map((event) => (
                  <article className="event-row" key={event.id}>
                    <span className="event-line-dot" />
                    <div className="event-body">
                      <div className="event-row-top">
                        <strong>{event.type.replaceAll('_', ' ')}</strong>
                        <time>{event.timestamp ? new Date(event.timestamp).toLocaleTimeString() : ''}</time>
                      </div>
                      <p>{event.message}</p>
                      <small>{event.id}{event.alert_id ? ` · ${event.alert_id}` : ''}</small>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>

        <footer className="receiver-footer">
          <span>FIREFLY / EMERGENCY MESH</span>
          <span>LIVE EVENTS ARE SIMULATED NETWORK DATA</span>
        </footer>
      </section>
    </main>
  )
}

export default App
