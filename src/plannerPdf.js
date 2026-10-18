const ascii = value => String(value ?? '').normalize('NFKD').replace(/[^\x20-\x7E]/g, '')
const escapePdf = value => ascii(value).replace(/([\\()])/g, '\\$1')
const text = (value, x, y, size = 10, color = '0.10 0.18 0.25', font = 'F1') => `BT /${font} ${size} Tf ${color} rg 1 0 0 1 ${x} ${y} Tm (${escapePdf(value)}) Tj ET`
const fillRect = (x, y, width, height, color) => `${color} rg ${x} ${y} ${width} ${height} re f`
const roundedRect = (x, y, width, height, radius, color) => {
  const r = Math.min(radius, width / 2, height / 2); const c = r * 0.5523; const right = x + width; const top = y + height
  return `${color} rg ${x + r} ${y} m ${right - r} ${y} l ${right - r + c} ${y} ${right} ${y + r - c} ${right} ${y + r} c ${right} ${top - r} l ${right} ${top - r + c} ${right - r + c} ${top} ${right - r} ${top} c ${x + r} ${top} l ${x + r - c} ${top} ${x} ${top - r + c} ${x} ${top - r} c ${x} ${y + r} l ${x} ${y + r - c} ${x + r - c} ${y} ${x + r} ${y} c h f`
}
const line = (x1, y1, x2, y2, color = '0.84 0.88 0.90') => `${color} RG ${x1} ${y1} m ${x2} ${y2} l S`
const wrap = (value, max = 72) => {
  const words = ascii(value).trim().split(/\s+/).filter(Boolean); const lines = []; let current = ''
  words.forEach(word => { const next = current ? `${current} ${word}` : word; if (next.length > max && current) { lines.push(current); current = word } else current = next })
  if (current) lines.push(current)
  return lines.length ? lines : ['-']
}

export function buildPlannerPdf({ brand, title, subtitle, summary = [], sections = [] }) {
  const pages = []; let commands = []; let y = 0
  const startPage = () => {
    commands = [fillRect(0, 0, 595, 842, '0.97 0.97 0.94'), roundedRect(28, 766, 539, 58, 16, '0.10 0.18 0.25'), text(brand.toUpperCase(), 48, 804, 17, '0.79 0.95 0.42', 'F2'), text('FLOWLY SELF-SERVICE PLAN', 48, 782, 8, '0.72 0.79 0.82'), text(new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }), 470, 790, 8, '0.72 0.79 0.82')]
    y = 718
  }
  const finishPage = () => { commands.push(line(48, 43, 547, 43)); commands.push(text(`Private, in-browser plan  |  Page ${pages.length + 1}`, 48, 27, 8, '0.43 0.50 0.54')); pages.push(commands.join('\n')) }
  const ensure = height => { if (y - height < 65) { finishPage(); startPage() } }
  startPage()
  wrap(title, 42).slice(0, 2).forEach((entry, index) => commands.push(text(entry, 48, y - index * 30, 25, '0.10 0.18 0.25', 'F2')))
  y -= Math.min(2, wrap(title, 42).length) * 30 + 4
  wrap(subtitle, 84).slice(0, 2).forEach(entry => { commands.push(text(entry, 48, y, 9, '0.40 0.48 0.52')); y -= 15 })
  y -= 15
  summary.forEach((item, index) => {
    const x = 48 + (index % 3) * 169; const row = Math.floor(index / 3); const top = y - row * 64
    commands.push(roundedRect(x, top - 48, 154, 48, 10, index === 0 ? '0.85 0.95 0.75' : '1 1 1'))
    commands.push(text(item.label.toUpperCase(), x + 11, top - 17, 7, '0.43 0.50 0.54', 'F2'))
    commands.push(text(item.value, x + 11, top - 37, 12, '0.10 0.18 0.25', 'F2'))
  })
  y -= Math.ceil(summary.length / 3) * 64 + 16
  sections.forEach(section => {
    const sectionEstimate = 34 + section.rows.reduce((sum, row) => sum + Math.max(55, 38 + wrap(row.detail, 58).slice(0, 2).length * 12), 0)
    if (sectionEstimate < 620 && y - sectionEstimate < 65) { finishPage(); startPage() }
    ensure(70)
    commands.push(text(section.title.toUpperCase(), 48, y, 10, '0.43 0.50 0.54', 'F2')); y -= 20
    section.rows.forEach(row => {
      const detailLines = wrap(row.detail, 58).slice(0, 2); const height = Math.max(48, 31 + detailLines.length * 12)
      if (y - height < 65) { finishPage(); startPage(); commands.push(text(`${section.title.toUpperCase()} - CONTINUED`, 48, y, 10, '0.43 0.50 0.54', 'F2')); y -= 20 }
      commands.push(roundedRect(48, y - height, 499, height, 10, '1 1 1'))
      commands.push(text(row.label, 61, y - 19, 11, '0.10 0.18 0.25', 'F2'))
      detailLines.forEach((entry, index) => commands.push(text(entry, 61, y - 36 - index * 12, 8, '0.39 0.47 0.51')))
      if (row.meta) commands.push(text(row.meta, 445, y - 20, 8, '0.30 0.42 0.38', 'F2'))
      y -= height + 7
    })
    y -= 13
  })
  finishPage()
  const objects = []; const pageIds = pages.map((_, index) => 5 + index * 2)
  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>'; objects[2] = `<< /Type /Pages /Kids [${pageIds.map(id => `${id} 0 R`).join(' ')}] /Count ${pages.length} >>`; objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'; objects[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>'
  pages.forEach((content, index) => { const pageId = 5 + index * 2; const contentId = pageId + 1; objects[pageId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>`; objects[contentId] = `<< /Length ${content.length} >>\nstream\n${content}\nendstream` })
  let pdf = '%PDF-1.4\n%1234\n'; const offsets = [0]
  for (let id = 1; id < objects.length; id += 1) { offsets[id] = pdf.length; pdf += `${id} 0 obj\n${objects[id]}\nendobj\n` }
  const xref = pdf.length; pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`; for (let id = 1; id < objects.length; id += 1) pdf += `${String(offsets[id]).padStart(10, '0')} 00000 n \n`
  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`
  return pdf
}

export function downloadPlannerPdf(data, filename) {
  const blob = new Blob([buildPlannerPdf(data)], { type: 'application/pdf' }); const url = URL.createObjectURL(blob); const link = document.createElement('a')
  link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000)
}
