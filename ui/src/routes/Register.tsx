import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

type RegistrationInput = {
  eventId: number
  name: string
  surname: string
  email: string
  phone?: string
  gender?: string
  birth_year?: number
  club?: string
  country?: string
  city?: string
}

type RegistrationDTO = {
  id: number
  event_id: number
  name: string
  surname: string
  email: string
  phone: string
  gender: string
  birth_year: number | null
  club: string
  country: string
  city: string
  start_number: number | null
  created_at: string
  updated_at: string
}

const API_URL = 'https://8dakoeglog.execute-api.eu-central-1.amazonaws.com'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i
const phoneRegex = /^[+]?[-()\s\d]{7,20}$/

export default function Register() {
  const navigate = useNavigate()
  const { eventId } = useParams()

  const eventIdNum = useMemo(() => {
    const n = Number(eventId)
    return Number.isInteger(n) ? n : NaN
  }, [eventId])

  const currentYear = new Date().getFullYear()
  const [form, setForm] = useState<RegistrationInput>({
    eventId: eventIdNum,
    name: '',
    surname: '',
    email: '',
    phone: '',
    gender: '',
    birth_year: undefined,
    club: '',
    country: '',
    city: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setForm((f) => ({ ...f, eventId: eventIdNum }))
  }, [eventIdNum])

  const years = useMemo(() => {
    const ys: number[] = []
    for (let y = 1925; y <= currentYear; y++) ys.push(y)
    return ys
  }, [currentYear])

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm((f) => ({
      ...f,
      [name]: name === 'birth_year' ? (value ? Number(value) : undefined) : value
    }))
  }

  const validate = (data: RegistrationInput): Record<string, string> => {
    const errs: Record<string, string> = {}
    if (!Number.isInteger(data.eventId)) errs.eventId = 'Invalid event'
    if (!data.name?.trim()) errs.name = 'Name is required'
    if (!data.surname?.trim()) errs.surname = 'Surname is required'
    if (!data.email?.trim()) errs.email = 'Email is required'
    if (data.email && !emailRegex.test(data.email)) errs.email = 'Invalid email'
    if (data.phone && !phoneRegex.test(data.phone)) errs.phone = 'Invalid phone'
    if (data.birth_year !== undefined) {
      if (!Number.isInteger(data.birth_year)) errs.birth_year = 'Birth year must be integer'
      else if (data.birth_year < 1925 || data.birth_year > currentYear) errs.birth_year = 'Birth year out of range'
    }
    return errs
  }

  const onSubmit = async () => {
    setServerError(null)
    const toSend: RegistrationInput = {
      eventId: form.eventId,
      name: form.name.trim(),
      surname: form.surname.trim(),
      email: form.email.trim(),
      phone: form.phone?.trim() || undefined,
      gender: form.gender?.trim() || undefined,
      birth_year: form.birth_year,
      club: form.club?.trim() || undefined,
      country: form.country?.trim() || undefined,
      city: form.city?.trim() || undefined
    }
    const v = validate(toSend)
    setErrors(v)
    if (Object.keys(v).length > 0) return

    try {
      setSubmitting(true)
      const resp = await fetch(`${API_URL}/registrations`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(toSend)
      })
      const text = await resp.text()
      if (!resp.ok) {
        let msg = ''
        try {
          const j = JSON.parse(text)
          msg = j?.message || j?.error || text
        } catch {
          msg = text
        }
        throw new Error(msg || `HTTP ${resp.status}`)
      }
      let data: { registration: RegistrationDTO }
      try {
        data = JSON.parse(text) as { registration: RegistrationDTO }
      } catch {
        throw new Error('Invalid response from server')
      }
      navigate(`/register/${encodeURIComponent(String(form.eventId))}/completed`, { state: data })
    } catch (e: any) {
      setServerError(e.message || String(e))
    } finally {
      setSubmitting(false)
    }
  }

  if (!Number.isInteger(eventIdNum)) {
    return (
      <div>
        <h2>Register</h2>
        <div className="alert alert-danger">Invalid event id in URL.</div>
        <Link to="/events" className="btn btn-outline-primary">Back to events</Link>
      </div>
    )
  }

  return (
    <div>
      <h2>Register</h2>

      {serverError && (
        <div className="alert alert-danger" role="alert">{serverError}</div>
      )}

      <div className="card">
        <div className="card-body">
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">Name <span className="text-danger">*</span></label>
              <input
                className={`form-control${errors.name ? ' is-invalid' : ''}`}
                name="name"
                value={form.name}
                onChange={onChange}
              />
              {errors.name && <div className="invalid-feedback">{errors.name}</div>}
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Surname <span className="text-danger">*</span></label>
              <input
                className={`form-control${errors.surname ? ' is-invalid' : ''}`}
                name="surname"
                value={form.surname}
                onChange={onChange}
              />
              {errors.surname && <div className="invalid-feedback">{errors.surname}</div>}
            </div>
          </div>

          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">Email <span className="text-danger">*</span></label>
              <input
                type="email"
                placeholder="your@email.com"
                className={`form-control${errors.email ? ' is-invalid' : ''}`}
                name="email"
                value={form.email}
                onChange={onChange}
              />
              {errors.email && <div className="invalid-feedback">{errors.email}</div>}
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Phone</label>
              <input
                placeholder="+382 67 123 456"
                className={`form-control${errors.phone ? ' is-invalid' : ''}`}
                name="phone"
                value={form.phone}
                onChange={onChange}
              />
              {errors.phone && <div className="invalid-feedback">{errors.phone}</div>}
            </div>
          </div>

          <div className="row">
            <div className="col-md-4 mb-3">
              <label className="form-label">Gender</label>
              <select className="form-select" name="gender" value={form.gender} onChange={onChange}>
                <option value="">—</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label">Birth year</label>
              <select
                className={`form-select${errors.birth_year ? ' is-invalid' : ''}`}
                name="birth_year"
                value={form.birth_year ?? ''}
                onChange={onChange}
              >
                <option value="">—</option>
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              {errors.birth_year && <div className="invalid-feedback">{errors.birth_year}</div>}
            </div>
            <div className="col-md-4 mb-3"></div>
          </div>

          <div className="row">
            <div className="col-md-4 mb-3">
              <label className="form-label">Club</label>
              <input className="form-control" name="club" value={form.club} onChange={onChange} />
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label">Country</label>
              <input className="form-control" name="country" value={form.country} onChange={onChange} />
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label">City</label>
              <input className="form-control" name="city" value={form.city} onChange={onChange} />
            </div>
          </div>

          <div className="d-flex gap-2">
            <button className="btn btn-primary" onClick={onSubmit} disabled={submitting}>Register</button>
            <Link to="/events" className="btn btn-outline-secondary">Cancel</Link>
          </div>
        </div>
      </div>
    </div>
  )
}


