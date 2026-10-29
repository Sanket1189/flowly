import { useMemo, useState } from 'react'
import { ArrowLeft, Braces, Check, CircleAlert, Copy, Download, Eraser, FileJson2, Sparkles } from 'lucide-react'
import { routeUrl } from './navigation.js'
import './json-formatter.css'

const sampleJson = `{"name":"Flowly","version":1,"private":true,"utilities":["PDF maker","JSON diff checker","JSON formatter"],"settings":{"theme":"green","autosave":false},"metadata":{"created":2026,"tags":["browser-only","useful"]}}`

function parseJson(source) {
  try { return { value: JSON.parse(source), error: null } }
  catch (error) {
    const position = Number(error.message.match(/position\s+(\d+)/i)?.[1])
    let line = null
    let column = null
    if (Number.isFinite(position)) {
      const before = source.slice(0, position).split('\n')
      line = before.length
      column = before.at(-1).length + 1
    }
    return { value: null, error: { message: error.message, line, column } }
  }
}

function sortObject(value) {
  if (Array.isArray(value)) return value.map(sortObject)
  if (value && typeof value === 'object') return Object.keys(value).sort((a, b) => a.localeCompare(b)).reduce((result, key) => ({ ...result, [key]: sortObject(value[key]) }), {})
  return value
}

function objectStats(value) {
  let keys = 0
  let values = 0
  let maxDepth = 0
  const visit = (current, depth) => {
    maxDepth = Math.max(maxDepth, depth)
    if (Array.isArray(current)) { values += current.length; current.forEach(item => visit(item, depth + 1)); return }
    if (current && typeof current === 'object') { const entries = Object.entries(current); keys += entries.length; entries.forEach(([, item]) => visit(item, depth + 1)) }
  }
  visit(value, 1)
  return { keys, values, depth: maxDepth }
}

export default function JsonFormatter({ onExit }) {
  const [source, setSource] = useState(sampleJson)
  const [indent, setIndent] = useState('2')
  const [sortKeys, setSortKeys] = useState(false)
  const [result, setResult] = useState(() => JSON.stringify(JSON.parse(sampleJson), null, 2))
  const [copied, setCopied] = useState(false)
  const parsed = useMemo(() => parseJson(source), [source])
  const stats = useMemo(() => parsed.error ? null : objectStats(parsed.value), [parsed])
  const format = (nextIndent = indent, nextSort = sortKeys) => {
    if (parsed.error) return
    const value = nextSort ? sortObject(parsed.value) : parsed.value
    const spacing = nextIndent === 'minify' ? 0 : nextIndent === 'tab' ? '\t' : Number(nextIndent)
    setResult(JSON.stringify(value, null, spacing))
  }
  const changeIndent = value => { setIndent(value); format(value, sortKeys) }
  const changeSort = checked => { setSortKeys(checked); format(indent, checked) }
  const updateSource = value => { setSource(value); setResult('') }
  const copyResult = async () => {
    if (!result) return
    try { await navigator.clipboard.writeText(result); setCopied(true); window.setTimeout(() => setCopied(false), 1600) } catch { setCopied(false) }
  }
  const download = () => {
    if (!result) return
    const url = URL.createObjectURL(new Blob([result], { type: 'application/json' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'formatted-json.json'
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  const clear = () => { setSource(''); setResult('') }
  const loadSample = () => { setSource(sampleJson); const value = sortKeys ? sortObject(JSON.parse(sampleJson)) : JSON.parse(sampleJson); const spacing = indent === 'minify' ? 0 : indent === 'tab' ? '\t' : Number(indent); setResult(JSON.stringify(value, null, spacing)) }

  return <main className="json-format-app">
    <header className="json-format-header"><button type="button" onClick={onExit}><ArrowLeft size={17}/> Flowly</button><a href={routeUrl('/utilities/json-formatter')}><span><Braces size={18}/></span>JSON Formatter</a><p><Check size={15}/> Browser only</p></header>
    <section className="json-format-intro"><div><span>FLOWLY UTILITY</span><h1>Free JSON formatter and validator.</h1></div><p>Format, validate, sort or minify JSON instantly. Your content stays entirely inside your browser.</p></section>
    <section className="json-format-controls" aria-label="JSON formatting options">
      <div className="json-indent-control"><span>Output style</span><div role="group" aria-label="Output indentation">{[['2','2 spaces'],['4','4 spaces'],['tab','Tabs'],['minify','Minify']].map(([value, label]) => <button type="button" className={indent === value ? 'active' : ''} aria-pressed={indent === value} onClick={() => changeIndent(value)} key={value}>{label}</button>)}</div></div>
      <label className="json-sort-toggle"><input type="checkbox" checked={sortKeys} onChange={event => changeSort(event.target.checked)}/><span><strong>Sort keys</strong><small>Alphabetically, including nested objects</small></span></label>
      <button type="button" className="json-format-primary" disabled={Boolean(parsed.error)} onClick={() => format()}><Sparkles size={17}/> Format JSON</button>
    </section>
    <section className="json-format-grid">
      <article className={`json-format-panel ${parsed.error ? 'invalid' : ''}`}>
        <div className="json-format-panel-head"><div><span>INPUT</span><h2>Paste your JSON</h2></div><div><button type="button" onClick={loadSample}>Sample</button><button type="button" onClick={clear}><Eraser size={14}/> Clear</button></div></div>
        <div className={`json-format-status ${parsed.error ? 'error' : ''}`}>{parsed.error ? <><CircleAlert size={15}/><span>{parsed.error.message}</span>{parsed.error.line && <small>Line {parsed.error.line}, column {parsed.error.column}</small>}</> : <><Check size={15}/><span>Valid JSON</span><small>{stats.keys} keys · depth {stats.depth}</small></>}</div>
        <textarea aria-label="JSON input" spellCheck="false" value={source} placeholder="Paste JSON here…" onChange={event => updateSource(event.target.value)}/>
      </article>
      <article className="json-format-panel output">
        <div className="json-format-panel-head"><div><span>OUTPUT</span><h2>Formatted result</h2></div><div><button type="button" disabled={!result} onClick={copyResult}>{copied ? <Check size={14}/> : <Copy size={14}/>} {copied ? 'Copied' : 'Copy'}</button><button type="button" disabled={!result} onClick={download}><Download size={14}/> Download</button></div></div>
        <div className="json-format-status"><FileJson2 size={15}/><span>{result ? `${result.split('\n').length} lines · ${new Blob([result]).size.toLocaleString()} bytes` : 'Format valid JSON to see the result'}</span></div>
        <textarea aria-label="Formatted JSON output" spellCheck="false" readOnly value={result} placeholder="Your formatted JSON will appear here…"/>
      </article>
    </section>
    <section className="json-format-note"><Braces size={20}/><div><strong>Safe for sensitive JSON</strong><p>Formatting happens locally. Flowly does not upload, store or inspect your data.</p></div></section>
  </main>
}
