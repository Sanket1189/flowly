export const seoPages = {
  home: {
    path: '/',
    title: 'Flowly — Free Browser Tools and Everyday Planners',
    description: 'Use free browser-based tools for PDFs, JSON, travel, budgeting, study planning and daily routines. No account required.',
    heading: 'Flowly',
    type: 'website',
  },
  utilities: {
    path: '/utilities',
    title: 'Free Online Browser Utilities | Flowly',
    description: 'Use Flowly’s free browser utilities for creating PDFs, comparing JSON and formatting JSON. No account or uploads required.',
    heading: 'Free Online Browser Utilities',
    type: 'collection',
  },
  'pdf-maker': {
    path: '/utilities/pdf-maker',
    title: 'Free Online PDF Maker | Flowly',
    description: 'Create polished PDFs online with text, tables, colours, shapes and flexible layouts. Works privately in your browser.',
    heading: 'Free Online PDF Maker',
    type: 'utility',
  },
  'json-diff': {
    path: '/utilities/json-diff',
    title: 'Visual JSON Diff Checker Online | Flowly',
    description: 'Compare two JSON documents side by side. Find changed, added and removed lines with a free visual JSON diff checker.',
    heading: 'Visual JSON Diff Checker',
    type: 'utility',
  },
  'json-formatter': {
    path: '/utilities/json-formatter',
    title: 'Free JSON Formatter and Validator | Flowly',
    description: 'Format, validate, sort and minify JSON online for free. Your JSON stays private and is processed entirely in your browser.',
    heading: 'Free JSON Formatter and Validator',
    type: 'utility',
  },
}

const setMeta = (selector, attribute, value) => {
  let element = document.head.querySelector(selector)
  if (!element) {
    element = document.createElement('meta')
    const [name, content] = selector.match(/meta\[([^=]+)="([^"]+)"\]/)?.slice(1) || []
    if (name) element.setAttribute(name, content)
    document.head.appendChild(element)
  }
  element.setAttribute(attribute, value)
}

export function applySeoPage(pageId = 'home') {
  const page = seoPages[pageId] || seoPages.home
  const base = import.meta.env.BASE_URL === '/' ? '' : import.meta.env.BASE_URL.replace(/\/$/, '')
  const canonical = `${window.location.origin}${base}${page.path === '/' ? '/' : page.path}`
  document.title = page.title
  setMeta('meta[name="description"]', 'content', page.description)
  setMeta('meta[property="og:title"]', 'content', page.title)
  setMeta('meta[property="og:description"]', 'content', page.description)
  setMeta('meta[property="og:url"]', 'content', canonical)
  setMeta('meta[name="twitter:title"]', 'content', page.title)
  setMeta('meta[name="twitter:description"]', 'content', page.description)
  let canonicalLink = document.head.querySelector('link[rel="canonical"]')
  if (!canonicalLink) { canonicalLink = document.createElement('link'); canonicalLink.rel = 'canonical'; document.head.appendChild(canonicalLink) }
  canonicalLink.href = canonical
  document.getElementById('flowly-page-schema')?.remove()
  const schema = document.createElement('script')
  schema.id = 'flowly-page-schema'
  schema.type = 'application/ld+json'
  schema.textContent = JSON.stringify(page.type === 'utility' ? {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: page.heading,
    url: canonical,
    description: page.description,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Any',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
  } : { '@context': 'https://schema.org', '@type': 'WebSite', name: 'Flowly', url: canonical, description: page.description })
  document.head.appendChild(schema)
}
