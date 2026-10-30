import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft, Check, CircleAlert, Clipboard, Download, FileAudio2,
  MicVocal, Music2, ShieldCheck, Sparkles, Upload, X,
} from 'lucide-react'
import FlowSelect from './FlowSelect.jsx'
import { routeUrl } from './navigation.js'
import './audio-lyrics.css'

const formatBytes = bytes => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / (1024 ** index)).toFixed(index ? 1 : 0)} ${units[index]}`
}

const formatTime = value => {
  const seconds = Math.max(0, Number(value) || 0)
  const minutes = Math.floor(seconds / 60)
  const remainder = seconds - minutes * 60
  return `${String(minutes).padStart(2, '0')}:${remainder.toFixed(2).padStart(5, '0')}`
}

const safeName = value => value.replace(/\.[^.]+$/, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'english-lyrics'

const languageOptions = [
  { value: 'yoruba', label: 'Yoruba + English mix', short: 'Recommended for this song', description: 'Yoruba is primary; English words stay English' },
  { value: 'auto', label: 'Auto detect', short: 'Best for one dominant language', description: 'Let Whisper choose the dominant language' },
  { value: 'english', label: 'English', description: 'English-only vocals' },
  { value: 'swahili', label: 'Swahili + English', description: 'Swahili is the primary language' },
  { value: 'french', label: 'French + English', description: 'French is the primary language' },
  { value: 'spanish', label: 'Spanish + English', description: 'Spanish is the primary language' },
  { value: 'portuguese', label: 'Portuguese + English', description: 'Portuguese is the primary language' },
  { value: 'hindi', label: 'Hindi + English', description: 'Hindi is primary and output is romanized' },
  { value: 'arabic', label: 'Arabic + English', description: 'Arabic is primary and output is romanized' },
]

const downloadText = (name, content, type = 'text/plain') => {
  const url = URL.createObjectURL(new Blob([content], { type: `${type};charset=utf-8` }))
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

export default function AudioLyricsConverter({ onExit }) {
  const workerRef = useRef(null)
  const jobRef = useRef(0)
  const [audioFile, setAudioFile] = useState(null)
  const [audioUrl, setAudioUrl] = useState('')
  const [status, setStatus] = useState('idle')
  const [modelProgress, setModelProgress] = useState(0)
  const [modelMessage, setModelMessage] = useState('Model not loaded')
  const [lines, setLines] = useState([])
  const [lyricsText, setLyricsText] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [language, setLanguage] = useState('yoruba')

  const transcript = useMemo(() => lyricsText.trim(), [lyricsText])
  const lrc = useMemo(() => lyricsText.split('\n')
    .map(text => text.trim())
    .filter(Boolean)
    .map((text, index) => `[${formatTime(lines[index]?.start || index * 4)}] ${text}`)
    .join('\n'), [lyricsText, lines])

  useEffect(() => () => { if (audioUrl) URL.revokeObjectURL(audioUrl) }, [audioUrl])

  useEffect(() => () => {
    jobRef.current += 1
    workerRef.current?.terminate()
  }, [])

  const chooseAudio = file => {
    if (!file) return
    if (!file.type.startsWith('audio/')) { setError('Choose an audio file such as MP3, WAV, M4A, AAC or OGG.'); return }
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioFile(file)
    setAudioUrl(URL.createObjectURL(file))
    setLines([])
    setLyricsText('')
    setStatus('ready')
    setError('')
    setCopied(false)
  }

  const decodeAudio = async file => {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (!AudioContextClass) throw new Error('This browser cannot decode audio for transcription.')
    const context = new AudioContextClass()
    try {
      const decoded = await context.decodeAudioData(await file.arrayBuffer())
      if (decoded.sampleRate === 16000 && decoded.numberOfChannels === 1) return decoded.getChannelData(0).slice()
      const offline = new OfflineAudioContext(1, Math.max(1, Math.ceil(decoded.duration * 16000)), 16000)
      const source = offline.createBufferSource()
      const highpass = offline.createBiquadFilter()
      const presence = offline.createBiquadFilter()
      const lowpass = offline.createBiquadFilter()
      const compressor = offline.createDynamicsCompressor()
      source.buffer = decoded
      highpass.type = 'highpass'
      highpass.frequency.value = 90
      presence.type = 'peaking'
      presence.frequency.value = 2600
      presence.Q.value = 0.8
      presence.gain.value = 3.5
      lowpass.type = 'lowpass'
      lowpass.frequency.value = 8500
      compressor.threshold.value = -24
      compressor.knee.value = 18
      compressor.ratio.value = 3
      source.connect(highpass).connect(presence).connect(lowpass).connect(compressor).connect(offline.destination)
      source.start()
      const rendered = await offline.startRendering()
      return rendered.getChannelData(0).slice()
    } finally {
      await context.close().catch(() => {})
    }
  }

  const getWorker = () => {
    if (workerRef.current) return workerRef.current
    workerRef.current = new Worker(new URL('./audio-lyrics.worker.js', import.meta.url), { type: 'module' })
    return workerRef.current
  }

  const useOutput = output => {
    const chunks = Array.isArray(output?.chunks) ? output.chunks : []
    const nextLines = chunks.map((chunk, index) => ({
      id: `${Date.now()}-${index}`,
      start: Number(chunk.timestamp?.[0]) || 0,
      end: Number(chunk.timestamp?.[1]) || Number(chunk.timestamp?.[0]) + 4 || 4,
      text: String(chunk.text || '').trim(),
    })).filter(line => line.text)
    if (!nextLines.length && output?.text?.trim()) nextLines.push({ id: `${Date.now()}-0`, start: 0, end: 0, text: output.text.trim() })
    if (!nextLines.length) throw new Error('No clear words were detected. Try the correct primary language or use audio with louder, cleaner vocals.')
    setLines(nextLines)
    setLyricsText(nextLines.map(line => line.text).join('\n'))
    setStatus('done')
    setModelProgress(100)
    setModelMessage('Transcription complete')
  }

  const transcribe = async () => {
    if (!audioFile || !audioUrl) { setError('Add an audio file before converting it to lyrics.'); return }
    const job = ++jobRef.current
    setError('')
    setCopied(false)
    setStatus('decoding')
    setModelMessage('Preparing audio without freezing the page…')
    setModelProgress(0)
    try {
      const audio = await decodeAudio(audioFile)
      if (job !== jobRef.current) return
      const worker = getWorker()
      worker.onmessage = event => {
        if (job !== jobRef.current) return
        const message = event.data || {}
        if (message.type === 'status') {
          setStatus(message.status)
          setModelMessage(message.message)
        } else if (message.type === 'progress') {
          setStatus('loading-model')
          setModelProgress(current => Math.max(current, message.progress || 0))
          setModelMessage(message.message)
        } else if (message.type === 'model-ready') {
          setModelProgress(100)
          setModelMessage('English model ready')
        } else if (message.type === 'result') {
          try { useOutput(message.output) } catch (resultError) {
            setStatus('error')
            setError(resultError.message)
          }
        } else if (message.type === 'error') {
          setStatus('error')
          setError(message.message)
        }
      }
      worker.onerror = event => {
        if (job !== jobRef.current) return
        setStatus('error')
        setError(event.message || 'The background transcription worker stopped unexpectedly.')
        workerRef.current?.terminate()
        workerRef.current = null
      }
      worker.postMessage({ type: 'transcribe', audio, language }, [audio.buffer])
    } catch (transcriptionError) {
      console.error(transcriptionError)
      if (job !== jobRef.current) return
      setStatus('error')
      setError(transcriptionError?.message || 'The audio could not be transcribed. Try a shorter file with clearer vocals.')
    }
  }

  const cancelTranscription = () => {
    jobRef.current += 1
    workerRef.current?.terminate()
    workerRef.current = null
    setStatus(audioFile ? 'ready' : 'idle')
    setModelProgress(0)
    setModelMessage('Conversion cancelled')
  }

  const copyLyrics = async () => {
    if (!transcript) return
    await navigator.clipboard.writeText(transcript)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  const clearAudio = () => {
    cancelTranscription()
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioFile(null)
    setAudioUrl('')
    setLines([])
    setLyricsText('')
    setStatus('idle')
    setError('')
  }

  const working = status === 'decoding' || status === 'loading-model' || status === 'transcribing'

  return <main className="audio-lyrics-app">
    <header className="audio-lyrics-header">
      <button type="button" onClick={onExit}><ArrowLeft size={18}/> Utilities</button>
      <a href={routeUrl('/utilities/audio-lyrics')}><span><MicVocal size={20}/></span> Audio to Lyrics</a>
      <p><ShieldCheck size={15}/> Audio stays local</p>
    </header>

    <section className="audio-lyrics-intro">
      <div><span>FLOWLY UTILITY</span><h1>Turn any language into phonetic lyrics.</h1></div>
      <p>Auto-detect mixed-language vocals, keep the original pronunciation in English letters, then edit and download one complete lyric sheet.</p>
    </section>

    <section className="audio-lyrics-workspace">
      <aside className="audio-lyrics-source">
        <div className="audio-panel-title"><span><FileAudio2 size={19}/></span><div><small>STEP 1</small><h2>Add your audio</h2></div></div>
        {!audioFile ? <label className="audio-dropzone">
          <input type="file" accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac" onChange={event => chooseAudio(event.target.files?.[0])}/>
          <span><Upload size={25}/></span><strong>Choose an audio file</strong><p>MP3, WAV, M4A, AAC, OGG or FLAC</p><small>Your song is decoded and transcribed on this device.</small>
        </label> : <div className="audio-file-card">
          <div><span><Music2 size={20}/></span><div><strong>{audioFile.name}</strong><small>{formatBytes(audioFile.size)}</small></div><button type="button" onClick={clearAudio} aria-label="Remove audio"><X size={16}/></button></div>
          <audio src={audioUrl} controls preload="metadata"/>
        </div>}

        <FlowSelect label="Primary vocal language" value={language} options={languageOptions} onChange={setLanguage} disabled={working}/>

        <div className="audio-model-card">
          <header><span><Sparkles size={17}/></span><div><strong>Multilingual pronunciation AI</strong><small>{modelMessage}</small></div></header>
          {working && <div className="audio-model-progress"><i style={{ width: `${status === 'transcribing' ? 100 : modelProgress}%` }}/></div>}
          <p>The first conversion downloads the stronger multilingual Whisper model. Choosing the primary language prevents unrelated English guesses.</p>
        </div>

        <button className={`audio-transcribe-button${working ? ' cancel' : ''}`} type="button" disabled={!audioFile} onClick={working ? cancelTranscription : transcribe}>
          {working ? <X size={18}/> : <MicVocal size={18}/>} {working ? 'Cancel conversion' : lines.length ? 'Transcribe again' : 'Create phonetic lyrics'}
        </button>
        <div className="audio-accuracy-note"><CircleAlert size={16}/><span><strong>For the clearest result</strong><small>Use prominent vocals in any language. Heavy instruments, effects, overlapping singers and noisy recordings can reduce accuracy.</small></span></div>
      </aside>

      <section className="audio-lyrics-editor">
        <header><div><small>STEP 2</small><h2>Review your complete lyrics</h2><p>Edit the full lyric sheet naturally, just like a normal document.</p></div>{lines.length > 0 && <span><Check size={15}/> Romanized pronunciation</span>}</header>
        {error && <div className="audio-lyrics-error" role="alert"><CircleAlert size={17}/><span>{error}</span><button type="button" onClick={() => setError('')} aria-label="Dismiss error"><X size={15}/></button></div>}
        {!lines.length ? <div className="audio-lyrics-empty"><span><MicVocal size={28}/></span><strong>Your complete lyrics will appear here</strong><p>Add an audio file and choose “Create phonetic lyrics.” The result is one editable lyric sheet, not separate timestamp cards.</p></div> : <div className="audio-lyrics-sheet">
          <div className="audio-lyrics-sheet-note"><Sparkles size={16}/><span><strong>Mixed-language pronunciation mode</strong><small>Yoruba, English and other detected languages stay as spoken, then non-Latin writing is romanized into English letters. Meaning is not translated.</small></span></div>
          <textarea value={lyricsText} onChange={event => setLyricsText(event.target.value)} spellCheck="false" aria-label="Complete editable lyrics" placeholder={'[Verse]\nWrite or edit the complete lyrics here…'}/>
        </div>}
        <footer>
          <div><strong>{transcript ? `${transcript.split(/\s+/).filter(Boolean).length} words ready` : 'No lyrics yet'}</strong><small>TXT is plain text · LRC includes timestamps</small></div>
          <div><button type="button" disabled={!transcript} onClick={copyLyrics}>{copied ? <Check size={16}/> : <Clipboard size={16}/>} {copied ? 'Copied' : 'Copy'}</button><button type="button" disabled={!transcript} onClick={() => downloadText(`${safeName(audioFile?.name || '')}.txt`, transcript)}><Download size={16}/> TXT</button><button className="primary" type="button" disabled={!lrc} onClick={() => downloadText(`${safeName(audioFile?.name || '')}.lrc`, lrc)}><Download size={16}/> LRC</button></div>
        </footer>
      </section>
    </section>
  </main>
}
