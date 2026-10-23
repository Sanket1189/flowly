import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight, ArrowUpRight, BookOpenCheck, Braces, BriefcaseBusiness, CalendarHeart,
  Check, ChevronRight, Dumbbell, FileJson2, FilePenLine, HeartHandshake, Home, IndianRupee, LifeBuoy, ListChecks, Menu, Plane, Search, ShieldCheck, Sparkles,
  WalletCards, X,
} from 'lucide-react'
import MedicalSite from './MedicalSite.jsx'
import HomeServicesSite from './HomeServicesSite.jsx'
import { CareerSite, FitnessSite, MoneySite, TravelSite } from './JourneySites.jsx'
import { RoutineBuilder, StudyPlanner } from './PlannerTools.jsx'
import PdfMaker from './PdfMaker.jsx'
import JsonDiffChecker from './JsonDiffChecker.jsx'
import JsonFormatter from './JsonFormatter.jsx'
import { cleanUrlHash, currentRoutePath, handleSectionLink, navigateTo, routeUrl, scrollToSection } from './navigation.js'
import { applySeoPage } from './seo.js'
import './ui-polish.css'

const workflows = [
  { id: 'travel', category: 'Travel', title: 'Trip planner', description: 'Build your own day-by-day itinerary, add times and places, then download the finished plan.', icon: Plane, tone: 'blue', tag: 'Ready to use', availability: 'ready', featured: true },
  { id: 'finance', category: 'Finance', title: 'Money planning', description: 'Create a personal plan for saving, spending, and your next big milestone by yourself.', icon: WalletCards, tone: 'lime', tag: 'Ready to use', availability: 'ready' },
  { id: 'study', category: 'Education', title: 'Study planner', description: 'Start with a suggested seven-day schedule, then customise every subject, session and duration.', icon: BookOpenCheck, tone: 'lilac', tag: 'Ready to use', availability: 'ready' },
  { id: 'routine', category: 'Life', title: 'Daily routine builder', description: 'Build different routines for weekdays, weekends or custom day groups, then export one weekly PDF.', icon: ListChecks, tone: 'peach', tag: 'Ready to use', availability: 'ready' },
  { id: 'medical', category: 'Health', title: 'Medical booking', description: 'Explore a polished doctor-discovery and appointment-booking experience.', icon: CalendarHeart, tone: 'sage', tag: 'Provider demo', availability: 'demo' },
  { id: 'home', category: 'Home', title: 'Home services', description: 'Preview a marketplace experience for finding and booking trusted home professionals.', icon: Home, tone: 'sand', tag: 'Provider demo', availability: 'demo' },
  { id: 'fitness', category: 'Health', title: 'Fitness coaching', description: 'Preview a guided flow for choosing a goal and finding the right fitness coach.', icon: Dumbbell, tone: 'lilac', tag: 'Provider demo', availability: 'demo' },
  { id: 'career', category: 'Work', title: 'Career mentor', description: 'Preview a focused experience for finding support with roles, interviews, and career decisions.', icon: BriefcaseBusiness, tone: 'peach', tag: 'Provider demo', availability: 'demo' },
]

const utilities = [
  { id: 'pdf-maker', category: 'Utilities', title: 'PDF maker', description: 'Build polished PDFs with text, tables, colours, alignment and shapes—entirely in your browser.', icon: FilePenLine, tone: 'lime', tag: 'Browser utility', availability: 'utility' },
  { id: 'json-diff', category: 'Utilities', title: 'JSON diff checker', description: 'Validate and compare two JSON documents, then inspect every nested change by its exact path.', icon: FileJson2, tone: 'blue', tag: 'Browser utility', availability: 'utility' },
  { id: 'json-formatter', category: 'Utilities', title: 'JSON formatter', description: 'Validate, beautify, sort or minify JSON, then copy or download the clean result.', icon: Braces, tone: 'peach', tag: 'Browser utility', availability: 'utility' },
]

const catalog = [...workflows, ...utilities]

const filters = ['All workflows', 'Utilities', 'Health', 'Home', 'Travel', 'Finance', 'Education', 'Life', 'Work']
const workflowPaths = { medical: '/medical', home: '/home-services', travel: '/trip-planner', fitness: '/fitness-coaching', finance: '/money-planning', career: '/career-mentor', study: '/study-planner', routine: '/daily-routine', 'pdf-maker': '/utilities/pdf-maker', 'json-diff': '/utilities/json-diff', 'json-formatter': '/utilities/json-formatter' }
const donationUpiId = import.meta.env.VITE_DONATION_UPI_ID || ''
const donationUrl = import.meta.env.VITE_DONATION_URL || ''

function Logo() {
  return <a className="logo" href={routeUrl('/')} onClick={(event) => handleSectionLink(event, 'top')} aria-label="Flowly home"><span className="logo-mark"><span /></span><span>flowly.</span></a>
}

function InfoDialog({ type, onClose, onBrowse }) {
  const privacy = type === 'privacy'
  const Icon = privacy ? ShieldCheck : LifeBuoy
  const items = privacy ? [
    ['Browser-only planning', 'The self-service tools work in your browser. Flowly does not send your entries to a server.'],
    ['No account required', 'You can explore and build plans without signing in or creating a profile.'],
    ['Your downloads', 'PDFs are generated for you to save locally. You control where those files go.'],
  ] : [
    ['Choose the closest flow', 'Start on the homepage and select the tool that best matches what you want to do.'],
    ['Adjust everything', 'Use the edit controls inside each tool—your first result is always a starting point.'],
    ['Having trouble downloading?', 'Allow browser downloads, then try again. Your plan remains editable on the current page.'],
  ]
  return <div className="info-dialog-backdrop" onMouseDown={event => event.target === event.currentTarget && onClose()}><section className={`info-dialog ${privacy ? 'privacy' : 'support'}`} role="dialog" aria-modal="true" aria-labelledby="info-dialog-title"><header><span><Icon size={22}/></span><button onClick={onClose} aria-label={`Close ${privacy ? 'privacy' : 'support'} dialog`}><X size={18}/></button></header><div className="info-dialog-copy"><small>{privacy ? 'PRIVACY AT FLOWLY' : 'FLOWLY SUPPORT'}</small><h2 id="info-dialog-title">{privacy ? 'Your plans stay yours.' : 'A little help, right here.'}</h2><p>{privacy ? 'Flowly is currently a frontend-only portal designed for private, self-directed planning.' : 'These tools are designed to be simple, but here are the quickest ways to get unstuck.'}</p></div><div className="info-dialog-list">{items.map(([title, text], index) => <article key={title}><b>{String(index + 1).padStart(2, '0')}</b><div><h3>{title}</h3><p>{text}</p></div></article>)}</div><footer><button className="dialog-secondary" onClick={onClose}>Close</button><button className="dialog-primary" onClick={onBrowse}>{privacy ? 'Explore tools' : 'Browse workflows'} <ArrowRight size={16}/></button></footer></section></div>
}

function DonationDialog({ amount, setAmount, customAmount, setCustomAmount, onClose }) {
  const configured = Boolean(donationUpiId || donationUrl)
  const finalAmount = amount === 'custom' ? Number(customAmount) || 0 : Number(amount)
  const donate = () => {
    if (!configured || finalAmount <= 0) return
    if (donationUrl) { window.open(donationUrl, '_blank', 'noopener,noreferrer'); return }
    const params = new URLSearchParams({ pa: donationUpiId, pn: 'Flowly creator', am: String(finalAmount), cu: 'INR', tn: 'Supporting Flowly' })
    window.location.href = `upi://pay?${params.toString()}`
  }
  return <div className="info-dialog-backdrop" onMouseDown={event => event.target === event.currentTarget && onClose()}><section className="donation-dialog" role="dialog" aria-modal="true" aria-labelledby="donation-dialog-title"><header><span><HeartHandshake size={23}/></span><button onClick={onClose} aria-label="Close donation dialog"><X size={18}/></button></header><div className="donation-copy"><small>SUPPORT THE CREATOR</small><h2 id="donation-dialog-title">Buy me a T-shirt.</h2><p>If Flowly made something feel simpler, you can help me keep improving it.</p></div><div className="donation-amounts" role="group" aria-label="Choose donation amount">{[99,199,499].map(value => <button className={amount === value ? 'active' : ''} onClick={() => setAmount(value)} key={value}><IndianRupee size={14}/>{value}</button>)}<button className={amount === 'custom' ? 'active' : ''} onClick={() => setAmount('custom')}>Custom</button></div>{amount === 'custom' && <label className="custom-donation">Enter amount<div><IndianRupee size={15}/><input type="number" min="1" value={customAmount} onChange={event => setCustomAmount(event.target.value)} placeholder="250"/></div></label>}<div className={configured ? 'donation-note configured' : 'donation-note'}><ShieldCheck size={16}/><span>{configured ? 'Your payment app will open securely. Flowly never sees your payment details.' : 'Payment destination is ready to connect. Add a UPI ID or donation URL to enable payments.'}</span></div><footer><button className="dialog-secondary" onClick={onClose}>Maybe later</button><button className="donate-action" disabled={!configured || finalAmount <= 0} onClick={donate}>{configured ? `Donate ₹${finalAmount}` : 'Payment details needed'} <ArrowRight size={16}/></button></footer></section></div>
}

function App() {
  const [filter, setFilter] = useState('All workflows')
  const [query, setQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const [infoDialog, setInfoDialog] = useState(null)
  const [donationOpen, setDonationOpen] = useState(false)
  const [donationAmount, setDonationAmount] = useState(199)
  const [customDonation, setCustomDonation] = useState('')
  const resolvePath = () => ({ '/medical': 'medical', '/home-services': 'home', '/trip-planner': 'travel', '/fitness-coaching': 'fitness', '/money-planning': 'finance', '/career-mentor': 'career', '/study-planner': 'study', '/daily-routine': 'routine', '/utilities/pdf-maker': 'pdf-maker', '/utilities/json-diff': 'json-diff', '/utilities/json-formatter': 'json-formatter' }[currentRoutePath()] || null)
  const [activeWorkflow, setActiveWorkflow] = useState(resolvePath)

  useEffect(() => {
    cleanUrlHash()
    const syncRoute = () => { cleanUrlHash(); setActiveWorkflow(resolvePath()) }
    window.addEventListener('popstate', syncRoute)
    return () => window.removeEventListener('popstate', syncRoute)
  }, [])

  useEffect(() => { applySeoPage(activeWorkflow || 'home') }, [activeWorkflow])

  useEffect(() => {
    if (!infoDialog && !donationOpen) return undefined
    const closeOnEscape = event => { if (event.key === 'Escape') { setInfoDialog(null); setDonationOpen(false) } }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', closeOnEscape)
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener('keydown', closeOnEscape) }
  }, [infoDialog, donationOpen])

  const visible = useMemo(() => catalog.filter((item) => {
    const matchesFilter = filter === 'All workflows' || item.category === filter
    const matchesQuery = `${item.title} ${item.description} ${item.category}`.toLowerCase().includes(query.toLowerCase())
    return matchesFilter && matchesQuery
  }), [filter, query])
  const searchMatches = useMemo(() => query.trim() ? catalog.filter(item => `${item.title} ${item.description} ${item.category}`.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 5) : [], [query])

  const launch = (item) => {
    if (item.id === 'medical') {
      navigateTo('/medical')
      setActiveWorkflow('medical')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    if (item.id === 'home') {
      navigateTo('/home-services')
      setActiveWorkflow('home')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    if (workflowPaths[item.id]) {
      navigateTo(workflowPaths[item.id])
      setActiveWorkflow(item.id)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    setNotice(`${item.title} workflow selected — this experience is ready to build next.`)
    window.setTimeout(() => setNotice(''), 4500)
  }
  const runSearch = () => searchMatches.length ? launch(searchMatches[0]) : scrollToSection('workflows')

  const readyWorkflows = visible.filter((item) => item.availability === 'ready')
  const demoWorkflows = visible.filter((item) => item.availability === 'demo')
  const utilityWorkflows = visible.filter((item) => item.availability === 'utility')

  const renderWorkflowCard = (item) => {
    const Icon = item.icon
    const isReady = item.availability !== 'demo'
    const actionLabel = item.availability === 'utility' ? 'Open utility' : isReady ? 'Use this tool' : 'View UI demo'
    return <article className={`workflow-card flow-${item.id} ${item.featured ? 'featured' : ''}`} key={item.id}>
      <div className="card-head"><span className={`workflow-icon ${item.tone}`}><Icon size={24} /></span></div>
      <div className="card-meta"><span className="card-tag">{item.tag}</span><span className={`availability-badge ${isReady ? 'ready' : 'demo'}`}>{isReady ? 'Works now' : 'UI concept'}</span></div>
      <h3>{item.title}</h3><p>{item.description}</p>
      {item.featured && <div className="mini-flow"><span className="mini-step done"><Check size={13} /> Set the trip</span><ChevronRight size={13} /><span className="mini-step active">Plan each day</span><ChevronRight size={13} /><span className="mini-step">Download PDF</span></div>}
      {workflowPaths[item.id] ? <a className="card-action" href={routeUrl(workflowPaths[item.id])} onClick={(event) => { event.preventDefault(); launch(item) }}>{actionLabel} <ArrowUpRight size={17} /></a> : <button className="card-action" onClick={() => launch(item)}>{actionLabel} <ArrowUpRight size={17} /></button>}
    </article>
  }

  if (activeWorkflow === 'medical') {
    return <MedicalSite onExit={() => { navigateTo('/'); setActiveWorkflow(null); window.scrollTo(0, 0) }} />
  }
  if (activeWorkflow === 'home') {
    return <HomeServicesSite onExit={() => { navigateTo('/'); setActiveWorkflow(null); window.scrollTo(0, 0) }} />
  }
  const leaveSite = () => { navigateTo('/'); setActiveWorkflow(null); window.scrollTo(0, 0) }
  if (activeWorkflow === 'travel') return <TravelSite onExit={leaveSite} />
  if (activeWorkflow === 'fitness') return <FitnessSite onExit={leaveSite} />
  if (activeWorkflow === 'finance') return <MoneySite onExit={leaveSite} />
  if (activeWorkflow === 'career') return <CareerSite onExit={leaveSite} />
  if (activeWorkflow === 'study') return <StudyPlanner onExit={leaveSite} />
  if (activeWorkflow === 'routine') return <RoutineBuilder onExit={leaveSite} />
  if (activeWorkflow === 'pdf-maker') return <PdfMaker onExit={leaveSite} />
  if (activeWorkflow === 'json-diff') return <JsonDiffChecker onExit={leaveSite} />
  if (activeWorkflow === 'json-formatter') return <JsonFormatter onExit={leaveSite} />

  return (
    <main id="top">
      <header className="site-header shell">
        <Logo />
        <nav className={menuOpen ? 'nav-links open' : 'nav-links'}>
          <a href={routeUrl('/')} onClick={(event) => handleSectionLink(event, 'workflows', () => setMenuOpen(false))}>Workflows</a>
          <a href={routeUrl('/')} onClick={(event) => handleSectionLink(event, 'utilities', () => setMenuOpen(false))}>Utilities</a>
          <a href={routeUrl('/')} onClick={(event) => handleSectionLink(event, 'how', () => setMenuOpen(false))}>How it works</a>
          <a href={routeUrl('/')} onClick={(event) => handleSectionLink(event, 'about', () => setMenuOpen(false))}>About</a>
        </nav>
        <div className="header-actions"><button className="primary small" onClick={() => scrollToSection('workflows')}>Explore all <ArrowRight size={16} /></button></div>
        <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">{menuOpen ? <X /> : <Menu />}</button>
      </header>

      <section className="hero shell">
        <div className="hero-copy">
          <div className="eyebrow"><Sparkles size={14} /> One place for life’s next steps</div>
          <h1>Whatever’s next,<br /><em>there’s a flow for it.</em></h1>
          <p>Use practical planning tools right now, or explore polished UI concepts for services that would connect to real providers and regional data.</p>
          <div className="hero-search-wrap">
            <div className="hero-search">
              <Search size={20} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={event => event.key === 'Enter' && runSearch()} placeholder="What do you want to get done?" aria-label="Search workflows" autoComplete="off" />
              <button onClick={runSearch}>Find a flow <ArrowRight size={17} /></button>
            </div>
            {query.trim() && <div className="instant-search-results" aria-live="polite">{searchMatches.length ? <><div className="search-result-label"><span>Best matches</span><small>{searchMatches.length} found</small></div>{searchMatches.map(item => { const ResultIcon = item.icon; return <button key={item.id} onClick={() => launch(item)}><span className={`workflow-icon ${item.tone}`}><ResultIcon size={18}/></span><span><strong>{item.title}</strong><small>{item.category} · {item.availability === 'demo' ? 'UI concept' : item.availability === 'utility' ? 'Browser utility' : 'Ready to use'}</small></span><ArrowUpRight size={16}/></button> })}</> : <div className="instant-empty"><Search size={19}/><span><strong>No close match</strong><small>Try words like trip, money, study or PDF.</small></span></div>}</div>}
          </div>
          <div className="quick-links"><span>Try now:</span><button onClick={() => setQuery('trip')}>Plan a trip</button><button onClick={() => setQuery('money')}>Plan money</button><button onClick={() => setQuery('medical')}>View medical demo</button></div>
        </div>
        <div className="orbit-scene" aria-hidden="true">
          <div className="orbit orbit-a" /><div className="orbit orbit-b" />
          <div className="center-orb"><span className="logo-mark large"><span /></span><strong>Start here</strong><small>Choose your flow</small></div>
          <div className="float-icon medical"><CalendarHeart /></div><div className="float-icon house"><Home /></div>
          <div className="float-icon travel"><Plane /></div><div className="float-icon wallet"><WalletCards /></div>
          <div className="spark one">✦</div><div className="spark two">✦</div>
        </div>
      </section>

      <section className="trust-strip shell"><span>One thoughtful portal</span><strong>4</strong><small>planning tools</small><strong>3</strong><small>browser utilities</small><strong>4</strong><small>service UI demos</small></section>

      <section className="workflow-section shell" id="workflows">
        <div className="section-heading">
          <div><span className="section-kicker">THE FLOW LIBRARY</span><h2>Useful tools and<br />service UI concepts.</h2></div>
          <p>The first group works completely in your browser. The service demos show how provider-based products could feel once connected to accounts, location data, and a backend.</p>
        </div>
        <div className="filters" role="group" aria-label="Filter workflows">
          {filters.map((item) => <button key={item} className={filter === item ? 'active' : ''} onClick={() => setFilter(item)}>{item}</button>)}
        </div>
        {visible.length ? <div className="workflow-groups">
          {readyWorkflows.length > 0 && <section className="workflow-group ready-group" aria-labelledby="ready-tools-title">
            <div className="group-heading"><div><span className="group-dot ready" /><span>SELF-SERVICE TOOLS</span></div><h3 id="ready-tools-title">Use these right now</h3><div className="group-note ready"><span className="group-note-icon"><ShieldCheck size={18}/></span><span><strong>Private by default</strong><small>Plan instantly in your browser—no account needed.</small></span></div></div>
            <div className="workflow-grid">{readyWorkflows.map(renderWorkflowCard)}</div>
          </section>}
          {utilityWorkflows.length > 0 && <section className="workflow-group utility-group" id="utilities" aria-labelledby="utility-tools-title">
            <div className="group-heading"><div><span className="group-dot utility" /><span>FLOWLY UTILITIES</span></div><h3 id="utility-tools-title">Useful browser tools</h3><div className="group-note utility"><span className="group-note-icon"><FilePenLine size={18}/></span><span><strong>Made in your browser</strong><small>Work with files and data without uploading your content.</small></span></div></div>
            <div className="workflow-grid utility-grid">{utilityWorkflows.map(renderWorkflowCard)}</div>
          </section>}
          {demoWorkflows.length > 0 && <section className="workflow-group demo-group" aria-labelledby="demo-flows-title">
            <div className="group-heading"><div><span className="group-dot demo" /><span>SERVICE EXPERIENCE DEMOS</span></div><h3 id="demo-flows-title">Explore the interface</h3><div className="group-note demo"><span className="group-note-icon"><Sparkles size={18}/></span><span><strong>UI preview</strong><small>Explore the complete experience with sample provider data.</small></span></div></div>
            <div className="workflow-grid demo-grid">{demoWorkflows.map(renderWorkflowCard)}</div>
          </section>}
        </div> : <div className="empty-state"><Search size={30} /><h3>No flows found yet</h3><p>Try a broader search, or browse all workflows.</p><button onClick={() => { setQuery(''); setFilter('All workflows') }}>Show everything</button></div>}
      </section>

      <section className="how shell" id="how">
        <div className="how-copy"><span className="section-kicker">HOW FLOWLY WORKS</span><h2>Big tasks feel lighter<br />with a clear path.</h2><p>Each experience is built around one goal and strips away the usual friction. No clutter, no guessing—just the next useful step.</p></div>
        <div className="steps"><article><span>01</span><div><h3>Choose a workflow</h3><p>Start with the outcome you want.</p></div></article><article><span>02</span><div><h3>Share what matters</h3><p>Answer a few focused questions.</p></div></article><article><span>03</span><div><h3>Move forward</h3><p>Get a clear, personalized next step.</p></div></article></div>
      </section>

      <section className="cta shell" id="about"><div><span className="section-kicker">BUILT TO GROW WITH YOU</span><h2>One home for all<br />your everyday flows.</h2></div><div className="cta-actions"><button className="support-creator" onClick={() => setDonationOpen(true)}><HeartHandshake size={18}/> Support this project</button><button className="primary light" onClick={() => scrollToSection('workflows')}>Explore the library <ArrowRight size={18} /></button></div></section>
      <footer className="footer shell"><Logo /><p>Make the next step feel simple.</p><div><a href={routeUrl('/')} onClick={(event) => handleSectionLink(event, 'workflows')}>Workflows</a><a href={routeUrl('/')} onClick={(event) => handleSectionLink(event, 'utilities')}>Utilities</a><button onClick={() => setInfoDialog('privacy')}>Privacy</button><button onClick={() => setInfoDialog('support')}>Support</button></div><span>© 2026 Flowly</span></footer>
      {notice && <div className="toast"><Check size={18} /><span>{notice}</span><button onClick={() => setNotice('')}><X size={16} /></button></div>}
      {infoDialog && <InfoDialog type={infoDialog} onClose={() => setInfoDialog(null)} onBrowse={() => { setInfoDialog(null); window.setTimeout(() => scrollToSection('workflows'), 30) }}/>} 
      {donationOpen && <DonationDialog amount={donationAmount} setAmount={setDonationAmount} customAmount={customDonation} setCustomAmount={setCustomDonation} onClose={() => setDonationOpen(false)}/>} 
    </main>
  )
}

export default App
