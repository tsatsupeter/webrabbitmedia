import { useMemo } from 'react'
import Icon from '../../../Icon'
import { Card, CopyButton, EventChip, StatusPill, fmtWhen } from './shared'

export default function EndpointDetail({ endpoint, deliveries, onBack, onEdit, onRotate, onTest, onToggle, onDelete, onRetry }) {
  const rows = useMemo(
    () => deliveries.filter((d) => d.endpoint_id === endpoint.id).slice(0, 25),
    [deliveries, endpoint.id],
  )

  const Action = ({ icon, label, onClick, danger }) => (
    <button
      type="button" onClick={onClick}
      className={`h-9 px-3 rounded-lg border border-merchant-border text-[0.8rem] inline-flex items-center gap-2 hover:bg-white/[0.05] ${
        danger ? 'text-red-400' : 'text-white/75'
      }`}
    >
      <Icon name={icon} size={14} /> {label}
    </button>
  )

  return (
    <div className="space-y-4">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-[0.82rem] text-white/55 hover:text-white">
        <Icon name="chevron" size={14} className="rotate-180" /> Back to endpoints
      </button>

      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[1.02rem] text-white font-medium break-all">{endpoint.url}</span>
              <CopyButton value={endpoint.url} title="Copy URL" />
            </div>
            {endpoint.description && <div className="text-[0.8rem] text-white/45 mt-1">{endpoint.description}</div>}
            {endpoint.disabled_reason && <div className="text-[0.8rem] text-red-400/80 mt-1">{endpoint.disabled_reason}</div>}
          </div>
          <StatusPill status={endpoint.status} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
          <Meta label="Signing secret" value={`whsec_…${endpoint.secret_last4}`} mono />
          <Meta label="Last delivery" value={fmtWhen(endpoint.last_delivery_at)} />
          <Meta label="Last status" value={endpoint.last_status_code ? `HTTP ${endpoint.last_status_code}` : '—'} />
          <Meta label="Throttle" value={endpoint.throttle_per_minute ? `${endpoint.throttle_per_minute}/min` : 'Unlimited'} />
        </div>

        <div className="mt-5">
          <div className="text-[0.75rem] text-white/45 mb-2">Subscribed events</div>
          <div className="flex flex-wrap gap-1.5">
            {(endpoint.events || []).map((e) => <EventChip key={e} type={e} />)}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-5 pt-5 border-t border-white/[0.05]">
          <Action icon="bolt" label="Send test event" onClick={() => onTest(endpoint)} />
          <Action icon="gear" label="Edit" onClick={() => onEdit(endpoint)} />
          <Action icon="key" label="Rotate secret" onClick={() => onRotate(endpoint)} />
          <Action
            icon={endpoint.status === 'enabled' ? 'x' : 'check'}
            label={endpoint.status === 'enabled' ? 'Disable' : 'Enable'}
            onClick={() => onToggle(endpoint)}
          />
          <Action icon="trash" label="Delete" danger onClick={() => onDelete(endpoint)} />
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="px-5 py-3.5 border-b border-white/[0.05] text-[0.85rem] text-white/80">Recent deliveries</div>
        <table className="w-full text-left">
          <thead>
            <tr className="text-[0.72rem] uppercase tracking-wide text-white/45 bg-white/[0.02]">
              <th className="px-5 py-3 font-medium">Event</th>
              <th className="px-5 py-3 font-medium">Attempt</th>
              <th className="px-5 py-3 font-medium">Response</th>
              <th className="px-5 py-3 font-medium">When</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 w-20" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-6 text-center text-[0.8rem] text-white/35">No deliveries to this endpoint yet.</td></tr>
            ) : rows.map((d) => (
              <tr key={d.id} className="border-t border-white/[0.05]">
                <td className="px-5 py-3.5 text-[0.8rem] font-mono text-white/80">{d.webhook_events?.type || '—'}</td>
                <td className="px-5 py-3.5 text-[0.8rem] text-white/55">{d.attempt}/{d.max_attempts}</td>
                <td className="px-5 py-3.5 text-[0.8rem] text-white/55">
                  {d.response_code ?? '—'}
                  {d.error ? <span className="text-red-400/80"> · {String(d.error).slice(0, 40)}</span> : null}
                </td>
                <td className="px-5 py-3.5 text-[0.8rem] text-white/55">{fmtWhen(d.delivered_at || d.created_at)}</td>
                <td className="px-5 py-3.5"><StatusPill status={d.status} /></td>
                <td className="px-5 py-3.5 text-right">
                  {d.status !== 'succeeded' && (
                    <button type="button" onClick={() => onRetry(d)} className="h-8 px-2.5 rounded-md text-[0.76rem] text-emerald-400 hover:bg-white/[0.05]">
                      Retry
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

function Meta({ label, value, mono }) {
  return (
    <div>
      <div className="text-[0.72rem] text-white/40">{label}</div>
      <div className={`text-[0.84rem] text-white/80 mt-0.5 ${mono ? 'font-mono' : ''}`}>{value}</div>
    </div>
  )
}
