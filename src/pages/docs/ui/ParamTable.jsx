export default function ParamTable({ rows }) {
  return (
    <div className="not-prose my-5 overflow-hidden rounded-lg border border-slate-200">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left">
          <tr className="text-[11px] uppercase tracking-wider text-slate-500">
            <th className="px-4 py-2 font-semibold">Field</th>
            <th className="px-4 py-2 font-semibold">Type</th>
            <th className="px-4 py-2 font-semibold">Description</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.name} className={i % 2 ? 'bg-white' : 'bg-slate-50/40'}>
              <td className="px-4 py-3 align-top">
                <code className="font-mono text-[12.5px] text-slate-900">{r.name}</code>
                {r.required && (
                  <span className="ml-2 inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-rose-50 text-rose-700 border border-rose-100">
                    required
                  </span>
                )}
              </td>
              <td className="px-4 py-3 align-top">
                <span className="font-mono text-[12px] text-slate-500">{r.type}</span>
              </td>
              <td className="px-4 py-3 align-top text-slate-700 leading-relaxed">{r.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
