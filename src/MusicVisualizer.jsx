import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft, AudioLines, Captions, Check, CircleAlert, Download, FileMusic, Film,
  FastForward, Layers3, LockKeyhole, Pause, Play, Plus, Rewind, RotateCcw, Search, Sparkles, Upload, X,
} from 'lucide-react'
import FlowSelect from './FlowSelect.jsx'
import './music-visualizer.css'
import './music-visualizer-themes.css'
import './music-visualizer-lyrics.css'
import './music-visualizer-layer-browser.css'

const MP4_TYPES = [
  'video/mp4;codecs="avc1.640033,mp4a.40.2"',
  'video/mp4;codecs="avc1.4D4033,mp4a.40.2"',
  'video/mp4;codecs="avc1.42E01E,mp4a.40.2"',
  'video/mp4;codecs="avc1,mp4a.40.2"',
  'video/mp4',
]

const MP4_4K_90_TYPES = [
  'video/mp4;codecs="avc1.640034,mp4a.40.2"',
  'video/mp4;codecs="avc1,mp4a.40.2"',
  ...MP4_TYPES,
]

const aspectOptions = [
  { value: 'square', label: 'Square · 1:1', description: 'Up to 2160 × 2160' },
  { value: 'landscape', label: 'Landscape · 16:9', description: 'Up to 4K UHD' },
  { value: 'portrait', label: 'Portrait · 9:16', description: 'Up to 2160 × 3840' },
]

const exportQualityOptions = [
  { value: 'high', label: 'High · 1080p', description: 'Recommended quality and file size' },
  { value: 'maximum', label: 'Maximum · 4K', description: 'Best detail · powerful device recommended' },
  { value: 'standard', label: 'Standard · 720p', description: 'Smaller and faster' },
]

const exportFrameRateOptions = [
  { value: '60', label: 'Smooth · 60 FPS', description: 'Recommended for fluid beat animation' },
  { value: '90', label: 'Ultra smooth · 90 FPS', description: 'High-end CPU and GPU recommended' },
  { value: '30', label: 'Standard · 30 FPS', description: 'Faster export on slower devices' },
]

const durationOptions = [
  { value: 'full', label: 'Full song', description: 'Up to 5 minutes' },
  { value: '15', label: '15 seconds', description: 'Short social clip' },
  { value: '30', label: '30 seconds', description: 'Reel or story' },
  { value: '60', label: '60 seconds', description: 'Extended visualizer' },
]

const lyricColourPresets = [
  '#ffffff', '#fff0c2', '#dfff66', '#72f4d1', '#79d8ff', '#b8a7ff', '#ff9ed8', '#ffb36b',
]

const defaultLyricFont = { label: 'Inter', family: 'Inter, Arial, sans-serif', custom: false }

async function loadVisualizerFontFile(file) {
  const extension = file?.name?.split('.').pop()?.toLowerCase()
  if (!['ttf', 'otf', 'woff', 'woff2'].includes(extension)) throw new Error('Choose a TTF, OTF, WOFF, or WOFF2 font file.')
  if (file.size > 10 * 1024 * 1024) throw new Error('Choose a font smaller than 10 MB.')
  const label = file.name.replace(/\.[^.]+$/, '').trim() || 'Custom font'
  const family = `FlowlyLyrics-${label.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '')}-${Date.now().toString(36)}`
  const face = new FontFace(family, await file.arrayBuffer())
  await face.load()
  document.fonts.add(face)
  return { face, font: { label, family: `"${family}", sans-serif`, custom: true } }
}

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
  { value: 'crystal', label: 'Crystal 3D', description: 'Faceted glass, refraction and depth' },
  { value: 'chrome', label: 'Kinetic Chrome 3D', description: 'Realistic metal, turbines and studio depth' },
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
  crystal: { color: '#8fdcff', glow: '#e7c6ff', tint: 22 },
  chrome: { color: '#9fd8ff', glow: '#f3f7ff', tint: 30 },
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
      { id: 'prism-orb', label: 'Prism orb', preview: 'prism-orb' },
    ] },
    { name: 'Foam', items: [
      { id: 'foam-ring', label: 'Foam ring', preview: 'foam' },
      { id: 'bubble-glow', label: 'Bubble glow', preview: 'bubble-glow' },
      { id: 'bubble-wave', label: 'Bubble wave', preview: 'bubble-wave' },
      { id: 'caustic-shimmer', label: 'Caustic shimmer', preview: 'caustic-shimmer' },
      { id: 'pearl-chain', label: 'Pearl chain', preview: 'pearl-chain' },
    ] },
    { name: 'Text', items: [{ id: 'title', label: 'Bubble title', preview: 'title' }] },
  ],
  inferno: [
    { name: 'Fire', items: [
      { id: 'ember-field', label: 'Ember field', preview: 'embers' },
      { id: 'flame-ring', label: 'Flame ring', preview: 'flame' },
      { id: 'fire-bars', label: 'Fire spectrum', preview: 'fire-bars' },
      { id: 'heat-wave', label: 'Heat wave', preview: 'heat' },
      { id: 'molten-core', label: 'Molten core', preview: 'molten-core' },
    ] },
    { name: 'Atmosphere', items: [
      { id: 'spark-burst', label: 'Spark burst', preview: 'spark-burst' },
      { id: 'flare-glow', label: 'Fire glow', preview: 'fire-glow' },
      { id: 'ember-vortex', label: 'Ember vortex', preview: 'ember-vortex' },
      { id: 'flame-crown', label: 'Flame crown', preview: 'flame-crown' },
    ] },
    { name: 'Text', items: [{ id: 'title', label: 'Inferno title', preview: 'title' }] },
  ],
  ocean: [
    { name: 'Water', items: [
      { id: 'caustic-light', label: 'Caustic light', preview: 'caustic' },
      { id: 'sonar-rings', label: 'Sonar rings', preview: 'sonar' },
      { id: 'current-wave', label: 'Ocean current', preview: 'current' },
      { id: 'tide-bars', label: 'Tide spectrum', preview: 'tide-bars' },
      { id: 'deep-portal', label: 'Deep portal', preview: 'deep-portal' },
    ] },
    { name: 'Depth', items: [
      { id: 'plankton', label: 'Plankton drift', preview: 'plankton' },
      { id: 'bubble-trail', label: 'Bubble trail', preview: 'bubble-trail' },
      { id: 'deep-glow', label: 'Deep glow', preview: 'deep-glow' },
      { id: 'light-shafts', label: 'Light shafts', preview: 'light-shafts' },
      { id: 'kelp-ribbons', label: 'Kelp ribbons', preview: 'kelp-ribbons' },
    ] },
    { name: 'Text', items: [{ id: 'title', label: 'Ocean title', preview: 'title' }] },
  ],
  minimal: [
    { name: 'Geometry', items: [
      { id: 'mono-bars', label: 'Mono bars', preview: 'mono-bars' },
      { id: 'fine-ring', label: 'Fine ring', preview: 'fine-ring' },
      { id: 'clean-wave', label: 'Clean wave', preview: 'clean-wave' },
      { id: 'dot-grid', label: 'Dot grid', preview: 'dot-grid' },
      { id: 'precision-axis', label: 'Precision axis', preview: 'precision-axis' },
    ] },
    { name: 'Frame', items: [
      { id: 'corner-marks', label: 'Corner marks', preview: 'corner-marks' },
      { id: 'soft-vignette', label: 'Soft vignette', preview: 'soft-vignette' },
      { id: 'editorial-frame', label: 'Editorial frame', preview: 'editorial-frame' },
      { id: 'type-rule', label: 'Type rule', preview: 'type-rule' },
    ] },
    { name: 'Text', items: [{ id: 'title', label: 'Minimal title', preview: 'title' }] },
  ],
  retro: [
    { name: 'Synthwave', items: [
      { id: 'retro-sun', label: 'Retro sun', preview: 'retro-sun' },
      { id: 'retro-grid', label: 'Horizon grid', preview: 'retro-grid' },
      { id: 'vhs-lines', label: 'VHS lines', preview: 'vhs-lines' },
      { id: 'block-equalizer', label: 'Block equalizer', preview: 'block-eq' },
      { id: 'horizon-mountains', label: 'Horizon mountains', preview: 'mountains' },
    ] },
    { name: 'Night sky', items: [
      { id: 'retro-stars', label: 'Pixel stars', preview: 'retro-stars' },
      { id: 'tape-glow', label: 'Tape glow', preview: 'tape-glow' },
      { id: 'tape-noise', label: 'Analog noise', preview: 'tape-noise' },
      { id: 'laser-moon', label: 'Laser moon', preview: 'laser-moon' },
    ] },
    { name: 'Text', items: [{ id: 'title', label: 'Retro title', preview: 'title' }] },
  ],
  gold: [
    { name: 'Luxe', items: [
      { id: 'gold-halo', label: 'Gold halo', preview: 'gold-halo' },
      { id: 'deco-rays', label: 'Art-deco rays', preview: 'deco-rays' },
      { id: 'champagne', label: 'Champagne drift', preview: 'champagne' },
      { id: 'orbit-arcs', label: 'Orbit arcs', preview: 'orbit-arcs' },
      { id: 'deco-arch', label: 'Deco arch', preview: 'deco-arch' },
    ] },
    { name: 'Finish', items: [
      { id: 'gold-shimmer', label: 'Gold shimmer', preview: 'gold-shimmer' },
      { id: 'velvet-vignette', label: 'Velvet vignette', preview: 'velvet' },
      { id: 'luxe-spotlight', label: 'Luxe spotlight', preview: 'luxe-spotlight' },
      { id: 'pearl-dust', label: 'Pearl dust', preview: 'pearl-dust' },
    ] },
    { name: 'Text', items: [{ id: 'title', label: 'Luxe title', preview: 'title' }] },
  ],
  crystal: [
    { name: 'Crystal form', items: [
      { id: 'crystal-core', label: '3D crystal core', preview: 'crystal-core' },
      { id: 'crystal-halo', label: 'Depth halo', preview: 'crystal-halo' },
      { id: 'floating-shards', label: 'Floating shards', preview: 'crystal-shards' },
      { id: 'prism-spectrum', label: 'Prism spectrum', preview: 'prism-spectrum' },
      { id: 'depth-grid', label: 'Crystal grid', preview: 'crystal-grid' },
    ] },
    { name: 'Refraction', items: [
      { id: 'crystal-glow', label: 'Crystal aura', preview: 'crystal-glow' },
      { id: 'facet-rays', label: 'Facet rays', preview: 'facet-rays' },
      { id: 'light-sweep', label: 'Glass sweep', preview: 'light-sweep' },
      { id: 'crystal-dust', label: 'Crystal dust', preview: 'crystal-dust' },
    ] },
    { name: 'Text', items: [{ id: 'title', label: 'Crystal title', preview: 'title' }] },
  ],
  chrome: [
    { name: 'Kinetic form', items: [
      { id: 'chrome-orb', label: 'Chrome orb', preview: 'chrome-orb' },
      { id: 'turbine-blades', label: 'Turbine blades', preview: 'turbine-blades' },
      { id: 'gyro-rings', label: 'Gyro rings', preview: 'gyro-rings' },
      { id: 'metal-spectrum', label: 'Metal spectrum', preview: 'metal-spectrum' },
      { id: 'depth-floor', label: 'Perspective floor', preview: 'metal-floor' },
    ] },
    { name: 'Studio finish', items: [
      { id: 'studio-lights', label: 'Studio lights', preview: 'studio-lights' },
      { id: 'chrome-sweep', label: 'Chrome sweep', preview: 'chrome-sweep' },
      { id: 'metal-sparks', label: 'Metal sparks', preview: 'metal-sparks' },
      { id: 'floor-reflection', label: 'Floor reflection', preview: 'floor-reflection' },
    ] },
    { name: 'Text', items: [{ id: 'title', label: 'Chrome title', preview: 'title' }] },
  ],
}

const defaultThemeLayers = {
  pulse: ['bass-glow', 'core-disc', 'radial-bars', 'pulse-rings', 'particles', 'energy-wave', 'title'],
  universe: ['star-field', 'galaxy-spiral', 'planet-orbits', 'event-horizon', 'aurora-band', 'title'],
  neon: ['neon-grid', 'city-silhouette', 'chrome-ring', 'neon-frame', 'light-trails', 'title'],
  slime: ['ooze-glow', 'liquid-lens', 'slime-ring', 'cellular-flow', 'surface-ripples', 'title'],
  bubbles: ['bubble-glow', 'prism-orb', 'bubble-field', 'bubble-orbit', 'caustic-shimmer', 'pearl-chain', 'title'],
  inferno: ['flare-glow', 'molten-core', 'flame-ring', 'ember-field', 'ember-vortex', 'flame-crown', 'title'],
  ocean: ['deep-glow', 'deep-portal', 'caustic-light', 'sonar-rings', 'plankton', 'light-shafts', 'title'],
  minimal: ['soft-vignette', 'fine-ring', 'clean-wave', 'precision-axis', 'editorial-frame', 'type-rule', 'title'],
  retro: ['tape-glow', 'retro-sun', 'horizon-mountains', 'retro-grid', 'laser-moon', 'title'],
  gold: ['velvet-vignette', 'luxe-spotlight', 'gold-halo', 'deco-rays', 'champagne', 'deco-arch', 'pearl-dust', 'title'],
  crystal: ['crystal-glow', 'crystal-core', 'crystal-halo', 'facet-rays', 'floating-shards', 'light-sweep', 'crystal-dust', 'title'],
  chrome: ['studio-lights', 'depth-floor', 'floor-reflection', 'turbine-blades', 'gyro-rings', 'chrome-orb', 'chrome-sweep', 'metal-sparks', 'title'],
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

const formatLyricTime = value => {
  const seconds = Math.max(0, Number(value) || 0)
  const minutes = Math.floor(seconds / 60)
  return `${String(minutes).padStart(2, '0')}:${(seconds - minutes * 60).toFixed(2).padStart(5, '0')}`
}

const parseLyrics = value => value
  .split(/\r?\n/)
  .map((line, index) => {
    const match = line.match(/^\s*\[(\d{1,3}):(\d{2}(?:\.\d{1,3})?)\]\s*(.*?)\s*$/)
    if (match) {
      const text = match[3].trim()
      if (!text) {
        return {
          id: index,
          time: null,
          text: '',
          pause: true,
          duration: Number(match[1]) + Number(match[2]) / 100,
        }
      }
      const pause = !text || /^\[(?:pause|instrumental|music)\]$/i.test(text)
      return { id: index, time: Number(match[1]) * 60 + Number(match[2]), text: pause ? '' : text, pause, duration: 0 }
    }
    const text = line.trim()
    if (!text || /^\[[a-z]+:/i.test(text)) return null
    return { id: index, time: null, text, pause: false, duration: 0 }
  })
  .filter(Boolean)

const wrapCanvasText = (ctx, value, maxWidth) => {
  const words = value.split(/\s+/)
  const lines = []
  let line = ''
  words.forEach(word => {
    const candidate = line ? `${line} ${word}` : word
    if (line && ctx.measureText(candidate).width > maxWidth) {
      lines.push(line)
      line = word
    } else line = candidate
  })
  if (line) lines.push(line)
  return lines.slice(0, 3)
}

const canvasSize = aspect => aspect === 'portrait'
  ? { width: 720, height: 1280 }
  : aspect === 'landscape'
    ? { width: 1280, height: 720 }
    : { width: 900, height: 900 }

const exportCanvasSize = (aspect, quality) => {
  const dimensions = {
    standard: {
      portrait: { width: 720, height: 1280 },
      landscape: { width: 1280, height: 720 },
      square: { width: 720, height: 720 },
    },
    high: {
      portrait: { width: 1080, height: 1920 },
      landscape: { width: 1920, height: 1080 },
      square: { width: 1080, height: 1080 },
    },
    maximum: {
      portrait: { width: 2160, height: 3840 },
      landscape: { width: 3840, height: 2160 },
      square: { width: 2160, height: 2160 },
    },
  }
  return dimensions[quality]?.[aspect] || dimensions.high[aspect]
}

const exportVideoBitrate = (quality, aspect, fps = 30) => {
  let bitrate
  if (quality === 'maximum') bitrate = aspect === 'square' ? 32_000_000 : 48_000_000
  else if (quality === 'standard') bitrate = aspect === 'square' ? 6_000_000 : 8_000_000
  else bitrate = aspect === 'square' ? 12_000_000 : 16_000_000
  const frameRate = Number(fps)
  const frameRateMultiplier = frameRate >= 90 ? 1.5 : frameRate >= 60 ? 1.25 : 1
  return Math.round(bitrate * frameRateMultiplier)
}

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
  if (options.theme === 'crystal') {
    const crystalAtmosphere = ctx.createRadialGradient(width * .5, height * .42, 0, width * .5, height * .46, Math.max(width, height) * .76)
    crystalAtmosphere.addColorStop(0, 'rgba(142, 224, 255, .13)')
    crystalAtmosphere.addColorStop(.32, 'rgba(92, 96, 190, .12)')
    crystalAtmosphere.addColorStop(.7, 'rgba(30, 29, 76, .28)')
    crystalAtmosphere.addColorStop(1, 'rgba(4, 7, 22, .64)')
    ctx.fillStyle = crystalAtmosphere
    ctx.fillRect(0, 0, width, height)
    const crystalLight = ctx.createLinearGradient(0, 0, width, height)
    crystalLight.addColorStop(0, 'rgba(255,255,255,.12)')
    crystalLight.addColorStop(.24, 'rgba(126,225,255,.025)')
    crystalLight.addColorStop(.62, 'rgba(225,188,255,.04)')
    crystalLight.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = crystalLight
    ctx.fillRect(0, 0, width, height)
  }
  if (options.theme === 'chrome') {
    const studio = ctx.createRadialGradient(width * .5, height * .39, 0, width * .5, height * .44, Math.max(width, height) * .82)
    studio.addColorStop(0, 'rgba(178, 215, 238, .14)')
    studio.addColorStop(.28, 'rgba(54, 72, 94, .17)')
    studio.addColorStop(.62, 'rgba(13, 20, 33, .38)')
    studio.addColorStop(1, 'rgba(1, 3, 8, .78)')
    ctx.fillStyle = studio
    ctx.fillRect(0, 0, width, height)
    const steelFalloff = ctx.createLinearGradient(0, 0, 0, height)
    steelFalloff.addColorStop(0, 'rgba(255,255,255,.07)')
    steelFalloff.addColorStop(.45, 'rgba(255,255,255,0)')
    steelFalloff.addColorStop(1, 'rgba(0,0,0,.32)')
    ctx.fillStyle = steelFalloff
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
  const smoothFrequencyBin = (index, kernel = 2, wrap = false) => {
    let weighted = 0
    let weightTotal = 0
    for (let offset = -kernel; offset <= kernel; offset += 1) {
      const weight = kernel + 1 - Math.abs(offset)
      let sampleIndex = Math.round(index) + offset
      if (wrap) sampleIndex = (sampleIndex % sampleCount + sampleCount) % sampleCount
      else sampleIndex = Math.max(0, Math.min(sampleCount - 1, sampleIndex))
      weighted += values[sampleIndex] * weight
      weightTotal += weight
    }
    return weighted / weightTotal / 255
  }
  const spectrumValue = (index, count, kernel = 2, wrap = false) => {
    const denominator = wrap ? count : Math.max(1, count - 1)
    return smoothFrequencyBin(index / denominator * (sampleCount - 1), kernel, wrap)
  }

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
      const value = spectrumValue(i, 18, 2, true)
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
    ctx.shadowBlur = minSide * .012
    const barCount = 72
    for (let i = 0; i < barCount; i += 1) {
      const angle = (Math.PI * 2 * i) / barCount - Math.PI / 2
      const value = spectrumValue(i, barCount, 3, true)
      const bar = minSide * (.025 + Math.pow(value, .78) * .058 * (options.intensity / 70))
      const inner = radius * 1.15
      ctx.strokeStyle = i % 9 === 0 ? glow : accent
      ctx.globalAlpha = .58 + value * .35
      ctx.lineWidth = Math.max(2, minSide * .0042)
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
      const value = spectrumValue(i, 42, 3, true)
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
      const value = spectrumValue(i, count, 3)
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
      const value = spectrumValue(i, count, 3)
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
        const value = spectrumValue(i, 72, 3)
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
      const value = spectrumValue(i, 18, 3, true)
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
      const value = spectrumValue(i, count, 3)
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
      const value = spectrumValue(i, 13, 3)
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
      const value = spectrumValue(i, 65, 3)
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
      const value = spectrumValue(i, 16, 2, true)
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
      const value = spectrumValue(i, 30, 3)
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
      const value = spectrumValue(i, 40, 3, true)
      const r = radius * (1.08 + value * .12)
      ctx.strokeStyle = i % 2 ? accent : glow; ctx.globalAlpha = .55 + value * .4; ctx.lineWidth = minSide * .002
      ctx.beginPath(); ctx.arc(Math.cos(angle) * r, Math.sin(angle) * r, minSide * (.006 + value * .009), 0, Math.PI * 2); ctx.stroke()
    }
    ctx.restore()
  }

  if (hasLayer('bubble-wave')) {
    ctx.save(); ctx.strokeStyle = glow; ctx.lineWidth = minSide * .003
    for (let i = 0; i < 38; i += 1) {
      const value = spectrumValue(i, 38, 3)
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
      for (let i = 0; i <= 180; i += 1) {
        const angle = i / 180 * Math.PI * 2
        const wave = Math.sin(angle * 7 - time * .0028 + ring) * .55 + Math.sin(angle * 3 + time * .0017) * .3 + Math.sin(angle * 11 - time * .0012) * .15
        const flame = wave * (.018 + reaction * .032)
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
      const value = spectrumValue(i, count, 3, true)
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
        const value = spectrumValue(i, 81, 3)
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
      const value = spectrumValue(i, count, 3, true)
      const start = radius * 1.2
      const end = start + minSide * (.025 + value * (hasLayer('deco-rays') ? .07 : .12))
      ctx.strokeStyle = i % 2 ? accent : glow; ctx.globalAlpha = .25 + value * .65; ctx.lineWidth = minSide * (hasLayer('deco-rays') ? .0018 : .0035)
      ctx.beginPath(); ctx.moveTo(Math.cos(angle) * start, Math.sin(angle) * start); ctx.lineTo(Math.cos(angle) * end, Math.sin(angle) * end); ctx.stroke()
    }
    ctx.restore()
  }

  if (hasLayer('caustic-light')) {
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.strokeStyle = `${glow}4d`; ctx.lineWidth = Math.max(1.5, minSide * .0035); ctx.shadowColor = glow; ctx.shadowBlur = minSide * .01
    const causticRows = [.12, .28, .72, .88]
    causticRows.forEach((rowPosition, row) => {
      ctx.beginPath()
      for (let i = 0; i <= 32; i += 1) {
        const x = width * i / 32
        const y = height * rowPosition + Math.sin(i * .64 + time * .0015 + row) * minSide * .016
        if (!i) ctx.moveTo(x, y); else ctx.lineTo(x, y)
      }
      ctx.globalAlpha = .34 + row * .035
      ctx.stroke()
    })
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
      const value = spectrumValue(i, count, 3)
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
    ctx.save(); const sunRadius = radius * .92; const gradient = ctx.createLinearGradient(0, centerY - sunRadius, 0, centerY + sunRadius); gradient.addColorStop(0, glow); gradient.addColorStop(1, accent); ctx.fillStyle = gradient; ctx.shadowColor = accent; ctx.shadowBlur = minSide * .018; ctx.beginPath(); ctx.arc(centerX, centerY, sunRadius, 0, Math.PI * 2); ctx.fill()
    ctx.shadowBlur = 0; ctx.fillStyle = 'rgba(8,8,28,.66)'
    for (let i = 0; i < 7; i += 1) { const y = centerY + sunRadius * (.2 + i * .095); ctx.fillRect(centerX - sunRadius, y, sunRadius * 2, minSide * (.0035 + i * .0007)) }
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
        const value = spectrumValue(i, 97, 3, true)
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
      const value = spectrumValue(i, 12, 2, true)
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
    ctx.save(); const ground = height * .79; ctx.fillStyle = 'rgba(3,7,18,.82)'
    const buildings = [9,15,11,23,17,12,27,14,19,10,25,16,21,13,18,24,12,20]
    const unit = width / buildings.length
    buildings.forEach((storeys, i) => {
      const buildingWidth = unit * .82; const buildingHeight = minSide * (.06 + storeys * .005)
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

  if (hasLayer('prism-orb')) {
    ctx.save()
    const orbRadius = radius * (1.02 + reaction * .05)
    const prism = ctx.createRadialGradient(centerX - orbRadius * .34, centerY - orbRadius * .38, orbRadius * .04, centerX, centerY, orbRadius)
    prism.addColorStop(0, 'rgba(255,255,255,.7)')
    prism.addColorStop(.16, `${glow}66`)
    prism.addColorStop(.42, `${accent}3d`)
    prism.addColorStop(.7, 'rgba(120,100,255,.22)')
    prism.addColorStop(1, 'rgba(8,20,38,.25)')
    ctx.fillStyle = prism; ctx.shadowColor = glow; ctx.shadowBlur = minSide * .026
    ctx.beginPath(); ctx.arc(centerX, centerY, orbRadius, 0, Math.PI * 2); ctx.fill()
    ctx.globalAlpha = .56; ctx.strokeStyle = '#fff'; ctx.lineWidth = minSide * .003
    ctx.beginPath(); ctx.arc(centerX - orbRadius * .16, centerY - orbRadius * .2, orbRadius * .62, Math.PI * 1.08, Math.PI * 1.55); ctx.stroke()
    ctx.restore()
  }

  if (hasLayer('caustic-shimmer')) {
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.strokeStyle = `${glow}62`; ctx.shadowColor = glow; ctx.shadowBlur = minSide * .014; ctx.lineWidth = minSide * .004
    for (let band = 0; band < 5; band += 1) {
      ctx.beginPath()
      for (let i = 0; i <= 34; i += 1) {
        const x = width * i / 34
        const y = height * (.15 + band * .18) + Math.sin(i * .53 + time * .0015 + band * 1.4) * minSide * .018
        if (!i) ctx.moveTo(x, y); else ctx.lineTo(x, y)
      }
      ctx.globalAlpha = .12 + band * .035; ctx.stroke()
    }
    ctx.restore()
  }

  if (hasLayer('pearl-chain')) {
    ctx.save(); ctx.translate(centerX, centerY)
    for (let i = 0; i < 18; i += 1) {
      const angle = Math.PI * (.12 + i / 21 * .76) + time * .00008
      const value = spectrumValue(i, 18, 2)
      const r = radius * (1.42 + value * .08)
      const size = minSide * (.005 + value * .008)
      const pearl = ctx.createRadialGradient(Math.cos(angle) * r - size * .3, Math.sin(angle) * r - size * .3, 0, Math.cos(angle) * r, Math.sin(angle) * r, size)
      pearl.addColorStop(0, '#fff'); pearl.addColorStop(.4, glow); pearl.addColorStop(1, `${accent}66`)
      ctx.fillStyle = pearl; ctx.globalAlpha = .48 + value * .46; ctx.beginPath(); ctx.arc(Math.cos(angle) * r, Math.sin(angle) * r, size, 0, Math.PI * 2); ctx.fill()
    }
    ctx.restore()
  }

  if (hasLayer('molten-core')) {
    ctx.save(); ctx.translate(centerX, centerY)
    const coreRadius = radius * (.82 + reaction * .07)
    const lava = ctx.createRadialGradient(-coreRadius * .24, -coreRadius * .3, coreRadius * .02, 0, 0, coreRadius)
    lava.addColorStop(0, '#ffe2a0'); lava.addColorStop(.16, glow); lava.addColorStop(.48, accent); lava.addColorStop(.78, '#8b1f0c'); lava.addColorStop(1, 'rgba(30,3,2,.82)')
    ctx.fillStyle = lava; ctx.shadowColor = accent; ctx.shadowBlur = minSide * (.018 + reaction * .02)
    ctx.beginPath()
    for (let i = 0; i <= 64; i += 1) {
      const angle = i / 64 * Math.PI * 2
      const r = coreRadius * (1 + Math.sin(angle * 4 + time * .0018) * .035 + Math.sin(angle * 9 - time * .0023) * .018)
      if (!i) ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r); else ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r)
    }
    ctx.closePath(); ctx.fill(); ctx.restore()
  }

  if (hasLayer('ember-vortex')) {
    ctx.save(); ctx.translate(centerX, centerY); ctx.rotate(time * .00012)
    for (let i = 0; i < 54; i += 1) {
      const progress = ((i * 17) % 54) / 54
      const angle = i * .72 + progress * Math.PI * 2
      const value = values[(i * 3) % sampleCount] / 255
      const r = radius * (.42 + progress * 1.25)
      ctx.fillStyle = i % 4 ? accent : glow; ctx.globalAlpha = .18 + value * .65
      ctx.beginPath(); ctx.arc(Math.cos(angle) * r, Math.sin(angle) * r * .62, minSide * (.002 + value * .0035), 0, Math.PI * 2); ctx.fill()
    }
    ctx.restore()
  }

  if (hasLayer('flame-crown')) {
    ctx.save(); ctx.translate(centerX, centerY); ctx.lineCap = 'round'; ctx.shadowColor = glow; ctx.shadowBlur = minSide * .012
    for (let i = 0; i < 17; i += 1) {
      const angle = Math.PI * (1.08 + i / 20 * .84)
      const value = spectrumValue(i, 17, 3)
      const start = radius * 1.1; const flame = minSide * (.03 + value * .075)
      ctx.strokeStyle = i % 3 ? accent : glow; ctx.globalAlpha = .42 + value * .52; ctx.lineWidth = minSide * .004
      ctx.beginPath(); ctx.moveTo(Math.cos(angle) * start, Math.sin(angle) * start); ctx.quadraticCurveTo(Math.cos(angle) * (start + flame * .55) + Math.sin(time * .003 + i) * flame * .15, Math.sin(angle) * (start + flame * .55), Math.cos(angle) * (start + flame), Math.sin(angle) * (start + flame)); ctx.stroke()
    }
    ctx.restore()
  }

  if (hasLayer('deep-portal')) {
    ctx.save()
    const portal = ctx.createRadialGradient(centerX, centerY, radius * .15, centerX, centerY, radius * 1.15)
    portal.addColorStop(0, 'rgba(0,8,22,.92)'); portal.addColorStop(.48, 'rgba(0,30,58,.72)'); portal.addColorStop(.7, `${accent}42`); portal.addColorStop(.84, `${glow}68`); portal.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = portal; ctx.beginPath(); ctx.arc(centerX, centerY, radius * 1.22, 0, Math.PI * 2); ctx.fill()
    ctx.strokeStyle = glow; ctx.globalAlpha = .62; ctx.lineWidth = minSide * .003; ctx.shadowColor = glow; ctx.shadowBlur = minSide * .018
    ctx.beginPath(); ctx.ellipse(centerX, centerY, radius * 1.08, radius * .42, -.08, 0, Math.PI * 2); ctx.stroke(); ctx.restore()
  }

  if (hasLayer('light-shafts')) {
    ctx.save(); ctx.globalCompositeOperation = 'screen'
    for (let i = 0; i < 5; i += 1) {
      const x = width * (.12 + i * .2) + Math.sin(time * .0005 + i) * width * .03
      const beam = ctx.createLinearGradient(x, 0, x + width * .08, height)
      beam.addColorStop(0, `${glow}36`); beam.addColorStop(.62, `${accent}12`); beam.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = beam; ctx.globalAlpha = .25 + i * .035
      ctx.beginPath(); ctx.moveTo(x - width * .035, 0); ctx.lineTo(x + width * .04, 0); ctx.lineTo(x + width * .18, height); ctx.lineTo(x - width * .04, height); ctx.closePath(); ctx.fill()
    }
    ctx.restore()
  }

  if (hasLayer('kelp-ribbons')) {
    ctx.save(); ctx.lineCap = 'round'; ctx.lineWidth = minSide * .007
    for (let ribbon = 0; ribbon < 8; ribbon += 1) {
      const startX = width * (.05 + ribbon * .13); ctx.beginPath(); ctx.moveTo(startX, height)
      for (let i = 1; i <= 12; i += 1) { const y = height - minSide * .035 * i; const x = startX + Math.sin(i * .52 + time * .0014 + ribbon) * minSide * .025; ctx.lineTo(x, y) }
      ctx.strokeStyle = ribbon % 2 ? `${accent}70` : `${glow}58`; ctx.stroke()
    }
    ctx.restore()
  }

  if (hasLayer('precision-axis')) {
    ctx.save(); ctx.strokeStyle = `${glow}70`; ctx.lineWidth = Math.max(1, minSide * .0012); ctx.setLineDash([minSide * .008, minSide * .012])
    ctx.beginPath(); ctx.moveTo(width * .08, centerY); ctx.lineTo(width * .92, centerY); ctx.moveTo(centerX, height * .08); ctx.lineTo(centerX, height * .92); ctx.stroke(); ctx.setLineDash([])
    ctx.fillStyle = accent; ctx.globalAlpha = .75; ctx.beginPath(); ctx.arc(centerX, centerY, minSide * .004, 0, Math.PI * 2); ctx.fill(); ctx.restore()
  }

  if (hasLayer('editorial-frame')) {
    ctx.save(); const inset = minSide * .06; const short = minSide * .1; ctx.strokeStyle = accent; ctx.globalAlpha = .62; ctx.lineWidth = minSide * .002
    ctx.strokeRect(inset, inset, width - inset * 2, height - inset * 2)
    ctx.lineWidth = minSide * .005
    ;[[inset,inset,1,1],[width-inset,inset,-1,1],[inset,height-inset,1,-1],[width-inset,height-inset,-1,-1]].forEach(([x,y,sx,sy]) => { ctx.beginPath(); ctx.moveTo(x, y + sy * short); ctx.lineTo(x, y); ctx.lineTo(x + sx * short, y); ctx.stroke() })
    ctx.restore()
  }

  if (hasLayer('type-rule')) {
    ctx.save(); ctx.strokeStyle = glow; ctx.globalAlpha = .55; ctx.lineWidth = minSide * .002
    const gap = radius * 1.18
    ctx.beginPath(); ctx.moveTo(width * .1, centerY); ctx.lineTo(centerX - gap, centerY); ctx.moveTo(centerX + gap, centerY); ctx.lineTo(width * .9, centerY); ctx.stroke()
    for (const x of [width * .1, width * .9]) { ctx.fillStyle = accent; ctx.fillRect(x - minSide * .003, centerY - minSide * .003, minSide * .006, minSide * .006) }
    ctx.restore()
  }

  if (hasLayer('horizon-mountains')) {
    ctx.save(); const base = height * .66; const peaks = [0,.12,.06,.2,.1,.24,.08,.18,.05,.14,0]; ctx.fillStyle = 'rgba(6,4,24,.7)'; ctx.strokeStyle = accent; ctx.lineWidth = minSide * .0018; ctx.shadowColor = accent; ctx.shadowBlur = minSide * .005
    ctx.beginPath(); ctx.moveTo(0, base); peaks.forEach((peak, i) => ctx.lineTo(width * i / (peaks.length - 1), base - minSide * peak)); ctx.lineTo(width, base); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore()
  }

  if (hasLayer('tape-noise')) {
    ctx.save(); ctx.globalAlpha = .09
    for (let i = 0; i < 44; i += 1) {
      const y = ((i * 37 + Math.floor(time * .04)) % 100) / 100 * height
      const x = ((i * 61 + Math.floor(time * .02)) % 100) / 100 * width
      const length = width * (.008 + (i % 7) * .006)
      ctx.fillStyle = i % 5 ? '#fff' : accent; ctx.fillRect(x, y, length, Math.max(1, minSide * .001))
    }
    ctx.restore()
  }

  if (hasLayer('laser-moon')) {
    ctx.save(); ctx.fillStyle = `${glow}66`; ctx.shadowColor = glow; ctx.shadowBlur = minSide * .018; ctx.beginPath(); ctx.arc(width * .78, height * .2, minSide * .058, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0; ctx.fillStyle = 'rgba(8,10,34,.9)'; ctx.beginPath(); ctx.arc(width * .802, height * .18, minSide * .055, 0, Math.PI * 2); ctx.fill(); ctx.restore()
  }

  if (hasLayer('deco-arch')) {
    ctx.save(); ctx.translate(centerX, centerY); ctx.strokeStyle = accent; ctx.shadowColor = glow; ctx.shadowBlur = minSide * .01; ctx.lineWidth = minSide * .0025
    for (let i = 0; i < 4; i += 1) {
      const r = radius * (.78 + i * .22); ctx.globalAlpha = .24 + i * .12; ctx.beginPath(); ctx.arc(0, radius * .2, r, Math.PI, Math.PI * 2); ctx.lineTo(r, radius * 1.18); ctx.moveTo(-r, radius * .2); ctx.lineTo(-r, radius * 1.18); ctx.stroke()
    }
    ctx.restore()
  }

  if (hasLayer('luxe-spotlight')) {
    ctx.save(); ctx.globalCompositeOperation = 'screen'
    for (const [start, end] of [[width * .15,width * .48],[width * .85,width * .52]]) {
      const beam = ctx.createLinearGradient(start, 0, end, height)
      beam.addColorStop(0, `${glow}48`); beam.addColorStop(.5, `${accent}18`); beam.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = beam; ctx.globalAlpha = .4; ctx.beginPath(); ctx.moveTo(start - width * .04, 0); ctx.lineTo(start + width * .04, 0); ctx.lineTo(end + width * .18, height); ctx.lineTo(end - width * .18, height); ctx.closePath(); ctx.fill()
    }
    ctx.restore()
  }

  if (hasLayer('pearl-dust')) {
    ctx.save()
    for (let i = 0; i < 48; i += 1) {
      const x = ((i * 73.7) % 100) / 100 * width; const y = ((i * 43.1 + time * .002) % 100) / 100 * height; const twinkle = .35 + Math.abs(Math.sin(time * .0015 + i)) * .65
      ctx.fillStyle = i % 5 ? glow : '#fff'; ctx.globalAlpha = .18 + twinkle * .48; ctx.beginPath(); ctx.arc(x, y, minSide * (.0015 + i % 4 * .0007), 0, Math.PI * 2); ctx.fill()
    }
    ctx.restore()
  }

  if (hasLayer('crystal-glow')) {
    const aura = ctx.createRadialGradient(centerX, centerY, radius * .08, centerX, centerY, minSide * .56)
    aura.addColorStop(0, `${glow}4d`)
    aura.addColorStop(.28, `${accent}2e`)
    aura.addColorStop(.68, 'rgba(96,80,190,.1)')
    aura.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = aura
    ctx.fillRect(0, 0, width, height)
  }

  if (hasLayer('facet-rays')) {
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.translate(centerX, centerY); ctx.rotate(time * .000025)
    const rayCount = 10
    for (let i = 0; i < rayCount; i += 1) {
      const angle = i / rayCount * Math.PI * 2
      const value = spectrumValue(i, rayCount, 2, true)
      const inner = radius * .76
      const outer = minSide * (.44 + value * .08)
      const halfWidth = .035 + value * .016
      const ray = ctx.createLinearGradient(Math.cos(angle) * inner, Math.sin(angle) * inner, Math.cos(angle) * outer, Math.sin(angle) * outer)
      ray.addColorStop(0, i % 2 ? `${glow}42` : `${accent}42`)
      ray.addColorStop(.55, i % 2 ? `${accent}1f` : `${glow}1f`)
      ray.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = ray; ctx.globalAlpha = .34 + value * .24
      ctx.beginPath(); ctx.moveTo(Math.cos(angle - halfWidth) * inner, Math.sin(angle - halfWidth) * inner); ctx.lineTo(Math.cos(angle - halfWidth * .34) * outer, Math.sin(angle - halfWidth * .34) * outer); ctx.lineTo(Math.cos(angle + halfWidth * .34) * outer, Math.sin(angle + halfWidth * .34) * outer); ctx.lineTo(Math.cos(angle + halfWidth) * inner, Math.sin(angle + halfWidth) * inner); ctx.closePath(); ctx.fill()
    }
    ctx.restore()
  }

  if (hasLayer('depth-grid')) {
    ctx.save(); ctx.strokeStyle = `${glow}3d`; ctx.lineWidth = Math.max(1, minSide * .0012)
    const horizon = height * .67
    for (let i = -8; i <= 8; i += 1) { ctx.globalAlpha = .24 + Math.abs(i) * .012; ctx.beginPath(); ctx.moveTo(centerX, horizon); ctx.lineTo(centerX + i * width * .11, height); ctx.stroke() }
    for (let i = 0; i < 8; i += 1) { const phase = (i / 8 + time * .00008) % 1; const y = horizon + (height - horizon) * phase * phase; ctx.globalAlpha = .12 + phase * .36; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke() }
    ctx.restore()
  }

  if (hasLayer('crystal-halo')) {
    ctx.save(); ctx.translate(centerX, centerY); ctx.rotate(-.18 + Math.sin(time * .0004) * .04); ctx.globalCompositeOperation = 'screen'
    for (let i = 0; i < 3; i += 1) {
      const orbitX = radius * (1.05 + i * .31)
      const orbitY = orbitX * (.3 + i * .035)
      ctx.strokeStyle = i % 2 ? accent : glow; ctx.globalAlpha = .26 + i * .13; ctx.lineWidth = minSide * (.0018 + i * .0005); ctx.shadowColor = i % 2 ? accent : glow; ctx.shadowBlur = minSide * .008
      ctx.beginPath(); ctx.ellipse(0, 0, orbitX, orbitY, 0, 0, Math.PI * 2); ctx.stroke()
      const beadAngle = time * (.00022 + i * .00005) + i * 2.2
      ctx.fillStyle = '#fff'; ctx.globalAlpha = .72; ctx.beginPath(); ctx.arc(Math.cos(beadAngle) * orbitX, Math.sin(beadAngle) * orbitY, minSide * (.0035 + i * .001), 0, Math.PI * 2); ctx.fill()
    }
    ctx.restore()
  }

  if (hasLayer('crystal-core')) {
    ctx.save()
    const crystalShadow = ctx.createRadialGradient(centerX, centerY + radius * 1.02, 0, centerX, centerY + radius * 1.02, radius * 1.28)
    crystalShadow.addColorStop(0, 'rgba(4,8,24,.55)'); crystalShadow.addColorStop(.46, `${accent}1f`); crystalShadow.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = crystalShadow; ctx.save(); ctx.translate(centerX, centerY + radius * 1.02); ctx.scale(1, .22); ctx.beginPath(); ctx.arc(0, 0, radius * 1.25, 0, Math.PI * 2); ctx.fill(); ctx.restore()
    ctx.globalCompositeOperation = 'source-over'
    const rotationY = time * .00022
    const rotationX = -.2 + Math.sin(time * .00032) * .07
    const scale = radius * (1.02 + reaction * .06)
    const vertices = [[0,-1.32,0],[0,1.32,0],[-.76,0,0],[0,0,.66],[.76,0,0],[0,0,-.66]]
    const rotatePoint = ([x,y,z]) => {
      const cy = Math.cos(rotationY); const sy = Math.sin(rotationY); const cx = Math.cos(rotationX); const sx = Math.sin(rotationX)
      const x1 = x * cy + z * sy; const z1 = -x * sy + z * cy
      const y1 = y * cx - z1 * sx; const z2 = y * sx + z1 * cx
      const perspective = 1 / (1.9 - z2 * .2)
      return { x: centerX + x1 * scale * perspective * 1.65, y: centerY + y1 * scale * perspective * 1.65, z: z2 }
    }
    const projected = vertices.map(rotatePoint)
    const faces = [[0,2,3],[0,3,4],[0,4,5],[0,5,2],[1,3,2],[1,4,3],[1,5,4],[1,2,5]]
      .map((indices, faceIndex) => ({ indices, faceIndex, depth: indices.reduce((sum, index) => sum + projected[index].z, 0) / indices.length }))
      .sort((a,b) => a.depth - b.depth)
    faces.forEach(({ indices, faceIndex, depth }) => {
      const points = indices.map(index => projected[index])
      const faceGradient = ctx.createLinearGradient(points[0].x, points[0].y, points[2].x, points[2].y)
      const front = Math.max(0, Math.min(1, (depth + .8) / 1.6))
      faceGradient.addColorStop(0, faceIndex % 2 ? `${glow}${front > .5 ? '70' : '38'}` : `${accent}${front > .5 ? '78' : '3d'}`)
      faceGradient.addColorStop(.5, 'rgba(255,255,255,.24)')
      faceGradient.addColorStop(1, faceIndex % 2 ? `${accent}2e` : `${glow}33`)
      ctx.fillStyle = faceGradient; ctx.globalAlpha = .5 + front * .38; ctx.strokeStyle = front > .5 ? 'rgba(255,255,255,.78)' : `${glow}72`; ctx.lineWidth = minSide * (.0015 + front * .0012); ctx.shadowColor = faceIndex % 2 ? glow : accent; ctx.shadowBlur = minSide * (.003 + front * .007)
      ctx.beginPath(); ctx.moveTo(points[0].x, points[0].y); ctx.lineTo(points[1].x, points[1].y); ctx.lineTo(points[2].x, points[2].y); ctx.closePath(); ctx.fill(); ctx.stroke()
    })
    ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = .72; ctx.strokeStyle = '#fff'; ctx.lineWidth = minSide * .0015
    ctx.beginPath(); ctx.moveTo(projected[0].x, projected[0].y); ctx.lineTo(projected[1].x, projected[1].y); ctx.stroke()
    const innerRefraction = ctx.createRadialGradient(centerX - radius * .16, centerY - radius * .22, 0, centerX, centerY, radius * .72)
    innerRefraction.addColorStop(0, 'rgba(255,255,255,.42)'); innerRefraction.addColorStop(.28, `${glow}26`); innerRefraction.addColorStop(.62, `${accent}12`); innerRefraction.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = innerRefraction; ctx.globalAlpha = .66; ctx.beginPath(); ctx.moveTo(projected[0].x, projected[0].y); ctx.lineTo(projected[4].x, projected[4].y); ctx.lineTo(projected[1].x, projected[1].y); ctx.lineTo(projected[2].x, projected[2].y); ctx.closePath(); ctx.fill()
    const glint = .5 + Math.sin(time * .0011) * .5
    const glintY = projected[0].y + (projected[1].y - projected[0].y) * (.22 + glint * .42)
    ctx.globalAlpha = .42 + glint * .38; ctx.fillStyle = '#fff'; ctx.shadowColor = '#fff'; ctx.shadowBlur = minSide * .012
    ctx.beginPath(); ctx.arc(centerX - radius * .08, glintY, minSide * (.003 + glint * .0025), 0, Math.PI * 2); ctx.fill()
    ctx.restore()
  }

  if (hasLayer('floating-shards')) {
    ctx.save(); ctx.globalCompositeOperation = 'source-over'
    for (let i = 0; i < 14; i += 1) {
      const angle = i * 2.399 + time * (.00005 + i % 3 * .000012)
      const distance = radius * (1.38 + ((i * 29) % 70) / 100)
      const value = values[(i * 5) % sampleCount] / 255
      const x = centerX + Math.cos(angle) * distance; const y = centerY + Math.sin(angle) * distance * .72
      const depth = .5 + Math.sin(angle * 1.4 + time * .00018 + i) * .5
      const shardHeight = minSide * (.024 + (i % 4) * .007 + value * .01) * (.72 + depth * .38); const shardWidth = shardHeight * (.25 + i % 3 * .055)
      ctx.save(); ctx.translate(x, y); ctx.rotate(angle + time * .00016 * (i % 2 ? 1 : -1)); ctx.globalAlpha = .28 + depth * .38 + value * .18
      const shardFace = ctx.createLinearGradient(-shardWidth, 0, shardWidth, 0); shardFace.addColorStop(0, `${accent}28`); shardFace.addColorStop(.46, i % 2 ? `${accent}94` : `${glow}94`); shardFace.addColorStop(1, 'rgba(255,255,255,.48)')
      ctx.fillStyle = shardFace; ctx.strokeStyle = 'rgba(255,255,255,.66)'; ctx.lineWidth = Math.max(1, minSide * .0009)
      ctx.beginPath(); ctx.moveTo(0, -shardHeight); ctx.lineTo(shardWidth, 0); ctx.lineTo(0, shardHeight * .75); ctx.lineTo(-shardWidth, 0); ctx.closePath(); ctx.fill(); ctx.stroke()
      ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = .44 + depth * .35; ctx.strokeStyle = '#fff'; ctx.beginPath(); ctx.moveTo(0, -shardHeight); ctx.lineTo(0, shardHeight * .75); ctx.stroke(); ctx.restore()
    }
    ctx.restore()
  }

  if (hasLayer('prism-spectrum')) {
    ctx.save(); ctx.globalCompositeOperation = 'screen'
    const count = 25; const startX = width * .1; const available = width * .8; const baseY = height * .89
    for (let i = 0; i < count; i += 1) {
      const value = spectrumValue(i, count, 3)
      const crystalHeight = minSide * (.018 + value * .14); const x = startX + available * i / (count - 1); const half = available / count * .3
      ctx.fillStyle = i % 3 === 0 ? `${glow}80` : `${accent}72`; ctx.strokeStyle = 'rgba(255,255,255,.42)'; ctx.lineWidth = Math.max(1, minSide * .0009); ctx.globalAlpha = .4 + value * .5
      ctx.beginPath(); ctx.moveTo(x, baseY - crystalHeight); ctx.lineTo(x + half, baseY); ctx.lineTo(x - half, baseY); ctx.closePath(); ctx.fill(); ctx.stroke()
    }
    ctx.restore()
  }

  if (hasLayer('light-sweep')) {
    ctx.save(); ctx.globalCompositeOperation = 'screen'
    const sweepX = ((time * .00013) % 1.4 - .2) * width
    const sweep = ctx.createLinearGradient(sweepX - width * .14, 0, sweepX + width * .14, 0)
    sweep.addColorStop(0, 'rgba(255,255,255,0)'); sweep.addColorStop(.42, `${accent}18`); sweep.addColorStop(.5, 'rgba(255,255,255,.38)'); sweep.addColorStop(.58, `${glow}18`); sweep.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = sweep; ctx.transform(1, 0, -.22, 1, 0, 0); ctx.fillRect(sweepX - width * .18, 0, width * .36, height); ctx.restore()
  }

  if (hasLayer('crystal-dust')) {
    ctx.save(); ctx.globalCompositeOperation = 'screen'
    for (let i = 0; i < 42; i += 1) {
      const x = ((i * 67.9) % 100) / 100 * width; const y = ((i * 41.7 + time * .0012) % 100) / 100 * height; const twinkle = .25 + Math.abs(Math.sin(time * .0018 + i * 1.9)) * .75
      const size = minSide * (.0013 + i % 4 * .00065) * (1 + reaction * .8)
      ctx.fillStyle = i % 5 ? glow : '#fff'; ctx.globalAlpha = .18 + twinkle * .55; ctx.save(); ctx.translate(x, y); ctx.rotate(Math.PI / 4); ctx.fillRect(-size, -size, size * 2, size * 2); ctx.restore()
    }
    ctx.restore()
  }

  if (hasLayer('studio-lights')) {
    ctx.save(); ctx.globalCompositeOperation = 'screen'
    const lightSources = [[width * .12, glow, width * .42], [width * .88, accent, width * .58]]
    lightSources.forEach(([sourceX, colour, targetX], index) => {
      const beam = ctx.createLinearGradient(sourceX, 0, targetX, height)
      beam.addColorStop(0, `${colour}52`); beam.addColorStop(.42, `${colour}18`); beam.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = beam; ctx.globalAlpha = .26 + index * .05
      ctx.beginPath(); ctx.moveTo(sourceX - width * .035, 0); ctx.lineTo(sourceX + width * .035, 0); ctx.lineTo(targetX + width * .2, height); ctx.lineTo(targetX - width * .2, height); ctx.closePath(); ctx.fill()
    })
    ctx.restore()
  }

  if (hasLayer('depth-floor')) {
    ctx.save(); const horizon = height * .68; ctx.strokeStyle = `${accent}44`; ctx.lineWidth = Math.max(1, minSide * .001)
    const floorFade = ctx.createLinearGradient(0, horizon, 0, height); floorFade.addColorStop(0, 'rgba(0,0,0,0)'); floorFade.addColorStop(1, `${accent}12`); ctx.fillStyle = floorFade; ctx.fillRect(0, horizon, width, height - horizon)
    for (let i = -10; i <= 10; i += 1) { ctx.globalAlpha = .09 + Math.abs(i) * .007; ctx.beginPath(); ctx.moveTo(centerX, horizon); ctx.lineTo(centerX + i * width * .09, height); ctx.stroke() }
    for (let i = 0; i < 9; i += 1) { const phase = (i / 9 + time * .000045) % 1; const y = horizon + (height - horizon) * phase * phase; ctx.globalAlpha = .06 + phase * .24; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke() }
    ctx.restore()
  }

  if (hasLayer('floor-reflection')) {
    ctx.save(); ctx.translate(centerX, height * .72); ctx.scale(1, .22)
    const reflection = ctx.createRadialGradient(0, 0, radius * .05, 0, 0, radius * 1.8)
    reflection.addColorStop(0, 'rgba(255,255,255,.34)'); reflection.addColorStop(.18, `${glow}32`); reflection.addColorStop(.54, `${accent}1c`); reflection.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = reflection; ctx.shadowColor = glow; ctx.shadowBlur = minSide * .08; ctx.beginPath(); ctx.arc(0, 0, radius * 1.75, 0, Math.PI * 2); ctx.fill(); ctx.restore()
  }

  if (hasLayer('turbine-blades')) {
    ctx.save(); ctx.translate(centerX, centerY); ctx.rotate(time * .00012); ctx.globalCompositeOperation = 'source-over'
    const bladeCount = 16
    for (let i = 0; i < bladeCount; i += 1) {
      const angle = i / bladeCount * Math.PI * 2
      const rawValue = spectrumValue(i, bladeCount, 5, true)
      const value = .42 + rawValue * .58
      const inner = radius * .75; const outer = radius * (1.38 + value * .12); const sweep = .19
      const blade = ctx.createLinearGradient(Math.cos(angle) * inner, Math.sin(angle) * inner, Math.cos(angle + sweep) * outer, Math.sin(angle + sweep) * outer)
      blade.addColorStop(0, 'rgba(238,247,255,.72)'); blade.addColorStop(.22, `${glow}82`); blade.addColorStop(.58, `${accent}58`); blade.addColorStop(1, 'rgba(6,11,18,.66)')
      ctx.fillStyle = blade; ctx.strokeStyle = i % 2 ? `${glow}78` : `${accent}78`; ctx.lineWidth = minSide * .0013; ctx.globalAlpha = .38 + value * .34; ctx.shadowColor = 'rgba(0,0,0,.72)'; ctx.shadowBlur = minSide * .006
      ctx.beginPath(); ctx.moveTo(Math.cos(angle - .05) * inner, Math.sin(angle - .05) * inner); ctx.quadraticCurveTo(Math.cos(angle + sweep * .45) * outer * .86, Math.sin(angle + sweep * .45) * outer * .86, Math.cos(angle + sweep) * outer, Math.sin(angle + sweep) * outer); ctx.lineTo(Math.cos(angle + .14) * inner, Math.sin(angle + .14) * inner); ctx.closePath(); ctx.fill(); ctx.stroke()
    }
    ctx.restore()
  }

  if (hasLayer('gyro-rings')) {
    ctx.save(); ctx.translate(centerX, centerY); ctx.globalCompositeOperation = 'screen'; ctx.lineCap = 'round'
    const gyroAngles = [-.42, .18, .76]
    gyroAngles.forEach((tilt, index) => {
      ctx.save(); ctx.rotate(tilt + Math.sin(time * .00025 + index) * .05); ctx.strokeStyle = index === 1 ? glow : accent; ctx.globalAlpha = .32 + index * .14; ctx.lineWidth = minSide * (.0018 + index * .0008); ctx.shadowColor = index === 1 ? glow : accent; ctx.shadowBlur = minSide * .009
      const ringX = radius * (1.08 + index * .17); const ringY = radius * (.34 + index * .045)
      ctx.beginPath(); ctx.ellipse(0, 0, ringX, ringY, 0, Math.PI, Math.PI * 2); ctx.globalAlpha *= .45; ctx.stroke()
      ctx.beginPath(); ctx.ellipse(0, 0, ringX, ringY, 0, 0, Math.PI); ctx.globalAlpha = .46 + index * .12; ctx.lineWidth *= 1.35; ctx.stroke()
      const marker = time * (.0002 + index * .00005) + index * 2
      ctx.fillStyle = '#fff'; ctx.globalAlpha = .76; ctx.beginPath(); ctx.arc(Math.cos(marker) * radius * (1.08 + index * .17), Math.sin(marker) * radius * (.34 + index * .045), minSide * (.003 + index * .0008), 0, Math.PI * 2); ctx.fill(); ctx.restore()
    })
    ctx.restore()
  }

  if (hasLayer('metal-spectrum')) {
    ctx.save(); ctx.translate(centerX, centerY); ctx.lineCap = 'round'; ctx.shadowColor = glow; ctx.shadowBlur = minSide * .006
    const barCount = 64
    for (let i = 0; i < barCount; i += 1) {
      const angle = i / barCount * Math.PI * 2 - Math.PI / 2
      const value = .35 + spectrumValue(i, barCount, 5, true) * .65
      const inner = radius * 1.5; const length = minSide * (.014 + value * .03)
      ctx.strokeStyle = i % 8 === 0 ? '#fff' : i % 2 ? accent : glow; ctx.globalAlpha = .38 + value * .52; ctx.lineWidth = minSide * .0025
      ctx.beginPath(); ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner); ctx.lineTo(Math.cos(angle) * (inner + length), Math.sin(angle) * (inner + length)); ctx.stroke()
    }
    ctx.restore()
  }

  if (hasLayer('chrome-orb')) {
    ctx.save()
    ctx.save(); ctx.translate(centerX, centerY + radius * 1.04); ctx.scale(1, .2)
    const contactShadow = ctx.createRadialGradient(0, 0, radius * .04, 0, 0, radius * 1.35)
    contactShadow.addColorStop(0, 'rgba(0,0,0,.72)'); contactShadow.addColorStop(.52, `${accent}24`); contactShadow.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = contactShadow; ctx.beginPath(); ctx.arc(0, 0, radius * 1.35, 0, Math.PI * 2); ctx.fill(); ctx.restore()
    const orbRadius = radius * (.88 + reaction * .035)
    const chrome = ctx.createRadialGradient(centerX - orbRadius * .34, centerY - orbRadius * .38, orbRadius * .018, centerX, centerY, orbRadius)
    chrome.addColorStop(0, '#ffffff'); chrome.addColorStop(.055, '#eaf8ff'); chrome.addColorStop(.16, '#8fa6b8'); chrome.addColorStop(.31, '#344454'); chrome.addColorStop(.5, '#121b26'); chrome.addColorStop(.68, '#63798a'); chrome.addColorStop(.82, '#202d39'); chrome.addColorStop(.94, '#778b9b'); chrome.addColorStop(1, '#060a0f')
    ctx.fillStyle = chrome; ctx.shadowColor = accent; ctx.shadowBlur = minSide * (.02 + reaction * .016); ctx.beginPath(); ctx.arc(centerX, centerY, orbRadius, 0, Math.PI * 2); ctx.fill()
    ctx.save(); ctx.beginPath(); ctx.arc(centerX, centerY, orbRadius * .98, 0, Math.PI * 2); ctx.clip()
    const band = ctx.createLinearGradient(0, centerY - orbRadius, 0, centerY + orbRadius)
    band.addColorStop(0, 'rgba(255,255,255,.55)'); band.addColorStop(.2, 'rgba(255,255,255,0)'); band.addColorStop(.48, `${accent}2e`); band.addColorStop(.62, 'rgba(255,255,255,.28)'); band.addColorStop(.78, 'rgba(0,0,0,.34)'); band.addColorStop(1, 'rgba(255,255,255,.18)')
    ctx.fillStyle = band; ctx.fillRect(centerX - orbRadius, centerY - orbRadius, orbRadius * 2, orbRadius * 2)
    const movingReflectionX = centerX + Math.sin(time * .00038) * orbRadius * .38
    const movingReflection = ctx.createLinearGradient(movingReflectionX - orbRadius * .18, 0, movingReflectionX + orbRadius * .18, 0)
    movingReflection.addColorStop(0, 'rgba(255,255,255,0)'); movingReflection.addColorStop(.46, 'rgba(255,255,255,.02)'); movingReflection.addColorStop(.5, 'rgba(255,255,255,.7)'); movingReflection.addColorStop(.54, `${glow}22`); movingReflection.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = movingReflection; ctx.globalAlpha = .62; ctx.fillRect(centerX - orbRadius, centerY - orbRadius, orbRadius * 2, orbRadius * 2)
    ctx.globalAlpha = .48; ctx.strokeStyle = '#dff5ff'; ctx.lineWidth = minSide * .002; ctx.beginPath(); ctx.ellipse(centerX, centerY + orbRadius * .2, orbRadius * .84, orbRadius * .24, -.08, Math.PI * .08, Math.PI * .92); ctx.stroke()
    ctx.globalAlpha = .78; ctx.strokeStyle = '#fff'; ctx.lineWidth = minSide * .0035; ctx.beginPath(); ctx.arc(centerX - orbRadius * .15, centerY - orbRadius * .18, orbRadius * .63, Math.PI * 1.08, Math.PI * 1.58); ctx.stroke(); ctx.restore()
    ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = minSide * .0018; ctx.beginPath(); ctx.arc(centerX, centerY, orbRadius, 0, Math.PI * 2); ctx.stroke()
    const rim = ctx.createLinearGradient(centerX - orbRadius, centerY, centerX + orbRadius, centerY)
    rim.addColorStop(0, `${glow}b8`); rim.addColorStop(.18, 'rgba(255,255,255,0)'); rim.addColorStop(.82, 'rgba(255,255,255,0)'); rim.addColorStop(1, `${accent}c4`)
    ctx.strokeStyle = rim; ctx.lineWidth = minSide * .005; ctx.globalAlpha = .72; ctx.beginPath(); ctx.arc(centerX, centerY, orbRadius * .965, 0, Math.PI * 2); ctx.stroke(); ctx.restore()
  }

  if (hasLayer('chrome-sweep')) {
    ctx.save(); ctx.globalCompositeOperation = 'screen'
    const sweepX = ((time * .00016) % 1.45 - .22) * width
    const sweep = ctx.createLinearGradient(sweepX - width * .1, 0, sweepX + width * .1, 0)
    sweep.addColorStop(0, 'rgba(255,255,255,0)'); sweep.addColorStop(.45, `${accent}22`); sweep.addColorStop(.5, 'rgba(255,255,255,.66)'); sweep.addColorStop(.55, `${glow}22`); sweep.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = sweep; ctx.transform(1, 0, -.18, 1, 0, 0); ctx.fillRect(sweepX - width * .12, 0, width * .24, height); ctx.restore()
  }

  if (hasLayer('metal-sparks')) {
    ctx.save(); ctx.globalCompositeOperation = 'screen'
    for (let i = 0; i < 36; i += 1) {
      const angle = i * 2.399 + time * .00009; const distance = radius * (1.2 + ((i * 23) % 90) / 65); const twinkle = .28 + Math.abs(Math.sin(time * .0017 + i * 1.4)) * .72
      const x = centerX + Math.cos(angle) * distance; const y = centerY + Math.sin(angle) * distance * .74; const size = minSide * (.0012 + i % 4 * .0007)
      ctx.fillStyle = i % 6 ? glow : '#fff'; ctx.globalAlpha = .18 + twinkle * .56; ctx.fillRect(x - size * 1.8, y - size * .45, size * 3.6, size * .9)
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

  if (options.lyricsEnabled && options.lyricsLines.length) {
    const timedLyrics = options.lyricsLines.some(line => Number.isFinite(line.time))
    let lyricIndex = 0
    if (timedLyrics) {
      const nextIndex = options.lyricsLines.findLastIndex(line => Number.isFinite(line.time) && line.time <= options.playbackTime)
      lyricIndex = nextIndex
    } else if (options.playbackDuration > 0) {
      const lyricCount = options.lyricsLines.filter(line => !line.pause).length
      const pauseDuration = options.lyricsLines.reduce((total, line) => total + (line.duration || 0), 0)
      const lyricDuration = lyricCount
        ? Math.max(.1, (options.playbackDuration - pauseDuration) / lyricCount)
        : options.playbackDuration
      let cursor = 0
      lyricIndex = options.lyricsLines.findIndex(line => {
        const segmentDuration = line.pause ? line.duration || lyricDuration : lyricDuration
        const active = options.playbackTime >= cursor && options.playbackTime < cursor + segmentDuration
        cursor += segmentDuration
        return active
      })
      if (lyricIndex < 0) lyricIndex = options.lyricsLines.length - 1
    }
    const activeLyric = lyricIndex >= 0 ? options.lyricsLines[lyricIndex] : null
    if (activeLyric && !activeLyric.pause && activeLyric.text) {
      const lyricSize = Math.max(18, minSide * (options.lyricsSize / 100))
      const lyricY = height * (options.lyricsPosition / 100)
      const maxTextWidth = width * .78
      const lineHeight = lyricSize * 1.18
      ctx.save()
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = `800 ${lyricSize}px ${options.lyricsFontFamily || defaultLyricFont.family}`
      const lyricRows = wrapCanvasText(ctx, activeLyric.text, maxTextWidth)
      const widestRow = Math.max(...lyricRows.map(row => ctx.measureText(row).width))
      const panelWidth = Math.min(width * .88, widestRow + lyricSize * 1.55)
      const panelHeight = lyricRows.length * lineHeight + lyricSize * .72
      const panelX = centerX - panelWidth / 2
      const panelY = lyricY - panelHeight / 2
      ctx.fillStyle = `rgba(4, 9, 18, ${options.lyricsBackdrop / 100})`
      ctx.beginPath()
      ctx.roundRect(panelX, panelY, panelWidth, panelHeight, lyricSize * .42)
      ctx.fill()
      ctx.lineJoin = 'round'
      ctx.lineWidth = Math.max(2, lyricSize * .07)
      ctx.strokeStyle = 'rgba(0, 0, 0, .72)'
      ctx.fillStyle = options.lyricsColor || '#ffffff'
      ctx.shadowColor = glow
      ctx.shadowBlur = lyricSize * .2
      lyricRows.forEach((row, index) => {
        const rowY = lyricY + (index - (lyricRows.length - 1) / 2) * lineHeight
        ctx.strokeText(row, centerX, rowY)
        ctx.fillText(row, centerX, rowY)
      })
      const nextLine = options.lyricsLines[lyricIndex + 1]
      const nextLyric = nextLine && !nextLine.pause ? nextLine.text : ''
      if (nextLyric && options.lyricsBackdrop < 85) {
        ctx.globalAlpha = .48
        ctx.shadowBlur = 0
        ctx.font = `650 ${lyricSize * .55}px ${options.lyricsFontFamily || defaultLyricFont.family}`
        ctx.fillText(nextLyric, centerX, lyricY + panelHeight / 2 + lyricSize * .62)
      }
      ctx.restore()
    }
  }
}

export default function MusicVisualizer({ onExit }) {
  const canvasRef = useRef(null)
  const layerPreviewCanvasRef = useRef(null)
  const lyricFontInputRef = useRef(null)
  const lyricFontFaceRef = useRef(null)
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
  const [exportQuality, setExportQuality] = useState('high')
  const [exportFps, setExportFps] = useState('60')
  const [durationMode, setDurationMode] = useState('full')
  const [fit, setFit] = useState('cover')
  const [title, setTitle] = useState('YOUR TITLE')
  const [titleSize, setTitleSize] = useState(7)
  const [lyricsEnabled, setLyricsEnabled] = useState(false)
  const [lyricsText, setLyricsText] = useState('')
  const [lyricsSize, setLyricsSize] = useState(4.2)
  const [lyricsPosition, setLyricsPosition] = useState(78)
  const [lyricsBackdrop, setLyricsBackdrop] = useState(58)
  const [lyricsColor, setLyricsColor] = useState('#ffffff')
  const [lyricsFont, setLyricsFont] = useState(defaultLyricFont)
  const [lyricsFontError, setLyricsFontError] = useState('')
  const [color, setColor] = useState('#ff4ca8')
  const [glowColor, setGlowColor] = useState('#55d8ff')
  const [preserveColors, setPreserveColors] = useState(false)
  const [intensity, setIntensity] = useState(70)
  const [tint, setTint] = useState(18)
  const [centerX, setCenterX] = useState(50)
  const [centerY, setCenterY] = useState(50)
  const [theme, setTheme] = useState('pulse')
  const [themeLayerSelections, setThemeLayerSelections] = useState(defaultThemeLayers)
  const [layerLibraryOpen, setLayerLibraryOpen] = useState(false)
  const [layerSearch, setLayerSearch] = useState('')
  const [exporting, setExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const layers = themeLayerSelections[theme]
  const layerGroups = themeLibraries[theme]
  const allLayerGroups = useMemo(() => {
    const query = layerSearch.trim().toLowerCase()
    return themeOptions.map(option => {
      const allItems = themeLibraries[option.value]
        .flatMap(group => group.items.map(item => ({ ...item, section: group.name })))
        .filter(item => item.id !== 'title')
      const items = allItems.filter(item => !query || `${item.label} ${item.section} ${option.label}`.toLowerCase().includes(query))
      return { ...option, allItems, items }
    }).filter(group => group.items.length)
  }, [layerSearch])

  const mp4Type = useMemo(() => {
    if (typeof MediaRecorder === 'undefined') return ''
    const candidates = exportQuality === 'maximum' && Number(exportFps) >= 90 ? MP4_4K_90_TYPES : MP4_TYPES
    return [...new Set(candidates)].find(type => MediaRecorder.isTypeSupported(type)) || ''
  }, [exportQuality, exportFps])
  const selectedDuration = useMemo(() => {
    const audioDuration = audioRef.current?.duration || 0
    if (durationMode === 'full') return Math.min(audioDuration, 300)
    return audioDuration ? Math.min(Number(durationMode), audioDuration) : Number(durationMode)
  }, [durationMode, audioFile])
  const lyricsLines = useMemo(() => parseLyrics(lyricsText), [lyricsText])
  const fixedPauseDuration = useMemo(() => lyricsLines.reduce((total, line) => total + (line.duration || 0), 0), [lyricsLines])

  useEffect(() => {
    if (!layerLibraryOpen) return undefined
    const previousOverflow = document.body.style.overflow
    const closeOnEscape = event => {
      if (event.key === 'Escape') setLayerLibraryOpen(false)
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [layerLibraryOpen])

  const insertLyricPause = () => {
    const cueTime = audioRef.current?.currentTime || 0
    const cue = `[${formatLyricTime(cueTime)}] [pause]`
    setLyricsText(current => {
      const lines = current.trimEnd() ? current.trimEnd().split(/\r?\n/) : []
      const insertAt = lines.findIndex(line => {
        const match = line.match(/^\s*\[(\d{1,3}):(\d{2}(?:\.\d{1,3})?)\]/)
        return match && Number(match[1]) * 60 + Number(match[2]) > cueTime
      })
      if (insertAt < 0) lines.push(cue)
      else lines.splice(insertAt, 0, cue)
      return `${lines.join('\n')}\n`
    })
  }

  const options = useMemo(() => ({
    fit, title, titleSize, color, glowColor, intensity, tint, centerX, centerY, layers, theme,
    lyricsEnabled, lyricsLines, lyricsSize, lyricsPosition, lyricsBackdrop, lyricsColor, lyricsFontFamily: lyricsFont.family,
  }), [fit, title, titleSize, color, glowColor, intensity, tint, centerX, centerY, layers, theme,
    lyricsEnabled, lyricsLines, lyricsSize, lyricsPosition, lyricsBackdrop, lyricsColor, lyricsFont.family])

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
    const renderFps = exporting ? Number(exportFps) : 0
    const useHighFrameTimer = renderFps > 60
    const frameInterval = useHighFrameTimer ? 1000 / renderFps : 0
    let renderTimer = 0
    let nextFrameAt = performance.now()
    const scheduleNextFrame = () => {
      if (!useHighFrameTimer) {
        frameRef.current = requestAnimationFrame(draw)
        return
      }
      const now = performance.now()
      if (nextFrameAt < now - frameInterval) nextFrameAt = now
      nextFrameAt += frameInterval
      renderTimer = window.setTimeout(() => draw(performance.now()), Math.max(0, nextFrameAt - performance.now()))
    }
    const draw = time => {
      const graph = audioGraphRef.current
      let frequencyData
      if (graph?.analyser) {
        frequencyData = graph.data
        graph.analyser.getByteFrequencyData(frequencyData)
      }
      drawComposition(ctx, videoRef.current, {
        ...options,
        playbackTime: audioRef.current?.currentTime || 0,
        playbackDuration: audioRef.current?.duration || 0,
      }, frequencyData, time)
      const layerPreviewCanvas = layerPreviewCanvasRef.current
      if (layerLibraryOpen && layerPreviewCanvas) {
        if (layerPreviewCanvas.width !== canvas.width || layerPreviewCanvas.height !== canvas.height) {
          layerPreviewCanvas.width = canvas.width
          layerPreviewCanvas.height = canvas.height
        }
        const layerPreviewContext = layerPreviewCanvas.getContext('2d')
        layerPreviewContext?.clearRect(0, 0, layerPreviewCanvas.width, layerPreviewCanvas.height)
        layerPreviewContext?.drawImage(canvas, 0, 0)
      }
      scheduleNextFrame()
    }
    scheduleNextFrame()
    return () => {
      cancelAnimationFrame(frameRef.current)
      window.clearTimeout(renderTimer)
    }
  }, [options, aspect, videoUrl, layerLibraryOpen, exporting, exportFps])

  useEffect(() => () => { if (videoUrl) URL.revokeObjectURL(videoUrl) }, [videoUrl])
  useEffect(() => () => { if (audioUrl) URL.revokeObjectURL(audioUrl) }, [audioUrl])
  useEffect(() => () => { if (result?.url) URL.revokeObjectURL(result.url) }, [result])
  useEffect(() => () => { audioGraphRef.current?.context?.close().catch(() => {}) }, [])
  useEffect(() => () => {
    if (lyricFontFaceRef.current) document.fonts.delete(lyricFontFaceRef.current)
  }, [])

  const importLyricFont = async event => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setLyricsFontError('')
    try {
      const loaded = await loadVisualizerFontFile(file)
      if (lyricFontFaceRef.current) document.fonts.delete(lyricFontFaceRef.current)
      lyricFontFaceRef.current = loaded.face
      setLyricsFont(loaded.font)
    } catch (fontError) {
      setLyricsFontError(fontError.message || 'This font could not be loaded.')
    }
  }

  const resetLyricFont = () => {
    if (lyricFontFaceRef.current) document.fonts.delete(lyricFontFaceRef.current)
    lyricFontFaceRef.current = null
    setLyricsFont(defaultLyricFont)
    setLyricsFontError('')
  }

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
    recordingDestination.channelCount = 2
    analyser.fftSize = 256
    analyser.smoothingTimeConstant = .78
    source.connect(analyser)
    analyser.connect(context.destination)
    // Keep recording audio on a dedicated branch. Routing it through the analyser
    // can be starved when a 4K canvas is rendering at a very high frame rate.
    source.connect(recordingDestination)
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
    const canvas = canvasRef.current
    const previewSize = canvasSize(aspect)
    const outputSize = exportCanvasSize(aspect, exportQuality)
    canvas.width = outputSize.width
    canvas.height = outputSize.height
    const restorePreviewResolution = () => {
      canvas.width = previewSize.width
      canvas.height = previewSize.height
    }
    const frameRate = Number(exportFps)
    const canvasStream = canvas.captureStream(frameRate)
    const recordingAudioTracks = graph.recordingDestination.stream.getAudioTracks()
    if (!recordingAudioTracks.length || recordingAudioTracks.every(track => track.readyState !== 'live')) {
      canvasStream.getTracks().forEach(track => track.stop())
      restorePreviewResolution()
      setError('The audio track was not ready for export. Press Preview once, then export again.')
      return
    }
    recordingAudioTracks.forEach(track => {
      track.enabled = true
      if ('contentHint' in track) track.contentHint = 'music'
      canvasStream.addTrack(track)
    })
    let recorder
    try {
      recorder = new MediaRecorder(canvasStream, {
        mimeType: mp4Type,
        videoBitsPerSecond: exportVideoBitrate(exportQuality, aspect, frameRate),
        audioBitsPerSecond: exportQuality === 'maximum' ? 320_000 : 256_000,
      })
    } catch (exportError) {
      canvasStream.getTracks().forEach(track => track.stop())
      restorePreviewResolution()
      setError(exportQuality === 'maximum'
        ? 'This device cannot encode 4K MP4. Choose High 1080p and export again.'
        : exportError.message || 'MP4 export could not start.')
      return
    }
    const chunks = []
    recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data) }
    recorder.onerror = event => {
      setError(event.error?.message || 'MP4 export failed.')
      setExporting(false)
      canvasStream.getTracks().forEach(track => track.stop())
      restorePreviewResolution()
    }
    recorder.onstop = () => {
      if (exportCancelledRef.current) {
        setExporting(false)
        setExportProgress(0)
        setPlaying(false)
        videoRef.current?.pause()
        audioRef.current?.pause()
        canvasStream.getTracks().forEach(track => track.stop())
        restorePreviewResolution()
        return
      }
      const blob = new Blob(chunks, { type: recorder.mimeType || 'video/mp4' })
      if (result?.url) URL.revokeObjectURL(result.url)
      setResult({ blob, url: URL.createObjectURL(blob), duration, width: outputSize.width, height: outputSize.height, quality: exportQuality, fps: frameRate })
      setExporting(false)
      setExportProgress(100)
      setPlaying(false)
      videoRef.current?.pause()
      audioRef.current?.pause()
      canvasStream.getTracks().forEach(track => track.stop())
      restorePreviewResolution()
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
    // Smaller chunks keep the browser from buffering a huge 4K/90 FPS segment
    // and dropping the much smaller audio stream under encoder pressure.
    recorder.start(250)
    await videoRef.current.play()
    await audioRef.current.play()
    setPlaying(true)
    let lastProgressPaint = -Infinity
    const monitor = now => {
      const elapsed = audioRef.current?.currentTime || 0
      if (now - lastProgressPaint >= 200) {
        setExportProgress(Math.min(100, (elapsed / duration) * 100))
        lastProgressPaint = now
      }
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

  const setThemeGroupLayers = (items, selected) => {
    const groupIds = items.map(item => item.id)
    const groupIdSet = new Set(groupIds)
    setThemeLayerSelections(current => ({
      ...current,
      [theme]: selected
        ? [...new Set([...current[theme], ...groupIds])]
        : current[theme].filter(item => !groupIdSet.has(item)),
    }))
  }

  const changeTheme = value => {
    setTheme(value)
    if (!preserveColors) {
      setColor(themePresets[value].color)
      setGlowColor(themePresets[value].glow)
    }
    setTint(themePresets[value].tint)
  }

  const togglePreserveColors = () => {
    if (preserveColors) {
      setColor(themePresets[theme].color)
      setGlowColor(themePresets[theme].glow)
    }
    setPreserveColors(value => !value)
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
          <button type="button" className="music-open-layer-browser" onClick={() => setLayerLibraryOpen(true)}><Layers3 size={16}/><span><strong>All theme layers</strong><small>Mix visual layers from every theme</small></span><Plus size={16}/></button>
          <div className="music-layer-library">
            {layerGroups.map(group => <section key={group.name}><header><span>{group.name}</span><small>{group.items.filter(item => layers.includes(item.id)).length}/{group.items.length}</small></header><div>{group.items.map(item => <button type="button" key={item.id} className={layers.includes(item.id) ? 'active' : ''} aria-pressed={layers.includes(item.id)} onClick={() => toggleLayer(item.id)}><i className={`music-layer-preview ${item.preview}`}/><span><strong>{item.label}</strong><small>{layers.includes(item.id) ? 'Added to canvas' : 'Click to add'}</small></span><b style={layers.includes(item.id) ? undefined : { background: 'transparent' }}>{layers.includes(item.id) && <Check size={11}/>}</b></button>)}</div></section>)}
          </div>
          <label className="music-text-field">Title text<input value={title} maxLength={32} onChange={event => setTitle(event.target.value)} placeholder="Your title"/></label>
          <label className="music-range-field"><span>Title size <output>{titleSize}%</output></span><input type="range" min="4" max="13" value={titleSize} onChange={event => setTitleSize(Number(event.target.value))}/></label>
          <section className={`music-lyrics-panel ${lyricsEnabled ? 'enabled' : ''}`}>
            <header><span><Captions size={16}/><strong>Song lyrics</strong></span><button type="button" role="switch" aria-label="Show song lyrics" aria-checked={lyricsEnabled} onClick={() => setLyricsEnabled(value => !value)}><i/></button></header>
            <p>Put <code>[02:00]</code> on its own line to pause automatic lyrics for 2 seconds. For exact timing, use <code>[00:42.00] [pause]</code>.</p>
            <label>Lyrics<textarea value={lyricsText} disabled={!lyricsEnabled} onChange={event => setLyricsText(event.target.value)} placeholder={'First lyric line\nNext lyric line\n[02:00]\nLyrics return after 2 seconds'}/></label>
            <div className="music-lyrics-actions"><button type="button" disabled={!lyricsEnabled || !audioFile} onClick={insertLyricPause}><Pause size={14}/> Add pause at {formatTime(audioRef.current?.currentTime || 0)}</button><small>Play or seek to the instrumental start first. The next timestamped lyric resumes the overlay.</small></div>
            <div className="music-lyrics-count"><span>{lyricsLines.length ? `${lyricsLines.filter(line => !line.pause).length} lyric line${lyricsLines.filter(line => !line.pause).length === 1 ? '' : 's'} · ${lyricsLines.filter(line => line.pause).length} pause${lyricsLines.filter(line => line.pause).length === 1 ? '' : 's'}${fixedPauseDuration ? ` · ${fixedPauseDuration.toFixed(2).replace(/\.00$/, '')}s fixed` : ''}` : 'No lyrics added'}</span><small>{lyricsLines.some(line => Number.isFinite(line.time)) ? 'Timestamped timing' : 'Automatic timing'}</small></div>
            <div className={`music-lyrics-appearance ${lyricsEnabled ? '' : 'disabled'}`}>
              <div className="music-lyrics-font"><span><small>Lyric font</small><strong style={{ fontFamily: lyricsFont.family }}>{lyricsFont.label}</strong></span><div><button type="button" disabled={!lyricsEnabled} onClick={() => lyricFontInputRef.current?.click()}><Upload size={13}/>{lyricsFont.custom ? 'Replace' : 'Import font'}</button>{lyricsFont.custom && <button type="button" disabled={!lyricsEnabled} className="remove" aria-label="Remove imported lyric font" onClick={resetLyricFont}><X size={13}/></button>}</div><input ref={lyricFontInputRef} type="file" hidden accept=".ttf,.otf,.woff,.woff2,font/ttf,font/otf,font/woff,font/woff2" onChange={importLyricFont}/></div>
              {lyricsFontError && <small className="music-lyrics-font-error" role="alert">{lyricsFontError}</small>}
              <div className="music-lyrics-colour"><header><span>Text colour</span><code>{lyricsColor}</code></header><div className="music-lyrics-swatches">{lyricColourPresets.map(colour => <button type="button" key={colour} disabled={!lyricsEnabled} aria-label={`Use lyric colour ${colour}`} aria-pressed={lyricsColor === colour} className={lyricsColor === colour ? 'active' : ''} style={{ background: colour }} onClick={() => setLyricsColor(colour)}>{lyricsColor === colour && <Check size={12}/>}</button>)}<label className="music-lyrics-custom-colour"><input type="color" aria-label="Choose custom lyric colour" disabled={!lyricsEnabled} value={lyricsColor} onChange={event => setLyricsColor(event.target.value)}/><span>Custom</span></label></div></div>
            </div>
            <label className="music-range-field"><span>Text size <output>{lyricsSize}%</output></span><input disabled={!lyricsEnabled} type="range" min="2.5" max="8" step=".1" value={lyricsSize} onChange={event => setLyricsSize(Number(event.target.value))}/></label>
            <label className="music-range-field"><span>Vertical position <output>{lyricsPosition}%</output></span><input disabled={!lyricsEnabled} type="range" min="55" max="90" value={lyricsPosition} onChange={event => setLyricsPosition(Number(event.target.value))}/></label>
            <label className="music-range-field"><span>Backdrop <output>{lyricsBackdrop}%</output></span><input disabled={!lyricsEnabled} type="range" min="0" max="90" value={lyricsBackdrop} onChange={event => setLyricsBackdrop(Number(event.target.value))}/></label>
          </section>
          <label className="music-range-field"><span>Beat movement <output>{intensity}%</output></span><input type="range" min="20" max="120" value={intensity} onChange={event => setIntensity(Number(event.target.value))}/></label>
          <label className="music-range-field"><span>Video tint <output>{tint}%</output></span><input type="range" min="0" max="55" value={tint} onChange={event => setTint(Number(event.target.value))}/></label>
          <div className={`music-colour-lock ${preserveColors ? 'enabled' : ''}`}><span><LockKeyhole size={16}/><span><strong>Keep colours across themes</strong><small>{preserveColors ? 'Your Primary and Glow colours will stay selected.' : 'Each theme uses its recommended colour pair.'}</small></span></span><button type="button" role="switch" aria-label="Keep selected colours when changing themes" aria-checked={preserveColors} onClick={togglePreserveColors}><i/></button></div>
          <div className="music-colors"><label>Primary colour<span><input type="color" value={color} onChange={event => setColor(event.target.value)}/>{color}</span></label><label>Glow colour<span><input type="color" value={glowColor} onChange={event => setGlowColor(event.target.value)}/>{glowColor}</span></label></div>
        </div>

        <details className="music-positioning">
          <summary>Position and output</summary>
          <label className="music-range-field"><span>Horizontal <output>{centerX}%</output></span><input type="range" min="18" max="82" value={centerX} onChange={event => setCenterX(Number(event.target.value))}/></label>
          <label className="music-range-field"><span>Vertical <output>{centerY}%</output></span><input type="range" min="18" max="82" value={centerY} onChange={event => setCenterY(Number(event.target.value))}/></label>
          <FlowSelect label="Canvas size" value={aspect} options={aspectOptions} onChange={setAspect}/>
          <FlowSelect label="Export quality" value={exportQuality} options={exportQualityOptions} onChange={setExportQuality}/>
          <FlowSelect label="Animation smoothness" value={exportFps} options={exportFrameRateOptions} onChange={setExportFps}/>
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
        {result && <div className="music-result"><span><Check size={18}/></span><div><strong>High-quality MP4 is ready</strong><small>{result.width} × {result.height} · {result.fps || 30} FPS · {formatTime(result.duration)} · {formatBytes(result.blob.size)}</small></div><button type="button" onClick={downloadResult}><Download size={16}/> Download MP4</button></div>}
        <div className="music-export-bar"><div><span className={mp4Type ? 'supported' : 'unsupported'}>{mp4Type ? <Check size={15}/> : <CircleAlert size={15}/>}</span><span><strong>{mp4Type ? exportQuality === 'maximum' ? `Maximum-quality 4K · ${exportFps} FPS` : `Full-resolution MP4 · ${exportFps} FPS` : 'MP4 export is not supported here'}</strong><small>{mp4Type ? exportQuality === 'maximum' ? `${exportFps === '90' ? 'Up to 72' : exportFps === '60' ? 'Up to 60' : 'Up to 48'} Mbps video with 320 kbps audio. 1080p is smoother on slower devices.` : exportQuality === 'standard' ? `720p ${exportFps} FPS video with 256 kbps audio.` : `1080p high-bitrate ${exportFps} FPS video with 256 kbps audio.` : 'Use the latest Chrome or Edge desktop browser.'}</small></span></div><button type="button" disabled={exporting || !mp4Type} onClick={exportMp4}><Download size={17}/> {exporting ? 'Exporting…' : 'Export MP4'}</button></div>
      </section>
    </section>

    {layerLibraryOpen && <div className="music-layer-browser-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setLayerLibraryOpen(false) }}><section className="music-layer-browser" role="dialog" aria-modal="true" aria-labelledby="all-layer-title">
      <header><div><span><Layers3 size={21}/></span><div><small>GLOBAL LAYER LIBRARY</small><h2 id="all-layer-title">Mix layers from every theme</h2><p>Layers are added to <strong>{themeOptions.find(option => option.value === theme)?.label}</strong> without changing its base theme.</p></div></div><button type="button" aria-label="Close all theme layers" onClick={() => setLayerLibraryOpen(false)}><X size={20}/></button></header>
      <div className="music-layer-browser-body"><div className="music-layer-browser-list"><label className="music-layer-search"><Search size={17}/><input autoFocus value={layerSearch} onChange={event => setLayerSearch(event.target.value)} placeholder="Search waves, particles, rings, grids…"/><span>{allLayerGroups.reduce((count, group) => count + group.items.length, 0)} layers</span></label>
        <div className="music-all-layer-groups">{allLayerGroups.map(group => {
          const selectedCount = group.allItems.filter(item => layers.includes(item.id)).length
          const allSelected = selectedCount === group.allItems.length
          const noneSelected = selectedCount === 0
          return <section key={group.value}><header><div><i style={{ '--group-a': themePresets[group.value].color, '--group-b': themePresets[group.value].glow }}/><span><strong>{group.label}</strong><small>{group.description}</small></span></div><div className="music-layer-group-actions"><small>{selectedCount}/{group.allItems.length} added</small><div><button type="button" disabled={allSelected} onClick={() => setThemeGroupLayers(group.allItems, true)} aria-label={`Select all ${group.label} layers`}>Select all</button><button type="button" disabled={noneSelected} onClick={() => setThemeGroupLayers(group.allItems, false)} aria-label={`Deselect all ${group.label} layers`}>Deselect all</button></div></div></header><div>{group.items.map(item => {
            const selected = layers.includes(item.id)
            return <button type="button" key={`${group.value}-${item.id}`} className={selected ? 'selected' : ''} aria-pressed={selected} onClick={() => toggleLayer(item.id)}><i className={`music-layer-preview ${item.preview}`}/><span><strong>{item.label}</strong><small>{group.label} · {item.section}</small></span><b>{selected ? <Check size={13}/> : <Plus size={13}/>}</b></button>
          })}</div></section>
        })}</div>
        {!allLayerGroups.length && <div className="music-layer-empty"><Search size={24}/><strong>No matching layers</strong><p>Try another layer name or theme.</p></div>}
      </div><aside className="music-layer-live-preview"><header><span><small>LIVE COMPOSITION</small><strong>{themeOptions.find(option => option.value === theme)?.label}</strong></span><b>{layers.filter(id => id !== 'title').length} layers</b></header><div className={`music-layer-preview-canvas ${aspect}`}><canvas ref={layerPreviewCanvasRef}/>{!videoFile && !audioFile && <span>Theme preview · add media anytime</span>}</div><p>Select or deselect any layer—the preview updates instantly.</p></aside></div>
      <footer><span><strong>{layers.filter(id => id !== 'title').length}</strong> visual layers selected for this composition</span><button type="button" onClick={() => setLayerLibraryOpen(false)}>Done mixing</button></footer>
    </section></div>}

    <video ref={videoRef} src={videoUrl || undefined} muted playsInline loop className="music-hidden-media"/>
    <audio ref={audioRef} src={audioUrl || undefined} className="music-hidden-media" onTimeUpdate={event => setProgress(event.currentTarget.duration ? (event.currentTarget.currentTime / event.currentTarget.duration) * 100 : 0)} onEnded={() => setPlaying(false)}/>
  </main>
}
