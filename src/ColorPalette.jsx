import { useMemo, useState } from 'react'
import { ArrowLeft, Check, Clipboard, Code2, Copy, Dices, Palette, ShieldCheck, Sparkles } from 'lucide-react'
import FlowSelect from './FlowSelect.jsx'
import { routeUrl } from './navigation.js'
import './color-palette.css'

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))
const normalizeHex = value => {
  const clean = String(value).trim().replace('#', '')
  if (/^[0-9a-f]{3}$/i.test(clean)) return `#${clean.split('').map(char => char + char).join('').toUpperCase()}`
  if (/^[0-9a-f]{6}$/i.test(clean)) return `#${clean.toUpperCase()}`
  return null
}
const hexToRgb = hex => { const value = parseInt(hex.slice(1), 16); return { r: value >> 16, g: value >> 8 & 255, b: value & 255 } }
const rgbToHsl = ({ r, g, b }) => {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b); let h = 0; let s = 0; const l = (max + min) / 2
  if (max !== min) { const d = max - min; s = l > .5 ? d / (2 - max - min) : d / (max + min); if (max === r) h = (g - b) / d + (g < b ? 6 : 0); else if (max === g) h = (b - r) / d + 2; else h = (r - g) / d + 4; h /= 6 }
  return { h: h * 360, s: s * 100, l: l * 100 }
}
const hslToHex = ({ h, s, l }) => {
  h = ((h % 360) + 360) % 360; s = clamp(s, 0, 100) / 100; l = clamp(l, 0, 100) / 100
  const c = (1 - Math.abs(2 * l - 1)) * s; const x = c * (1 - Math.abs(h / 60 % 2 - 1)); const m = l - c / 2
  let rgb = h < 60 ? [c,x,0] : h < 120 ? [x,c,0] : h < 180 ? [0,c,x] : h < 240 ? [0,x,c] : h < 300 ? [x,0,c] : [c,0,x]
  return `#${rgb.map(value => Math.round((value + m) * 255).toString(16).padStart(2, '0')).join('').toUpperCase()}`
}
const luminance = hex => {
  const values = Object.values(hexToRgb(hex)).map(value => { value /= 255; return value <= .03928 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4 })
  return .2126 * values[0] + .7152 * values[1] + .0722 * values[2]
}
const contrast = (a, b) => { const high = Math.max(luminance(a), luminance(b)); const low = Math.min(luminance(a), luminance(b)); return (high + .05) / (low + .05) }
const bestText = hex => contrast(hex, '#FFFFFF') >= contrast(hex, '#111827') ? '#FFFFFF' : '#111827'
const harmonyOffsets = { analogous: [-60,-30,0,30,60], complementary: [0,28,180,208,332], triadic: [0,120,240,60,180], split: [0,150,210,30,330] }
const moodProfiles = {
  bold: { saturation: [88,82,92,78,86], lightness: [43,50,56,48,63] },
  mild: { saturation: [42,36,48,32,40], lightness: [70,79,64,84,74] },
  peaceful: { saturation: [28,24,34,20,27], lightness: [72,82,65,87,76] },
  smooth: { saturation: [54,47,60,43,50], lightness: [56,66,50,75,61] },
  professional: { saturation: [36,31,44,27,34], lightness: [34,45,56,67,77] },
}
const makePalette = (base, harmony, mood) => {
  const hsl = rgbToHsl(hexToRgb(base))
  const profile = moodProfiles[mood] || moodProfiles.professional
  const offsets = harmony === 'monochromatic' ? [0,0,0,0,0] : harmonyOffsets[harmony]
  return offsets.map((offset, index) => hslToHex({ h: hsl.h + offset, s: profile.saturation[index], l: profile.lightness[index] }))
}

export default function ColorPalette({ onExit }) {
  const [base, setBase] = useState('#5B7CFA'); const [hexInput, setHexInput] = useState('#5B7CFA')
  const [harmony, setHarmony] = useState('analogous'); const [mood, setMood] = useState('professional'); const [copied, setCopied] = useState('')
  const colors = useMemo(() => makePalette(base, harmony, mood), [base, harmony, mood])
  const cssVariables = colors.map((color, index) => `  --color-${index + 1}: ${color};`).join('\n')
  const copyText = async (text, key) => {
    try { await navigator.clipboard.writeText(text) } catch { const input = document.createElement('textarea'); input.value = text; document.body.appendChild(input); input.select(); document.execCommand('copy'); input.remove() }
    setCopied(key); window.setTimeout(() => setCopied(''), 1300)
  }
  const updateHex = value => { setHexInput(value); const normalized = normalizeHex(value); if (normalized) setBase(normalized) }
  const randomize = () => { const next = `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0').toUpperCase()}`; setBase(next); setHexInput(next) }

  return <main className="palette-app">
    <header className="image-compressor-header"><button type="button" onClick={onExit}><ArrowLeft size={17}/> Flowly</button><a href={routeUrl('/utilities/color-palette')}><span><Palette size={19}/></span>Color Palette</a><p><ShieldCheck size={15}/> Developer tool</p></header>
    <section className="palette-intro"><div><span>FLOWLY UTILITY</span><h1>Build colour systems that work together.</h1></div><p>Choose a base colour, harmony and visual mood, then copy production-ready HEX, RGB, HSL or CSS variables.</p></section>
    <section className="palette-workspace">
      <aside className="palette-controls">
        <div className="palette-panel-title"><Sparkles size={17}/><div><span>PALETTE ENGINE</span><h2>Generate a combination</h2></div></div>
        <label className="palette-base"><span>Base colour</span><div><input type="color" value={base} onChange={event => updateHex(event.target.value)}/><input aria-label="Base colour hex" value={hexInput} onChange={event => updateHex(event.target.value)} onBlur={() => setHexInput(base)}/></div></label>
        <FlowSelect label="Colour harmony" value={harmony} onChange={setHarmony} options={[{ value: 'analogous', label: 'Analogous', description: 'Neighbouring, calm and cohesive' }, { value: 'complementary', label: 'Complementary', description: 'Bold contrast across the wheel' }, { value: 'triadic', label: 'Triadic', description: 'Three balanced colour families' }, { value: 'split', label: 'Split complementary', description: 'Contrast with more flexibility' }, { value: 'monochromatic', label: 'Monochromatic', description: 'One hue with useful shades' }]}/>
        <FlowSelect label="Palette mood" value={mood} onChange={setMood} options={[{ value: 'professional', label: 'Professional', description: 'Restrained brand and product colours' }, { value: 'mild', label: 'Mild', description: 'Gentle, light and approachable' }, { value: 'peaceful', label: 'Peaceful', description: 'Calm, muted and low saturation' }, { value: 'smooth', label: 'Smooth', description: 'Balanced colour with soft contrast' }, { value: 'bold', label: 'Bold', description: 'Bright, energetic and high impact' }]}/>
        <button type="button" className="palette-random" onClick={randomize}><Dices size={17}/> Random base colour</button>
        <div className="palette-tip"><Code2 size={17}/><span><strong>Made for developers</strong><small>Every swatch includes accessible text guidance and three code formats.</small></span></div>
      </aside>
      <div className="palette-main">
        <div className="palette-strip">{colors.map((color, index) => <button type="button" style={{ background: color, color: bestText(color) }} onClick={() => copyText(color, color)} key={color}><span>0{index + 1}</span><strong>{color}</strong>{copied === color ? <Check size={16}/> : <Copy size={15}/>}</button>)}</div>
        <div className="palette-content">
          <section className="palette-values"><div className="palette-section-head"><div><span>DEVELOPER VALUES</span><h2>Copy any colour</h2></div><button type="button" onClick={() => copyText(`:root {\n${cssVariables}\n}`, 'css')}><Clipboard size={15}/>{copied === 'css' ? 'Copied CSS' : 'Copy CSS variables'}</button></div>
            <div className="palette-value-list">{colors.map((color, index) => { const rgb = hexToRgb(color); const hsl = rgbToHsl(rgb); const text = bestText(color); const ratio = contrast(color, text); return <article key={color}><span style={{ background: color }}/><div><strong>Colour {index + 1}</strong><small>{ratio.toFixed(1)}:1 with {text === '#FFFFFF' ? 'white' : 'dark'} text</small></div><button type="button" onClick={() => copyText(color, `hex-${index}`)}><b>HEX</b>{copied === `hex-${index}` ? 'Copied!' : color}</button><button type="button" onClick={() => copyText(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`, `rgb-${index}`)}><b>RGB</b>{rgb.r}, {rgb.g}, {rgb.b}</button><button type="button" onClick={() => copyText(`hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%)`, `hsl-${index}`)}><b>HSL</b>{Math.round(hsl.h)}°, {Math.round(hsl.s)}%, {Math.round(hsl.l)}%</button></article> })}</div>
          </section>
          <section className="palette-preview"><span>LIVE UI PREVIEW</span><div style={{ background: colors[4], color: bestText(colors[4]) }}><nav><strong>northstar.</strong><button type="button" style={{ background: colors[0], color: bestText(colors[0]) }}>Sign in</button></nav><div className="palette-preview-copy"><small style={{ color: colors[1] }}>BUILD BETTER PRODUCTS</small><h2>Your colours,<br/>working together.</h2><p>Preview the palette in a realistic interface before copying it into your project.</p><button type="button" style={{ background: colors[2], color: bestText(colors[2]) }}>Get started</button></div><div className="palette-preview-card" style={{ background: colors[3], color: bestText(colors[3]) }}><span>Weekly growth</span><strong>+24.8%</strong><div><i style={{ height: '36%', background: colors[0] }}/><i style={{ height: '58%', background: colors[0] }}/><i style={{ height: '44%', background: colors[0] }}/><i style={{ height: '82%', background: colors[0] }}/><i style={{ height: '70%', background: colors[0] }}/></div></div></div></section>
        </div>
      </div>
    </section>
  </main>
}
