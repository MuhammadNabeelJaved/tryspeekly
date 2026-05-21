export interface PaymentMethodOption {
  id: string
  name: string
  category: 'fintech' | 'bank'
  domain: string
  color: string
}

export const PAYMENT_METHODS: PaymentMethodOption[] = [
  { id: 'jazzcash',   name: 'JazzCash',                 category: 'fintech', domain: 'jazzcash.com.pk',   color: '#CC0000' },
  { id: 'easypaisa',  name: 'Easypaisa',                 category: 'fintech', domain: 'easypaisa.com.pk',  color: '#00A651' },
  { id: 'nayapay',    name: 'NayaPay',                   category: 'fintech', domain: 'nayapay.com',       color: '#6C3CE1' },
  { id: 'sadapay',    name: 'SadaPay',                   category: 'fintech', domain: 'sadapay.com',       color: '#000000' },
  { id: 'zindigi',    name: 'Zindigi',                   category: 'fintech', domain: 'zindigi.com',       color: '#7B2D8B' },
  { id: 'upaisa',     name: 'UPaisa',                    category: 'fintech', domain: 'upaisa.com',        color: '#F7941D' },
  { id: 'timepey',    name: 'TimePey',                   category: 'fintech', domain: 'timepey.com',       color: '#00AEEF' },
  { id: 'raast',      name: 'Raast (SBP)',               category: 'fintech', domain: 'raast.com.pk',      color: '#009B77' },
  { id: 'cash',       name: 'Cash',                      category: 'fintech', domain: '',                  color: '#4CAF50' },
  { id: 'hbl',        name: 'HBL',                       category: 'bank',    domain: 'hbl.com',           color: '#00874E' },
  { id: 'ubl',        name: 'UBL',                       category: 'bank',    domain: 'ubl.com',           color: '#C8202E' },
  { id: 'mcb',        name: 'MCB Bank',                  category: 'bank',    domain: 'mcb.com.pk',        color: '#E31E24' },
  { id: 'allied',     name: 'Allied Bank',               category: 'bank',    domain: 'abl.com',           color: '#003087' },
  { id: 'alfalah',    name: 'Bank Alfalah',              category: 'bank',    domain: 'bankalfalah.com',   color: '#00539B' },
  { id: 'meezan',     name: 'Meezan Bank',               category: 'bank',    domain: 'meezanbank.com',    color: '#007749' },
  { id: 'askari',     name: 'Askari Bank',               category: 'bank',    domain: 'askaribank.com',    color: '#006341' },
  { id: 'alhabib',    name: 'Bank Al-Habib',             category: 'bank',    domain: 'bankalhabib.com',   color: '#C8202E' },
  { id: 'faysal',     name: 'Faysal Bank',               category: 'bank',    domain: 'faysalbank.com',    color: '#009A44' },
  { id: 'soneri',     name: 'Soneri Bank',               category: 'bank',    domain: 'soneribank.com',    color: '#D4A017' },
  { id: 'sc',         name: 'Standard Chartered',        category: 'bank',    domain: 'sc.com',            color: '#0072AA' },
  { id: 'habibmetro', name: 'Habib Metro',               category: 'bank',    domain: 'habibmetro.com',    color: '#C8202E' },
  { id: 'silkbank',   name: 'Silk Bank',                 category: 'bank',    domain: 'silkbank.com.pk',   color: '#9B1B30' },
  { id: 'nbp',        name: 'National Bank of Pakistan', category: 'bank',    domain: 'nbp.com.pk',        color: '#005B9F' },
  { id: 'bop',        name: 'Bank of Punjab',            category: 'bank',    domain: 'bop.com.pk',        color: '#004C97' },
  { id: 'bok',        name: 'Bank of Khyber',            category: 'bank',    domain: 'bok.com.pk',        color: '#005A9C' },
  { id: 'sindhbank',  name: 'Sindh Bank',                category: 'bank',    domain: 'sindhbank.com.pk',  color: '#00843D' },
  { id: 'fwb',        name: 'First Women Bank',          category: 'bank',    domain: 'fwbl.com.pk',       color: '#9B1B30' },
  { id: 'summit',     name: 'Summit Bank',               category: 'bank',    domain: 'summitbank.com.pk', color: '#005BAA' },
  { id: 'ztbl',       name: 'Zarai Taraqiati Bank',      category: 'bank',    domain: 'ztbl.gov.pk',       color: '#4CAF50' },
]

export function getMethodById(id: string): PaymentMethodOption | undefined {
  return PAYMENT_METHODS.find(m => m.id === id)
}

export function getFaviconUrl(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
}
