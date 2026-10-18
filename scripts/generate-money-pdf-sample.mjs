import { mkdir, writeFile } from 'node:fs/promises'
import { buildMoneyPdf } from '../src/moneyPdf.js'

const values = {
  income: 80000,
  goal: '2 savings goals',
}

const items = [
  { name: 'Rent & utilities', amount: 24000, type: 'essential' },
  { name: 'Groceries & transport', amount: 10000, type: 'essential' },
  { name: 'Lifestyle & subscriptions', amount: 16000, type: 'flexible' },
  { name: 'Loan repayments', amount: 5000, type: 'debt' },
]

const plan = {
  savedPercent: 13,
  remainingGoal: 260000,
  goalContribution: 17500,
  committed: 55000,
  available: 25000,
  buffer: 7500,
  weekly: 3695,
  actualMonths: 20,
  goalPlans: [
    { id: 1, name: 'Goa family holiday', target: 120000, saved: 20000, remaining: 100000, monthly: 7000, actualMonths: 15 },
    { id: 2, name: 'New laptop', target: 180000, saved: 20000, remaining: 160000, monthly: 10500, actualMonths: 16 },
  ],
}

await mkdir(new URL('../output/pdf/', import.meta.url), { recursive: true })
await writeFile(new URL('../output/pdf/niva-money-map-sample.pdf', import.meta.url), buildMoneyPdf(values, items, plan), 'binary')
