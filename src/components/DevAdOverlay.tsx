import { useAdState } from '../ads/adState'
import { useT } from '../i18n'

export function DevAdOverlay() {
  const devAd = useAdState((s) => s.devAd)
  const { t } = useT()
  if (!devAd) return null
  return (
    <div className="dev-ad">
      <div className="dev-ad__box">
        <span className="tag">{devAd.kind}</span>
        <strong>{t('adPlaying')}</strong>
        <div className="dev-ad__bar" />
      </div>
    </div>
  )
}
