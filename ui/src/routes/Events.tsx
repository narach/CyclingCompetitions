import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { Event } from '../types'
import { fetchEvents } from '../middleware/events'

export default function Events() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [events, setEvents] = useState<Event[]>([])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await fetchEvents()
        setEvents(data)
      } catch (e: any) {
        setError(e.message || String(e))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const hasEvents = useMemo(() => events.length > 0, [events])

  const onRegister = (ev: Event) => {
    navigate(`/register/${encodeURIComponent(String(ev.id))}`,
      { state: { event: ev } }
    )
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


