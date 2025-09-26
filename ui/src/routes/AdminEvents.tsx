import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Event } from '../types'
import { fetchEvents, deleteEvent } from '../middleware/events'
import { useTranslation } from 'react-i18next'

export default function AdminEvents() {
  const navigate = useNavigate()
  const { t } = useTranslation()
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

  const onEdit = (ev: Event) => {
    navigate('/admin', { state: { editEvent: ev } })
  }

  const onDelete = async (ev: Event) => {
    if (!window.confirm('Delete this event? This cannot be undone.')) return
    try {
      await deleteEvent(ev.id)
      setEvents((list) => list.filter(e => e.id !== ev.id))
    } catch (e: any) {
      alert(e.message || String(e))
    }
  }

  return (
    <div>
      <h2 className="mb-3">{t('events.title')}</h2>

      {loading && <div className="alert alert-light">{t('events.loading')}</div>}
      {error && (
        <div className="alert alert-danger" role="alert">
          {t('events.loadError', { error })}
        </div>
      )}

      {!loading && !error && !hasEvents && (
        <div className="alert alert-info">{t('events.none')}</div>
      )}

      {hasEvents && (
        <div className="table-responsive">
          <table className="table table-striped table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th scope="col">{t('events.table.when')}</th>
                <th scope="col">{t('events.table.name')}</th>
                <th scope="col" className="d-none d-md-table-cell">{t('events.table.description')}</th>
                <th scope="col" className="d-none d-lg-table-cell">{t('events.table.route')}</th>
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
                      {ev.event_description || <span className="text-muted">{t('common.dash')}</span>}
                    </td>
                    <td className="d-none d-lg-table-cell">
                      {ev.route ? (
                        <a href={ev.route} target="_blank" rel="noreferrer">{t('common.view')}</a>
                      ) : (
                        <span className="text-muted">{t('common.dash')}</span>
                      )}
                    </td>
                    <td className="text-end">
                      <div className="btn-group">
                        <button className="btn btn-outline-primary" onClick={() => onEdit(ev)}>Edit</button>
                        <button className="btn btn-outline-danger" onClick={() => onDelete(ev)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      <div className="mt-3">
        <button className="btn btn-primary" onClick={() => navigate('/admin', { state: { create: true } })}>{t('admin.create')}</button>
      </div>
    </div>
  )
}


