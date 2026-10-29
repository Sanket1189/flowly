import { useMemo, useState } from 'react'
import { ArrowLeft, ArrowRightLeft, Braces, Check, CircleAlert, Copy, FileJson2, GitCompareArrows, RotateCcw, Sparkles } from 'lucide-react'
import { routeUrl } from './navigation.js'
import './json-diff-checker.css'

const initialLeft = `{
  "project": "Flowly",
  "version": 1,
  "features": ["PDF maker", "Planning tools"],
  "settings": {
    "theme": "green",
    "public": true
  }
}`

const initialRight = `{
  "project": "Flowly",
  "version": 2,
  "features": ["PDF maker", "Planning tools", "JSON diff"],
  "settings": {
    "theme": "blue",
    "public": true
  }
}`

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value)
const valueType = value => value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value
const samePrimitive = (left, right) => Object.is(left, right)
const pathFor = (base, key, arrayParent) => arrayParent ? `${base}[${key}]` : /^[A-Za-z_$][\w$]*$/.test(key) ? `${base}.${key}` : `${base}[${JSON.stringify(key)}]`

function compareJson(left, right, path = '$', changes = []) {
  const leftType = valueType(left)
  const rightType = valueType(right)
  if (leftType !== rightType) {
    changes.push({ type: 'type', path, before: left, after: right, beforeType: leftType, afterType: rightType })
    return changes
  }
  if (Array.isArray(left)) {
    const total = Math.max(left.length, right.length)
    for (let index = 0; index < total; index += 1) {
      const childPath = pathFor(path, index, true)
      if (index >= left.length) changes.push({ type: 'added', path: childPath, after: right[index] })
      else if (index >= right.length) changes.push({ type: 'removed', path: childPath, before: left[index] })
      else compareJson(left[index], right[index], childPath, changes)
    }
    return changes
  }
  if (isObject(left)) {
    const keys = [...new Set([...Object.keys(left), ...Object.keys(right)])].sort()
    keys.forEach(key => {
      const childPath = pathFor(path, key, false)
      if (!Object.prototype.hasOwnProperty.call(left, key)) changes.push({ type: 'added', path: childPath, after: right[key] })
      else if (!Object.prototype.hasOwnProperty.call(right, key)) changes.push({ type: 'removed', path: childPath, before: left[key] })
      else compareJson(left[key], right[key], childPath, changes)
    })
    return changes
  }
  if (!samePrimitive(left, right)) changes.push({ type: 'changed', path, before: left, after: right })
  return changes
}

function parseJson(source) {
  try { return { value: JSON.parse(source), error: '' } }
  catch (error) { return { value: null, error: error.message.replace(/^JSON\.parse: /, '') } }
}

function visualLineDiff(leftValue, rightValue) {
  const leftLines = JSON.stringify(leftValue, null, 2).split('\n')
  const rightLines = JSON.stringify(rightValue, null, 2).split('\n')
  const countLines = lines => lines.reduce((result, line, index) => {
    const entry = result.get(line) || { count: 0, index }
    entry.count += 1
    entry.index = index
    result.set(line, entry)
    return result
  }, new Map())
  const leftCounts = countLines(leftLines)
  const rightCounts = countLines(rightLines)
  const candidates = leftLines.flatMap((line, leftIndex) => leftCounts.get(line).count === 1 && rightCounts.get(line)?.count === 1 ? [{ leftIndex, rightIndex: rightCounts.get(line).index }] : [])
  const tails = []
  const tailIndices = []
  const previous = new Array(candidates.length).fill(-1)
  candidates.forEach((candidate, index) => {
    let low = 0
    let high = tails.length
    while (low < high) {
      const middle = (low + high) >> 1
      if (tails[middle] < candidate.rightIndex) low = middle + 1
      else high = middle
    }
    tails[low] = candidate.rightIndex
    previous[index] = low ? tailIndices[low - 1] : -1
    tailIndices[low] = index
  })
  const anchors = []
  let cursor = tailIndices[tails.length - 1]
  while (cursor !== undefined && cursor >= 0) { anchors.push(candidates[cursor]); cursor = previous[cursor] }
  anchors.reverse()

  const rows = []
  const appendSegment = (leftStart, leftEnd, rightStart, rightEnd) => {
    const leftCount = leftEnd - leftStart
    const rightCount = rightEnd - rightStart
    const paired = Math.min(leftCount, rightCount)
    for (let offset = 0; offset < paired; offset += 1) {
      const leftIndex = leftStart + offset
      const rightIndex = rightStart + offset
      rows.push({ type: leftLines[leftIndex] === rightLines[rightIndex] ? 'same' : 'changed', leftLine: leftIndex + 1, rightLine: rightIndex + 1, leftText: leftLines[leftIndex], rightText: rightLines[rightIndex] })
    }
    for (let offset = paired; offset < leftCount; offset += 1) {
      const leftIndex = leftStart + offset
      rows.push({ type: 'removed', leftLine: leftIndex + 1, rightLine: null, leftText: leftLines[leftIndex], rightText: '' })
    }
    for (let offset = paired; offset < rightCount; offset += 1) {
      const rightIndex = rightStart + offset
      rows.push({ type: 'added', leftLine: null, rightLine: rightIndex + 1, leftText: '', rightText: rightLines[rightIndex] })
    }
  }
  let leftCursor = 0
  let rightCursor = 0
  anchors.forEach(anchor => {
    appendSegment(leftCursor, anchor.leftIndex, rightCursor, anchor.rightIndex)
    rows.push({ type: 'same', leftLine: anchor.leftIndex + 1, rightLine: anchor.rightIndex + 1, leftText: leftLines[anchor.leftIndex], rightText: rightLines[anchor.rightIndex] })
    leftCursor = anchor.leftIndex + 1
    rightCursor = anchor.rightIndex + 1
  })
  appendSegment(leftCursor, leftLines.length, rightCursor, rightLines.length)
  return { rows, leftLineCount: leftLines.length, rightLineCount: rightLines.length }
}

function JsonEditor({ label, side, value, setValue, parsed, format, copy }) {
  const lines = value.split('\n').length
  return <section className={`json-editor-card ${parsed.error ? 'invalid' : 'valid'}`}>
    <div className="json-editor-head"><div><span>{side}</span><h2>{label}</h2></div><div><button type="button" onClick={format}><Sparkles size={14}/> Format</button><button type="button" onClick={copy}><Copy size={14}/> Copy</button></div></div>
    <div className="json-editor-status">{parsed.error ? <><CircleAlert size={14}/><span>{parsed.error}</span></> : <><Check size={14}/><span>Valid JSON</span></>}<small>{lines} {lines === 1 ? 'line' : 'lines'}</small></div>
    <textarea aria-label={`${label} JSON`} spellCheck="false" value={value} onChange={event => setValue(event.target.value)} />
  </section>
}

export default function JsonDiffChecker({ onExit }) {
  const [left, setLeft] = useState(initialLeft)
  const [right, setRight] = useState(initialRight)
  const [compared, setCompared] = useState(true)
  const [copied, setCopied] = useState('')
  const [onlyDifferences, setOnlyDifferences] = useState(false)
  const [wrapLines, setWrapLines] = useState(true)
  const leftParsed = useMemo(() => parseJson(left), [left])
  const rightParsed = useMemo(() => parseJson(right), [right])
  const changes = useMemo(() => leftParsed.error || rightParsed.error ? [] : compareJson(leftParsed.value, rightParsed.value), [leftParsed, rightParsed])
  const visualDiff = useMemo(() => leftParsed.error || rightParsed.error ? { rows: [], leftLineCount: 0, rightLineCount: 0 } : visualLineDiff(leftParsed.value, rightParsed.value), [leftParsed, rightParsed])
  const visibleRows = onlyDifferences ? visualDiff.rows.filter(row => row.type !== 'same') : visualDiff.rows
  const counts = useMemo(() => changes.reduce((result, change) => ({ ...result, [change.type]: result[change.type] + 1 }), { added: 0, removed: 0, changed: 0, type: 0 }), [changes])
  const ready = !leftParsed.error && !rightParsed.error
  const setAndReset = (setter, value) => { setter(value); setCompared(false) }
  const format = (parsed, setter) => { if (!parsed.error) { setter(JSON.stringify(parsed.value, null, 2)); setCompared(false) } }
  const copy = async (value, side) => {
    try { await navigator.clipboard.writeText(value); setCopied(side); window.setTimeout(() => setCopied(''), 1600) } catch { setCopied('') }
  }
  const swap = () => { setLeft(right); setRight(left); setCompared(false) }
  const reset = () => { setLeft(initialLeft); setRight(initialRight); setCompared(true) }

  return <main className="json-diff-app">
    <header className="json-diff-header"><button type="button" onClick={onExit}><ArrowLeft size={17}/> Flowly</button><a href={routeUrl('/utilities/json-diff')}><span><FileJson2 size={18}/></span>JSON Diff Checker</a><p><Braces size={15}/> Runs locally</p></header>
    <section className="json-diff-intro"><div><span>FLOWLY UTILITY</span><h1>Visual JSON diff checker.</h1></div><p>Paste two JSON documents. Flowly validates them, compares nested values and shows exactly what changed—without uploading your data.</p></section>
    <section className="json-diff-toolbar" aria-label="JSON comparison controls"><div><button type="button" onClick={swap}><ArrowRightLeft size={16}/> Swap sides</button><button type="button" onClick={reset}><RotateCcw size={16}/> Reset sample</button></div><button type="button" className="json-compare-button" disabled={!ready} onClick={() => setCompared(true)}><GitCompareArrows size={17}/> Compare JSON</button></section>
    {copied && <div className="json-copy-toast" role="status"><Check size={15}/> {copied} JSON copied</div>}
    <section className="json-editor-grid">
      <JsonEditor label="Original" side="A" value={left} setValue={value => setAndReset(setLeft, value)} parsed={leftParsed} format={() => format(leftParsed, setLeft)} copy={() => copy(left, 'Original')}/>
      <JsonEditor label="Modified" side="B" value={right} setValue={value => setAndReset(setRight, value)} parsed={rightParsed} format={() => format(rightParsed, setRight)} copy={() => copy(right, 'Modified')}/>
    </section>
    <section className="json-results" aria-live="polite">
      <div className="json-results-head"><div><span>COMPARISON RESULT</span><h2>{!ready ? 'Fix invalid JSON to compare' : !compared ? 'Ready for a new comparison' : changes.length ? `${changes.length} ${changes.length === 1 ? 'difference' : 'differences'} found` : 'The JSON documents match'}</h2></div>{ready && compared && <div className="json-result-stats"><span className="added">+{counts.added} added</span><span className="removed">−{counts.removed} removed</span><span className="changed">~{counts.changed + counts.type} changed</span></div>}</div>
      {!ready ? <div className="json-result-empty warning"><CircleAlert size={24}/><strong>Both sides need valid JSON</strong><p>The message above each editor points to the syntax problem.</p></div>
        : !compared ? <div className="json-result-empty"><GitCompareArrows size={24}/><strong>Your edits are ready</strong><p>Choose Compare JSON to refresh the result.</p></div>
        : !changes.length ? <div className="json-result-empty success"><Check size={24}/><strong>No differences found</strong><p>Objects are compared by content, so a different key order is not treated as a change.</p></div>
        : <div className="json-visual-diff">
          <div className="json-diff-view-toolbar"><div><span className="json-diff-legend changed">Changed</span><span className="json-diff-legend added">Added</span><span className="json-diff-legend removed">Removed</span></div><div className="json-diff-view-options"><label><input type="checkbox" checked={wrapLines} onChange={event => setWrapLines(event.target.checked)}/><span>Wrap long lines</span></label><label><input type="checkbox" checked={onlyDifferences} onChange={event => setOnlyDifferences(event.target.checked)}/><span>Only differences</span></label></div></div>
          <div className={`json-diff-table ${wrapLines ? 'wrap-lines' : ''}`} role="table" aria-label="Side-by-side JSON line comparison">
            <div className="json-diff-scroll"><div className="json-diff-table-head" role="row"><div role="columnheader"><strong>Original</strong><span>{visualDiff.leftLineCount} lines</span></div><div role="columnheader"><strong>Modified</strong><span>{visualDiff.rightLineCount} lines</span></div></div>{visibleRows.map((row, index) => <div className={`json-diff-row ${row.type}`} role="row" key={`${row.leftLine || 'x'}-${row.rightLine || 'x'}-${index}`}>
              <div className="json-diff-code" role="cell"><span className="json-line-number">{row.leftLine || ''}</span><span className="json-line-marker">{row.type === 'removed' ? '−' : row.type === 'changed' ? '•' : ''}</span><code>{row.leftText || ' '}</code></div>
              <div className="json-diff-code" role="cell"><span className="json-line-number">{row.rightLine || ''}</span><span className="json-line-marker">{row.type === 'added' ? '+' : row.type === 'changed' ? '•' : ''}</span><code>{row.rightText || ' '}</code></div>
            </div>)}</div>
          </div>
        </div>}
    </section>
  </main>
}
