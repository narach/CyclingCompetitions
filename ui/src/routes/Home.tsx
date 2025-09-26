import { useTranslation } from 'react-i18next'

export default function Home() {
  const { t } = useTranslation()
  return (
    <div>
      <h1>{t('home.title')}</h1>
      <p>{t('home.p1')}</p>
      <p>{t('home.p2')}</p>
      <p>{t('home.p3')}</p>
      <p>{t('home.p4')}</p>
      <p>{t('home.p5')}</p>
    </div>
  )
}


