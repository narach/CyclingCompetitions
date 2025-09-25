import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

type EventItem = {
  id: string
  event_name: string
  event_time: string
  event_description?: string | null
  route?: string | null
  event_start?: string | null
}

const API_URL = 'https://8dakoeglog.execute-api.eu-central-1.amazonaws.com'

export default function Events() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [events, setEvents] = useState<EventItem[]>([])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const resp = await fetch(`${API_URL}/events`)
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
        const data = await resp.json()
        setEvents(Array.isArray(data.events) ? data.events : [])
      } catch (e: any) {
        setError(e.message || String(e))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const hasEvents = useMemo(() => events.length > 0, [events])

  const onRegister = (ev: EventItem) => {
    navigate(`/register/${encodeURIComponent(ev.id)}`)
  }

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h2 className="mb-0">Events</h2>
        <Link to="/admin" className="btn btn-outline-secondary">Admin</Link>
      </div>

      {loading && <div className="alert alert-light">Loading events…</div>}
      {error && (
        <div className="alert alert-danger" role="alert">
          Failed to load events: {error}
        </div>
      )}

      {!loading && !error && !hasEvents && (
        <div className="alert alert-info">No events available yet.</div>
      )}

      {hasEvents && (
        <div className="table-responsive">
          <table className="table table-striped table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th scope="col">When</th>
                <th scope="col">Name</th>
                <th scope="col" className="d-none d-md-table-cell">Description</th>
                <th scope="col" className="d-none d-lg-table-cell">Route</th>
                <th scope="col" className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map(ev => {
                const dt = new Date(ev.event_time)
                const when = isNaN(dt.getTime()) ? ev.event_time : dt.toLocaleString()
                return (
                  <tr key={ev.id}>
                    <td>{when}</td>
                    <td>{ev.event_name}</td>
                    <td className="d-none d-md-table-cell">
                      {ev.event_description || <span className="text-muted">—</span>}
                    </td>
                    <td className="d-none d-lg-table-cell">
                      {ev.route ? (
                        <a href={ev.route} target="_blank" rel="noreferrer">View</a>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="text-end">
                      <button className="btn btn-primary" onClick={() => onRegister(ev)}>Register</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}


