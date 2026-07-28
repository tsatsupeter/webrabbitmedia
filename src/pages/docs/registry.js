import Introduction from './sections/Introduction'
import Quickstart from './sections/Quickstart'
import Authentication from './sections/Authentication'
import Errors from './sections/Errors'
import Fees from './sections/Fees'
import CollectMomo from './sections/CollectMomo'
import CollectCard from './sections/CollectCard'
import TransactionsList from './sections/TransactionsList'
import TransactionsRetrieve from './sections/TransactionsRetrieve'

// Single source of truth for sidebar, Cmd+K search, and prev/next pager.
// `headings` is a flat list of {id, text, depth} for the on-this-page TOC / search.
export const groups = [
  {
    label: 'Get Started',
    items: [
      {
        slug: 'introduction',
        title: 'Introduction',
        summary: 'What Web Rabbit Payments is and how the API is structured.',
        Component: Introduction,
        headings: [
          { id: 'overview', text: 'Overview', depth: 2 },
          { id: 'base-url', text: 'Base URL', depth: 2 },
          { id: 'modes', text: 'Test mode & Live mode', depth: 2 },
        ],
      },
      {
        slug: 'quickstart',
        title: 'Quickstart',
        summary: 'Create a key, charge a customer, and inspect a transaction in five minutes.',
        Component: Quickstart,
        headings: [
          { id: 'step-1-create-a-key', text: 'Step 1 — Create a key', depth: 2 },
          { id: 'step-2-make-your-first-charge', text: 'Step 2 — Make your first charge', depth: 2 },
          { id: 'step-3-inspect-the-transaction', text: 'Step 3 — Inspect the transaction', depth: 2 },
        ],
      },
      {
        slug: 'authentication',
        title: 'Authentication',
        summary: 'Authenticate every request with your secret API key.',
        Component: Authentication,
        headings: [
          { id: 'api-keys', text: 'API keys', depth: 2 },
          { id: 'sending-the-key', text: 'Sending the key', depth: 2 },
          { id: 'rotating-keys', text: 'Rotating keys', depth: 2 },
        ],
      },
      {
        slug: 'errors',
        title: 'Errors',
        summary: 'HTTP status codes, error shapes, and how to recover.',
        Component: Errors,
        headings: [
          { id: 'error-shape', text: 'Error shape', depth: 2 },
          { id: 'status-codes', text: 'Status codes', depth: 2 },
        ],
      },
      {
        slug: 'fees',
        title: 'Fees',
        summary: 'How the 15% platform fee is calculated and settled.',
        Component: Fees,
        headings: [
          { id: 'platform-fee', text: 'Platform fee', depth: 2 },
          { id: 'example', text: 'Worked example', depth: 2 },
        ],
      },
    ],
  },
  {
    label: 'Collect',
    items: [
      {
        slug: 'collect-momo',
        title: 'Mobile Money',
        summary: 'Charge a customer over MTN, Vodafone, AirtelTigo, or G-Money.',
        Component: CollectMomo,
        headings: [
          { id: 'endpoint', text: 'Endpoint', depth: 2 },
          { id: 'request', text: 'Request', depth: 2 },
          { id: 'response', text: 'Response', depth: 2 },
        ],
      },
      {
        slug: 'collect-card',
        title: 'Card',
        summary: 'Charge a Visa or Mastercard.',
        Component: CollectCard,
        headings: [
          { id: 'endpoint', text: 'Endpoint', depth: 2 },
          { id: 'request', text: 'Request', depth: 2 },
          { id: 'response', text: 'Response', depth: 2 },
        ],
      },
    ],
  },
  {
    label: 'Transactions',
    items: [
      {
        slug: 'transactions-list',
        title: 'List transactions',
        summary: 'Paginate through every transaction for your business.',
        Component: TransactionsList,
        headings: [
          { id: 'endpoint', text: 'Endpoint', depth: 2 },
          { id: 'query-parameters', text: 'Query parameters', depth: 2 },
          { id: 'response', text: 'Response', depth: 2 },
        ],
      },
      {
        slug: 'transactions-retrieve',
        title: 'Retrieve a transaction',
        summary: 'Fetch a single transaction by id.',
        Component: TransactionsRetrieve,
        headings: [
          { id: 'endpoint', text: 'Endpoint', depth: 2 },
          { id: 'response', text: 'Response', depth: 2 },
        ],
      },
    ],
  },
]

// Flat list preserving order — used for prev/next pagers and search indexing.
export const flat = groups.flatMap((g) => g.items.map((it) => ({ ...it, group: g.label })))

export function findBySlug(slug) {
  return flat.find((it) => it.slug === slug)
}

export function neighbors(slug) {
  const i = flat.findIndex((it) => it.slug === slug)
  return { prev: i > 0 ? flat[i - 1] : null, next: i >= 0 && i < flat.length - 1 ? flat[i + 1] : null }
}
