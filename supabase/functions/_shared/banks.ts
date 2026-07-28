// Ghana bank code registry — mirror of src/lib/banks.js.
// Keep the two in sync when adding/removing codes.
export type Bank = { code: string; name: string }

export const BANKS: Bank[] = [
  { code: 'SCH', name: 'Standard Chartered Bank' },
  { code: 'ABG', name: 'Absa Bank Ghana' },
  { code: 'GCB', name: 'GCB Bank' },
  { code: 'NIB', name: 'National Investment Bank' },
  { code: 'ADB', name: 'Agricultural Development Bank' },
  { code: 'UMB', name: 'Universal Merchant Bank' },
  { code: 'RBL', name: 'Republic Bank' },
  { code: 'ZEN', name: 'Zenith Bank Ghana' },
  { code: 'ECO', name: 'Ecobank Ghana' },
  { code: 'CAL', name: 'CAL Bank' },
  { code: 'PRD', name: 'Prudential Bank' },
  { code: 'STB', name: 'Stanbic Bank' },
  { code: 'GTB', name: 'Guaranty Trust Bank' },
  { code: 'UBA', name: 'United Bank of Africa' },
  { code: 'ACB', name: 'Access Bank' },
  { code: 'CBG', name: 'Consolidated Bank Ghana' },
  { code: 'SGG', name: 'Societe Generale Ghana' },
  { code: 'FNB', name: 'First National Bank' },
  { code: 'UNL', name: 'Unity Link' },
  { code: 'FDL', name: 'Fidelity Bank' },
  { code: 'SIS', name: 'Services Integrity Savings & Loans' },
  { code: 'BOA', name: 'Bank of Africa' },
  { code: 'DFL', name: 'Dalex Finance and Leasing' },
  { code: 'FBO', name: 'First Bank of Nigeria' },
  { code: 'GHL', name: 'GHL Bank' },
  { code: 'BOG', name: 'Bank of Ghana' },
  { code: 'FAB', name: 'First Atlantic Bank' },
  { code: 'SSB', name: 'OmniBSIC Bank' },
  { code: 'GMY', name: 'G-Money' },
  { code: 'APX', name: 'ARB Apex Bank' },
]

const CODES = new Set(BANKS.map((b) => b.code))
export function isValidBankCode(c: string) {
  return CODES.has(c.toUpperCase())
}
export function bankName(c: string) {
  return BANKS.find((b) => b.code === c.toUpperCase())?.name ?? null
}
