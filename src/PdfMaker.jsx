import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { AlignCenter, AlignLeft, AlignRight, ArrowLeft, Bold, Check, ChevronDown, Download, FilePenLine, GripVertical, Layers3, List, Lock, Minus, MoveVertical, Plus, RectangleHorizontal, Rows3, Table2, Trash2, Type, Unlock } from 'lucide-react'
import { routeUrl } from './navigation.js'
import { downloadCustomPdf } from './pdfMakerPdf.js'
import './pdf-maker-studio.css'
import './pdf-maker-studio-overrides.css'

const nextId = (() => { let value = 30; return () => ++value })()
const starterBlocks = []
const tools = [
  { type: 'text', label: 'Text', hint: 'Heading or paragraph', Icon: Type },
  { type: 'list', label: 'List', hint: 'Bullets or numbering', Icon: List },
  { type: 'table', label: 'Table', hint: 'Editable grid', Icon: Table2 },
  { type: 'shape', label: 'Shape', hint: '12 shape styles', Icon: RectangleHorizontal },
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

function makeBlock(type) {
  const common = { id: nextId(), type }
  return {
    text: { ...common, content: 'Write something useful here.', fontSize: 12, fontFamily: 'Inter, Arial, sans-serif', color: '#173b32', background: 'transparent', align: 'left', bold: false, link: '', blockWidth: 55 },
    list: { ...common, items: ['First item', 'Second item', 'Third item'], listStyle: 'disc', fontSize: 12, fontFamily: 'Inter, Arial, sans-serif', color: '#173b32', align: 'left', blockWidth: 55 },
    table: { ...common, caption: 'New table', headers: ['Column 1', 'Column 2'], rows: [['Value', 'Value']], headerColor: '#173b32', headerTextColor: '#ffffff', rowColor: '#ffffff', textColor: '#173b32', gridColor: '#d9e2dc', align: 'left', blockWidth: 70 },
    shape: { ...common, shape: 'rectangle', color: '#c9f06b', width: 220, height: 72, align: 'left', blockWidth: 45 },
    divider: { ...common, color: '#173b32', thickness: 2, lineStyle: 'solid', blockWidth: 60, position: 'left' },
    spacer: { ...common, height: 48, blockWidth: 100, position: 'left' },
    pageBreak: common,
  }[type]
}

function estimateHeight(block) {
  if (block.type === 'text') return Math.max(52, Math.ceil(String(block.content || '').length / Math.max(24, 84 - Number(block.fontSize || 12))) * (Number(block.fontSize || 12) * 1.45) + 25)
  if (block.type === 'list') return 28 + Math.max(1, block.items?.length || 0) * Math.max(24, Number(block.fontSize || 12) * 1.7)
  if (block.type === 'table') return 70 + Math.max(1, block.rows.length) * 28
  if (block.type === 'shape') return Math.max(44, Number(block.height) || 72) + 12
  if (block.type === 'spacer') return Math.max(12, Number(block.height) || 48)
  return 28
}

function paginate(blocks) {
  const pages = [[]]
  let remaining = 690
  const nextPage = () => { pages.push([]); remaining = 690 }
  blocks.filter(block => !block.freePosition).forEach(block => {
    if (block.type === 'pageBreak') {
      if (pages.at(-1).length) nextPage()
      pages.at(-1).push({ ...block, sourceId: block.id })
      remaining -= 30
      return
    }
    if (block.type === 'table') {
      const fixed = (block.caption ? 35 : 8) + 28
      let rows = block.rows.length ? [...block.rows] : [[]]
      let first = true
      while (rows.length) {
        if (remaining < fixed + 28) nextPage()
        const count = Math.max(1, Math.floor((remaining - fixed) / 28))
        const pageRows = rows.splice(0, count)
        pages.at(-1).push({ ...block, sourceId: block.id, rows: pageRows, continued: !first })
        remaining -= fixed + pageRows.length * 28 + 12
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

function ElementSizing({ block, set }) {
  const width = Math.max(10, Math.min(100, Number(block.blockWidth) || 100))
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
    <span className="pdf-studio-field-label">Element position</span>
    <Alignment value={block.position || 'left'} onChange={changePosition}/>
    <small>{block.freePosition ? 'Drag this element anywhere on the PDF page to reposition it.' : 'Automatic layout keeps nearby elements tidy. Use “Start on a new row” when you want this element below the previous one.'}</small>
  </div>
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
  if (block.type === 'divider') return 'Divider'
  if (block.type === 'spacer') return 'Empty space'
  return 'Page break'
}

function LayersPanel({ pages, selectedId, select, update, remove }) {
  return <div className="pdf-studio-layers">
    <div className="pdf-studio-panel-title"><span>DOCUMENT</span><h2>Layers</h2><p>Select hidden or overlapping elements without moving them.</p></div>
    {pages.map((pageBlocks, pageIndex) => <details open className="pdf-studio-layer-page" key={pageIndex}>
      <summary><ChevronDown size={14}/><span>Page {pageIndex + 1}</span><small>{pageBlocks.length}</small></summary>
      <div>{[...pageBlocks].reverse().map(block => {
        const id = block.sourceId || block.id
        return <div className={`pdf-studio-layer-row ${selectedId === id ? 'selected' : ''}`} key={`${pageIndex}-${id}`}>
          <button type="button" className="pdf-studio-layer-select" aria-current={selectedId === id ? 'true' : undefined} onClick={() => select(id)}><i>{block.type === 'text' ? 'T' : block.type === 'list' ? '≡' : block.type === 'table' ? '▦' : block.type === 'divider' ? '—' : block.type === 'shape' ? '□' : block.type === 'spacer' ? '↕' : '↳'}</i><span title={layerName(block)}>{layerName(block)}</span></button>
          {block.type !== 'pageBreak' && <button type="button" className={block.locked ? 'pdf-studio-layer-action active' : 'pdf-studio-layer-action'} aria-label={block.locked ? `Unlock ${layerName(block)}` : `Lock ${layerName(block)}`} title={block.locked ? 'Unlock layer' : 'Lock layer'} onClick={() => update(id, { locked: !block.locked })}>{block.locked ? <Lock size={14}/> : <Unlock size={14}/>}</button>}
          <button type="button" className="pdf-studio-layer-action delete" aria-label={`Delete ${layerName(block)}`} title="Delete layer" onClick={() => remove(id)}><Trash2 size={14}/></button>
        </div>
      })}</div>
    </details>)}
  </div>
}

function Inspector({ block, update, remove, title, setTitle, pageColor, setPageColor, footerFields, setFooterFields }) {
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
  const name = block.type === 'pageBreak' ? 'Page break' : block.type === 'spacer' ? 'Empty space' : `${block.type[0].toUpperCase()}${block.type.slice(1)}`
  return <aside className="pdf-studio-inspector"><div className="pdf-studio-panel-title"><span>PROPERTIES</span><h2>{name}</h2></div>
    {block.type !== 'pageBreak' && <ElementSizing block={block} set={set}/>} 
    {block.type !== 'pageBreak' && (block.freePosition
      ? <div className="pdf-studio-layout-mode"><strong>Free position</strong><span>X {Math.round(block.freePosition.x)}% · Y {Math.round(block.freePosition.y)}%</span><button type="button" onClick={() => set({ freePosition: null })}>Return to automatic layout</button></div>
      : <button type="button" className={block.newRow ? 'pdf-studio-row-toggle active' : 'pdf-studio-row-toggle'} onClick={() => set({ newRow: !block.newRow })}>{block.newRow ? 'Starts on a new row' : 'Start on a new row'}</button>)}
    {block.type !== 'pageBreak' && <button type="button" className={block.locked ? 'pdf-studio-lock-toggle active' : 'pdf-studio-lock-toggle'} onClick={() => set({ locked: !block.locked })}>{block.locked ? <Lock size={15}/> : <Unlock size={15}/>} {block.locked ? 'Element locked' : 'Lock element'}</button>}
    {block.type === 'text' && <><label>Text<textarea rows="5" value={block.content} onChange={event => set({ content: event.target.value })}/></label><label>Font<select value={block.fontFamily || fontOptions[0].value} onChange={event => set({ fontFamily: event.target.value })}>{fontOptions.map(font => <option value={font.value} key={font.label}>{font.label}</option>)}</select></label><label>Font size<input type="number" min="8" max="32" value={block.fontSize} onChange={event => set({ fontSize: Number(event.target.value) })}/></label><label>Link URL <small>Optional</small><input type="url" value={block.link || ''} placeholder="https://example.com" onChange={event => set({ link: event.target.value })}/><small>{block.link && !safeLink(block.link) ? 'Enter a valid web or email link.' : 'The text becomes clickable in the canvas and exported PDF.'}</small></label><span className="pdf-studio-field-label">Alignment</span><Alignment value={block.align} onChange={align => set({ align })}/><ColorField label="Text colour" value={block.color} onChange={color => set({ color })}/><ColorField label="Background" value={block.background} onChange={background => set({ background })} allowTransparent/><button type="button" className={block.bold ? 'pdf-studio-toggle active' : 'pdf-studio-toggle'} onClick={() => set({ bold: !block.bold })}><Bold size={15}/> Bold text</button></>}
    {block.type === 'list' && <><span className="pdf-studio-field-label">List format</span><div className="pdf-studio-list-types" role="group" aria-label="List format"><button type="button" className={block.listStyle === 'disc' ? 'active' : ''} onClick={() => set({ listStyle: 'disc' })}><span>•</span> Disc</button><button type="button" className={block.listStyle === 'decimal' ? 'active' : ''} onClick={() => set({ listStyle: 'decimal' })}><span>1.</span> Number</button><button type="button" className={block.listStyle === 'lower-alpha' ? 'active' : ''} onClick={() => set({ listStyle: 'lower-alpha' })}><span>a.</span> A, B, C</button></div><ListEditor block={block} update={update}/><label>Font<select value={block.fontFamily || fontOptions[0].value} onChange={event => set({ fontFamily: event.target.value })}>{fontOptions.map(font => <option value={font.value} key={font.label}>{font.label}</option>)}</select></label><label>Font size<input type="number" min="8" max="32" value={block.fontSize} onChange={event => set({ fontSize: Number(event.target.value) })}/></label><span className="pdf-studio-field-label">Alignment</span><Alignment value={block.align} onChange={align => set({ align })}/><ColorField label="Text colour" value={block.color} onChange={color => set({ color })}/></>}
    {block.type === 'table' && <><label>Caption<input value={block.caption} onChange={event => set({ caption: event.target.value })}/></label><TableEditor block={block} update={update}/><ColorField label="Header" value={block.headerColor} onChange={headerColor => set({ headerColor })}/><ColorField label="Rows" value={block.rowColor} onChange={rowColor => set({ rowColor })}/><ColorField label="Text" value={block.textColor} onChange={textColor => set({ textColor })}/><ColorField label="Grid" value={block.gridColor} onChange={gridColor => set({ gridColor })}/><span className="pdf-studio-field-label">Cell alignment</span><Alignment value={block.align} onChange={align => set({ align })}/></>}
    {block.type === 'shape' && <><span className="pdf-studio-field-label">Shape</span><div className="pdf-studio-shapes">{shapeOptions.map(shape => <button type="button" className={block.shape === shape.id ? 'active' : ''} aria-pressed={block.shape === shape.id} onClick={() => {
      if (shape.id === 'circle') {
        const circleWidth = Math.min(20, Math.max(10, Number(block.blockWidth) || 20))
        set({ shape: shape.id, blockWidth: circleWidth, blockHeight: circleWidth * 5.808 })
      } else set({ shape: shape.id })
    }} key={shape.id}><span className={`pdf-shape-option-preview ${shape.id}`}/><span>{shape.label}</span></button>)}</div><ColorField label="Fill" value={block.color} onChange={color => set({ color })}/><label>Width<input type="number" min="60" max="511" value={block.width} onChange={event => set({ width: Number(event.target.value) })}/></label><label>Height<input type="number" min="32" max="180" value={block.height} onChange={event => set({ height: Number(event.target.value) })}/></label><span className="pdf-studio-field-label">Alignment</span><Alignment value={block.align} onChange={align => set({ align })}/></>}
    {block.type === 'divider' && <><span className="pdf-studio-field-label">Line style</span><div className="pdf-studio-divider-styles" role="group" aria-label="Divider style">{dividerStyles.map(style => <button type="button" className={(block.lineStyle || 'solid') === style.id ? 'active' : ''} aria-pressed={(block.lineStyle || 'solid') === style.id} onClick={() => set({ lineStyle: style.id })} key={style.id}><i className={style.id}/><span>{style.label}</span></button>)}</div><ColorField label="Line colour" value={block.color} onChange={color => set({ color })}/><label>Thickness<input type="number" min="1" max="8" value={block.thickness} onChange={event => set({ thickness: Number(event.target.value) })}/></label></>}
    {block.type === 'spacer' && <><label>Empty space height <output>{Math.max(12, Number(block.height) || 48)} px</output><input type="range" min="12" max="220" step="4" value={Math.max(12, Number(block.height) || 48)} onChange={event => set({ height: Number(event.target.value) })}/></label><p className="pdf-studio-note">This creates blank vertical space in both the canvas and downloaded PDF.</p></>}
    {block.type === 'pageBreak' && <p className="pdf-studio-note">Everything after this marker starts on a fresh PDF page.</p>}
    <button type="button" className="pdf-studio-delete" onClick={() => remove(block.id)}><Trash2 size={15}/> Delete element</button>
  </aside>
}

function CanvasBlock({ block, selected, onSelect, previewPosition, resizePreview, onPointerStart, onPointerMove, onPointerEnd, onPointerCancel, onResizeStart }) {
  const id = block.sourceId || block.id
  const requestedWidth = Math.max(10, Math.min(100, Number(resizePreview?.blockWidth ?? block.blockWidth) || 100))
  const blockHeight = Math.max(0, Number(resizePreview?.blockHeight ?? block.blockHeight) || 0)
  const blockWidth = block.type === 'shape' && block.shape === 'circle' && blockHeight
    ? Math.max(10, Math.min(100, blockHeight / 5.808))
    : requestedWidth
  const contentHeight = blockHeight ? Math.max(18, blockHeight - 10) : 0
  let content
  if (block.type === 'pageBreak') content = <div className="pdf-canvas-page-break"><span>Editing guide</span>Page starts here</div>
  else if (block.type === 'spacer') content = <div className="pdf-canvas-spacer" style={{ height: `${contentHeight || Math.max(12, Number(block.height) || 48) * .45}px` }}><span>{Math.round(contentHeight || Math.max(12, Number(block.height) || 48))} px empty space</span></div>
  else if (block.type === 'text') {
    const link = safeLink(block.link)
    const textContent = block.content || 'Your text'
    content = <div className="pdf-canvas-text" style={{ color: block.color, background: block.background, textAlign: block.align, fontFamily: block.fontFamily || fontOptions[0].value, fontSize: `${Math.max(8, block.fontSize) * .62}px`, fontWeight: block.bold ? 800 : 500, height: contentHeight ? `${contentHeight}px` : undefined, overflow: contentHeight ? 'hidden' : undefined }}>{link ? <a href={link} target="_blank" rel="noreferrer" onPointerDown={event => event.stopPropagation()} onClick={event => event.stopPropagation()}>{textContent}</a> : textContent}</div>
  }
  else if (block.type === 'list') {
    const ListTag = block.listStyle === 'disc' ? 'ul' : 'ol'
    content = <div className="pdf-canvas-list" style={{ color: block.color, textAlign: block.align, fontFamily: block.fontFamily || fontOptions[0].value, fontSize: `${Math.max(8, block.fontSize) * .62}px`, height: contentHeight ? `${contentHeight}px` : undefined, overflow: contentHeight ? 'hidden' : undefined }}><ListTag style={{ listStyleType: block.listStyle }}>{(block.items || []).map((item, index) => <li key={index}>{item || `Item ${index + 1}`}</li>)}</ListTag></div>
  }
  else if (block.type === 'table') content = <div className="pdf-canvas-table" style={{ height: contentHeight ? `${contentHeight}px` : undefined, overflow: contentHeight ? 'hidden' : undefined }}><strong style={{ color: block.textColor }}>{block.continued ? `${block.caption || 'Table'} - continued` : block.caption}</strong><table style={{ textAlign: block.align }}><thead style={{ background: block.headerColor, color: block.headerTextColor }}><tr>{block.headers.map((header, index) => <th key={index}>{header}</th>)}</tr></thead><tbody>{block.rows.map((row, rowIndex) => <tr style={{ background: block.rowColor, color: block.textColor }} key={rowIndex}>{block.headers.map((_, index) => <td style={{ borderColor: block.gridColor }} key={index}>{row[index] || ''}</td>)}</tr>)}</tbody></table></div>
  else if (block.type === 'shape') content = <div className={`pdf-canvas-shape ${block.align}`}><span className={`pdf-canvas-shape-fill ${block.shape || 'rectangle'}`} style={{ width: '100%', height: `${contentHeight || Math.max(18, block.height * .45)}px`, background: block.color }}/></div>
  else {
    const lineStyle = block.lineStyle || 'solid'
    const lineWidth = lineStyle === 'double' ? Math.max(3, Number(block.thickness) * 2) : block.thickness
    content = <hr style={{ borderTopColor: block.color, borderTopStyle: lineStyle, borderTopWidth: `${lineWidth}px` }}/>
  }
  const blockPosition = block.position || 'left'
  const effectivePosition = previewPosition || resizePreview?.freePosition || block.freePosition
  const blockStyle = effectivePosition
    ? {
        width: `calc((100% - var(--pdf-page-padding-x)) * ${blockWidth / 100})`,
        left: `calc(var(--pdf-page-padding-left) + (100% - var(--pdf-page-padding-x)) * ${effectivePosition.x / 100})`,
        top: `calc(var(--pdf-page-padding-top) + (100% - var(--pdf-page-padding-y)) * ${effectivePosition.y / 100})`,
        height: blockHeight ? `${blockHeight}px` : undefined,
      }
    : { width: `${blockWidth}%`, height: blockHeight ? `${blockHeight}px` : undefined, marginLeft: blockPosition === 'center' || blockPosition === 'right' ? 'auto' : 0, marginRight: blockPosition === 'center' ? 'auto' : 0 }
  const resizeHandles = selected && !block.locked && block.type !== 'pageBreak' && <>{['top-left', 'top-right', 'bottom-left', 'bottom-right'].map(corner => <i className={`pdf-selection-handle ${corner}`} onPointerDown={event => { event.stopPropagation(); onResizeStart(event, id, corner) }} key={corner}/>)}</>
  return <div data-block-id={id} className={`pdf-canvas-block ${effectivePosition ? 'free-positioned' : ''} ${previewPosition || resizePreview ? 'live-dragging' : ''} ${block.locked ? 'locked' : ''} ${selected ? 'selected' : ''}`} style={blockStyle} onClick={event => { event.stopPropagation(); onSelect(id, event.currentTarget) }} onPointerDown={event => { if (!event.target.closest('.pdf-selection-handle')) onPointerStart(event, id) }} onPointerMove={onPointerMove} onPointerUp={onPointerEnd} onPointerCancel={onPointerCancel}><span className="pdf-canvas-grip">{block.locked ? <Lock size={12}/> : <GripVertical size={14}/>}</span>{content}{resizeHandles}{selected && <span className="pdf-selection-size">{Math.round(blockWidth)}%{blockHeight ? ` × ${Math.round(blockHeight)}px` : ' wide'}</span>}</div>
}

function Canvas({ pageColor, blocks, footerFields, selectedId, setSelectedId, dropOnPage, previewDrop, clearGuides, alignmentGuides, dragPreview, resizePreview, onPointerStart, onPointerMove, onPointerEnd, onPointerCancel, onResizeStart }) {
  const pages = paginate(blocks)
  const renderBlock = (block, index, prefix = '') => {
    const id = block.sourceId || block.id
    return <CanvasBlock block={block} selected={selectedId === id} onSelect={setSelectedId} previewPosition={dragPreview?.id === id ? dragPreview.freePosition : null} resizePreview={resizePreview?.id === id ? resizePreview : null} onPointerStart={onPointerStart} onPointerMove={onPointerMove} onPointerEnd={onPointerEnd} onPointerCancel={onPointerCancel} onResizeStart={onResizeStart} key={`${prefix}${id}-${index}`}/>
  }
  return <main className="pdf-studio-canvas" onClick={() => setSelectedId(null)}>
    <div className="pdf-studio-canvas-head"><div><strong>PDF pages</strong><span>{pages.length} {pages.length === 1 ? 'page' : 'pages'} · A4</span></div><span>Guides are suggestions only · no auto-snap</span></div>
    <div className="pdf-studio-pages">{pages.map((pageBlocks, pageIndex) => {
      const flowBlocks = pageBlocks.filter(block => !block.isFree)
      const freeBlocks = pageBlocks.filter(block => block.isFree)
      const pageGuides = alignmentGuides?.pageIndex === pageIndex ? alignmentGuides : null
      const footerColumns = Object.fromEntries(Object.entries(footerFields).map(([position, value]) => [position, footerTextForPage(value, pageIndex + 1).trim()]))
      const hasCustomFooter = Object.values(footerColumns).some(Boolean)
      return <section className="pdf-studio-page-wrap" key={pageIndex}><span>PAGE {pageIndex + 1}</span><div data-page-index={pageIndex} className={`pdf-studio-page ${hasCustomFooter ? 'has-custom-footer' : ''}`} style={{ background: pageColor }} onDragOver={event => { event.preventDefault(); event.currentTarget.classList.add('drop-ready'); previewDrop(event, pageIndex) }} onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget)) { event.currentTarget.classList.remove('drop-ready'); clearGuides() } }} onDrop={event => { event.currentTarget.classList.remove('drop-ready'); dropOnPage(event, pageIndex) }}>
        {pageGuides?.x != null && <span className="pdf-alignment-guide vertical" style={{ left: `${pageGuides.x}%` }}><em>{pageGuides.xLabel}</em></span>}
        {pageGuides?.y != null && <span className="pdf-alignment-guide horizontal" style={{ top: `${pageGuides.y}%` }}><em>{pageGuides.yLabel}</em></span>}
        <div className="pdf-canvas-flow">{flowBlocks.map((block, index) => {
          const dedicatedRow = block.type === 'divider'
          return <Fragment key={`${block.sourceId || block.id}-${index}`}>{(block.newRow || dedicatedRow) && <span className="pdf-row-break"/>}{renderBlock(block, index)}{dedicatedRow && <span className="pdf-row-break"/>}</Fragment>
        })}{!pageBlocks.length && <div className="pdf-studio-page-empty"><Plus size={20}/><strong>Drop a component here</strong></div>}</div>
        {freeBlocks.map((block, index) => renderBlock(block, index, 'free-'))}
        {hasCustomFooter ? <footer className="custom-section">{['left', 'center', 'right'].map(position => <span className={position} key={position}>{footerColumns[position]}</span>)}</footer> : <footer>Created with Flowly PDF Maker <span>Page {pageIndex + 1}</span></footer>}
      </div></section>
    })}</div>
  </main>
}

export default function PdfMaker({ onExit }) {
  const [title, setTitle] = useState('Untitled document')
  const [downloadOpen, setDownloadOpen] = useState(false)
  const [includeWatermark, setIncludeWatermark] = useState(true)
  const [pageColor, setPageColor] = useState('#f7f7f2')
  const [footerFields, setFooterFields] = useState({ left: '', center: '', right: '' })
  const [blocks, setBlocks] = useState(starterBlocks)
  const [selectedId, setSelectedIdState] = useState(null)
  const [alignmentGuides, setAlignmentGuides] = useState(null)
  const [dragPreview, setDragPreview] = useState(null)
  const [resizePreview, setResizePreview] = useState(null)
  const [leftPanel, setLeftPanel] = useState('components')
  const pointerDrag = useRef(null)
  const pointerResize = useRef(null)
  useEffect(() => {
    if (!downloadOpen) return undefined
    const closeOnEscape = event => { if (event.key === 'Escape') setDownloadOpen(false) }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [downloadOpen])
  const setSelectedId = (id, element = null) => {
    setSelectedIdState(id)
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
  const selected = blocks.find(block => block.id === selectedId) || null
  const documentData = useMemo(() => ({ title, pageColor, blocks, footerFields }), [title, pageColor, blocks, footerFields])
  const confirmDownload = event => {
    event.preventDefault()
    const pdfName = title.trim() || 'Untitled document'
    setTitle(pdfName)
    downloadCustomPdf({ ...documentData, title: pdfName, includeWatermark })
    setDownloadOpen(false)
  }
  const layerPages = useMemo(() => paginate(blocks).map(pageBlocks => {
    const seen = new Set()
    return pageBlocks.filter(block => { const id = block.sourceId || block.id; if (seen.has(id)) return false; seen.add(id); return true })
  }), [blocks])
  const update = (id, patch) => setBlocks(current => current.map(block => block.id === id ? { ...block, ...patch } : block))
  const remove = id => { setBlocks(current => current.filter(block => block.id !== id)); setSelectedId(null) }
  const estimateCanvasHeight = block => {
    if (block.type === 'spacer') return Math.max(18, Math.max(12, Number(block.height) || 48) * .45) + 10
    if (block.type === 'shape') return Math.max(18, Math.max(18, (Number(block.height) || 72) * .45)) + 10
    if (block.type === 'divider') return 28
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
  const readDrag = event => ({ type: event.dataTransfer.getData('application/x-flowly-tool'), movingId: Number(event.dataTransfer.getData('application/x-flowly-block')) })
  const calculateAtPoint = ({ page, pageIndex, source, movingId, clientX, clientY, offset = {} }) => {
    if (!source || source.type === 'pageBreak') return null
    const box = pageContentBox(page)
    const movingElement = movingId ? page.querySelector(`[data-block-id="${movingId}"]`) : null
    const movingRect = movingElement?.getBoundingClientRect()
    const widthPercent = Math.max(10, Math.min(100, Number(source.blockWidth) || 100))
    const movingWidth = movingRect?.width || box.width * widthPercent / 100
    const movingHeight = movingRect?.height || 56
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
  const beginPointerDrag = (event, id) => {
    if (event.button !== 0) return
    const source = blocks.find(block => block.id === id)
    if (!source || source.locked || source.type === 'pageBreak') return
    const page = event.currentTarget.closest('.pdf-studio-page')
    if (!page) return
    const elementRect = event.currentTarget.getBoundingClientRect()
    pointerDrag.current = { id, pointerId: event.pointerId, page, pageIndex: Number(page.dataset.pageIndex) || 0, startX: event.clientX, startY: event.clientY, moved: false, offset: { x: event.clientX - elementRect.left, y: event.clientY - elementRect.top } }
    event.currentTarget.setPointerCapture(event.pointerId)
    event.preventDefault()
    event.stopPropagation()
    setSelectedId(id)
  }
  const movePointerDrag = event => {
    const active = pointerDrag.current
    if (!active || active.pointerId !== event.pointerId) return
    if (!active.moved) {
      const distance = Math.hypot(event.clientX - active.startX, event.clientY - active.startY)
      if (distance < 5) return
      active.moved = true
    }
    const source = blocks.find(block => block.id === active.id)
    const placement = calculateAtPoint({ page: active.page, pageIndex: active.pageIndex, source, movingId: active.id, clientX: event.clientX, clientY: event.clientY, offset: active.offset })
    if (!placement) return
    event.preventDefault()
    setDragPreview({ id: active.id, freePosition: placement.freePosition })
    setAlignmentGuides(placement.guides)
  }
  const endPointerDrag = event => {
    const active = pointerDrag.current
    if (!active || active.pointerId !== event.pointerId) return
    if (active.moved) {
      const source = blocks.find(block => block.id === active.id)
      const placement = calculateAtPoint({ page: active.page, pageIndex: active.pageIndex, source, movingId: active.id, clientX: event.clientX, clientY: event.clientY, offset: active.offset })
      if (placement) { update(active.id, { freePosition: placement.freePosition, position: 'custom' }); setAlignmentGuides(placement.guides) }
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
    const element = event.currentTarget.closest('.pdf-canvas-block')
    const page = event.currentTarget.closest('.pdf-studio-page')
    if (!source || source.locked || !element || !page) return
    const rect = element.getBoundingClientRect()
    const box = pageContentBox(page)
    const pageWidth = box.width
    const pageHeight = box.height
    const left = rect.left - box.left
    const top = rect.top - box.top
    const widthPercent = rect.width / pageWidth * 100
    const heightPercent = rect.height / pageHeight * 100
    const freePosition = source.freePosition || {
      pageIndex: Number(page.dataset.pageIndex) || 0,
      x: Math.max(0, Math.min(100 - widthPercent, left / pageWidth * 100)),
      y: Math.max(0, Math.min(100 - heightPercent, top / pageHeight * 100)),
    }
    pointerDrag.current = null
    setDragPreview(null)
    pointerResize.current = { id, pointerId: event.pointerId, corner, handle: event.currentTarget, page, pageIndex: Number(page.dataset.pageIndex) || 0, element, pageWidth, pageHeight, startX: event.clientX, startY: event.clientY, width: rect.width, height: rect.height, left, top, freePosition, isCircle: source.type === 'shape' && source.shape === 'circle', minWidth: Math.min(pageWidth * .1, rect.width), minHeight: Math.min(24, rect.height), moved: false }
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
    const blockWidth = width / active.pageWidth * 100
    let freePosition = active.freePosition
    if (freePosition) {
      const blockHeightPercent = height / active.pageHeight * 100
      freePosition = { ...freePosition, x: Math.max(0, Math.min(100 - blockWidth, left / active.pageWidth * 100)), y: Math.max(0, Math.min(100 - blockHeightPercent, top / active.pageHeight * 100)) }
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
      update(active.id, { blockWidth: result.blockWidth, blockHeight: result.blockHeight, ...(result.freePosition ? { freePosition: result.freePosition, position: 'custom' } : {}) })
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
  return <main className="pdf-studio">
    <header className="pdf-studio-header"><button type="button" onClick={onExit}><ArrowLeft size={17}/> Flowly</button><a href={routeUrl('/utilities/pdf-maker')}><span><FilePenLine size={18}/></span><h1><em>Free Online </em>PDF Maker</h1></a><div><span>Created locally</span><button type="button" onClick={() => setDownloadOpen(true)}><Download size={16}/> Download PDF</button></div></header>
    <div className="pdf-studio-workspace">
      <aside className="pdf-studio-tools"><div className="pdf-studio-sidebar-tabs" role="tablist" aria-label="PDF Maker sidebar"><button type="button" role="tab" aria-selected={leftPanel === 'components'} className={leftPanel === 'components' ? 'active' : ''} onClick={() => setLeftPanel('components')}><Plus size={15}/> Add</button><button type="button" role="tab" aria-selected={leftPanel === 'layers'} className={leftPanel === 'layers' ? 'active' : ''} onClick={() => setLeftPanel('layers')}><Layers3 size={15}/> Layers</button></div>{leftPanel === 'components' ? <><div className="pdf-studio-panel-title"><span>COMPONENTS</span><h2>Add to page</h2><p>Click to add at the bottom, or drag onto an exact position.</p></div><div className="pdf-studio-tool-list">{tools.map(({ type, label, hint, Icon }) => <button type="button" draggable onDragStart={event => { event.dataTransfer.effectAllowed = 'copy'; event.dataTransfer.setData('application/x-flowly-tool', type) }} onClick={() => addAt(type)} key={type}><span><Icon size={18}/></span><div><strong>{label}</strong><small>{hint}</small></div><GripVertical size={15}/></button>)}</div><div className="pdf-studio-tip"><strong>Alignment suggestions</strong><p>Blue and red guides show matching edges and centres. They never snap or move your element.</p></div></> : <LayersPanel pages={layerPages} selectedId={selectedId} select={setSelectedId} update={update} remove={remove}/>}</aside>
      <Canvas pageColor={pageColor} blocks={blocks} footerFields={footerFields} selectedId={selectedId} setSelectedId={setSelectedId} dropOnPage={dropOnPage} previewDrop={previewDrop} clearGuides={() => setAlignmentGuides(null)} alignmentGuides={alignmentGuides} dragPreview={dragPreview} resizePreview={resizePreview} onPointerStart={beginPointerDrag} onPointerMove={event => { movePointerDrag(event); movePointerResize(event) }} onPointerEnd={event => { endPointerDrag(event); endPointerResize(event) }} onPointerCancel={event => { cancelPointerDrag(event); cancelPointerResize(event) }} onResizeStart={beginPointerResize}/>
      <Inspector block={selected} update={update} remove={remove} title={title} setTitle={setTitle} pageColor={pageColor} setPageColor={setPageColor} footerFields={footerFields} setFooterFields={setFooterFields}/>
    </div>
    {downloadOpen && <div className="pdf-download-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setDownloadOpen(false) }}>
      <form className="pdf-download-dialog" role="dialog" aria-modal="true" aria-labelledby="pdf-download-title" onSubmit={confirmDownload}>
        <div className="pdf-download-dialog-head"><span><Download size={18}/></span><button type="button" aria-label="Close download dialog" onClick={() => setDownloadOpen(false)}>×</button></div>
        <p className="pdf-download-kicker">READY TO EXPORT</p>
        <h2 id="pdf-download-title">Download your PDF</h2>
        <p>Choose the file name and whether Flowly’s small footer should appear on every page.</p>
        <label>PDF name<div className="pdf-download-name"><input autoFocus value={title} placeholder="Untitled document" onChange={event => setTitle(event.target.value)}/><span>.pdf</span></div></label>
        <label className="pdf-download-watermark"><input type="checkbox" checked={includeWatermark} onChange={event => setIncludeWatermark(event.target.checked)}/><span><strong>Include Flowly watermark</strong><small>Shows “Created with Flowly PDF Maker” and the page number in the footer.</small></span></label>
        <div className={`pdf-download-preview ${includeWatermark ? '' : 'removed'}`}>{includeWatermark ? <><span>Created with Flowly PDF Maker</span><em>Page 1</em></> : <span>Watermark will not be included</span>}</div>
        <div className="pdf-download-actions"><button type="button" onClick={() => setDownloadOpen(false)}>Cancel</button><button type="submit"><Download size={16}/> Download PDF</button></div>
      </form>
    </div>}
  </main>
}
