import { Modal } from '../components/Modal'
import { useGame } from '../core/store'
import { sfx, speak } from '../core/audio'
import { setLang, useT, type Lang } from '../i18n'

const LANG_OPTIONS: [Lang, string][] = [
  ['es', 'Español'],
  ['en', 'English'],
]

export function Settings({ onClose, onReset }: { onClose: () => void; onReset: () => void }) {
  const { t, lang } = useT()
  const saveLang = useGame((s) => s.setLang)
  const sound = useGame((s) => s.sound)
  const voice = useGame((s) => s.voice)
  const playerVoice = useGame((s) => s.playerVoice)
  const setSound = useGame((s) => s.setSound)
  const setVoice = useGame((s) => s.setVoice)
  const setPlayerVoice = useGame((s) => s.setPlayerVoice)
  const musicVol = useGame((s) => s.musicVol)
  const sfxVol = useGame((s) => s.sfxVol)
  const office = useGame((s) => s.office)
  const setAudio = useGame((s) => s.setAudio)

  const slider = (value: number, key: 'musicVol' | 'sfxVol') => (
    <input
      type="range"
      min={0}
      max={100}
      step={5}
      value={Math.round(value * 100)}
      onChange={(e) => {
        setAudio({ [key]: Number(e.target.value) / 100 })
        if (key === 'sfxVol') sfx.click()
      }}
      aria-label={t(key === 'musicVol' ? 'music' : 'effects')}
    />
  )

  const reset = () => {
    if (!window.confirm(t('resetConfirm'))) return
    useGame.getState().resetAll()
    onReset()
  }

  const toggle = (value: boolean, set: (v: boolean) => void) => (
    <div className="tabs tabs--inline">
      <button type="button" className={value ? 'on' : ''} onClick={() => set(true)}>
        {t('on')}
      </button>
      <button type="button" className={!value ? 'on' : ''} onClick={() => set(false)}>
        {t('off')}
      </button>
    </div>
  )

  return (
    <Modal title={t('settings')} onClose={onClose}>
      <div className="setting">
        <span>🌐 {t('language')}</span>
        <div className="tabs tabs--inline">
          {LANG_OPTIONS.map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={lang === value ? 'on' : ''}
              onClick={() => {
                sfx.click()
                saveLang(value)
                setLang(value)
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="setting">
        <span>🔊 {t('sound')}</span>
        {toggle(sound, setSound)}
      </div>
      <div className="setting">
        <span>🎵 {t('music')}</span>
        {slider(musicVol, 'musicVol')}
      </div>
      <div className="setting">
        <span>💥 {t('effects')}</span>
        {slider(sfxVol, 'sfxVol')}
      </div>
      <div className="setting">
        <span>🗣️ {t('voice')}</span>
        {toggle(voice, (v) => {
          setVoice(v)
          if (v) window.setTimeout(() => speak(t('voiceTest'), 'coach'), 50)
        })}
      </div>
      <div className="setting">
        <span>💬 {t('playerVoice')}</span>
        {toggle(playerVoice, (v) => {
          setPlayerVoice(v)
          if (v) window.setTimeout(() => speak(t('playerVoiceTest'), 'player'), 50)
        })}
      </div>
      <div className="setting">
        <span>💼 {t('officeMode')}</span>
        {toggle(office, (v) => setAudio({ office: v }))}
      </div>
      {office && <p className="disclaimer">{t('officeHint')}</p>}
      <p className="disclaimer">{t('disclaimer')}</p>
      <button type="button" className="btn btn--danger btn--sm" onClick={reset}>
        {t('resetSave')}
      </button>
    </Modal>
  )
}
