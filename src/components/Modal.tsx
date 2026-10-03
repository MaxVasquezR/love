import type { ReactNode } from 'react'
import { useT } from '../i18n'

type Props = {
  title: string
  onClose?: () => void
  children: ReactNode
  wide?: boolean
}

export function Modal({ title, onClose, children, wide }: Props) {
  const { t } = useT()
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className={`modal fade-in ${wide ? 'modal--wide' : ''}`}
        role="dialog"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal__head">
          <h2>{title}</h2>
          {onClose && (
            <button type="button" className="icon-btn" onClick={onClose} aria-label={t('close')}>
              ✕
            </button>
          )}
        </header>
        <div className="modal__body">{children}</div>
      </div>
    </div>
  )
}
