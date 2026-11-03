import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft, AudioLines, CircleAlert, Headphones, Pause, Play, RotateCcw,
  ShieldCheck, SlidersHorizontal, UploadCloud, Volume2, VolumeX, X,
} from 'lucide-react'
import { routeUrl } from './navigation.js'
import './stem-splitter.css'

const STEMS = [
  { id: 'deep-sub', name: 'Deep sub', detail: '20–65 Hz', color: '#7957e8', filter: 'lowpass', frequency: 65, q: .82 },
  { id: 'bass', name: 'Bass notes', detail: '65–120 Hz', color: '#9169ff', filter: 'bandpass', frequency: 88, q: 2.05 },
  { id: 'kick', name: 'Kick weight', detail: '120–220 Hz', color: '#f06b50', filter: 'bandpass', frequency: 162, q: 1.8 },
  { id: 'snare-body', name: 'Snare body', detail: '220–420 Hz', color: '#ff8d55', filter: 'bandpass', frequency: 304, q: 1.72 },
  { id: 'low-mids', name: 'Low mids', detail: '420–750 Hz', color: '#e2a945', filter: 'bandpass', frequency: 560, q: 1.65 },
  { id: 'music-body', name: 'Music body', detail: '750 Hz–1.3 kHz', color: '#d5c34e', filter: 'bandpass', frequency: 980, q: 1.7 },
  { id: 'vocal-core', name: 'Vocal core', detail: '1.3–2.2 kHz', color: '#62bd7d', filter: 'bandpass', frequency: 1700, q: 1.76 },
  { id: 'presence', name: 'Vocal presence', detail: '2.2–3.8 kHz', color: '#38b8a1', filter: 'bandpass', frequency: 2900, q: 1.72 },
  { id: 'attack', name: 'Attack & detail', detail: '3.8–6 kHz', color: '#3fb8d2', filter: 'bandpass', frequency: 4750, q: 1.8 },
  { id: 'cymbals', name: 'Closed hi-hats', detail: '6–9.5 kHz', color: '#4c9be6', filter: 'bandpass', frequency: 7500, q: 1.75, group: 'hi-hat' },
  { id: 'sparkle', name: 'Open hi-hats', detail: '9.5–13 kHz', color: '#6d87df', filter: 'bandpass', frequency: 11100, q: 2.2, group: 'hi-hat' },
  { id: 'air', name: 'Air', detail: '13–20 kHz', color: '#91a1e8', filter: 'highpass', frequency: 13000, q: .82 },
]

const initialMix = () => Object.fromEntries(STEMS.map(stem => [stem.id, { muted: false, solo: false, volume: 76 }]))
const formatTime = seconds => {
  const safe = Number.isFinite(seconds) ? Math.max(0, seconds) : 0
  return `${Math.floor(safe / 60)}:${String(Math.floor(safe % 60)).padStart(2, '0')}`
}

function StemRow({ stem, settings, levelRef, onMute, onSolo, onVolume }) {
  return <article className={`stem-track ${settings.muted ? 'muted' : ''} ${settings.solo ? 'soloed' : ''}`}>
    <span className="stem-color" style={{ background: stem.color }}/>
    <div className="stem-track-name"><strong>{stem.name}{stem.group === 'hi-hat' && <em>HI-HAT</em>}</strong><small>{stem.detail}</small></div>
    <div className="stem-live-meter" aria-label={`${stem.name} level`}><i ref={levelRef} style={{ background: stem.color }}/></div>
    <label className="stem-volume"><Volume2 size={14}/><input type="range" min="0" max="100" value={settings.volume} onChange={event => onVolume(Number(event.target.value))}/><span>{settings.volume}%</span></label>
    <div className="stem-track-actions">
      <button type="button" className={settings.muted ? 'active mute' : ''} onClick={onMute} aria-pressed={settings.muted} title={`Mute ${stem.name}`}>{settings.muted ? <VolumeX size={15}/> : <Volume2 size={15}/>}<span>Mute</span></button>
      <button type="button" className={settings.solo ? 'active solo' : ''} onClick={onSolo} aria-pressed={settings.solo} title={`Solo ${stem.name}`}><Headphones size={15}/><span>Solo</span></button>
    </div>
  </article>
}

export default function StemSplitter({ onExit }) {
  const audioRef = useRef(null)
  const inputRef = useRef(null)
  const contextRef = useRef(null)
  const graphRef = useRef(null)
  const animationRef = useRef(0)
  const levelRefs = useRef({})
  const [file, setFile] = useState(null)
  const [audioUrl, setAudioUrl] = useState('')
  const [waveform, setWaveform] = useState([])
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [mix, setMix] = useState(initialMix)
  const [notice, setNotice] = useState('')
  const [dragging, setDragging] = useState(false)

  const hasSolo = useMemo(() => Object.values(mix).some(item => item.solo), [mix])
  const hiHatsHidden = mix.cymbals.muted && mix.sparkle.muted

  const stopMeterLoop = () => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current)
    animationRef.current = 0
  }

  const closeGraph = () => {
    stopMeterLoop()
    if (contextRef.current && contextRef.current.state !== 'closed') contextRef.current.close().catch(() => {})
    contextRef.current = null
    graphRef.current = null
  }

  useEffect(() => () => closeGraph(), [])
  useEffect(() => () => { if (audioUrl) URL.revokeObjectURL(audioUrl) }, [audioUrl])

  useEffect(() => {
    if (!graphRef.current) return
    STEMS.forEach(stem => {
      const settings = mix[stem.id]
      const audible = !settings.muted && (!hasSolo || settings.solo)
      graphRef.current[stem.id].gain.gain.setTargetAtTime(audible ? (settings.volume / 100) * .48 : 0, contextRef.current.currentTime, .015)
    })
    graphRef.current.hiHatCut?.frequency.setTargetAtTime(hiHatsHidden ? 4200 : 22000, contextRef.current.currentTime, .025)
  }, [mix, hasSolo])

  const buildWaveform = async selected => {
    try {
      const buffer = await selected.arrayBuffer()
      const decodeContext = new (window.AudioContext || window.webkitAudioContext)()
      const decoded = await decodeContext.decodeAudioData(buffer.slice(0))
      const data = decoded.getChannelData(0)
      const bars = 128
      const size = Math.max(1, Math.floor(data.length / bars))
      const peaks = Array.from({ length: bars }, (_, index) => {
        let peak = 0
        const start = index * size
        const stride = Math.max(1, Math.floor(size / 150))
        for (let cursor = start; cursor < Math.min(data.length, start + size); cursor += stride) peak = Math.max(peak, Math.abs(data[cursor]))
        return peak
      })
      const max = Math.max(...peaks, .01)
      setWaveform(peaks.map(value => Math.max(.08, value / max)))
      await decodeContext.close()
    } catch {
      setWaveform(Array.from({ length: 128 }, (_, index) => .18 + Math.abs(Math.sin(index * .57)) * .54))
    }
  }

  const loadFile = selected => {
    if (!selected) return
    if (!selected.type.startsWith('audio/')) { setNotice('Choose an audio file such as MP3, WAV, M4A or OGG.'); return }
    if (selected.size > 150 * 1024 * 1024) { setNotice('Choose an audio file smaller than 150 MB for reliable browser playback.'); return }
    audioRef.current?.pause()
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    const nextUrl = URL.createObjectURL(selected)
    setFile(selected)
    setAudioUrl(nextUrl)
    setDuration(0)
    setCurrentTime(0)
    setPlaying(false)
    setMix(initialMix())
    setNotice('')
    buildWaveform(selected)
  }

  const ensureGraph = async () => {
    if (graphRef.current) {
      if (contextRef.current.state === 'suspended') await contextRef.current.resume()
      return
    }
    const context = new (window.AudioContext || window.webkitAudioContext)()
    const source = context.createMediaElementSource(audioRef.current)
    const master = context.createGain()
    const hiHatCut = context.createBiquadFilter()
    master.gain.value = .92
    hiHatCut.type = 'lowpass'
    hiHatCut.frequency.value = hiHatsHidden ? 4200 : 22000
    hiHatCut.Q.value = .72
    master.connect(hiHatCut)
    hiHatCut.connect(context.destination)
    const graph = {}
    STEMS.forEach(stem => {
      const filter = context.createBiquadFilter()
      const analyser = context.createAnalyser()
      const gain = context.createGain()
      filter.type = stem.filter
      filter.frequency.value = stem.frequency
      filter.Q.value = stem.q
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = .78
      gain.gain.value = (mix[stem.id].volume / 100) * .48
      source.connect(filter)
      filter.connect(analyser)
      analyser.connect(gain)
      gain.connect(master)
      graph[stem.id] = { filter, analyser, gain, data: new Uint8Array(analyser.frequencyBinCount) }
    })
    contextRef.current = context
    graphRef.current = { ...graph, hiHatCut }
    await context.resume()
  }

  const meterLoop = () => {
    if (!graphRef.current) return
    STEMS.forEach(stem => {
      const node = graphRef.current[stem.id]
      node.analyser.getByteFrequencyData(node.data)
      const average = node.data.reduce((sum, value) => sum + value, 0) / node.data.length
      const width = Math.min(100, Math.max(3, average / 1.45))
      if (levelRefs.current[stem.id]) levelRefs.current[stem.id].style.width = `${width}%`
    })
    animationRef.current = requestAnimationFrame(meterLoop)
  }

  const togglePlayback = async () => {
    if (!file || !audioRef.current) return
    try {
      if (audioRef.current.paused) {
        await ensureGraph()
        await audioRef.current.play()
        stopMeterLoop()
        meterLoop()
      } else audioRef.current.pause()
    } catch { setNotice('Playback could not start. Try another audio format or reload the file.') }
  }

  const seek = event => {
    if (!duration || !audioRef.current) return
    const rect = event.currentTarget.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
    audioRef.current.currentTime = ratio * duration
    setCurrentTime(audioRef.current.currentTime)
  }

  const changeMix = (id, patch) => setMix(current => ({ ...current, [id]: { ...current[id], ...patch } }))
  const resetMix = () => setMix(initialMix())
  const muteAll = () => setMix(current => Object.fromEntries(Object.entries(current).map(([id, settings]) => [id, { ...settings, muted: true, solo: false }])))
  const toggleHiHats = () => setMix(current => ({
    ...current,
    cymbals: { ...current.cymbals, muted: !hiHatsHidden, solo: false },
    sparkle: { ...current.sparkle, muted: !hiHatsHidden, solo: false },
    air: { ...current.air, muted: !hiHatsHidden, solo: false },
  }))
  const clearFile = () => {
    audioRef.current?.pause()
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setFile(null); setAudioUrl(''); setWaveform([]); setDuration(0); setCurrentTime(0); setPlaying(false); setMix(initialMix())
  }

  return <main className="stem-splitter-app">
    <header className="stem-splitter-header">
      <button type="button" onClick={onExit}><ArrowLeft size={17}/> Flowly</button>
      <a href={routeUrl('/utilities/stem-splitter')}><span><SlidersHorizontal size={19}/></span> Stem Splitter</a>
      <p><ShieldCheck size={15}/> Audio stays on this device</p>
    </header>

    <section className="stem-splitter-intro">
      <div><span>FLOWLY AUDIO LAB</span><h1>Hear every layer in your track.</h1></div>
      <p>Split a song into twelve detailed frequency lines, then mute, solo and balance each one to understand what builds the beat.</p>
    </section>

    <section className="stem-splitter-workspace">
      <aside className="stem-source-panel">
        <div className="stem-panel-heading"><span><AudioLines size={19}/></span><div><small>STEP 1</small><h2>Add your audio</h2></div></div>
        <input ref={inputRef} type="file" accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac" onChange={event => { loadFile(event.target.files?.[0]); event.target.value = '' }}/>
        {!file ? <button type="button" className={`stem-dropzone ${dragging ? 'dragging' : ''}`} onClick={() => inputRef.current?.click()} onDragEnter={event => { event.preventDefault(); setDragging(true) }} onDragOver={event => event.preventDefault()} onDragLeave={() => setDragging(false)} onDrop={event => { event.preventDefault(); setDragging(false); loadFile(event.dataTransfer.files?.[0]) }}><span><UploadCloud size={25}/></span><strong>Drop a song here</strong><small>or click to choose audio · up to 150 MB</small></button> : <div className="stem-file-card"><span><AudioLines size={19}/></span><div><strong>{file.name}</strong><small>{(file.size / 1024 / 1024).toFixed(1)} MB · {duration ? formatTime(duration) : 'Reading audio…'}</small></div><button type="button" onClick={clearFile} aria-label="Remove audio"><X size={15}/></button></div>}
        <div className="stem-explainer"><CircleAlert size={17}/><span><strong>Frequency split, not AI extraction</strong><small>This instant local mixer separates frequency ranges. Because instruments overlap, it cannot produce studio-clean vocal or drum files like a large AI model.</small></span></div>
        <div className="stem-privacy"><ShieldCheck size={17}/><span><strong>Private by default</strong><small>No upload, account or server processing.</small></span></div>
      </aside>

      <section className="stem-mixer-panel">
        <header><div><small>STEP 2 · LIVE MIXER</small><h2>{file ? 'Explore the beat lines' : 'Your mixer is ready'}</h2><p>{file ? 'Play the track, then mute or solo any band.' : 'Add an audio file to unlock playback and live meters.'}</p></div><div className="stem-mix-actions"><button type="button" className={hiHatsHidden ? 'hi-hat active' : 'hi-hat'} disabled={!file} onClick={toggleHiHats}><VolumeX size={14}/> {hiHatsHidden ? 'Show hi-hats' : 'Hide hi-hats'}</button><button type="button" disabled={!file} onClick={resetMix}><RotateCcw size={14}/> Reset</button><button type="button" disabled={!file} onClick={muteAll}><VolumeX size={14}/> Mute all</button></div></header>

        {!file ? <button type="button" className="stem-empty" onClick={() => inputRef.current?.click()}><span><Headphones size={28}/></span><strong>Choose a track to inspect</strong><p>You’ll get twelve narrow, colour-coded lines with independent mute, solo and volume controls.</p></button> : <>
          <div className="stem-player">
            <button type="button" className="stem-play" onClick={togglePlayback} aria-label={playing ? 'Pause audio' : 'Play audio'}>{playing ? <Pause size={21}/> : <Play size={21}/>}</button>
            <div className="stem-timeline" onClick={seek} role="slider" aria-label="Audio position" aria-valuemin="0" aria-valuemax={duration || 0} aria-valuenow={currentTime} tabIndex="0">
              <div className="stem-waveform">{waveform.map((value, index) => <i className={duration && (index / waveform.length) <= currentTime / duration ? 'played' : ''} style={{ height: `${Math.round(value * 90)}%` }} key={index}/>)}</div>
              <span className="stem-playhead" style={{ left: `${duration ? (currentTime / duration) * 100 : 0}%` }}/>
            </div>
            <div className="stem-time"><strong>{formatTime(currentTime)}</strong><span>/</span><small>{formatTime(duration)}</small></div>
          </div>
          <div className="stem-track-list">{STEMS.map(stem => <StemRow stem={stem} settings={mix[stem.id]} levelRef={node => { levelRefs.current[stem.id] = node }} onMute={() => changeMix(stem.id, { muted: !mix[stem.id].muted })} onSolo={() => changeMix(stem.id, { solo: !mix[stem.id].solo })} onVolume={volume => changeMix(stem.id, { volume })} key={stem.id}/>)}</div>
          <footer className="stem-status"><span className={hasSolo ? 'solo' : hiHatsHidden ? 'hat-cut' : ''}>{hasSolo ? `${Object.values(mix).filter(item => item.solo).length} solo line${Object.values(mix).filter(item => item.solo).length === 1 ? '' : 's'} active` : hiHatsHidden ? 'Strong hi-hat suppression active' : `${Object.values(mix).filter(item => item.muted).length} of ${STEMS.length} lines muted`}</span><small>{hiHatsHidden ? 'High-frequency tick and shimmer are being removed after the mixer.' : 'Tip: solo one line, then add others to hear how the track is assembled.'}</small></footer>
        </>}
        {notice && <div className="stem-notice" role="alert"><CircleAlert size={16}/><span>{notice}</span><button type="button" onClick={() => setNotice('')}><X size={14}/></button></div>}
      </section>
    </section>
    <audio ref={audioRef} src={audioUrl || undefined} preload="metadata" onLoadedMetadata={event => setDuration(event.currentTarget.duration || 0)} onTimeUpdate={event => setCurrentTime(event.currentTarget.currentTime)} onPlay={() => setPlaying(true)} onPause={() => { setPlaying(false); stopMeterLoop() }} onEnded={() => { setPlaying(false); stopMeterLoop(); setCurrentTime(0) }}/>
  </main>
}
