import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft, AudioLines, Check, CircleAlert, Download, FileMusic, Film,
  FastForward, Layers3, Pause, Play, Rewind, RotateCcw, Sparkles, Upload, X,
} from 'lucide-react'
import FlowSelect from './FlowSelect.jsx'
import './music-visualizer.css'
import './music-visualizer-themes.css'

const MP4_TYPES = [
  'video/mp4;codecs="avc1.42E01E,mp4a.40.2"',
  'video/mp4;codecs="avc1,mp4a.40.2"',
  'video/mp4',
]

const aspectOptions = [
  { value: 'square', label: 'Square · 1:1', description: '1080 × 1080' },
  { value: 'landscape', label: 'Landscape · 16:9', description: '1920 × 1080' },
  { value: 'portrait', label: 'Portrait · 9:16', description: '1080 × 1920' },
]

const durationOptions = [
  { value: 'full', label: 'Full song', description: 'Up to 5 minutes' },
  { value: '15', label: '15 seconds', description: 'Short social clip' },
  { value: '30', label: '30 seconds', description: 'Reel or story' },
  { value: '60', label: '60 seconds', description: 'Extended visualizer' },
]

const themeOptions = [
  { value: 'pulse', label: 'Pulse studio', description: 'Bars, waves, rings and sparks' },
  { value: 'universe', label: 'Universe', description: 'Stars, galaxies and orbiting planets' },
  { value: 'neon', label: 'Neon noir', description: 'Chrome, cyan light and perspective' },
  { value: 'slime', label: 'Liquid slime', description: 'Smooth glass-like goo and soft motion' },
  { value: 'bubbles', label: 'Bubbles', description: 'Floating bubbles and soft foam' },
  { value: 'inferno', label: 'Inferno', description: 'Embers, flame rings and heat' },
  { value: 'ocean', label: 'Ocean', description: 'Currents, sonar and deep-water light' },
  { value: 'minimal', label: 'Minimal mono', description: 'Clean lines and restrained motion' },
  { value: 'retro', label: 'Retro wave', description: 'Sunsets, VHS lines and synth grids' },
  { value: 'gold', label: 'Gold luxe', description: 'Art-deco rays and champagne light' },
]

const themePresets = {
  pulse: { color: '#ff4ca8', glow: '#55d8ff', tint: 18 },
  universe: { color: '#a879ff', glow: '#74e9ff', tint: 20 },
  neon: { color: '#34d9ff', glow: '#8b5cf6', tint: 30 },
  slime: { color: '#7ee2b8', glow: '#d7f5a7', tint: 22 },
  bubbles: { color: '#73d8ff', glow: '#ff9adf', tint: 12 },
  inferno: { color: '#ff6b35', glow: '#ffd166', tint: 24 },
  ocean: { color: '#3dd6d0', glow: '#7aa7ff', tint: 18 },
  minimal: { color: '#f5f5f0', glow: '#a7b0b7', tint: 28 },
  retro: { color: '#ff5ca8', glow: '#57e6ff', tint: 22 },
  gold: { color: '#d8b56a', glow: '#fff0c2', tint: 24 },
}

const themeLibraries = {
  pulse: [
    { name: 'Spectrum', items: [
      { id: 'radial-bars', label: 'Radial bars', preview: 'radial' },
      { id: 'halo-dashes', label: 'Halo dashes', preview: 'dashes' },
      { id: 'bottom-spectrum', label: 'Bottom spectrum', preview: 'spectrum' },
      { id: 'mirror-wave', label: 'Mirror wave', preview: 'wave' },
      { id: 'side-meters', label: 'Side meters', preview: 'sides' },
    ] },
    { name: 'Shapes', items: [
      { id: 'pulse-rings', label: 'Pulse rings', preview: 'rings' },
      { id: 'ripple-rings', label: 'Ripple rings', preview: 'ripples' },
      { id: 'diamond-pulse', label: 'Diamond pulse', preview: 'diamond' },
      { id: 'core-disc', label: 'Glass core', preview: 'core-disc' },
    ] },
    { name: 'Motion', items: [
      { id: 'orbit-dots', label: 'Orbit dots', preview: 'orbit' },
      { id: 'particles', label: 'Floating sparks', preview: 'particles' },
      { id: 'bass-glow', label: 'Bass glow', preview: 'glow' },
      { id: 'energy-wave', label: 'Energy wave', preview: 'energy-wave' },
      { id: 'beat-markers', label: 'Beat markers', preview: 'beat-markers' },
    ] },
    { name: 'Text', items: [{ id: 'title', label: 'Center title', preview: 'title' }] },
  ],
  universe: [
    { name: 'Space', items: [
      { id: 'star-field', label: 'Star field', preview: 'stars' },
      { id: 'galaxy-spiral', label: 'Galaxy spiral', preview: 'galaxy' },
      { id: 'planet-orbits', label: 'Planet orbits', preview: 'planets' },
      { id: 'comet-trails', label: 'Comet trails', preview: 'comets' },
      { id: 'shooting-stars', label: 'Shooting stars', preview: 'shooting-stars' },
    ] },
    { name: 'Atmosphere', items: [
      { id: 'nebula-glow', label: 'Nebula glow', preview: 'nebula' },
      { id: 'constellation', label: 'Constellation', preview: 'constellation' },
      { id: 'cosmic-rings', label: 'Cosmic rings', preview: 'cosmic-rings' },
      { id: 'event-horizon', label: 'Event horizon', preview: 'event-horizon' },
      { id: 'aurora-band', label: 'Aurora band', preview: 'aurora-band' },
    ] },
    { name: 'Text', items: [{ id: 'title', label: 'Cosmic title', preview: 'title' }] },
  ],
  neon: [
    { name: 'City lights', items: [
      { id: 'neon-grid', label: 'Neon grid', preview: 'grid' },
      { id: 'laser-spokes', label: 'Laser spokes', preview: 'lasers' },
      { id: 'neon-equalizer', label: 'Neon equalizer', preview: 'neon-eq' },
      { id: 'scan-line', label: 'Scan line', preview: 'scan' },
      { id: 'city-silhouette', label: 'City silhouette', preview: 'city' },
    ] },
    { name: 'Electric', items: [
      { id: 'chrome-ring', label: 'Chrome ring', preview: 'chrome' },
      { id: 'electric-arcs', label: 'Electric arcs', preview: 'arcs' },
      { id: 'neon-flare', label: 'Neon flare', preview: 'neon-flare' },
      { id: 'neon-frame', label: 'Neon frame', preview: 'neon-frame' },
      { id: 'light-trails', label: 'Light trails', preview: 'light-trails' },
    ] },
    { name: 'Text', items: [{ id: 'title', label: 'Neon title', preview: 'title' }] },
  ],
  slime: [
    { name: 'Goo', items: [
      { id: 'goo-blob', label: 'Goo blob', preview: 'blob' },
      { id: 'slime-ring', label: 'Slime ring', preview: 'slime-ring' },
      { id: 'slime-drips', label: 'Falling drips', preview: 'drips' },
      { id: 'goo-bubbles', label: 'Goo bubbles', preview: 'goo-bubbles' },
      { id: 'liquid-lens', label: 'Liquid lens', preview: 'liquid-lens' },
    ] },
    { name: 'Mess', items: [
      { id: 'splatters', label: 'Splatters', preview: 'splatters' },
      { id: 'ooze-glow', label: 'Ooze glow', preview: 'ooze' },
      { id: 'wobble-wave', label: 'Wobble wave', preview: 'wobble' },
      { id: 'cellular-flow', label: 'Cellular flow', preview: 'cellular-flow' },
      { id: 'surface-ripples', label: 'Surface ripples', preview: 'surface-ripples' },
    ] },
    { name: 'Text', items: [{ id: 'title', label: 'Slime title', preview: 'title' }] },
  ],
  bubbles: [
    { name: 'Bubbles', items: [
      { id: 'bubble-field', label: 'Bubble field', preview: 'bubble-field' },
      { id: 'bubble-orbit', label: 'Bubble orbit', preview: 'bubble-orbit' },
      { id: 'bubble-spectrum', label: 'Bubble spectrum', preview: 'bubble-spectrum' },
      { id: 'rising-bubbles', label: 'Rising bubbles', preview: 'rising' },
    ] },
    { name: 'Foam', items: [
      { id: 'foam-ring', label: 'Foam ring', preview: 'foam' },
      { id: 'bubble-glow', label: 'Bubble glow', preview: 'bubble-glow' },
      { id: 'bubble-wave', label: 'Bubble wave', preview: 'bubble-wave' },
    ] },
    { name: 'Text', items: [{ id: 'title', label: 'Bubble title', preview: 'title' }] },
  ],
  inferno: [
    { name: 'Fire', items: [
      { id: 'ember-field', label: 'Ember field', preview: 'embers' },
      { id: 'flame-ring', label: 'Flame ring', preview: 'flame' },
      { id: 'fire-bars', label: 'Fire spectrum', preview: 'fire-bars' },
      { id: 'heat-wave', label: 'Heat wave', preview: 'heat' },
    ] },
    { name: 'Atmosphere', items: [
      { id: 'spark-burst', label: 'Spark burst', preview: 'spark-burst' },
      { id: 'flare-glow', label: 'Fire glow', preview: 'fire-glow' },
    ] },
    { name: 'Text', items: [{ id: 'title', label: 'Inferno title', preview: 'title' }] },
  ],
  ocean: [
    { name: 'Water', items: [
      { id: 'caustic-light', label: 'Caustic light', preview: 'caustic' },
      { id: 'sonar-rings', label: 'Sonar rings', preview: 'sonar' },
      { id: 'current-wave', label: 'Ocean current', preview: 'current' },
      { id: 'tide-bars', label: 'Tide spectrum', preview: 'tide-bars' },
    ] },
    { name: 'Depth', items: [
      { id: 'plankton', label: 'Plankton drift', preview: 'plankton' },
      { id: 'bubble-trail', label: 'Bubble trail', preview: 'bubble-trail' },
      { id: 'deep-glow', label: 'Deep glow', preview: 'deep-glow' },
    ] },
    { name: 'Text', items: [{ id: 'title', label: 'Ocean title', preview: 'title' }] },
  ],
  minimal: [
    { name: 'Geometry', items: [
      { id: 'mono-bars', label: 'Mono bars', preview: 'mono-bars' },
      { id: 'fine-ring', label: 'Fine ring', preview: 'fine-ring' },
      { id: 'clean-wave', label: 'Clean wave', preview: 'clean-wave' },
      { id: 'dot-grid', label: 'Dot grid', preview: 'dot-grid' },
    ] },
    { name: 'Frame', items: [
      { id: 'corner-marks', label: 'Corner marks', preview: 'corner-marks' },
      { id: 'soft-vignette', label: 'Soft vignette', preview: 'soft-vignette' },
    ] },
    { name: 'Text', items: [{ id: 'title', label: 'Minimal title', preview: 'title' }] },
  ],
  retro: [
    { name: 'Synthwave', items: [
      { id: 'retro-sun', label: 'Retro sun', preview: 'retro-sun' },
      { id: 'retro-grid', label: 'Horizon grid', preview: 'retro-grid' },
      { id: 'vhs-lines', label: 'VHS lines', preview: 'vhs-lines' },
      { id: 'block-equalizer', label: 'Block equalizer', preview: 'block-eq' },
    ] },
    { name: 'Night sky', items: [
      { id: 'retro-stars', label: 'Pixel stars', preview: 'retro-stars' },
      { id: 'tape-glow', label: 'Tape glow', preview: 'tape-glow' },
    ] },
    { name: 'Text', items: [{ id: 'title', label: 'Retro title', preview: 'title' }] },
  ],
  gold: [
    { name: 'Luxe', items: [
      { id: 'gold-halo', label: 'Gold halo', preview: 'gold-halo' },
      { id: 'deco-rays', label: 'Art-deco rays', preview: 'deco-rays' },
      { id: 'champagne', label: 'Champagne drift', preview: 'champagne' },
      { id: 'orbit-arcs', label: 'Orbit arcs', preview: 'orbit-arcs' },
    ] },
    { name: 'Finish', items: [
      { id: 'gold-shimmer', label: 'Gold shimmer', preview: 'gold-shimmer' },
      { id: 'velvet-vignette', label: 'Velvet vignette', preview: 'velvet' },
    ] },
    { name: 'Text', items: [{ id: 'title', label: 'Luxe title', preview: 'title' }] },
  ],
}

const defaultThemeLayers = {
  pulse: ['bass-glow', 'core-disc', 'radial-bars', 'pulse-rings', 'particles', 'energy-wave', 'title'],
  universe: ['star-field', 'galaxy-spiral', 'planet-orbits', 'event-horizon', 'aurora-band', 'title'],
  neon: ['neon-grid', 'city-silhouette', 'chrome-ring', 'neon-frame', 'light-trails', 'title'],
  slime: ['ooze-glow', 'liquid-lens', 'slime-ring', 'cellular-flow', 'surface-ripples', 'title'],
  bubbles: ['bubble-field', 'bubble-orbit', 'foam-ring', 'rising-bubbles', 'title'],
  inferno: ['ember-field', 'flame-ring', 'flare-glow', 'title'],
  ocean: ['caustic-light', 'sonar-rings', 'plankton', 'deep-glow', 'title'],
  minimal: ['fine-ring', 'clean-wave', 'dot-grid', 'title'],
  retro: ['retro-sun', 'retro-grid', 'vhs-lines', 'title'],
  gold: ['gold-halo', 'deco-rays', 'champagne', 'velvet-vignette', 'title'],
}

const formatTime = value => {
  if (!Number.isFinite(value)) return '0:00'
  const seconds = Math.max(0, Math.floor(value))
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

const formatBytes = bytes => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / (1024 ** index)).toFixed(index ? 1 : 0)} ${units[index]}`
}

const canvasSize = aspect => aspect === 'portrait'
  ? { width: 720, height: 1280 }
  : aspect === 'landscape'
    ? { width: 1280, height: 720 }
    : { width: 900, height: 900 }

function drawCover(ctx, video, width, height, fit) {
  if (!video || video.readyState < 2 || !video.videoWidth) {
    const gradient = ctx.createLinearGradient(0, 0, width, height)
    gradient.addColorStop(0, '#121827')
    gradient.addColorStop(.55, '#402348')
    gradient.addColorStop(1, '#0d2730')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)
    return
  }
  const scale = fit === 'contain'
    ? Math.min(width / video.videoWidth, height / video.videoHeight)
    : Math.max(width / video.videoWidth, height / video.videoHeight)
  const drawWidth = video.videoWidth * scale
  const drawHeight = video.videoHeight * scale
  ctx.fillStyle = '#080b10'
  ctx.fillRect(0, 0, width, height)
  ctx.drawImage(video, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight)
}

function drawComposition(ctx, video, options, frequencyData, time) {
  const { width, height } = ctx.canvas
  drawCover(ctx, video, width, height, options.fit)
  ctx.fillStyle = `rgba(5, 8, 18, ${options.tint / 100})`
  ctx.fillRect(0, 0, width, height)
  if (options.theme === 'neon') {
    const noir = ctx.createLinearGradient(0, 0, 0, height)
    noir.addColorStop(0, 'rgba(4, 10, 24, .18)')
    noir.addColorStop(.58, 'rgba(5, 9, 25, .08)')
    noir.addColorStop(1, 'rgba(3, 7, 18, .52)')
    ctx.fillStyle = noir
    ctx.fillRect(0, 0, width, height)
  }
  if (options.theme === 'slime') {
    const liquid = ctx.createRadialGradient(width * .5, height * .44, 0, width * .5, height * .44, Math.max(width, height) * .72)
    liquid.addColorStop(0, 'rgba(35, 83, 68, .08)')
    liquid.addColorStop(.68, 'rgba(8, 30, 27, .2)')
    liquid.addColorStop(1, 'rgba(3, 18, 17, .42)')
    ctx.fillStyle = liquid
    ctx.fillRect(0, 0, width, height)
  }

  const values = frequencyData?.length ? frequencyData : new Uint8Array(64).fill(42)
  const sampleCount = Math.min(72, values.length)
  const bass = Array.from(values.slice(0, Math.max(4, Math.floor(sampleCount * .16)))).reduce((a, b) => a + b, 0) / (Math.max(4, Math.floor(sampleCount * .16)) * 255)
  const level = Array.from(values.slice(0, sampleCount)).reduce((a, b) => a + b, 0) / (sampleCount * 255)
  const reaction = Math.min(1, level * 1.7 + bass * options.intensity / 75)
  const centerX = width * (options.centerX / 100)
  const centerY = height * (options.centerY / 100)
  const minSide = Math.min(width, height)
  const radius = minSide * (.19 + reaction * .025)
  const accent = options.color
  const glow = options.glowColor
  const hasLayer = id => options.layers.includes(id)

  if (hasLayer('bass-glow')) {
    const gradient = ctx.createRadialGradient(centerX, centerY, radius * .2, centerX, centerY, minSide * .62)
    gradient.addColorStop(0, `${accent}${Math.round((.08 + bass * .28) * 255).toString(16).padStart(2, '0')}`)
    gradient.addColorStop(.45, `${glow}${Math.round((.04 + bass * .12) * 255).toString(16).padStart(2, '0')}`)
    gradient.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)
  }

  if (hasLayer('particles')) {
    ctx.save()
    for (let i = 0; i < 34; i += 1) {
      const angle = i * 2.399 + time * .00012
      const distance = radius * (1.25 + ((i * 17) % 70) / 70 * 1.25)
      const pulse = .65 + Math.sin(time * .002 + i) * .35
      const size = Math.max(1.5, minSide * .003 * (1 + reaction * 2.5) * pulse)
      ctx.globalAlpha = .28 + reaction * .55
      ctx.fillStyle = i % 3 ? accent : glow
      ctx.beginPath()
      ctx.arc(centerX + Math.cos(angle) * distance, centerY + Math.sin(angle) * distance, size, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
  }

  if (hasLayer('orbit-dots')) {
    ctx.save()
    ctx.translate(centerX, centerY)
    ctx.shadowColor = glow
    ctx.shadowBlur = minSide * .018
    for (let i = 0; i < 18; i += 1) {
      const angle = (Math.PI * 2 * i) / 18 + time * .00035
      const value = values[(i * 3) % sampleCount] / 255
      const orbitRadius = radius * (1.34 + value * .16)
      ctx.globalAlpha = .48 + value * .5
      ctx.fillStyle = i % 3 ? accent : glow
      ctx.beginPath()
      ctx.arc(Math.cos(angle) * orbitRadius, Math.sin(angle) * orbitRadius, minSide * (.0035 + value * .006), 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
  }

  if (hasLayer('radial-bars')) {
    ctx.save()
    ctx.translate(centerX, centerY)
    ctx.lineCap = 'round'
    ctx.shadowColor = accent
    ctx.shadowBlur = minSide * .018
    for (let i = 0; i < 64; i += 1) {
      const angle = (Math.PI * 2 * i) / 64 - Math.PI / 2
      const value = values[Math.floor((i / 64) * sampleCount)] / 255
      const bar = minSide * (.02 + value * .09 * (options.intensity / 50))
      const inner = radius * 1.15
      ctx.strokeStyle = i % 5 === 0 ? '#ffffff' : accent
      ctx.globalAlpha = .65 + value * .35
      ctx.lineWidth = Math.max(2, minSide * .005)
      ctx.beginPath()
      ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner)
      ctx.lineTo(Math.cos(angle) * (inner + bar), Math.sin(angle) * (inner + bar))
      ctx.stroke()
    }
    ctx.restore()
  }

  if (hasLayer('halo-dashes')) {
    ctx.save()
    ctx.translate(centerX, centerY)
    ctx.rotate(time * .00008)
    ctx.lineCap = 'round'
    for (let i = 0; i < 42; i += 1) {
      const angle = (Math.PI * 2 * i) / 42
      const value = values[(i * 2) % sampleCount] / 255
      const inner = radius * 1.26
      const length = minSide * (.012 + value * .035)
      ctx.strokeStyle = i % 2 ? accent : glow
      ctx.globalAlpha = .42 + value * .55
      ctx.lineWidth = Math.max(2, minSide * .004)
      ctx.beginPath()
      ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner)
      ctx.lineTo(Math.cos(angle) * (inner + length), Math.sin(angle) * (inner + length))
      ctx.stroke()
    }
    ctx.restore()
  }

  if (hasLayer('bottom-spectrum')) {
    ctx.save()
    const count = 44
    const gap = width * .0035
    const barWidth = Math.max(2, (width * .78 - gap * count) / count)
    const startX = width * .11
    const baseY = height * .9
    for (let i = 0; i < count; i += 1) {
      const value = values[Math.floor((i / count) * sampleCount)] / 255
      const barHeight = minSide * (.012 + value * .15 * options.intensity / 70)
      ctx.fillStyle = i % 5 ? accent : glow
      ctx.globalAlpha = .45 + value * .55
      ctx.fillRect(startX + i * (barWidth + gap), baseY - barHeight, barWidth, barHeight)
    }
    ctx.restore()
  }

  if (hasLayer('side-meters')) {
    ctx.save()
    const count = 22
    for (let i = 0; i < count; i += 1) {
      const value = values[Math.floor((i / count) * sampleCount)] / 255
      const barWidth = width * (.012 + value * .07)
      const y = height * .2 + (height * .6 * i) / count
      ctx.fillStyle = i % 4 ? accent : glow
      ctx.globalAlpha = .35 + value * .6
      ctx.fillRect(width * .035, y, barWidth, Math.max(2, height * .006))
      ctx.fillRect(width - width * .035 - barWidth, y, barWidth, Math.max(2, height * .006))
    }
    ctx.restore()
  }

  if (hasLayer('mirror-wave')) {
    ctx.save()
    ctx.lineWidth = Math.max(2, minSide * .004)
    ctx.strokeStyle = glow
    ctx.shadowColor = glow
    ctx.shadowBlur = minSide * .012
    for (const direction of [-1, 1]) {
      ctx.beginPath()
      for (let i = 0; i < 72; i += 1) {
        const value = values[Math.floor((i / 72) * sampleCount)] / 255
        const x = width * .1 + (width * .8 * i) / 71
        const y = height * .78 + direction * Math.sin(i * .62 + time * .004) * value * minSide * .055
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
      }
      ctx.globalAlpha = direction === 1 ? .9 : .38
      ctx.stroke()
    }
    ctx.restore()
  }

  if (hasLayer('pulse-rings')) {
    ctx.save()
    ctx.translate(centerX, centerY)
    ctx.shadowColor = accent
    ctx.shadowBlur = minSide * (.016 + reaction * .02)
    ctx.lineWidth = Math.max(3, minSide * .006)
    ctx.strokeStyle = accent
    ctx.globalAlpha = .95
    ctx.beginPath()
    ctx.arc(0, 0, radius, 0, Math.PI * 2)
    ctx.stroke()
    ctx.lineWidth = Math.max(2, minSide * .003)
    ctx.strokeStyle = glow
    ctx.globalAlpha = .82
    ctx.beginPath()
    ctx.arc(0, 0, radius * (1.08 + reaction * .08), 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()
  }

  if (hasLayer('ripple-rings')) {
    ctx.save()
    ctx.translate(centerX, centerY)
    for (let i = 0; i < 4; i += 1) {
      const phase = (time * .00035 + i / 4) % 1
      ctx.globalAlpha = (1 - phase) * (.25 + reaction * .55)
      ctx.strokeStyle = i % 2 ? accent : glow
      ctx.lineWidth = Math.max(2, minSide * .003)
      ctx.beginPath()
      ctx.arc(0, 0, radius * (.75 + phase * 1.15), 0, Math.PI * 2)
      ctx.stroke()
    }
    ctx.restore()
  }

  if (hasLayer('diamond-pulse')) {
    ctx.save()
    ctx.translate(centerX, centerY)
    ctx.rotate(Math.PI / 4 + Math.sin(time * .001) * .025)
    const side = radius * 1.38 * (1 + reaction * .16)
    ctx.strokeStyle = accent
    ctx.lineWidth = Math.max(2, minSide * .005)
    ctx.shadowColor = glow
    ctx.shadowBlur = minSide * .018
    ctx.strokeRect(-side / 2, -side / 2, side, side)
    ctx.restore()
  }

  if (hasLayer('nebula-glow') || hasLayer('neon-flare') || hasLayer('ooze-glow') || hasLayer('bubble-glow')) {
    const spread = hasLayer('neon-flare') ? .48 : .62
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, minSide * spread)
    gradient.addColorStop(0, `${accent}${Math.round((.16 + reaction * .3) * 255).toString(16).padStart(2, '0')}`)
    gradient.addColorStop(.45, `${glow}${Math.round((.08 + reaction * .12) * 255).toString(16).padStart(2, '0')}`)
    gradient.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)
  }

  if (hasLayer('star-field')) {
    ctx.save()
    for (let i = 0; i < 90; i += 1) {
      const x = ((i * 73.37) % 100) / 100 * width
      const y = ((i * 41.83) % 100) / 100 * height
      const twinkle = .35 + .65 * Math.abs(Math.sin(time * .0018 + i * 1.7))
      ctx.globalAlpha = .22 + twinkle * .7
      ctx.fillStyle = i % 7 ? '#ffffff' : glow
      ctx.beginPath()
      ctx.arc(x, y, minSide * (.0012 + (i % 4) * .0008) * (1 + reaction), 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
  }

  if (hasLayer('galaxy-spiral')) {
    ctx.save()
    ctx.translate(centerX, centerY)
    ctx.rotate(time * .000035)
    for (let arm = 0; arm < 3; arm += 1) {
      for (let i = 0; i < 32; i += 1) {
        const distance = radius * (.22 + i / 27)
        const angle = arm * Math.PI * 2 / 3 + i * .23
        ctx.globalAlpha = .15 + (i / 32) * .55
        ctx.fillStyle = arm === 1 ? glow : accent
        ctx.beginPath()
        ctx.arc(Math.cos(angle) * distance, Math.sin(angle) * distance * .56, minSide * (.002 + reaction * .0025), 0, Math.PI * 2)
        ctx.fill()
      }
    }
    ctx.restore()
  }

  if (hasLayer('planet-orbits')) {
    ctx.save()
    ctx.translate(centerX, centerY)
    ctx.rotate(-.22)
    for (let i = 0; i < 3; i += 1) {
      const orbitX = radius * (1 + i * .35)
      const orbitY = orbitX * .48
      ctx.globalAlpha = .28 + i * .12
      ctx.strokeStyle = i % 2 ? glow : accent
      ctx.lineWidth = Math.max(1.5, minSide * .002)
      ctx.beginPath()
      ctx.ellipse(0, 0, orbitX, orbitY, 0, 0, Math.PI * 2)
      ctx.stroke()
      const angle = time * (.00025 + i * .00006) + i * 2.1
      ctx.globalAlpha = .9
      ctx.fillStyle = i % 2 ? accent : glow
      ctx.beginPath()
      ctx.arc(Math.cos(angle) * orbitX, Math.sin(angle) * orbitY, minSide * (.009 + i * .003 + reaction * .004), 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
  }

  if (hasLayer('comet-trails')) {
    ctx.save()
    ctx.lineCap = 'round'
    for (let i = 0; i < 6; i += 1) {
      const phase = (time * (.00008 + i * .00001) + i * .19) % 1
      const x = width * (1.15 - phase * 1.45)
      const y = height * (.12 + ((i * 17) % 70) / 100)
      const trail = minSide * (.08 + reaction * .09)
      const gradient = ctx.createLinearGradient(x - trail, y + trail * .4, x, y)
      gradient.addColorStop(0, 'rgba(255,255,255,0)')
      gradient.addColorStop(1, i % 2 ? accent : glow)
      ctx.strokeStyle = gradient
      ctx.lineWidth = Math.max(2, minSide * .004)
      ctx.beginPath()
      ctx.moveTo(x - trail, y + trail * .42)
      ctx.lineTo(x, y)
      ctx.stroke()
    }
    ctx.restore()
  }

  if (hasLayer('constellation')) {
    const points = Array.from({ length: 12 }, (_, i) => ({
      x: width * (.12 + ((i * 31) % 76) / 100),
      y: height * (.13 + ((i * 47) % 72) / 100),
    }))
    ctx.save()
    ctx.strokeStyle = `${glow}88`
    ctx.lineWidth = Math.max(1, minSide * .0016)
    ctx.beginPath()
    points.forEach((point, i) => { if (!i) ctx.moveTo(point.x, point.y); else ctx.lineTo(point.x, point.y) })
    ctx.stroke()
    points.forEach((point, i) => {
      ctx.fillStyle = i % 3 ? '#ffffff' : accent
      ctx.beginPath()
      ctx.arc(point.x, point.y, minSide * (.003 + reaction * .003), 0, Math.PI * 2)
      ctx.fill()
    })
    ctx.restore()
  }

  if (hasLayer('cosmic-rings')) {
    ctx.save()
    ctx.translate(centerX, centerY)
    ctx.rotate(time * .0001)
    ctx.lineWidth = Math.max(2, minSide * .003)
    for (let i = 0; i < 4; i += 1) {
      ctx.strokeStyle = i % 2 ? accent : glow
      ctx.globalAlpha = .32 + reaction * .45
      ctx.beginPath()
      ctx.arc(0, 0, radius * (.8 + i * .23), i * .7, i * .7 + Math.PI * (1.1 + reaction * .5))
      ctx.stroke()
    }
    ctx.restore()
  }

  if (hasLayer('neon-grid')) {
    ctx.save()
    const horizon = height * .62
    ctx.strokeStyle = `${accent}55`
    ctx.lineWidth = Math.max(1, minSide * .0012)
    for (let i = 0; i <= 14; i += 1) {
      const x = width * i / 14
      ctx.beginPath(); ctx.moveTo(width / 2, horizon); ctx.lineTo(x, height); ctx.stroke()
    }
    for (let i = 0; i < 11; i += 1) {
      const phase = (i / 10 + time * .00018) % 1
      const y = horizon + (height - horizon) * phase * phase
      ctx.globalAlpha = .1 + phase * .36
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke()
    }
    ctx.restore()
  }

  if (hasLayer('laser-spokes')) {
    ctx.save()
    ctx.translate(centerX, centerY)
    ctx.rotate(time * .00006)
    for (let i = 0; i < 18; i += 1) {
      const angle = i * Math.PI * 2 / 18
      const value = values[(i * 4) % sampleCount] / 255
      const length = minSide * (.28 + value * .34)
      const gradient = ctx.createLinearGradient(0, 0, Math.cos(angle) * length, Math.sin(angle) * length)
      gradient.addColorStop(0, 'rgba(255,255,255,0)')
      gradient.addColorStop(1, i % 2 ? accent : glow)
      ctx.strokeStyle = gradient
      ctx.globalAlpha = .3 + value * .55
      ctx.lineWidth = Math.max(1.5, minSide * .003)
      ctx.beginPath(); ctx.moveTo(Math.cos(angle) * radius * .7, Math.sin(angle) * radius * .7); ctx.lineTo(Math.cos(angle) * length, Math.sin(angle) * length); ctx.stroke()
    }
    ctx.restore()
  }

  if (hasLayer('neon-equalizer')) {
    ctx.save()
    const count = 34
    const startX = width * .18
    const baseY = height * .88
    const gap = width * .006
    const barWidth = (width * .64 - gap * count) / count
    for (let i = 0; i < count; i += 1) {
      const value = values[Math.floor(i / count * sampleCount)] / 255
      const barHeight = minSide * (.03 + value * .22)
      ctx.shadowColor = i % 2 ? accent : glow
      ctx.shadowBlur = minSide * .01
      ctx.fillStyle = i % 2 ? accent : glow
      ctx.fillRect(startX + i * (barWidth + gap), baseY - barHeight, Math.max(2, barWidth), barHeight)
    }
    ctx.restore()
  }

  if (hasLayer('scan-line')) {
    const y = ((time * .0002) % 1) * height
    const gradient = ctx.createLinearGradient(0, y - minSide * .08, 0, y + minSide * .08)
    gradient.addColorStop(0, 'rgba(0,0,0,0)')
    gradient.addColorStop(.5, `${glow}55`)
    gradient.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, y - minSide * .05, width, minSide * .1)
  }

  if (hasLayer('chrome-ring')) {
    ctx.save()
    const gradient = ctx.createLinearGradient(centerX - radius, centerY - radius, centerX + radius, centerY + radius)
    gradient.addColorStop(0, '#ffffff'); gradient.addColorStop(.25, glow); gradient.addColorStop(.55, accent); gradient.addColorStop(.8, '#ffffff'); gradient.addColorStop(1, glow)
    ctx.strokeStyle = gradient
    ctx.lineWidth = minSide * (.007 + reaction * .004)
    ctx.shadowColor = glow
    ctx.shadowBlur = minSide * .014
    ctx.beginPath(); ctx.arc(centerX, centerY, radius * (1 + reaction * .08), 0, Math.PI * 2); ctx.stroke()
    ctx.globalAlpha = .42
    ctx.lineWidth = Math.max(1.5, minSide * .002)
    ctx.beginPath(); ctx.arc(centerX, centerY, radius * (.9 + reaction * .04), 0, Math.PI * 2); ctx.stroke()
    ctx.restore()
  }

  if (hasLayer('electric-arcs')) {
    ctx.save()
    ctx.lineWidth = Math.max(1.5, minSide * .003)
    ctx.strokeStyle = glow
    ctx.shadowColor = glow
    ctx.shadowBlur = minSide * .012
    for (let arc = 0; arc < 4; arc += 1) {
      ctx.beginPath()
      for (let i = 0; i <= 18; i += 1) {
        const angle = arc * Math.PI / 2 + i / 18 * Math.PI / 2
        const jitter = Math.sin(i * 7.1 + time * .02 + arc) * minSide * .012 * reaction
        const r = radius * 1.18 + jitter
        if (!i) ctx.moveTo(centerX + Math.cos(angle) * r, centerY + Math.sin(angle) * r); else ctx.lineTo(centerX + Math.cos(angle) * r, centerY + Math.sin(angle) * r)
      }
      ctx.stroke()
    }
    ctx.restore()
  }

  if (hasLayer('goo-blob')) {
    ctx.save()
    ctx.translate(centerX, centerY)
    const liquidFill = ctx.createRadialGradient(-radius * .32, -radius * .42, radius * .08, 0, 0, radius * 1.25)
    liquidFill.addColorStop(0, 'rgba(255,255,255,.38)')
    liquidFill.addColorStop(.24, `${glow}88`)
    liquidFill.addColorStop(.7, `${accent}55`)
    liquidFill.addColorStop(1, `${accent}22`)
    ctx.fillStyle = liquidFill
    ctx.strokeStyle = `${glow}cc`
    ctx.lineWidth = minSide * .005
    ctx.shadowColor = glow
    ctx.shadowBlur = minSide * .016
    ctx.beginPath()
    for (let i = 0; i <= 40; i += 1) {
      const angle = i / 40 * Math.PI * 2
      const wobble = 1 + Math.sin(angle * 4 + time * .0015) * (.045 + reaction * .075)
      const r = radius * wobble
      const x = Math.cos(angle) * r; const y = Math.sin(angle) * r
      if (!i) ctx.moveTo(x, y); else ctx.lineTo(x, y)
    }
    ctx.closePath(); ctx.fill(); ctx.stroke()
    ctx.globalAlpha = .56
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = Math.max(2, minSide * .003)
    ctx.beginPath(); ctx.arc(-radius * .28, -radius * .3, radius * .22, Math.PI * 1.05, Math.PI * 1.62); ctx.stroke()
    ctx.restore()
  }

  if (hasLayer('slime-ring')) {
    ctx.save()
    ctx.translate(centerX, centerY)
    ctx.strokeStyle = `${accent}bb`
    ctx.lineCap = 'round'
    ctx.lineWidth = minSide * .006
    ctx.beginPath()
    for (let i = 0; i <= 60; i += 1) {
      const angle = i / 60 * Math.PI * 2
      const r = radius * (1.12 + Math.sin(angle * 7 + time * .0025) * .045 * (1 + reaction))
      if (!i) ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r); else ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r)
    }
    ctx.closePath(); ctx.stroke()
    ctx.globalAlpha = .38
    ctx.strokeStyle = glow
    ctx.lineWidth = Math.max(1.5, minSide * .002)
    ctx.beginPath(); ctx.arc(0, 0, radius * .94, 0, Math.PI * 2); ctx.stroke()
    ctx.restore()
  }

  if (hasLayer('liquid-lens')) {
    ctx.save()
    ctx.translate(centerX, centerY)
    const lensRadius = radius * (1.02 + reaction * .06)
    const lens = ctx.createRadialGradient(-lensRadius * .34, -lensRadius * .4, lensRadius * .04, 0, 0, lensRadius * 1.12)
    lens.addColorStop(0, 'rgba(255,255,255,.46)')
    lens.addColorStop(.18, `${glow}88`)
    lens.addColorStop(.52, `${accent}4d`)
    lens.addColorStop(.82, 'rgba(8,37,32,.62)')
    lens.addColorStop(1, 'rgba(2,18,16,.22)')
    ctx.fillStyle = lens
    ctx.shadowColor = glow
    ctx.shadowBlur = minSide * (.02 + reaction * .02)
    ctx.beginPath()
    for (let i = 0; i <= 64; i += 1) {
      const angle = i / 64 * Math.PI * 2
      const ripple = Math.sin(angle * 3 + time * .0013) * .025 + Math.sin(angle * 7 - time * .0018) * .018 * (1 + reaction)
      const r = lensRadius * (1 + ripple)
      if (!i) ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r); else ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r)
    }
    ctx.closePath(); ctx.fill()
    ctx.strokeStyle = `${glow}aa`; ctx.lineWidth = minSide * .003; ctx.stroke()
    ctx.globalAlpha = .5; ctx.strokeStyle = '#fff'; ctx.lineCap = 'round'; ctx.lineWidth = minSide * .004
    ctx.beginPath(); ctx.arc(-lensRadius * .15, -lensRadius * .18, lensRadius * .58, Math.PI * 1.08, Math.PI * 1.52); ctx.stroke()
    ctx.restore()
  }

  if (hasLayer('cellular-flow')) {
    ctx.save(); ctx.globalCompositeOperation = 'screen'
    for (let i = 0; i < 16; i += 1) {
      const angle = i * 2.399 + time * .00008
      const distance = radius * (.35 + ((i * 23) % 76) / 100)
      const x = centerX + Math.cos(angle) * distance
      const y = centerY + Math.sin(angle) * distance * .72
      const value = values[(i * 4) % sampleCount] / 255
      const size = minSide * (.016 + (i % 5) * .007 + value * .012)
      ctx.strokeStyle = i % 3 ? `${accent}80` : `${glow}aa`
      ctx.lineWidth = minSide * .002
      ctx.globalAlpha = .32 + value * .42
      ctx.beginPath(); ctx.ellipse(x, y, size * 1.3, size, angle, 0, Math.PI * 2); ctx.stroke()
    }
    ctx.restore()
  }

  if (hasLayer('surface-ripples')) {
    ctx.save(); ctx.translate(centerX, centerY); ctx.rotate(.08)
    for (let i = 0; i < 4; i += 1) {
      const phase = (time * .00022 + i / 4) % 1
      ctx.strokeStyle = i % 2 ? accent : glow
      ctx.globalAlpha = (1 - phase) * (.22 + reaction * .36)
      ctx.lineWidth = minSide * .0025
      ctx.beginPath(); ctx.ellipse(0, radius * .45, radius * (.42 + phase * .95), radius * (.12 + phase * .2), 0, 0, Math.PI * 2); ctx.stroke()
    }
    ctx.restore()
  }

  if (hasLayer('slime-drips')) {
    ctx.save()
    for (let i = 0; i < 13; i += 1) {
      const x = width * (.08 + i / 15)
      const value = values[(i * 5) % sampleCount] / 255
      const length = height * (.06 + value * .18 + reaction * .05)
      ctx.strokeStyle = i % 2 ? accent : glow
      ctx.lineWidth = minSide * (.007 + value * .009)
      ctx.lineCap = 'round'
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, length); ctx.stroke()
      ctx.beginPath(); ctx.fillStyle = i % 2 ? accent : glow; ctx.arc(x, length, minSide * (.008 + value * .008), 0, Math.PI * 2); ctx.fill()
    }
    ctx.restore()
  }

  if (hasLayer('goo-bubbles') || hasLayer('bubble-field') || hasLayer('rising-bubbles')) {
    ctx.save()
    const bubbleCount = hasLayer('bubble-field') ? 38 : 24
    for (let i = 0; i < bubbleCount; i += 1) {
      const speed = .000035 + (i % 5) * .000012
      const y = height * (1.15 - ((time * speed + i * .093) % 1.3))
      const x = width * (.04 + ((i * 37) % 92) / 100) + Math.sin(time * .001 + i) * minSide * .015
      const value = values[(i * 3) % sampleCount] / 255
      const size = minSide * (.008 + (i % 6) * .004 + value * .01)
      ctx.globalAlpha = .25 + value * .55
      ctx.strokeStyle = i % 2 ? accent : glow
      ctx.lineWidth = Math.max(1.5, minSide * .0025)
      ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI * 2); ctx.stroke()
      if (hasLayer('goo-bubbles')) { ctx.fillStyle = `${accent}44`; ctx.fill() }
    }
    ctx.restore()
  }

  if (hasLayer('splatters')) {
    ctx.save()
    for (let i = 0; i < 34; i += 1) {
      const angle = i * 2.39
      const distance = radius * (1.1 + ((i * 19) % 80) / 60)
      const size = minSide * (.003 + (i % 5) * .002 + reaction * .006)
      ctx.fillStyle = i % 2 ? accent : glow
      ctx.globalAlpha = .3 + reaction * .55
      ctx.beginPath(); ctx.arc(centerX + Math.cos(angle) * distance, centerY + Math.sin(angle) * distance, size, 0, Math.PI * 2); ctx.fill()
    }
    ctx.restore()
  }

  if (hasLayer('wobble-wave')) {
    ctx.save()
    ctx.strokeStyle = accent
    ctx.lineWidth = minSide * .014
    ctx.lineCap = 'round'
    ctx.beginPath()
    for (let i = 0; i <= 64; i += 1) {
      const value = values[Math.floor(i / 64 * sampleCount)] / 255
      const x = width * .08 + width * .84 * i / 64
      const y = height * .84 + Math.sin(i * .42 + time * .003) * minSide * (.018 + value * .05)
      if (!i) ctx.moveTo(x, y); else ctx.lineTo(x, y)
    }
    ctx.stroke(); ctx.restore()
  }

  if (hasLayer('bubble-orbit')) {
    ctx.save(); ctx.translate(centerX, centerY)
    for (let i = 0; i < 16; i += 1) {
      const angle = i / 16 * Math.PI * 2 + time * .00025
      const value = values[(i * 4) % sampleCount] / 255
      const r = radius * (1.22 + value * .18)
      const size = minSide * (.007 + value * .012)
      ctx.strokeStyle = i % 2 ? accent : glow; ctx.globalAlpha = .5 + value * .45; ctx.lineWidth = minSide * .0025
      ctx.beginPath(); ctx.arc(Math.cos(angle) * r, Math.sin(angle) * r, size, 0, Math.PI * 2); ctx.stroke()
    }
    ctx.restore()
  }

  if (hasLayer('bubble-spectrum')) {
    ctx.save()
    for (let i = 0; i < 30; i += 1) {
      const value = values[Math.floor(i / 30 * sampleCount)] / 255
      const x = width * .12 + width * .76 * i / 29
      const y = height * .88 - value * minSide * .16
      ctx.strokeStyle = i % 2 ? accent : glow; ctx.globalAlpha = .45 + value * .5; ctx.lineWidth = minSide * .002
      ctx.beginPath(); ctx.arc(x, y, minSide * (.006 + value * .014), 0, Math.PI * 2); ctx.stroke()
    }
    ctx.restore()
  }

  if (hasLayer('foam-ring')) {
    ctx.save(); ctx.translate(centerX, centerY)
    for (let i = 0; i < 40; i += 1) {
      const angle = i / 40 * Math.PI * 2
      const value = values[(i * 2) % sampleCount] / 255
      const r = radius * (1.08 + value * .12)
      ctx.strokeStyle = i % 2 ? accent : glow; ctx.globalAlpha = .55 + value * .4; ctx.lineWidth = minSide * .002
      ctx.beginPath(); ctx.arc(Math.cos(angle) * r, Math.sin(angle) * r, minSide * (.006 + value * .009), 0, Math.PI * 2); ctx.stroke()
    }
    ctx.restore()
  }

  if (hasLayer('bubble-wave')) {
    ctx.save(); ctx.strokeStyle = glow; ctx.lineWidth = minSide * .003
    for (let i = 0; i < 38; i += 1) {
      const value = values[Math.floor(i / 38 * sampleCount)] / 255
      const x = width * .1 + width * .8 * i / 37
      const y = height * .76 + Math.sin(i * .55 + time * .003) * minSide * .04
      ctx.globalAlpha = .35 + value * .6
      ctx.beginPath(); ctx.arc(x, y, minSide * (.004 + value * .01), 0, Math.PI * 2); ctx.stroke()
    }
    ctx.restore()
  }

  if (hasLayer('flare-glow') || hasLayer('deep-glow') || hasLayer('soft-vignette') || hasLayer('tape-glow') || hasLayer('velvet-vignette')) {
    const edge = hasLayer('soft-vignette') || hasLayer('velvet-vignette')
    const gradient = ctx.createRadialGradient(centerX, centerY, minSide * .04, centerX, centerY, minSide * .68)
    gradient.addColorStop(0, edge ? 'rgba(0,0,0,0)' : `${accent}66`)
    gradient.addColorStop(.45, edge ? `${glow}12` : `${glow}25`)
    gradient.addColorStop(1, edge ? 'rgba(0,0,0,.6)' : 'rgba(0,0,0,0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)
  }

  if (hasLayer('ember-field') || hasLayer('plankton') || hasLayer('champagne') || hasLayer('retro-stars')) {
    ctx.save()
    const count = hasLayer('champagne') ? 46 : 58
    for (let i = 0; i < count; i += 1) {
      const drift = (time * (.000025 + (i % 6) * .000006) + i * .071) % 1.2
      const x = width * (.04 + ((i * 47) % 92) / 100) + Math.sin(time * .0007 + i) * minSide * .018
      const y = hasLayer('retro-stars') ? height * (.08 + ((i * 31) % 52) / 100) : height * (1.08 - drift)
      const value = values[(i * 3) % sampleCount] / 255
      ctx.globalAlpha = .25 + value * .62
      ctx.fillStyle = i % 4 ? accent : glow
      const size = minSide * (.0018 + (i % 4) * .001 + value * .002)
      ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI * 2); ctx.fill()
    }
    ctx.restore()
  }

  if (hasLayer('flame-ring')) {
    ctx.save(); ctx.translate(centerX, centerY)
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.shadowColor = accent; ctx.shadowBlur = minSide * .02
    for (let ring = 0; ring < 2; ring += 1) {
      ctx.beginPath()
      for (let i = 0; i <= 80; i += 1) {
        const angle = i / 80 * Math.PI * 2
        const flame = Math.max(0, Math.sin(angle * 11 - time * .004 + ring)) * reaction * .14
        const r = radius * (1 + ring * .12 + flame)
        if (!i) ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r); else ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r)
      }
      ctx.closePath(); ctx.strokeStyle = ring ? glow : accent; ctx.globalAlpha = ring ? .62 : .94; ctx.lineWidth = minSide * (ring ? .003 : .007); ctx.stroke()
    }
    ctx.restore()
  }

  if (hasLayer('fire-bars') || hasLayer('mono-bars')) {
    ctx.save(); ctx.translate(centerX, centerY); ctx.lineCap = 'round'
    const count = hasLayer('mono-bars') ? 40 : 64
    for (let i = 0; i < count; i += 1) {
      const angle = i / count * Math.PI * 2 - Math.PI / 2
      const value = values[Math.floor(i / count * sampleCount)] / 255
      const inner = radius * 1.12
      const length = minSide * (.012 + value * (hasLayer('mono-bars') ? .045 : .085))
      ctx.strokeStyle = i % 5 ? accent : glow; ctx.globalAlpha = .52 + value * .46
      ctx.lineWidth = minSide * (hasLayer('mono-bars') ? .0025 : .005)
      ctx.beginPath(); ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner); ctx.lineTo(Math.cos(angle) * (inner + length), Math.sin(angle) * (inner + length)); ctx.stroke()
    }
    ctx.restore()
  }

  if (hasLayer('heat-wave') || hasLayer('current-wave') || hasLayer('clean-wave')) {
    ctx.save(); ctx.lineCap = 'round'
    const isClean = hasLayer('clean-wave')
    for (let line = 0; line < (isClean ? 1 : 3); line += 1) {
      ctx.beginPath()
      for (let i = 0; i <= 80; i += 1) {
        const value = values[Math.floor(i / 80 * sampleCount)] / 255
        const x = width * .08 + width * .84 * i / 80
        const y = height * (.78 + line * .035) + Math.sin(i * .34 + time * .003 + line) * minSide * (.008 + value * (isClean ? .02 : .038))
        if (!i) ctx.moveTo(x, y); else ctx.lineTo(x, y)
      }
      ctx.strokeStyle = line % 2 ? glow : accent; ctx.globalAlpha = .75 - line * .17; ctx.lineWidth = minSide * (isClean ? .002 : .003); ctx.stroke()
    }
    ctx.restore()
  }

  if (hasLayer('spark-burst') || hasLayer('deco-rays')) {
    ctx.save(); ctx.translate(centerX, centerY); ctx.rotate(time * (hasLayer('deco-rays') ? .000015 : .00012)); ctx.lineCap = 'round'
    const count = hasLayer('deco-rays') ? 24 : 36
    for (let i = 0; i < count; i += 1) {
      const angle = i / count * Math.PI * 2
      const value = values[(i * 3) % sampleCount] / 255
      const start = radius * 1.2
      const end = start + minSide * (.025 + value * (hasLayer('deco-rays') ? .07 : .12))
      ctx.strokeStyle = i % 2 ? accent : glow; ctx.globalAlpha = .25 + value * .65; ctx.lineWidth = minSide * (hasLayer('deco-rays') ? .0018 : .0035)
      ctx.beginPath(); ctx.moveTo(Math.cos(angle) * start, Math.sin(angle) * start); ctx.lineTo(Math.cos(angle) * end, Math.sin(angle) * end); ctx.stroke()
    }
    ctx.restore()
  }

  if (hasLayer('caustic-light')) {
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.strokeStyle = `${glow}55`; ctx.lineWidth = minSide * .008; ctx.shadowColor = glow; ctx.shadowBlur = minSide * .018
    for (let row = 0; row < 5; row += 1) {
      ctx.beginPath()
      for (let i = 0; i <= 32; i += 1) {
        const x = width * i / 32
        const y = height * (.16 + row * .17) + Math.sin(i * .7 + time * .0018 + row) * minSide * .025
        if (!i) ctx.moveTo(x, y); else ctx.lineTo(x, y)
      }
      ctx.stroke()
    }
    ctx.restore()
  }

  if (hasLayer('sonar-rings') || hasLayer('fine-ring') || hasLayer('gold-halo') || hasLayer('orbit-arcs')) {
    ctx.save(); ctx.translate(centerX, centerY); ctx.rotate(hasLayer('orbit-arcs') ? time * .00008 : 0)
    const count = hasLayer('sonar-rings') ? 4 : hasLayer('orbit-arcs') ? 3 : 2
    for (let i = 0; i < count; i += 1) {
      const phase = hasLayer('sonar-rings') ? (time * .00025 + i / count) % 1 : i / Math.max(1, count - 1)
      ctx.strokeStyle = i % 2 ? glow : accent; ctx.globalAlpha = hasLayer('sonar-rings') ? (1 - phase) * .72 : .35 + i * .18
      ctx.lineWidth = minSide * (hasLayer('fine-ring') ? .0018 : .003)
      ctx.beginPath()
      if (hasLayer('orbit-arcs')) ctx.arc(0, 0, radius * (.86 + i * .24), i * .8, i * .8 + Math.PI * 1.25)
      else ctx.arc(0, 0, radius * (hasLayer('sonar-rings') ? .65 + phase * 1.25 : .95 + i * .12 + reaction * .04), 0, Math.PI * 2)
      ctx.stroke()
    }
    ctx.restore()
  }

  if (hasLayer('tide-bars') || hasLayer('block-equalizer')) {
    ctx.save(); const count = hasLayer('block-equalizer') ? 24 : 42; const baseY = height * .89; const startX = width * .1; const available = width * .8; const gap = width * .004; const barWidth = available / count - gap
    for (let i = 0; i < count; i += 1) {
      const value = values[Math.floor(i / count * sampleCount)] / 255
      const barHeight = minSide * (.012 + value * .16)
      ctx.fillStyle = i % 3 ? accent : glow; ctx.globalAlpha = .5 + value * .48
      ctx.fillRect(startX + i * available / count, baseY - barHeight, Math.max(2, barWidth), barHeight)
    }
    ctx.restore()
  }

  if (hasLayer('bubble-trail')) {
    ctx.save()
    for (let i = 0; i < 18; i += 1) {
      const phase = (time * (.00004 + i % 4 * .00001) + i * .08) % 1.15
      const x = centerX + Math.sin(time * .001 + i) * radius * .65
      const y = height * (1.06 - phase)
      ctx.strokeStyle = i % 2 ? accent : glow; ctx.globalAlpha = .25 + (i % 5) * .12; ctx.lineWidth = minSide * .002
      ctx.beginPath(); ctx.arc(x, y, minSide * (.005 + i % 5 * .003), 0, Math.PI * 2); ctx.stroke()
    }
    ctx.restore()
  }

  if (hasLayer('dot-grid')) {
    ctx.save(); ctx.fillStyle = glow; ctx.globalAlpha = .24
    const step = minSide * .055
    for (let y = step; y < height; y += step) for (let x = step; x < width; x += step) { ctx.beginPath(); ctx.arc(x, y, minSide * .0018, 0, Math.PI * 2); ctx.fill() }
    ctx.restore()
  }

  if (hasLayer('corner-marks')) {
    ctx.save(); ctx.strokeStyle = accent; ctx.globalAlpha = .7; ctx.lineWidth = minSide * .003
    const inset = minSide * .06; const length = minSide * .08
    ;[[inset,inset,1,1],[width-inset,inset,-1,1],[inset,height-inset,1,-1],[width-inset,height-inset,-1,-1]].forEach(([x,y,sx,sy]) => { ctx.beginPath(); ctx.moveTo(x + sx * length, y); ctx.lineTo(x, y); ctx.lineTo(x, y + sy * length); ctx.stroke() })
    ctx.restore()
  }

  if (hasLayer('retro-sun')) {
    ctx.save(); const sunRadius = radius * 1.05; const gradient = ctx.createLinearGradient(0, centerY - sunRadius, 0, centerY + sunRadius); gradient.addColorStop(0, glow); gradient.addColorStop(1, accent); ctx.fillStyle = gradient; ctx.beginPath(); ctx.arc(centerX, centerY, sunRadius, 0, Math.PI * 2); ctx.fill(); ctx.globalCompositeOperation = 'destination-out'
    for (let i = 0; i < 9; i += 1) { const y = centerY + sunRadius * (.12 + i * .1); ctx.fillRect(centerX - sunRadius, y, sunRadius * 2, minSide * (.006 + i * .0015)) }
    ctx.restore()
  }

  if (hasLayer('retro-grid')) {
    ctx.save(); const horizon = height * .63; ctx.strokeStyle = `${glow}77`; ctx.lineWidth = minSide * .0015
    for (let i = 0; i <= 16; i += 1) { ctx.beginPath(); ctx.moveTo(width / 2, horizon); ctx.lineTo(width * i / 16, height); ctx.stroke() }
    for (let i = 0; i < 10; i += 1) { const phase = (i / 10 + time * .00018) % 1; const y = horizon + (height - horizon) * phase * phase; ctx.globalAlpha = .18 + phase * .55; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke() }
    ctx.restore()
  }

  if (hasLayer('vhs-lines')) {
    ctx.save(); ctx.fillStyle = `${glow}18`
    for (let y = 0; y < height; y += Math.max(4, minSide * .008)) ctx.fillRect(0, y, width, Math.max(1, minSide * .0015))
    const trackingY = (time * .00017 % 1) * height; ctx.fillStyle = `${accent}44`; ctx.fillRect(0, trackingY, width, minSide * .006); ctx.restore()
  }

  if (hasLayer('gold-shimmer')) {
    ctx.save(); const x = ((time * .00018) % 1.35 - .2) * width; const gradient = ctx.createLinearGradient(x - width * .16, 0, x + width * .16, 0); gradient.addColorStop(0, 'rgba(255,255,255,0)'); gradient.addColorStop(.5, `${glow}66`); gradient.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = gradient; ctx.transform(1, 0, -.22, 1, 0, 0); ctx.fillRect(x - width * .18, 0, width * .36, height); ctx.restore()
  }

  if (hasLayer('core-disc')) {
    ctx.save()
    const glass = ctx.createRadialGradient(centerX - radius * .25, centerY - radius * .32, radius * .05, centerX, centerY, radius)
    glass.addColorStop(0, 'rgba(255,255,255,.22)')
    glass.addColorStop(.35, `${glow}22`)
    glass.addColorStop(.72, `${accent}18`)
    glass.addColorStop(1, 'rgba(4,8,20,.52)')
    ctx.fillStyle = glass
    ctx.shadowColor = glow
    ctx.shadowBlur = minSide * (.025 + reaction * .025)
    ctx.beginPath(); ctx.arc(centerX, centerY, radius * .91, 0, Math.PI * 2); ctx.fill()
    ctx.globalAlpha = .5
    ctx.strokeStyle = '#fff'; ctx.lineWidth = minSide * .0025
    ctx.beginPath(); ctx.arc(centerX - radius * .12, centerY - radius * .16, radius * .55, Math.PI * 1.06, Math.PI * 1.55); ctx.stroke()
    ctx.restore()
  }

  if (hasLayer('energy-wave')) {
    ctx.save(); ctx.translate(centerX, centerY); ctx.rotate(time * .00016); ctx.lineCap = 'round'
    for (let band = 0; band < 2; band += 1) {
      ctx.beginPath()
      for (let i = 0; i <= 96; i += 1) {
        const angle = i / 96 * Math.PI * 2
        const value = values[Math.floor(i / 96 * sampleCount)] / 255
        const wobble = Math.sin(angle * 5 + time * .003 + band) * minSide * (.006 + value * .015)
        const r = radius * (1.32 + band * .08) + wobble
        if (!i) ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r); else ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r)
      }
      ctx.closePath(); ctx.strokeStyle = band ? glow : accent; ctx.globalAlpha = band ? .42 : .68; ctx.lineWidth = minSide * (band ? .002 : .0035); ctx.stroke()
    }
    ctx.restore()
  }

  if (hasLayer('beat-markers')) {
    ctx.save(); ctx.translate(centerX, centerY); ctx.rotate(-time * .0001)
    for (let i = 0; i < 12; i += 1) {
      const angle = i / 12 * Math.PI * 2
      const value = values[(i * 5) % sampleCount] / 255
      const r = radius * 1.55
      ctx.fillStyle = i % 3 ? accent : glow; ctx.globalAlpha = .3 + value * .7
      const size = minSide * (.004 + value * .007)
      ctx.beginPath(); ctx.arc(Math.cos(angle) * r, Math.sin(angle) * r, size, 0, Math.PI * 2); ctx.fill()
    }
    ctx.restore()
  }

  if (hasLayer('event-horizon')) {
    ctx.save()
    const shadow = ctx.createRadialGradient(centerX, centerY, radius * .22, centerX, centerY, radius * 1.06)
    shadow.addColorStop(0, 'rgba(0,0,0,.88)')
    shadow.addColorStop(.58, 'rgba(3,4,14,.78)')
    shadow.addColorStop(.76, `${accent}32`)
    shadow.addColorStop(.86, `${glow}54`)
    shadow.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = shadow; ctx.beginPath(); ctx.arc(centerX, centerY, radius * 1.16, 0, Math.PI * 2); ctx.fill()
    ctx.translate(centerX, centerY); ctx.rotate(-.18 + time * .000025)
    ctx.strokeStyle = '#fff'; ctx.globalAlpha = .65 + reaction * .25; ctx.lineWidth = minSide * .004; ctx.shadowColor = glow; ctx.shadowBlur = minSide * .02
    ctx.beginPath(); ctx.ellipse(0, 0, radius * 1.18, radius * .32, 0, 0, Math.PI * 2); ctx.stroke()
    ctx.restore()
  }

  if (hasLayer('aurora-band')) {
    ctx.save(); ctx.globalCompositeOperation = 'screen'
    const aurora = ctx.createLinearGradient(0, 0, width, height)
    aurora.addColorStop(0, 'rgba(0,0,0,0)'); aurora.addColorStop(.35, `${accent}18`); aurora.addColorStop(.58, `${glow}3a`); aurora.addColorStop(.78, `${accent}18`); aurora.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.strokeStyle = aurora; ctx.lineWidth = minSide * .12; ctx.shadowColor = glow; ctx.shadowBlur = minSide * .06; ctx.globalAlpha = .52
    ctx.beginPath()
    for (let i = 0; i <= 32; i += 1) {
      const x = width * i / 32
      const y = height * .28 + Math.sin(i * .32 + time * .0008) * minSide * .09
      if (!i) ctx.moveTo(x, y); else ctx.lineTo(x, y)
    }
    ctx.stroke(); ctx.restore()
  }

  if (hasLayer('shooting-stars')) {
    ctx.save(); ctx.lineCap = 'round'
    for (let i = 0; i < 5; i += 1) {
      const phase = (time * (.000055 + i * .000006) + i * .21) % 1.15
      const x = width * (1.15 - phase * 1.35); const y = height * (.12 + i * .14 + phase * .16)
      const length = minSide * (.08 + reaction * .08)
      const trail = ctx.createLinearGradient(x - length, y - length * .45, x, y)
      trail.addColorStop(0, 'rgba(255,255,255,0)'); trail.addColorStop(1, i % 2 ? glow : '#fff')
      ctx.strokeStyle = trail; ctx.lineWidth = minSide * .003; ctx.globalAlpha = .45 + reaction * .45
      ctx.beginPath(); ctx.moveTo(x - length, y - length * .45); ctx.lineTo(x, y); ctx.stroke()
    }
    ctx.restore()
  }

  if (hasLayer('city-silhouette')) {
    ctx.save(); const ground = height * .72; ctx.fillStyle = 'rgba(3,7,18,.82)'
    const buildings = [9,15,11,23,17,12,27,14,19,10,25,16,21,13,18,24,12,20]
    const unit = width / buildings.length
    buildings.forEach((storeys, i) => {
      const buildingWidth = unit * .82; const buildingHeight = minSide * (.08 + storeys * .006)
      const x = i * unit + unit * .09; const y = ground - buildingHeight
      ctx.fillRect(x, y, buildingWidth, buildingHeight)
      ctx.fillStyle = i % 2 ? `${accent}70` : `${glow}70`
      for (let row = 0; row < Math.floor(storeys / 3); row += 1) for (let col = 0; col < 2; col += 1) if ((row + col + i) % 3) ctx.fillRect(x + buildingWidth * (.22 + col * .42), y + minSide * (.012 + row * .018), minSide * .004, minSide * .006)
      ctx.fillStyle = 'rgba(3,7,18,.82)'
    })
    ctx.restore()
  }

  if (hasLayer('neon-frame')) {
    ctx.save(); const inset = minSide * .035; const corner = minSide * .06
    ctx.strokeStyle = accent; ctx.lineWidth = minSide * .003; ctx.shadowColor = accent; ctx.shadowBlur = minSide * .012; ctx.globalAlpha = .72
    ctx.beginPath(); ctx.moveTo(inset, inset + corner); ctx.lineTo(inset, inset); ctx.lineTo(inset + corner, inset); ctx.moveTo(width - inset - corner, inset); ctx.lineTo(width - inset, inset); ctx.lineTo(width - inset, inset + corner); ctx.moveTo(inset, height - inset - corner); ctx.lineTo(inset, height - inset); ctx.lineTo(inset + corner, height - inset); ctx.moveTo(width - inset - corner, height - inset); ctx.lineTo(width - inset, height - inset); ctx.lineTo(width - inset, height - inset - corner); ctx.stroke()
    ctx.restore()
  }

  if (hasLayer('light-trails')) {
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.lineCap = 'round'
    for (let track = 0; track < 4; track += 1) {
      ctx.beginPath()
      for (let i = 0; i <= 42; i += 1) {
        const x = width * i / 42
        const y = height * (.82 + track * .018) + Math.sin(i * .24 + time * .002 + track) * minSide * (.006 + track * .003)
        if (!i) ctx.moveTo(x, y); else ctx.lineTo(x, y)
      }
      ctx.strokeStyle = track % 2 ? glow : accent; ctx.globalAlpha = .34 + track * .1; ctx.lineWidth = minSide * (.002 + track * .001); ctx.shadowColor = track % 2 ? glow : accent; ctx.shadowBlur = minSide * .01; ctx.stroke()
    }
    ctx.restore()
  }

  if (hasLayer('title') && options.title.trim()) {
    const fontSize = Math.max(24, minSide * (options.titleSize / 100))
    ctx.save()
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `800 ${fontSize}px Inter, Arial, sans-serif`
    ctx.lineJoin = 'round'
    ctx.lineWidth = Math.max(2, fontSize * .08)
    ctx.strokeStyle = 'rgba(4, 10, 20, .72)'
    ctx.strokeText(options.title.toUpperCase(), centerX, centerY)
    ctx.shadowColor = glow
    ctx.shadowBlur = fontSize * .34 * (1 + reaction)
    ctx.fillStyle = '#ffffff'
    ctx.fillText(options.title.toUpperCase(), centerX, centerY)
    ctx.restore()
  }
}

export default function MusicVisualizer({ onExit }) {
  const canvasRef = useRef(null)
  const videoRef = useRef(null)
  const audioRef = useRef(null)
  const frameRef = useRef(0)
  const audioGraphRef = useRef(null)
  const recorderRef = useRef(null)
  const exportTimerRef = useRef(0)
  const exportCancelledRef = useRef(false)
  const [videoFile, setVideoFile] = useState(null)
  const [audioFile, setAudioFile] = useState(null)
  const [videoUrl, setVideoUrl] = useState('')
  const [audioUrl, setAudioUrl] = useState('')
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [aspect, setAspect] = useState('square')
  const [durationMode, setDurationMode] = useState('full')
  const [fit, setFit] = useState('cover')
  const [title, setTitle] = useState('YOUR TITLE')
  const [titleSize, setTitleSize] = useState(7)
  const [color, setColor] = useState('#ff4ca8')
  const [glowColor, setGlowColor] = useState('#55d8ff')
  const [intensity, setIntensity] = useState(70)
  const [tint, setTint] = useState(18)
  const [centerX, setCenterX] = useState(50)
  const [centerY, setCenterY] = useState(50)
  const [theme, setTheme] = useState('pulse')
  const [themeLayerSelections, setThemeLayerSelections] = useState(defaultThemeLayers)
  const [exporting, setExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const layers = themeLayerSelections[theme]
  const layerGroups = themeLibraries[theme]

  const mp4Type = useMemo(() => typeof MediaRecorder !== 'undefined'
    ? MP4_TYPES.find(type => MediaRecorder.isTypeSupported(type)) || ''
    : '', [])
  const selectedDuration = useMemo(() => {
    const audioDuration = audioRef.current?.duration || 0
    if (durationMode === 'full') return Math.min(audioDuration, 300)
    return audioDuration ? Math.min(Number(durationMode), audioDuration) : Number(durationMode)
  }, [durationMode, audioFile])

  const options = useMemo(() => ({
    fit, title, titleSize, color, glowColor, intensity, tint, centerX, centerY, layers, theme,
  }), [fit, title, titleSize, color, glowColor, intensity, tint, centerX, centerY, layers, theme])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const size = canvasSize(aspect)
    canvas.width = size.width
    canvas.height = size.height
  }, [aspect])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx) return undefined
    const draw = time => {
      const graph = audioGraphRef.current
      let frequencyData
      if (graph?.analyser) {
        frequencyData = graph.data
        graph.analyser.getByteFrequencyData(frequencyData)
      }
      drawComposition(ctx, videoRef.current, options, frequencyData, time)
      frameRef.current = requestAnimationFrame(draw)
    }
    frameRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frameRef.current)
  }, [options, aspect, videoUrl])

  useEffect(() => () => { if (videoUrl) URL.revokeObjectURL(videoUrl) }, [videoUrl])
  useEffect(() => () => { if (audioUrl) URL.revokeObjectURL(audioUrl) }, [audioUrl])
  useEffect(() => () => { if (result?.url) URL.revokeObjectURL(result.url) }, [result])
  useEffect(() => () => { audioGraphRef.current?.context?.close().catch(() => {}) }, [])

  const loadVideo = file => {
    if (!file?.type.startsWith('video/')) { setError('Choose a video file such as MP4, WebM or MOV.'); return }
    if (videoUrl) URL.revokeObjectURL(videoUrl)
    setVideoFile(file)
    setVideoUrl(URL.createObjectURL(file))
    setResult(null)
    setError('')
  }

  const loadAudio = file => {
    if (!file?.type.startsWith('audio/')) { setError('Choose an audio file such as MP3, WAV, M4A or OGG.'); return }
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioFile(file)
    setAudioUrl(URL.createObjectURL(file))
    setResult(null)
    setError('')
  }

  const ensureAudioGraph = async () => {
    if (audioGraphRef.current) {
      await audioGraphRef.current.context.resume()
      return audioGraphRef.current
    }
    const audio = audioRef.current
    const context = new AudioContext()
    const source = context.createMediaElementSource(audio)
    const analyser = context.createAnalyser()
    const recordingDestination = context.createMediaStreamDestination()
    analyser.fftSize = 256
    analyser.smoothingTimeConstant = .78
    source.connect(analyser)
    analyser.connect(context.destination)
    analyser.connect(recordingDestination)
    const graph = { context, source, analyser, recordingDestination, data: new Uint8Array(analyser.frequencyBinCount) }
    audioGraphRef.current = graph
    await context.resume()
    return graph
  }

  const togglePlay = async () => {
    setError('')
    if (!videoFile && !audioFile) { setError('Add a loop video and a song to start previewing.'); return }
    if (playing) {
      videoRef.current?.pause()
      audioRef.current?.pause()
      setPlaying(false)
      return
    }
    if (audioFile) await ensureAudioGraph()
    if (videoRef.current && videoFile) {
      videoRef.current.loop = true
      await videoRef.current.play().catch(() => {})
    }
    if (audioRef.current && audioFile) await audioRef.current.play()
    setPlaying(true)
  }

  const restart = async () => {
    if (videoRef.current) videoRef.current.currentTime = 0
    if (audioRef.current) audioRef.current.currentTime = 0
    setProgress(0)
  }

  const seekTo = seconds => {
    const audio = audioRef.current
    if (!audio || !Number.isFinite(audio.duration) || !audio.duration) return
    const nextTime = Math.max(0, Math.min(audio.duration, seconds))
    audio.currentTime = nextTime
    if (videoRef.current && Number.isFinite(videoRef.current.duration) && videoRef.current.duration > 0) {
      videoRef.current.currentTime = nextTime % videoRef.current.duration
    }
    setProgress((nextTime / audio.duration) * 100)
  }

  const seekBy = amount => seekTo((audioRef.current?.currentTime || 0) + amount)

  const seekFromTimeline = event => {
    const rect = event.currentTarget.getBoundingClientRect()
    seekTo(((event.clientX - rect.left) / rect.width) * (audioRef.current?.duration || 0))
  }

  const handleTimelineKey = event => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); seekBy(-5) }
    if (event.key === 'ArrowRight') { event.preventDefault(); seekBy(5) }
    if (event.key === 'Home') { event.preventDefault(); seekTo(0) }
    if (event.key === 'End') { event.preventDefault(); seekTo(audioRef.current?.duration || 0) }
  }

  const stopExport = () => {
    exportCancelledRef.current = true
    cancelAnimationFrame(exportTimerRef.current)
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
  }

  const exportMp4 = async () => {
    setError('')
    if (!videoFile || !audioFile) { setError('Add both a loop video and a song before exporting.'); return }
    if (!mp4Type) { setError('This browser cannot create a genuine MP4. Open this utility in the latest Chrome or Edge on desktop.'); return }
    const duration = durationMode === 'full'
      ? Math.min(audioRef.current.duration || 0, 300)
      : Math.min(Number(durationMode), audioRef.current.duration || Number(durationMode))
    if (!duration) { setError('The song is still loading. Wait a moment, then try again.'); return }
    const graph = await ensureAudioGraph()
    const canvasStream = canvasRef.current.captureStream(30)
    graph.recordingDestination.stream.getAudioTracks().forEach(track => canvasStream.addTrack(track))
    const recorder = new MediaRecorder(canvasStream, {
      mimeType: mp4Type,
      videoBitsPerSecond: aspect === 'square' ? 6_000_000 : 8_000_000,
      audioBitsPerSecond: 192_000,
    })
    const chunks = []
    recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data) }
    recorder.onerror = event => { setError(event.error?.message || 'MP4 export failed.'); setExporting(false) }
    recorder.onstop = () => {
      if (exportCancelledRef.current) {
        setExporting(false)
        setExportProgress(0)
        setPlaying(false)
        videoRef.current?.pause()
        audioRef.current?.pause()
        canvasStream.getTracks().forEach(track => track.stop())
        return
      }
      const blob = new Blob(chunks, { type: recorder.mimeType || 'video/mp4' })
      if (result?.url) URL.revokeObjectURL(result.url)
      setResult({ blob, url: URL.createObjectURL(blob), duration })
      setExporting(false)
      setExportProgress(100)
      setPlaying(false)
      videoRef.current?.pause()
      audioRef.current?.pause()
      canvasStream.getTracks().forEach(track => track.stop())
    }
    recorderRef.current = recorder
    exportCancelledRef.current = false
    videoRef.current.currentTime = 0
    audioRef.current.currentTime = 0
    videoRef.current.loop = true
    audioRef.current.loop = false
    setResult(null)
    setExporting(true)
    setExportProgress(0)
    recorder.start(1000)
    await videoRef.current.play()
    await audioRef.current.play()
    setPlaying(true)
    const monitor = () => {
      const elapsed = audioRef.current?.currentTime || 0
      setExportProgress(Math.min(100, (elapsed / duration) * 100))
      if (elapsed >= duration || audioRef.current?.ended) { recorder.stop(); return }
      exportTimerRef.current = requestAnimationFrame(monitor)
    }
    exportTimerRef.current = requestAnimationFrame(monitor)
  }

  const downloadResult = () => {
    if (!result) return
    const link = document.createElement('a')
    link.href = result.url
    link.download = `${title.trim().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'flowly-visualizer'}.mp4`
    link.click()
  }

  const toggleLayer = key => setThemeLayerSelections(current => ({
    ...current,
    [theme]: current[theme].includes(key) ? current[theme].filter(item => item !== key) : [...current[theme], key],
  }))

  const changeTheme = value => {
    setTheme(value)
    setColor(themePresets[value].color)
    setGlowColor(themePresets[value].glow)
    setTint(themePresets[value].tint)
  }

  return <main className="music-visualizer-app" data-theme={theme} style={{ '--theme-a': color, '--theme-b': glowColor, '--ic-ink': '#143f38', '--ic-muted': '#667a73' }}>
    <header className="music-visualizer-header">
      <button type="button" onClick={onExit}><ArrowLeft size={18}/> Utilities</button>
      <a href="#music-studio" aria-label="Music visualizer editor"><span><AudioLines size={20}/></span> Music Visualizer</a>
      <p><span className={mp4Type ? 'ready' : 'limited'}/>{mp4Type ? 'MP4 ready' : 'MP4 unavailable'}</p>
    </header>

    <section className="music-visualizer-intro">
      <div><span>FLOWLY UTILITY</span><h1>Loop video. Add music. Make it move.</h1></div>
      <p>Turn a short animation and a song into a beat-reactive video. Your media stays on this device while you preview and export.</p>
    </section>

    <section className="music-visualizer-workspace" id="music-studio">
      <aside className="music-visualizer-controls">
        <div className="music-panel-heading"><span><Layers3 size={18}/></span><div><small>COMPOSITION</small><h2>Build your visual</h2></div></div>
        <div className="music-upload-grid">
          <label className={videoFile ? 'loaded' : ''}><input type="file" accept="video/*" onChange={event => loadVideo(event.target.files?.[0])}/><Film size={20}/><span><strong>{videoFile ? videoFile.name : 'Loop video'}</strong><small>{videoFile ? formatBytes(videoFile.size) : 'MP4, WebM or MOV'}</small></span><Upload size={16}/></label>
          <label className={audioFile ? 'loaded' : ''}><input type="file" accept="audio/*" onChange={event => loadAudio(event.target.files?.[0])}/><FileMusic size={20}/><span><strong>{audioFile ? audioFile.name : 'Add song'}</strong><small>{audioFile ? formatBytes(audioFile.size) : 'MP3, WAV, M4A or OGG'}</small></span><Upload size={16}/></label>
        </div>

        <div className="music-control-section">
          <FlowSelect label="Visualizer theme" value={theme} options={themeOptions} onChange={changeTheme}/>
          <div className="music-section-title"><span>Beat layer library</span><small>{layers.length} selected</small></div>
          <p className="music-layer-help">Mix different spectra, shapes and motion effects. Every selected layer reacts to the song.</p>
          <div className="music-layer-library">
            {layerGroups.map(group => <section key={group.name}><header><span>{group.name}</span><small>{group.items.filter(item => layers.includes(item.id)).length}/{group.items.length}</small></header><div>{group.items.map(item => <button type="button" key={item.id} className={layers.includes(item.id) ? 'active' : ''} aria-pressed={layers.includes(item.id)} onClick={() => toggleLayer(item.id)}><i className={`music-layer-preview ${item.preview}`}/><span><strong>{item.label}</strong><small>{layers.includes(item.id) ? 'Added to canvas' : 'Click to add'}</small></span><b style={layers.includes(item.id) ? undefined : { background: 'transparent' }}>{layers.includes(item.id) && <Check size={11}/>}</b></button>)}</div></section>)}
          </div>
          <label className="music-text-field">Title text<input value={title} maxLength={32} onChange={event => setTitle(event.target.value)} placeholder="Your title"/></label>
          <label className="music-range-field"><span>Title size <output>{titleSize}%</output></span><input type="range" min="4" max="13" value={titleSize} onChange={event => setTitleSize(Number(event.target.value))}/></label>
          <label className="music-range-field"><span>Beat movement <output>{intensity}%</output></span><input type="range" min="20" max="120" value={intensity} onChange={event => setIntensity(Number(event.target.value))}/></label>
          <label className="music-range-field"><span>Video tint <output>{tint}%</output></span><input type="range" min="0" max="55" value={tint} onChange={event => setTint(Number(event.target.value))}/></label>
          <div className="music-colors"><label>Primary colour<span><input type="color" value={color} onChange={event => setColor(event.target.value)}/>{color}</span></label><label>Glow colour<span><input type="color" value={glowColor} onChange={event => setGlowColor(event.target.value)}/>{glowColor}</span></label></div>
        </div>

        <details className="music-positioning">
          <summary>Position and output</summary>
          <label className="music-range-field"><span>Horizontal <output>{centerX}%</output></span><input type="range" min="18" max="82" value={centerX} onChange={event => setCenterX(Number(event.target.value))}/></label>
          <label className="music-range-field"><span>Vertical <output>{centerY}%</output></span><input type="range" min="18" max="82" value={centerY} onChange={event => setCenterY(Number(event.target.value))}/></label>
          <FlowSelect label="Canvas size" value={aspect} options={aspectOptions} onChange={setAspect}/>
          <FlowSelect label="Export length" value={durationMode} options={durationOptions} onChange={setDurationMode}/>
          <div className="music-fit"><span>Video fit</span><div><button type="button" className={fit === 'cover' ? 'active' : ''} onClick={() => setFit('cover')}>Fill canvas</button><button type="button" className={fit === 'contain' ? 'active' : ''} onClick={() => setFit('contain')}>Show all</button></div></div>
        </details>
      </aside>

      <section className="music-visualizer-preview">
        <div className="music-preview-toolbar"><div><small>LIVE PREVIEW</small><strong>{videoFile || audioFile ? 'Your composition' : 'Add media to begin'}</strong></div><div><button type="button" onClick={() => seekBy(-5)} aria-label="Go back 5 seconds"><Rewind size={17}/></button><button type="button" onClick={() => seekBy(5)} aria-label="Go forward 5 seconds"><FastForward size={17}/></button><button type="button" onClick={restart} aria-label="Restart preview"><RotateCcw size={17}/></button><button type="button" className="play" onClick={togglePlay}>{playing ? <Pause size={17}/> : <Play size={17}/>} {playing ? 'Pause' : 'Preview'}</button></div></div>
        <div className={`music-canvas-shell ${aspect}`}><canvas ref={canvasRef}/>{!videoFile && !audioFile && <div className="music-canvas-empty"><span><Sparkles size={25}/></span><strong>Your beat visualizer appears here</strong><p>Add a short loop video and a song. Then choose which objects move with the beat.</p></div>}</div>
        <div className="music-timeline"><span>{formatTime(audioRef.current?.currentTime || 0)}</span><div role="slider" tabIndex="0" aria-label="Song position" aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.round(progress)} onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); seekFromTimeline(event) }} onPointerMove={event => { if (event.currentTarget.hasPointerCapture(event.pointerId)) seekFromTimeline(event) }} onKeyDown={handleTimelineKey}><i style={{ width: `${progress}%` }}/><b style={{ left: `${progress}%` }}/></div><span>{formatTime(audioRef.current?.duration || selectedDuration)}</span></div>
        <div className="music-preview-note"><AudioLines size={17}/><span><strong>Beat-reactive preview</strong><small>Click or drag the timeline to jump through the song. Use the 5-second buttons for precise skipping.</small></span></div>
        {error && <div className="music-error" role="alert"><CircleAlert size={17}/><span>{error}</span><button type="button" onClick={() => setError('')} aria-label="Dismiss"><X size={15}/></button></div>}
        {exporting && <div className="music-exporting"><div><span>Recording MP4 in real time</span><strong>{Math.round(exportProgress)}%</strong></div><div><i style={{ width: `${exportProgress}%` }}/></div><small>Keep this tab open. A {formatTime(selectedDuration)} export takes about the same amount of time.</small><button type="button" onClick={stopExport}>Cancel export</button></div>}
        {result && <div className="music-result"><span><Check size={18}/></span><div><strong>MP4 is ready</strong><small>{formatTime(result.duration)} · {formatBytes(result.blob.size)}</small></div><button type="button" onClick={downloadResult}><Download size={16}/> Download MP4</button></div>}
        <div className="music-export-bar"><div><span className={mp4Type ? 'supported' : 'unsupported'}>{mp4Type ? <Check size={15}/> : <CircleAlert size={15}/>}</span><span><strong>{mp4Type ? 'Genuine MP4 export supported' : 'MP4 export is not supported here'}</strong><small>{mp4Type ? 'Video, music and beat layers are recorded together.' : 'Use the latest Chrome or Edge desktop browser.'}</small></span></div><button type="button" disabled={exporting || !mp4Type} onClick={exportMp4}><Download size={17}/> {exporting ? 'Exporting…' : 'Export MP4'}</button></div>
      </section>
    </section>

    <video ref={videoRef} src={videoUrl || undefined} muted playsInline loop className="music-hidden-media"/>
    <audio ref={audioRef} src={audioUrl || undefined} className="music-hidden-media" onTimeUpdate={event => setProgress(event.currentTarget.duration ? (event.currentTarget.currentTime / event.currentTarget.duration) * 100 : 0)} onEnded={() => setPlaying(false)}/>
  </main>
}
