import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft, Check, CircleAlert, Download, Expand, FileImage, ImageIcon,
  Link2, RefreshCw, ShieldCheck, SlidersHorizontal, Sparkles, Trash2, UploadCloud, X,
} from 'lucide-react'
import { routeUrl } from './navigation.js'
import FlowSelect from './FlowSelect.jsx'
import './image-compressor.css'
import './image-resizer.css'

const acceptedTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])
const maxFileSize = 30 * 1024 * 1024
const maxFiles = 20
const presets = [
  { label: 'Instagram post', width: 1080, height: 1080 },
  { label: 'Instagram story', width: 1080, height: 1920 },
  { label: 'YouTube thumbnail', width: 1280, height: 720 },
  { label: 'HD landscape', width: 1920, height: 1080 },
  { label: 'Profile picture', width: 512, height: 512 },
]

const formatBytes = value => {
  const bytes = Math.max(0, Number(value) || 0)
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB']
  let size = bytes / 1024
  let unit = 0
  while (size >= 1024 && unit < units.length - 1) { size /= 1024; unit += 1 }
  return `${size >= 100 ? size.toFixed(0) : size >= 10 ? size.toFixed(1) : size.toFixed(2)} ${units[unit]}`
}
const outputType = (format, originalType) => format === 'original' ? originalType : `image/${format}`
const extensionFor = type => type === 'image/jpeg' ? 'jpg' : type === 'image/webp' ? 'webp' : 'png'
const fileStem = name => String(name || 'image').replace(/\.[^.]+$/, '') || 'image'
const safeDimension = value => Math.max(1, Math.min(8192, Math.round(Number(value) || 1)))

function loadImage(file) {
  if ('createImageBitmap' in window) return createImageBitmap(file).then(bitmap => ({
    width: bitmap.width,
    height: bitmap.height,
    draw: (...args) => args[0].drawImage(bitmap, ...args.slice(1)),
    close: () => bitmap.close(),
  }))
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight, draw: (...args) => args[0].drawImage(image, ...args.slice(1)), close: () => URL.revokeObjectURL(url) })
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('This image could not be decoded.')) }
    image.src = url
  })
}

async function inspectImage(file) {
  const image = await loadImage(file)
  try { return { width: image.width, height: image.height } }
  finally { image.close() }
}

async function resizeImage(file, settings) {
  const image = await loadImage(file)
  try {
    const width = safeDimension(settings.width)
    const height = safeDimension(settings.height)
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d', { alpha: true })
    const mime = outputType(settings.format, file.type)
    const transparent = settings.transparent && mime !== 'image/jpeg'
    if (!transparent) {
      context.fillStyle = settings.background || '#ffffff'
      context.fillRect(0, 0, width, height)
    }
    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'
    if (settings.fit === 'stretch') image.draw(context, 0, 0, width, height)
    else {
      const scale = settings.fit === 'cover'
        ? Math.max(width / image.width, height / image.height)
        : Math.min(width / image.width, height / image.height)
      const drawWidth = image.width * scale
      const drawHeight = image.height * scale
      const x = (width - drawWidth) / 2
      const y = (height - drawHeight) / 2
      image.draw(context, x, y, drawWidth, drawHeight)
    }
    const blob = await new Promise((resolve, reject) => canvas.toBlob(result => result ? resolve(result) : reject(new Error('The browser could not encode this image.')), mime, Math.max(.1, Math.min(1, settings.quality / 100))))
    return { blob, mime, resultWidth: width, resultHeight: height }
  } finally { image.close() }
}

export default function ImageResizer({ onExit }) {
  const inputRef = useRef(null)
  const itemsRef = useRef([])
  const [items, setItems] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [width, setWidth] = useState(1200)
  const [height, setHeight] = useState(800)
  const [unit, setUnit] = useState('pixels')
  const [ppi, setPpi] = useState(96)
  const [aspectLocked, setAspectLocked] = useState(true)
  const [fit, setFit] = useState('contain')
  const [format, setFormat] = useState('original')
  const [quality, setQuality] = useState(88)
  const [transparent, setTransparent] = useState(true)
  const [background, setBackground] = useState('#ffffff')
  const [dragging, setDragging] = useState(false)
  const [resizing, setResizing] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => { itemsRef.current = items }, [items])
  useEffect(() => () => itemsRef.current.forEach(item => {
    URL.revokeObjectURL(item.originalUrl)
    if (item.resultUrl) URL.revokeObjectURL(item.resultUrl)
  }), [])

  const selected = items.find(item => item.id === selectedId) || items[0] || null
  const completed = items.filter(item => item.status === 'done')
  const selectedRatio = selected ? selected.width / Math.max(1, selected.height) : width / Math.max(1, height)
  const sourceWidth = selected?.width || 1200
  const sourceHeight = selected?.height || 800
  const totalOutputSize = useMemo(() => completed.reduce((sum, item) => sum + (item.resultBlob?.size || 0), 0), [completed])

  const pixelsToUnit = (pixels, axis) => {
    if (unit === 'percent') return Math.round((pixels / (axis === 'width' ? sourceWidth : sourceHeight)) * 10000) / 100
    if (unit === 'inches') return Math.round((pixels / ppi) * 100) / 100
    if (unit === 'centimeters') return Math.round((pixels / ppi * 2.54) * 100) / 100
    return Math.round(pixels)
  }
  const unitToPixels = (value, axis) => {
    const amount = Math.max(.01, Number(value) || .01)
    if (unit === 'percent') return (axis === 'width' ? sourceWidth : sourceHeight) * amount / 100
    if (unit === 'inches') return amount * ppi
    if (unit === 'centimeters') return amount / 2.54 * ppi
    return amount
  }

  const updateWidth = value => {
    const next = safeDimension(unitToPixels(value, 'width'))
    setWidth(next)
    if (aspectLocked) setHeight(safeDimension(next / selectedRatio))
  }
  const updateHeight = value => {
    const next = safeDimension(unitToPixels(value, 'height'))
    setHeight(next)
    if (aspectLocked) setWidth(safeDimension(next * selectedRatio))
  }
  const updatePpi = value => {
    const next = Math.max(36, Math.min(1200, Math.round(Number(value) || 96)))
    if ((unit === 'inches' || unit === 'centimeters') && ppi) {
      const scale = next / ppi
      setWidth(safeDimension(width * scale))
      setHeight(safeDimension(height * scale))
    }
    setPpi(next)
  }
  const applyPreset = preset => { setWidth(preset.width); setHeight(preset.height); setAspectLocked(false) }
  const scaleSelected = percent => {
    if (!selected) return
    setWidth(safeDimension(selected.width * percent / 100))
    setHeight(safeDimension(selected.height * percent / 100))
    setAspectLocked(true)
  }

  const addFiles = async incoming => {
    const files = [...incoming]
    const valid = files.filter(file => acceptedTypes.has(file.type) && file.size <= maxFileSize)
    const rejected = files.length - valid.length
    const available = Math.max(0, maxFiles - items.length)
    const accepted = valid.slice(0, available)
    if (rejected || valid.length > available) setNotice(`${rejected ? `${rejected} unsupported or oversized file${rejected === 1 ? '' : 's'}. ` : ''}${valid.length > available ? `Flowly accepts up to ${maxFiles} images at once.` : ''}`.trim())
    else setNotice('')
    if (!accepted.length) return
    const added = await Promise.all(accepted.map(async file => {
      try {
        const dimensions = await inspectImage(file)
        return { id: `${Date.now().toString(36)}-${crypto.randomUUID?.() || Math.random().toString(36).slice(2)}`, file, ...dimensions, originalUrl: URL.createObjectURL(file), resultUrl: '', resultBlob: null, status: 'ready', error: '' }
      } catch (error) {
        return { id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`, file, width: 0, height: 0, originalUrl: URL.createObjectURL(file), resultUrl: '', resultBlob: null, status: 'error', error: error?.message || 'This image could not be opened.' }
      }
    }))
    setItems(current => [...current, ...added])
    setSelectedId(current => current || added[0].id)
    if (!items.length && added[0].width) { setWidth(added[0].width); setHeight(added[0].height) }
  }

  const removeItem = id => {
    const item = items.find(entry => entry.id === id)
    if (item) { URL.revokeObjectURL(item.originalUrl); if (item.resultUrl) URL.revokeObjectURL(item.resultUrl) }
    setItems(current => current.filter(entry => entry.id !== id))
    if (selectedId === id) setSelectedId(items.find(entry => entry.id !== id)?.id || null)
  }
  const clearAll = () => {
    items.forEach(item => { URL.revokeObjectURL(item.originalUrl); if (item.resultUrl) URL.revokeObjectURL(item.resultUrl) })
    setItems([]); setSelectedId(null); setNotice('')
  }

  const resizeAll = async () => {
    if (!items.length || resizing) return
    setResizing(true)
    setNotice('')
    for (const item of items) {
      if (!item.width) continue
      setItems(current => current.map(entry => entry.id === item.id ? { ...entry, status: 'resizing', error: '' } : entry))
      try {
        const result = await resizeImage(item.file, { width, height, fit, format, quality, transparent, background })
        const resultUrl = URL.createObjectURL(result.blob)
        if (item.resultUrl) URL.revokeObjectURL(item.resultUrl)
        setItems(current => current.map(entry => entry.id === item.id ? { ...entry, ...result, resultBlob: result.blob, resultUrl, status: 'done' } : entry))
      } catch (error) {
        setItems(current => current.map(entry => entry.id === item.id ? { ...entry, status: 'error', error: error?.message || 'Resize failed.' } : entry))
      }
      await new Promise(resolve => window.setTimeout(resolve, 20))
    }
    setResizing(false)
  }

  const downloadItem = item => {
    if (!item?.resultBlob) return
    const anchor = document.createElement('a')
    anchor.href = item.resultUrl
    anchor.download = `${fileStem(item.file.name)}-${item.resultWidth || item.width}x${item.resultHeight || item.height}.${extensionFor(item.mime)}`
    document.body.appendChild(anchor); anchor.click(); anchor.remove()
  }
  const downloadAll = () => completed.forEach((item, index) => window.setTimeout(() => downloadItem(item), index * 180))

  const targetWidth = safeDimension(width)
  const targetHeight = safeDimension(height)
  const transparentAvailable = format !== 'jpeg' && (format !== 'original' || selected?.file.type !== 'image/jpeg')

  return <main className="image-compressor-app image-resizer-app">
    <header className="image-compressor-header"><button type="button" onClick={onExit}><ArrowLeft size={17}/> Flowly</button><a href={routeUrl('/utilities/image-resizer')}><span><Expand size={19}/></span>Image Resizer</a><p><ShieldCheck size={15}/> Browser only</p></header>
    <section className="image-compressor-intro"><div><span>FLOWLY UTILITY</span><h1>Resize images to exact dimensions.</h1></div><p>Set precise pixel dimensions, use ready-made social presets and choose how each image fits—without uploading anything.</p></section>

    <section className="image-compressor-workspace image-resizer-workspace">
      <aside className="image-compressor-settings image-resizer-settings">
        <div className="image-compressor-panel-title"><SlidersHorizontal size={17}/><div><span>RESIZE</span><h2>Size and fit</h2></div></div>
        <div className="image-resizer-unit-row"><FlowSelect label="Measurement unit" value={unit} onChange={setUnit} options={[{ value: 'pixels', label: 'Pixels', description: 'Exact screen dimensions' }, { value: 'percent', label: 'Percent', description: 'Scale from the selected image' }, { value: 'centimeters', label: 'Centimeters', description: 'Physical size using PPI' }, { value: 'inches', label: 'Inches', description: 'Physical size using PPI' }]}/>{(unit === 'centimeters' || unit === 'inches') && <label><span>Resolution <small>PPI</small></span><input type="number" min="36" max="1200" value={ppi} onChange={event => updatePpi(event.target.value)}/></label>}</div>
        <div className="image-resizer-dimensions"><label><span>Width <small>{unit === 'pixels' ? 'px' : unit === 'percent' ? '%' : unit === 'centimeters' ? 'cm' : 'in'}</small></span><input type="number" min="0.01" step={unit === 'pixels' ? 1 : .01} value={pixelsToUnit(width, 'width')} onChange={event => updateWidth(event.target.value)}/></label><button type="button" className={aspectLocked ? 'active' : ''} aria-pressed={aspectLocked} aria-label="Lock aspect ratio" title="Lock aspect ratio" onClick={() => setAspectLocked(value => !value)}><Link2 size={15}/></button><label><span>Height <small>{unit === 'pixels' ? 'px' : unit === 'percent' ? '%' : unit === 'centimeters' ? 'cm' : 'in'}</small></span><input type="number" min="0.01" step={unit === 'pixels' ? 1 : .01} value={pixelsToUnit(height, 'height')} onChange={event => updateHeight(event.target.value)}/></label></div>
        <div className="image-resizer-scale"><span>Quick scale from selected image</span><div>{[25,50,75,100].map(value => <button type="button" disabled={!selected} onClick={() => scaleSelected(value)} key={value}>{value}%</button>)}</div></div>
        <div className="image-resizer-presets"><span>Popular sizes</span><div>{presets.map(preset => <button type="button" className={targetWidth === preset.width && targetHeight === preset.height ? 'active' : ''} onClick={() => applyPreset(preset)} key={preset.label}><strong>{preset.label}</strong><small>{preset.width} × {preset.height}</small></button>)}</div></div>
        <div className="image-resizer-fit"><span>Image fit</span><div role="group" aria-label="Image fit">{[['contain','Fit inside'],['cover','Fill & crop'],['stretch','Stretch']].map(([value,label]) => <button type="button" className={fit === value ? 'active' : ''} aria-pressed={fit === value} onClick={() => setFit(value)} key={value}>{label}</button>)}</div></div>
        <FlowSelect label="Output format" value={format} onChange={setFormat} options={[{ value: 'original', label: 'Keep original format', description: 'Preserve each image file type' }, { value: 'webp', label: 'WebP', description: 'Small modern files for the web' }, { value: 'jpeg', label: 'JPEG', description: 'Great for photos and sharing' }, { value: 'png', label: 'PNG', description: 'Lossless quality and transparency' }]}/>
        <label className="image-compressor-field quality"><span><b>Output quality</b><output>{quality}%</output></span><input type="range" min="20" max="100" value={quality} disabled={format === 'png'} onChange={event => setQuality(Number(event.target.value))}/></label>
        {fit === 'contain' && <div className="image-resizer-background"><label><input type="checkbox" checked={transparent && transparentAvailable} disabled={!transparentAvailable} onChange={event => setTransparent(event.target.checked)}/><span>Transparent empty space</span></label><label className={!transparentAvailable || !transparent ? 'visible' : ''}><span>Background</span><input type="color" value={background} disabled={transparent && transparentAvailable} onChange={event => setBackground(event.target.value)}/><code>{background}</code></label></div>}
        <div className="image-compressor-privacy"><ShieldCheck size={17}/><span><strong>Images stay private</strong><small>Resizing happens locally in this browser tab.</small></span></div>
      </aside>

      <div className="image-compressor-main">
        <input ref={inputRef} type="file" className="image-compressor-input" accept="image/jpeg,image/png,image/webp" multiple onChange={event => { addFiles(event.target.files || []); event.target.value = '' }}/>
        {!items.length ? <button type="button" className={`image-compressor-dropzone ${dragging ? 'dragging' : ''}`} onClick={() => inputRef.current?.click()} onDragEnter={event => { event.preventDefault(); setDragging(true) }} onDragOver={event => event.preventDefault()} onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false) }} onDrop={event => { event.preventDefault(); setDragging(false); addFiles(event.dataTransfer.files) }}><span><UploadCloud size={28}/></span><strong>Drop images here</strong><p>or click to choose JPEG, PNG or WebP files</p><small>Up to {maxFiles} images · {formatBytes(maxFileSize)} each</small></button> : <>
          <div className="image-compressor-toolbar"><div><strong>{items.length} image{items.length === 1 ? '' : 's'}</strong><span>Output: {targetWidth} × {targetHeight} px</span></div><div><button type="button" onClick={() => inputRef.current?.click()}><UploadCloud size={15}/> Add images</button><button type="button" className="danger" onClick={clearAll}><Trash2 size={14}/> Clear</button></div></div>
          <div className="image-compressor-content"><div className="image-compressor-queue" aria-label="Selected images">{items.map(item => <article className={selected?.id === item.id ? 'active' : ''} key={item.id} onClick={() => setSelectedId(item.id)}><img src={item.resultUrl || item.originalUrl} alt=""/><div><strong title={item.file.name}>{item.file.name}</strong><span>{item.width} × {item.height} px</span><small className={item.status}>{item.status === 'resizing' ? 'Resizing…' : item.status === 'done' ? `${item.resultWidth} × ${item.resultHeight} · ${formatBytes(item.resultBlob.size)}` : item.status === 'error' ? item.error : 'Ready'}</small></div><button type="button" aria-label={`Remove ${item.file.name}`} onClick={event => { event.stopPropagation(); removeItem(item.id) }}><X size={14}/></button></article>)}</div>
            <div className="image-compressor-preview">{selected ? <><div className="image-compressor-preview-head"><div><span>PREVIEW</span><h2>{selected.file.name}</h2></div>{selected.resultBlob && <button type="button" onClick={() => downloadItem(selected)}><Download size={15}/> Download</button>}</div><div className={`image-compressor-stage ${selected.status}`}><img src={selected.resultUrl || selected.originalUrl} alt={`Preview of ${selected.file.name}`}/>{selected.status === 'resizing' && <span><RefreshCw size={22}/> Resizing image…</span>}{selected.status === 'error' && <span className="error"><CircleAlert size={22}/> {selected.error}</span>}</div><div className="image-compressor-comparison"><div><span>ORIGINAL</span><strong>{selected.width} × {selected.height}</strong><small>{formatBytes(selected.file.size)}</small></div><div><span>OUTPUT</span><strong>{selected.resultBlob ? `${selected.resultWidth} × ${selected.resultHeight}` : `${targetWidth} × ${targetHeight}`}</strong><small>{selected.resultBlob ? `${selected.mime.replace('image/', '').toUpperCase()} · ${formatBytes(selected.resultBlob.size)}` : 'Ready to resize'}</small></div></div></> : <div className="image-compressor-empty"><ImageIcon size={28}/><strong>Select an image</strong></div>}</div>
          </div>
        </>}
        {notice && <div className="image-compressor-notice" role="alert"><CircleAlert size={16}/><span>{notice}</span><button type="button" aria-label="Dismiss message" onClick={() => setNotice('')}><X size={14}/></button></div>}
        {!!items.length && <div className="image-compressor-actions"><div>{completed.length ? <><Check size={17}/><span><strong>{completed.length} resized</strong><small>{formatBytes(totalOutputSize)} total output</small></span></> : <><FileImage size={17}/><span><strong>Ready to resize</strong><small>Every image will use {targetWidth} × {targetHeight} px.</small></span></>}</div><div>{completed.length > 1 && <button type="button" className="secondary" onClick={downloadAll}><Download size={16}/> Download all</button>}<button type="button" className="primary" disabled={resizing} onClick={resizeAll}>{resizing ? <RefreshCw size={16}/> : <Sparkles size={16}/>} {resizing ? 'Resizing…' : completed.length ? 'Resize again' : 'Resize images'}</button></div></div>}
      </div>
    </section>
  </main>
}
