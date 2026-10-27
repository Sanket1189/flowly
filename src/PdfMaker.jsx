import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { AlignCenter, AlignLeft, AlignRight, ArrowLeft, Bold, Check, ChevronDown, ChevronLeft, ChevronRight, Copy, Download, FilePenLine, GripVertical, Image as ImageIcon, Layers3, List, Lock, Maximize2, Minus, MoveVertical, Plus, Redo2, RectangleHorizontal, Rows3, Table2, Trash2, Type, Undo2, Unlock, Upload, WandSparkles, ZoomIn, ZoomOut } from 'lucide-react'
import { routeUrl } from './navigation.js'
import { downloadCustomPdf } from './pdfMakerPdf.js'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import './pdf-maker-studio.css'
import './pdf-maker-studio-overrides.css'

const nextId = (() => {
  let value = 0
  return () => `pdf-block-${Date.now().toString(36)}-${(++value).toString(36)}`
})()
const nextGroupId = (() => { let value = 0; return () => `pdf-group-${Date.now().toString(36)}-${(++value).toString(36)}` })()
const starterBlocks = []
const draftDatabaseName = 'flowly-pdf-maker'
const draftStoreName = 'drafts'
const projectStoreName = 'projects'
const draftKey = 'current-document'

function openDraftDatabase() {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(draftDatabaseName, 2)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(draftStoreName)) request.result.createObjectStore(draftStoreName)
      if (!request.result.objectStoreNames.contains(projectStoreName)) request.result.createObjectStore(projectStoreName)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function readSavedDraft() {
  const database = await openDraftDatabase()
  return new Promise((resolve, reject) => {
    const request = database.transaction(draftStoreName, 'readonly').objectStore(draftStoreName).get(draftKey)
    request.onsuccess = () => { database.close(); resolve(request.result || null) }
    request.onerror = () => { database.close(); reject(request.error) }
  })
}

async function writeSavedDraft(value) {
  const database = await openDraftDatabase()
  return new Promise((resolve, reject) => {
    const request = database.transaction(draftStoreName, 'readwrite').objectStore(draftStoreName).put(value, draftKey)
    request.onsuccess = () => { database.close(); resolve() }
    request.onerror = () => { database.close(); reject(request.error) }
  })
}

async function clearSavedDraft() {
  const database = await openDraftDatabase()
  return new Promise((resolve, reject) => {
    const request = database.transaction(draftStoreName, 'readwrite').objectStore(draftStoreName).delete(draftKey)
    request.onsuccess = () => { database.close(); resolve() }
    request.onerror = () => { database.close(); reject(request.error) }
  })
}

async function readSavedProjects() {
  const database = await openDraftDatabase()
  return new Promise((resolve, reject) => {
    const request = database.transaction(projectStoreName, 'readonly').objectStore(projectStoreName).getAll()
    request.onsuccess = () => { database.close(); resolve((request.result || []).sort((a, b) => Number(b.updatedAt || 0) - Number(a.updatedAt || 0))) }
    request.onerror = () => { database.close(); reject(request.error) }
  })
}

async function writeSavedProject(project) {
  const database = await openDraftDatabase()
  return new Promise((resolve, reject) => {
    const request = database.transaction(projectStoreName, 'readwrite').objectStore(projectStoreName).put(project, project.id)
    request.onsuccess = () => { database.close(); resolve(project) }
    request.onerror = () => { database.close(); reject(request.error) }
  })
}

async function deleteSavedProject(id) {
  const database = await openDraftDatabase()
  return new Promise((resolve, reject) => {
    const request = database.transaction(projectStoreName, 'readwrite').objectStore(projectStoreName).delete(id)
    request.onsuccess = () => { database.close(); resolve() }
    request.onerror = () => { database.close(); reject(request.error) }
  })
}

const cloneDocument = documentValue => typeof structuredClone === 'function' ? structuredClone(documentValue) : JSON.parse(JSON.stringify(documentValue))

function withUniqueBlockIds(blocks = []) {
  const seen = new Set()
  return blocks.map(block => {
    let id = block?.id
    const key = String(id ?? '')
    if (!key || seen.has(key)) id = nextId()
    seen.add(String(id))
    return { ...block, id }
  })
}
const tools = [
  { type: 'text', label: 'Text', hint: 'Heading or paragraph', Icon: Type },
  { type: 'list', label: 'List', hint: 'Bullets or numbering', Icon: List },
  { type: 'table', label: 'Table', hint: 'Editable grid', Icon: Table2 },
  { type: 'image', label: 'Image', hint: 'Upload from your device', Icon: ImageIcon },
  { type: 'shape', label: 'Shape', hint: '20 shapes + SVG', Icon: RectangleHorizontal },
  { type: 'divider', label: 'Divider', hint: 'Separate sections', Icon: Minus },
  { type: 'spacer', label: 'Empty space', hint: 'Add vertical breathing room', Icon: MoveVertical },
  { type: 'pageBreak', label: 'New page', hint: 'Start another page', Icon: Rows3 },
]
const alignments = [{ id: 'left', Icon: AlignLeft }, { id: 'center', Icon: AlignCenter }, { id: 'right', Icon: AlignRight }]
const dividerStyles = [
  { id: 'solid', label: 'Solid' },
  { id: 'dashed', label: 'Dashed' },
  { id: 'dotted', label: 'Dotted' },
  { id: 'double', label: 'Double' },
]
const shapeOptions = [
  { id: 'rectangle', label: 'Rectangle' },
  { id: 'rounded', label: 'Rounded' },
  { id: 'circle', label: 'Circle' },
  { id: 'ellipse', label: 'Ellipse' },
  { id: 'triangle', label: 'Triangle' },
  { id: 'diamond', label: 'Diamond' },
  { id: 'pentagon', label: 'Pentagon' },
  { id: 'hexagon', label: 'Hexagon' },
  { id: 'star', label: 'Star' },
  { id: 'arrow', label: 'Arrow' },
  { id: 'chevron', label: 'Chevron' },
  { id: 'parallelogram', label: 'Slant' },
  { id: 'octagon', label: 'Octagon' },
  { id: 'heart', label: 'Heart' },
  { id: 'cloud', label: 'Cloud' },
  { id: 'speech', label: 'Speech bubble' },
  { id: 'badge', label: 'Badge' },
  { id: 'cross', label: 'Cross' },
  { id: 'plus', label: 'Plus' },
  { id: 'lightning', label: 'Lightning' },
]
const fontOptions = [
  { label: 'Inter', value: 'Inter, Arial, sans-serif' },
  { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
  { label: 'Georgia', value: 'Georgia, "Times New Roman", serif' },
  { label: 'Times New Roman', value: '"Times New Roman", Times, serif' },
  { label: 'Courier New', value: '"Courier New", Courier, monospace' },
]
const colorSwatches = ['#173b32', '#1f5a4a', '#59736a', '#c9f06b', '#e8f3df', '#f7f7f2', '#ffffff', '#172033', '#2864dc', '#7557c6', '#e7a934', '#d85d48']

function safeLink(value) {
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

const escapeHtml = value => String(value || '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character])
const plainTextHtml = value => escapeHtml(value).replace(/\n/g, '<br>')

function sanitizeRichHtml(value) {
  const parsed = new DOMParser().parseFromString(`<div>${String(value || '')}</div>`, 'text/html')
  const root = parsed.body.firstElementChild
  const allowed = new Set(['B', 'STRONG', 'I', 'EM', 'U', 'A', 'BR', 'DIV', 'P', 'UL', 'OL', 'LI', 'SPAN', 'FONT'])
  const cleanNode = node => {
    ;[...node.children].forEach(child => {
      if (!allowed.has(child.tagName)) child.replaceWith(...child.childNodes)
      else cleanNode(child)
    })
    if (!(node instanceof Element)) return
    ;[...node.attributes].forEach(attribute => {
      const name = attribute.name.toLowerCase()
      if (name === 'href' && node.tagName === 'A') {
        const href = safeLink(attribute.value)
        if (href) node.setAttribute('href', href)
        else node.removeAttribute(attribute.name)
      } else if (name === 'style') {
        const allowedStyles = [...node.style].filter(property => ['font-weight', 'font-style', 'text-decoration', 'color'].includes(property)).map(property => `${property}:${node.style.getPropertyValue(property)}`).join(';')
        if (allowedStyles) node.setAttribute('style', allowedStyles)
        else node.removeAttribute('style')
      } else if (!(node.tagName === 'FONT' && name === 'color')) node.removeAttribute(attribute.name)
    })
    if (node.tagName === 'A') { node.setAttribute('target', '_blank'); node.setAttribute('rel', 'noreferrer') }
  }
  cleanNode(root)
  return root.innerHTML
}

const footerTextForPage = (value, pageNumber) => String(value || '').replace(/\{page\}/gi, String(pageNumber))

function hexToHsv(hex) {
  const match = /^#?([0-9a-f]{6})$/i.exec(String(hex || ''))
  if (!match) return { h: 150, s: 61, v: 23 }
  const [r, g, b] = [0, 2, 4].map(index => parseInt(match[1].slice(index, index + 2), 16) / 255)
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min
  let h = 0
  if (delta) {
    if (max === r) h = 60 * (((g - b) / delta) % 6)
    else if (max === g) h = 60 * ((b - r) / delta + 2)
    else h = 60 * ((r - g) / delta + 4)
  }
  return { h: Math.round((h + 360) % 360), s: Math.round(max ? delta / max * 100 : 0), v: Math.round(max * 100) }
}

function hsvToHex(h, s, v) {
  const saturation = Math.max(0, Math.min(100, s)) / 100
  const value = Math.max(0, Math.min(100, v)) / 100
  const chroma = value * saturation
  const section = ((h % 360) + 360) % 360 / 60
  const x = chroma * (1 - Math.abs(section % 2 - 1))
  const [r1, g1, b1] = section < 1 ? [chroma, x, 0] : section < 2 ? [x, chroma, 0] : section < 3 ? [0, chroma, x] : section < 4 ? [0, x, chroma] : section < 5 ? [x, 0, chroma] : [chroma, 0, x]
  const offset = value - chroma
  return `#${[r1, g1, b1].map(channel => Math.round((channel + offset) * 255).toString(16).padStart(2, '0')).join('')}`
}

const emptyBoxSides = { top: 0, right: 0, bottom: 0, left: 0 }
const emptyCornerRadii = { topLeft: 0, topRight: 0, bottomRight: 0, bottomLeft: 0 }
const resolvedCornerRadii = block => {
  if (typeof block.borderRadius === 'number') {
    const radius = Math.max(0, Math.min(80, block.borderRadius))
    return { topLeft: radius, topRight: radius, bottomRight: radius, bottomLeft: radius }
  }
  return Object.fromEntries(Object.entries({ ...emptyCornerRadii, ...(block.borderRadius || {}) }).map(([corner, value]) => [corner, Math.max(0, Math.min(80, Number(value) || 0))]))
}
const defaultElementPadding = type => type === 'text'
  ? { top: 13, right: 15, bottom: 13, left: 15 }
  : type === 'list'
    ? { top: 12, right: 17, bottom: 12, left: 17 }
    : type === 'divider'
      ? { top: 12, right: 4, bottom: 12, left: 4 }
      : { top: 4, right: 4, bottom: 4, left: 4 }
const resolvedElementPadding = block => block.boxModelVersion === 1 ? { ...emptyBoxSides, ...(block.padding || {}) } : defaultElementPadding(block.type)

function imageFileToJpeg(file) {
  return new Promise((resolve, reject) => {
    if (!file?.type?.startsWith('image/')) { reject(new Error('Choose a valid image file.')); return }
    if (file.size > 12 * 1024 * 1024) { reject(new Error('Choose an image smaller than 12 MB.')); return }
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('The image could not be read.'))
    reader.onload = () => {
      const image = new window.Image()
      image.onerror = () => reject(new Error('This image format could not be opened.'))
      image.onload = () => {
        const maxDimension = 2200
        const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight))
        const width = Math.max(1, Math.round(image.naturalWidth * scale))
        const height = Math.max(1, Math.round(image.naturalHeight * scale))
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const context = canvas.getContext('2d')
        context.fillStyle = '#ffffff'
        context.fillRect(0, 0, width, height)
        context.drawImage(image, 0, 0, width, height)
        resolve({
          imageData: canvas.toDataURL('image/jpeg', .9),
          imageName: file.name,
          imageWidth: width,
          imageHeight: height,
        })
      }
      image.src = String(reader.result || '')
    }
    reader.readAsDataURL(file)
  })
}

async function loadCustomFontFile(file) {
  const extension = file?.name?.split('.').pop()?.toLowerCase()
  if (!['ttf', 'otf', 'woff', 'woff2'].includes(extension)) throw new Error('Choose a TTF, OTF, WOFF, or WOFF2 font file.')
  if (file.size > 10 * 1024 * 1024) throw new Error('Choose a font smaller than 10 MB.')
  const label = file.name.replace(/\.[^.]+$/, '').trim() || 'Custom font'
  const family = `FlowlyCustom-${label.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '')}-${Date.now().toString(36)}`
  const buffer = await file.arrayBuffer()
  const face = new FontFace(family, buffer)
  await face.load()
  document.fonts.add(face)
  const source = await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('The font could not be saved with this project.'))
    reader.readAsDataURL(new Blob([buffer], { type: file.type || 'font/ttf' }))
  })
  return { label, family, value: `"${family}", sans-serif`, source, custom: true }
}

function restoreCustomFonts(fonts) {
  const valid = (Array.isArray(fonts) ? fonts : []).filter(font => font?.family && font?.value && font?.source)
  valid.forEach(font => {
    const face = new FontFace(font.family, `url(${font.source})`)
    face.load().then(loaded => document.fonts.add(loaded)).catch(() => {})
  })
  return valid
}

async function loadSvgShapeFile(file) {
  if (!file || !/\.svg$/i.test(file.name) || !/svg/i.test(file.type || 'image/svg+xml')) throw new Error('Choose an SVG file.')
  if (file.size > 2 * 1024 * 1024) throw new Error('Choose an SVG smaller than 2 MB.')
  const source = await file.text()
  const parsed = new DOMParser().parseFromString(source, 'image/svg+xml')
  const svg = parsed.documentElement
  if (!svg || svg.tagName.toLowerCase() !== 'svg' || parsed.querySelector('parsererror')) throw new Error('This SVG could not be read.')
  parsed.querySelectorAll('script,style,foreignObject,iframe,object,embed,animate,animateMotion,animateTransform,set').forEach(node => node.remove())
  parsed.querySelectorAll('*').forEach(node => {
    ;[...node.attributes].forEach(attribute => {
      const name = attribute.name.toLowerCase()
      const value = attribute.value.trim()
      if (name.startsWith('on') || ((name === 'href' || name.endsWith(':href')) && !value.startsWith('#'))) node.removeAttribute(attribute.name)
    })
    node.removeAttribute('style')
    if (node !== svg && node.getAttribute('fill') !== 'none') node.setAttribute('fill', 'currentColor')
    if (node.getAttribute('stroke') && node.getAttribute('stroke') !== 'none') node.setAttribute('stroke', 'var(--flowly-shape-stroke)')
  })
  if (!svg.getAttribute('viewBox')) {
    const width = Number.parseFloat(svg.getAttribute('width')) || 100
    const height = Number.parseFloat(svg.getAttribute('height')) || 100
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`)
  }
  svg.setAttribute('width', '100%')
  svg.setAttribute('height', '100%')
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet')
  return { svgMarkup: new XMLSerializer().serializeToString(svg), svgName: file.name.replace(/\.svg$/i, '') || 'Custom SVG' }
}

async function renderPdfPages(file, onProgress) {
  if (!file || (!/\.pdf$/i.test(file.name) && file.type !== 'application/pdf')) throw new Error('Choose a PDF file.')
  if (file.size > 100 * 1024 * 1024) throw new Error('Choose a PDF smaller than 100 MB.')
  onProgress?.('Loading PDF tools…')
  const { GlobalWorkerOptions, Util, getDocument } = await import('pdfjs-dist')
  GlobalWorkerOptions.workerSrc = pdfWorkerUrl
  const task = getDocument({ data: await file.arrayBuffer() })
  let pdf
  try {
    pdf = await task.promise
    const pages = []
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      onProgress?.(`Importing page ${pageNumber} of ${pdf.numPages}…`)
      const page = await pdf.getPage(pageNumber)
      const original = page.getViewport({ scale: 1 })
      const scale = Math.min(2, 1800 / Math.max(1, original.width))
      const viewport = page.getViewport({ scale })
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.ceil(viewport.width))
      canvas.height = Math.max(1, Math.ceil(viewport.height))
      const context = canvas.getContext('2d', { alpha: false })
      context.fillStyle = '#ffffff'
      context.fillRect(0, 0, canvas.width, canvas.height)
      await page.render({ canvasContext: context, canvas, viewport }).promise
      const textContent = await page.getTextContent()
      const rawText = textContent.items.map(item => {
        const value = String(item.str || '').trim()
        if (!value) return null
        const transform = Util.transform(viewport.transform, item.transform)
        const angle = Math.atan2(transform[1], transform[0])
        if (Math.abs(angle) > .08) return null
        const fontHeight = Math.max(1, Math.hypot(transform[2], transform[3]))
        const width = Math.max(1, Math.abs(Number(item.width) || 0) * scale)
        return {
          value,
          left: transform[4],
          top: transform[5] - fontHeight,
          width,
          height: fontHeight,
          fontFamily: textContent.styles?.[item.fontName]?.fontFamily || 'Arial, Helvetica, sans-serif',
          bold: /bold|black|heavy/i.test(`${item.fontName || ''} ${textContent.styles?.[item.fontName]?.fontFamily || ''}`),
          breakAfter: Boolean(item.hasEOL),
        }
      }).filter(Boolean)
      rawText.forEach(item => {
        const left = Math.max(0, Math.floor(item.left - 2))
        const top = Math.max(0, Math.floor(item.top - 2))
        const right = Math.min(canvas.width, Math.ceil(item.left + item.width + 2))
        const bottom = Math.min(canvas.height, Math.ceil(item.top + item.height + 3))
        const samplePoints = [[left - 2, (top + bottom) / 2], [right + 2, (top + bottom) / 2], [(left + right) / 2, top - 2], [(left + right) / 2, bottom + 2]]
          .map(([x, y]) => [Math.max(0, Math.min(canvas.width - 1, Math.round(x))), Math.max(0, Math.min(canvas.height - 1, Math.round(y)))])
        const colors = samplePoints.map(([x, y]) => [...context.getImageData(x, y, 1, 1).data])
        const average = channel => Math.round(colors.reduce((total, color) => total + color[channel], 0) / Math.max(1, colors.length))
        context.fillStyle = `rgb(${average(0)},${average(1)},${average(2)})`
        context.fillRect(left, top, Math.max(1, right - left), Math.max(1, bottom - top))
      })
      const mergedText = []
      rawText.sort((a, b) => a.top - b.top || a.left - b.left).forEach(item => {
        const previous = mergedText.at(-1)
        const previousRight = previous ? previous.left + previous.width : 0
        const sameLine = previous && !previous.breakAfter && Math.abs(previous.top - item.top) <= Math.max(2, item.height * .38) && Math.abs(previous.height - item.height) <= Math.max(2, item.height * .32)
        const closeEnough = sameLine && item.left - previousRight <= item.height * 1.8 && item.left >= previous.left
        if (!closeEnough) {
          mergedText.push({ ...item })
          return
        }
        const needsSpace = !/[\s(/-]$/.test(previous.value) && !/^[,.;:!?)}\]]/.test(item.value)
        previous.value += `${needsSpace ? ' ' : ''}${item.value}`
        previous.width = Math.max(previous.width, item.left + item.width - previous.left)
        previous.height = Math.max(previous.height, item.height)
        previous.breakAfter = item.breakAfter
        previous.bold = previous.bold || item.bold
      })
      pages.push({ imageData: canvas.toDataURL('image/jpeg', .9), imageWidth: canvas.width, imageHeight: canvas.height, textItems: mergedText })
      page.cleanup()
    }
    return pages
  } catch (error) {
    if (error?.name === 'PasswordException') throw new Error('Password-protected PDFs must be unlocked before importing.')
    throw error
  } finally {
    await pdf?.destroy?.()
  }
}

function autoFormatImportedBlocks(blocks) {
  const imported = blocks.filter(block => block.importedPdfText)
  if (!imported.length) return blocks
  const sizes = imported.map(block => Number(block.fontSize) || 12).sort((a, b) => a - b)
  const median = sizes[Math.floor(sizes.length / 2)] || 12
  const upper = sizes[Math.max(0, Math.floor(sizes.length * .82) - 1)] || median
  const pageGroups = new Map()
  imported.forEach(block => {
    const pageIndex = Number(block.freePosition?.pageIndex) || 0
    if (!pageGroups.has(pageIndex)) pageGroups.set(pageIndex, [])
    pageGroups.get(pageIndex).push(block)
  })
  const formatted = []
  pageGroups.forEach(lines => {
    const prepared = lines.map(block => {
      const fontSize = Number(block.fontSize) || median
      const heading = fontSize >= Math.max(median * 1.28, upper * .96) && String(block.content || '').length < 180
      const width = Math.max(10, Number(block.blockWidth) || 10)
      const x = Math.max(0, Number(block.freePosition?.x) || 0)
      const visuallyCentered = Math.abs(x + width / 2 - 50) <= 7
      return {
        ...block,
        bold: heading || block.bold,
        align: heading && visuallyCentered ? 'center' : block.align || 'left',
        lineHeight: heading ? 1.12 : 1.32,
        letterSpacing: heading ? Math.max(.15, Number(block.letterSpacing) || 0) : Number(block.letterSpacing) || 0,
        autoFormatted: true,
      }
    }).sort((a, b) => Number(a.freePosition?.y || 0) - Number(b.freePosition?.y || 0) || Number(a.freePosition?.x || 0) - Number(b.freePosition?.x || 0))
    const paragraphs = []
    prepared.forEach(block => {
      const previous = paragraphs.at(-1)
      const x = Number(block.freePosition?.x) || 0
      const y = Number(block.freePosition?.y) || 0
      const size = Number(block.fontSize) || median
      const lineStep = Math.max(1.15, size * 1.32 / 758 * 100)
      const previousY = Number(previous?.freePosition?.y) || 0
      const previousLines = String(previous?.content || '').split('\n').length
      const previousStep = previous ? Math.max(1.15, (Number(previous.fontSize) || median) * (Number(previous.lineHeight) || 1.32) / 758 * 100) : 0
      const closeVertically = previous && y > previousY && y - previousY <= previousStep * (previousLines + .8)
      const sameColumn = previous && Math.abs(x - (Number(previous.freePosition?.x) || 0)) <= 2.4
      const sameStyle = previous && Math.abs(size - (Number(previous.fontSize) || median)) <= 1.25 && Boolean(previous.bold) === Boolean(block.bold) && previous.align === block.align
      const canMerge = closeVertically && sameColumn && sameStyle && !previous.bold && !block.bold
      if (!canMerge) {
        paragraphs.push({ ...block })
        return
      }
      const left = Number(previous.freePosition?.x) || 0
      const right = Math.max(left + Number(previous.blockWidth || 10), x + Number(block.blockWidth || 10))
      previous.content = `${String(previous.content || '').trimEnd()}\n${String(block.content || '').trimStart()}`
      previous.blockWidth = Math.min(100 - left, Math.max(Number(previous.blockWidth) || 10, right - left))
      previous.lineHeight = Math.max(1.2, Math.min(1.5, Number(previous.lineHeight) || lineStep))
    })
    formatted.push(...paragraphs)
  })
  const importedIds = new Set(imported.map(block => block.id))
  const result = []
  blocks.forEach(block => {
    if (importedIds.has(block.id)) return
    result.push(block)
    if (block.importedPdfPage) {
      const pageIndex = Number(block.freePosition?.pageIndex) || 0
      result.push(...formatted.filter(item => (Number(item.freePosition?.pageIndex) || 0) === pageIndex))
    }
  })
  const placedIds = new Set(result.map(block => block.id))
  formatted.filter(block => !placedIds.has(block.id)).forEach(block => result.push(block))
  return result
}

async function rasterizeSvgShape(block) {
  const width = 1000
  const height = Math.max(300, Math.round(width * Math.max(32, Number(block.height) || 120) / Math.max(60, Number(block.width) || 220)))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, width, height)
  const strokeWidth = Math.max(0, Math.min(12, Number(block.strokeWidth) || 0))
  const strokeColor = block.strokeColor || '#173b32'
  const svgMarkup = String(block.svgMarkup || '')
    .replaceAll('currentColor', block.color || '#c9f06b')
    .replaceAll('var(--flowly-shape-stroke)', strokeColor)
    .replace(/(<svg\b[^>]*>)/i, `$1<style>*{stroke:${strokeColor}!important;stroke-width:${strokeWidth}px!important}</style>`)
  const blobUrl = URL.createObjectURL(new Blob([svgMarkup], { type: 'image/svg+xml' }))
  try {
    const image = await new Promise((resolve, reject) => {
      const target = new window.Image()
      target.onload = () => resolve(target)
      target.onerror = () => reject(new Error('The SVG could not be rendered.'))
      target.src = blobUrl
    })
    context.save()
    context.globalAlpha = Math.max(0, Math.min(1, (Number(block.opacity) || 100) / 100))
    context.translate(width / 2, height / 2)
    context.rotate((Number(block.rotation) || 0) * Math.PI / 180)
    context.scale(block.flipX ? -1 : 1, block.flipY ? -1 : 1)
    context.drawImage(image, -width / 2, -height / 2, width, height)
    context.restore()
  } finally {
    URL.revokeObjectURL(blobUrl)
  }
  return { ...block, type: 'image', imageData: canvas.toDataURL('image/jpeg', .92), imageName: block.svgName || 'Custom SVG', imageWidth: width, imageHeight: height, alt: block.svgName || 'Custom SVG', fit: 'contain', blockHeight: Math.max(54, Number(block.blockHeight) || Number(block.height) || 120) }
}

async function rasterizeRichTextBlock(block, pageColor) {
  const width = Math.max(120, Math.round(511 * Math.max(10, Math.min(100, Number(block.blockWidth) || 100)) / 100))
  const size = Math.max(8, Math.min(32, Number(block.fontSize) || 12))
  const padding = resolvedElementPadding(block)
  const tester = document.createElement('div')
  Object.assign(tester.style, { position: 'fixed', left: '-10000px', top: '0', width: `${width}px`, boxSizing: 'border-box', padding: `${padding.top}px ${padding.right}px ${padding.bottom}px ${padding.left}px`, fontFamily: block.fontFamily || fontOptions[0].value, fontSize: `${size}px`, fontWeight: block.bold ? '800' : '500', lineHeight: String(Number(block.lineHeight) || 1.45), letterSpacing: `${Number(block.letterSpacing) || 0}px`, textAlign: block.align || 'left', whiteSpace: 'normal', overflowWrap: 'anywhere' })
  tester.innerHTML = sanitizeRichHtml(block.richHtml || plainTextHtml(block.content))
  document.body.appendChild(tester)
  const height = Math.max(44, Math.ceil(tester.scrollHeight))
  tester.remove()
  const scale = 2
  const canvas = document.createElement('canvas')
  canvas.width = width * scale
  canvas.height = height * scale
  const context = canvas.getContext('2d')
  context.fillStyle = block.background && block.background !== 'transparent' ? block.background : pageColor
  context.fillRect(0, 0, canvas.width, canvas.height)
  const html = sanitizeRichHtml(block.richHtml || plainTextHtml(block.content))
  const firstSelectionLink = new DOMParser().parseFromString(html, 'text/html').querySelector('a')?.getAttribute('href') || ''
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width * scale}" height="${height * scale}"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml" style="box-sizing:border-box;width:${width}px;min-height:${height}px;padding:${padding.top}px ${padding.right}px ${padding.bottom}px ${padding.left}px;font-family:${block.fontFamily || 'Arial'};font-size:${size}px;font-weight:${block.bold ? 800 : 500};line-height:${Number(block.lineHeight) || 1.45};letter-spacing:${Number(block.letterSpacing) || 0}px;text-align:${block.align || 'left'};color:${block.color || '#173b32'};text-decoration:${block.underline ? 'underline' : 'none'};background:${block.background && block.background !== 'transparent' ? block.background : pageColor};overflow-wrap:anywhere;transform:scale(${scale});transform-origin:top left">${html}</div></foreignObject></svg>`
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }))
  try {
    const image = await new Promise((resolve, reject) => { const target = new window.Image(); target.onload = () => resolve(target); target.onerror = reject; target.src = url })
    context.drawImage(image, 0, 0)
  } finally {
    URL.revokeObjectURL(url)
  }
  return { ...block, type: 'image', imageData: canvas.toDataURL('image/jpeg', .94), imageName: 'Rich text', imageWidth: canvas.width, imageHeight: canvas.height, alt: block.content || 'Rich text', fit: 'contain', link: safeLink(firstSelectionLink) || block.link || '', height, blockHeight: Math.max(height, Number(block.blockHeight) || 0) }
}

function wrapCanvasText(context, value, maxWidth) {
  const lines = []
  String(value || '').split(/\r?\n/).forEach((paragraph, paragraphIndex, paragraphs) => {
    const words = paragraph.trim().split(/\s+/).filter(Boolean)
    let current = ''
    words.forEach(word => {
      const candidate = current ? `${current} ${word}` : word
      if (current && context.measureText(candidate).width > maxWidth) { lines.push(current); current = word }
      else current = candidate
    })
    if (current) lines.push(current)
    if (!words.length || paragraphIndex < paragraphs.length - 1) lines.push('')
  })
  return lines.length ? lines : ['']
}

async function rasterizeCustomFontBlock(block, pageColor) {
  await document.fonts.ready
  const scale = 2.5
  const width = Math.max(80, 511 * Math.max(10, Math.min(100, Number(block.blockWidth) || 100)) / 100)
  const size = Math.max(8, Math.min(32, Number(block.fontSize) || 12))
  const canvas = document.createElement('canvas')
  canvas.width = Math.ceil(width * scale)
  const context = canvas.getContext('2d')
  context.font = `${block.bold ? 700 : 400} ${size * scale}px ${block.fontFamily}`
  const drawLines = []
  if (block.type === 'list') {
    ;(block.items?.length ? block.items : ['List item']).forEach((item, itemIndex) => {
      const marker = block.listStyle === 'decimal' ? `${itemIndex + 1}.` : block.listStyle === 'lower-alpha' ? `${String.fromCharCode(97 + itemIndex % 26)}.` : '•'
      drawLines.push({ marker, lines: wrapCanvasText(context, item, (width - 40) * scale) })
    })
  }
  const textLines = block.type === 'text' ? wrapCanvasText(context, block.content, (width - 24) * scale) : []
  const leading = size * 1.45
  const naturalHeight = block.type === 'list'
    ? Math.max(44, drawLines.reduce((total, item) => total + Math.max(1, item.lines.length) * leading, 0) + 24)
    : Math.max(44, textLines.length * leading + 24)
  const height = Math.max(44, Number(block.blockHeight) || naturalHeight)
  canvas.height = Math.ceil(height * scale)
  const cornerRadii = resolvedCornerRadii(block)
  const scaledRadii = [cornerRadii.topLeft, cornerRadii.topRight, cornerRadii.bottomRight, cornerRadii.bottomLeft].map(value => Math.min(value * scale, canvas.width / 2, canvas.height / 2))
  if (scaledRadii.some(Boolean) && typeof context.roundRect === 'function') {
    context.save()
    context.beginPath()
    context.roundRect(0, 0, canvas.width, canvas.height, scaledRadii)
    context.clip()
  }
  context.fillStyle = block.type === 'text' && block.background && block.background !== 'transparent' ? block.background : pageColor
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.font = `${block.bold ? 700 : 400} ${size * scale}px ${block.fontFamily}`
  context.fillStyle = block.color || '#173b32'
  context.textBaseline = 'alphabetic'
  const alignedX = (entry, left, available) => {
    const measured = context.measureText(entry).width
    if (block.align === 'center') return left + Math.max(0, (available - measured) / 2)
    if (block.align === 'right') return left + Math.max(0, available - measured)
    return left
  }
  if (block.type === 'text') {
    textLines.forEach((entry, index) => context.fillText(entry, alignedX(entry, 12 * scale, (width - 24) * scale), (18 + index * leading) * scale))
  } else {
    let y = 18
    drawLines.forEach(item => {
      context.fillText(item.marker, 10 * scale, y * scale)
      item.lines.forEach((entry, index) => context.fillText(entry, alignedX(entry, 30 * scale, (width - 40) * scale), (y + index * leading) * scale))
      y += Math.max(1, item.lines.length) * leading
    })
  }
  if (scaledRadii.some(Boolean) && typeof context.roundRect === 'function') context.restore()
  return {
    ...block,
    type: 'image',
    imageData: canvas.toDataURL('image/jpeg', .94),
    imageName: 'Custom font text',
    imageWidth: canvas.width,
    imageHeight: canvas.height,
    alt: block.type === 'text' ? block.content : (block.items || []).join(', '),
    fit: 'contain',
    opacity: 100,
    height,
    blockHeight: height,
  }
}

function makeBlock(type) {
  const common = { id: nextId(), type, boxModelVersion: 1, padding: defaultElementPadding(type), margin: { ...emptyBoxSides }, border: { ...emptyBoxSides }, borderStyle: 'solid', borderColor: '#173b32', borderRadius: { ...emptyCornerRadii } }
  return {
    text: { ...common, content: 'Write something useful here.', richHtml: '', fontSize: 12, fontFamily: 'Inter, Arial, sans-serif', color: '#173b32', background: 'transparent', align: 'left', bold: false, underline: false, lineHeight: 1.45, letterSpacing: 0, link: '', blockWidth: 55 },
    list: { ...common, items: ['First item', 'Second item', 'Third item'], listStyle: 'disc', fontSize: 12, fontFamily: 'Inter, Arial, sans-serif', color: '#173b32', align: 'left', blockWidth: 55 },
    table: { ...common, caption: 'New table', headers: ['Column 1', 'Column 2'], rows: [['Value', 'Value']], headerColor: '#173b32', headerTextColor: '#ffffff', rowColor: '#ffffff', textColor: '#173b32', gridColor: '#d9e2dc', align: 'left', blockWidth: 70 },
    image: { ...common, imageData: '', imageName: 'Image', imageWidth: 1200, imageHeight: 800, alt: '', fit: 'contain', opacity: 100, blockWidth: 55, height: 170, position: 'left' },
    shape: { ...common, shape: 'rectangle', color: '#c9f06b', strokeColor: '#173b32', strokeWidth: 0, opacity: 100, rotation: 0, flipX: false, flipY: false, width: 220, height: 72, align: 'left', blockWidth: 45, blockHeight: 72 },
    divider: { ...common, orientation: 'horizontal', color: '#173b32', thickness: 2, lineStyle: 'solid', height: 120, align: 'center', blockWidth: 60, position: 'left' },
    spacer: { ...common, height: 48, blockWidth: 100, position: 'left' },
    pageBreak: common,
  }[type]
}

const projectTemplates = [
  { id: 'blank', name: 'Start blank', description: 'An empty A4 document ready for your own layout.', accent: '#f1f3ed' },
  { id: 'resume', name: 'Modern resume', description: 'A clean one-page résumé with profile, experience and skills.', accent: '#dfeedd' },
  { id: 'invoice', name: 'Simple invoice', description: 'A polished invoice with billing details, items and totals.', accent: '#e4ebfb' },
  { id: 'report', name: 'Project report', description: 'A structured report with summary, status table and next steps.', accent: '#f4e8da' },
  { id: 'certificate', name: 'Certificate', description: 'A formal landscape-inspired award certificate layout.', accent: '#fff0c9' },
  { id: 'letter', name: 'Business letter', description: 'A professional letter with sender, recipient and signature.', accent: '#e9eef8' },
  { id: 'flyer', name: 'Event flyer', description: 'A bold promotional flyer with event details and call to action.', accent: '#f6dfe8' },
]

function createTemplateDocument(templateId) {
  const add = (type, values = {}) => ({ ...makeBlock(type), ...values })
  if (templateId === 'blank') return { title: 'Untitled document', pageColor: '#ffffff', footerFields: { left: '', center: '', right: '' }, blocks: [] }
  if (templateId === 'resume') return {
    title: 'My resume', pageColor: '#ffffff', footerFields: { left: 'Resume', center: '', right: 'Page {page}' }, blocks: [
      add('text', { content: 'YOUR NAME', fontSize: 28, bold: true, align: 'center', blockWidth: 100, padding: { top: 8, right: 12, bottom: 3, left: 12 } }),
      add('text', { content: 'Role title · city@example.com · +00 000 000 000', fontSize: 10, align: 'center', color: '#59736a', blockWidth: 100, padding: { top: 2, right: 12, bottom: 10, left: 12 } }),
      add('divider', { blockWidth: 100, thickness: 1 }),
      add('text', { content: 'PROFILE', fontSize: 13, bold: true, blockWidth: 100 }),
      add('text', { content: 'Write a concise professional summary highlighting your strongest experience and the value you bring.', fontSize: 11, blockWidth: 100 }),
      add('text', { content: 'EXPERIENCE', fontSize: 13, bold: true, blockWidth: 100 }),
      add('text', { content: 'Job title — Company\nDescribe your impact, responsibilities and measurable results.', fontSize: 11, blockWidth: 100 }),
      add('text', { content: 'SKILLS', fontSize: 13, bold: true, blockWidth: 100 }),
      add('list', { items: ['Skill or expertise', 'Skill or expertise', 'Skill or expertise'], blockWidth: 100 }),
    ],
  }
  if (templateId === 'invoice') return {
    title: 'Invoice', pageColor: '#ffffff', footerFields: { left: 'Thank you for your business', center: '', right: 'Page {page}' }, blocks: [
      add('text', { content: 'INVOICE', fontSize: 28, bold: true, align: 'right', blockWidth: 100 }),
      add('text', { content: 'Your company\nStreet address\nhello@company.com', fontSize: 10, blockWidth: 55 }),
      add('text', { content: 'Invoice #0001\nDate: 01 Jan 2026\nDue: 15 Jan 2026', fontSize: 10, align: 'right', blockWidth: 45 }),
      add('divider', { blockWidth: 100, thickness: 2 }),
      add('text', { content: 'BILL TO\nClient name\nClient address', fontSize: 11, bold: true, blockWidth: 100 }),
      add('table', { caption: 'Invoice items', headers: ['Description', 'Qty', 'Rate', 'Amount'], rows: [['Service or product', '1', '$0.00', '$0.00'], ['Service or product', '1', '$0.00', '$0.00']], blockWidth: 100 }),
      add('text', { content: 'TOTAL: $0.00', fontSize: 17, bold: true, align: 'right', blockWidth: 100 }),
    ],
  }
  if (templateId === 'certificate') return {
    title: 'Certificate of achievement', pageColor: '#fffdf5', footerFields: { left: '', center: 'Certificate · {page}', right: '' }, blocks: [
      add('shape', { shape: 'rounded', color: '#f5e8ba', opacity: 100, blockWidth: 100, blockHeight: 610, height: 610, freePosition: { pageIndex: 0, x: 0, y: 7 }, strokeColor: '#b9902f', strokeWidth: 2 }),
      add('text', { content: 'CERTIFICATE', fontSize: 29, bold: true, align: 'center', blockWidth: 84, freePosition: { pageIndex: 0, x: 8, y: 22 }, background: 'transparent' }),
      add('text', { content: 'OF ACHIEVEMENT', fontSize: 13, align: 'center', letterSpacing: 3, blockWidth: 84, freePosition: { pageIndex: 0, x: 8, y: 32 } }),
      add('text', { content: 'Presented to', fontSize: 11, align: 'center', color: '#59736a', blockWidth: 84, freePosition: { pageIndex: 0, x: 8, y: 43 } }),
      add('text', { content: 'RECIPIENT NAME', fontSize: 25, bold: true, align: 'center', blockWidth: 84, freePosition: { pageIndex: 0, x: 8, y: 51 } }),
      add('text', { content: 'For outstanding achievement and dedication. Add your own description here.', fontSize: 12, align: 'center', blockWidth: 70, freePosition: { pageIndex: 0, x: 15, y: 63 } }),
      add('text', { content: 'Date                                   Signature', fontSize: 10, align: 'center', blockWidth: 70, freePosition: { pageIndex: 0, x: 15, y: 79 } }),
    ],
  }
  if (templateId === 'letter') return {
    title: 'Business letter', pageColor: '#ffffff', footerFields: { left: 'Company name', center: '', right: 'Page {page}' }, blocks: [
      add('text', { content: 'YOUR COMPANY', fontSize: 22, bold: true, blockWidth: 60 }),
      add('text', { content: 'Street address · City · hello@company.com', fontSize: 9, color: '#59736a', align: 'right', blockWidth: 40 }),
      add('divider', { blockWidth: 100, thickness: 2 }),
      add('text', { content: '27 October 2026\n\nRecipient name\nCompany\nStreet address', fontSize: 11, blockWidth: 100 }),
      add('text', { content: 'Dear Recipient,', fontSize: 11, bold: true, blockWidth: 100 }),
      add('text', { content: 'Write your letter here. Keep paragraphs concise, clear and focused on the action you would like the reader to take.\n\nAdd another paragraph with supporting details and a helpful closing statement.', fontSize: 11, lineHeight: 1.6, blockWidth: 100 }),
      add('text', { content: 'Sincerely,\nYour name\nRole title', fontSize: 11, blockWidth: 100 }),
    ],
  }
  if (templateId === 'flyer') return {
    title: 'Event flyer', pageColor: '#f8f5ee', footerFields: { left: '', center: '', right: '' }, blocks: [
      add('shape', { shape: 'rounded', color: '#173b32', blockWidth: 100, blockHeight: 250, height: 250, freePosition: { pageIndex: 0, x: 0, y: 3 } }),
      add('text', { content: 'YOUR BIG EVENT', fontSize: 30, bold: true, align: 'center', color: '#ffffff', blockWidth: 84, freePosition: { pageIndex: 0, x: 8, y: 12 } }),
      add('text', { content: 'A short, exciting promise for your audience', fontSize: 13, align: 'center', color: '#c9f06b', blockWidth: 76, freePosition: { pageIndex: 0, x: 12, y: 28 } }),
      add('text', { content: 'SATURDAY · 7 PM', fontSize: 18, bold: true, align: 'center', blockWidth: 80, freePosition: { pageIndex: 0, x: 10, y: 48 } }),
      add('text', { content: 'Venue name · Full address', fontSize: 11, align: 'center', blockWidth: 80, freePosition: { pageIndex: 0, x: 10, y: 58 } }),
      add('list', { items: ['Feature or highlight', 'Feature or highlight', 'Feature or highlight'], fontSize: 13, blockWidth: 58, freePosition: { pageIndex: 0, x: 21, y: 68 } }),
      add('text', { content: 'REGISTER NOW · example.com', fontSize: 15, bold: true, align: 'center', color: '#ffffff', background: '#d85d48', borderRadius: { topLeft: 18, topRight: 18, bottomRight: 18, bottomLeft: 18 }, blockWidth: 58, freePosition: { pageIndex: 0, x: 21, y: 84 } }),
    ],
  }
  return {
    title: 'Project report', pageColor: '#ffffff', footerFields: { left: 'Project report', center: 'Confidential', right: 'Page {page}' }, blocks: [
      add('text', { content: 'PROJECT REPORT', fontSize: 25, bold: true, blockWidth: 100 }),
      add('text', { content: 'Prepared for your team · Month 2026', fontSize: 11, color: '#59736a', blockWidth: 100 }),
      add('divider', { blockWidth: 100, thickness: 2 }),
      add('text', { content: 'Executive summary', fontSize: 16, bold: true, blockWidth: 100 }),
      add('text', { content: 'Summarise the project goal, current state and most important outcome.', fontSize: 11, blockWidth: 100 }),
      add('table', { caption: 'Project status', headers: ['Area', 'Owner', 'Status'], rows: [['Research', 'Name', 'Complete'], ['Delivery', 'Name', 'In progress'], ['Review', 'Name', 'Planned']], blockWidth: 100 }),
      add('text', { content: 'Next steps', fontSize: 16, bold: true, blockWidth: 100 }),
      add('list', { items: ['Confirm the next milestone', 'Assign owners and deadlines', 'Share the updated plan'], blockWidth: 100 }),
    ],
  }
}

function estimateHeight(block) {
  const padding = resolvedElementPadding(block)
  const extra = ['top', 'bottom'].reduce((total, side) => total + Math.max(0, Number(padding[side]) || 0) + Math.max(0, Number(block.margin?.[side]) || 0) + Math.max(0, Number(block.border?.[side]) || 0), 0)
  if (block.type === 'text') return Math.max(52, Math.ceil(String(block.content || '').length / Math.max(24, 84 - Number(block.fontSize || 12))) * (Number(block.fontSize || 12) * 1.45) + 25) + extra
  if (block.type === 'list') return 28 + Math.max(1, block.items?.length || 0) * Math.max(24, Number(block.fontSize || 12) * 1.7) + extra
  if (block.type === 'table') return 70 + Math.max(1, block.rows.length) * 28 + extra
  if (block.type === 'image') return Math.max(60, Number(block.blockHeight) || Number(block.height) || 170) + extra
  if (block.type === 'shape') return Math.max(44, Number(block.height) || 72) + 12 + extra
  if (block.type === 'divider' && block.orientation === 'vertical') return Math.max(32, Number(block.blockHeight) || Number(block.height) || 120) + 12 + extra
  if (block.type === 'spacer') return Math.max(12, Number(block.height) || 48) + extra
  return 28 + extra
}

function paginate(blocks) {
  const pages = [[]]
  let remaining = 690
  const nextPage = () => { pages.push([]); remaining = 690 }
  blocks.forEach((block, blockIndex) => {
    if (block.freePosition) return
    if (block.type === 'pageBreak') {
      const currentPageIndex = pages.length - 1
      const hasEarlierFreeBlock = blocks.slice(0, blockIndex).some(item => item.freePosition && Math.max(0, Math.round(Number(item.freePosition.pageIndex) || 0)) === currentPageIndex)
      if (pages.at(-1).length || hasEarlierFreeBlock) nextPage()
      pages.at(-1).push({ ...block, sourceId: block.id })
      remaining -= 30
      return
    }
    if (block.type === 'table') {
      const fixed = (block.caption ? 35 : 8) + 28
      let rows = block.rows.length ? [...block.rows] : [[]]
      let first = true
      let rowOffset = 0
      while (rows.length) {
        if (remaining < fixed + 28) nextPage()
        const count = Math.max(1, Math.floor((remaining - fixed) / 28))
        const pageRows = rows.splice(0, count)
        pages.at(-1).push({ ...block, sourceId: block.id, rows: pageRows, rowOffset, continued: !first })
        remaining -= fixed + pageRows.length * 28 + 12
        rowOffset += pageRows.length
        first = false
        if (rows.length) nextPage()
      }
      return
    }
    const height = estimateHeight(block)
    if (height > remaining && pages.at(-1).length) nextPage()
    pages.at(-1).push({ ...block, sourceId: block.id })
    remaining -= Math.min(height, 690)
  })
  blocks.filter(block => block.freePosition).forEach(block => {
    const pageIndex = Math.max(0, Math.round(Number(block.freePosition.pageIndex) || 0))
    while (pages.length <= pageIndex) pages.push([])
    pages[pageIndex].push({ ...block, sourceId: block.id, isFree: true })
  })
  return pages
}

function pageContentBox(page) {
  const rect = page.getBoundingClientRect()
  const styles = window.getComputedStyle(page)
  const paddingLeft = parseFloat(styles.paddingLeft) || 0
  const paddingRight = parseFloat(styles.paddingRight) || 0
  const paddingTop = parseFloat(styles.paddingTop) || 0
  const paddingBottom = parseFloat(styles.paddingBottom) || 0
  const width = Math.max(1, page.clientWidth - paddingLeft - paddingRight)
  const height = Math.max(1, page.clientHeight - paddingTop - paddingBottom)
  return {
    rect,
    width,
    height,
    left: rect.left + page.clientLeft + paddingLeft,
    top: rect.top + page.clientTop + paddingTop,
    paddingLeft,
    paddingTop,
  }
}

function naturalContentHeight(element) {
  if (!element) return 1
  const clone = element.cloneNode(true)
  const rect = element.getBoundingClientRect()
  Object.assign(clone.style, {
    position: 'fixed',
    left: '-10000px',
    top: '0',
    width: `${rect.width}px`,
    height: 'auto',
    minHeight: '0',
    maxHeight: 'none',
    overflow: 'visible',
    margin: '0',
    visibility: 'hidden',
    pointerEvents: 'none',
  })
  document.body.appendChild(clone)
  const height = Math.max(1, clone.getBoundingClientRect().height, clone.scrollHeight)
  clone.remove()
  return height
}

function findAlignmentGuides({ page, pageIndex, movingElement, left, top, width, height }) {
  const box = pageContentBox(page)
  const threshold = Math.max(5, Math.min(8, box.width * .01))
  let xGuide = null
  let yGuide = null
  let xLabel = ''
  let yLabel = ''
  let closestX = threshold + 1
  let closestY = threshold + 1
  const considerX = (movingValue, targetValue, label) => {
    const distance = Math.abs(movingValue - targetValue)
    if (distance <= threshold && distance < closestX) {
      closestX = distance
      xGuide = targetValue
      xLabel = label
    }
  }
  const considerY = (movingValue, targetValue, label) => {
    const distance = Math.abs(movingValue - targetValue)
    if (distance <= threshold && distance < closestY) {
      closestY = distance
      yGuide = targetValue
      yLabel = label
    }
  }

  considerX(left, 0, 'Left aligned')
  considerX(left + width / 2, box.width / 2, 'Centre aligned')
  considerX(left + width, box.width, 'Right aligned')
  considerY(top, 0, 'Top aligned')
  considerY(top + height / 2, box.height / 2, 'Middle aligned')
  considerY(top + height, box.height, 'Bottom aligned')

  const movingX = { left, center: left + width / 2, right: left + width }
  const movingY = { top, center: top + height / 2, bottom: top + height }
  const neighbours = [...page.querySelectorAll('.pdf-canvas-block')].filter(element => element !== movingElement)
  for (const neighbour of neighbours) {
    const rect = neighbour.getBoundingClientRect()
    const nx = { left: rect.left - box.left, center: rect.left - box.left + rect.width / 2, right: rect.right - box.left }
    const ny = { top: rect.top - box.top, center: rect.top - box.top + rect.height / 2, bottom: rect.bottom - box.top }
    for (const movingEdge of ['left', 'center', 'right']) for (const neighbourEdge of ['left', 'center', 'right']) {
      const label = movingEdge === neighbourEdge
        ? `${movingEdge === 'center' ? 'Centre' : movingEdge[0].toUpperCase() + movingEdge.slice(1)} aligned`
        : `${movingEdge} to neighbour ${neighbourEdge}`
      considerX(movingX[movingEdge], nx[neighbourEdge], label)
    }
    for (const movingEdge of ['top', 'center', 'bottom']) for (const neighbourEdge of ['top', 'center', 'bottom']) {
      const label = movingEdge === neighbourEdge
        ? `${movingEdge === 'center' ? 'Middle' : movingEdge[0].toUpperCase() + movingEdge.slice(1)} aligned`
        : `${movingEdge} to neighbour ${neighbourEdge}`
      considerY(movingY[movingEdge], ny[neighbourEdge], label)
    }
  }

  return {
    pageIndex,
    x: xGuide == null ? null : (box.paddingLeft + xGuide) / page.clientWidth * 100,
    y: yGuide == null ? null : (box.paddingTop + yGuide) / page.clientHeight * 100,
    xLabel,
    yLabel,
  }
}

function ColorField({ label, value, onChange, allowTransparent = false }) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(value === 'transparent' ? '' : value)
  const [picker, setPicker] = useState(() => hexToHsv(value))
  useEffect(() => {
    setDraft(value === 'transparent' ? '' : value)
    if (value !== 'transparent') setPicker(hexToHsv(value))
  }, [value])
  const applyPicker = next => {
    setPicker(next)
    onChange(hsvToHex(next.h, next.s, next.v))
  }
  const pickColour = event => {
    const rect = event.currentTarget.getBoundingClientRect()
    const s = Math.round(Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)) * 100)
    const v = Math.round((1 - Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height))) * 100)
    applyPicker({ ...picker, s, v })
  }
  const commit = raw => {
    const candidate = raw.trim().startsWith('#') ? raw.trim() : `#${raw.trim()}`
    if (/^#[0-9a-f]{6}$/i.test(candidate)) onChange(candidate.toLowerCase())
    else setDraft(value === 'transparent' ? '' : value)
  }
  const display = value === 'transparent' ? 'None' : value
  return <div className="pdf-studio-color">
    <span>{label}</span>
    <button type="button" className="pdf-studio-color-trigger" aria-expanded={open} onClick={() => setOpen(current => !current)}>
      <i className={value === 'transparent' ? 'transparent' : ''} style={value === 'transparent' ? undefined : { background: value }}/><code>{display}</code><ChevronDown size={15}/>
    </button>
    {open && <div className="pdf-studio-color-menu">
      <div className="pdf-studio-color-swatches">{colorSwatches.map(color => <button type="button" aria-label={`Use ${color}`} className={value.toLowerCase?.() === color ? 'active' : ''} style={{ background: color }} onClick={() => { onChange(color); setOpen(false) }} key={color}>{value.toLowerCase?.() === color && <Check size={13}/>}</button>)}</div>
      <div className="pdf-studio-custom-colour"><div><strong>Choose any colour</strong><output>{value === 'transparent' ? hsvToHex(picker.h, picker.s, picker.v) : value}</output></div><div className="pdf-studio-colour-map" role="slider" aria-label={`${label} saturation and brightness`} aria-valuetext={`Saturation ${picker.s}%, brightness ${picker.v}%`} tabIndex="0" style={{ backgroundColor: hsvToHex(picker.h, 100, 100) }} onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); pickColour(event) }} onPointerMove={event => { if (event.currentTarget.hasPointerCapture(event.pointerId)) pickColour(event) }}><i style={{ left: `${picker.s}%`, top: `${100 - picker.v}%`, background: hsvToHex(picker.h, picker.s, picker.v) }}/></div><label><span>Hue</span><input className="pdf-studio-hue-range" type="range" min="0" max="359" value={picker.h} onChange={event => applyPicker({ ...picker, h: Number(event.target.value) })}/></label></div>
      <label className="pdf-studio-hex-field"><span>Optional HEX</span><input value={draft} maxLength="7" spellCheck="false" placeholder="#173b32" onChange={event => setDraft(event.target.value)} onBlur={event => commit(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { commit(event.currentTarget.value); setOpen(false) } }}/></label>
      {allowTransparent && <button type="button" className={value === 'transparent' ? 'pdf-studio-transparent active' : 'pdf-studio-transparent'} onClick={() => { onChange('transparent'); setOpen(false) }}>No colour</button>}
    </div>}
  </div>
}

function Alignment({ value, onChange }) {
  return <div className="pdf-studio-align" role="group" aria-label="Alignment">{alignments.map(({ id, Icon }) => <button type="button" aria-label={`Align ${id}`} aria-pressed={value === id} className={value === id ? 'active' : ''} onClick={() => onChange(id)} key={id}><Icon size={15}/><span>{id[0].toUpperCase() + id.slice(1)}</span></button>)}</div>
}

function FontPicker({ value, fonts, onChange }) {
  const [open, setOpen] = useState(false)
  const [placement, setPlacement] = useState('down')
  const rootRef = useRef(null)
  const menuRef = useRef(null)
  const selected = fonts.find(font => font.value === value) || fonts[0]

  useEffect(() => {
    if (!open) return undefined
    const closeOutside = event => {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }
    const handleKeys = event => {
      if (event.key === 'Escape') {
        setOpen(false)
        rootRef.current?.querySelector('.pdf-studio-font-trigger')?.focus()
      }
    }
    document.addEventListener('pointerdown', closeOutside)
    document.addEventListener('keydown', handleKeys)
    return () => {
      document.removeEventListener('pointerdown', closeOutside)
      document.removeEventListener('keydown', handleKeys)
    }
  }, [open])

  const openMenu = () => {
    setOpen(current => {
      const next = !current
      if (next) {
        const rect = rootRef.current?.getBoundingClientRect()
        setPlacement(rect && rect.bottom + 285 > window.innerHeight ? 'up' : 'down')
        requestAnimationFrame(() => {
        const menu = menuRef.current
        const option = menu?.querySelector('[aria-selected="true"]')
        if (!menu || !option) return
        menu.scrollTop = Math.max(0, option.offsetTop - (menu.clientHeight - option.clientHeight) / 2)
        option.focus({ preventScroll: true })
        })
      }
      return next
    })
  }
  const moveFocus = (event, index) => {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const options = [...menuRef.current.querySelectorAll('[role="option"]')]
    const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length
    options[nextIndex]?.focus()
  }

  return <div className="pdf-studio-font-picker" ref={rootRef}>
    <span className="pdf-studio-font-label">Font</span>
    <button type="button" className="pdf-studio-font-trigger" aria-haspopup="listbox" aria-expanded={open} onClick={openMenu}>
      <span style={{ fontFamily: selected.value }}>{selected.label}</span>
      {selected.custom && <small>Uploaded</small>}
      <ChevronDown size={16}/>
    </button>
    {open && <div className={`pdf-studio-font-menu ${placement}`} role="listbox" aria-label="Font" ref={menuRef}>
      {fonts.map((font, index) => <button type="button" role="option" aria-selected={font.value === selected.value} className={font.value === selected.value ? 'active' : ''} onKeyDown={event => moveFocus(event, index)} onClick={() => { onChange(font.value); setOpen(false) }} key={font.value}>
        <span style={{ fontFamily: font.value }}>{font.label}</span>
        {font.custom ? <small>Uploaded</small> : <i aria-hidden="true">Aa</i>}
        {font.value === selected.value && <Check size={16}/>}
      </button>)}
    </div>}
  </div>
}

function ElementSizing({ block, set }) {
  const width = Math.max(10, Math.min(100, Number(block.blockWidth) || 100))
  const fixedHeight = Math.max(0, Number(block.blockHeight) || 0)
  const contentSized = ['text', 'list', 'table', 'divider'].includes(block.type)
  const alignFreePosition = (position, nextWidth = width) => {
    if (!block.freePosition) return null
    const x = position === 'center' ? (100 - nextWidth) / 2 : position === 'right' ? 100 - nextWidth : 0
    return { ...block.freePosition, x: Math.max(0, x) }
  }
  const changeWidth = event => {
    const blockWidth = Number(event.target.value)
    const alignedPosition = ['left', 'center', 'right'].includes(block.position) ? block.position : null
    set({ blockWidth, ...(alignedPosition && block.freePosition ? { freePosition: alignFreePosition(alignedPosition, blockWidth) } : {}) })
  }
  const changePosition = position => set({ position, ...(block.freePosition ? { freePosition: alignFreePosition(position) } : {}) })
  return <div className="pdf-studio-element-sizing">
    <label><span>Element width <output>{Math.round(width)}%</output></span><input type="range" min="10" max="100" step="1" value={width} onChange={changeWidth}/></label>
    {contentSized && <div className={`pdf-studio-height-mode ${fixedHeight ? 'fixed' : ''}`}><div><strong>Height</strong><span>{fixedHeight ? `Fixed at ${Math.round(fixedHeight)} px` : 'Auto - content + padding'}</span></div>{fixedHeight ? <button type="button" onClick={() => set({ blockHeight: 0 })}>Fit to content</button> : <small>Vertical space comes from the Padding values below.</small>}</div>}
    <span className="pdf-studio-field-label">Element position</span>
    <Alignment value={block.position || 'left'} onChange={changePosition}/>
    <small>{block.freePosition ? 'Drag this element anywhere on the PDF page to reposition it.' : 'Automatic layout keeps nearby elements tidy. Use “Start on a new row” when you want this element below the previous one.'}</small>
  </div>
}

function PositioningPanel({ block, set, alignOnPage, reorderLayer }) {
  const width = Math.max(10, Math.min(100, Number(block.blockWidth) || 100))
  const x = Math.max(0, Math.min(100 - width, Number(block.freePosition?.x) || 0))
  const y = Math.max(0, Math.min(100, Number(block.freePosition?.y) || 0))
  const setCoordinate = (axis, value) => {
    const maximum = axis === 'x' ? 100 - width : 100
    set({ freePosition: { ...block.freePosition, [axis]: Math.max(0, Math.min(maximum, Number(value) || 0)) }, position: 'custom' })
  }
  return <div className="pdf-professional-positioning">
    <div className="pdf-positioning-heading"><div><strong>Precise position</strong><span>Page {Math.max(0, Number(block.freePosition.pageIndex) || 0) + 1}</span></div><small>Arrow keys nudge 1%. Hold Shift for 5%.</small></div>
    <div className="pdf-position-coordinates"><label><span>X</span><input type="number" min="0" max={Math.max(0, 100 - width)} step="1" value={Math.round(x * 10) / 10} onChange={event => setCoordinate('x', event.target.value)}/><em>%</em></label><label><span>Y</span><input type="number" min="0" max="100" step="1" value={Math.round(y * 10) / 10} onChange={event => setCoordinate('y', event.target.value)}/><em>%</em></label></div>
    <span className="pdf-studio-field-label">Align to page</span>
    <div className="pdf-position-align-grid" role="group" aria-label="Align element to page"><button type="button" onClick={() => alignOnPage(block.id, 'horizontal', 'start')}>Left</button><button type="button" onClick={() => alignOnPage(block.id, 'horizontal', 'center')}>Centre</button><button type="button" onClick={() => alignOnPage(block.id, 'horizontal', 'end')}>Right</button><button type="button" onClick={() => alignOnPage(block.id, 'vertical', 'start')}>Top</button><button type="button" onClick={() => alignOnPage(block.id, 'vertical', 'center')}>Middle</button><button type="button" onClick={() => alignOnPage(block.id, 'vertical', 'end')}>Bottom</button></div>
    <span className="pdf-studio-field-label">Layer order</span>
    <div className="pdf-layer-order-controls"><button type="button" onClick={() => reorderLayer(block.id, 'back')}>Send to back</button><button type="button" onClick={() => reorderLayer(block.id, 'front')}>Bring to front</button></div>
    <button type="button" className="pdf-return-layout" onClick={() => set({ freePosition: null })}>Return to automatic layout</button>
  </div>
}

const boxSides = ['top', 'right', 'bottom', 'left']

function SideInputs({ label, values = {}, max, onChange }) {
  return <fieldset className="pdf-studio-side-inputs"><legend>{label}</legend><div>{boxSides.map(side => <label key={side}><span>{side[0].toUpperCase()}</span><input type="number" min="0" max={max} value={Math.max(0, Number(values[side]) || 0)} aria-label={`${label} ${side}`} onChange={event => onChange(side, Math.max(0, Math.min(max, Number(event.target.value) || 0)))}/></label>)}</div></fieldset>
}

const borderStyleOptions = [
  { value: 'solid', label: 'Solid' },
  { value: 'dashed', label: 'Dashed' },
  { value: 'dotted', label: 'Dotted' },
  { value: 'double', label: 'Double' },
]

function BorderStylePicker({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const menuRef = useRef(null)
  const selected = borderStyleOptions.find(option => option.value === value) || borderStyleOptions[0]

  useEffect(() => {
    if (!open) return undefined
    const closeOutside = event => { if (!rootRef.current?.contains(event.target)) setOpen(false) }
    const closeWithEscape = event => {
      if (event.key !== 'Escape') return
      setOpen(false)
      rootRef.current?.querySelector('.pdf-studio-border-trigger')?.focus()
    }
    document.addEventListener('pointerdown', closeOutside)
    document.addEventListener('keydown', closeWithEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOutside)
      document.removeEventListener('keydown', closeWithEscape)
    }
  }, [open])

  const moveFocus = (event, index) => {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const options = [...menuRef.current.querySelectorAll('[role="option"]')]
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length
    options[next]?.focus()
  }

  return <div className={`pdf-studio-border-picker ${open ? 'open' : ''}`} ref={rootRef}>
    <span className="pdf-studio-field-label">Border style</span>
    <button type="button" className="pdf-studio-border-trigger" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(current => !current)}>
      <span className={`pdf-studio-line-preview ${selected.value}`} aria-hidden="true"/>
      <strong>{selected.label}</strong>
      <ChevronDown size={16}/>
    </button>
    {open && <div className="pdf-studio-border-menu" role="listbox" aria-label="Border style" ref={menuRef}>
      {borderStyleOptions.map((option, index) => <button type="button" role="option" aria-selected={option.value === selected.value} className={option.value === selected.value ? 'active' : ''} onKeyDown={event => moveFocus(event, index)} onClick={() => { onChange(option.value); setOpen(false) }} key={option.value}>
        <span className={`pdf-studio-line-preview ${option.value}`} aria-hidden="true"/>
        <span>{option.label}</span>
        {option.value === selected.value && <Check size={16}/>}
      </button>)}
    </div>}
  </div>
}

function BoxModelEditor({ block, set }) {
  const padding = resolvedElementPadding(block)
  const cornerRadii = resolvedCornerRadii(block)
  const updateSide = (property, side, value) => {
    const current = property === 'padding' ? padding : { ...emptyBoxSides, ...(block[property] || {}) }
    set({ boxModelVersion: 1, padding, margin: { ...emptyBoxSides, ...(block.margin || {}) }, border: { ...emptyBoxSides, ...(block.border || {}) }, [property]: { ...current, [side]: value } })
  }
  return <details className="pdf-studio-box-model">
    <summary>Spacing &amp; border</summary>
    <SideInputs label="Padding" values={padding} max={80} onChange={(side, value) => updateSide('padding', side, value)}/>
    <SideInputs label="Margin" values={block.margin} max={80} onChange={(side, value) => updateSide('margin', side, value)}/>
    <SideInputs label="Border" values={block.border} max={16} onChange={(side, value) => updateSide('border', side, value)}/>
    <fieldset className="pdf-studio-corner-inputs"><legend>Corner radius</legend><div>{[
      ['topLeft', 'TL', 'Top left'],
      ['topRight', 'TR', 'Top right'],
      ['bottomRight', 'BR', 'Bottom right'],
      ['bottomLeft', 'BL', 'Bottom left'],
    ].map(([corner, shortLabel, label]) => <label key={corner}><span>{shortLabel}</span><input type="number" min="0" max="80" value={cornerRadii[corner]} aria-label={`${label} corner radius`} onChange={event => set({ borderRadius: { ...cornerRadii, [corner]: Math.max(0, Math.min(80, Number(event.target.value) || 0)) } })}/></label>)}</div><small>Set each corner independently, from 0 to 80 px.</small></fieldset>
    <BorderStylePicker value={block.borderStyle || 'solid'} onChange={borderStyle => set({ borderStyle })}/>
    <ColorField label="Border colour" value={block.borderColor || '#173b32'} onChange={borderColor => set({ borderColor })}/>
  </details>
}

function TableEditor({ block, update }) {
  const set = patch => update(block.id, patch)
  const addColumn = () => set({ headers: [...block.headers, `Column ${block.headers.length + 1}`], rows: block.rows.map(row => [...row, '']) })
  const removeColumn = column => block.headers.length > 1 && set({ headers: block.headers.filter((_, index) => index !== column), rows: block.rows.map(row => row.filter((_, index) => index !== column)) })
  const addRow = () => set({ rows: [...block.rows, block.headers.map(() => '')] })
  return <div className="pdf-studio-table-editor"><div className="pdf-studio-table-scroll"><table><thead><tr>{block.headers.map((header, column) => <th key={column}><input aria-label={`Column ${column + 1} heading`} value={header} onChange={event => set({ headers: block.headers.map((item, index) => index === column ? event.target.value : item) })}/><button type="button" disabled={block.headers.length === 1} onClick={() => removeColumn(column)} aria-label={`Delete column ${column + 1}`}><Trash2 size={12}/></button></th>)}</tr></thead><tbody>{block.rows.map((row, rowIndex) => <tr key={rowIndex}>{block.headers.map((_, column) => <td key={column}><input aria-label={`Row ${rowIndex + 1}, column ${column + 1}`} value={row[column] || ''} onChange={event => set({ rows: block.rows.map((itemRow, index) => index === rowIndex ? block.headers.map((__, itemColumn) => itemColumn === column ? event.target.value : (itemRow[itemColumn] || '')) : itemRow) })}/></td>)}<td><button type="button" onClick={() => set({ rows: block.rows.filter((_, index) => index !== rowIndex) })} aria-label={`Delete row ${rowIndex + 1}`}><Trash2 size={13}/></button></td></tr>)}</tbody></table></div><div className="pdf-studio-table-actions"><button type="button" onClick={addRow}><Plus size={14}/> Row</button><button type="button" onClick={addColumn}><Plus size={14}/> Column</button></div></div>
}

function ListEditor({ block, update }) {
  const set = patch => update(block.id, patch)
  const items = Array.isArray(block.items) ? block.items : []
  const addItem = () => set({ items: [...items, `Item ${items.length + 1}`] })
  const updateItem = (itemIndex, value) => set({ items: items.map((item, index) => index === itemIndex ? value : item) })
  const removeItem = itemIndex => items.length > 1 && set({ items: items.filter((_, index) => index !== itemIndex) })
  return <div className="pdf-studio-list-editor">
    <div className="pdf-studio-list-items">{items.map((item, index) => <div className="pdf-studio-list-item" key={index}><span>{block.listStyle === 'decimal' ? `${index + 1}.` : block.listStyle === 'lower-alpha' ? `${String.fromCharCode(97 + index % 26)}.` : '•'}</span><input aria-label={`List item ${index + 1}`} value={item} onChange={event => updateItem(index, event.target.value)}/><button type="button" disabled={items.length === 1} onClick={() => removeItem(index)} aria-label={`Delete list item ${index + 1}`}><Trash2 size={13}/></button></div>)}</div>
    <button type="button" className="pdf-studio-add-list-item" onClick={addItem}><Plus size={14}/> Add item</button>
  </div>
}

function layerName(block) {
  if (block.type === 'text') return block.content?.trim() || 'Text'
  if (block.type === 'list') return block.items?.find(item => item.trim()) || 'List'
  if (block.type === 'table') return block.caption?.trim() || 'Table'
  if (block.type === 'shape') return shapeOptions.find(shape => shape.id === block.shape)?.label || 'Shape'
  if (block.type === 'image') return block.imageName?.trim() || block.alt?.trim() || 'Image'
  if (block.type === 'divider') return 'Divider'
  if (block.type === 'spacer') return 'Empty space'
  return 'Page break'
}

function LayersPanel({ pages, selectedId, selectedIds, select, update, remove }) {
  return <div className="pdf-studio-layers">
    <div className="pdf-studio-panel-title"><span>DOCUMENT</span><h2>Layers</h2><p>Select hidden or overlapping elements without moving them.</p></div>
    {pages.map((pageBlocks, pageIndex) => <details open className="pdf-studio-layer-page" key={pageIndex}>
      <summary><ChevronDown size={14}/><span>Page {pageIndex + 1}</span><small>{pageBlocks.length}</small></summary>
      <div>{[...pageBlocks].reverse().map(block => {
        const id = block.sourceId || block.id
        return <div className={`pdf-studio-layer-row ${selectedIds.includes(id) ? 'selected' : ''}`} key={`${pageIndex}-${id}`}>
          <button type="button" className="pdf-studio-layer-select" aria-current={selectedIds.includes(id) ? 'true' : undefined} onClick={event => select(id, null, event.shiftKey)}><i>{block.type === 'text' ? 'T' : block.type === 'list' ? '≡' : block.type === 'table' ? '▦' : block.type === 'image' ? '▧' : block.type === 'divider' ? '—' : block.type === 'shape' ? '□' : block.type === 'spacer' ? '↕' : '↳'}</i><span title={layerName(block)}>{layerName(block)}</span></button>
          {block.type !== 'pageBreak' && <button type="button" className={block.locked ? 'pdf-studio-layer-action active' : 'pdf-studio-layer-action'} aria-label={block.locked ? `Unlock ${layerName(block)}` : `Lock ${layerName(block)}`} title={block.locked ? 'Unlock layer' : 'Lock layer'} onClick={() => update(id, { locked: !block.locked })}>{block.locked ? <Lock size={14}/> : <Unlock size={14}/>}</button>}
          <button type="button" className="pdf-studio-layer-action delete" disabled={block.locked} aria-label={block.locked ? `Unlock ${layerName(block)} before deleting` : `Delete ${layerName(block)}`} title={block.locked ? 'Unlock layer before deleting' : 'Delete layer'} onClick={() => remove(id)}><Trash2 size={14}/></button>
        </div>
      })}</div>
    </details>)}
  </div>
}

function MultiSelectionPanel({ count, grouped, allLocked, alignSelection, distributeSelection, groupSelection, ungroupSelection, lockSelection, duplicateSelection, deleteSelection }) {
  return <aside className="pdf-studio-inspector selected-element pdf-multi-inspector" aria-label={`${count} selected elements`}>
    <div className="pdf-studio-panel-title"><div><span>MULTI-SELECTION</span><h2>{count} elements</h2></div></div>
    <div className="pdf-multi-selection-summary"><strong>Move and arrange together</strong><p>Drag any selected element to move the selection. Shift-click or Shift-drag adds more elements.</p></div>
    <span className="pdf-studio-field-label">Align selection</span>
    <div className="pdf-position-align-grid" role="group" aria-label="Align selected elements"><button type="button" onClick={() => alignSelection('horizontal', 'start')}>Left</button><button type="button" onClick={() => alignSelection('horizontal', 'center')}>Centre</button><button type="button" onClick={() => alignSelection('horizontal', 'end')}>Right</button><button type="button" onClick={() => alignSelection('vertical', 'start')}>Top</button><button type="button" onClick={() => alignSelection('vertical', 'center')}>Middle</button><button type="button" onClick={() => alignSelection('vertical', 'end')}>Bottom</button></div>
    <span className="pdf-studio-field-label">Distribute evenly</span>
    <div className="pdf-layer-order-controls"><button type="button" disabled={count < 3} onClick={() => distributeSelection('horizontal')}>Horizontally</button><button type="button" disabled={count < 3} onClick={() => distributeSelection('vertical')}>Vertically</button></div>
    <div className="pdf-multi-action-grid">{grouped ? <button type="button" onClick={ungroupSelection}>Ungroup</button> : <button type="button" onClick={groupSelection}>Group</button>}<button type="button" onClick={lockSelection}>{allLocked ? 'Unlock all' : 'Lock all'}</button><button type="button" onClick={duplicateSelection}>Duplicate</button><button type="button" className="danger" disabled={allLocked} title={allLocked ? 'Unlock an element before deleting it' : 'Delete selected unlocked elements'} onClick={deleteSelection}>Delete</button></div>
  </aside>
}

function ShapeEditor({ block, set, chooseShapeSvg }) {
  const [search, setSearch] = useState('')
  const visibleShapes = shapeOptions.filter(shape => shape.label.toLowerCase().includes(search.trim().toLowerCase()))
  const actualWidth = Math.max(10, Math.min(100, Number(block.blockWidth) || 45))
  const actualHeight = Math.max(32, Math.min(420, Number(block.blockHeight) || Number(block.height) || 72))
  const chooseShape = shape => {
    if (shape.id === 'circle') {
      const circleWidth = Math.min(20, Math.max(10, Number(block.blockWidth) || 20))
      set({ shape: shape.id, svgMarkup: '', svgName: '', blockWidth: circleWidth, blockHeight: circleWidth * 5.808 })
    } else set({ shape: shape.id, svgMarkup: '', svgName: '' })
  }
  return <div className="pdf-shape-editor">
    <div className="pdf-shape-library-head"><label><span>Shape library</span><input type="search" value={search} placeholder="Search 20 shapes…" aria-label="Search shapes" onChange={event => setSearch(event.target.value)}/></label><button type="button" onClick={() => chooseShapeSvg(block.id)}><Upload size={14}/><span><strong>Upload custom SVG</strong><small>Use your own vector shape</small></span></button></div>
    {block.svgMarkup && <div className="pdf-custom-shape-chip"><strong>{block.svgName || 'Custom SVG'}</strong><span>Uploaded shape</span></div>}
    <div className="pdf-studio-shapes">{visibleShapes.map(shape => <button type="button" className={!block.svgMarkup && block.shape === shape.id ? 'active' : ''} aria-pressed={!block.svgMarkup && block.shape === shape.id} onClick={() => chooseShape(shape)} key={shape.id}><span className={`pdf-shape-option-preview ${shape.id}`}/><span>{shape.label}</span></button>)}</div>
    {!visibleShapes.length && <p className="pdf-studio-note">No matching shapes.</p>}
    <ColorField label="Fill" value={block.color} onChange={color => set({ color })}/>
    <ColorField label="Stroke" value={block.strokeColor || '#173b32'} onChange={strokeColor => set({ strokeColor })}/>
    <label>Stroke width <output>{Math.max(0, Math.min(12, Number(block.strokeWidth) || 0))} px</output><input type="range" min="0" max="12" step="1" value={Math.max(0, Math.min(12, Number(block.strokeWidth) || 0))} onChange={event => set({ strokeWidth: Number(event.target.value) })}/></label>
    <label>Fill opacity <output>{Math.max(0, Math.min(100, Number.isFinite(Number(block.opacity)) ? Number(block.opacity) : 100))}%</output><input type="range" min="0" max="100" step="1" value={Math.max(0, Math.min(100, Number.isFinite(Number(block.opacity)) ? Number(block.opacity) : 100))} onChange={event => set({ opacity: Number(event.target.value) })}/></label>
    <label>Rotation <output>{Math.round(Number(block.rotation) || 0)}°</output><input type="range" min="-180" max="180" step="1" value={Math.max(-180, Math.min(180, Number(block.rotation) || 0))} onChange={event => set({ rotation: Number(event.target.value) })}/></label>
    <div className="pdf-shape-transform-actions"><button type="button" className={block.flipX ? 'active' : ''} onClick={() => set({ flipX: !block.flipX })}>Flip horizontal</button><button type="button" className={block.flipY ? 'active' : ''} onClick={() => set({ flipY: !block.flipY })}>Flip vertical</button></div>
    <div className="pdf-shape-size-fields"><label>Width <small>% of page</small><input type="number" min="10" max="100" value={Math.round(actualWidth * 10) / 10} onChange={event => { const blockWidth = Math.max(10, Math.min(100, Number(event.target.value) || 10)); set({ blockWidth, ...(block.shape === 'circle' ? { blockHeight: blockWidth * 5.808, height: blockWidth * 5.808 } : {}) }) }}/></label><label>Height <small>px</small><input type="number" min="32" max="420" value={Math.round(actualHeight)} onChange={event => { const blockHeight = Math.max(32, Math.min(420, Number(event.target.value) || 32)); set({ blockHeight, height: blockHeight, ...(block.shape === 'circle' ? { blockWidth: Math.max(10, Math.min(100, blockHeight / 5.808)) } : {}) }) }}/></label></div>
    <span className="pdf-studio-field-label">Alignment</span><Alignment value={block.align} onChange={align => set({ align })}/>
  </div>
}

function Inspector({ block, update, remove, title, setTitle, pageColor, setPageColor, footerFields, setFooterFields, close, collapsed, toggleCollapsed, chooseImage, chooseShapeSvg, customFonts, chooseFont, fontError, alignOnPage, reorderLayer, pageCount, currentPageIndex, duplicateElementToPage }) {
  if (!block) return <aside className="pdf-studio-inspector">
    <div className="pdf-studio-panel-title"><span>DOCUMENT</span><h2>Page settings</h2></div>
    <label>File name<input value={title} placeholder="Untitled document" onChange={event => setTitle(event.target.value)}/><small>Used only when the PDF is downloaded. Add a Text element for a visible heading.</small></label>
    <ColorField label="Page colour" value={pageColor} onChange={setPageColor}/>
    <div className="pdf-studio-footer-editor">
      <div><strong>Custom footer section</strong><small>Add up to two lines in each column. Use {'{page}'} for the page number.</small></div>
      {['left', 'center', 'right'].map(position => <label key={position}><span>{position[0].toUpperCase() + position.slice(1)} column</span><textarea rows="2" maxLength="100" value={footerFields[position]} placeholder={position === 'left' ? 'Company or document name' : position === 'center' ? 'Confidential' : 'Page {page}'} onChange={event => setFooterFields(current => ({ ...current, [position]: event.target.value }))}/></label>)}
    </div>
    <div className="pdf-studio-empty"><FilePenLine size={23}/><strong>Select an element</strong><p>Click anything on a page to edit its content and appearance here.</p></div>
  </aside>
  const set = patch => update(block.id, patch)
  const availableFonts = [...fontOptions, ...customFonts]
  const name = block.type === 'pageBreak' ? 'Page break' : block.type === 'spacer' ? 'Empty space' : `${block.type[0].toUpperCase()}${block.type.slice(1)}`
  return <aside className={`pdf-studio-inspector selected-element ${collapsed ? 'collapsed' : ''}`} aria-label={`${name} properties`}><div className="pdf-studio-panel-title"><div><span>PROPERTIES</span><h2>{name}</h2></div><div className="pdf-studio-inspector-actions"><button type="button" className="pdf-studio-inspector-collapse" aria-label={collapsed ? 'Expand element properties' : 'Collapse element properties'} aria-expanded={!collapsed} onClick={toggleCollapsed}>{collapsed ? '⌃' : '⌄'}</button><button type="button" className="pdf-studio-inspector-close" aria-label="Close element properties" onClick={close}>×</button></div></div>
    {block.type !== 'pageBreak' && <ElementSizing block={block} set={set}/>} 
    {block.type !== 'pageBreak' && <BoxModelEditor block={block} set={set}/>}
    {block.type !== 'pageBreak' && (block.freePosition
      ? <PositioningPanel block={block} set={set} alignOnPage={alignOnPage} reorderLayer={reorderLayer}/>
      : <button type="button" className={block.newRow ? 'pdf-studio-row-toggle active' : 'pdf-studio-row-toggle'} onClick={() => set({ newRow: !block.newRow })}>{block.newRow ? 'Starts on a new row' : 'Start on a new row'}</button>)}
    {block.type !== 'pageBreak' && <button type="button" className={block.locked ? 'pdf-studio-lock-toggle active' : 'pdf-studio-lock-toggle'} onClick={() => set({ locked: !block.locked })}>{block.locked ? <Lock size={15}/> : <Unlock size={15}/>} {block.locked ? 'Element locked' : 'Lock element'}</button>}
    {block.type !== 'pageBreak' && pageCount > 1 && <div className="pdf-copy-to-page"><span className="pdf-studio-field-label">Copy to another page</span><div>{Array.from({ length: pageCount }, (_, pageIndex) => pageIndex).filter(pageIndex => pageIndex !== currentPageIndex).map(pageIndex => <button type="button" onClick={() => duplicateElementToPage(block.id, pageIndex)} key={pageIndex}>Page {pageIndex + 1}</button>)}</div></div>}
    {block.type === 'text' && <><label>Text<textarea rows="5" value={block.content} onChange={event => set({ content: event.target.value, richHtml: '' })}/><small>Double-click the text on the page to format individual selections.</small></label><div className="pdf-studio-font-control"><FontPicker value={block.fontFamily || fontOptions[0].value} fonts={availableFonts} onChange={fontFamily => set({ fontFamily })}/><button type="button" onClick={() => chooseFont(block.id)}><Upload size={14}/> Upload font</button>{fontError && <small role="alert">{fontError}</small>}</div><label>Font size<input type="number" min="8" max="32" value={block.fontSize} onChange={event => set({ fontSize: Number(event.target.value) })}/></label><div className="pdf-text-spacing-controls"><label>Line height<input type="number" min="0.8" max="3" step="0.05" value={Number(block.lineHeight) || 1.45} onChange={event => set({ lineHeight: Number(event.target.value) })}/></label><label>Letter spacing<input type="number" min="-2" max="12" step="0.5" value={Number(block.letterSpacing) || 0} onChange={event => set({ letterSpacing: Number(event.target.value) })}/></label></div><label>Whole-box link <small>Optional</small><input type="url" value={block.link || ''} placeholder="https://example.com" onChange={event => set({ link: event.target.value })}/><small>{block.link && !safeLink(block.link) ? 'Enter a valid web or email link.' : 'For one phrase only, select it during direct editing and press Link.'}</small></label><span className="pdf-studio-field-label">Alignment</span><Alignment value={block.align} onChange={align => set({ align })}/><ColorField label="Text colour" value={block.color} onChange={color => set({ color })}/><ColorField label="Background" value={block.background} onChange={background => set({ background })} allowTransparent/><div className="pdf-text-style-actions"><button type="button" className={block.bold ? 'active' : ''} onClick={() => set({ bold: !block.bold })}><Bold size={15}/> Bold box</button><button type="button" className={block.underline ? 'active' : ''} onClick={() => set({ underline: !block.underline })}><u>U</u> Underline box</button></div></>}
    {block.type === 'list' && <><span className="pdf-studio-field-label">List format</span><div className="pdf-studio-list-types" role="group" aria-label="List format"><button type="button" className={block.listStyle === 'disc' ? 'active' : ''} onClick={() => set({ listStyle: 'disc' })}><span>•</span> Disc</button><button type="button" className={block.listStyle === 'decimal' ? 'active' : ''} onClick={() => set({ listStyle: 'decimal' })}><span>1.</span> Number</button><button type="button" className={block.listStyle === 'lower-alpha' ? 'active' : ''} onClick={() => set({ listStyle: 'lower-alpha' })}><span>a.</span> A, B, C</button></div><ListEditor block={block} update={update}/><div className="pdf-studio-font-control"><FontPicker value={block.fontFamily || fontOptions[0].value} fonts={availableFonts} onChange={fontFamily => set({ fontFamily })}/><button type="button" onClick={() => chooseFont(block.id)}><Upload size={14}/> Upload font</button>{fontError && <small role="alert">{fontError}</small>}</div><label>Font size<input type="number" min="8" max="32" value={block.fontSize} onChange={event => set({ fontSize: Number(event.target.value) })}/></label><span className="pdf-studio-field-label">Alignment</span><Alignment value={block.align} onChange={align => set({ align })}/><ColorField label="Text colour" value={block.color} onChange={color => set({ color })}/></>}
    {block.type === 'table' && <><label>Caption<input value={block.caption} onChange={event => set({ caption: event.target.value })}/></label><TableEditor block={block} update={update}/><ColorField label="Header" value={block.headerColor} onChange={headerColor => set({ headerColor })}/><ColorField label="Rows" value={block.rowColor} onChange={rowColor => set({ rowColor })}/><ColorField label="Text" value={block.textColor} onChange={textColor => set({ textColor })}/><ColorField label="Grid" value={block.gridColor} onChange={gridColor => set({ gridColor })}/><span className="pdf-studio-field-label">Cell alignment</span><Alignment value={block.align} onChange={align => set({ align })}/></>}
    {block.type === 'image' && <><div className="pdf-studio-image-summary"><span><ImageIcon size={18}/></span><div><strong>{block.imageName || 'Uploaded image'}</strong><small>{block.imageWidth || 0} × {block.imageHeight || 0}px</small></div><button type="button" onClick={() => chooseImage(block.id)}><Upload size={14}/> Replace</button></div><label>Alternative text<input value={block.alt || ''} placeholder="Describe this image" onChange={event => set({ alt: event.target.value })}/><small>Used for accessibility in the editor.</small></label><span className="pdf-studio-field-label">Image fit</span><div className="pdf-studio-image-fit" role="group" aria-label="Image fit"><button type="button" className={(block.fit || 'contain') === 'contain' ? 'active' : ''} onClick={() => set({ fit: 'contain' })}>Fit image</button><button type="button" className={block.fit === 'cover' ? 'active' : ''} onClick={() => set({ fit: 'cover' })}>Fill frame</button></div><label>Opacity <output>{Math.round(Number(block.opacity) || 100)}%</output><input type="range" min="10" max="100" value={Math.max(10, Number(block.opacity) || 100)} onChange={event => set({ opacity: Number(event.target.value) })}/></label></>}
    {block.type === 'shape' && <ShapeEditor block={block} set={set} chooseShapeSvg={chooseShapeSvg}/>}
    {block.type === 'divider' && <><span className="pdf-studio-field-label">Orientation</span><div className="pdf-studio-image-fit" role="group" aria-label="Line orientation"><button type="button" className={(block.orientation || 'horizontal') === 'horizontal' ? 'active' : ''} onClick={() => set({ orientation: 'horizontal', blockWidth: 60, blockHeight: 0, ...(block.freePosition ? { freePosition: { ...block.freePosition, x: Math.min(40, Number(block.freePosition.x) || 0) } } : {}) })}>Horizontal</button><button type="button" className={block.orientation === 'vertical' ? 'active' : ''} onClick={() => set({ orientation: 'vertical', blockWidth: 15, blockHeight: 0, height: Math.max(32, Number(block.height) || 120), align: block.align || 'center' })}>Vertical</button></div><span className="pdf-studio-field-label">Line style</span><div className="pdf-studio-divider-styles" role="group" aria-label="Divider style">{dividerStyles.map(style => <button type="button" className={(block.lineStyle || 'solid') === style.id ? 'active' : ''} aria-pressed={(block.lineStyle || 'solid') === style.id} onClick={() => set({ lineStyle: style.id })} key={style.id}><i className={style.id}/><span>{style.label}</span></button>)}</div><ColorField label="Line colour" value={block.color} onChange={color => set({ color })}/><label>Thickness<input type="number" min="1" max="8" value={block.thickness} onChange={event => set({ thickness: Number(event.target.value) })}/></label>{block.orientation === 'vertical' && <><label>Line length <output>{Math.max(32, Number(block.height) || 120)} px</output><input type="range" min="32" max="400" step="4" value={Math.max(32, Number(block.height) || 120)} onChange={event => set({ height: Number(event.target.value) })}/></label><span className="pdf-studio-field-label">Line placement</span><Alignment value={block.align || 'center'} onChange={align => set({ align })}/></>}</>}
    {block.type === 'spacer' && <><label>Empty space height <output>{Math.max(12, Number(block.height) || 48)} px</output><input type="range" min="12" max="220" step="4" value={Math.max(12, Number(block.height) || 48)} onChange={event => set({ height: Number(event.target.value) })}/></label><p className="pdf-studio-note">This creates blank vertical space in both the canvas and downloaded PDF.</p></>}
    {block.type === 'pageBreak' && <p className="pdf-studio-note">Everything after this marker starts on a fresh PDF page.</p>}
    <button type="button" className="pdf-studio-delete" disabled={block.locked} title={block.locked ? 'Unlock this element before deleting it' : 'Delete element'} onClick={() => remove(block.id)}><Trash2 size={15}/> {block.locked ? 'Unlock to delete' : 'Delete element'}</button>
  </aside>
}

function CanvasBlock({ block, selected, editing, onSelect, onDelete, suppressSelectionClick, onBeginInlineEdit, onFinishInlineEdit, onEndInlineEdit, onInlineUpdate, previewPosition, draggingAway, resizePreview, onPointerStart, onPointerMove, onPointerEnd, onPointerCancel, onResizeStart }) {
  const id = block.sourceId || block.id
  const inlineEditorRef = useRef(null)
  const ignoreNextInlineBlur = useRef(false)
  useLayoutEffect(() => {
    if (!editing || !inlineEditorRef.current) return
    ignoreNextInlineBlur.current = true
    inlineEditorRef.current.focus()
    const selection = window.getSelection()
    const range = document.createRange()
    range.selectNodeContents(inlineEditorRef.current)
    range.collapse(false)
    selection.removeAllRanges()
    selection.addRange(range)
  }, [editing])
  const requestedWidth = Math.max(10, Math.min(100, Number(resizePreview?.blockWidth ?? block.blockWidth) || 100))
  const blockHeight = Math.max(0, Number(resizePreview?.blockHeight ?? block.blockHeight) || 0)
  const elementPadding = resolvedElementPadding(block)
  const verticalInsets = Math.max(0, Number(elementPadding.top) || 0) + Math.max(0, Number(elementPadding.bottom) || 0) + Math.max(0, Number(block.border?.top) || 0) + Math.max(0, Number(block.border?.bottom) || 0)
  const blockWidth = block.type === 'shape' && block.shape === 'circle' && blockHeight
    ? Math.max(10, Math.min(100, blockHeight / 5.808))
    : requestedWidth
  const contentHeight = blockHeight ? Math.max(0, blockHeight - verticalInsets) : 0
  const normalizeInlineValue = value => String(value || '').replace(/\u00a0/g, ' ').replace(/\s*\n+\s*/g, ' ').trim()
  const structuredEditorProps = (label, commit) => ({
    contentEditable: editing,
    suppressContentEditableWarning: true,
    spellCheck: true,
    className: editing ? 'pdf-inline-editable active' : undefined,
    title: editing ? `${label}. Press Ctrl+Enter to finish.` : undefined,
    // Let pointer-down bubble to the canvas block while the structured text is
    // only being displayed. Previously every list item and table cell stopped
    // the event here, so a drag worked from the surrounding whitespace but did
    // nothing when it began directly over the visible content. During inline
    // editing we still isolate the pointer so selecting text does not move the
    // element.
    onPointerDown: event => { if (editing) event.stopPropagation() },
    onBlur: event => editing && commit(normalizeInlineValue(event.currentTarget.innerText)),
    onKeyDown: event => {
      event.stopPropagation()
      if (event.key === 'Escape' || (event.key === 'Enter' && (event.ctrlKey || event.metaKey))) {
        event.preventDefault()
        commit(normalizeInlineValue(event.currentTarget.innerText))
        onEndInlineEdit()
      }
    },
  })
  const runRichTextCommand = (event, command, value = null) => {
    event.preventDefault()
    event.stopPropagation()
    inlineEditorRef.current?.focus({ preventScroll: true })
    document.execCommand(command, false, value)
  }
  const createSelectionLink = event => {
    event.preventDefault()
    event.stopPropagation()
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed) return
    const entered = window.prompt('Link URL', 'https://')
    const link = safeLink(entered)
    if (!link) return
    inlineEditorRef.current?.focus({ preventScroll: true })
    document.execCommand('createLink', false, link)
  }
  let content
  if (block.type === 'pageBreak') content = <div className="pdf-canvas-page-break"><span>Editing guide</span>Page starts here</div>
  else if (block.type === 'spacer') content = <div className="pdf-canvas-spacer" style={{ height: `${contentHeight || Math.max(12, Number(block.height) || 48) * .45}px` }}><span>{Math.round(contentHeight || Math.max(12, Number(block.height) || 48))} px empty space</span></div>
  else if (block.type === 'text') {
    const link = safeLink(block.link)
    const textContent = block.content || 'Your text'
    const richHtml = block.richHtml ? sanitizeRichHtml(block.richHtml) : ''
    const textStyle = { color: block.color, background: 'transparent', textAlign: block.align, fontFamily: block.fontFamily || fontOptions[0].value, fontSize: `${Math.max(8, block.fontSize) * (block.importedPdfText ? 1.14 : .62)}px`, fontWeight: block.bold ? 800 : 500, textDecoration: block.underline ? 'underline' : undefined, lineHeight: Number(block.lineHeight) || 1.45, letterSpacing: `${Number(block.letterSpacing) || 0}px`, height: contentHeight ? `${contentHeight}px` : undefined, overflow: contentHeight ? 'hidden' : undefined }
    content = <>{editing && <div className="pdf-rich-text-toolbar" role="toolbar" aria-label="Rich text formatting"><button type="button" title="Bold selection" onPointerDown={event => runRichTextCommand(event, 'bold')}><b>B</b></button><button type="button" title="Italic selection" onPointerDown={event => runRichTextCommand(event, 'italic')}><i>I</i></button><button type="button" title="Underline selection" onPointerDown={event => runRichTextCommand(event, 'underline')}><u>U</u></button><button type="button" title="Bullet list" onPointerDown={event => runRichTextCommand(event, 'insertUnorderedList')}>• List</button><button type="button" title="Numbered list" onPointerDown={event => runRichTextCommand(event, 'insertOrderedList')}>1. List</button><button type="button" title="Link selected text" onPointerDown={createSelectionLink}>Link</button><button type="button" title="Remove link" onPointerDown={event => runRichTextCommand(event, 'unlink')}>Unlink</button></div>}<div ref={inlineEditorRef} className={`pdf-canvas-text ${editing ? 'inline-editing' : ''}`} contentEditable={editing} suppressContentEditableWarning spellCheck="true" title={editing ? 'Select text, then use the formatting toolbar. Press Ctrl+Enter to finish.' : 'Double-click to edit text'} onDoubleClick={event => { event.preventDefault(); event.stopPropagation(); onBeginInlineEdit(id) }} onBlur={event => {
      if (!editing) return
      if (ignoreNextInlineBlur.current) {
        ignoreNextInlineBlur.current = false
        const editor = event.currentTarget
        requestAnimationFrame(() => editor.focus())
        return
      }
      onFinishInlineEdit(id, { text: event.currentTarget.innerText, html: event.currentTarget.innerHTML })
    }} onKeyDown={event => { event.stopPropagation(); if (event.key === 'Escape' || (event.key === 'Enter' && (event.ctrlKey || event.metaKey))) { event.preventDefault(); onFinishInlineEdit(id, { text: event.currentTarget.innerText, html: event.currentTarget.innerHTML }) } }} style={textStyle} {...(richHtml ? { dangerouslySetInnerHTML: { __html: richHtml } } : {})}>{richHtml ? undefined : editing || !link ? textContent : <a href={link} target="_blank" rel="noreferrer" onPointerDown={event => event.stopPropagation()} onClick={event => event.stopPropagation()}>{textContent}</a>}</div></>
  }
  else if (block.type === 'list') {
    const ListTag = block.listStyle === 'disc' ? 'ul' : 'ol'
    content = <div className="pdf-canvas-list" style={{ color: block.color, textAlign: block.align, fontFamily: block.fontFamily || fontOptions[0].value, fontSize: `${Math.max(8, block.fontSize) * .62}px`, height: contentHeight ? `${contentHeight}px` : undefined, overflow: contentHeight ? 'hidden' : undefined }}><ListTag style={{ listStyleType: block.listStyle }}>{(block.items || []).map((item, index) => <li key={index}><span {...structuredEditorProps(`Edit list item ${index + 1}`, value => onInlineUpdate(id, source => ({ items: source.items.map((current, itemIndex) => itemIndex === index ? value : current) })))}>{item || `Item ${index + 1}`}</span></li>)}</ListTag></div>
  }
  else if (block.type === 'table') content = <div className="pdf-canvas-table" style={{ height: contentHeight ? `${contentHeight}px` : undefined, overflow: contentHeight ? 'hidden' : undefined }}><strong style={{ color: block.textColor }} {...structuredEditorProps('Edit table caption', value => onInlineUpdate(id, { caption: value }))}>{editing ? block.caption : block.continued ? `${block.caption || 'Table'} - continued` : block.caption}</strong><table style={{ textAlign: block.align }}><thead style={{ background: block.headerColor, color: block.headerTextColor }}><tr>{block.headers.map((header, index) => <th key={index}><span {...structuredEditorProps(`Edit column ${index + 1} heading`, value => onInlineUpdate(id, source => ({ headers: source.headers.map((current, headerIndex) => headerIndex === index ? value : current) })))}>{header}</span></th>)}</tr></thead><tbody>{block.rows.map((row, rowIndex) => <tr style={{ background: block.rowColor, color: block.textColor }} key={rowIndex}>{block.headers.map((_, index) => <td style={{ borderColor: block.gridColor }} key={index}><span {...structuredEditorProps(`Edit row ${(block.rowOffset || 0) + rowIndex + 1}, column ${index + 1}`, value => onInlineUpdate(id, source => ({ rows: source.rows.map((currentRow, currentRowIndex) => currentRowIndex === (block.rowOffset || 0) + rowIndex ? currentRow.map((cell, cellIndex) => cellIndex === index ? value : cell) : currentRow) })))}>{row[index] || ''}</span></td>)}</tr>)}</tbody></table></div>
  else if (block.type === 'image') content = <div className="pdf-canvas-image" style={{ height: block.importedPdfPage ? '100%' : `${contentHeight || Math.max(60, Number(block.height) || 170) * .45}px` }}><img src={block.imageData} alt={block.alt || ''} draggable="false" style={{ objectFit: block.importedPdfPage ? 'cover' : block.fit || 'contain', opacity: Math.max(.1, Math.min(1, (Number(block.opacity) || 100) / 100)) }}/></div>
  else if (block.type === 'shape') {
    const transform = `rotate(${Number(block.rotation) || 0}deg) scaleX(${block.flipX ? -1 : 1}) scaleY(${block.flipY ? -1 : 1})`
    const shapeStyle = { width: '100%', height: `${contentHeight || Math.max(18, block.height * .45)}px`, background: block.svgMarkup ? 'transparent' : block.color, color: block.color, opacity: Math.max(0, Math.min(1, (Number.isFinite(Number(block.opacity)) ? Number(block.opacity) : 100) / 100)), transform, '--flowly-shape-stroke': block.strokeColor || '#173b32', '--flowly-shape-stroke-width': `${Math.max(0, Number(block.strokeWidth) || 0)}px`, filter: !block.svgMarkup && Number(block.strokeWidth) > 0 ? `drop-shadow(${block.strokeWidth}px 0 0 ${block.strokeColor || '#173b32'}) drop-shadow(-${block.strokeWidth}px 0 0 ${block.strokeColor || '#173b32'}) drop-shadow(0 ${block.strokeWidth}px 0 ${block.strokeColor || '#173b32'}) drop-shadow(0 -${block.strokeWidth}px 0 ${block.strokeColor || '#173b32'})` : undefined }
    content = <div className={`pdf-canvas-shape ${block.align}`}>{block.svgMarkup ? <span className="pdf-canvas-shape-fill custom-svg" style={shapeStyle} dangerouslySetInnerHTML={{ __html: block.svgMarkup }}/> : <span className={`pdf-canvas-shape-fill ${block.shape || 'rectangle'}`} style={shapeStyle}/>}</div>
  }
  else if (block.type === 'divider' && block.orientation === 'vertical') {
    const lineStyle = block.lineStyle || 'solid'
    const lineWidth = lineStyle === 'double' ? Math.max(3, Number(block.thickness) * 2) : block.thickness
    content = <div className={`pdf-canvas-vertical-divider ${block.align || 'center'}`} style={{ height: `${contentHeight || Math.max(32, Number(block.height) || 120)}px` }}><span style={{ borderLeftColor: block.color, borderLeftStyle: lineStyle, borderLeftWidth: `${lineWidth}px` }}/></div>
  }
  else {
    const lineStyle = block.lineStyle || 'solid'
    const lineWidth = lineStyle === 'double' ? Math.max(3, Number(block.thickness) * 2) : block.thickness
    content = <hr style={{ borderTopColor: block.color, borderTopStyle: lineStyle, borderTopWidth: `${lineWidth}px` }}/>
  }
  const blockPosition = block.position || 'left'
  const effectivePosition = previewPosition || resizePreview?.freePosition || block.freePosition
  const horizontalMargin = Math.max(0, Number(block.margin?.left) || 0) + Math.max(0, Number(block.margin?.right) || 0)
  const boxModelStyle = {
    width: `calc(100% - ${horizontalMargin}px)`,
    height: block.importedPdfPage ? '100%' : blockHeight ? `${blockHeight}px` : undefined,
    marginTop: `${Math.max(0, Number(block.margin?.top) || 0)}px`,
    marginRight: `${Math.max(0, Number(block.margin?.right) || 0)}px`,
    marginBottom: `${Math.max(0, Number(block.margin?.bottom) || 0)}px`,
    marginLeft: `${Math.max(0, Number(block.margin?.left) || 0)}px`,
    paddingTop: `${Math.max(0, Number(elementPadding.top) || 0)}px`,
    paddingRight: `${Math.max(0, Number(elementPadding.right) || 0)}px`,
    paddingBottom: `${Math.max(0, Number(elementPadding.bottom) || 0)}px`,
    paddingLeft: `${Math.max(0, Number(elementPadding.left) || 0)}px`,
    borderTopWidth: `${Math.max(0, Number(block.border?.top) || 0)}px`,
    borderRightWidth: `${Math.max(0, Number(block.border?.right) || 0)}px`,
    borderBottomWidth: `${Math.max(0, Number(block.border?.bottom) || 0)}px`,
    borderLeftWidth: `${Math.max(0, Number(block.border?.left) || 0)}px`,
    borderStyle: block.borderStyle || 'solid',
    borderColor: block.borderColor || '#173b32',
    borderRadius: (() => {
      const radii = resolvedCornerRadii(block)
      return `${radii.topLeft}px ${radii.topRight}px ${radii.bottomRight}px ${radii.bottomLeft}px`
    })(),
    background: block.type === 'text' ? block.background : undefined,
  }
  const blockStyle = block.importedPdfPage
    ? { width: '100%', height: '100%', left: 0, top: 0 }
    : effectivePosition
    ? {
        width: `calc((100% - var(--pdf-page-padding-x)) * ${blockWidth / 100})`,
        left: `calc(var(--pdf-page-padding-left) + (100% - var(--pdf-page-padding-x)) * ${effectivePosition.x / 100})`,
        top: `calc(var(--pdf-page-padding-top) + (100% - var(--pdf-page-padding-y)) * ${effectivePosition.y / 100})`,
      }
    : { width: `${blockWidth}%`, marginLeft: blockPosition === 'center' || blockPosition === 'right' ? 'auto' : 0, marginRight: blockPosition === 'center' ? 'auto' : 0 }
  const resizeHandles = selected && !block.locked && block.type !== 'pageBreak' && <>{['top-left', 'top-right', 'bottom-left', 'bottom-right'].map(corner => <i className={`pdf-selection-handle ${corner}`} onPointerDown={event => { event.stopPropagation(); onResizeStart(event, id, corner) }} key={corner}/>)}</>
  const supportsInlineEditing = ['text', 'list', 'table'].includes(block.type)
  const editorLabel = block.type === 'table' ? 'table' : block.type === 'list' ? 'list' : 'text'
  const elementLabel = layerName(block)
  const displayedHeight = blockHeight || (block.type === 'divider' && block.orientation === 'vertical' ? Math.max(32, Number(block.height) || 120) : 0)
  return <div data-block-id={id} className={`pdf-canvas-block ${effectivePosition ? 'free-positioned' : ''} ${block.importedPdfPage ? 'imported-pdf-background' : ''} ${previewPosition || resizePreview ? 'live-dragging' : ''} ${draggingAway ? 'dragging-away' : ''} ${block.locked ? 'locked' : ''} ${selected ? 'selected' : ''} ${editing ? 'editing-text' : ''}`} style={blockStyle} onClick={event => { event.stopPropagation(); if (suppressSelectionClick.current) { suppressSelectionClick.current = false; return } if (event.detail >= 2 && supportsInlineEditing && !block.locked) onBeginInlineEdit(id); else onSelect(id, event.currentTarget, event.shiftKey) }} onDoubleClick={event => { if (!supportsInlineEditing || block.locked) return; event.preventDefault(); event.stopPropagation(); onBeginInlineEdit(id) }} onPointerDown={event => { if (event.target.closest('[contenteditable="true"]')) return; if (!event.target.closest('.pdf-selection-handle, .pdf-element-actions')) onPointerStart(event, id) }} onPointerMove={onPointerMove} onPointerUp={onPointerEnd} onPointerCancel={onPointerCancel}><span className="pdf-canvas-grip">{block.locked ? <Lock size={12}/> : <GripVertical size={14}/>}</span><div className="pdf-canvas-content-box" style={boxModelStyle}>{content}{selected && !block.locked && !editing && <span className="pdf-element-actions"><button type="button" className="pdf-quick-delete" aria-label={`Delete ${elementLabel}`} title="Delete element" onPointerDown={event => { event.preventDefault(); event.stopPropagation() }} onClick={event => { event.preventDefault(); event.stopPropagation(); onDelete(id) }}><Trash2 size={13}/></button>{supportsInlineEditing && <button type="button" className="pdf-inline-edit-button" aria-label={`Edit ${editorLabel} directly on page`} title={`Edit ${editorLabel} directly`} onPointerDown={event => { event.preventDefault(); event.stopPropagation() }} onClick={event => { event.preventDefault(); event.stopPropagation(); onBeginInlineEdit(id) }}><Type size={12}/> Edit {editorLabel}</button>}</span>}{resizeHandles}{selected && !editing && <span className={`pdf-selection-size ${displayedHeight ? 'fixed-height' : 'auto-height'}`}>{Math.round(blockWidth)}%{displayedHeight ? ` × ${Math.round(displayedHeight)}px fixed` : ' · auto height'}</span>}</div></div>
}

function Canvas({ pageColor, blocks, footerFields, selectedId, selectedIds, editingId, setSelectedId, selectByMarquee, removeBlock, suppressCanvasClear, beginInlineEdit, finishInlineEdit, endInlineEdit, inlineUpdate, dropOnPage, previewDrop, clearGuides, alignmentGuides, dragPreview, resizePreview, onPointerStart, onPointerMove, onPointerEnd, onPointerCancel, onResizeStart, zoom, setZoom, activePage, setActivePage, undo, redo, canUndo, canRedo, copySelected, duplicateSelected, duplicatePage, deletePage, movePage, hasImportedText, autoFormatImported, saveStatus }) {
  const canvasRef = useRef(null)
  const pageRefs = useRef([])
  const marqueePointer = useRef(null)
  const [selectionBounds, setSelectionBounds] = useState([])
  const [selectionMarquee, setSelectionMarquee] = useState(null)
  const pages = paginate(blocks)
  useEffect(() => {
    if (activePage > pages.length - 1) setActivePage(Math.max(0, pages.length - 1))
  }, [activePage, pages.length, setActivePage])
  useLayoutEffect(() => {
    if (selectedIds.length < 2 || !canvasRef.current) { setSelectionBounds([]); return }
    const nextBounds = []
    canvasRef.current.querySelectorAll('.pdf-studio-page').forEach(page => {
      const pageIndex = Number(page.dataset.pageIndex) || 0
      const elements = [...page.querySelectorAll('.pdf-canvas-block')].filter(element => selectedIds.some(id => String(id) === element.dataset.blockId))
      if (elements.length < 2) return
      const pageRect = page.getBoundingClientRect()
      const rects = elements.map(element => element.getBoundingClientRect())
      const left = Math.min(...rects.map(rect => rect.left))
      const top = Math.min(...rects.map(rect => rect.top))
      const right = Math.max(...rects.map(rect => rect.right))
      const bottom = Math.max(...rects.map(rect => rect.bottom))
      nextBounds.push({ pageIndex, left: (left - pageRect.left) / pageRect.width * 100, top: (top - pageRect.top) / pageRect.height * 100, width: (right - left) / pageRect.width * 100, height: (bottom - top) / pageRect.height * 100, count: elements.length })
    })
    setSelectionBounds(nextBounds)
  }, [selectedIds, blocks, zoom, dragPreview])
  const changeZoom = next => setZoom(Math.max(40, Math.min(160, Math.round(next / 5) * 5)))
  const fitPage = () => {
    const availableWidth = Math.max(320, (canvasRef.current?.clientWidth || 900) - 150)
    const availableHeight = Math.max(420, window.innerHeight - 175)
    changeZoom(Math.min(availableWidth / 680 * 100, availableHeight / (680 * 297 / 210) * 100))
  }
  const jumpToPage = index => {
    const pageIndex = Math.max(0, Math.min(pages.length - 1, index))
    setActivePage(pageIndex)
    requestAnimationFrame(() => pageRefs.current[pageIndex]?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }
  const marqueeRect = (page, startX, startY, clientX, clientY) => {
    const rect = page.getBoundingClientRect()
    const currentX = Math.max(rect.left, Math.min(rect.right, clientX))
    const currentY = Math.max(rect.top, Math.min(rect.bottom, clientY))
    const left = Math.min(startX, currentX)
    const top = Math.min(startY, currentY)
    const right = Math.max(startX, currentX)
    const bottom = Math.max(startY, currentY)
    return {
      client: { left, top, right, bottom },
      style: {
        left: `${(left - rect.left) / rect.width * 100}%`,
        top: `${(top - rect.top) / rect.height * 100}%`,
        width: `${(right - left) / rect.width * 100}%`,
        height: `${(bottom - top) / rect.height * 100}%`,
      },
    }
  }
  const beginMarquee = (event, pageIndex) => {
    if (event.button !== 0 || event.target.closest('.pdf-canvas-block, footer, .pdf-alignment-guide, .pdf-multi-selection-box')) return
    const page = event.currentTarget
    marqueePointer.current = { pointerId: event.pointerId, page, pageIndex, startX: event.clientX, startY: event.clientY, additive: event.shiftKey, moved: false }
    page.setPointerCapture(event.pointerId)
    setSelectionMarquee(null)
  }
  const moveMarquee = event => {
    const active = marqueePointer.current
    if (!active || active.pointerId !== event.pointerId) return
    if (!active.moved && Math.hypot(event.clientX - active.startX, event.clientY - active.startY) < 5) return
    active.moved = true
    event.preventDefault()
    setSelectionMarquee({ pageIndex: active.pageIndex, style: marqueeRect(active.page, active.startX, active.startY, event.clientX, event.clientY).style })
  }
  const finishMarquee = event => {
    const active = marqueePointer.current
    if (!active || active.pointerId !== event.pointerId) return
    if (active.moved) {
      event.preventDefault()
      event.stopPropagation()
      const selection = marqueeRect(active.page, active.startX, active.startY, event.clientX, event.clientY).client
      const ids = [...active.page.querySelectorAll('.pdf-canvas-block')].filter(element => {
        const rect = element.getBoundingClientRect()
        return rect.right >= selection.left && rect.left <= selection.right && rect.bottom >= selection.top && rect.top <= selection.bottom
      }).map(element => element.dataset.blockId).filter(Boolean)
      suppressCanvasClear.current = true
      window.requestAnimationFrame(() => { suppressCanvasClear.current = false })
      selectByMarquee(ids, active.additive)
    }
    if (active.page.hasPointerCapture(event.pointerId)) active.page.releasePointerCapture(event.pointerId)
    marqueePointer.current = null
    setSelectionMarquee(null)
  }
  const cancelMarquee = event => {
    if (marqueePointer.current?.pointerId !== event.pointerId) return
    marqueePointer.current = null
    setSelectionMarquee(null)
  }
  const renderBlock = (block, index, prefix = '', pageIndex = 0) => {
    const id = block.sourceId || block.id
    const preview = dragPreview?.positions?.[id] || (dragPreview?.id === id ? dragPreview.freePosition : null)
    const previewOnThisPage = preview && Number(preview.pageIndex) === pageIndex ? preview : null
    return <CanvasBlock block={block} selected={selectedIds.includes(id)} editing={editingId === id} onSelect={setSelectedId} onDelete={removeBlock} suppressSelectionClick={suppressCanvasClear} onBeginInlineEdit={beginInlineEdit} onFinishInlineEdit={finishInlineEdit} onEndInlineEdit={endInlineEdit} onInlineUpdate={inlineUpdate} previewPosition={previewOnThisPage} draggingAway={Boolean(preview && Number(preview.pageIndex) !== pageIndex)} resizePreview={resizePreview?.id === id ? resizePreview : null} onPointerStart={onPointerStart} onPointerMove={onPointerMove} onPointerEnd={onPointerEnd} onPointerCancel={onPointerCancel} onResizeStart={onResizeStart} key={`${prefix}${id}-${index}`}/>
  }
  return <main className="pdf-studio-canvas" ref={canvasRef} onClick={() => {
    if (suppressCanvasClear.current) { suppressCanvasClear.current = false; return }
    setSelectedId(null)
  }}>
    <div className="pdf-studio-canvas-head">
      <div className="pdf-canvas-document-status"><strong>PDF pages</strong><span>{pages.length} {pages.length === 1 ? 'page' : 'pages'} · A4</span><small className={saveStatus === 'Saved' ? 'saved' : ''}>{saveStatus}</small></div>
      <div className="pdf-canvas-toolbar" onClick={event => event.stopPropagation()}>
        <span className="pdf-toolbar-group"><button type="button" aria-label="Undo" title="Undo (Ctrl+Z)" disabled={!canUndo} onClick={undo}><Undo2 size={15}/></button><button type="button" aria-label="Redo" title="Redo (Ctrl+Y)" disabled={!canRedo} onClick={redo}><Redo2 size={15}/></button></span>
        {hasImportedText && <span className="pdf-toolbar-group pdf-auto-format-group"><button type="button" aria-label="Auto-format imported PDF text" title="Auto-format imported PDF text" onClick={autoFormatImported}><WandSparkles size={15}/><em>Auto format</em></button></span>}
        <span className="pdf-toolbar-group"><button type="button" aria-label="Copy selected element" title="Copy (Ctrl+C)" disabled={!selectedIds.length} onClick={copySelected}><Copy size={15}/></button><button type="button" aria-label="Duplicate selected element" title="Duplicate (Ctrl+D)" disabled={!selectedIds.length} onClick={duplicateSelected}><Plus size={15}/></button>{selectedIds.length > 1 && <output className="pdf-selection-count">{selectedIds.length} selected</output>}</span>
        <span className="pdf-toolbar-group zoom"><button type="button" aria-label="Zoom out" onClick={() => changeZoom(zoom - 10)}><ZoomOut size={15}/></button><output aria-label="Canvas zoom">{zoom}%</output><button type="button" aria-label="Zoom in" onClick={() => changeZoom(zoom + 10)}><ZoomIn size={15}/></button><button type="button" aria-label="Fit page" title="Fit page" onClick={fitPage}><Maximize2 size={15}/></button></span>
        <span className="pdf-toolbar-group pages"><button type="button" aria-label="Previous page" disabled={activePage === 0} onClick={() => jumpToPage(activePage - 1)}><ChevronLeft size={15}/></button><output>{activePage + 1} / {pages.length}</output><button type="button" aria-label="Next page" disabled={activePage >= pages.length - 1} onClick={() => jumpToPage(activePage + 1)}><ChevronRight size={15}/></button></span>
      </div>
    </div>
    <div className="pdf-canvas-stage">
      <nav className="pdf-page-thumbnails" aria-label="PDF pages">{pages.map((pageBlocks, pageIndex) => <div className={`pdf-page-thumbnail-item ${activePage === pageIndex ? 'active' : ''}`} draggable onDragStart={event => { event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('application/x-flowly-page', String(pageIndex)) }} onDragOver={event => { if (event.dataTransfer.types.includes('application/x-flowly-page')) event.preventDefault() }} onDrop={event => { const from = Number(event.dataTransfer.getData('application/x-flowly-page')); if (Number.isInteger(from)) movePage(from, pageIndex) }} key={pageIndex}><button type="button" className="pdf-page-thumbnail-select" aria-current={activePage === pageIndex ? 'page' : undefined} onClick={event => { event.stopPropagation(); jumpToPage(pageIndex) }}><span><i>{pageBlocks.filter(block => block.type !== 'pageBreak').slice(0, 6).map((_, index) => <b key={index}/>)}</i></span><strong>Page {pageIndex + 1}</strong></button><div className="pdf-page-thumbnail-actions"><button type="button" title={`Duplicate page ${pageIndex + 1}`} aria-label={`Duplicate page ${pageIndex + 1}`} onClick={() => duplicatePage(pageIndex)}><Copy size={11}/></button><button type="button" title={`Delete page ${pageIndex + 1}`} aria-label={`Delete page ${pageIndex + 1}`} disabled={pages.length === 1} onClick={() => deletePage(pageIndex)}><Trash2 size={11}/></button><span title="Drag to reorder"><GripVertical size={11}/></span></div></div>)}</nav>
      <div className="pdf-studio-pages" style={{ zoom: zoom / 100 }}>{pages.map((pageBlocks, pageIndex) => {
      const flowBlocks = pageBlocks.filter(block => !block.isFree)
      const freeBlocks = pageBlocks.filter(block => block.isFree)
      const pageGuides = alignmentGuides?.pageIndex === pageIndex ? alignmentGuides : null
      const crossPageGhosts = Object.entries(dragPreview?.positions || {}).filter(([, position]) => Number(position.pageIndex) === pageIndex && !pageBlocks.some(block => String(block.sourceId || block.id) === String(position.id))).map(([id, position]) => ({ id, position, block: blocks.find(block => String(block.id) === String(id)), size: dragPreview?.sizes?.[id] }))
      const footerColumns = Object.fromEntries(Object.entries(footerFields).map(([position, value]) => [position, footerTextForPage(value, pageIndex + 1).trim()]))
      const hasCustomFooter = Object.values(footerColumns).some(Boolean)
      return <section className="pdf-studio-page-wrap" ref={element => { pageRefs.current[pageIndex] = element }} key={pageIndex}><span>PAGE {pageIndex + 1}</span><div data-page-index={pageIndex} className={`pdf-studio-page ${hasCustomFooter ? 'has-custom-footer' : ''} ${selectionMarquee?.pageIndex === pageIndex ? 'marquee-active' : ''} ${dragPreview?.targetPageIndex === pageIndex ? 'pointer-drop-target' : ''}`} style={{ background: pageColor }} onPointerDown={event => { setActivePage(pageIndex); beginMarquee(event, pageIndex) }} onPointerMove={moveMarquee} onPointerUp={finishMarquee} onPointerCancel={cancelMarquee} onDragOver={event => { event.preventDefault(); event.currentTarget.classList.add('drop-ready'); previewDrop(event, pageIndex) }} onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget)) { event.currentTarget.classList.remove('drop-ready'); clearGuides() } }} onDrop={event => { event.currentTarget.classList.remove('drop-ready'); dropOnPage(event, pageIndex) }}>
        {pageGuides?.x != null && <span className="pdf-alignment-guide vertical" style={{ left: `${pageGuides.x}%` }}><em>{pageGuides.xLabel}</em></span>}
        {pageGuides?.y != null && <span className="pdf-alignment-guide horizontal" style={{ top: `${pageGuides.y}%` }}><em>{pageGuides.yLabel}</em></span>}
        {selectionBounds.filter(bounds => bounds.pageIndex === pageIndex).map(bounds => <span className="pdf-multi-selection-box" style={{ left: `${bounds.left}%`, top: `${bounds.top}%`, width: `${bounds.width}%`, height: `${bounds.height}%` }} key={`${bounds.pageIndex}-${bounds.count}`}><em>{bounds.count} selected</em></span>)}
        {selectionMarquee?.pageIndex === pageIndex && <span className="pdf-selection-marquee" style={selectionMarquee.style}/>}
        <div className="pdf-canvas-flow">{flowBlocks.map((block, index) => {
          const dedicatedRow = block.type === 'divider'
          return <Fragment key={`${block.sourceId || block.id}-${index}`}>{(block.newRow || dedicatedRow) && <span className="pdf-row-break"/>}{renderBlock(block, index, '', pageIndex)}{dedicatedRow && <span className="pdf-row-break"/>}</Fragment>
        })}{!pageBlocks.length && <div className="pdf-studio-page-empty"><Plus size={20}/><strong>Drop a component here</strong></div>}</div>
        {freeBlocks.map((block, index) => renderBlock(block, index, 'free-', pageIndex))}
        {crossPageGhosts.map(({ id, position, block, size }) => <div className="pdf-cross-page-ghost" style={{ left: `calc(var(--pdf-page-padding-left) + (100% - var(--pdf-page-padding-x)) * ${position.x / 100})`, top: `calc(var(--pdf-page-padding-top) + (100% - var(--pdf-page-padding-y)) * ${position.y / 100})`, width: `calc((100% - var(--pdf-page-padding-x)) * ${Math.max(10, Math.min(100, Number(block?.blockWidth) || 100)) / 100})`, height: `calc((100% - var(--pdf-page-padding-y)) * ${Math.max(2, Number(size?.heightPercent) || 8) / 100})` }} key={`drag-ghost-${id}`}><span>{block ? layerName(block) : 'Element'}</span></div>)}
        {hasCustomFooter ? <footer className="custom-section">{['left', 'center', 'right'].map(position => <span className={position} key={position}>{footerColumns[position]}</span>)}</footer> : <footer>Created with Flowly PDF Maker <span>Page {pageIndex + 1}</span></footer>}
      </div></section>
      })}</div>
    </div>
  </main>
}

export default function PdfMaker({ onExit }) {
  const [title, setTitle] = useState('Untitled document')
  const [downloadOpen, setDownloadOpen] = useState(false)
  const [projectsOpen, setProjectsOpen] = useState(false)
  const [projectsTab, setProjectsTab] = useState('saved')
  const [savedProjects, setSavedProjects] = useState([])
  const [activeProjectId, setActiveProjectId] = useState(null)
  const [projectBusy, setProjectBusy] = useState(false)
  const [projectError, setProjectError] = useState('')
  const [renamingProjectId, setRenamingProjectId] = useState(null)
  const [projectNameDraft, setProjectNameDraft] = useState('')
  const [includeWatermark, setIncludeWatermark] = useState(true)
  const [pageColor, setPageColor] = useState('#f7f7f2')
  const [footerFields, setFooterFields] = useState({ left: '', center: '', right: '' })
  const [blocks, setBlocks] = useState(starterBlocks)
  const [selectedId, setSelectedIdState] = useState(null)
  const [selectedIds, setSelectedIds] = useState([])
  const [inspectorCollapsed, setInspectorCollapsed] = useState(false)
  const [alignmentGuides, setAlignmentGuides] = useState(null)
  const [dragPreview, setDragPreview] = useState(null)
  const [resizePreview, setResizePreview] = useState(null)
  const [leftPanel, setLeftPanel] = useState('components')
  const [imageError, setImageError] = useState('')
  const [pdfImportStatus, setPdfImportStatus] = useState('')
  const [pdfImportError, setPdfImportError] = useState('')
  const [pdfImporting, setPdfImporting] = useState(false)
  const [customFonts, setCustomFonts] = useState([])
  const [fontError, setFontError] = useState('')
  const [exporting, setExporting] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [zoom, setZoom] = useState(100)
  const [activePage, setActivePage] = useState(0)
  const [saveStatus, setSaveStatus] = useState('Checking for saved work…')
  const [recoveryDraft, setRecoveryDraft] = useState(null)
  const [recoveryOpen, setRecoveryOpen] = useState(false)
  const [draftReady, setDraftReady] = useState(false)
  const [historyVersion, setHistoryVersion] = useState(0)
  const pointerDrag = useRef(null)
  const pointerResize = useRef(null)
  const suppressCanvasClear = useRef(false)
  const imageUploadRef = useRef(null)
  const pdfUploadRef = useRef(null)
  const imageReplaceTarget = useRef(null)
  const shapeUploadRef = useRef(null)
  const shapeUploadTarget = useRef(null)
  const fontUploadRef = useRef(null)
  const fontTarget = useRef(null)
  const projectImportRef = useRef(null)
  const historyRef = useRef({ past: [], future: [] })
  const lastSnapshotRef = useRef('')
  const clipboardBlock = useRef(null)

  useEffect(() => {
    let active = true
    readSavedDraft().then(saved => {
      if (!active) return
      const meaningful = saved && (saved.blocks?.length || saved.title !== 'Untitled document' || saved.pageColor !== '#f7f7f2' || Object.values(saved.footerFields || {}).some(value => String(value || '').trim()))
      if (meaningful) {
        setRecoveryDraft(saved)
        setRecoveryOpen(true)
        setSaveStatus('Saved draft found')
      } else {
        setDraftReady(true)
        setSaveStatus('Ready')
      }
    }).catch(() => {
      if (!active) return
      setDraftReady(true)
      setSaveStatus('Local save unavailable')
    })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!downloadOpen) return undefined
    const closeOnEscape = event => { if (event.key === 'Escape') setDownloadOpen(false) }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [downloadOpen])
  useEffect(() => {
    if (!projectsOpen) return undefined
    const closeOnEscape = event => { if (event.key === 'Escape') setProjectsOpen(false) }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [projectsOpen])
  const setSelectedId = (id, element = null, additive = false) => {
    setEditingId(current => current != null && current !== id ? null : current)
    if (id == null || id !== selectedId) setInspectorCollapsed(false)
    if (id == null) {
      setSelectedIdState(null)
      setSelectedIds([])
    } else {
      const target = blocks.find(block => block.id === id)
      const relatedIds = target?.groupId ? blocks.filter(block => block.groupId === target.groupId).map(block => block.id) : [id]
      if (additive) {
        setSelectedIds(current => {
          const removing = relatedIds.every(relatedId => current.includes(relatedId))
          const next = removing ? current.filter(currentId => !relatedIds.includes(currentId)) : [...new Set([...current, ...relatedIds])]
          setSelectedIdState(next.includes(id) ? id : next.at(-1) || null)
          return next
        })
      } else {
        setSelectedIdState(id)
        setSelectedIds(relatedIds)
      }
    }
    if (id == null || !element) {
      setAlignmentGuides(null)
      return
    }
    const page = element.closest('.pdf-studio-page')
    if (!page) return
    const box = pageContentBox(page)
    const rect = element.getBoundingClientRect()
    setAlignmentGuides(findAlignmentGuides({
      page,
      pageIndex: Number(page.dataset.pageIndex) || 0,
      movingElement: element,
      left: rect.left - box.left,
      top: rect.top - box.top,
      width: rect.width,
      height: rect.height,
    }))
  }
  const selectByMarquee = (ids, additive = false) => {
    const requestedIds = new Set(ids.map(String))
    const expandedIds = []
    blocks.forEach(block => {
      if (!requestedIds.has(String(block.id))) return
      if (block.groupId) blocks.filter(member => member.groupId === block.groupId).forEach(member => expandedIds.push(member.id))
      else expandedIds.push(block.id)
    })
    setEditingId(null)
    setAlignmentGuides(null)
    setSelectedIds(current => {
      const next = additive ? [...new Set([...current, ...expandedIds])] : [...new Set(expandedIds)]
      setSelectedIdState(next.at(-1) || null)
      if (next.length) setInspectorCollapsed(false)
      return next
    })
  }
  const selected = selectedIds.length === 1 ? blocks.find(block => block.id === selectedId) || null : null
  const documentData = useMemo(() => ({ title, pageColor, blocks, footerFields, customFonts }), [title, pageColor, blocks, footerFields, customFonts])
  const applyDocument = snapshot => {
    setTitle(snapshot.title || 'Untitled document')
    setPageColor(snapshot.pageColor || '#f7f7f2')
    setBlocks(Array.isArray(snapshot.blocks) ? withUniqueBlockIds(cloneDocument(snapshot.blocks)) : [])
    setFooterFields({ left: '', center: '', right: '', ...(snapshot.footerFields || {}) })
    setCustomFonts(restoreCustomFonts(snapshot.customFonts))
    setSelectedIdState(null)
    setSelectedIds([])
    setEditingId(null)
  }
  const resetHistory = snapshot => {
    historyRef.current = { past: [], future: [] }
    lastSnapshotRef.current = JSON.stringify(snapshot)
    setHistoryVersion(value => value + 1)
  }
  const refreshProjects = async () => {
    try {
      setSavedProjects(await readSavedProjects())
      setProjectError('')
    } catch {
      setProjectError('Saved projects are unavailable in this browser.')
    }
  }
  const openProjects = () => {
    setProjectsOpen(true)
    setProjectsTab('saved')
    refreshProjects()
  }
  const saveCurrentProject = async () => {
    setProjectBusy(true)
    setProjectError('')
    try {
      const id = activeProjectId || `flowly-project-${Date.now().toString(36)}`
      const now = Date.now()
      const existing = savedProjects.find(project => project.id === id)
      await writeSavedProject({ id, name: title.trim() || 'Untitled project', createdAt: existing?.createdAt || now, updatedAt: now, document: cloneDocument(documentData), version: 1 })
      setActiveProjectId(id)
      await refreshProjects()
      setSaveStatus('Project saved')
    } catch {
      setProjectError('This project could not be saved locally.')
    } finally {
      setProjectBusy(false)
    }
  }
  const loadProject = project => {
    const snapshot = project.document || project
    applyDocument(snapshot)
    resetHistory(snapshot)
    setActiveProjectId(project.id || null)
    setProjectsOpen(false)
    setSaveStatus('Project opened')
  }
  const duplicateProject = async project => {
    setProjectBusy(true)
    try {
      const now = Date.now()
      await writeSavedProject({ ...cloneDocument(project), id: `flowly-project-${now.toString(36)}`, name: `${project.name || project.document?.title || 'Project'} copy`, createdAt: now, updatedAt: now })
      await refreshProjects()
    } catch {
      setProjectError('This project could not be duplicated.')
    } finally {
      setProjectBusy(false)
    }
  }
  const renameProject = async project => {
    const name = projectNameDraft.trim()
    if (!name) return
    setProjectBusy(true)
    try {
      const updated = { ...project, name, updatedAt: Date.now(), document: { ...project.document, title: name } }
      await writeSavedProject(updated)
      if (activeProjectId === project.id) setTitle(name)
      setRenamingProjectId(null)
      setProjectNameDraft('')
      await refreshProjects()
    } catch {
      setProjectError('This project could not be renamed.')
    } finally {
      setProjectBusy(false)
    }
  }
  const removeSavedProject = async project => {
    setProjectBusy(true)
    try {
      await deleteSavedProject(project.id)
      if (activeProjectId === project.id) setActiveProjectId(null)
      await refreshProjects()
    } catch {
      setProjectError('This project could not be deleted.')
    } finally {
      setProjectBusy(false)
    }
  }
  const exportProjectFile = project => {
    const payload = project?.document ? project : { id: activeProjectId, name: title.trim() || 'Untitled project', document: cloneDocument(documentData), version: 1 }
    const blob = new Blob([JSON.stringify({ format: 'flowly-pdf-project', version: 1, ...payload }, null, 2)], { type: 'application/json' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${String(payload.name || payload.document?.title || 'flowly-project').replace(/[\\/:*?"<>|]+/g, '-').trim() || 'flowly-project'}.flowly`
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(link.href), 1000)
  }
  const importProjectFile = async event => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setProjectBusy(true)
    setProjectError('')
    try {
      const parsed = JSON.parse(await file.text())
      const snapshot = parsed.document || parsed
      if (!Array.isArray(snapshot.blocks)) throw new Error('Invalid project')
      const now = Date.now()
      const project = { id: `flowly-project-${now.toString(36)}`, name: parsed.name || snapshot.title || file.name.replace(/\.flowly$|\.json$/i, ''), createdAt: now, updatedAt: now, document: { title: snapshot.title || 'Imported project', pageColor: snapshot.pageColor || '#f7f7f2', footerFields: { left: '', center: '', right: '', ...(snapshot.footerFields || {}) }, blocks: withUniqueBlockIds(cloneDocument(snapshot.blocks)) }, version: 1 }
      await writeSavedProject(project)
      await refreshProjects()
      loadProject(project)
    } catch {
      setProjectError('Choose a valid Flowly project file.')
    } finally {
      setProjectBusy(false)
    }
  }
  const useTemplate = template => {
    const snapshot = createTemplateDocument(template.id)
    applyDocument(snapshot)
    resetHistory(snapshot)
    setActiveProjectId(null)
    setProjectsOpen(false)
    setSaveStatus('Template ready')
  }
  const continueSavedDraft = () => {
    const snapshot = { title: recoveryDraft.title, pageColor: recoveryDraft.pageColor, blocks: withUniqueBlockIds(recoveryDraft.blocks), footerFields: recoveryDraft.footerFields }
    applyDocument(snapshot)
    resetHistory(snapshot)
    setRecoveryOpen(false)
    setActiveProjectId(null)
    setDraftReady(true)
    setSaveStatus('Recovered · Saved')
  }
  const startFreshDocument = async () => {
    const snapshot = { title: 'Untitled document', pageColor: '#f7f7f2', blocks: [], footerFields: { left: '', center: '', right: '' } }
    applyDocument(snapshot)
    resetHistory(snapshot)
    setRecoveryOpen(false)
    setRecoveryDraft(null)
    setActiveProjectId(null)
    setDraftReady(true)
    setSaveStatus('New document')
    try { await clearSavedDraft() } catch { setSaveStatus('Local save unavailable') }
  }
  useEffect(() => {
    if (!draftReady || recoveryOpen) return
    const serialized = JSON.stringify(documentData)
    if (!lastSnapshotRef.current) {
      lastSnapshotRef.current = serialized
      return
    }
    if (serialized === lastSnapshotRef.current) return
    historyRef.current.past.push(JSON.parse(lastSnapshotRef.current))
    if (historyRef.current.past.length > 100) historyRef.current.past.shift()
    historyRef.current.future = []
    lastSnapshotRef.current = serialized
    setHistoryVersion(value => value + 1)
  }, [documentData, draftReady, recoveryOpen])
  useEffect(() => {
    if (!draftReady || recoveryOpen) return undefined
    setSaveStatus('Saving…')
    const timeout = window.setTimeout(async () => {
      try {
        await writeSavedDraft({ ...cloneDocument(documentData), savedAt: Date.now(), version: 1 })
        if (activeProjectId) {
          const now = Date.now()
          await writeSavedProject({ id: activeProjectId, name: title.trim() || 'Untitled project', createdAt: savedProjects.find(project => project.id === activeProjectId)?.createdAt || now, updatedAt: now, document: cloneDocument(documentData), version: 1 })
        }
        setSaveStatus('Saved')
      } catch {
        setSaveStatus('Local save failed')
      }
    }, 650)
    return () => window.clearTimeout(timeout)
  }, [documentData, draftReady, recoveryOpen, activeProjectId])
  const undo = () => {
    const previous = historyRef.current.past.pop()
    if (!previous) return
    historyRef.current.future.unshift(cloneDocument(documentData))
    applyDocument(previous)
    lastSnapshotRef.current = JSON.stringify(previous)
    setHistoryVersion(value => value + 1)
  }
  const redo = () => {
    const next = historyRef.current.future.shift()
    if (!next) return
    historyRef.current.past.push(cloneDocument(documentData))
    applyDocument(next)
    lastSnapshotRef.current = JSON.stringify(next)
    setHistoryVersion(value => value + 1)
  }
  const confirmDownload = async event => {
    event.preventDefault()
    const pdfName = title.trim() || 'Untitled document'
    setTitle(pdfName)
    setExporting(true)
    try {
      const customFamilies = new Set(customFonts.map(font => font.value))
      const exportBlocks = await Promise.all(blocks.map(block => {
        if (block.type === 'text' && block.richHtml) return rasterizeRichTextBlock(block, pageColor)
        if (block.type === 'shape' && block.svgMarkup) return rasterizeSvgShape(block)
        if (customFamilies.has(block.fontFamily) && ['text', 'list'].includes(block.type)) return rasterizeCustomFontBlock(block, pageColor)
        return block
      }))
      downloadCustomPdf({ ...documentData, blocks: exportBlocks, title: pdfName, includeWatermark })
      setDownloadOpen(false)
    } finally {
      setExporting(false)
    }
  }
  const layerPages = useMemo(() => paginate(blocks).map(pageBlocks => {
    const seen = new Set()
    return pageBlocks.filter(block => { const id = block.sourceId || block.id; if (seen.has(id)) return false; seen.add(id); return true })
  }), [blocks])
  const visualBlocksForPage = pageIndex => {
    const page = document.querySelector(`.pdf-studio-page[data-page-index="${pageIndex}"]`)
    if (!page) return []
    const box = pageContentBox(page)
    const seen = new Set()
    return [...page.querySelectorAll('.pdf-canvas-block')].map(element => {
      const id = element.dataset.blockId
      if (!id || seen.has(id)) return null
      seen.add(id)
      const block = blocks.find(item => String(item.id) === id)
      if (!block || block.type === 'pageBreak') return null
      const rect = element.getBoundingClientRect()
      const width = Math.max(10, Math.min(100, Number(block.blockWidth) || rect.width / box.width * 100))
      return {
        block,
        freePosition: {
          pageIndex,
          x: Math.max(0, Math.min(100 - width, (rect.left - box.left) / box.width * 100)),
          y: Math.max(0, Math.min(100, (rect.top - box.top) / box.height * 100)),
        },
      }
    }).filter(Boolean)
  }
  const duplicatePage = pageIndex => {
    const pageItems = visualBlocksForPage(pageIndex)
    const targetPage = layerPages.length
    const groupMap = new Map()
    const copies = pageItems.map(({ block, freePosition }) => {
      const copy = { ...cloneDocument(block), id: nextId(), freePosition: { ...freePosition, pageIndex: targetPage }, position: 'custom' }
      if (block.groupId) {
        if (!groupMap.has(block.groupId)) groupMap.set(block.groupId, nextGroupId())
        copy.groupId = groupMap.get(block.groupId)
      }
      return copy
    })
    if (!copies.length) copies.push({ ...makeBlock('spacer'), height: 12, blockWidth: 10, freePosition: { pageIndex: targetPage, x: 0, y: 0 }, position: 'custom' })
    setBlocks(current => [...current, ...copies])
    setSelectedId(null)
    setActivePage(targetPage)
    requestAnimationFrame(() => document.querySelector(`.pdf-studio-page[data-page-index="${targetPage}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }
  const deletePage = pageIndex => {
    if (layerPages.length <= 1) return
    const ids = new Set(layerPages[pageIndex].map(block => block.sourceId || block.id))
    if (pageIndex === 0) {
      const nextBreak = layerPages[1]?.find(block => block.type === 'pageBreak')
      if (nextBreak) ids.add(nextBreak.sourceId || nextBreak.id)
    }
    setBlocks(current => current.filter(block => !ids.has(block.id)).map(block => block.freePosition && Number(block.freePosition.pageIndex) > pageIndex ? { ...block, freePosition: { ...block.freePosition, pageIndex: Number(block.freePosition.pageIndex) - 1 } } : block))
    setSelectedId(null)
    setActivePage(Math.max(0, Math.min(pageIndex, layerPages.length - 2)))
  }
  const movePage = (fromIndex, toIndex) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= layerPages.length || toIndex >= layerPages.length) return
    const visualPages = layerPages.map((_, pageIndex) => visualBlocksForPage(pageIndex))
    const [moved] = visualPages.splice(fromIndex, 1)
    visualPages.splice(toIndex, 0, moved)
    const ordered = []
    const included = new Set()
    visualPages.forEach((items, pageIndex) => items.forEach(({ block, freePosition }) => {
      if (included.has(block.id)) return
      included.add(block.id)
      ordered.push({ ...block, freePosition: { ...freePosition, pageIndex }, position: 'custom' })
    }))
    blocks.filter(block => block.type !== 'pageBreak' && !included.has(block.id)).forEach(block => ordered.push(block))
    setBlocks(ordered)
    setSelectedId(null)
    setActivePage(toIndex)
  }
  const duplicateElementToPage = (id, pageIndex) => {
    const source = blocks.find(block => block.id === id)
    if (!source || source.type === 'pageBreak') return
    const copy = { ...cloneDocument(source), id: nextId(), groupId: null, freePosition: { pageIndex, x: Number(source.freePosition?.x) || 0, y: Number(source.freePosition?.y) || 0 }, position: 'custom' }
    setBlocks(current => [...current, copy])
    setSelectedId(copy.id)
    setActivePage(pageIndex)
  }
  const update = (id, patch) => setBlocks(current => current.map(block => block.id === id ? { ...block, ...patch } : block))
  const inlineUpdate = (id, patch) => setBlocks(current => current.map(block => block.id === id ? { ...block, ...(typeof patch === 'function' ? patch(block) : patch) } : block))
  const alignOnPage = (id, axis, alignment) => {
    const block = blocks.find(item => item.id === id)
    if (!block?.freePosition || block.locked) return
    const element = [...document.querySelectorAll('.pdf-canvas-block')].find(item => item.dataset.blockId === String(id))
    const page = element?.closest('.pdf-studio-page')
    const box = page ? pageContentBox(page) : null
    const elementRect = element?.getBoundingClientRect()
    const widthPercent = Math.max(10, Math.min(100, Number(block.blockWidth) || 100))
    const heightPercent = box && elementRect ? Math.min(100, elementRect.height / box.height * 100) : 8
    const maximum = axis === 'horizontal' ? 100 - widthPercent : 100 - heightPercent
    const value = alignment === 'center' ? maximum / 2 : alignment === 'end' ? maximum : 0
    update(id, { freePosition: { ...block.freePosition, [axis === 'horizontal' ? 'x' : 'y']: Math.max(0, value) }, position: 'custom' })
  }
  const reorderLayer = (id, direction) => setBlocks(current => {
    const index = current.findIndex(block => block.id === id)
    if (index < 0) return current
    const next = [...current]
    const [block] = next.splice(index, 1)
    direction === 'front' ? next.push(block) : next.unshift(block)
    return next
  })
  const selectionMetrics = ids => ids.map(id => {
    const block = blocks.find(item => item.id === id)
    const element = [...document.querySelectorAll('.pdf-canvas-block')].find(item => item.dataset.blockId === String(id))
    const page = element?.closest('.pdf-studio-page')
    if (!block?.freePosition || !element || !page) return null
    const box = pageContentBox(page)
    const rect = element.getBoundingClientRect()
    return { id, pageIndex: Number(page.dataset.pageIndex) || 0, x: Number(block.freePosition.x) || 0, y: Number(block.freePosition.y) || 0, width: rect.width / box.width * 100, height: rect.height / box.height * 100 }
  }).filter(Boolean)
  const alignSelection = (axis, alignment) => {
    const metrics = selectionMetrics(selectedIds)
    const patches = new Map()
    for (const pageIndex of new Set(metrics.map(item => item.pageIndex))) {
      const pageItems = metrics.filter(item => item.pageIndex === pageIndex)
      if (pageItems.length < 2) continue
      const starts = pageItems.map(item => axis === 'horizontal' ? item.x : item.y)
      const ends = pageItems.map(item => axis === 'horizontal' ? item.x + item.width : item.y + item.height)
      const start = Math.min(...starts)
      const end = Math.max(...ends)
      const center = (start + end) / 2
      pageItems.forEach(item => patches.set(item.id, alignment === 'start' ? start : alignment === 'end' ? end - (axis === 'horizontal' ? item.width : item.height) : center - (axis === 'horizontal' ? item.width : item.height) / 2))
    }
    setBlocks(current => current.map(block => patches.has(block.id) ? { ...block, freePosition: { ...block.freePosition, [axis === 'horizontal' ? 'x' : 'y']: Math.max(0, patches.get(block.id)) }, position: 'custom' } : block))
  }
  const distributeSelection = axis => {
    const metrics = selectionMetrics(selectedIds)
    const patches = new Map()
    for (const pageIndex of new Set(metrics.map(item => item.pageIndex))) {
      const sizeKey = axis === 'horizontal' ? 'width' : 'height'
      const positionKey = axis === 'horizontal' ? 'x' : 'y'
      const pageItems = metrics.filter(item => item.pageIndex === pageIndex).sort((a, b) => a[positionKey] - b[positionKey])
      if (pageItems.length < 3) continue
      const firstCenter = pageItems[0][positionKey] + pageItems[0][sizeKey] / 2
      const lastCenter = pageItems.at(-1)[positionKey] + pageItems.at(-1)[sizeKey] / 2
      const centerStep = (lastCenter - firstCenter) / (pageItems.length - 1)
      pageItems.forEach((item, index) => {
        const maximum = Math.max(0, 100 - item[sizeKey])
        patches.set(item.id, Math.max(0, Math.min(maximum, firstCenter + centerStep * index - item[sizeKey] / 2)))
      })
    }
    setBlocks(current => current.map(block => patches.has(block.id) ? { ...block, freePosition: { ...block.freePosition, [axis === 'horizontal' ? 'x' : 'y']: patches.get(block.id) }, position: 'custom' } : block))
  }
  const groupSelection = () => {
    if (selectedIds.length < 2) return
    const groupId = nextGroupId()
    setBlocks(current => current.map(block => selectedIds.includes(block.id) ? { ...block, groupId } : block))
  }
  const ungroupSelection = () => setBlocks(current => current.map(block => selectedIds.includes(block.id) ? { ...block, groupId: null } : block))
  const lockSelection = () => {
    const shouldLock = !selectedIds.every(id => blocks.find(block => block.id === id)?.locked)
    setBlocks(current => current.map(block => selectedIds.includes(block.id) ? { ...block, locked: shouldLock } : block))
  }
  const deleteSelection = () => { setBlocks(current => current.filter(block => !selectedIds.includes(block.id) || block.locked)); setSelectedId(null) }
  const remove = id => { setBlocks(current => current.filter(block => block.id !== id)); setSelectedId(null) }
  const beginInlineEdit = id => {
    const block = blocks.find(item => item.id === id)
    if (!block || !['text', 'list', 'table'].includes(block.type) || block.locked) return
    setSelectedId(id)
    setEditingId(id)
  }
  const finishInlineEdit = (id, content) => {
    const value = typeof content === 'object' && content ? content : { text: content, html: '' }
    const normalized = String(value.text || '').replace(/\u00a0/g, ' ').replace(/\n{3,}/g, '\n\n').trimEnd()
    setEditingId(null)
    const richHtml = sanitizeRichHtml(value.html || plainTextHtml(normalized))
    update(id, { content: normalized, richHtml: richHtml === plainTextHtml(normalized) ? '' : richHtml })
  }
  const estimateCanvasHeight = block => {
    if (block.type === 'spacer') return Math.max(18, Math.max(12, Number(block.height) || 48) * .45) + 10
    if (block.type === 'shape') return Math.max(18, Math.max(18, (Number(block.height) || 72) * .45)) + 10
    if (block.type === 'image') return Math.max(70, Number(block.blockHeight) || Math.max(60, Number(block.height) || 170) * .45) + 10
    if (block.type === 'divider') return block.orientation === 'vertical' ? Math.max(32, Number(block.blockHeight) || Number(block.height) || 120) + 10 : 28
    return Math.max(36, estimateHeight(block))
  }
  const placeAtVisualBottom = block => {
    const pages = [...document.querySelectorAll('.pdf-studio-page')]
    const page = pages.at(-1)
    if (!page) return block
    const box = pageContentBox(page)
    const pageIndex = Number(page.dataset.pageIndex) || 0
    const pageBlocks = [...page.querySelectorAll('.pdf-canvas-block')]
    const lowestBottom = pageBlocks.reduce((bottom, element) => {
      const rect = element.getBoundingClientRect()
      return Math.max(bottom, rect.bottom - box.top)
    }, 0)
    const gap = 9
    const topAfterContent = pageBlocks.length ? lowestBottom + gap : 0
    const visualHeight = estimateCanvasHeight(block)
    const startsNewPage = topAfterContent + visualHeight > box.height - 8
    const top = startsNewPage ? 0 : Math.max(0, topAfterContent)
    return { ...block, freePosition: { pageIndex: startsNewPage ? pageIndex + 1 : pageIndex, x: 0, y: top / box.height * 100 } }
  }
  const copySelected = () => {
    const sources = blocks.filter(block => selectedIds.includes(block.id) && block.type !== 'pageBreak')
    if (!sources.length) return
    clipboardBlock.current = cloneDocument(sources)
    setSaveStatus(`${sources.length} ${sources.length === 1 ? 'element' : 'elements'} copied`)
  }
  const insertDuplicates = sources => {
    const validSources = (Array.isArray(sources) ? sources : [sources]).filter(source => source && source.type !== 'pageBreak')
    if (!validSources.length) return
    const groupMap = new Map()
    const copies = validSources.map(source => {
      const clone = { ...cloneDocument(source), id: nextId() }
      delete clone.sourceId
      delete clone.continued
      if (source.groupId) {
        if (!groupMap.has(source.groupId)) groupMap.set(source.groupId, nextGroupId())
        clone.groupId = groupMap.get(source.groupId)
      }
      return source.freePosition
        ? { ...clone, freePosition: { ...source.freePosition, x: Math.min(100 - Math.max(10, Number(source.blockWidth) || 100), (Number(source.freePosition.x) || 0) + 2), y: Math.min(94, (Number(source.freePosition.y) || 0) + 2) } }
        : placeAtVisualBottom(clone)
    })
    setBlocks(current => [...current, ...copies])
    setSelectedIds(copies.map(block => block.id))
    setSelectedIdState(copies.at(-1).id)
  }
  const duplicateSelected = () => insertDuplicates(blocks.filter(block => selectedIds.includes(block.id)))
  const pasteCopied = () => insertDuplicates(clipboardBlock.current)
  const addAt = (type, index) => {
    const createdBlock = makeBlock(type)
    const block = type !== 'pageBreak' && index == null ? placeAtVisualBottom(createdBlock) : createdBlock
    setBlocks(current => {
      const next = [...current]
      next.splice(index ?? next.length, 0, block)
      return next
    })
    setSelectedId(block.id)
  }
  const chooseImage = (replaceId = null) => {
    imageReplaceTarget.current = replaceId
    setImageError('')
    imageUploadRef.current?.click()
  }
  const chooseShapeSvg = id => {
    shapeUploadTarget.current = id
    setImageError('')
    shapeUploadRef.current?.click()
  }
  const uploadShapeSvg = async event => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      const svg = await loadSvgShapeFile(file)
      const id = shapeUploadTarget.current
      shapeUploadTarget.current = null
      if (!id) return
      update(id, { ...svg, shape: 'custom-svg', strokeWidth: 0, rotation: 0, flipX: false, flipY: false })
      setSelectedId(id)
    } catch (error) {
      shapeUploadTarget.current = null
      setImageError(error?.message || 'The SVG could not be added.')
    }
  }
  const uploadImage = async event => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      const image = await imageFileToJpeg(file)
      const targetId = imageReplaceTarget.current
      imageReplaceTarget.current = null
      if (targetId) {
        update(targetId, { ...image, alt: blocks.find(block => block.id === targetId)?.alt || file.name.replace(/\.[^.]+$/, '') })
        setSelectedId(targetId)
        return
      }
      const created = makeBlock('image')
      const ratio = image.imageHeight / Math.max(1, image.imageWidth)
      const prepared = { ...created, ...image, alt: file.name.replace(/\.[^.]+$/, ''), height: Math.max(90, Math.min(280, 260 * ratio)) }
      const block = placeAtVisualBottom(prepared)
      setBlocks(current => [...current, block])
      setSelectedId(block.id)
    } catch (error) {
      imageReplaceTarget.current = null
      setImageError(error?.message || 'The image could not be added.')
    }
  }
  const uploadPdf = async event => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setPdfImportError('')
    setPdfImportStatus('Opening PDF…')
    setPdfImporting(true)
    try {
      const pages = await renderPdfPages(file, setPdfImportStatus)
      const hasDocumentContent = blocks.some(block => block.type !== 'pageBreak')
      const firstPageIndex = hasDocumentContent ? layerPages.length : 0
      const importedBlocks = pages.flatMap((page, index) => {
        const pageIndex = firstPageIndex + index
        const pageWidth = 595
        const pageHeight = 842
        const contentLeft = 42
        const contentTop = 42
        const contentWidth = 511
        const contentHeight = 758
        const imageRatio = page.imageWidth / Math.max(1, page.imageHeight)
        const pageRatio = pageWidth / pageHeight
        const renderedWidth = imageRatio > pageRatio ? pageHeight * imageRatio : pageWidth
        const renderedHeight = imageRatio > pageRatio ? pageHeight : pageWidth / imageRatio
        const offsetX = (pageWidth - renderedWidth) / 2
        const offsetY = (pageHeight - renderedHeight) / 2
        const background = {
          ...makeBlock('image'),
          imageData: page.imageData,
          imageWidth: page.imageWidth,
          imageHeight: page.imageHeight,
          imageName: `${file.name} · page ${index + 1} graphics`,
          alt: `Imported PDF page ${index + 1} graphics`,
          fit: 'cover',
          opacity: 100,
          blockWidth: 100,
          blockHeight: pageHeight,
          height: pageHeight,
          padding: { ...emptyBoxSides },
          margin: { ...emptyBoxSides },
          border: { ...emptyBoxSides },
          locked: true,
          importedPdfPage: true,
          position: 'custom',
          freePosition: { pageIndex, x: 0, y: 0 },
        }
        const textBlocks = (page.textItems || []).map(item => {
          const textLeft = offsetX + item.left / page.imageWidth * renderedWidth
          const textTop = offsetY + item.top / page.imageHeight * renderedHeight
          const textWidth = item.width / page.imageWidth * renderedWidth
          const blockWidth = Math.max(10, Math.min(100, textWidth / contentWidth * 100 + 1.5))
          const x = Math.max(0, Math.min(100 - blockWidth, (textLeft - contentLeft) / contentWidth * 100))
          const y = Math.max(0, Math.min(99, (textTop - contentTop) / contentHeight * 100))
          const sourceFontSize = item.height / page.imageHeight * renderedHeight
          return {
            ...makeBlock('text'),
            content: item.value,
            fontSize: Math.max(8, Math.min(32, sourceFontSize)),
            fontFamily: item.fontFamily || 'Arial, Helvetica, sans-serif',
            bold: item.bold,
            lineHeight: 1.08,
            blockWidth,
            padding: { ...emptyBoxSides },
            margin: { ...emptyBoxSides },
            border: { ...emptyBoxSides },
            importedPdfText: true,
            position: 'custom',
            freePosition: { pageIndex, x, y },
          }
        })
        return [background, ...textBlocks]
      })
      const formattedBlocks = autoFormatImportedBlocks(importedBlocks)
      setBlocks(current => hasDocumentContent ? [...current, ...formattedBlocks] : formattedBlocks)
      if (!hasDocumentContent || title === 'Untitled document') setTitle(file.name.replace(/\.pdf$/i, '') || 'Imported PDF')
      setPageColor('#ffffff')
      setSelectedId(null)
      setActivePage(firstPageIndex)
      const textCount = pages.reduce((total, page) => total + (page.textItems?.length || 0), 0)
      setPdfImportStatus(`${pages.length} page${pages.length === 1 ? '' : 's'} imported and auto-formatted with ${textCount} editable text element${textCount === 1 ? '' : 's'}`)
      window.setTimeout(() => setPdfImportStatus(''), 4500)
      requestAnimationFrame(() => document.querySelector(`.pdf-studio-page[data-page-index="${firstPageIndex}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
    } catch (error) {
      setPdfImportStatus('')
      setPdfImportError(error?.message || 'This PDF could not be imported.')
    } finally {
      setPdfImporting(false)
    }
  }
  const autoFormatImported = () => {
    const count = blocks.filter(block => block.importedPdfText).length
    if (!count) return
    setBlocks(current => autoFormatImportedBlocks(current))
    setSelectedId(null)
    setPdfImportError('')
    setPdfImportStatus(`Auto-format applied to ${count} imported text element${count === 1 ? '' : 's'}`)
    window.setTimeout(() => setPdfImportStatus(''), 3500)
  }
  const chooseFont = id => {
    fontTarget.current = id
    setFontError('')
    fontUploadRef.current?.click()
  }
  const uploadFont = async event => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      const font = await loadCustomFontFile(file)
      setCustomFonts(current => [...current, font])
      if (fontTarget.current) update(fontTarget.current, { fontFamily: font.value })
      setSelectedId(fontTarget.current)
      fontTarget.current = null
    } catch (error) {
      fontTarget.current = null
      setFontError(error?.message || 'The font could not be loaded.')
    }
  }
  const readDrag = event => ({ type: event.dataTransfer.getData('application/x-flowly-tool'), movingId: event.dataTransfer.getData('application/x-flowly-block') || null })
  const calculateAtPoint = ({ page, pageIndex, source, movingId, clientX, clientY, offset = {} }) => {
    if (!source || source.type === 'pageBreak') return null
    const box = pageContentBox(page)
    const movingElement = movingId ? page.querySelector(`[data-block-id="${movingId}"]`) : null
    const movingRect = movingElement?.getBoundingClientRect()
    const widthPercent = Math.max(10, Math.min(100, Number(source.blockWidth) || 100))
    const movingWidth = Number(offset.width) || movingRect?.width || box.width * widthPercent / 100
    const movingHeight = Number(offset.height) || movingRect?.height || 56
    let left = clientX - box.left - (Number(offset.x) || 0)
    let top = clientY - box.top - (Number(offset.y) || 0)
    const x = Math.max(0, Math.min(100 - widthPercent, left / box.width * 100))
    const y = Math.max(0, Math.min(100 - movingHeight / box.height * 100, top / box.height * 100))
    left = box.width * x / 100
    top = box.height * y / 100
    return {
      freePosition: { pageIndex, x, y },
      guides: findAlignmentGuides({ page, pageIndex, movingElement, left, top, width: movingWidth, height: movingHeight }),
    }
  }
  const calculatePlacement = (event, pageIndex) => {
    const { type, movingId } = readDrag(event)
    const source = type ? { type, blockWidth: { text: 55, list: 55, table: 70, shape: 45, divider: 60 }[type] || 100 } : blocks.find(block => block.id === movingId)
    let offset = { x: 0, y: 0 }
    try { offset = JSON.parse(event.dataTransfer.getData('application/x-flowly-offset') || '{}') } catch { /* use zero offset */ }
    return calculateAtPoint({ page: event.currentTarget, pageIndex, source, movingId, clientX: event.clientX, clientY: event.clientY, offset })
  }
  const previewDrop = (event, pageIndex) => {
    const placement = calculatePlacement(event, pageIndex)
    setAlignmentGuides(placement?.guides || null)
  }
  const pageUnderPointer = (clientX, clientY) => {
    const pages = [...document.querySelectorAll('.pdf-studio-page')]
    return pages.find(page => {
      const rect = page.getBoundingClientRect()
      return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom
    }) || null
  }
  const scrollCanvasDuringDrag = (active, event) => {
    const canvas = active.canvas
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const edge = 64
    const visibleTop = Math.max(rect.top, 0)
    const visibleBottom = Math.min(rect.bottom, window.innerHeight)
    if (event.clientY > visibleBottom - edge) canvas.scrollTop += 22
    else if (event.clientY < visibleTop + edge) canvas.scrollTop -= 22
  }
  const pointerPlacement = (active, event, source) => {
    const targetPage = pageUnderPointer(event.clientX, event.clientY) || active.lastPage || active.page
    const targetPageIndex = Number(targetPage.dataset.pageIndex) || 0
    const placement = calculateAtPoint({ page: targetPage, pageIndex: targetPageIndex, source, movingId: active.id, clientX: event.clientX, clientY: event.clientY, offset: { ...active.offset, width: active.elementSize.width, height: active.elementSize.height } })
    if (placement) active.lastPage = targetPage
    return placement
  }
  const beginPointerDrag = (event, id) => {
    if (event.button !== 0) return
    const source = blocks.find(block => block.id === id)
    if (!source || source.locked || source.type === 'pageBreak') return
    const page = event.currentTarget.closest('.pdf-studio-page')
    if (!page) return
    const box = pageContentBox(page)
    const elementRect = event.currentTarget.getBoundingClientRect()
    const pageIndex = Number(page.dataset.pageIndex) || 0
    const relatedIds = selectedIds.includes(id)
      ? selectedIds
      : source.groupId
        ? blocks.filter(block => block.groupId === source.groupId).map(block => block.id)
        : [id]
    const memberIds = relatedIds.filter(memberId => {
      const member = blocks.find(block => block.id === memberId)
      const memberElement = [...page.querySelectorAll('.pdf-canvas-block')].find(element => element.dataset.blockId === String(memberId))
      return member && member.type !== 'pageBreak' && !member.locked && memberElement
    })
    const sizes = {}
    const basePositions = Object.fromEntries(memberIds.map(memberId => {
      const member = blocks.find(block => block.id === memberId)
      const memberElement = [...page.querySelectorAll('.pdf-canvas-block')].find(element => element.dataset.blockId === String(memberId))
      const rect = memberElement.getBoundingClientRect()
      sizes[memberId] = { width: rect.width, height: rect.height, heightPercent: rect.height / box.height * 100 }
      if (member.freePosition && (Number(member.freePosition.pageIndex) || 0) === pageIndex) return [memberId, { ...member.freePosition }]
      const width = Math.max(10, Math.min(100, Number(member.blockWidth) || 100))
      return [memberId, {
        pageIndex,
        x: Math.max(0, Math.min(100 - width, (rect.left - box.left) / box.width * 100)),
        y: Math.max(0, Math.min(100, (rect.top - box.top) / box.height * 100)),
      }]
    }))
    pointerDrag.current = { id, memberIds, basePositions, sizes, elementSize: sizes[id] || { width: elementRect.width, height: elementRect.height }, startedSelected: selectedIds.includes(id), pointerId: event.pointerId, page, lastPage: page, canvas: page.closest('.pdf-studio-canvas'), pageIndex, startX: event.clientX, startY: event.clientY, moved: false, offset: { x: event.clientX - elementRect.left, y: event.clientY - elementRect.top } }
    event.currentTarget.setPointerCapture(event.pointerId)
    event.preventDefault()
    event.stopPropagation()
  }
  const movePointerDrag = event => {
    const active = pointerDrag.current
    if (!active || active.pointerId !== event.pointerId) return
    if (!active.moved) {
      const distance = Math.hypot(event.clientX - active.startX, event.clientY - active.startY)
      if (distance < 5) return
      active.moved = true
    }
    scrollCanvasDuringDrag(active, event)
    const source = blocks.find(block => block.id === active.id)
    const placement = pointerPlacement(active, event, source)
    if (!placement) return
    event.preventDefault()
    const sourceStart = active.basePositions[active.id] || source.freePosition
    const xDelta = placement.freePosition.x - sourceStart.x
    const yDelta = placement.freePosition.y - sourceStart.y
    const positions = Object.fromEntries(active.memberIds.map(memberId => {
      const member = blocks.find(block => block.id === memberId)
      const start = active.basePositions[memberId]
      const maxX = 100 - Math.max(10, Math.min(100, Number(member?.blockWidth) || 100))
      return [memberId, { ...start, pageIndex: placement.freePosition.pageIndex, x: Math.max(0, Math.min(maxX, start.x + xDelta)), y: Math.max(0, Math.min(100, start.y + yDelta)) }]
    }))
    setDragPreview({ id: active.id, positions, sizes: active.sizes, targetPageIndex: placement.freePosition.pageIndex })
    setAlignmentGuides(placement.guides)
  }
  const endPointerDrag = event => {
    const active = pointerDrag.current
    if (!active || active.pointerId !== event.pointerId) return
    if (active.moved) {
      event.preventDefault()
      event.stopPropagation()
      suppressCanvasClear.current = true
      window.requestAnimationFrame(() => { suppressCanvasClear.current = false })
      const source = blocks.find(block => block.id === active.id)
      const placement = pointerPlacement(active, event, source)
      if (placement) {
        const sourceStart = active.basePositions[active.id] || source.freePosition
        const xDelta = placement.freePosition.x - sourceStart.x
        const yDelta = placement.freePosition.y - sourceStart.y
        setBlocks(current => current.map(block => {
          const start = active.basePositions[block.id]
          if (!start) return block
          const maxX = 100 - Math.max(10, Math.min(100, Number(block.blockWidth) || 100))
          return { ...block, freePosition: { ...start, pageIndex: placement.freePosition.pageIndex, x: Math.max(0, Math.min(maxX, start.x + xDelta)), y: Math.max(0, Math.min(100, start.y + yDelta)) }, position: 'custom' }
        }))
        setAlignmentGuides(placement.guides)
        setActivePage(placement.freePosition.pageIndex)
        if (!active.startedSelected) setSelectedId(active.id)
      }
    }
    pointerDrag.current = null
    setDragPreview(null)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }
  const cancelPointerDrag = event => {
    if (pointerDrag.current?.pointerId !== event.pointerId) return
    pointerDrag.current = null
    setDragPreview(null)
    setAlignmentGuides(null)
  }
  const beginPointerResize = (event, id, corner) => {
    if (event.button !== 0) return
    const source = blocks.find(block => block.id === id)
    const blockElement = event.currentTarget.closest('.pdf-canvas-block')
    const element = event.currentTarget.closest('.pdf-canvas-content-box')
    const page = event.currentTarget.closest('.pdf-studio-page')
    if (!source || source.locked || !blockElement || !element || !page) return
    const rect = element.getBoundingClientRect()
    const elementStyles = getComputedStyle(element)
    const marginLeft = parseFloat(elementStyles.marginLeft) || 0
    const marginRight = parseFloat(elementStyles.marginRight) || 0
    const marginTop = parseFloat(elementStyles.marginTop) || 0
    const marginBottom = parseFloat(elementStyles.marginBottom) || 0
    const box = pageContentBox(page)
    const pageWidth = box.width
    const pageHeight = box.height
    const left = rect.left - box.left
    const top = rect.top - box.top
    const widthPercent = (rect.width + marginLeft + marginRight) / pageWidth * 100
    const heightPercent = (rect.height + marginTop + marginBottom) / pageHeight * 100
    const freePosition = source.freePosition || {
      pageIndex: Number(page.dataset.pageIndex) || 0,
      x: Math.max(0, Math.min(100 - widthPercent, (left - marginLeft) / pageWidth * 100)),
      y: Math.max(0, Math.min(100 - heightPercent, (top - marginTop) / pageHeight * 100)),
    }
    pointerDrag.current = null
    setDragPreview(null)
    pointerResize.current = { id, pointerId: event.pointerId, corner, handle: event.currentTarget, page, pageIndex: Number(page.dataset.pageIndex) || 0, element, pageWidth, pageHeight, startX: event.clientX, startY: event.clientY, width: rect.width, height: rect.height, left, top, marginLeft, marginRight, marginTop, marginBottom, freePosition, isCircle: source.type === 'shape' && source.shape === 'circle', contentSized: ['text', 'list', 'table'].includes(source.type) || (source.type === 'divider' && source.orientation !== 'vertical'), originalBlockHeight: Math.max(0, Number(source.blockHeight) || 0), padding: resolvedElementPadding(source), border: { ...emptyBoxSides, ...(source.border || {}) }, minWidth: Math.min(pageWidth * .1, rect.width), minHeight: Math.min(24, rect.height), moved: false }
    event.currentTarget.setPointerCapture(event.pointerId)
    event.preventDefault()
    event.stopPropagation()
    setSelectedId(id)
  }
  const calculateResize = (active, event) => {
    const dx = event.clientX - active.startX
    const dy = event.clientY - active.startY
    const fromLeft = active.corner.includes('left')
    const fromTop = active.corner.includes('top')
    const clampTo = (value, min, max) => Math.max(min, Math.min(max, value))
    // Never make an element jump merely because its natural size is smaller
    // than the resize minimum. Short dividers/spacers were the main offenders.
    const minWidth = active.minWidth
    const minHeight = active.minHeight
    const fixedRight = active.left + active.width
    const fixedBottom = active.top + active.height
    let left = fromLeft
      ? clampTo(active.left + dx, 0, fixedRight - minWidth)
      : active.left
    let right = fromLeft
      ? fixedRight
      : clampTo(fixedRight + dx, active.left + minWidth, active.pageWidth)
    let top = fromTop
      ? clampTo(active.top + dy, 0, fixedBottom - minHeight)
      : active.top
    let bottom = fromTop
      ? fixedBottom
      : clampTo(fixedBottom + dy, active.top + minHeight, active.pageHeight)
    if (active.isCircle) {
      const horizontalSize = right - left
      const verticalSize = bottom - top
      const requestedSize = Math.abs(dx) >= Math.abs(dy) ? horizontalSize : verticalSize
      const maxHorizontal = fromLeft ? fixedRight : active.pageWidth - active.left
      const maxVertical = fromTop ? fixedBottom : active.pageHeight - active.top
      const side = clampTo(requestedSize, Math.max(active.minWidth, active.minHeight), Math.min(maxHorizontal, maxVertical))
      left = fromLeft ? fixedRight - side : active.left
      right = fromLeft ? fixedRight : active.left + side
      top = fromTop ? fixedBottom - side : active.top
      bottom = fromTop ? fixedBottom : active.top + side
    }
    const width = right - left
    const height = bottom - top
    const blockWidth = (width + active.marginLeft + active.marginRight) / active.pageWidth * 100
    let freePosition = active.freePosition
    if (freePosition) {
      const blockHeightPercent = (height + active.marginTop + active.marginBottom) / active.pageHeight * 100
      freePosition = { ...freePosition, x: Math.max(0, Math.min(100 - blockWidth, (left - active.marginLeft) / active.pageWidth * 100)), y: Math.max(0, Math.min(100 - blockHeightPercent, (top - active.marginTop) / active.pageHeight * 100)) }
    }
    return { id: active.id, blockWidth, blockHeight: height, freePosition, guides: findAlignmentGuides({ page: active.page, pageIndex: active.pageIndex, movingElement: active.element, left, top, width, height }) }
  }
  const movePointerResize = event => {
    const active = pointerResize.current
    if (!active || active.pointerId !== event.pointerId) return
    if (!active.moved) {
      const distance = Math.hypot(event.clientX - active.startX, event.clientY - active.startY)
      if (distance < 4) return
      active.moved = true
    }
    event.preventDefault()
    const result = calculateResize(active, event)
    setResizePreview(result)
    setAlignmentGuides(result.guides)
  }
  const endPointerResize = event => {
    const active = pointerResize.current
    if (!active || active.pointerId !== event.pointerId) return
    if (active.moved) {
      const result = calculateResize(active, event)
      const verticalChange = Math.abs(result.blockHeight - active.height)
      let sizePatch = { blockHeight: result.blockHeight }
      if (active.contentSized && verticalChange < 4) sizePatch = { blockHeight: active.originalBlockHeight }
      else if (active.contentSized) {
        const fromTop = active.corner.includes('top')
        const changedSide = fromTop ? 'top' : 'bottom'
        const oppositeSide = fromTop ? 'bottom' : 'top'
        const contentHeight = naturalContentHeight(active.element.firstElementChild)
        const borderHeight = Math.max(0, Number(active.border.top) || 0) + Math.max(0, Number(active.border.bottom) || 0)
        const oppositePadding = Math.max(0, Number(active.padding[oppositeSide]) || 0)
        const changedPadding = Math.max(0, Math.round(result.blockHeight - contentHeight - borderHeight - oppositePadding))
        sizePatch = { blockHeight: 0, boxModelVersion: 1, padding: { ...active.padding, [changedSide]: changedPadding } }
      }
      update(active.id, { blockWidth: result.blockWidth, ...sizePatch, ...(result.freePosition ? { freePosition: result.freePosition, position: 'custom' } : {}) })
      setAlignmentGuides(result.guides)
    }
    pointerResize.current = null
    setResizePreview(null)
    if (active.handle.hasPointerCapture(event.pointerId)) active.handle.releasePointerCapture(event.pointerId)
  }
  const cancelPointerResize = event => {
    if (pointerResize.current?.pointerId !== event.pointerId) return
    pointerResize.current = null
    setResizePreview(null)
  }
  const dropOnPage = (event, pageIndex) => {
    event.preventDefault()
    const { type, movingId } = readDrag(event)
    const placement = calculatePlacement(event, pageIndex)
    const source = type ? makeBlock(type) : blocks.find(block => block.id === movingId)
    setAlignmentGuides(placement?.guides || null)
    if (!source || source.type === 'pageBreak') { if (type) addAt(type); return }
    const freePosition = placement?.freePosition
    if (!freePosition) return
    if (type) { const block = { ...source, freePosition, position: 'custom' }; setBlocks(current => [...current, block]); setSelectedId(block.id) }
    else if (movingId) update(movingId, { freePosition, position: 'custom' })
  }
  const canUndo = historyVersion >= 0 && historyRef.current.past.length > 0
  const canRedo = historyVersion >= 0 && historyRef.current.future.length > 0
  useEffect(() => {
    const handleShortcuts = event => {
      const target = event.target
      const editingField = target instanceof HTMLElement && (target.matches('input, textarea, select') || target.isContentEditable)
      if (editingField) return
      const command = event.ctrlKey || event.metaKey
      const key = event.key.toLowerCase()
      if (command && key === 'z') { event.preventDefault(); event.shiftKey ? redo() : undo(); return }
      if (command && key === 'y') { event.preventDefault(); redo(); return }
      if (command && key === 'c' && selectedId) { event.preventDefault(); copySelected(); return }
      if (command && key === 'v' && clipboardBlock.current) { event.preventDefault(); pasteCopied(); return }
      if (command && key === 'd' && selectedId) { event.preventDefault(); duplicateSelected(); return }
      if (selectedId && ['arrowleft', 'arrowright', 'arrowup', 'arrowdown'].includes(key)) {
        const movableIds = selectedIds.filter(id => { const block = blocks.find(item => item.id === id); return block?.freePosition && !block.locked })
        if (!movableIds.length) return
        event.preventDefault()
        const step = event.shiftKey ? 5 : 1
        const xDelta = key === 'arrowleft' ? -step : key === 'arrowright' ? step : 0
        const yDelta = key === 'arrowup' ? -step : key === 'arrowdown' ? step : 0
        setBlocks(current => current.map(block => {
          if (!movableIds.includes(block.id)) return block
          const width = Math.max(10, Math.min(100, Number(block.blockWidth) || 100))
          return { ...block, freePosition: { ...block.freePosition, x: Math.max(0, Math.min(100 - width, (Number(block.freePosition.x) || 0) + xDelta)), y: Math.max(0, Math.min(100, (Number(block.freePosition.y) || 0) + yDelta)) }, position: 'custom' }
        }))
        return
      }
      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedId) { event.preventDefault(); deleteSelection() }
    }
    window.addEventListener('keydown', handleShortcuts)
    return () => window.removeEventListener('keydown', handleShortcuts)
  }, [selectedId, selectedIds, blocks, documentData, historyVersion])
  return <main className="pdf-studio">
    <header className="pdf-studio-header"><button type="button" onClick={onExit}><ArrowLeft size={17}/> Flowly</button><a href={routeUrl('/utilities/pdf-maker')}><span><FilePenLine size={18}/></span><h1><em>Free Online </em>PDF Maker</h1></a><div><span>{activeProjectId ? 'Project autosaved' : 'Created locally'}</span><input ref={pdfUploadRef} className="pdf-studio-file-input" type="file" accept=".pdf,application/pdf" onChange={uploadPdf}/><button type="button" className="pdf-import-button" title="Import PDF with editable text" disabled={pdfImporting} onClick={() => pdfUploadRef.current?.click()}><Upload size={16}/> {pdfImporting ? 'Importing…' : 'Import PDF'}</button><button type="button" className="pdf-projects-button" onClick={openProjects}><Layers3 size={16}/> Projects</button><button type="button" onClick={() => setDownloadOpen(true)}><Download size={16}/> Download PDF</button></div></header>
    {(pdfImportStatus || pdfImportError) && <div className={`pdf-import-notice ${pdfImportError ? 'error' : ''}`} role={pdfImportError ? 'alert' : 'status'}><strong>{pdfImportError ? 'PDF import failed' : 'PDF import'}</strong><span>{pdfImportError || pdfImportStatus}</span>{pdfImportError && <button type="button" aria-label="Dismiss PDF import error" onClick={() => setPdfImportError('')}>×</button>}</div>}
    <div className="pdf-studio-workspace">
      <aside className="pdf-studio-tools"><input ref={imageUploadRef} className="pdf-studio-file-input" type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml" onChange={uploadImage}/><input ref={shapeUploadRef} className="pdf-studio-file-input" type="file" accept=".svg,image/svg+xml" onChange={uploadShapeSvg}/><input ref={fontUploadRef} className="pdf-studio-file-input" type="file" accept=".ttf,.otf,.woff,.woff2,font/ttf,font/otf,font/woff,font/woff2" onChange={uploadFont}/><div className="pdf-studio-sidebar-tabs" role="tablist" aria-label="PDF Maker sidebar"><button type="button" role="tab" aria-selected={leftPanel === 'components'} className={leftPanel === 'components' ? 'active' : ''} onClick={() => setLeftPanel('components')}><Plus size={15}/> Add</button><button type="button" role="tab" aria-selected={leftPanel === 'layers'} className={leftPanel === 'layers' ? 'active' : ''} onClick={() => setLeftPanel('layers')}><Layers3 size={15}/> Layers</button></div>{leftPanel === 'components' ? <><div className="pdf-studio-panel-title"><span>COMPONENTS</span><h2>Add to page</h2><p>Click to add at the bottom, or drag onto an exact position.</p></div><div className="pdf-studio-tool-list">{tools.map(({ type, label, hint, Icon }) => <button type="button" draggable={type !== 'image'} onDragStart={event => { if (type === 'image') return; event.dataTransfer.effectAllowed = 'copy'; event.dataTransfer.setData('application/x-flowly-tool', type) }} onClick={() => type === 'image' ? chooseImage() : addAt(type)} key={type}><span><Icon size={18}/></span><div><strong>{label}</strong><small>{hint}</small></div>{type === 'image' ? <Upload size={15}/> : <GripVertical size={15}/>}</button>)}</div>{imageError && <p className="pdf-studio-upload-error" role="alert">{imageError}</p>}<div className="pdf-studio-tip"><strong>Select and align</strong><p>Drag across empty page space to select several elements. Blue and red guides suggest matching edges and centres without moving anything automatically.</p></div></> : <LayersPanel pages={layerPages} selectedId={selectedId} selectedIds={selectedIds} select={setSelectedId} update={update} remove={remove}/>}</aside>
      <Canvas pageColor={pageColor} blocks={blocks} footerFields={footerFields} selectedId={selectedId} selectedIds={selectedIds} editingId={editingId} setSelectedId={setSelectedId} selectByMarquee={selectByMarquee} removeBlock={remove} suppressCanvasClear={suppressCanvasClear} beginInlineEdit={beginInlineEdit} finishInlineEdit={finishInlineEdit} endInlineEdit={() => setEditingId(null)} inlineUpdate={inlineUpdate} dropOnPage={dropOnPage} previewDrop={previewDrop} clearGuides={() => setAlignmentGuides(null)} alignmentGuides={alignmentGuides} dragPreview={dragPreview} resizePreview={resizePreview} onPointerStart={beginPointerDrag} onPointerMove={event => { movePointerDrag(event); movePointerResize(event) }} onPointerEnd={event => { endPointerDrag(event); endPointerResize(event) }} onPointerCancel={event => { cancelPointerDrag(event); cancelPointerResize(event) }} onResizeStart={beginPointerResize} zoom={zoom} setZoom={setZoom} activePage={activePage} setActivePage={setActivePage} undo={undo} redo={redo} canUndo={canUndo} canRedo={canRedo} copySelected={copySelected} duplicateSelected={duplicateSelected} duplicatePage={duplicatePage} deletePage={deletePage} movePage={movePage} hasImportedText={blocks.some(block => block.importedPdfText)} autoFormatImported={autoFormatImported} saveStatus={saveStatus}/>
      {selectedIds.length > 1
        ? <MultiSelectionPanel count={selectedIds.length} grouped={selectedIds.every(id => blocks.find(block => block.id === id)?.groupId && blocks.find(block => block.id === id)?.groupId === blocks.find(block => block.id === selectedIds[0])?.groupId)} allLocked={selectedIds.every(id => blocks.find(block => block.id === id)?.locked)} alignSelection={alignSelection} distributeSelection={distributeSelection} groupSelection={groupSelection} ungroupSelection={ungroupSelection} lockSelection={lockSelection} duplicateSelection={duplicateSelected} deleteSelection={deleteSelection}/>
        : <Inspector block={selected} update={update} remove={remove} title={title} setTitle={setTitle} pageColor={pageColor} setPageColor={setPageColor} footerFields={footerFields} setFooterFields={setFooterFields} close={() => setSelectedId(null)} collapsed={inspectorCollapsed} toggleCollapsed={() => setInspectorCollapsed(value => !value)} chooseImage={chooseImage} chooseShapeSvg={chooseShapeSvg} customFonts={customFonts} chooseFont={chooseFont} fontError={fontError} alignOnPage={alignOnPage} reorderLayer={reorderLayer} pageCount={layerPages.length} currentPageIndex={selected ? layerPages.findIndex(page => page.some(block => (block.sourceId || block.id) === selected.id)) : -1} duplicateElementToPage={duplicateElementToPage}/>}
    </div>
    {projectsOpen && <div className="pdf-projects-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setProjectsOpen(false) }}>
      <section className="pdf-projects-dialog" role="dialog" aria-modal="true" aria-labelledby="pdf-projects-title">
        <div className="pdf-projects-head"><div><span><Layers3 size={20}/></span><div><p>YOUR WORKSPACE</p><h2 id="pdf-projects-title">Projects and templates</h2></div></div><button type="button" aria-label="Close projects" onClick={() => setProjectsOpen(false)}>×</button></div>
        <div className="pdf-project-tabs" role="tablist" aria-label="Projects and templates"><button type="button" role="tab" aria-selected={projectsTab === 'saved'} className={projectsTab === 'saved' ? 'active' : ''} onClick={() => setProjectsTab('saved')}>Saved projects <small>{savedProjects.length}</small></button><button type="button" role="tab" aria-selected={projectsTab === 'templates'} className={projectsTab === 'templates' ? 'active' : ''} onClick={() => setProjectsTab('templates')}>Templates <small>{projectTemplates.length}</small></button></div>
        {projectsTab === 'saved' ? <div className="pdf-projects-content">
          <input ref={projectImportRef} className="pdf-studio-file-input" type="file" accept=".flowly,.json,application/json" onChange={importProjectFile}/>
          <div className="pdf-project-actions"><button type="button" className="primary" disabled={projectBusy} onClick={saveCurrentProject}><FilePenLine size={15}/> {activeProjectId ? 'Save project now' : 'Save current as project'}</button><button type="button" disabled={projectBusy} onClick={() => projectImportRef.current?.click()}><Upload size={15}/> Import .flowly</button><button type="button" onClick={() => exportProjectFile()}><Download size={15}/> Export current</button></div>
          {projectError && <p className="pdf-project-error" role="alert">{projectError}</p>}
          {!savedProjects.length ? <div className="pdf-project-empty"><Layers3 size={25}/><strong>No saved projects yet</strong><p>Save the current document or begin with a template. Everything stays in this browser.</p><button type="button" onClick={() => setProjectsTab('templates')}>Browse templates</button></div> : <div className="pdf-project-list">{savedProjects.map(project => <article className={activeProjectId === project.id ? 'active' : ''} key={project.id}><div className="pdf-project-thumb"><span>{project.document?.blocks?.length || 0}</span><small>elements</small></div><div>{renamingProjectId === project.id ? <form className="pdf-project-rename" onSubmit={event => { event.preventDefault(); renameProject(project) }}><input autoFocus aria-label="Project name" value={projectNameDraft} onChange={event => setProjectNameDraft(event.target.value)}/><button type="submit" disabled={!projectNameDraft.trim() || projectBusy}>Save</button><button type="button" onClick={() => setRenamingProjectId(null)}>Cancel</button></form> : <><strong>{project.name || project.document?.title || 'Untitled project'}</strong><span>{new Date(project.updatedAt || project.createdAt || Date.now()).toLocaleString()}</span>{activeProjectId === project.id && <em>Open now</em>}</>}</div><div className="pdf-project-row-actions"><button type="button" className="open" onClick={() => loadProject(project)}>Open</button><button type="button" className="rename" disabled={projectBusy} onClick={() => { setRenamingProjectId(project.id); setProjectNameDraft(project.name || project.document?.title || 'Untitled project') }}>Rename</button><button type="button" aria-label={`Export ${project.name}`} title="Export project" onClick={() => exportProjectFile(project)}><Download size={14}/></button><button type="button" aria-label={`Duplicate ${project.name}`} title="Duplicate project" disabled={projectBusy} onClick={() => duplicateProject(project)}><Copy size={14}/></button><button type="button" className="delete" aria-label={`Delete ${project.name}`} title="Delete project" disabled={projectBusy} onClick={() => { if (window.confirm(`Delete “${project.name || 'this project'}”? This cannot be undone.`)) removeSavedProject(project) }}><Trash2 size={14}/></button></div></article>)}</div>}
        </div> : <div className="pdf-template-grid">{projectTemplates.map(template => <article style={{ '--template-accent': template.accent }} key={template.id}><div className="pdf-template-preview"><span/><span/><span/></div><div><strong>{template.name}</strong><p>{template.description}</p></div><button type="button" onClick={() => useTemplate(template)}>Use template</button></article>)}</div>}
        <footer><span><Lock size={14}/> Projects are stored only in this browser.</span><button type="button" onClick={() => setProjectsOpen(false)}>Close</button></footer>
      </section>
    </div>}
    {downloadOpen && <div className="pdf-download-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setDownloadOpen(false) }}>
      <form className="pdf-download-dialog" role="dialog" aria-modal="true" aria-labelledby="pdf-download-title" onSubmit={confirmDownload}>
        <div className="pdf-download-dialog-head"><span><Download size={18}/></span><button type="button" aria-label="Close download dialog" onClick={() => setDownloadOpen(false)}>×</button></div>
        <p className="pdf-download-kicker">READY TO EXPORT</p>
        <h2 id="pdf-download-title">Download your PDF</h2>
        <p>Choose the file name and whether Flowly’s small footer should appear on every page.</p>
        <label>PDF name<div className="pdf-download-name"><input autoFocus value={title} placeholder="Untitled document" onChange={event => setTitle(event.target.value)}/><span>.pdf</span></div></label>
        <label className="pdf-download-watermark"><input type="checkbox" checked={includeWatermark} onChange={event => setIncludeWatermark(event.target.checked)}/><span><strong>Include Flowly watermark</strong><small>Shows “Created with Flowly PDF Maker” and the page number in the footer.</small></span></label>
        <div className={`pdf-download-preview ${includeWatermark ? '' : 'removed'}`}>{includeWatermark ? <><span>Created with Flowly PDF Maker</span><em>Page 1</em></> : <span>Watermark will not be included</span>}</div>
        <div className="pdf-download-actions"><button type="button" disabled={exporting} onClick={() => setDownloadOpen(false)}>Cancel</button><button type="submit" disabled={exporting}><Download size={16}/> {exporting ? 'Preparing…' : 'Download PDF'}</button></div>
      </form>
    </div>}
    {recoveryOpen && <div className="pdf-recovery-backdrop" role="presentation">
      <section className="pdf-recovery-dialog" role="dialog" aria-modal="true" aria-labelledby="pdf-recovery-title">
        <span className="pdf-recovery-icon"><FilePenLine size={24}/></span>
        <p>SAVED IN THIS BROWSER</p>
        <h2 id="pdf-recovery-title">Continue your previous PDF?</h2>
        <p>Flowly found a locally saved draft with {recoveryDraft?.blocks?.length || 0} {(recoveryDraft?.blocks?.length || 0) === 1 ? 'element' : 'elements'}{recoveryDraft?.savedAt ? `, saved ${new Date(recoveryDraft.savedAt).toLocaleString()}` : ''}.</p>
        <div><button type="button" onClick={startFreshDocument}>Start new</button><button type="button" className="primary" autoFocus onClick={continueSavedDraft}>Continue draft</button></div>
      </section>
    </div>}
  </main>
}
