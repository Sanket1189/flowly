import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { seoPages } from './src/seo.js'

function repositoryDetails() {
  const [owner = '', repository = ''] = (process.env.GITHUB_REPOSITORY || '').split('/')
  return {
    owner,
    repository,
    isUserSite: repository.toLowerCase() === `${owner.toLowerCase()}.github.io`,
  }
}

function normalizeBase(value) {
  if (!value || value === '/') return '/'
  return `/${value.replace(/^\/+|\/+$/g, '')}/`
}

const repository = repositoryDetails()
const base = normalizeBase(
  process.env.VITE_BASE_PATH
    || (process.env.GITHUB_ACTIONS === 'true' && repository.repository && !repository.isUserSite
      ? repository.repository
      : '/'),
)

const githubSiteUrl = repository.owner && repository.repository
  ? `https://${repository.owner.toLowerCase()}.github.io${repository.isUserSite ? '' : `/${repository.repository}`}`
  : 'http://127.0.0.1:5173'
const siteUrl = (process.env.VITE_SITE_URL || githubSiteUrl).replace(/\/$/, '')
const pageUrl = page => `${siteUrl}${page.path === '/' ? '/' : page.path}`
const pageSchema = page => page.type === 'utility' ? {
  '@context': 'https://schema.org', '@type': 'WebApplication', name: page.heading, url: pageUrl(page), description: page.description,
  applicationCategory: 'UtilitiesApplication', operatingSystem: 'Any', offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
} : { '@context': 'https://schema.org', '@type': 'WebSite', name: 'Flowly', url: pageUrl(page), description: page.description }

function renderPageMetadata(html, page) {
  return html
    .replace(/<title>[^<]*<\/title>/, `<title>${page.title}</title>`)
    .replace(/<meta name="description" content="[^"]*"\s*\/?>/, `<meta name="description" content="${page.description}" />`)
    .replace(/<meta property="og:title" content="[^"]*"\s*\/?>/, `<meta property="og:title" content="${page.title}" />`)
    .replace(/<meta property="og:description" content="[^"]*"\s*\/?>/, `<meta property="og:description" content="${page.description}" />`)
    .replace(/<meta property="og:url" content="[^"]*"\s*\/?>/, `<meta property="og:url" content="${pageUrl(page)}" />`)
    .replace(/<meta name="twitter:title" content="[^"]*"\s*\/?>/, `<meta name="twitter:title" content="${page.title}" />`)
    .replace(/<meta name="twitter:description" content="[^"]*"\s*\/?>/, `<meta name="twitter:description" content="${page.description}" />`)
    .replace(/<link rel="canonical" href="[^"]*"\s*\/?>/, `<link rel="canonical" href="${pageUrl(page)}" />`)
    .replace(/<script id="flowly-page-schema" type="application\/ld\+json">.*?<\/script>/s, `<script id="flowly-page-schema" type="application/ld+json">${JSON.stringify(pageSchema(page))}</script>`)
}

export default defineConfig({
  base,
  plugins: [
    react(),
    {
      name: 'flowly-social-metadata',
      transformIndexHtml(html) {
        const { title, description } = seoPages.home
        const imageUrl = `${siteUrl}/social-preview.png`

        return html.replace(
          '</head>',
          `    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Flowly" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:url" content="${siteUrl}/" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="627" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${imageUrl}" />
    <link rel="canonical" href="${pageUrl(seoPages.home)}" />
    <script id="flowly-page-schema" type="application/ld+json">${JSON.stringify(pageSchema(seoPages.home))}</script>
  </head>`,
        )
      },
      async closeBundle() {
        const outputRoot = resolve(process.cwd(), 'dist')
        const indexPath = resolve(outputRoot, 'index.html')
        const rootHtml = await readFile(indexPath, 'utf8')
        await writeFile(indexPath, renderPageMetadata(rootHtml, seoPages.home))
        const routedPages = Object.values(seoPages).filter(page => page.path !== '/')
        for (const page of routedPages) {
          const outputPath = resolve(outputRoot, page.path.replace(/^\//, ''), 'index.html')
          await mkdir(dirname(outputPath), { recursive: true })
          await writeFile(outputPath, renderPageMetadata(rootHtml, page))
        }
        const urls = Object.values(seoPages).map(page => `  <url><loc>${pageUrl(page)}</loc></url>`).join('\n')
        await writeFile(resolve(outputRoot, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`)
        await writeFile(resolve(outputRoot, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n`)
      },
    },
  ],
})
