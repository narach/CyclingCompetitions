import { useMemo, useState } from 'react'
import { createEvent } from '../middleware/events'
import type { EventCreateInput, NewEventFormState } from '../types'

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
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [form, setForm] = useState<NewEventFormState>(initialState)

  const isValid = useMemo(() => {
    return form.event_name.trim() && form.event_date && form.event_time && form.event_route.trim()
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
      const payload: EventCreateInput = {
        event_name: form.event_name.trim(),
        event_time: dt.toISOString(),
        event_description: form.event_description.trim() || undefined,
        route: form.event_route.trim(),
        event_start: form.event_location.trim() || undefined
      }
      await createEvent(payload)
      setMessage('Event created successfully')
      setForm(initialState)
      setShowForm(false)
    } catch (e: any) {
      setMessage(`Failed to create event: ${e.message || e}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <h2>Admin</h2>
      {!showForm && (
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>Create event</button>
      )}

      {showForm && (
        <div className="card mt-3">
          <div className="card-body">
            <div className="mb-3">
              <label className="form-label">Event name</label>
              <input className="form-control" name="event_name" value={form.event_name} onChange={onChange} />
            </div>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Event date</label>
                <input type="date" className="form-control" name="event_date" value={form.event_date} onChange={onChange} />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Event time</label>
                <input type="time" className="form-control" name="event_time" value={form.event_time} onChange={onChange} />
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label">Event description</label>
              <textarea className="form-control" name="event_description" value={form.event_description} onChange={onChange} rows={3} />
            </div>
            <div className="mb-3">
              <label className="form-label">Event route (URL)</label>
              <input className="form-control" name="event_route" value={form.event_route} onChange={onChange} placeholder="https://competitions.cycling-mne.club/data/route.gpx" />
            </div>
            <div className="mb-3">
              <label className="form-label">Event location (GPS)</label>
              <input className="form-control" name="event_location" value={form.event_location} onChange={onChange} placeholder="42.4411,19.2636" />
            </div>
            <div className="d-flex gap-2">
              <button className="btn btn-success" disabled={!isValid || saving} onClick={onSave}>Save event</button>
              <button className="btn btn-outline-secondary" disabled={saving} onClick={() => setShowForm(false)}>Cancel</button>
            </div>
            {message && <div className="mt-3 alert alert-info" role="alert">{message}</div>}
          </div>
        </div>
      )}
    </div>
  )
}


