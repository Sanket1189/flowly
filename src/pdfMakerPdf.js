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

const rgb = value => {
  const hex = String(value || '#173b32').replace('#', '').padEnd(6, '0').slice(0, 6)
  const parts = [0, 2, 4].map(index => parseInt(hex.slice(index, index + 2), 16) / 255)
  return parts.map(item => (Number.isFinite(item) ? item : 0).toFixed(3)).join(' ')
}

const fillRect = (x, y, width, height, color) => `${rgb(color)} rg ${x} ${y} ${width} ${height} re f`
const strokeRect = (x, y, width, height, color, lineWidth = 1) => `${rgb(color)} RG ${lineWidth} w ${x} ${y} ${width} ${height} re S`
const line = (x1, y1, x2, y2, color, lineWidth = 1) => `${rgb(color)} RG ${lineWidth} w ${x1} ${y1} m ${x2} ${y2} l S`
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

const shapePoints = {
  triangle: [[.5, 0], [1, 1], [0, 1]],
  diamond: [[.5, 0], [1, .5], [.5, 1], [0, .5]],
  pentagon: [[.5, 0], [1, .38], [.82, 1], [.18, 1], [0, .38]],
  hexagon: [[.25, 0], [.75, 0], [1, .5], [.75, 1], [.25, 1], [0, .5]],
  star: [[.5, 0], [.61, .35], [.98, .35], [.68, .57], [.79, 1], [.5, .73], [.21, 1], [.32, .57], [.02, .35], [.39, .35]],
  arrow: [[0, .3], [.65, .3], [.65, 0], [1, .5], [.65, 1], [.65, .7], [0, .7]],
  chevron: [[0, 0], [.6, 0], [1, .5], [.6, 1], [0, 1], [.4, .5]],
  parallelogram: [[.2, 0], [1, 0], [.8, 1], [0, 1]],
}

const drawShape = (shape, x, top, width, height, color) => {
  if (shape === 'circle') {
    const diameter = Math.min(width, height)
    return circle(x + diameter / 2, top - diameter / 2, diameter / 2, color)
  }
  if (shape === 'ellipse') return ellipse(x + width / 2, top - height / 2, width / 2, height / 2, color)
  if (shape === 'rounded') return roundedRect(x, top - height, width, height, Math.min(18, height * .3), color)
  if (shapePoints[shape]) return polygon(shapePoints[shape], x, top, width, height, color)
  return fillRect(x, top - height, width, height, color)
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
  const flowBlocks = blocks.filter(block => !block.freePosition)
  const freeBlocks = blocks.filter(block => block.freePosition && !['pageBreak', 'spacer'].includes(block.type))
  const title = ascii(document.title || 'Untitled document')
  const pages = []
  const pageLinks = []
  let commands = []
  let currentLinks = []
  let y = PAGE_HEIGHT - MARGIN

  const startPage = () => {
    commands = [fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, pageColor)]
    currentLinks = []
    y = PAGE_HEIGHT - MARGIN
  }
  const finishPage = () => {
    if (document.includeWatermark !== false) commands.push(text(`Created with Flowly PDF Maker  |  Page ${pages.length + 1}`, MARGIN, 22, { size: 7, color: '#71847d' }))
    pages.push(commands.join('\n'))
    pageLinks.push(currentLinks)
  }
  const nextPage = () => { finishPage(); startPage() }
  const ensure = height => { if (y - height < 48) nextPage() }
  const addLink = (target, block, x, bottom, width, height) => {
    const uri = safeLink(block.link)
    if (uri) target.push({ x1: x, y1: bottom, x2: x + width, y2: bottom + height, uri })
  }

  startPage()

  const layoutItems = []
  for (let index = 0; index < flowBlocks.length;) {
    const block = flowBlocks[index]
    const width = clamp(block.blockWidth ?? 100, 10, 100)
    const canShare = block.type !== 'pageBreak' && (block.position || 'left') === 'left' && width < 100
    if (!canShare) { layoutItems.push(block); index += 1; continue }
    const row = [block]
    let used = width
    let cursor = index + 1
    while (cursor < flowBlocks.length) {
      const candidate = flowBlocks[cursor]
      const candidateWidth = clamp(candidate.blockWidth ?? 100, 10, 100)
      const candidateCanShare = candidate.type !== 'pageBreak' && (candidate.position || 'left') === 'left' && candidateWidth < 100
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
      } else if (block.type === 'shape') descriptions.push({ block, x, width, height: clamp(block.height, 32, 180) + 12 })
      else if (block.type === 'spacer') descriptions.push({ block, x, width, height: clamp(block.height, 12, 220) })
      else descriptions.push({ block, x, width, height: 24 })
    })
    const rowHeight = Math.max(...descriptions.map(item => item.height))
    ensure(rowHeight + 10)
    const top = y
    descriptions.forEach(item => {
      const { block, x, width } = item
      if (block.type === 'text') {
        if (block.background && block.background !== 'transparent') commands.push(fillRect(x + 4, top - item.height, width - 8, item.height, block.background))
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
        const height = clamp(block.height, 32, 180)
        const shapeWidth = Math.min(clamp(block.width, 60, PAGE_WIDTH - MARGIN * 2), width - 8)
        const renderedWidth = block.shape === 'circle' ? Math.min(shapeWidth, height) : shapeWidth
        const shapeX = block.align === 'center' ? x + (width - renderedWidth) / 2 : block.align === 'right' ? x + width - renderedWidth - 4 : x + 4
        commands.push(drawShape(block.shape, shapeX, top, renderedWidth, height, block.color))
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
      nextPage()
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
      if (block.background && block.background !== 'transparent') commands.push(fillRect(layout.x, y - height, layout.width, height, block.background))
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
      const height = clamp(block.height, 32, 180)
      ensure(height + 12)
      const width = Math.min(clamp(block.width, 60, PAGE_WIDTH - MARGIN * 2), layout.width)
      const renderedWidth = block.shape === 'circle' ? Math.min(width, height) : width
      const x = block.align === 'center' ? layout.x + (layout.width - renderedWidth) / 2 : block.align === 'right' ? layout.x + layout.width - renderedWidth : layout.x
      commands.push(drawShape(block.shape, x, y, renderedWidth, height, block.color))
      y -= height + 12
      return
    }

    if (block.type === 'divider') {
      const layout = blockLayout(block)
      ensure(24)
      commands.push(line(layout.x, y - 10, layout.x + layout.width, y - 10, block.color || '#173b32', clamp(block.thickness, 1, 8)))
      y -= 24
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
    const width = availableWidth * (clamp(block.blockWidth ?? 100, 10, 100) / 100)
    const x = MARGIN + availableWidth * (clamp(position.x, 0, 75) / 100)
    const top = PAGE_HEIGHT - MARGIN - (PAGE_HEIGHT - MARGIN * 2) * (clamp(position.y, 0, 88) / 100)
    const freeCommands = []
    if (block.type === 'text') {
      const size = clamp(block.fontSize, 8, 32)
      const leading = size * 1.42
      const lines = wrap(block.content, width - 20, size, block.bold)
      const height = Math.max(44, lines.length * leading + 24)
      if (block.background && block.background !== 'transparent') freeCommands.push(fillRect(x, top - height, width, height, block.background))
      lines.forEach((entry, index) => freeCommands.push(text(entry, alignedX(entry, x + 10, width - 20, size, block.align, block.bold), top - 18 - index * leading, { size, bold: block.bold, color: block.color, fontFamily: block.fontFamily })))
      addLink(linkTarget, block, x, top - height, width, height)
    } else if (block.type === 'list') {
      drawList(freeCommands, block, x, width, top)
    } else if (block.type === 'shape') {
      const height = clamp(block.height, 32, 180)
      const shapeWidth = Math.min(clamp(block.width, 60, PAGE_WIDTH - MARGIN * 2), width)
      const renderedWidth = block.shape === 'circle' ? Math.min(shapeWidth, height) : shapeWidth
      const shapeX = block.align === 'center' ? x + (width - renderedWidth) / 2 : block.align === 'right' ? x + width - renderedWidth : x
      freeCommands.push(drawShape(block.shape, shapeX, top, renderedWidth, height, block.color))
    } else if (block.type === 'divider') {
      freeCommands.push(line(x, top - 10, x + width, top - 10, block.color || '#173b32', clamp(block.thickness, 1, 8)))
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
    pages[pageIndex] += `\n${renderFreeBlock(block, pageLinks[pageIndex])}`
  })

  const objects = []
  const pageIds = pages.map((_, index) => 9 + index * 2)
  let nextObjectId = 9 + pages.length * 2
  const annotationIds = pageLinks.map(links => links.map(linkItem => {
    const id = nextObjectId++
    objects[id] = `<< /Type /Annot /Subtype /Link /Rect [${linkItem.x1.toFixed(2)} ${linkItem.y1.toFixed(2)} ${linkItem.x2.toFixed(2)} ${linkItem.y2.toFixed(2)}] /Border [0 0 0] /A << /S /URI /URI (${escapePdf(linkItem.uri)}) >> >>`
    return id
  }))
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
    objects[pageId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R /F4 6 0 R /F5 7 0 R /F6 8 0 R >> >> /Contents ${contentId} 0 R${annots} >>`
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
  const blob = new Blob([buildCustomPdf(document)], { type: 'application/pdf' })
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
