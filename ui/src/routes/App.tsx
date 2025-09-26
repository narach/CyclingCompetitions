import { Link, Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
const flagEN = new URL('../../resources/images/en.png', import.meta.url).href
const flagRU = new URL('../../resources/images/ru.png', import.meta.url).href
const flagMNE = new URL('../../resources/images/mne.png', import.meta.url).href

export default function App() {
  const location = useLocation()
  const { i18n, t } = useTranslation()
  const current = i18n.language || 'en'
  const flags: Record<string, string> = { en: flagEN, ru: flagRU, mne: flagMNE }
  const onChangeLang = (lng: string) => {
    i18n.changeLanguage(lng)
    // Persist via i18next detector localStorage cache
    try { localStorage.setItem('i18nextLng', lng) } catch {}
  }
  return (
    <div>
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <div className="container">
          <Link className="navbar-brand" to="/">Home</Link>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarsExample" aria-controls="navbarsExample" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarsExample">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <Link className={`nav-link${location.pathname.startsWith('/events') ? ' active' : ''}`} to="/events">{t('nav.events')}</Link>
              </li>
              {/* Admin link hidden intentionally */}
            </ul>
            <div className="d-flex">
              <div className="dropdown ms-auto">
                <button className="btn btn-outline-light dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                  <img src={flags[current] || flagEN} alt={(current || 'en').toUpperCase()} style={{ height: '1em', width: 'auto' }} className="me-2" /> {(current || 'en').toUpperCase()}
                </button>
                <ul className="dropdown-menu dropdown-menu-end">
                  <li>
                    <button className="dropdown-item" onClick={() => onChangeLang('en')}>
                      <img src={flagEN} alt="EN" style={{ height: '1em', width: 'auto' }} className="me-2" /> EN
                    </button>
                  </li>
                  <li>
                    <button className="dropdown-item" onClick={() => onChangeLang('ru')}>
                      <img src={flagRU} alt="RU" style={{ height: '1em', width: 'auto' }} className="me-2" /> RU
                    </button>
                  </li>
                  <li>
                    <button className="dropdown-item" onClick={() => onChangeLang('mne')}>
                      <img src={flagMNE} alt="MNE" style={{ height: '1em', width: 'auto' }} className="me-2" /> MNE
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </nav>
      <main className="container my-4">
        <Outlet />
      </main>
    </div>
  )
}


