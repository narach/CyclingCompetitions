import { Link, useLocation, useParams } from 'react-router-dom'

export default function RegisterCompleted() {
  const { eventId } = useParams()
  const { state } = useLocation() as { state: any }
  const registration = state?.registration

  return (
    <div>
      <h2>Registration Completed</h2>
      {!registration ? (
        <div className="alert alert-warning">No registration data found.</div>
      ) : (
        <div className="card">
          <div className="card-body">
            <dl className="row mb-0">
              <dt className="col-sm-3">Registration ID</dt>
              <dd className="col-sm-9">{registration.id}</dd>
              <dt className="col-sm-3">Event ID</dt>
              <dd className="col-sm-9">{registration.event_id}</dd>
              <dt className="col-sm-3">Name</dt>
              <dd className="col-sm-9">{registration.name} {registration.surname}</dd>
              <dt className="col-sm-3">Email</dt>
              <dd className="col-sm-9">{registration.email}</dd>
              <dt className="col-sm-3">Phone</dt>
              <dd className="col-sm-9">{registration.phone || '—'}</dd>
              <dt className="col-sm-3">Gender</dt>
              <dd className="col-sm-9">{registration.gender || '—'}</dd>
              <dt className="col-sm-3">Birth Year</dt>
              <dd className="col-sm-9">{registration.birth_year ?? '—'}</dd>
              <dt className="col-sm-3">Club</dt>
              <dd className="col-sm-9">{registration.club || '—'}</dd>
              <dt className="col-sm-3">Country</dt>
              <dd className="col-sm-9">{registration.country || '—'}</dd>
              <dt className="col-sm-3">City</dt>
              <dd className="col-sm-9">{registration.city || '—'}</dd>
              <dt className="col-sm-3">Start Number</dt>
              <dd className="col-sm-9">{registration.start_number ?? '—'}</dd>
              <dt className="col-sm-3">Created</dt>
              <dd className="col-sm-9">{registration.created_at}</dd>
              <dt className="col-sm-3">Updated</dt>
              <dd className="col-sm-9">{registration.updated_at}</dd>
            </dl>
          </div>
        </div>
      )}
      <div className="mt-3 d-flex gap-2">
        <Link to={`/register/${encodeURIComponent(String(eventId))}`} className="btn btn-outline-secondary">Back to registration</Link>
        <Link to="/events" className="btn btn-primary">Back to events</Link>
      </div>
    </div>
  )
}


