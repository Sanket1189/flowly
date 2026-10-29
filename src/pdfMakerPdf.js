const PAGE_WIDTH = 595
const PAGE_HEIGHT = 842
const MARGIN = 42

const ascii = value => String(value ?? '').normalize('NFKD').replace(/[^\x20-\x7E]/g, '')
const escapePdf = value => ascii(value).replace(/([\\()])/g, '\\$1')
const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value) || min))
const safeLink = value => {
  const raw = String(value || '').trim()
  if (!raw) return ''
  const candidate = /^(https?:|mailto:)/i.test(raw) ? raw : `https://${raw}`
  try {
    const url = new URL(candidate)
    return ['http:', 'https:', 'mailto:'].includes(url.protocol) ? url.href : ''
  } catch {
    return ''
  }
}

const jpegFromDataUrl = value => {
  const match = /^data:image\/jpeg;base64,(.+)$/i.exec(String(value || ''))
  if (!match) return null
  try {
    const binary = atob(match[1])
    return binary || null
  } catch {
    return null
  }
}

const drawImage = (resource, x, top, frameWidth, frameHeight, fit = 'contain', opacityResource = '') => {
  if (!resource) return ''
  const imageRatio = resource.width / Math.max(1, resource.height)
  const frameRatio = frameWidth / Math.max(1, frameHeight)
  const cover = fit === 'cover'
  const useWidth = cover ? imageRatio < frameRatio : imageRatio > frameRatio
  const width = useWidth ? frameWidth : frameHeight * imageRatio
  const height = useWidth ? frameWidth / imageRatio : frameHeight
  const left = x + (frameWidth - width) / 2
  const bottom = top - frameHeight + (frameHeight - height) / 2
  const clip = cover ? `${x.toFixed(2)} ${(top - frameHeight).toFixed(2)} ${frameWidth.toFixed(2)} ${frameHeight.toFixed(2)} re W n ` : ''
  const opacity = opacityResource ? `/${opacityResource} gs ` : ''
  return `q ${opacity}${clip}${width.toFixed(2)} 0 0 ${height.toFixed(2)} ${left.toFixed(2)} ${bottom.toFixed(2)} cm /${resource.name} Do Q`
}

const rgb = value => {
  const hex = String(value || '#173b32').replace('#', '').padEnd(6, '0').slice(0, 6)
  const parts = [0, 2, 4].map(index => parseInt(hex.slice(index, index + 2), 16) / 255)
  return parts.map(item => (Number.isFinite(item) ? item : 0).toFixed(3)).join(' ')
}

const fillRect = (x, y, width, height, color) => `${rgb(color)} rg ${x} ${y} ${width} ${height} re f`
const strokeRect = (x, y, width, height, color, lineWidth = 1) => `${rgb(color)} RG ${lineWidth} w ${x} ${y} ${width} ${height} re S`
const line = (x1, y1, x2, y2, color, lineWidth = 1) => `${rgb(color)} RG ${lineWidth} w ${x1} ${y1} m ${x2} ${y2} l S`
const dividerLine = (x1, y, x2, color, lineWidth = 1, style = 'solid') => {
  const width = clamp(lineWidth, 1, 8)
  if (style === 'double') {
    const strokeWidth = Math.max(1, width / 2)
    const offset = Math.max(2, width)
    return `q ${rgb(color)} RG ${strokeWidth} w ${x1} ${y - offset / 2} m ${x2} ${y - offset / 2} l S ${x1} ${y + offset / 2} m ${x2} ${y + offset / 2} l S Q`
  }
  const pattern = style === 'dashed' ? '[8 5] 0 d' : style === 'dotted' ? '[1 4] 0 d 1 J' : '[] 0 d'
  return `q ${rgb(color)} RG ${width} w ${pattern} ${x1} ${y} m ${x2} ${y} l S Q`
}
const verticalDividerLine = (x, top, bottom, color, lineWidth = 1, style = 'solid') => {
  const width = clamp(lineWidth, 1, 8)
  if (style === 'double') {
    const strokeWidth = Math.max(1, width / 2)
    const offset = Math.max(2, width) / 2
    return `q ${rgb(color)} RG ${strokeWidth} w ${x - offset} ${top} m ${x - offset} ${bottom} l S ${x + offset} ${top} m ${x + offset} ${bottom} l S Q`
  }
  const pattern = style === 'dashed' ? '[8 5] 0 d' : style === 'dotted' ? '[1 4] 0 d 1 J' : '[] 0 d'
  return `q ${rgb(color)} RG ${width} w ${pattern} ${x} ${top} m ${x} ${bottom} l S Q`
}
const verticalDividerX = (block, x, width) => block.align === 'right' ? x + width : block.align === 'left' ? x : x + width / 2
const circle = (cx, cy, radius, color) => {
  const c = radius * .5522848
  return `${rgb(color)} rg ${cx + radius} ${cy} m ${cx + radius} ${cy + c} ${cx + c} ${cy + radius} ${cx} ${cy + radius} c ${cx - c} ${cy + radius} ${cx - radius} ${cy + c} ${cx - radius} ${cy} c ${cx - radius} ${cy - c} ${cx - c} ${cy - radius} ${cx} ${cy - radius} c ${cx + c} ${cy - radius} ${cx + radius} ${cy - c} ${cx + radius} ${cy} c h f`
}
const ellipse = (cx, cy, rx, ry, color) => {
  const k = .5522848
  return `${rgb(color)} rg ${cx + rx} ${cy} m ${cx + rx} ${cy + ry * k} ${cx + rx * k} ${cy + ry} ${cx} ${cy + ry} c ${cx - rx * k} ${cy + ry} ${cx - rx} ${cy + ry * k} ${cx - rx} ${cy} c ${cx - rx} ${cy - ry * k} ${cx - rx * k} ${cy - ry} ${cx} ${cy - ry} c ${cx + rx * k} ${cy - ry} ${cx + rx} ${cy - ry * k} ${cx + rx} ${cy} c h f`
}
const polygon = (points, x, top, width, height, color) => {
  const [first, ...rest] = points
  const point = ([px, py]) => `${(x + px * width).toFixed(2)} ${(top - py * height).toFixed(2)}`
  return `${rgb(color)} rg ${point(first)} m ${rest.map(entry => `${point(entry)} l`).join(' ')} h f`
}
const roundedRect = (x, y, width, height, radius, color) => {
  const r = Math.min(radius, width / 2, height / 2)
  const c = r * .5522848
  return `${rgb(color)} rg ${x + r} ${y} m ${x + width - r} ${y} l ${x + width - r + c} ${y} ${x + width} ${y + r - c} ${x + width} ${y + r} c ${x + width} ${y + height - r} l ${x + width} ${y + height - r + c} ${x + width - r + c} ${y + height} ${x + width - r} ${y + height} c ${x + r} ${y + height} l ${x + r - c} ${y + height} ${x} ${y + height - r + c} ${x} ${y + height - r} c ${x} ${y + r} l ${x} ${y + r - c} ${x + r - c} ${y} ${x + r} ${y} c h f`
}

const resolvedCornerRadii = block => {
  if (typeof block.borderRadius === 'number') {
    const radius = clamp(block.borderRadius, 0, 80)
    return { topLeft: radius, topRight: radius, bottomRight: radius, bottomLeft: radius }
  }
  const value = block.borderRadius || {}
  return {
    topLeft: clamp(value.topLeft || 0, 0, 80),
    topRight: clamp(value.topRight || 0, 0, 80),
    bottomRight: clamp(value.bottomRight || 0, 0, 80),
    bottomLeft: clamp(value.bottomLeft || 0, 0, 80),
  }
}

const roundedRectCorners = (x, y, width, height, radii, color) => {
  const limit = Math.min(width / 2, height / 2)
  const tl = Math.min(radii.topLeft, limit)
  const tr = Math.min(radii.topRight, limit)
  const br = Math.min(radii.bottomRight, limit)
  const bl = Math.min(radii.bottomLeft, limit)
  const k = .5522848
  return `${rgb(color)} rg ${x + bl} ${y} m ${x + width - br} ${y} l ${x + width - br + br * k} ${y} ${x + width} ${y + br - br * k} ${x + width} ${y + br} c ${x + width} ${y + height - tr} l ${x + width} ${y + height - tr + tr * k} ${x + width - tr + tr * k} ${y + height} ${x + width - tr} ${y + height} c ${x + tl} ${y + height} l ${x + tl - tl * k} ${y + height} ${x} ${y + height - tl + tl * k} ${x} ${y + height - tl} c ${x} ${y + bl} l ${x} ${y + bl - bl * k} ${x + bl - bl * k} ${y} ${x + bl} ${y} c h f`
}

const fillBlockBackground = (block, x, y, width, height, color) => {
  const radii = resolvedCornerRadii(block)
  return Object.values(radii).some(Boolean) ? roundedRectCorners(x, y, width, height, radii, color) : fillRect(x, y, width, height, color)
}

const shapePoints = {
  triangle: [[.5, 0], [1, 1], [0, 1]],
  diamond: [[.5, 0], [1, .5], [.5, 1], [0, .5]],
  pentagon: [[.5, 0], [1, .38], [.82, 1], [.18, 1], [0, .38]],
  hexagon: [[.25, 0], [.75, 0], [1, .5], [.75, 1], [.25, 1], [0, .5]],
  star: [[.5, 0], [.61, .35], [.98, .35], [.68, .57], [.79, 1], [.5, .73], [.21, 1], [.32, .57], [.02, .35], [.39, .35]],
  arrow: [[0, .3], [.65, .3], [.65, 0], [1, .5], [.65, 1], [.65, .7], [0, .7]],
  chevron: [[0, 0], [.6, 0], [1, .5], [.6, 1], [0, 1], [.4, .5]],
  parallelogram: [[.2, 0], [1, 0], [.8, 1], [0, 1]],
  octagon: [[.3, 0], [.7, 0], [1, .3], [1, .7], [.7, 1], [.3, 1], [0, .7], [0, .3]],
  heart: [[.5, 1], [.08, .58], [0, .28], [.12, .06], [.34, 0], [.5, .18], [.66, 0], [.88, .06], [1, .28], [.92, .58]],
  cloud: [[.08, .72], [0, .55], [.07, .38], [.25, .34], [.31, .12], [.5, .05], [.67, .18], [.82, .17], [1, .38], [.94, .68], [.72, .76], [.3, .77]],
  speech: [[0, 0], [1, 0], [1, .75], [.42, .75], [.2, 1], [.25, .75], [0, .75]],
  badge: [[.5, 0], [.62, .18], [.85, .15], [.82, .38], [1, .5], [.82, .62], [.85, .85], [.62, .82], [.5, 1], [.38, .82], [.15, .85], [.18, .62], [0, .5], [.18, .38], [.15, .15], [.38, .18]],
  cross: [[.34, 0], [.66, 0], [.66, .34], [1, .34], [1, .66], [.66, .66], [.66, 1], [.34, 1], [.34, .66], [0, .66], [0, .34], [.34, .34]],
  plus: [[.4, 0], [.6, 0], [.6, .4], [1, .4], [1, .6], [.6, .6], [.6, 1], [.4, 1], [.4, .6], [0, .6], [0, .4], [.4, .4]],
  lightning: [[.56, 0], [.18, .55], [.46, .55], [.32, 1], [.84, .38], [.55, .38]],
}

const drawShape = (shape, x, top, width, height, color, opacityResource = '', strokeColor = '#173b32', strokeWidth = 0, rotation = 0, flipX = false, flipY = false) => {
  let drawing
  if (shape === 'circle') {
    const diameter = Math.min(width, height)
    drawing = circle(x + diameter / 2, top - diameter / 2, diameter / 2, color)
  }
  else if (shape === 'ellipse') drawing = ellipse(x + width / 2, top - height / 2, width / 2, height / 2, color)
  else if (shape === 'rounded') drawing = roundedRect(x, top - height, width, height, Math.min(18, height * .3), color)
  else if (shapePoints[shape]) drawing = polygon(shapePoints[shape], x, top, width, height, color)
  else drawing = fillRect(x, top - height, width, height, color)
  const outline = clamp(strokeWidth, 0, 12)
  if (outline > 0) drawing = `${rgb(strokeColor)} RG ${outline} w ${drawing.replace(/ f$/, ' B')}`
  const angle = -(Number(rotation) || 0) * Math.PI / 180
  const cos = Math.cos(angle) * (flipX ? -1 : 1)
  const sin = Math.sin(angle) * (flipX ? -1 : 1)
  const c = -Math.sin(angle) * (flipY ? -1 : 1)
  const d = Math.cos(angle) * (flipY ? -1 : 1)
  const cx = x + width / 2
  const cy = top - height / 2
  const transform = rotation || flipX || flipY ? `1 0 0 1 ${cx.toFixed(2)} ${cy.toFixed(2)} cm ${cos.toFixed(6)} ${sin.toFixed(6)} ${c.toFixed(6)} ${d.toFixed(6)} 0 0 cm 1 0 0 1 ${(-cx).toFixed(2)} ${(-cy).toFixed(2)} cm ` : ''
  const opacity = opacityResource ? `/${opacityResource} gs ` : ''
  return transform || opacity || outline > 0 ? `q ${opacity}${transform}${drawing} Q` : drawing
}

const estimateWidth = (value, size, bold = false) => ascii(value).length * size * (bold ? .56 : .51)
const fontResource = (fontFamily, bold) => {
  const family = String(fontFamily || '').toLowerCase()
  if (family.includes('courier')) return bold ? 'F6' : 'F5'
  if (family.includes('georgia') || family.includes('times')) return bold ? 'F4' : 'F3'
  return bold ? 'F2' : 'F1'
}
const text = (value, x, y, { size = 11, color = '#173b32', bold = false, fontFamily = '' } = {}) => `BT /${fontResource(fontFamily, bold)} ${size} Tf ${rgb(color)} rg 1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm (${escapePdf(value)}) Tj ET`

const wrap = (value, width, size, bold = false) => {
  const paragraphs = String(value || '').split(/\r?\n/)
  const result = []
  paragraphs.forEach((paragraph, paragraphIndex) => {
    const words = ascii(paragraph).trim().split(/\s+/).filter(Boolean)
    let current = ''
    words.forEach(word => {
      const candidate = current ? `${current} ${word}` : word
      if (current && estimateWidth(candidate, size, bold) > width) { result.push(current); current = word }
      else current = candidate
    })
    if (current) result.push(current)
    if (!words.length || paragraphIndex < paragraphs.length - 1) result.push('')
  })
  return result.length ? result : ['']
}

const alignedX = (value, x, width, size, align, bold) => {
  const measured = estimateWidth(value, size, bold)
  if (align === 'center') return x + Math.max(0, (width - measured) / 2)
  if (align === 'right') return x + Math.max(0, width - measured)
  return x
}

const blockLayout = block => {
  const availableWidth = PAGE_WIDTH - MARGIN * 2
  const width = availableWidth * (clamp(block.blockWidth ?? 100, 10, 100) / 100)
  const position = block.position || 'left'
  const x = position === 'center' ? MARGIN + (availableWidth - width) / 2 : position === 'right' ? PAGE_WIDTH - MARGIN - width : MARGIN
  return { x, width }
}

const describeList = (block, width) => {
  const size = clamp(block.fontSize, 8, 32)
  const leading = size * 1.45
  const items = (Array.isArray(block.items) && block.items.length ? block.items : ['List item']).map(item => wrap(item, Math.max(24, width - 34), size, false))
  const height = Math.max(42, items.reduce((total, lines) => total + Math.max(1, lines.length) * leading, 0) + 22)
  return { size, leading, items, height }
}

const drawList = (target, block, x, width, top, description = describeList(block, width)) => {
  let localY = top - 17
  description.items.forEach((lines, itemIndex) => {
    const marker = block.listStyle === 'decimal' ? `${itemIndex + 1}.` : block.listStyle === 'lower-alpha' ? `${String.fromCharCode(97 + itemIndex % 26)}.` : null
    if (marker) target.push(text(marker, x + 9, localY, { size: description.size, color: block.color || '#173b32', fontFamily: block.fontFamily }))
    else target.push(circle(x + 13, localY + description.size * .28, Math.max(1.7, description.size * .15), block.color || '#173b32'))
    lines.forEach((entry, lineIndex) => {
      const lineX = alignedX(entry, x + 29, width - 39, description.size, block.align, false)
      target.push(text(entry, lineX, localY - lineIndex * description.leading, { size: description.size, color: block.color || '#173b32', fontFamily: block.fontFamily }))
    })
    localY -= Math.max(1, lines.length) * description.leading
  })
}

export function buildCustomPdf(document) {
  const pageColor = document.pageColor || '#f7f7f2'
  const blocks = Array.isArray(document.blocks) ? document.blocks : []
  const imageResources = []
  const imageByData = new Map()
  blocks.filter(block => block.type === 'image' && block.imageData).forEach(block => {
    if (imageByData.has(block.imageData)) return
    const binary = jpegFromDataUrl(block.imageData)
    if (!binary) return
    const resource = { name: `Im${imageResources.length + 1}`, binary, width: Math.max(1, Number(block.imageWidth) || 1), height: Math.max(1, Number(block.imageHeight) || 1) }
    imageResources.push(resource)
    imageByData.set(block.imageData, resource)
  })
  const resolvedOpacity = block => {
    const value = Number(block.opacity)
    return clamp(Number.isFinite(value) ? value : 100, block.type === 'image' ? 10 : 0, 100)
  }
  const opacityValues = [...new Set(blocks.filter(block => ['image', 'shape'].includes(block.type)).map(resolvedOpacity).filter(value => value < 100))]
  const opacityResources = new Map(opacityValues.map((value, index) => [value, { name: `GS${index + 1}`, value }]))
  const opacityName = block => opacityResources.get(resolvedOpacity(block))?.name || ''
  const flowBlocks = blocks.filter(block => !block.freePosition)
  const freeBlocks = blocks.filter(block => block.freePosition && !['pageBreak', 'spacer'].includes(block.type))
  const title = ascii(document.title || 'Untitled document')
  const pages = []
  const pageLinks = []
  const hasCustomFooter = Object.values(document.footerFields || {}).some(value => String(value || '').trim())
  let commands = []
  let currentLinks = []
  let y = PAGE_HEIGHT - MARGIN

  const startPage = () => {
    commands = [fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, pageColor)]
    currentLinks = []
    y = PAGE_HEIGHT - MARGIN
  }
  const finishPage = () => {
    const pageNumber = pages.length + 1
    if (hasCustomFooter) {
      const availableWidth = PAGE_WIDTH - MARGIN * 2
      const columnWidth = availableWidth / 3
      ;['left', 'center', 'right'].forEach((position, columnIndex) => {
        const value = String(document.footerFields?.[position] || '').replace(/\{page\}/gi, String(pageNumber))
        const lines = value.split(/\r?\n/).map(entry => ascii(entry).slice(0, 45)).filter(Boolean).slice(0, 2)
        lines.forEach((entry, lineIndex) => {
          const x = alignedX(entry, MARGIN + columnIndex * columnWidth, columnWidth, 7, position, false)
          commands.push(text(entry, x, 27 - lineIndex * 10, { size: 7, color: '#506961' }))
        })
      })
    }
    if (document.includeWatermark !== false) commands.push(text(`Created with Flowly PDF Maker  |  Page ${pageNumber}`, MARGIN, hasCustomFooter ? 7 : 22, { size: 7, color: '#71847d' }))
    pages.push(commands.join('\n'))
    pageLinks.push(currentLinks)
  }
  const nextPage = () => { finishPage(); startPage() }
  const ensure = height => { if (y - height < (hasCustomFooter ? 72 : 48)) nextPage() }
  const addLink = (target, block, x, bottom, width, height) => {
    const uri = safeLink(block.link)
    if (uri) target.push({ x1: x, y1: bottom, x2: x + width, y2: bottom + height, uri })
  }

  startPage()

  const layoutItems = []
  for (let index = 0; index < flowBlocks.length;) {
    const block = flowBlocks[index]
    const width = clamp(block.blockWidth ?? 100, 10, 100)
    const canShare = block.type !== 'pageBreak' && block.type !== 'divider' && (block.position || 'left') === 'left' && width < 100
    if (!canShare) { layoutItems.push(block); index += 1; continue }
    const row = [block]
    let used = width
    let cursor = index + 1
    while (cursor < flowBlocks.length) {
      const candidate = flowBlocks[cursor]
      const candidateWidth = clamp(candidate.blockWidth ?? 100, 10, 100)
      const candidateCanShare = candidate.type !== 'pageBreak' && candidate.type !== 'divider' && (candidate.position || 'left') === 'left' && candidateWidth < 100
      if (candidate.newRow || !candidateCanShare || used + candidateWidth > 100) break
      row.push(candidate)
      used += candidateWidth
      cursor += 1
    }
    if (row.length > 1) layoutItems.push({ type: 'inlineRow', blocks: row })
    else layoutItems.push(block)
    index = cursor
  }

  const renderInlineRow = rowBlocks => {
    const availableWidth = PAGE_WIDTH - MARGIN * 2
    const descriptions = []
    let used = 0
    rowBlocks.forEach(block => {
      const percent = clamp(block.blockWidth ?? 100, 10, 100)
      const width = availableWidth * percent / 100
      const x = MARGIN + availableWidth * used / 100
      used += percent
      if (block.type === 'text') {
        const size = clamp(block.fontSize, 8, 32)
        const leading = size * 1.42
        const lines = wrap(block.content, width - 20, size, block.bold)
        descriptions.push({ block, x, width, height: Math.max(44, lines.length * leading + 24), size, leading, lines })
      } else if (block.type === 'list') {
        descriptions.push({ block, x, width, ...describeList(block, width) })
      } else if (block.type === 'table') {
        const rows = Array.isArray(block.rows) ? block.rows : []
        descriptions.push({ block, x, width, height: (block.caption ? 22 : 0) + 30 + rows.length * 30 + 12, rows })
      } else if (block.type === 'shape') descriptions.push({ block, x, width, height: clamp(block.blockHeight || block.height, 32, 420) + 12 })
      else if (block.type === 'image') descriptions.push({ block, x, width, height: clamp(block.blockHeight || block.height, 54, 420) })
      else if (block.type === 'spacer') descriptions.push({ block, x, width, height: clamp(block.height, 12, 220) })
      else descriptions.push({ block, x, width, height: 24 })
    })
    const rowHeight = Math.max(...descriptions.map(item => item.height))
    ensure(rowHeight + 10)
    const top = y
    descriptions.forEach(item => {
      const { block, x, width } = item
      if (block.type === 'text') {
        if (block.background && block.background !== 'transparent') commands.push(fillBlockBackground(block, x + 4, top - item.height, width - 8, item.height, block.background))
        item.lines.forEach((entry, lineIndex) => {
          const tx = alignedX(entry, x + 10, width - 20, item.size, block.align, block.bold)
          commands.push(text(entry, tx, top - 18 - lineIndex * item.leading, { size: item.size, bold: block.bold, color: block.color, fontFamily: block.fontFamily }))
        })
        addLink(currentLinks, block, x, top - item.height, width, item.height)
      } else if (block.type === 'list') {
        drawList(commands, block, x, width, top, item)
      } else if (block.type === 'table') {
        const headers = (block.headers || []).map(entry => ascii(entry || 'Column'))
        const columns = Math.max(1, headers.length)
        const innerX = x + 4
        const innerWidth = width - 8
        const cellWidth = innerWidth / columns
        let localY = top
        if (block.caption) { commands.push(text(block.caption, innerX, localY - 12, { size: 9, bold: true, color: block.textColor || '#173b32' })); localY -= 22 }
        commands.push(fillRect(innerX, localY - 30, innerWidth, 30, block.headerColor || '#173b32'))
        headers.forEach((entry, column) => commands.push(text(entry.slice(0, Math.max(5, Math.floor(cellWidth / 5.2))), innerX + column * cellWidth + 6, localY - 19, { size: 7, bold: true, color: block.headerTextColor || '#ffffff' })))
        localY -= 30
        item.rows.forEach(row => {
          commands.push(fillRect(innerX, localY - 30, innerWidth, 30, block.rowColor || '#ffffff'))
          commands.push(strokeRect(innerX, localY - 30, innerWidth, 30, block.gridColor || '#d9e2dc', .7))
          for (let column = 1; column < columns; column += 1) commands.push(line(innerX + column * cellWidth, localY, innerX + column * cellWidth, localY - 30, block.gridColor || '#d9e2dc', .7))
          headers.forEach((_, column) => commands.push(text(ascii(row?.[column] ?? '').slice(0, Math.max(5, Math.floor(cellWidth / 5.2))), innerX + column * cellWidth + 6, localY - 19, { size: 7, color: block.textColor || '#173b32' })))
          localY -= 30
        })
      } else if (block.type === 'shape') {
        const height = clamp(block.blockHeight || block.height, 32, 420)
        const shapeWidth = Math.max(12, width - 8)
        const renderedWidth = block.shape === 'circle' ? Math.min(shapeWidth, height) : shapeWidth
        const shapeX = block.align === 'center' ? x + (width - renderedWidth) / 2 : block.align === 'right' ? x + width - renderedWidth - 4 : x + 4
        commands.push(drawShape(block.shape, shapeX, top, renderedWidth, height, block.color, opacityName(block), block.strokeColor, block.strokeWidth, block.rotation, block.flipX, block.flipY))
      } else if (block.type === 'image') {
        commands.push(drawImage(imageByData.get(block.imageData), x + 4, top, width - 8, item.height, block.fit, opacityName(block)))
        addLink(currentLinks, block, x + 4, top - item.height, width - 8, item.height)
      } else if (block.type !== 'spacer') commands.push(line(x + 4, top - 10, x + width - 4, top - 10, block.color || '#173b32', clamp(block.thickness, 1, 8)))
    })
    y -= rowHeight + 10
  }

  layoutItems.forEach(block => {
    if (block.type === 'inlineRow') {
      renderInlineRow(block.blocks)
      return
    }

    if (block.type === 'pageBreak') {
      const requestedPageIndex = Number(block.pageIndex)
      if (Number.isFinite(requestedPageIndex) && requestedPageIndex >= 1) {
        const targetPageIndex = Math.round(requestedPageIndex)
        while (pages.length < targetPageIndex) nextPage()
        if (pages.length > targetPageIndex) nextPage()
      } else nextPage()
      return
    }

    if (block.type === 'spacer') {
      const height = clamp(block.height, 12, 220)
      ensure(height)
      y -= height
      return
    }

    if (block.type === 'text') {
      const layout = blockLayout(block)
      const size = clamp(block.fontSize, 8, 32)
      const leading = size * 1.42
      const lines = wrap(block.content, layout.width - 24, size, block.bold)
      const height = Math.max(44, lines.length * leading + 24)
      ensure(height + 10)
      if (block.background && block.background !== 'transparent') commands.push(fillBlockBackground(block, layout.x, y - height, layout.width, height, block.background))
      lines.forEach((entry, index) => {
        const tx = alignedX(entry, layout.x + 12, layout.width - 24, size, block.align, block.bold)
        commands.push(text(entry, tx, y - 18 - index * leading, { size, bold: block.bold, color: block.color, fontFamily: block.fontFamily }))
      })
      addLink(currentLinks, block, layout.x, y - height, layout.width, height)
      y -= height + 10
      return
    }

    if (block.type === 'list') {
      const layout = blockLayout(block)
      const description = describeList(block, layout.width)
      ensure(description.height + 10)
      drawList(commands, block, layout.x, layout.width, y, description)
      y -= description.height + 10
      return
    }

    if (block.type === 'table') {
      const layout = blockLayout(block)
      const headers = (block.headers || []).map(item => ascii(item || 'Column'))
      const columns = Math.max(1, headers.length)
      const rows = Array.isArray(block.rows) ? block.rows : []
      const width = layout.width
      const cellWidth = width / columns
      const rowHeight = 30
      const drawHeader = () => {
        commands.push(fillRect(layout.x, y - rowHeight, width, rowHeight, block.headerColor || '#173b32'))
        headers.forEach((entry, index) => commands.push(text(entry, layout.x + index * cellWidth + 8, y - 19, { size: 8, bold: true, color: block.headerTextColor || '#ffffff' })))
        y -= rowHeight
      }
      ensure(rowHeight * 2 + 24)
      if (block.caption) { commands.push(text(block.caption, layout.x, y - 12, { size: 10, bold: true, color: block.textColor || '#173b32' })); y -= 22 }
      drawHeader()
      rows.forEach(row => {
        if (y - rowHeight < 48) { nextPage(); drawHeader() }
        commands.push(fillRect(layout.x, y - rowHeight, width, rowHeight, block.rowColor || '#ffffff'))
        commands.push(strokeRect(layout.x, y - rowHeight, width, rowHeight, block.gridColor || '#d9e2dc', .7))
        for (let index = 1; index < columns; index += 1) commands.push(line(layout.x + index * cellWidth, y, layout.x + index * cellWidth, y - rowHeight, block.gridColor || '#d9e2dc', .7))
        headers.forEach((_, index) => {
          const value = ascii(row?.[index] ?? '').slice(0, Math.max(8, Math.floor(cellWidth / 5.2)))
          const tx = alignedX(value, layout.x + index * cellWidth + 7, cellWidth - 14, 8, block.align, false)
          commands.push(text(value, tx, y - 19, { size: 8, color: block.textColor || '#173b32' }))
        })
        y -= rowHeight
      })
      y -= 12
      return
    }

    if (block.type === 'shape') {
      const layout = blockLayout(block)
      const height = clamp(block.blockHeight || block.height, 32, 420)
      ensure(height + 12)
      const width = layout.width
      const renderedWidth = block.shape === 'circle' ? Math.min(width, height) : width
      const x = block.align === 'center' ? layout.x + (layout.width - renderedWidth) / 2 : block.align === 'right' ? layout.x + layout.width - renderedWidth : layout.x
      commands.push(drawShape(block.shape, x, y, renderedWidth, height, block.color, opacityName(block), block.strokeColor, block.strokeWidth, block.rotation, block.flipX, block.flipY))
      y -= height + 12
      return
    }

    if (block.type === 'image') {
      const layout = blockLayout(block)
      const height = clamp(block.blockHeight || block.height, 54, 420)
      ensure(height + 12)
      commands.push(drawImage(imageByData.get(block.imageData), layout.x, y, layout.width, height, block.fit, opacityName(block)))
      addLink(currentLinks, block, layout.x, y - height, layout.width, height)
      y -= height + 12
      return
    }

    if (block.type === 'divider') {
      const layout = blockLayout(block)
      if (block.orientation === 'vertical') {
        const height = clamp(block.height, 32, 400)
        ensure(height + 12)
        const x = verticalDividerX(block, layout.x, layout.width)
        commands.push(verticalDividerLine(x, y, y - height, block.color || '#173b32', block.thickness, block.lineStyle))
        y -= height + 12
      } else {
        ensure(24)
        commands.push(dividerLine(layout.x, y - 10, layout.x + layout.width, block.color || '#173b32', block.thickness, block.lineStyle))
        y -= 24
      }
    }
  })

  finishPage()

  const requiredPageCount = freeBlocks.reduce((count, block) => Math.max(count, Math.max(0, Math.round(Number(block.freePosition?.pageIndex) || 0)) + 1), pages.length)
  while (pages.length < requiredPageCount) {
    startPage()
    finishPage()
  }

  const renderFreeBlock = (block, linkTarget) => {
    const position = block.freePosition || {}
    const availableWidth = PAGE_WIDTH - MARGIN * 2
    const widthPercent = clamp(block.blockWidth ?? 100, 10, 100)
    const width = availableWidth * (widthPercent / 100)
    const x = MARGIN + availableWidth * (clamp(position.x, 0, Math.max(0, 100 - widthPercent)) / 100)
    const top = PAGE_HEIGHT - MARGIN - (PAGE_HEIGHT - MARGIN * 2) * (clamp(position.y, 0, 100) / 100)
    const freeCommands = []
    if (block.type === 'text') {
      const size = clamp(block.fontSize, 8, 32)
      const imported = Boolean(block.importedPdfText)
      const horizontalInset = imported ? 0 : 10
      const verticalInset = imported ? 0 : 18
      const leading = size * (imported ? clamp(block.lineHeight || 1.08, 1, 1.6) : 1.42)
      const lines = wrap(block.content, Math.max(1, width - horizontalInset * 2), size, block.bold)
      const height = imported ? Math.max(size, lines.length * leading) : Math.max(44, lines.length * leading + 24)
      if (block.background && block.background !== 'transparent') freeCommands.push(fillBlockBackground(block, x, top - height, width, height, block.background))
      lines.forEach((entry, index) => freeCommands.push(text(entry, alignedX(entry, x + horizontalInset, width - horizontalInset * 2, size, block.align, block.bold), top - verticalInset - size * (imported ? .82 : 0) - index * leading, { size, bold: block.bold, color: block.color, fontFamily: block.fontFamily })))
      addLink(linkTarget, block, x, top - height, width, height)
    } else if (block.type === 'list') {
      drawList(freeCommands, block, x, width, top)
    } else if (block.type === 'shape') {
      const height = clamp(block.blockHeight || block.height, 32, 420)
      const shapeWidth = width
      const renderedWidth = block.shape === 'circle' ? Math.min(shapeWidth, height) : shapeWidth
      const shapeX = block.align === 'center' ? x + (width - renderedWidth) / 2 : block.align === 'right' ? x + width - renderedWidth : x
      freeCommands.push(drawShape(block.shape, shapeX, top, renderedWidth, height, block.color, opacityName(block), block.strokeColor, block.strokeWidth, block.rotation, block.flipX, block.flipY))
    } else if (block.type === 'image') {
      const background = block.importedPdfPage
      const footerReserve = background && document.includeWatermark !== false ? (hasCustomFooter ? 42 : 28) : 0
      const imageX = background ? 0 : x
      const imageTop = background ? PAGE_HEIGHT : top
      const imageWidth = background ? PAGE_WIDTH : width
      const height = background ? PAGE_HEIGHT - footerReserve : clamp(block.blockHeight || block.height, 54, 420)
      freeCommands.push(drawImage(imageByData.get(block.imageData), imageX, imageTop, imageWidth, height, background ? (footerReserve ? 'contain' : 'cover') : block.fit, opacityName(block)))
      addLink(linkTarget, block, imageX, imageTop - height, imageWidth, height)
    } else if (block.type === 'divider') {
      if (block.orientation === 'vertical') {
        const height = clamp(block.blockHeight || block.height, 32, 400)
        const lineX = verticalDividerX(block, x, width)
        freeCommands.push(verticalDividerLine(lineX, top, top - height, block.color || '#173b32', block.thickness, block.lineStyle))
      } else freeCommands.push(dividerLine(x, top - 10, x + width, block.color || '#173b32', block.thickness, block.lineStyle))
    } else if (block.type === 'table') {
      const headers = (block.headers || []).map(item => ascii(item || 'Column'))
      const columns = Math.max(1, headers.length)
      const rows = Array.isArray(block.rows) ? block.rows : []
      const cellWidth = width / columns
      const rowHeight = 30
      let localY = top
      if (block.caption) { freeCommands.push(text(block.caption, x, localY - 12, { size: 10, bold: true, color: block.textColor || '#173b32' })); localY -= 22 }
      freeCommands.push(fillRect(x, localY - rowHeight, width, rowHeight, block.headerColor || '#173b32'))
      headers.forEach((entry, index) => freeCommands.push(text(entry.slice(0, Math.max(5, Math.floor(cellWidth / 5.2))), x + index * cellWidth + 7, localY - 19, { size: 8, bold: true, color: block.headerTextColor || '#ffffff' })))
      localY -= rowHeight
      rows.forEach(row => {
        freeCommands.push(fillRect(x, localY - rowHeight, width, rowHeight, block.rowColor || '#ffffff'))
        freeCommands.push(strokeRect(x, localY - rowHeight, width, rowHeight, block.gridColor || '#d9e2dc', .7))
        for (let index = 1; index < columns; index += 1) freeCommands.push(line(x + index * cellWidth, localY, x + index * cellWidth, localY - rowHeight, block.gridColor || '#d9e2dc', .7))
        headers.forEach((_, index) => freeCommands.push(text(ascii(row?.[index] ?? '').slice(0, Math.max(5, Math.floor(cellWidth / 5.2))), x + index * cellWidth + 7, localY - 19, { size: 8, color: block.textColor || '#173b32' })))
        localY -= rowHeight
      })
    }
    return freeCommands.join('\n')
  }

  freeBlocks.forEach(block => {
    const pageIndex = Math.max(0, Math.min(pages.length - 1, Math.round(Number(block.freePosition?.pageIndex) || 0)))
    const rendered = renderFreeBlock(block, pageLinks[pageIndex])
    if (block.importedPdfPage) {
      const baseEnd = pages[pageIndex].indexOf('\n')
      pages[pageIndex] = baseEnd >= 0
        ? `${pages[pageIndex].slice(0, baseEnd + 1)}${rendered}\n${pages[pageIndex].slice(baseEnd + 1)}`
        : `${pages[pageIndex]}\n${rendered}`
    }
    else pages[pageIndex] += `\n${rendered}`
  })

  const objects = []
  const pageIds = pages.map((_, index) => 9 + index * 2)
  let nextObjectId = 9 + pages.length * 2
  const annotationIds = pageLinks.map(links => links.map(linkItem => {
    const id = nextObjectId++
    objects[id] = `<< /Type /Annot /Subtype /Link /Rect [${linkItem.x1.toFixed(2)} ${linkItem.y1.toFixed(2)} ${linkItem.x2.toFixed(2)} ${linkItem.y2.toFixed(2)}] /Border [0 0 0] /A << /S /URI /URI (${escapePdf(linkItem.uri)}) >> >>`
    return id
  }))
  imageResources.forEach(resource => {
    resource.id = nextObjectId++
    objects[resource.id] = `<< /Type /XObject /Subtype /Image /Width ${resource.width} /Height ${resource.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${resource.binary.length} >>\nstream\n${resource.binary}\nendstream`
  })
  opacityResources.forEach(resource => {
    resource.id = nextObjectId++
    objects[resource.id] = `<< /Type /ExtGState /ca ${(resource.value / 100).toFixed(3)} /CA ${(resource.value / 100).toFixed(3)} >>`
  })
  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>'
  objects[2] = `<< /Type /Pages /Kids [${pageIds.map(id => `${id} 0 R`).join(' ')}] /Count ${pages.length} >>`
  objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'
  objects[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>'
  objects[5] = '<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman >>'
  objects[6] = '<< /Type /Font /Subtype /Type1 /BaseFont /Times-Bold >>'
  objects[7] = '<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>'
  objects[8] = '<< /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold >>'
  pages.forEach((content, index) => {
    const pageId = 9 + index * 2
    const contentId = pageId + 1
    const annots = annotationIds[index]?.length ? ` /Annots [${annotationIds[index].map(id => `${id} 0 R`).join(' ')}]` : ''
    const xObjects = imageResources.length ? ` /XObject << ${imageResources.map(resource => `/${resource.name} ${resource.id} 0 R`).join(' ')} >>` : ''
    const extStates = opacityResources.size ? ` /ExtGState << ${[...opacityResources.values()].map(resource => `/${resource.name} ${resource.id} 0 R`).join(' ')} >>` : ''
    objects[pageId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R /F4 6 0 R /F5 7 0 R /F6 8 0 R >>${xObjects}${extStates} >> /Contents ${contentId} 0 R${annots} >>`
    objects[contentId] = `<< /Length ${content.length} >>\nstream\n${content}\nendstream`
  })
  let pdf = '%PDF-1.4\n%1234\n'
  const offsets = [0]
  for (let id = 1; id < objects.length; id += 1) { offsets[id] = pdf.length; pdf += `${id} 0 obj\n${objects[id]}\nendobj\n` }
  const xref = pdf.length
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`
  for (let id = 1; id < objects.length; id += 1) pdf += `${String(offsets[id]).padStart(10, '0')} 00000 n \n`
  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`
  return pdf
}

export function downloadCustomPdf(document) {
  const binary = buildCustomPdf(document)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index) & 0xff
  const blob = new Blob([bytes], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const link = documentRef => {
    const anchor = documentRef.createElement('a')
    anchor.href = url
    anchor.download = `${ascii(document.title).replace(/\.pdf$/i, '').toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'flowly-document'}.pdf`
    documentRef.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
  }
  link(window.document)
  window.setTimeout(() => URL.revokeObjectURL(url), 1200)
}
