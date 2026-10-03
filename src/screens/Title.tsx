import { useT } from '../i18n'

export function Title({ onPlay }: { onPlay: () => void }) {
  const { t } = useT()
  return (
    <div className="title-screen fade-in">
      <div className="title-card">
        <p className="tag">{t('gameSubtitle')}</p>
        <h1 className="logo-big">
          GYM <span>LEGENDS</span>
        </h1>
        <button type="button" className="btn btn--primary btn--xl" onClick={onPlay}>
          {t('play')}
        </button>
      </div>
    </div>
  )
}
