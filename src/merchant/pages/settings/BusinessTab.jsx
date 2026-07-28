import { Link } from 'react-router-dom'
import { useBusinesses } from '../../../hooks/useBusinesses'
import { Card, SectionHeader } from './Section'
import Icon from '../../Icon'

function Row({ label, value }) {
  return (
    <div className="grid grid-cols-[160px_1fr] gap-4 py-2.5 border-b border-merchant-border last:border-0">
      <div className="text-[0.78rem] text-white/50">{label}</div>
      <div className="text-[0.85rem] text-white/85 break-words">{value || <span className="text-white/35">—</span>}</div>
    </div>
  )
}

export default function BusinessTab() {
  const { active } = useBusinesses()
  if (!active) return <div className="text-white/50 text-[0.85rem]">No business selected.</div>

  const approved = active.status === 'approved'

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Business Details"
        description="Read-only summary of the business you're currently viewing. Edit through the verification flow."
        action={
          <Link to="/merchant/verification" className="h-9 px-4 inline-flex items-center gap-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-white text-[0.82rem] font-medium no-underline">
            <Icon name="pencil" size={14} /> Edit business
          </Link>
        }
      />

      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[0.9rem] font-medium text-white">{active.name}</h3>
          <span className={`text-[0.7rem] px-2 py-0.5 rounded border ${
            approved
              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
              : 'bg-orange-500/15 text-orange-300 border-orange-500/30'
          }`}>
            {approved ? 'Verified' : (active.status || 'pending').replace(/^./, (c) => c.toUpperCase())}
          </span>
        </div>
        <Row label="Business type" value={active.business_type} />
        <Row label="Website" value={active.website_url} />
        <Row label="Product category" value={active.product_category} />
        <Row label="Location" value={active.location} />
        <Row label="Referral source" value={active.referral_source} />
        <Row label="Monetization" value={active.monetization_note} />
      </Card>
    </div>
  )
}
