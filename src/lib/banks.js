// Ghana bank code registry — mirror of supabase/functions/_shared/banks.ts.
// Keep the two in sync when adding/removing codes.
// `institution_code` is the 360Pay routing code.
export const BANKS = [
  { code: 'SCH', name: 'Standard Chartered Bank', institution_code: '300302' },
  { code: 'ABG', name: 'Absa Bank Ghana', institution_code: '300303' },
  { code: 'GCB', name: 'GCB Bank', institution_code: '300304' },
  { code: 'NIB', name: 'National Investment Bank', institution_code: '300305' },
  { code: 'APX', name: 'ARB Apex Bank', institution_code: '300306' },
  { code: 'ADB', name: 'Agricultural Development Bank', institution_code: '300307' },
  { code: 'SGG', name: 'Societe Generale Ghana', institution_code: '300308' },
  { code: 'UMB', name: 'Universal Merchant Bank', institution_code: '300309' },
  { code: 'RBL', name: 'Republic Bank', institution_code: '300310' },
  { code: 'ZEN', name: 'Zenith Bank Ghana', institution_code: '300311' },
  { code: 'ECO', name: 'Ecobank Ghana', institution_code: '300312' },
  { code: 'CAL', name: 'CAL Bank', institution_code: '300313' },
  { code: 'TST', name: 'Olam Purchase Account (Test Bank)', institution_code: '300315' },
  { code: 'FAB', name: 'First Atlantic Bank', institution_code: '300316' },
  { code: 'PRD', name: 'Prudential Bank', institution_code: '300317' },
  { code: 'STB', name: 'Stanbic Bank', institution_code: '300318' },
  { code: 'FBO', name: 'First Bank of Nigeria', institution_code: '300319' },
  { code: 'BOA', name: 'Bank of Africa', institution_code: '300320' },
  { code: 'GTB', name: 'Guaranty Trust Bank', institution_code: '300322' },
  { code: 'FDL', name: 'Fidelity Bank', institution_code: '300323' },
  { code: 'SSB', name: 'OmniBSIC Bank', institution_code: '300324' },
  { code: 'UBA', name: 'United Bank of Africa', institution_code: '300325' },
  { code: 'BOG', name: 'Bank of Ghana', institution_code: '300328' },
  { code: 'ACB', name: 'Access Bank', institution_code: '300329' },
  { code: 'CBG', name: 'Consolidated Bank Ghana', institution_code: '300331' },
  { code: 'BYP', name: 'Bayport Savings and Loans', institution_code: '300333' },
  { code: 'FNB', name: 'First National Bank', institution_code: '300334' },
  { code: 'AFF', name: 'Affinity Ghana Savings and Loans', institution_code: '300341' },
  { code: 'ADH', name: 'Adehyeman Savings and Loans', institution_code: '300345' },
  { code: 'OIS', name: 'Opportunity International Savings and Loans', institution_code: '300349' },
  { code: 'SAB', name: 'Sinapi Aba Savings and Loans', institution_code: '300356' },
  { code: 'SIS', name: 'Services Integrity Savings & Loans', institution_code: '300361' },
  { code: 'GHL', name: 'GHL Bank', institution_code: '300362' },
  { code: 'UNL', name: 'Unity Link', institution_code: '300486' },
  { code: 'DFL', name: 'Dalex Finance and Leasing', institution_code: '300496' },
  { code: 'GMY', name: 'G-Money', institution_code: '300574' },
]

export function bankName(code) {
  const b = BANKS.find((x) => x.code === String(code || '').toUpperCase())
  return b?.name ?? null
}

export function bankInstitutionCode(code) {
  const b = BANKS.find((x) => x.code === String(code || '').toUpperCase())
  return b?.institution_code ?? null
}
