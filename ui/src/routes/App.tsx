import { Link, Outlet, useLocation } from 'react-router-dom'

export default function App() {
  const location = useLocation()
  return (
    <div>
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <div className="container">
          <Link className="navbar-brand" to="/">Cycling MNE</Link>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarsExample" aria-controls="navbarsExample" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarsExample">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <Link className={`nav-link${location.pathname.startsWith('/events') ? ' active' : ''}`} to="/events">Events</Link>
              </li>
              <li className="nav-item">
                <Link className={`nav-link${location.pathname.startsWith('/admin') ? ' active' : ''}`} to="/admin">Admin</Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>
      <main className="container my-4">
        <Outlet />
      </main>
    </div>
  )
}


