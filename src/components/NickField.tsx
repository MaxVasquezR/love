import { useGame } from '../core/store'
import { useT } from '../i18n'

/** "Your name for challenges": friends see "Juan te reta" instead of the athlete's name. */
export function NickField() {
  const { t } = useT()
  const nick = useGame((s) => s.nick)
  const setNick = useGame((s) => s.setNick)
  return (
    <label className="nick-field">
      <span>{t('nickLabel')}</span>
      <input
        type="text"
        value={nick}
        maxLength={20}
        placeholder={t('nickPlaceholder')}
        onChange={(e) => setNick(e.target.value)}
        onBlur={() => setNick(nick.trim())}
      />
    </label>
  )
}
