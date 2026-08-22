// Event catalog shown in the merchant Webhooks console. Kept in sync with
// WEBHOOK_EVENT_TYPES in supabase/functions/_shared/webhooks.ts.

const iso = new Date().toISOString()

export const EVENT_CATALOG = [
  {
    group: 'Collection',
    events: [
      {
        type: 'collection.approved',
        label: 'Collection approved',
        description: 'A customer payment reached a final approved state and the net amount was credited to your balance.',
        sample: {
          object: {
            transaction_id: '521888807466',
            provider_transaction_id: 'LP-9F23A1',
            status: 'approved',
            code: '000',
            reason: 'Transaction successful',
            subscriber_number: '0248980332',
            channel: 'momo',
            gross_amount: 100,
            fee_amount: 15,
            provider_fee: 1.5,
            net_amount: 85,
            currency: 'GHS',
            created_at: iso,
          },
          resource_type: 'transaction',
          resource_id: '521888807466',
        },
      },
      {
        type: 'collection.failed',
        label: 'Collection failed',
        description: 'A customer payment reached a final failed state. Nothing was credited.',
        sample: {
          object: {
            transaction_id: '521888807467',
            status: 'failed',
            code: '101',
            reason: 'Insufficient funds',
            subscriber_number: '0248980332',
            channel: 'momo',
            gross_amount: 100,
            currency: 'GHS',
            created_at: iso,
          },
          resource_type: 'transaction',
          resource_id: '521888807467',
        },
      },
      {
        type: 'collection.reversed',
        label: 'Collection reversed',
        description: 'A previously approved payment was reversed by the provider. The ledger entry has been unwound.',
        sample: {
          object: {
            transaction_id: '521888807466',
            status: 'reversed',
            reason: 'Reversed by provider',
            gross_amount: 100,
            fee_amount: 15,
            net_amount: 85,
            currency: 'GHS',
            reversed_at: iso,
          },
          resource_type: 'transaction',
          resource_id: '521888807466',
        },
      },
    ],
  },
  {
    group: 'Payout',
    events: [
      {
        type: 'payout.completed',
        label: 'Payout completed',
        description: 'A withdrawal to your bank account or mobile wallet was settled by the provider.',
        sample: {
          object: {
            payout_id: 'b0d2f1c4-2f28-4a1f-9a3d-6b1f0a9c1122',
            status: 'success',
            amount: 500,
            fee: 0,
            net_amount: 500,
            currency: 'GHS',
            destination: 'MTN ••0332',
            completed_at: iso,
          },
          resource_type: 'payout',
          resource_id: 'b0d2f1c4-2f28-4a1f-9a3d-6b1f0a9c1122',
        },
      },
      {
        type: 'payout.failed',
        label: 'Payout failed',
        description: 'A withdrawal could not be settled. The amount is returned to your available balance.',
        sample: {
          object: {
            payout_id: 'b0d2f1c4-2f28-4a1f-9a3d-6b1f0a9c1122',
            status: 'failed',
            reason: 'Invalid recipient account',
            amount: 500,
            currency: 'GHS',
            failed_at: iso,
          },
          resource_type: 'payout',
          resource_id: 'b0d2f1c4-2f28-4a1f-9a3d-6b1f0a9c1122',
        },
      },
    ],
  },
  {
    group: 'Messaging',
    events: [
      {
        type: 'sms_topup.approved',
        label: 'Messaging top-up credited',
        description: 'A messaging wallet top-up was paid for and the credits are available.',
        sample: {
          object: {
            topup_id: '7c9c1b56-1c1e-4a3e-b0b8-9a1e2b7fbb01',
            status: 'approved',
            amount: 50,
            currency: 'GHS',
            balance_after: 120.5,
            credited_at: iso,
          },
          resource_type: 'sms_topup',
          resource_id: '7c9c1b56-1c1e-4a3e-b0b8-9a1e2b7fbb01',
        },
      },
    ],
  },
]

export const EVENT_LABELS = Object.fromEntries(
  EVENT_CATALOG.flatMap((g) => g.events.map((e) => [e.type, e.label])),
)

export const ALL_EVENTS = Object.keys(EVENT_LABELS)
