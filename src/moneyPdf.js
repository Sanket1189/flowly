const ascii = value => String(value ?? '').normalize('NFKD').replace(/[^\x20-\x7E]/g, '')
const escapePdf = value => ascii(value).replace(/([\\()])/g, '\\$1')
const inr = value => `INR ${Math.max(0, Number(value) || 0).toLocaleString('en-IN')}`

function wrapText(value, max = 74) {
  const words = ascii(value).trim().split(/\s+/).filter(Boolean)
  const lines = []
  let line = ''
  words.forEach(word => {
    const next = line ? `${line} ${word}` : word
    if (next.length > max && line) { lines.push(line); line = word } else line = next
  })
  if (line) lines.push(line)
  return lines.length ? lines : ['-']
}

const text = (value, x, y, size = 10, color = '0.08 0.25 0.21', font = 'F1') =>
  `BT /${font} ${size} Tf ${color} rg 1 0 0 1 ${x} ${y} Tm (${escapePdf(value)}) Tj ET`

const fillRect = (x, y, width, height, color) => `${color} rg ${x} ${y} ${width} ${height} re f`
const roundedRect = (x, y, width, height, radius, color) => {
  const r = Math.min(radius, width / 2, height / 2); const c = r * 0.5523; const right = x + width; const top = y + height
  return `${color} rg ${x + r} ${y} m ${right - r} ${y} l ${right - r + c} ${y} ${right} ${y + r - c} ${right} ${y + r} c ${right} ${top - r} l ${right} ${top - r + c} ${right - r + c} ${top} ${right - r} ${top} c ${x + r} ${top} l ${x + r - c} ${top} ${x} ${top - r + c} ${x} ${top - r} c ${x} ${y + r} l ${x} ${y + r - c} ${x + r - c} ${y} ${x + r} ${y} c h f`
}
const line = (x1, y1, x2, y2, color = '0.86 0.89 0.86') => `${color} RG ${x1} ${y1} m ${x2} ${y2} l S`

export function buildMoneyPdf(values, items, plan) {
  const pages = []
  const goalPlans = Array.isArray(plan.goalPlans) ? plan.goalPlans : []
  let commands = []
  let y = 0

  const startPage = () => {
    commands = [
      fillRect(0, 0, 595, 842, '0.97 0.96 0.91'),
      roundedRect(28, 766, 539, 58, 16, '0.08 0.25 0.21'),
      text('NIVA.', 48, 804, 18, '0.86 1 0.35', 'F2'),
      text('PERSONAL MONEY MAP', 48, 782, 8, '0.72 0.81 0.76'),
      text(`Created ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`, 447, 791, 8, '0.72 0.81 0.76'),
    ]
    y = 720
  }

  const finishPage = () => {
    commands.push(line(48, 43, 547, 43))
    commands.push(text(`Private, in-browser plan  |  Page ${pages.length + 1}`, 48, 27, 8, '0.43 0.52 0.48'))
    pages.push(commands.join('\n'))
  }

  startPage()
  commands.push(text('Your monthly plan', 48, y, 11, '0.43 0.52 0.48', 'F2'))
  y -= 35
  wrapText(values.goal, 34).slice(0, 2).forEach((entry, index) => commands.push(text(entry, 48, y - index * 28, 24, '0.08 0.25 0.21', 'F2')))
  y -= Math.min(2, wrapText(values.goal, 34).length) * 28 + 13
  commands.push(text(`${Math.round(plan.savedPercent)}% funded  |  ${inr(plan.remainingGoal)} remaining`, 48, y, 10, '0.36 0.46 0.41'))
  y -= 34

  commands.push(roundedRect(48, y - 82, 238, 82, 12, '1 1 1'))
  commands.push(roundedRect(309, y - 82, 238, 82, 12, '0.08 0.25 0.21'))
  commands.push(text('MONTHLY TAKE-HOME SALARY', 64, y - 23, 8, '0.43 0.52 0.48', 'F2'))
  commands.push(text(inr(values.income), 64, y - 56, 22, '0.08 0.25 0.21', 'F2'))
  commands.push(text('MONTHLY GOAL TRANSFER', 325, y - 23, 8, '0.72 0.81 0.76', 'F2'))
  commands.push(text(inr(plan.goalContribution), 325, y - 56, 22, '0.86 1 0.35', 'F2'))
  y -= 116

  commands.push(text('MONTHLY SPENDING ITEMS', 48, y, 10, '0.43 0.52 0.48', 'F2'))
  y -= 20
  commands.push(roundedRect(48, y - 26, 499, 26, 8, '0.90 0.92 0.88'))
  commands.push(text('ITEM', 60, y - 17, 8, '0.36 0.46 0.41', 'F2'))
  commands.push(text('CATEGORY', 340, y - 17, 8, '0.36 0.46 0.41', 'F2'))
  commands.push(text('MONTHLY', 470, y - 17, 8, '0.36 0.46 0.41', 'F2'))
  y -= 38

  const categoryName = type => type === 'essential' ? 'Essential' : type === 'debt' ? 'Debt / EMI' : 'Flexible'
  items.filter(item => Number(item.amount) > 0).forEach(item => {
    if (y < 105) { finishPage(); startPage(); commands.push(text('MONTHLY SPENDING ITEMS - CONTINUED', 48, y, 10, '0.43 0.52 0.48', 'F2')); y -= 26 }
    const name = wrapText(item.name, 42)[0]
    commands.push(roundedRect(48, y - 19, 499, 27, 8, '1 1 1'))
    commands.push(text(name, 60, y, 10))
    commands.push(text(categoryName(item.type), 340, y, 9, '0.36 0.46 0.41'))
    commands.push(text(inr(item.amount), 470, y, 9, '0.08 0.25 0.21', 'F2'))
    y -= 30
  })

  if (y < 250) { finishPage(); startPage() }
  y -= 5
  commands.push(text('SAVINGS GOALS', 48, y, 10, '0.43 0.52 0.48', 'F2'))
  y -= 20
  commands.push(roundedRect(48, y - 26, 499, 26, 8, '0.90 0.92 0.88'))
  commands.push(text('GOAL', 60, y - 17, 8, '0.36 0.46 0.41', 'F2'))
  commands.push(text('TARGET', 292, y - 17, 8, '0.36 0.46 0.41', 'F2'))
  commands.push(text('MONTHLY', 395, y - 17, 8, '0.36 0.46 0.41', 'F2'))
  commands.push(text('ESTIMATED', 486, y - 17, 8, '0.36 0.46 0.41', 'F2'))
  y -= 38
  goalPlans.forEach(goal => {
    if (y < 105) { finishPage(); startPage(); commands.push(text('SAVINGS GOALS - CONTINUED', 48, y, 10, '0.43 0.52 0.48', 'F2')); y -= 26 }
    commands.push(roundedRect(48, y - 19, 499, 27, 8, '1 1 1'))
    commands.push(text(wrapText(goal.name, 34)[0], 60, y, 10))
    commands.push(text(inr(goal.target), 292, y, 9, '0.36 0.46 0.41'))
    commands.push(text(inr(goal.monthly), 395, y, 9, '0.08 0.25 0.21', 'F2'))
    commands.push(text(goal.actualMonths ? `${goal.actualMonths} mo` : '-', 486, y, 9, '0.08 0.25 0.21', 'F2'))
    y -= 30
  })

  if (y < 320) { finishPage(); startPage() }
  y -= 5
  commands.push(text('PLAN SUMMARY', 48, y, 10, '0.43 0.52 0.48', 'F2'))
  y -= 26
  const summary = [
    ['Total monthly spending', inr(plan.committed)],
    ['Available before goal', inr(plan.available)],
    ['Monthly goal transfer', inr(plan.goalContribution)],
    ['Breathing room', inr(plan.buffer)],
    ['Weekly flexible limit', inr(plan.weekly)],
    ['Estimated goal timeline', plan.actualMonths ? `${plan.actualMonths} months` : 'Needs adjustment'],
  ]
  summary.forEach(([label, value], index) => {
    const column = index % 2
    const row = Math.floor(index / 2)
    const x = column ? 309 : 48
    const top = y - row * 58
    commands.push(roundedRect(x, top - 45, 238, 45, 10, column ? '0.93 0.95 0.90' : '1 1 1'))
    commands.push(text(label.toUpperCase(), x + 13, top - 16, 7, '0.43 0.52 0.48', 'F2'))
    commands.push(text(value, x + 13, top - 34, 12, '0.08 0.25 0.21', 'F2'))
  })
  y -= 190

  commands.push(text('YOUR NEXT ACTIONS', 48, y, 10, '0.43 0.52 0.48', 'F2'))
  y -= 26
  const actions = [
    `1. Move ${inr(plan.goalContribution)} across your ${goalPlans.length === 1 ? 'savings goal' : `${goalPlans.length} savings goals`} after salary arrives each month.`,
    `2. Keep flexible spending close to ${inr(plan.weekly)} per week.`,
    `3. Leave ${inr(plan.buffer)} unassigned for surprises and month-to-month variation.`,
  ]
  actions.forEach(action => {
    wrapText(action, 82).forEach(entry => { commands.push(text(entry, 60, y, 9)); y -= 15 })
    y -= 7
  })
  commands.push(text('Educational estimate only - not investment or financial advice.', 48, Math.max(62, y - 8), 8, '0.43 0.52 0.48'))
  finishPage()

  const objects = []
  const pageIds = pages.map((_, index) => 5 + index * 2)
  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>'
  objects[2] = `<< /Type /Pages /Kids [${pageIds.map(id => `${id} 0 R`).join(' ')}] /Count ${pages.length} >>`
  objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'
  objects[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>'
  pages.forEach((content, index) => {
    const pageId = 5 + index * 2
    const contentId = pageId + 1
    objects[pageId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>`
    objects[contentId] = `<< /Length ${content.length} >>\nstream\n${content}\nendstream`
  })
  const maxId = objects.length - 1
  let pdf = '%PDF-1.4\n%1234\n'
  const offsets = [0]
  for (let id = 1; id <= maxId; id += 1) {
    offsets[id] = pdf.length
    pdf += `${id} 0 obj\n${objects[id]}\nendobj\n`
  }
  const xref = pdf.length
  pdf += `xref\n0 ${maxId + 1}\n0000000000 65535 f \n`
  for (let id = 1; id <= maxId; id += 1) pdf += `${String(offsets[id]).padStart(10, '0')} 00000 n \n`
  pdf += `trailer\n<< /Size ${maxId + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`
  return pdf
}

export function downloadMoneyPdf(values, items, plan) {
  const blob = new Blob([buildMoneyPdf(values, items, plan)], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${ascii(values.goal).toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'money'}-money-map.pdf`
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
