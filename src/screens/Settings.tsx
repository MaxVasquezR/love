import { Modal } from '../components/Modal'
import { useGame } from '../core/store'
import type { Lang } from '../core/types'
import { useT } from '../i18n'

export function Settings({ onClose, onReset }: { onClose: () => void; onReset: () => void }) {
  const { t } = useT()
  const lang = useGame((s) => s.lang)
  const setLang = useGame((s) => s.setLang)

  const reset = () => {
    if (!window.confirm(t('resetConfirm'))) return
    useGame.getState().resetAll()
    onReset()
  }

  return (
    <Modal title={t('settings')} onClose={onClose}>
      <div className="setting">
        <span>{t('language')}</span>
        <div className="tabs tabs--inline">
          {(['es', 'en'] as Lang[]).map((l) => (
            <button key={l} type="button" className={lang === l ? 'on' : ''} onClick={() => setLang(l)}>
              {l === 'es' ? 'Español' : 'English'}
            </button>
          ))}
        </div>
      </div>
      <button type="button" className="btn btn--danger btn--sm" onClick={reset}>
        {t('resetSave')}
      </button>
    </Modal>
  )
}
