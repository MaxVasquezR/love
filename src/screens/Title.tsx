import { useState } from 'react'
import { randomTip } from '../data/tips'
import { useT } from '../i18n'

export function Title({ onPlay }: { onPlay: () => void }) {
  const { t } = useT()
  const [tip] = useState(randomTip)
  return (
    <div className="title-screen fade-in">
      <div className="title-card">
        <p className="tag">{t('gameSubtitle')}</p>
        <h1 className="logo-big">
          GYM <span>LEGENDS</span>
        </h1>
        <p className="tip-card">
          <b>{t('tipTitle')}</b> {tip}
        </p>
        <button type="button" className="btn btn--primary btn--xl" onClick={onPlay}>
          {t('play')}
        </button>
        <p className="disclaimer">{t('disclaimer')}</p>
      </div>
    </div>
  )
}
