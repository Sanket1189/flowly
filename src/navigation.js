const basePrefix = import.meta.env.BASE_URL === '/'
  ? ''
  : import.meta.env.BASE_URL.replace(/\/$/, '')

export function routeUrl(path = '/') {
  const normalized = path === '/' ? '/' : `/${String(path).replace(/^\/+/, '')}`
  return normalized === '/' ? `${basePrefix}/` : `${basePrefix}${normalized}`
}

export function currentRoutePath(pathname = window.location.pathname) {
  const withoutBase = !basePrefix
    ? pathname || '/'
    : pathname === basePrefix || pathname === `${basePrefix}/`
      ? '/'
      : pathname.startsWith(`${basePrefix}/`)
        ? pathname.slice(basePrefix.length)
        : pathname
  return withoutBase.length > 1 ? withoutBase.replace(/\/+$/, '') : withoutBase
}

export function navigateTo(path, { replace = false } = {}) {
  window.history[replace ? 'replaceState' : 'pushState']({}, '', routeUrl(path))
}

export function cleanUrlHash() {
  if (!window.location.hash) return
  window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}`)
}

export function scrollToSection(id, behavior = 'smooth') {
  cleanUrlHash()
  if (!id || id === 'top') {
    window.scrollTo({ top: 0, behavior })
    return
  }
  document.getElementById(id)?.scrollIntoView({ behavior, block: 'start' })
}

export function handleSectionLink(event, id, after) {
  event.preventDefault()
  after?.()
  scrollToSection(id)
}
