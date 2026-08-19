import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Page, PageHeader, Card, Badge, EmptyState, PageLoader, Button } from '../components/ui'
import { supabase } from '../../integrations/supabase/client'
import { money2, fmtDate } from '../lib'
import PayInvoiceModal from '../components/PayInvoiceModal'

const TONE = { paid: 'success', due: 'warn', processing: 'accent', overdue: 'danger' }

export default function StudioInvoices() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [pay, setPay] = useState(null)

  async function load() {
    const { data } = await supabase
      .from('studio_invoices')
      .select('*, studio_projects(title)')
      .order('created_at', { ascending: false })
    setRows(data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const outstanding = rows
    .filter((r) => r.status !== 'paid')
    .reduce((sum, r) => sum + Number(r.amount || 0), 0)

  return (
    <Page>
      <PageHeader
        title="Invoices"
        description="Milestone invoices across all your projects, paid by mobile money."
      />

      <Card className="overflow-hidden">
        {loading ? (
          <PageLoader label="Loading invoices…" />
        ) : rows.length === 0 ? (
          <EmptyState
            icon="receipt"
            title="No invoices yet"
            description="Invoices appear once a proposal is approved and milestones are set."
          />
        ) : (
          <>
            <div className="px-5 py-4 border-b border-merchant-border flex items-center justify-between">
              <span className="text-[0.8rem] text-white/50">Outstanding</span>
              <span className="text-white text-[1rem]">{money2(outstanding)}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[0.72rem] uppercase tracking-wide text-white/40">
                    <th className="px-4 py-3 font-medium">Invoice</th>
                    <th className="px-4 py-3 font-medium">Project</th>
                    <th className="px-4 py-3 font-medium">Due</th>
                    <th className="px-4 py-3 font-medium">Amount</th>
                    <th className="px-4 py-3 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-t border-white/5 hover:bg-white/[0.02]">
                      <td className="px-4 py-3.5 text-[0.87rem] text-white">
                        {r.description || 'Project invoice'}
                      </td>
                      <td className="px-4 py-3.5 text-[0.83rem]">
                        <Link to={`/studio/projects/${r.project_id}`} className="text-white/70 no-underline hover:text-accent-bright">
                          {r.studio_projects?.title || 'Project'}
                        </Link>
                      </td>
                      <td className="px-4 py-3.5 text-[0.83rem] text-white/55">
                        {r.due_date ? fmtDate(r.due_date) : '—'}
                      </td>
                      <td className="px-4 py-3.5 text-[0.87rem] text-white/85">
                        {money2(r.amount, r.currency)}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span className="inline-flex items-center gap-2">
                          <Badge tone={TONE[r.status] || 'default'}>{r.status}</Badge>
                          {r.status !== 'paid' && (
                            <Button size="sm" onClick={() => setPay(r)}>Pay</Button>
                          )}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>

      {pay && (
        <PayInvoiceModal
          invoice={pay}
          onClose={() => setPay(null)}
          onPaid={() => {
            setPay(null)
            load()
          }}
        />
      )}
    </Page>
  )
}
