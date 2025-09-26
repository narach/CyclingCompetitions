import { useMemo, useRef, useState } from 'react'
import { createEvent } from '../middleware/events'
import type { EventCreateInput, NewEventFormState } from '../types'
import { useTranslation } from 'react-i18next'

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
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [form, setForm] = useState<NewEventFormState>(initialState)
  const fileRef = useRef<HTMLInputElement | null>(null)

  const isValid = useMemo(() => {
    const hasFile = !!fileRef.current?.files && fileRef.current.files.length > 0
    return form.event_name.trim() && form.event_date && form.event_time && hasFile
  }, [form])

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
      if (f) fd.append('route', f, f.name)
      await createEvent(fd)
      setMessage(t('admin.success'))
      setForm(initialState)
      if (fileRef.current) fileRef.current.value = ''
      setShowForm(false)
    } catch (e: any) {
      setMessage(t('admin.failure', { error: e.message || String(e) }))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <h2>{t('admin.title')}</h2>
      {!showForm && (
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>{t('admin.create')}</button>
      )}

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
              <button className="btn btn-success" disabled={!isValid || saving} onClick={onSave}>{t('admin.save')}</button>
              <button className="btn btn-outline-secondary" disabled={saving} onClick={() => setShowForm(false)}>{t('common.cancel')}</button>
            </div>
            {message && <div className="mt-3 alert alert-info" role="alert">{message}</div>}
          </div>
        </div>
      )}
    </div>
  )
}


