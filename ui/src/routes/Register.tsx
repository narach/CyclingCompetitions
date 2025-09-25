import { Link, useParams } from 'react-router-dom'

export default function Register() {
  const { eventId } = useParams()
  return (
    <div>
      <h2>Register</h2>
      <div className="alert alert-light">
        This is a placeholder registration page for event ID: <strong>{eventId}</strong>.
      </div>
      <Link to="/events" className="btn btn-outline-primary">Back to events</Link>
    </div>
  )
}


