import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Check, CircleAlert, Download, FileImage, ImageIcon, RefreshCw, ShieldCheck, Sparkles, Trash2, UploadCloud, X, ZoomIn, ZoomOut } from 'lucide-react'
import FlowSelect from './FlowSelect.jsx'
import { routeUrl } from './navigation.js'
import './image-compressor.css'
import './png-maker.css'

const acceptedTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])
const maxFileSize = 30 * 1024 * 1024
const maxFiles = 20
const formatBytes = value => {
  const bytes = Math.max(0, Number(value) || 0)
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB']; let size = bytes / 1024; let unit = 0
  while (size >= 1024 && unit < units.length - 1) { size /= 1024; unit += 1 }
  return `${size >= 100 ? size.toFixed(0) : size >= 10 ? size.toFixed(1) : size.toFixed(2)} ${units[unit]}`
}
const fileStem = name => String(name || 'image').replace(/\.[^.]+$/, '') || 'image'

function loadBitmap(file) {
  if ('createImageBitmap' in window) return createImageBitmap(file)
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file); const image = new Image()
    image.onload = () => { image.close = () => URL.revokeObjectURL(url); resolve(image) }
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('This image could not be decoded.')) }
    image.src = url
  })
}

async function inspectImage(file) {
  const image = await loadBitmap(file)
  try { return { width: image.width || image.naturalWidth, height: image.height || image.naturalHeight } }
  finally { image.close?.() }
}

function resolveCrop(width, height, crop) {
  if (crop.mode === 'free') {
    const sourcePoints = (crop.points || []).map(point => ({ x: width * point.x / 100, y: height * point.y / 100 }))
    if (sourcePoints.length < 3) throw new Error('Draw and finish a crop shape before creating the PNG.')
    const x = Math.max(0, Math.floor(Math.min(...sourcePoints.map(point => point.x))))
    const y = Math.max(0, Math.floor(Math.min(...sourcePoints.map(point => point.y))))
    const right = Math.min(width, Math.ceil(Math.max(...sourcePoints.map(point => point.x))))
    const bottom = Math.min(height, Math.ceil(Math.max(...sourcePoints.map(point => point.y))))
    return {
      x,
      y,
      width: Math.max(1, right - x),
      height: Math.max(1, bottom - y),
      points: sourcePoints.map(point => ({ x: point.x - x, y: point.y - y })),
    }
  }
  if (crop.mode === 'landscape' || crop.mode === 'portrait') {
    const ratio = crop.mode === 'landscape' ? 16 / 9 : 4 / 5
    const sourceRatio = width / height
    const cropWidth = sourceRatio > ratio ? Math.round(height * ratio) : width
    const cropHeight = sourceRatio > ratio ? height : Math.round(width / ratio)
    return { x: Math.round((width - cropWidth) / 2), y: Math.round((height - cropHeight) / 2), width: cropWidth, height: cropHeight }
  }
  if (crop.mode === 'square' || crop.mode === 'circle' || crop.mode === 'rounded') {
    const size = Math.min(width, height)
    return { x: Math.round((width - size) / 2), y: Math.round((height - size) / 2), width: size, height: size }
  }
  return { x: 0, y: 0, width, height }
}

function roundedPath(context, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2)
  context.beginPath(); context.moveTo(r, 0); context.lineTo(width - r, 0); context.quadraticCurveTo(width, 0, width, r); context.lineTo(width, height - r); context.quadraticCurveTo(width, height, width - r, height); context.lineTo(r, height); context.quadraticCurveTo(0, height, 0, height - r); context.lineTo(0, r); context.quadraticCurveTo(0, 0, r, 0); context.closePath()
}

async function makePng(file, background, customColor, crop) {
  const image = await loadBitmap(file)
  try {
    const sourceWidth = image.width || image.naturalWidth; const sourceHeight = image.height || image.naturalHeight
    const area = resolveCrop(sourceWidth, sourceHeight, crop)
    const canvas = document.createElement('canvas'); canvas.width = area.width; canvas.height = area.height
    const context = canvas.getContext('2d', { alpha: true })
    if (crop.mode === 'free') {
      context.beginPath()
      area.points.forEach((point, index) => index ? context.lineTo(point.x, point.y) : context.moveTo(point.x, point.y))
      context.closePath(); context.clip()
    }
    if (crop.mode === 'circle') { context.beginPath(); context.arc(area.width / 2, area.height / 2, Math.min(area.width, area.height) / 2, 0, Math.PI * 2); context.clip() }
    if (crop.mode === 'rounded') { roundedPath(context, area.width, area.height, Math.min(area.width, area.height) * .16); context.clip() }
    if (background !== 'transparent') { context.fillStyle = background === 'white' ? '#ffffff' : customColor; context.fillRect(0, 0, area.width, area.height) }
    context.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, area.width, area.height)
    const blob = await new Promise((resolve, reject) => canvas.toBlob(result => result ? resolve(result) : reject(new Error('The browser could not create this PNG.')), 'image/png'))
    return { blob, resultWidth: area.width, resultHeight: area.height }
  } finally { image.close?.() }
}

export default function PngMaker({ onExit }) {
  const inputRef = useRef(null); const itemsRef = useRef([]); const cropStageRef = useRef(null); const cropSurfaceRef = useRef(null); const cropPointerRef = useRef(null)
  const touchPointersRef = useRef(new Map()); const pinchRef = useRef(null); const previewZoomRef = useRef(1)
  const [items, setItems] = useState([]); const [selectedId, setSelectedId] = useState(null)
  const [background, setBackground] = useState('transparent'); const [customColor, setCustomColor] = useState('#ffffff')
  const [cropMode, setCropMode] = useState('original'); const [freeCropPoints, setFreeCropPoints] = useState([]); const [freeCropClosed, setFreeCropClosed] = useState(false)
  const [cropPreviewBounds, setCropPreviewBounds] = useState({ left: 0, top: 0, width: 0, height: 0 })
  const [previewZoom, setPreviewZoom] = useState(1); const [dragging, setDragging] = useState(false); const [converting, setConverting] = useState(false); const [notice, setNotice] = useState('')
  useEffect(() => { itemsRef.current = items }, [items])
  useEffect(() => () => itemsRef.current.forEach(item => { URL.revokeObjectURL(item.originalUrl); if (item.resultUrl) URL.revokeObjectURL(item.resultUrl) }), [])
  const selected = items.find(item => item.id === selectedId) || items[0] || null
  const completed = items.filter(item => item.status === 'done')
  const totalOutputSize = useMemo(() => completed.reduce((sum, item) => sum + (item.resultBlob?.size || 0), 0), [completed])
  useEffect(() => {
    const stage = cropStageRef.current
    const previewWidth = selected?.resultWidth || selected?.width; const previewHeight = selected?.resultHeight || selected?.height
    if (!stage || !previewWidth || !previewHeight) return undefined
    const updateBounds = () => {
      const width = stage.clientWidth; const height = stage.clientHeight; const imageRatio = previewWidth / previewHeight; const stageRatio = width / height
      const fittedWidth = imageRatio > stageRatio ? width : height * imageRatio
      const fittedHeight = imageRatio > stageRatio ? width / imageRatio : height
      const scale = Math.min(1, fittedWidth / previewWidth, fittedHeight / previewHeight)
      const displayWidth = previewWidth * scale
      const displayHeight = previewHeight * scale
      setCropPreviewBounds({ left: (width - displayWidth) / 2, top: (height - displayHeight) / 2, width: displayWidth, height: displayHeight })
    }
    updateBounds()
    const observer = new ResizeObserver(updateBounds); observer.observe(stage)
    return () => observer.disconnect()
  }, [selected?.id, selected?.width, selected?.height, selected?.resultWidth, selected?.resultHeight])
  useEffect(() => { previewZoomRef.current = 1; setPreviewZoom(1) }, [selected?.id])
  const invalidateResults = () => setItems(current => current.map(item => {
    if (item.resultUrl) URL.revokeObjectURL(item.resultUrl)
    return item.resultBlob ? { ...item, resultUrl: '', resultBlob: null, resultWidth: null, resultHeight: null, status: item.width ? 'ready' : item.status } : item
  }))
  const changeBackground = value => { setBackground(value); invalidateResults() }
  const changeCropMode = value => { setCropMode(value); invalidateResults() }
  const clampPercent = value => Math.max(0, Math.min(100, value))
  const pointInCrop = event => {
    const surfaceRect = cropSurfaceRef.current.getBoundingClientRect()
    const rawX = (event.clientX - surfaceRect.left) / surfaceRect.width * 100
    const rawY = (event.clientY - surfaceRect.top) / surfaceRect.height * 100
    return {
      x: clampPercent(rawX),
      y: clampPercent(rawY),
      inside: rawX >= 0 && rawX <= 100 && rawY >= 0 && rawY <= 100,
    }
  }
  const normalizedZoom = value => Math.max(1, Math.min(4, Number(value.toFixed(2))))
  const zoomAroundPoint = (nextZoom, anchorX, anchorY, targetX = anchorX, targetY = anchorY) => {
    const stage = cropStageRef.current; const surface = cropSurfaceRef.current
    if (!stage || !surface || !cropPreviewBounds.width) return
    const zoom = normalizedZoom(nextZoom); const stageRect = stage.getBoundingClientRect(); const surfaceRect = surface.getBoundingClientRect()
    const ratioX = surfaceRect.width ? Math.max(0, Math.min(1, (anchorX - surfaceRect.left) / surfaceRect.width)) : .5
    const ratioY = surfaceRect.height ? Math.max(0, Math.min(1, (anchorY - surfaceRect.top) / surfaceRect.height)) : .5
    const offsetX = targetX - stageRect.left; const offsetY = targetY - stageRect.top
    previewZoomRef.current = zoom; setPreviewZoom(zoom)
    window.requestAnimationFrame(() => {
      stage.scrollLeft = Math.max(0, ratioX * cropPreviewBounds.width * zoom - offsetX)
      stage.scrollTop = Math.max(0, ratioY * cropPreviewBounds.height * zoom - offsetY)
    })
  }
  const zoomFromCentre = nextZoom => {
    const stage = cropStageRef.current
    if (!stage) return
    const rect = stage.getBoundingClientRect(); zoomAroundPoint(nextZoom, rect.left + rect.width / 2, rect.top + rect.height / 2)
  }
  const handlePreviewWheel = event => {
    if (!selected || !event.deltaY) return
    event.preventDefault()
    zoomAroundPoint(previewZoomRef.current * (event.deltaY < 0 ? 1.12 : 1 / 1.12), event.clientX, event.clientY)
  }
  const touchPair = () => [...touchPointersRef.current.values()].slice(0, 2)
  const touchDistance = ([first, second]) => Math.hypot(second.x - first.x, second.y - first.y)
  const touchCentre = ([first, second]) => ({ x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 })
  const beginCropPointer = event => {
    if (!selected || event.button !== 0 || !cropPreviewBounds.width) return
    if (event.pointerType === 'touch') {
      touchPointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
      event.currentTarget.setPointerCapture(event.pointerId)
      if (touchPointersRef.current.size >= 2) {
        const pair = touchPair(); const centre = touchCentre(pair)
        pinchRef.current = { startDistance: Math.max(1, touchDistance(pair)), startZoom: previewZoomRef.current, lastCentre: centre }
        cropPointerRef.current = null; event.preventDefault(); return
      }
    }
    if (cropMode !== 'free' || selected.resultBlob) {
      if (event.pointerType === 'touch' && previewZoom > 1) cropPointerRef.current = { pointerId: event.pointerId, action: 'pan', startClient: { x: event.clientX, y: event.clientY }, scrollLeft: event.currentTarget.scrollLeft, scrollTop: event.currentTarget.scrollTop }
      return
    }
    const point = pointInCrop(event); const pointIndex = event.target.dataset.cropPoint
    if (pointIndex !== undefined) {
      const index = Number(pointIndex)
      if (!freeCropClosed && index === 0 && freeCropPoints.length >= 3) {
        setFreeCropClosed(true); event.preventDefault(); return
      }
      cropPointerRef.current = { pointerId: event.pointerId, action: 'point', pointIndex: index, start: point, points: freeCropPoints.map(entry => ({ ...entry })) }
    } else if (freeCropClosed && event.target.closest('[data-polygon-area]')) {
      cropPointerRef.current = { pointerId: event.pointerId, action: 'move', start: point, points: freeCropPoints.map(entry => ({ ...entry })) }
    } else if (!freeCropClosed && point.inside) {
      if (event.pointerType === 'touch') cropPointerRef.current = { pointerId: event.pointerId, action: 'tap', start: point, startClient: { x: event.clientX, y: event.clientY }, moved: false }
      else { setFreeCropPoints(current => [...current, { x: point.x, y: point.y }]); event.preventDefault(); return }
    } else if (event.pointerType === 'touch' && previewZoom > 1) {
      cropPointerRef.current = { pointerId: event.pointerId, action: 'pan', startClient: { x: event.clientX, y: event.clientY }, scrollLeft: event.currentTarget.scrollLeft, scrollTop: event.currentTarget.scrollTop }
    } else return
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.setPointerCapture(event.pointerId)
    event.preventDefault()
  }
  const moveCropPointer = event => {
    if (event.pointerType === 'touch' && touchPointersRef.current.has(event.pointerId)) {
      touchPointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
      if (pinchRef.current && touchPointersRef.current.size >= 2) {
        const pair = touchPair(); const centre = touchCentre(pair); const pinch = pinchRef.current
        zoomAroundPoint(pinch.startZoom * touchDistance(pair) / pinch.startDistance, pinch.lastCentre.x, pinch.lastCentre.y, centre.x, centre.y)
        pinch.lastCentre = centre; event.preventDefault(); return
      }
    }
    const drag = cropPointerRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    if (drag.action === 'tap') {
      if (Math.hypot(event.clientX - drag.startClient.x, event.clientY - drag.startClient.y) > 6) drag.moved = true
      return
    }
    if (drag.action === 'pan') {
      event.currentTarget.scrollLeft = drag.scrollLeft - (event.clientX - drag.startClient.x)
      event.currentTarget.scrollTop = drag.scrollTop - (event.clientY - drag.startClient.y)
      event.preventDefault(); return
    }
    const point = pointInCrop(event); const dx = point.x - drag.start.x; const dy = point.y - drag.start.y
    if (drag.action === 'point') {
      setFreeCropPoints(drag.points.map((entry, index) => index === drag.pointIndex ? { x: point.x, y: point.y } : entry))
      return
    }
    if (drag.action === 'move') {
      const minX = Math.min(...drag.points.map(entry => entry.x)); const maxX = Math.max(...drag.points.map(entry => entry.x))
      const minY = Math.min(...drag.points.map(entry => entry.y)); const maxY = Math.max(...drag.points.map(entry => entry.y))
      const safeDx = Math.max(-minX, Math.min(100 - maxX, dx)); const safeDy = Math.max(-minY, Math.min(100 - maxY, dy))
      setFreeCropPoints(drag.points.map(entry => ({ x: entry.x + safeDx, y: entry.y + safeDy })))
    }
  }
  const endCropPointer = event => {
    const drag = cropPointerRef.current
    const wasPinching = Boolean(pinchRef.current)
    if (drag?.pointerId === event.pointerId) {
      if (drag.action === 'tap' && !drag.moved && !wasPinching) setFreeCropPoints(current => [...current, { x: drag.start.x, y: drag.start.y }])
      cropPointerRef.current = null
    }
    if (event.pointerType === 'touch') {
      touchPointersRef.current.delete(event.pointerId)
      if (touchPointersRef.current.size < 2) pinchRef.current = null
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }
  const resetFreeCrop = () => { setFreeCropPoints([]); setFreeCropClosed(false); invalidateResults() }
  const finishFreeCrop = () => {
    if (freeCropPoints.length < 3) { setNotice('Add at least 3 points to finish the free crop shape.'); return }
    setFreeCropClosed(true); setNotice('')
  }

  const addFiles = async incoming => {
    const files = [...incoming]; const valid = files.filter(file => acceptedTypes.has(file.type) && file.size <= maxFileSize)
    const accepted = valid.slice(0, Math.max(0, maxFiles - items.length))
    if (accepted.length !== files.length) setNotice(`Use JPEG, PNG or WebP images up to ${formatBytes(maxFileSize)}. Maximum ${maxFiles} files.`); else setNotice('')
    const added = await Promise.all(accepted.map(async file => {
      const id = `${Date.now().toString(36)}-${crypto.randomUUID?.() || Math.random().toString(36).slice(2)}`
      try { return { id, file, ...(await inspectImage(file)), originalUrl: URL.createObjectURL(file), resultUrl: '', resultBlob: null, status: 'ready', error: '' } }
      catch (error) { return { id, file, width: 0, height: 0, originalUrl: URL.createObjectURL(file), resultUrl: '', resultBlob: null, status: 'error', error: error?.message || 'Could not open this image.' } }
    }))
    if (!added.length) return
    setItems(current => [...current, ...added]); setSelectedId(current => current || added[0].id)
  }
  const removeItem = id => {
    const item = items.find(entry => entry.id === id); if (item) { URL.revokeObjectURL(item.originalUrl); if (item.resultUrl) URL.revokeObjectURL(item.resultUrl) }
    setItems(current => current.filter(entry => entry.id !== id)); if (selectedId === id) setSelectedId(items.find(entry => entry.id !== id)?.id || null)
  }
  const clearAll = () => { items.forEach(item => { URL.revokeObjectURL(item.originalUrl); if (item.resultUrl) URL.revokeObjectURL(item.resultUrl) }); setItems([]); setSelectedId(null); setNotice('') }
  const convertAll = async () => {
    if (!items.length || converting) return
    if (cropMode === 'free' && (!freeCropClosed || freeCropPoints.length < 3)) { setNotice('Finish the free crop shape before creating PNGs.'); return }
    setConverting(true); setNotice('')
    for (const item of items) {
      if (!item.width) continue
      setItems(current => current.map(entry => entry.id === item.id ? { ...entry, status: 'converting', error: '' } : entry))
      try {
        const result = await makePng(item.file, background, customColor, { mode: cropMode, points: freeCropPoints }); const resultUrl = URL.createObjectURL(result.blob)
        if (item.resultUrl) URL.revokeObjectURL(item.resultUrl)
        setItems(current => current.map(entry => entry.id === item.id ? { ...entry, ...result, resultBlob: result.blob, resultUrl, status: 'done' } : entry))
      } catch (error) { setItems(current => current.map(entry => entry.id === item.id ? { ...entry, status: 'error', error: error?.message || 'PNG conversion failed.' } : entry)) }
    }
    setConverting(false)
  }
  const downloadItem = item => {
    if (!item?.resultBlob) return
    const anchor = document.createElement('a'); anchor.href = item.resultUrl; anchor.download = `${fileStem(item.file.name)}.png`; document.body.appendChild(anchor); anchor.click(); anchor.remove()
  }
  const downloadAll = () => completed.forEach((item, index) => window.setTimeout(() => downloadItem(item), index * 180))

  return <main className="image-compressor-app png-maker-app">
    <header className="image-compressor-header"><button type="button" onClick={onExit}><ArrowLeft size={17}/> Flowly</button><a href={routeUrl('/utilities/png-maker')}><span><ImageIcon size={19}/></span>PNG Maker</a><p><ShieldCheck size={15}/> Browser only</p></header>
    <section className="image-compressor-intro"><div><span>FLOWLY UTILITY</span><h1>Make crisp PNGs in your browser.</h1></div><p>Convert JPEG, WebP or PNG images into universally compatible PNG files. Your images never leave this device.</p></section>
    <section className="image-compressor-workspace png-maker-workspace">
      <aside className="image-compressor-settings">
        <div className="image-compressor-panel-title"><Sparkles size={17}/><div><span>PNG OUTPUT</span><h2>Canvas options</h2></div></div>
        <FlowSelect label="Crop style" value={cropMode} onChange={changeCropMode} options={[{ value: 'original', label: 'No crop', description: 'Keep the complete image' }, { value: 'free', label: 'Free polygon crop', description: 'Trace any shape point by point' }, { value: 'landscape', label: 'Landscape · 16:9', description: 'Wide horizontal crop' }, { value: 'portrait', label: 'Portrait · 4:5', description: 'Vertical social crop' }, { value: 'square', label: 'Square · 1:1', description: 'Centre a square crop' }, { value: 'circle', label: 'Circle crop', description: 'Transparent circular PNG' }, { value: 'rounded', label: 'Rounded square', description: 'Soft rounded corners' }]}/>
        {cropMode === 'free' && <div className="png-maker-free-crop"><span>Trace your crop <small>{freeCropPoints.length} point{freeCropPoints.length === 1 ? '' : 's'} · {freeCropClosed ? 'Shape closed' : 'Drawing'}</small></span><p>{selected?.resultBlob ? 'Choose Adjust crop to edit the shape.' : freeCropClosed ? 'Drag a blue point to edit the outline, or drag inside the shape to move it.' : 'Click or tap around the subject to add points. Click the first point or Finish shape to close it.'}</p><p className="zoom-hint">Mouse wheel zooms. On a phone or tablet, pinch with two fingers to zoom and pan.</p>{selected?.resultBlob ? <button type="button" onClick={invalidateResults}>Adjust crop</button> : <div className="png-maker-free-crop-actions"><button type="button" disabled={freeCropClosed || !freeCropPoints.length} onClick={() => setFreeCropPoints(current => current.slice(0, -1))}>Undo point</button><button type="button" disabled={freeCropClosed || freeCropPoints.length < 3} onClick={finishFreeCrop}>Finish shape</button><button type="button" disabled={!freeCropPoints.length} onClick={resetFreeCrop}>Clear shape</button></div>}</div>}
        <FlowSelect label="Canvas background" value={background} onChange={changeBackground} options={[{ value: 'transparent', label: 'Preserve transparency', description: 'Keeps existing transparent pixels' }, { value: 'white', label: 'White background', description: 'Places the image on solid white' }, { value: 'custom', label: 'Custom colour', description: 'Choose a canvas colour' }]}/>
        {background === 'custom' && <label className="png-maker-colour"><span>Background colour</span><div><input type="color" value={customColor} onChange={event => { setCustomColor(event.target.value); invalidateResults() }}/><code>{customColor.toUpperCase()}</code></div></label>}
        <div className="png-maker-note"><CircleAlert size={16}/><span><strong>Transparency note</strong><small>This preserves transparency already in a file. It does not remove an existing photo background.</small></span></div>
        <div className="image-compressor-privacy"><ShieldCheck size={17}/><span><strong>Images stay private</strong><small>Conversion happens locally in this browser tab.</small></span></div>
      </aside>
      <div className="image-compressor-main">
        <input ref={inputRef} type="file" className="image-compressor-input" accept="image/jpeg,image/png,image/webp" multiple onChange={event => { addFiles(event.target.files || []); event.target.value = '' }}/>
        {!items.length ? <button type="button" className={`image-compressor-dropzone ${dragging ? 'dragging' : ''}`} onClick={() => inputRef.current?.click()} onDragEnter={event => { event.preventDefault(); setDragging(true) }} onDragOver={event => event.preventDefault()} onDragLeave={() => setDragging(false)} onDrop={event => { event.preventDefault(); setDragging(false); addFiles(event.dataTransfer.files) }}><span><UploadCloud size={28}/></span><strong>Drop images here</strong><p>or click to choose JPEG, PNG or WebP files</p><small>Up to {maxFiles} images · {formatBytes(maxFileSize)} each</small></button> : <>
          <div className="image-compressor-toolbar"><div><strong>{items.length} image{items.length === 1 ? '' : 's'}</strong><span>Every output will be a PNG</span></div><div><button type="button" onClick={() => inputRef.current?.click()}><UploadCloud size={15}/> Add images</button><button type="button" className="danger" onClick={clearAll}><Trash2 size={14}/> Clear</button></div></div>
          <div className="image-compressor-content"><div className="image-compressor-queue">{items.map(item => <article className={selected?.id === item.id ? 'active' : ''} onClick={() => setSelectedId(item.id)} key={item.id}><img src={item.resultUrl || item.originalUrl} alt=""/><div><strong>{item.file.name}</strong><span>{item.width} × {item.height} px</span><small className={item.status}>{item.status === 'converting' ? 'Creating PNG…' : item.status === 'done' ? `PNG · ${formatBytes(item.resultBlob.size)}` : item.status === 'error' ? item.error : 'Ready'}</small></div><button type="button" aria-label={`Remove ${item.file.name}`} onClick={event => { event.stopPropagation(); removeItem(item.id) }}><X size={14}/></button></article>)}</div>
            <div className="image-compressor-preview">{selected ? <><div className="image-compressor-preview-head"><div><span>PNG PREVIEW</span><h2>{selected.file.name}</h2></div><div className="png-maker-preview-actions"><div className="png-maker-zoom-controls" aria-label="Preview zoom"><button type="button" aria-label="Zoom out" disabled={previewZoom <= 1} onClick={() => zoomFromCentre(previewZoom - .25)}><ZoomOut size={15}/></button><strong>{Math.round(previewZoom * 100)}%</strong><button type="button" aria-label="Zoom in" disabled={previewZoom >= 4} onClick={() => zoomFromCentre(previewZoom + .25)}><ZoomIn size={15}/></button><button type="button" className="fit" disabled={previewZoom === 1} onClick={() => zoomFromCentre(1)}>Fit</button></div>{selected.resultBlob && <button type="button" className="download" onClick={() => downloadItem(selected)}><Download size={15}/> Download PNG</button>}</div></div><div ref={cropStageRef} className={`image-compressor-stage png-maker-stage ${previewZoom > 1 ? 'zoomed' : ''} ${cropMode === 'free' && !selected.resultBlob ? 'free-crop' : ''} ${selected.status}`} onWheel={handlePreviewWheel} onPointerDown={beginCropPointer} onPointerMove={moveCropPointer} onPointerUp={endCropPointer} onPointerCancel={endCropPointer}><div ref={cropSurfaceRef} className="png-maker-zoom-surface" style={{ width: cropPreviewBounds.width * previewZoom, height: cropPreviewBounds.height * previewZoom }}><img className={cropMode === 'circle' && selected.resultBlob ? 'circle' : cropMode === 'rounded' && selected.resultBlob ? 'rounded' : ''} src={selected.resultUrl || selected.originalUrl} alt={`Preview of ${selected.file.name}`}/>{!selected.resultBlob && cropMode === 'free' && cropPreviewBounds.width > 0 && <div className="png-maker-polygon-guide"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">{freeCropClosed && <><path className="polygon-shade" fillRule="evenodd" d={`M 0 0 H 100 V 100 H 0 Z M ${freeCropPoints.map(point => `${point.x} ${point.y}`).join(' L ')} Z`}/><polygon data-polygon-area points={freeCropPoints.map(point => `${point.x},${point.y}`).join(' ')} /></>}{!freeCropClosed && freeCropPoints.length > 1 && <polyline points={freeCropPoints.map(point => `${point.x},${point.y}`).join(' ')} />}</svg>{freeCropPoints.map((point, index) => <button type="button" data-crop-point={index} aria-label={`Crop point ${index + 1}`} className={index === 0 && !freeCropClosed && freeCropPoints.length >= 3 ? 'first-point' : ''} style={{ left: `${point.x}%`, top: `${point.y}%` }} key={index}/>)}</div>}</div>{selected.status === 'converting' && <span><RefreshCw size={22}/> Creating PNG…</span>}</div><div className="image-compressor-comparison"><div><span>ORIGINAL</span><strong>{selected.width} × {selected.height}</strong><small>{formatBytes(selected.file.size)}</small></div><div><span>PNG OUTPUT</span><strong>{selected.resultBlob ? `${selected.resultWidth} × ${selected.resultHeight}` : cropMode === 'original' ? 'Full image' : cropMode === 'free' ? freeCropClosed ? `Polygon · ${freeCropPoints.length} points` : 'Draw the shape' : cropMode}</strong><small>{selected.resultBlob ? formatBytes(selected.resultBlob.size) : 'Ready to convert'}</small></div></div></> : null}</div>
          </div></>}
        {notice && <div className="image-compressor-notice"><CircleAlert size={16}/><span>{notice}</span><button type="button" onClick={() => setNotice('')}><X size={14}/></button></div>}
        {!!items.length && <div className="image-compressor-actions"><div>{completed.length ? <><Check size={17}/><span><strong>{completed.length} PNG{completed.length === 1 ? '' : 's'} ready</strong><small>{formatBytes(totalOutputSize)} total output</small></span></> : <><FileImage size={17}/><span><strong>Ready to convert</strong><small>{cropMode === 'original' ? 'Original dimensions are preserved.' : `${cropMode === 'free' ? 'Custom' : cropMode} crop will be applied.`}</small></span></>}</div><div>{completed.length > 1 && <button type="button" className="secondary" onClick={downloadAll}><Download size={16}/> Download all</button>}<button type="button" className="primary" disabled={converting} onClick={convertAll}>{converting ? <RefreshCw size={16}/> : <Sparkles size={16}/>} {converting ? 'Creating…' : completed.length ? 'Create again' : 'Create PNGs'}</button></div></div>}
      </div>
    </section>
  </main>
}
