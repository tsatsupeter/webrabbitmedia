import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import Modal from '../../sms/components/Modal'
import { Button, Field, inputClass } from './ui'
import { invokeStudio, money2 } from '../lib'

const NETWORKS = [
  { id: 'MTN', label: 'MTN MoMo' },
  { id: 'TELECEL', label: 'Telecel Cash' },
  { id: 'AT', label: 'AT Money' },
]

export default function PayInvoiceModal({ invoice, onClose, onPaid }) {
  const [network, setNetwork] = useState('MTN')
  const [msisdn, setMsisdn] = useState('')
  const [phase, setPhase] = useState('form') // form | waiting | done
  const [message, setMessage] = useState('')
  const timer = useRef(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  async function start() {
    if (!/^0\d{9}$/.test(msisdn.trim())) {
      toast.error('Enter a valid wallet number (0XXXXXXXXX)')
      return
    }
    setPhase('waiting')
    setMessage('Sending the prompt to your phone…')
    try {
      const res = await invokeStudio('studio-invoice-pay', {
        invoice_id: invoice.id,
        msisdn: msisdn.trim(),
        network,
      })
      if (res.status === 'paid') return finish()
      setMessage(res.message || 'Approve the prompt on your phone to complete the payment')
      poll(0)
    } catch (e) {
      setPhase('form')
      toast.error(e.message)
    }
  }

  function finish() {
    setPhase('done')
    toast.success('Payment received — thank you')
    onPaid?.()
  }

  function poll(attempt) {
    if (attempt > 30) {
      setMessage('Still waiting for confirmation. You can close this — we update the invoice as soon as it clears.')
      return
    }
    timer.current = setTimeout(async () => {
      try {
        const res = await invokeStudio('studio-invoice-status', { invoice_id: invoice.id })
        if (res.status === 'paid') return finish()
        if (res.status === 'failed' || res.status === 'due') {
          setPhase('form')
          setMessage('')
          toast.error(res.message || 'The payment was not completed')
          return
        }
      } catch {
        /* keep polling */
      }
      poll(attempt + 1)
    }, 4000)
  }

  return (
    <Modal open onClose={onClose} title="Pay invoice">
      <div className="p-5 space-y-4">
        <div className="rounded-xl border border-merchant-border bg-white/[0.02] px-4 py-3">
          <div className="text-[0.8rem] text-white/50">{invoice.description || 'Project invoice'}</div>
          <div className="font-display text-[1.4rem] text-white mt-1">
            {money2(invoice.amount, invoice.currency)}
          </div>
        </div>

        {phase === 'form' && (
          <>
            <Field label="Mobile money network">
              <select className={inputClass} value={network} onChange={(e) => setNetwork(e.target.value)}>
                {NETWORKS.map((n) => (
                  <option key={n.id} value={n.id}>{n.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Wallet number">
              <input
                className={inputClass}
                value={msisdn}
                onChange={(e) => setMsisdn(e.target.value)}
                placeholder="0XXXXXXXXX"
                inputMode="numeric"
              />
            </Field>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button onClick={start}>Pay {money2(invoice.amount, invoice.currency)}</Button>
            </div>
          </>
        )}

        {phase === 'waiting' && (
          <div className="text-center py-6 space-y-3">
            <div className="w-9 h-9 mx-auto rounded-full border-2 border-white/15 border-t-accent-bright animate-spin" />
            <div className="text-[0.87rem] text-white/75">{message}</div>
            <Button variant="ghost" onClick={onClose}>Close</Button>
          </div>
        )}

        {phase === 'done' && (
          <div className="text-center py-6 space-y-3">
            <div className="text-[0.95rem] text-emerald-300">Payment received</div>
            <Button onClick={onClose}>Done</Button>
          </div>
        )}
      </div>
    </Modal>
  )
}
