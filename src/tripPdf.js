const ascii = (value) => String(value ?? '').normalize('NFKD').replace(/[^\x20-\x7E]/g, '')
const escapePdf = (value) => ascii(value).replace(/([\\()])/g, '\\$1')

function wrapText(value, max = 76) {
  const words = ascii(value).trim().split(/\s+/).filter(Boolean)
  const lines = []
  let line = ''
  words.forEach(word => {
    const next = line ? `${line} ${word}` : word
    if (next.length > max && line) { lines.push(line); line = word } else line = next
  })
  if (line) lines.push(line)
  return lines.length ? lines : ['Untitled spot']
}

const text = (value, x, y, size = 10, color = '0.09 0.22 0.29') =>
  `BT /F1 ${size} Tf ${color} rg 1 0 0 1 ${x} ${y} Tm (${escapePdf(value)}) Tj ET`
const fillRect = (x, y, width, height, color) => `${color} rg ${x} ${y} ${width} ${height} re f`
const roundedRect = (x, y, width, height, radius, color) => {
  const r = Math.min(radius, width / 2, height / 2); const c = r * 0.5523; const right = x + width; const top = y + height
  return `${color} rg ${x + r} ${y} m ${right - r} ${y} l ${right - r + c} ${y} ${right} ${y + r - c} ${right} ${y + r} c ${right} ${top - r} l ${right} ${top - r + c} ${right - r + c} ${top} ${right - r} ${top} c ${x + r} ${top} l ${x + r - c} ${top} ${x} ${top - r + c} ${x} ${top - r} c ${x} ${y + r} l ${x} ${y + r - c} ${x + r - c} ${y} ${x + r} ${y} c h f`
}

export function buildTripPdf(details, days) {
  const pages = []
  let commands = []
  let y = 0
  const startPage = () => {
    commands = [
      fillRect(0, 0, 595, 842, '0.96 0.98 0.98'),
      roundedRect(28, 766, 539, 58, 16, '0.09 0.22 0.29'),
      text('ROAMLY TRIP PLAN', 48, 798, 9, '0.75 0.89 0.92'),
      text(`${details.days} DAYS  |  ${details.people} TRAVELLER${Number(details.people) === 1 ? '' : 'S'}`, 400, 798, 8, '0.75 0.89 0.92'),
      text(`${details.days} days in ${details.destination}`, 50, 735, 24),
      text(`${details.pace} pace  |  starts ${days[0]?.date || 'date not set'}  |  INR ${Number(details.budget || 0).toLocaleString('en-IN')}`, 50, 710, 10, '0.39 0.52 0.56'),
    ]
    y = 675
  }
  const finishPage = () => {
    commands.push('0.89 0.92 0.93 RG 50 43 m 545 43 l S')
    commands.push(text(`Created with Roamly  |  Page ${pages.length + 1}`, 50, 27, 8, '0.48 0.57 0.59'))
    pages.push(commands.join('\n'))
  }
  startPage()
  days.forEach(day => {
    const spots = day.spots.filter(spot => spot.text.trim())
    const lineCount = spots.reduce((sum, spot) => sum + Math.max(1, wrapText(spot.text).length), 0)
    const needed = 50 + lineCount * 17 + spots.length * 5
    if (y - needed < 65) { finishPage(); startPage() }
    commands.push(roundedRect(50, y - needed, 495, needed, 14, '1 1 1'))
    commands.push(text(`DAY ${String(day.day).padStart(2, '0')}  |  ${day.date || 'Date not set'}`, 66, y - 24, 11, '0.94 0.36 0.27'))
    let rowY = y - 50
    spots.forEach(spot => {
      const wrapped = wrapText(spot.text)
      commands.push(text(spot.time || 'TBD', 66, rowY, 8, '0.48 0.57 0.59'))
      wrapped.forEach((line, index) => {
        commands.push(text(line, 116, rowY - index * 17, 10))
      })
      rowY -= Math.max(1, wrapped.length) * 17 + 5
    })
    y -= needed + 12
  })
  finishPage()

  const objects = []
  const pageIds = pages.map((_, index) => 4 + index * 2)
  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>'
  objects[2] = `<< /Type /Pages /Kids [${pageIds.map(id => `${id} 0 R`).join(' ')}] /Count ${pages.length} >>`
  objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'
  pages.forEach((content, index) => {
    const pageId = 4 + index * 2
    const contentId = pageId + 1
    objects[pageId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`
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

export function downloadTripPdf(details, days) {
  const pdf = buildTripPdf(details, days)
  const blob = new Blob([pdf], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${ascii(details.destination).toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'trip'}-itinerary.pdf`
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
