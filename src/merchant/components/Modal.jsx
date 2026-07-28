import { useEffect } from 'react'

export default function Modal({ open, onClose, children, width = 460 }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative bg-merchant-panel border border-merchant-border rounded-2xl shadow-2xl w-full"
        style={{ maxWidth: width }}
      >
        {children}
      </div>
    </div>
  )
}
