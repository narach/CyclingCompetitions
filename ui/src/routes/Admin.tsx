import { useEffect, useMemo, useRef, useState } from 'react'
import { createEvent, updateEvent } from '../middleware/events'
import type { EventCreateInput, Event, NewEventFormState } from '../types'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { loginAdmin, storeAdminToken, getAdminToken } from '../middleware/auth'

const initialState: NewEventFormState = {
  event_name: '',
  event_date: '',
  event_time: '',
  event_description: '',
  event_route: '',
  event_location: ''
}

// API calls are encapsulated in middleware/events

export default function Admin() {
  const { t } = useTranslation()
  const location = useLocation() as any
  const [authOpen, setAuthOpen] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [authUser, setAuthUser] = useState('')
  const [authPass, setAuthPass] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [form, setForm] = useState<NewEventFormState>(initialState)
  const fileRef = useRef<HTMLInputElement | null>(null)
  const [editEvent, setEditEvent] = useState<Event | null>(null)

  useEffect(() => {
    const token = getAdminToken()
    if (!token) setAuthOpen(true)
  }, [])

  useEffect(() => {
    const toEdit: Event | undefined = location?.state?.editEvent
    if (toEdit) {
      setEditEvent(toEdit)
      const d = new Date(toEdit.event_time)
      const date = isNaN(d.getTime()) ? '' : d.toISOString().slice(0,10)
      const time = isNaN(d.getTime()) ? '' : d.toISOString().slice(11,16)
      setForm({
        event_name: toEdit.event_name || '',
        event_date: date,
        event_time: time,
        event_description: toEdit.event_description || '',
        event_route: '',
        event_location: toEdit.event_start || ''
      })
      setShowForm(true)
    }
    if (location?.state?.create) {
      setEditEvent(null)
      setForm(initialState)
      setShowForm(true)
    }
  }, [location?.state])

  const isValid = useMemo(() => {
    const hasFile = !!fileRef.current?.files && fileRef.current.files.length > 0
    const hasRequired = !!(form.event_name.trim() && form.event_date && form.event_time)
    return !!(hasRequired && (editEvent ? true : hasFile))
  }, [form, editEvent])

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  const onSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const dt = new Date(`${form.event_date}T${form.event_time}`)
      const fd = new FormData()
      fd.append('event_name', form.event_name.trim())
      fd.append('event_time', dt.toISOString())
      if (form.event_description.trim()) fd.append('event_description', form.event_description.trim())
      if (form.event_location.trim()) fd.append('event_start', form.event_location.trim())
      const f = fileRef.current?.files?.[0]
      if (f) {
        const routeName = f.name.replace(/\.[^.]+$/,'')
        fd.append('route', f, f.name)
        fd.append('route_name', routeName)
      }
      if (editEvent) await updateEvent(editEvent.id, fd)
      else await createEvent(fd)
      setMessage(t('admin.success'))
      setForm(initialState)
      if (fileRef.current) fileRef.current.value = ''
      setShowForm(false)
      setEditEvent(null)
    } catch (e: any) {
      setMessage(t('admin.failure', { error: e.message || String(e) }))
    } finally {
      setSaving(false)
    }
  }

  const onAuth = async () => {
    setAuthError(null)
    try {
      const { accessToken } = await loginAdmin(authUser.trim(), authPass)
      storeAdminToken(accessToken)
      setAuthOpen(false)
      setAuthUser('')
      setAuthPass('')
    } catch (e: any) {
      setAuthError(t('auth.errors.wrongCredentials'))
    }
  }

  return (
    <div>
      {authOpen && (
        <div className="modal d-block" tabIndex={-1}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{t('auth.title')}</h5>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">{t('auth.username')}</label>
                  <input className="form-control" value={authUser} onChange={(e) => setAuthUser(e.target.value)} />
                </div>
                <div className="mb-3">
                  <label className="form-label">{t('auth.password')}</label>
                  <input type="password" className="form-control" value={authPass} onChange={(e) => setAuthPass(e.target.value)} />
                </div>
                {authError && <div className="alert alert-danger" role="alert">{authError}</div>}
              </div>
              <div className="modal-footer">
                <button className="btn btn-primary" onClick={onAuth}>{t('auth.login')}</button>
              </div>
            </div>
          </div>
        </div>
      )}
      <h2>{t('admin.title')}</h2>
      <div className="mb-3">
        <a className="btn btn-outline-secondary" href="/admin/events">{t('admin.viewEvents')}</a>
      </div>
      {/* Create button moved to /admin/events */}

      {showForm && (
        <div className="card mt-3">
          <div className="card-body">
            <div className="mb-3">
              <label className="form-label">{t('admin.labels.name')}</label>
              <input className="form-control" name="event_name" value={form.event_name} onChange={onChange} />
            </div>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">{t('admin.labels.date')}</label>
                <input type="date" className="form-control" name="event_date" value={form.event_date} onChange={onChange} />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">{t('admin.labels.time')}</label>
                <input type="time" className="form-control" name="event_time" value={form.event_time} onChange={onChange} />
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label">{t('admin.labels.description')}</label>
              <textarea className="form-control" name="event_description" value={form.event_description} onChange={onChange} rows={3} />
            </div>
            <div className="mb-3">
              <label className="form-label">{t('admin.labels.route')}</label>
              <input ref={fileRef} type="file" className="form-control" accept=".gpx,application/gpx+xml,application/octet-stream" />
              <div className="form-text">GPX only</div>
            </div>
            <div className="mb-3">
              <label className="form-label">{t('admin.labels.location')}</label>
              <input className="form-control" name="event_location" value={form.event_location} onChange={onChange} placeholder="42.4411,19.2636" />
            </div>
            <div className="d-flex gap-2">
              <button className="btn btn-success" disabled={!isValid || saving} onClick={onSave}>{editEvent ? 'Save' : t('admin.save')}</button>
              <button className="btn btn-outline-secondary" disabled={saving} onClick={() => setShowForm(false)}>{t('common.cancel')}</button>
            </div>
            {message && <div className="mt-3 alert alert-info" role="alert">{message}</div>}
          </div>
        </div>
      )}
    </div>
  )
}


