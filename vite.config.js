import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

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
  ? `https://${repository.owner}.github.io${repository.isUserSite ? '' : `/${repository.repository}`}`
  : 'http://127.0.0.1:5173'
const siteUrl = (process.env.VITE_SITE_URL || githubSiteUrl).replace(/\/$/, '')

export default defineConfig({
  base,
  plugins: [
    react(),
    {
      name: 'flowly-social-metadata',
      transformIndexHtml(html) {
        const title = 'Flowly — Simple tools for everyday plans'
        const description = 'Plan trips, budgets, study weeks and daily routines in one private, browser-based portal.'
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
  </head>`,
        )
      },
    },
  ],
})
