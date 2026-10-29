import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft, Check, CircleAlert, Download, FileImage, ImageDown, ImageIcon,
  RefreshCw, ShieldCheck, SlidersHorizontal, Sparkles, Trash2, UploadCloud, X,
} from 'lucide-react'
import { routeUrl } from './navigation.js'
import FlowSelect from './FlowSelect.jsx'
import './image-compressor.css'

const acceptedTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])
const maxFileSize = 30 * 1024 * 1024
const maxFiles = 20

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

function loadImage(file) {
  if ('createImageBitmap' in window) return createImageBitmap(file).then(bitmap => ({
    width: bitmap.width,
    height: bitmap.height,
    draw: (context, width, height) => context.drawImage(bitmap, 0, 0, width, height),
    close: () => bitmap.close(),
  }))
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => resolve({
      width: image.naturalWidth,
      height: image.naturalHeight,
      draw: (context, width, height) => context.drawImage(image, 0, 0, width, height),
      close: () => URL.revokeObjectURL(url),
    })
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('This image could not be decoded.')) }
    image.src = url
  })
}

async function compressImage(file, { format, quality, maxDimension, keepSmaller }) {
  const source = await loadImage(file)
  try {
    const requestedLimit = Number(maxDimension)
    const limit = requestedLimit > 0 ? Math.max(320, requestedLimit) : Number.POSITIVE_INFINITY
    const scale = Math.min(1, limit / Math.max(source.width, source.height))
    const width = Math.max(1, Math.round(source.width * scale))
    const height = Math.max(1, Math.round(source.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d', { alpha: true })
    const mime = outputType(format, file.type)
    if (mime === 'image/jpeg') {
      context.fillStyle = '#ffffff'
      context.fillRect(0, 0, width, height)
    }
    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'
    source.draw(context, width, height)
    const encoded = await new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('The browser could not encode this image.')), mime, Math.max(.1, Math.min(1, quality / 100))))
    const canKeepOriginal = keepSmaller && encoded.size >= file.size && scale === 1
    return {
      blob: canKeepOriginal ? file : encoded,
      mime: canKeepOriginal ? file.type : mime,
      width: canKeepOriginal ? source.width : width,
      height: canKeepOriginal ? source.height : height,
      unchanged: canKeepOriginal,
    }
  } finally {
    source.close()
  }
}

export default function ImageCompressor({ onExit }) {
  const inputRef = useRef(null)
  const itemsRef = useRef([])
  const [items, setItems] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [format, setFormat] = useState('original')
  const [quality, setQuality] = useState(76)
  const [maxDimension, setMaxDimension] = useState('1920')
  const [keepSmaller, setKeepSmaller] = useState(true)
  const [dragging, setDragging] = useState(false)
  const [compressing, setCompressing] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => { itemsRef.current = items }, [items])
  useEffect(() => () => itemsRef.current.forEach(item => {
    URL.revokeObjectURL(item.originalUrl)
    if (item.resultUrl && item.resultUrl !== item.originalUrl) URL.revokeObjectURL(item.resultUrl)
  }), [])

  const selected = items.find(item => item.id === selectedId) || items[0] || null
  const completed = items.filter(item => item.status === 'done')
  const totals = useMemo(() => {
    const original = completed.reduce((sum, item) => sum + item.file.size, 0)
    const compressed = completed.reduce((sum, item) => sum + (item.resultBlob?.size || 0), 0)
    return { original, compressed, saved: original - compressed, percent: original ? Math.round((original - compressed) / original * 100) : 0 }
  }, [completed])

  const addFiles = incoming => {
    const files = [...incoming]
    const valid = files.filter(file => acceptedTypes.has(file.type) && file.size <= maxFileSize)
    const rejected = files.length - valid.length
    const available = Math.max(0, maxFiles - items.length)
    const accepted = valid.slice(0, available)
    if (rejected || valid.length > available) setNotice(`${rejected ? `${rejected} unsupported or oversized file${rejected === 1 ? '' : 's'}. ` : ''}${valid.length > available ? `Flowly accepts up to ${maxFiles} images at once.` : ''}`.trim())
    else setNotice('')
    if (!accepted.length) return
    const added = accepted.map(file => ({
      id: `${Date.now().toString(36)}-${crypto.randomUUID?.() || Math.random().toString(36).slice(2)}`,
      file,
      originalUrl: URL.createObjectURL(file),
      resultUrl: '',
      resultBlob: null,
      status: 'ready',
      error: '',
    }))
    setItems(current => [...current, ...added])
    setSelectedId(current => current || added[0].id)
  }

  const removeItem = id => {
    const item = items.find(entry => entry.id === id)
    if (item) {
      URL.revokeObjectURL(item.originalUrl)
      if (item.resultUrl && item.resultUrl !== item.originalUrl) URL.revokeObjectURL(item.resultUrl)
    }
    setItems(current => current.filter(entry => entry.id !== id))
    if (selectedId === id) setSelectedId(items.find(entry => entry.id !== id)?.id || null)
  }

  const clearAll = () => {
    items.forEach(item => {
      URL.revokeObjectURL(item.originalUrl)
      if (item.resultUrl && item.resultUrl !== item.originalUrl) URL.revokeObjectURL(item.resultUrl)
    })
    setItems([])
    setSelectedId(null)
    setNotice('')
  }

  const compressAll = async () => {
    if (!items.length || compressing) return
    setCompressing(true)
    setNotice('')
    for (const item of items) {
      setItems(current => current.map(entry => entry.id === item.id ? { ...entry, status: 'compressing', error: '' } : entry))
      try {
        const result = await compressImage(item.file, { format, quality, maxDimension, keepSmaller })
        const resultUrl = result.blob === item.file ? item.originalUrl : URL.createObjectURL(result.blob)
        if (item.resultUrl && item.resultUrl !== item.originalUrl) URL.revokeObjectURL(item.resultUrl)
        setItems(current => current.map(entry => entry.id === item.id ? {
          ...entry,
          ...result,
          resultBlob: result.blob,
          resultUrl,
          status: 'done',
        } : entry))
      } catch (error) {
        setItems(current => current.map(entry => entry.id === item.id ? { ...entry, status: 'error', error: error?.message || 'Compression failed.' } : entry))
      }
      await new Promise(resolve => window.setTimeout(resolve, 20))
    }
    setCompressing(false)
  }

  const downloadItem = item => {
    if (!item?.resultBlob) return
    const anchor = document.createElement('a')
    anchor.href = item.resultUrl
    anchor.download = `${fileStem(item.file.name)}-compressed.${extensionFor(item.mime)}`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
  }

  const downloadAll = () => completed.forEach((item, index) => window.setTimeout(() => downloadItem(item), index * 180))
  const savingText = item => {
    if (!item?.resultBlob) return ''
    const difference = item.file.size - item.resultBlob.size
    const percent = Math.round(Math.abs(difference) / Math.max(1, item.file.size) * 100)
    if (item.unchanged) return 'Original was already smaller'
    return difference >= 0 ? `${percent}% smaller` : `${percent}% larger`
  }

  return <main className="image-compressor-app">
    <header className="image-compressor-header"><button type="button" onClick={onExit}><ArrowLeft size={17}/> Flowly</button><a href={routeUrl('/utilities/image-compressor')}><span><ImageDown size={19}/></span>Image Compressor</a><p><ShieldCheck size={15}/> Browser only</p></header>

    <section className="image-compressor-intro"><div><span>FLOWLY UTILITY</span><h1>Compress images without uploading.</h1></div><p>Reduce JPEG, PNG and WebP file sizes, resize oversized photos and compare the result before downloading. Everything stays on your device.</p></section>

    <section className="image-compressor-workspace">
      <aside className="image-compressor-settings">
        <div className="image-compressor-panel-title"><SlidersHorizontal size={17}/><div><span>COMPRESSION</span><h2>Output settings</h2></div></div>
        <FlowSelect label="Output format" value={format} onChange={setFormat} options={[{ value: 'original', label: 'Keep original format', description: 'Preserve each image file type' }, { value: 'webp', label: 'WebP', description: 'Small modern files for the web' }, { value: 'jpeg', label: 'JPEG', description: 'Great for photos and sharing' }, { value: 'png', label: 'PNG', description: 'Lossless quality and transparency' }]}/>
        <label className="image-compressor-field quality"><span><b>Quality</b><output>{quality}%</output></span><input type="range" min="20" max="100" step="1" value={quality} disabled={format === 'png'} onChange={event => setQuality(Number(event.target.value))}/><small>{format === 'png' ? 'PNG uses lossless browser encoding.' : quality >= 85 ? 'High quality, larger output.' : quality >= 65 ? 'Balanced quality and file size.' : 'Strong compression; inspect details carefully.'}</small></label>
        <FlowSelect label="Maximum long edge" value={maxDimension} onChange={setMaxDimension} options={[{ value: '0', label: 'Keep dimensions', description: 'Compress without resizing' }, { value: '3840', label: '3840 px · 4K', description: 'Large displays and print' }, { value: '2560', label: '2560 px', description: 'High-resolution screens' }, { value: '1920', label: '1920 px · recommended', description: 'Balanced for most websites' }, { value: '1280', label: '1280 px', description: 'Smaller web images' }, { value: '800', label: '800 px', description: 'Thumbnails and compact sharing' }]}/>
        <label className="image-compressor-toggle"><input type="checkbox" checked={keepSmaller} onChange={event => setKeepSmaller(event.target.checked)}/><span><strong>Never make a file larger</strong><small>Keep the original when re-encoding would increase its size.</small></span></label>
        <div className="image-compressor-privacy"><ShieldCheck size={17}/><span><strong>Private by design</strong><small>Canvas compression runs locally. Images are never sent to Flowly.</small></span></div>
      </aside>

      <div className="image-compressor-main">
        <input ref={inputRef} type="file" className="image-compressor-input" accept="image/jpeg,image/png,image/webp" multiple onChange={event => { addFiles(event.target.files || []); event.target.value = '' }}/>
        {!items.length ? <button type="button" className={`image-compressor-dropzone ${dragging ? 'dragging' : ''}`} onClick={() => inputRef.current?.click()} onDragEnter={event => { event.preventDefault(); setDragging(true) }} onDragOver={event => event.preventDefault()} onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false) }} onDrop={event => { event.preventDefault(); setDragging(false); addFiles(event.dataTransfer.files) }}>
          <span><UploadCloud size={28}/></span><strong>Drop images here</strong><p>or click to choose JPEG, PNG or WebP files</p><small>Up to {maxFiles} images · {formatBytes(maxFileSize)} each</small>
        </button> : <>
          <div className="image-compressor-toolbar"><div><strong>{items.length} image{items.length === 1 ? '' : 's'}</strong><span>{formatBytes(items.reduce((sum, item) => sum + item.file.size, 0))} original</span></div><div><button type="button" onClick={() => inputRef.current?.click()}><UploadCloud size={15}/> Add images</button><button type="button" className="danger" onClick={clearAll}><Trash2 size={14}/> Clear</button></div></div>
          <div className="image-compressor-content">
            <div className="image-compressor-queue" aria-label="Selected images">{items.map(item => <article className={selected?.id === item.id ? 'active' : ''} key={item.id} onClick={() => setSelectedId(item.id)}>
              <img src={item.resultUrl || item.originalUrl} alt=""/><div><strong title={item.file.name}>{item.file.name}</strong><span>{formatBytes(item.file.size)}{item.resultBlob ? ` → ${formatBytes(item.resultBlob.size)}` : ''}</span><small className={item.status}>{item.status === 'compressing' ? 'Compressing…' : item.status === 'done' ? savingText(item) : item.status === 'error' ? item.error : 'Ready'}</small></div>
              <button type="button" aria-label={`Remove ${item.file.name}`} onClick={event => { event.stopPropagation(); removeItem(item.id) }}><X size={14}/></button>
            </article>)}</div>

            <div className="image-compressor-preview">{selected ? <>
              <div className="image-compressor-preview-head"><div><span>PREVIEW</span><h2>{selected.file.name}</h2></div>{selected.resultBlob && <button type="button" onClick={() => downloadItem(selected)}><Download size={15}/> Download</button>}</div>
              <div className={`image-compressor-stage ${selected.status}`}><img src={selected.resultUrl || selected.originalUrl} alt={`Preview of ${selected.file.name}`}/>{selected.status === 'compressing' && <span><RefreshCw size={22}/> Compressing image…</span>}{selected.status === 'error' && <span className="error"><CircleAlert size={22}/> {selected.error}</span>}</div>
              <div className="image-compressor-comparison"><div><span>ORIGINAL</span><strong>{formatBytes(selected.file.size)}</strong><small>{selected.file.type.replace('image/', '').toUpperCase()}</small></div><div><span>OUTPUT</span><strong>{selected.resultBlob ? formatBytes(selected.resultBlob.size) : '—'}</strong><small>{selected.resultBlob ? `${selected.mime.replace('image/', '').toUpperCase()} · ${savingText(selected)}` : 'Run compression'}</small></div></div>
            </> : <div className="image-compressor-empty"><ImageIcon size={28}/><strong>Select an image</strong></div>}</div>
          </div>
        </>}
        {notice && <div className="image-compressor-notice" role="alert"><CircleAlert size={16}/><span>{notice}</span><button type="button" aria-label="Dismiss message" onClick={() => setNotice('')}><X size={14}/></button></div>}
        {!!items.length && <div className="image-compressor-actions"><div>{completed.length ? <><Check size={17}/><span><strong>{completed.length} compressed</strong><small>{totals.saved >= 0 ? `${formatBytes(totals.saved)} saved · ${Math.max(0, totals.percent)}% smaller overall` : `${formatBytes(Math.abs(totals.saved))} larger overall`}</small></span></> : <><FileImage size={17}/><span><strong>Ready to compress</strong><small>Adjust the settings, then process every queued image.</small></span></>}</div><div>{completed.length > 1 && <button type="button" className="secondary" onClick={downloadAll}><Download size={16}/> Download all</button>}<button type="button" className="primary" disabled={compressing} onClick={compressAll}>{compressing ? <RefreshCw size={16}/> : <Sparkles size={16}/>} {compressing ? 'Compressing…' : completed.length ? 'Compress again' : 'Compress images'}</button></div></div>}
      </div>
    </section>
  </main>
}
