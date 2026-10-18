import { mkdir, writeFile } from 'node:fs/promises'
import { buildPlannerPdf } from '../src/plannerPdf.js'

const routine = {
  brand: 'Ritual.',
  title: 'My weekly rhythm',
  subtitle: '2 day groups combined into one weekly plan',
  summary: [
    { label: 'Day groups', value: '2' },
    { label: 'Activities', value: '7' },
    { label: 'Days covered', value: '7' },
  ],
  sections: [
    {
      title: 'Weekdays - Mon, Tue, Wed, Thu, Fri',
      rows: [
        { label: '06:30', detail: 'Wake up and hydrate - Morning', meta: '15m' },
        { label: '09:00', detail: 'Focused work block - Focus', meta: '1h 30m' },
        { label: '18:00', detail: 'Walk and reset - Health', meta: '30m' },
        { label: '21:30', detail: 'Read and wind down - Evening', meta: '30m' },
      ],
    },
    {
      title: 'Weekend - Sat, Sun',
      rows: [
        { label: '08:30', detail: 'Slow breakfast - Morning', meta: '45m' },
        { label: '11:00', detail: 'Personal project - Personal', meta: '1h 30m' },
        { label: '17:00', detail: 'Outdoor time - Health', meta: '1h' },
      ],
    },
  ],
}

await mkdir(new URL('../output/pdf/', import.meta.url), { recursive: true })
await writeFile(new URL('../output/pdf/ritual-weekly-routine-sample.pdf', import.meta.url), buildPlannerPdf(routine), 'binary')
