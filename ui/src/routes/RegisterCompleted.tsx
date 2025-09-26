import { Link, useLocation, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function RegisterCompleted() {
  const { eventId } = useParams()
  const { state } = useLocation() as { state: any }
  const registration = state?.registration
  const eventName: string | undefined = state?.eventName
  const { t } = useTranslation()

  return (
    <div>
      <h2>{t('registerCompleted.title')}</h2>
      {!registration ? (
        <div className="alert alert-warning">{t('registerCompleted.noData')}</div>
      ) : (
        <div className="card">
          <div className="card-body">
            <div className="mb-3">
              <div className="h5 mb-1">{eventName || t('events.title')}</div>
              <div className="text-muted">{t('registerCompleted.startNumber')}: {registration.start_number ?? t('common.dash')}</div>
            </div>
            <dl className="row mb-0">
              <dt className="col-sm-3">{t('registerCompleted.fields.name')}</dt>
              <dd className="col-sm-9">{registration.name} {registration.surname}</dd>
              <dt className="col-sm-3">{t('registerCompleted.fields.email')}</dt>
              <dd className="col-sm-9">{registration.email}</dd>
              <dt className="col-sm-3">{t('registerCompleted.fields.phone')}</dt>
              <dd className="col-sm-9">{registration.phone || t('common.dash')}</dd>
              <dt className="col-sm-3">{t('registerCompleted.fields.gender')}</dt>
              <dd className="col-sm-9">{registration.gender || t('common.dash')}</dd>
              <dt className="col-sm-3">{t('registerCompleted.fields.birthYear')}</dt>
              <dd className="col-sm-9">{registration.birth_year ?? t('common.dash')}</dd>
              <dt className="col-sm-3">{t('registerCompleted.fields.club')}</dt>
              <dd className="col-sm-9">{registration.club || t('common.dash')}</dd>
              <dt className="col-sm-3">{t('registerCompleted.fields.country')}</dt>
              <dd className="col-sm-9">{registration.country || t('common.dash')}</dd>
              <dt className="col-sm-3">{t('registerCompleted.fields.city')}</dt>
              <dd className="col-sm-9">{registration.city || t('common.dash')}</dd>
              <dt className="col-sm-3">{t('registerCompleted.startNumber')}</dt>
              <dd className="col-sm-9">{registration.start_number ?? t('common.dash')}</dd>
              <dt className="col-sm-3">{t('registerCompleted.fields.created')}</dt>
              <dd className="col-sm-9">{registration.created_at}</dd>
              <dt className="col-sm-3">{t('registerCompleted.fields.updated')}</dt>
              <dd className="col-sm-9">{registration.updated_at}</dd>
            </dl>
          </div>
        </div>
      )}
      <div className="mt-3 d-flex gap-2">
        <Link to={`/register/${encodeURIComponent(String(eventId))}`} className="btn btn-outline-secondary">{t('registerCompleted.backToRegistration')}</Link>
        <Link to="/events" className="btn btn-primary">{t('registerCompleted.backToEvents')}</Link>
      </div>
    </div>
  )
}


