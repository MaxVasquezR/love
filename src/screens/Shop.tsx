import { useState } from 'react'
import { Modal } from '../components/Modal'
import { useGame, activeOutfit, bestLevel } from '../core/store'
import { useTalk } from '../core/talk'
import { sfx } from '../core/audio'
import { CHARACTERS, CHARACTER_ORDER, OUTFITS, OUTFIT_ORDER, outfitKey } from '../data/characters'
import { EQUIPMENT, EQUIPMENT_ORDER } from '../data/equipment'
import { coachLine } from '../data/coach'
import { AdService } from '../ads/AdService'
import type { OutfitId } from '../core/types'
import { useT } from '../i18n'

type Tab = 'outfits' | 'gear' | 'athletes'

export function Shop({ onClose }: { onClose: () => void }) {
  const { t } = useT()
  const game = useGame()
  const say = useTalk((s) => s.say)
  const [tab, setTab] = useState<Tab>('outfits')
  const [busy, setBusy] = useState(false)
  const id = game.selected!
  const def = CHARACTERS[id]
  const best = bestLevel(game)
  const current = activeOutfit(game, id)
  const trialOn = !!game.outfitTrial && game.outfitTrial.until > Date.now()

  const bought = (ok: boolean) => {
    if (!ok) return
    sfx.coin()
    say('coach', coachLine('shop'))
  }

  const tryOutfit = async (o: OutfitId) => {
    if (busy) return
    setBusy(true)
    const ok = await AdService.rewarded('outfit_trial')
    setBusy(false)
    if (ok) game.startOutfitTrial(id, o)
    else say('coach', t('adNotAvailable'))
  }

  const tabs: [Tab, string][] = [
    ['outfits', t('shopOutfits')],
    ['gear', t('shopGear')],
    ['athletes', t('shopAthletes')],
  ]

  return (
    <Modal title={t('shop')} onClose={onClose} wide>
      <div className="tabs">
        {tabs.map(([k, label]) => (
          <button key={k} type="button" className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'outfits' && (
        <div className="shop-list">
          {OUTFIT_ORDER.map((o) => {
            const outfit = OUTFITS[o]
            const own = game.outfits.includes(outfitKey(id, o))
            const look = { ...def.look, ...outfit.apply(def.look) }
            const inUse = current === o
            return (
              <div key={o} className={`shop-item ${inUse ? 'own' : ''}`}>
                <div className="skin-swatch">
                  <span style={{ background: look.top }} />
                  <span style={{ background: look.bottom }} />
                </div>
                <div>
                  <b>
                    {outfit.name}
                    {look.topPrint ? ' · BONNETTY' : ''}
                  </b>
                  <small>{outfit.blurb}</small>
                </div>
                <div className="shop-item__actions">
                  {inUse ? (
                    <span className="tag">{trialOn && !own ? t('trialActive') : t('equipped')}</span>
                  ) : own ? (
                    <button type="button" className="btn btn--sm" onClick={() => game.setOutfit(id, o)}>
                      {t('equip')}
                    </button>
                  ) : (
                    <>
                      {outfit.price >= 700 && AdService.canShowRewarded() && (
                        <button type="button" className="btn btn--ad btn--sm" disabled={busy} onClick={() => tryOutfit(o)}>
                          ▶ {t('tryFree')}
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn btn--gold btn--sm"
                        disabled={game.coins < outfit.price}
                        onClick={() => bought(game.buyOutfit(id, o))}
                      >
                        <i className="coin" /> {outfit.price}
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'gear' && (
        <div className="shop-list">
          {EQUIPMENT_ORDER.map((eid) => {
            const e = EQUIPMENT[eid]
            const own = game.equipment.includes(eid)
            const lockedLvl = best < e.level
            return (
              <div key={eid} className={`shop-item ${own ? 'own' : ''}`}>
                <div>
                  <b>{e.name}</b>
                  <small>{e.blurb}</small>
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
                    {c.name} · {c.title}
                  </b>
                  <small>{c.bio}</small>
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
      {game.coins < 250 && <p className="hint center">{t('notEnough')}</p>}
    </Modal>
  )
}
