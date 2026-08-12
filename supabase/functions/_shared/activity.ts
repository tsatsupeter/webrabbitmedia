// Workspace activity log — server-side only writes (service role).
// Members of a business can read these entries to understand role changes.

type Db = {
  from: (t: string) => {
    insert: (v: unknown) => Promise<{ error: unknown }>
    select: (c: string) => {
      eq: (c: string, v: string) => { maybeSingle: () => Promise<{ data: unknown }> }
    }
  }
}

export type WorkspaceAction =
  | 'ownership_transfer_requested'
  | 'ownership_transfer_cancelled'
  | 'ownership_transfer_declined'
  | 'ownership_transferred'
  | 'role_changed'
  | 'invite_sent'
  | 'invite_revoked'
  | 'invite_accepted'
  | 'member_removed'

export async function labelFor(db: Db, userId?: string | null) {
  if (!userId) return null
  // deno-lint-ignore no-explicit-any
  const { data } = await (db as any)
    .from('profiles')
    .select('full_name, email')
    .eq('id', userId)
    .maybeSingle()
  return data?.full_name || data?.email || null
}

export async function logActivity(
  db: Db,
  entry: {
    business_id: string
    action: WorkspaceAction
    actor_id?: string | null
    actor_label?: string | null
    target_user_id?: string | null
    target_label?: string | null
    details?: Record<string, unknown>
  },
) {
  try {
    // deno-lint-ignore no-explicit-any
    await (db as any).from('workspace_activity').insert({
      business_id: entry.business_id,
      action: entry.action,
      actor_id: entry.actor_id ?? null,
      actor_label: entry.actor_label ?? (await labelFor(db, entry.actor_id)),
      target_user_id: entry.target_user_id ?? null,
      target_label: entry.target_label ?? null,
      details: entry.details ?? {},
    })
  } catch (_e) {
    // Activity logging must never break the primary action.
  }
}
