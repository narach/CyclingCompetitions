import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { Event } from '../types'
import { fetchEvents } from '../middleware/events'
import { useTranslation } from 'react-i18next'

export default function Events() {
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

  const onRegister = (ev: Event) => {
    navigate(`/register/${encodeURIComponent(String(ev.id))}`,
      { state: { event: ev } }
    )
  }

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h2 className="mb-0">{t('events.title')}</h2>
        <Link to="/admin" className="btn btn-outline-secondary">{t('nav.admin')}</Link>
      </div>

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
                <th scope="col" className="text-end">{t('events.table.actions')}</th>
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
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => navigate('/route', { state: { gpxUrl: ev.route, title: ev.event_name } })}
                        >
                          {t('common.view')}
                        </button>
                      ) : (
                        <span className="text-muted">{t('common.dash')}</span>
                      )}
                    </td>
                    <td className="text-end">
                      <button className="btn btn-primary" onClick={() => onRegister(ev)}>{t('common.register')}</button>
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


