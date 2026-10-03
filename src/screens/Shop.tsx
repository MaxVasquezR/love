import { useState } from 'react'
import { Modal } from '../components/Modal'
import { useGame, activeSkin, bestLevel } from '../core/store'
import { useTalk } from '../core/talk'
import { CHARACTERS, CHARACTER_ORDER, SKINS, SKIN_ORDER, skinKey } from '../data/characters'
import { EQUIPMENT, EQUIPMENT_ORDER } from '../data/equipment'
import { coachLine } from '../data/coach'
import { AdService } from '../ads/AdService'
import { useT } from '../i18n'

type Tab = 'gear' | 'skins' | 'athletes'

export function Shop({ onClose }: { onClose: () => void }) {
  const { t, L, lang } = useT()
  const game = useGame()
  const say = useTalk((s) => s.say)
  const [tab, setTab] = useState<Tab>('gear')
  const [busy, setBusy] = useState(false)
  const id = game.selected!
  const best = bestLevel(game)
  const current = activeSkin(game, id)
  const trialOn = game.skinTrial && game.skinTrial.until > Date.now()

  const bought = (ok: boolean) => {
    if (ok) say('coach', coachLine(lang, 'shop'))
  }

  const trySkin = async () => {
    if (busy) return
    setBusy(true)
    const ok = await AdService.rewarded('skin_trial')
    setBusy(false)
    if (ok) game.startSkinTrial(id, 'gold')
  }

  return (
    <Modal title={t('shop')} onClose={onClose} wide>
      <div className="tabs">
        {(['gear', 'skins', 'athletes'] as Tab[]).map((k) => (
          <button
            key={k}
            type="button"
            className={tab === k ? 'on' : ''}
            onClick={() => setTab(k)}
          >
            {k === 'gear' ? t('shopGear') : k === 'skins' ? t('shopSkins') : t('shopAthletes')}
          </button>
        ))}
      </div>

      {tab === 'gear' && (
        <div className="shop-list">
          {EQUIPMENT_ORDER.map((eid) => {
            const e = EQUIPMENT[eid]
            const own = game.equipment.includes(eid)
            const lockedLvl = best < e.level
            return (
              <div key={eid} className={`shop-item ${own ? 'own' : ''}`}>
                <div>
                  <b>{L(e.name)}</b>
                  <small>{L(e.blurb)}</small>
                  <small className="bonus">
                    {Object.entries(e.bonus)
                      .map(([k, v]) => `+${v} ${t(k === 'str' ? 'statStr' : k === 'end' ? 'statEnd' : 'statTec')}`)
                      .join(' · ')}
                  </small>
                </div>
                {own ? (
                  <span className="tag">{t('owned')}</span>
                ) : lockedLvl ? (
                  <span className="hint">🔒 {t('requiresLevel', { lvl: e.level })}</span>
                ) : (
                  <button
                    type="button"
                    className="btn btn--gold btn--sm"
                    disabled={game.coins < e.price}
                    onClick={() => bought(game.buyEquipment(eid))}
                  >
                    <i className="coin" /> {e.price}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {tab === 'skins' && (
        <div className="shop-list">
          {SKIN_ORDER.map((sid) => {
            const own = game.skins.includes(skinKey(id, sid))
            const colors = CHARACTERS[id].skins[sid]
            const inUse = current === sid
            return (
              <div key={sid} className={`shop-item ${inUse ? 'own' : ''}`}>
                <div className="skin-swatch">
                  <span style={{ background: colors.top }} />
                  <span style={{ background: colors.pants }} />
                </div>
                <div>
                  <b>{L(SKINS[sid].name)}</b>
                  <small>{CHARACTERS[id].name}</small>
                </div>
                <div className="shop-item__actions">
                  {inUse ? (
                    <span className="tag">{trialOn && !own ? t('trialActive') : t('equipped')}</span>
                  ) : own ? (
                    <button type="button" className="btn btn--sm" onClick={() => game.setSkin(id, sid)}>
                      {t('equip')}
                    </button>
                  ) : (
                    <>
                      {sid === 'gold' && AdService.canShowRewarded() && (
                        <button type="button" className="btn btn--ad btn--sm" disabled={busy} onClick={trySkin}>
                          ▶ {t('tryFree')}
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn btn--gold btn--sm"
                        disabled={game.coins < SKINS[sid].price}
                        onClick={() => bought(game.buySkin(id, sid))}
                      >
                        <i className="coin" /> {SKINS[sid].price}
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'athletes' && (
        <div className="shop-list">
          {CHARACTER_ORDER.map((cid) => {
            const c = CHARACTERS[cid]
            const own = game.unlocked.includes(cid)
            return (
              <div key={cid} className={`shop-item ${cid === id ? 'own' : ''}`}>
                <div className="skin-swatch">
                  <span style={{ background: c.look.top }} />
                  <span style={{ background: c.look.hair }} />
                </div>
                <div>
                  <b>
                    {c.name} · {L(c.title)}
                  </b>
                  <small>{L(c.bio)}</small>
                </div>
                <div className="shop-item__actions">
                  {own ? (
                    cid === id ? (
                      <span className="tag">{t('equipped')}</span>
                    ) : (
                      <button type="button" className="btn btn--sm" onClick={() => game.selectCharacter(cid)}>
                        {t('choose')}
                      </button>
                    )
                  ) : 'level' in c.unlock ? (
                    <>
                      <span className="hint">{t('unlockAt', { lvl: c.unlock.level })}</span>
                      <button
                        type="button"
                        className="btn btn--gold btn--sm"
                        disabled={game.coins < c.unlock.coins}
                        onClick={() => bought(game.buyCharacter(cid))}
                      >
                        <i className="coin" /> {c.unlock.coins}
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Modal>
  )
}
