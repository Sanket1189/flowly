import { useEffect, useState } from 'react'
import {
  ArrowLeft, ArrowRight, CalendarCheck, Check, HeartPulse, Menu, MessageCircle,
  Send, ShieldCheck, Sparkles, Star, Stethoscope, Video, X,
} from 'lucide-react'
import MedicalWorkflow from './MedicalWorkflow.jsx'
import AuthModal from './AuthModal.jsx'
import { handleSectionLink, routeUrl } from './navigation.js'
import './medical.css'
import './medical-site.css'

const services = [
  { id: 'general', title: 'Primary care', note: 'Checkups and everyday health', icon: HeartPulse, tone: 'green' },
  { id: 'specialist', title: 'Specialist care', note: 'Focused expert support', icon: Stethoscope, tone: 'peach' },
  { id: 'virtual', title: 'Virtual visits', note: 'Care from where you are', icon: Video, tone: 'blue' },
]

export default function MedicalSite({ onExit }) {
  const [booking, setBooking] = useState(null)
  const [menu, setMenu] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [chatText, setChatText] = useState('')
  const [messages, setMessages] = useState([{ from: 'carely', text: 'Hi! What can we help you with today?' }])
  useEffect(() => {
    document.title = 'Carely — Healthcare that feels human'
    return () => { document.title = "Flowly — There's a flow for it" }
  }, [])
  const startBooking = (options = {}) => setBooking(options)
  const sendMessage = (text = chatText) => {
    if (!text.trim()) return
    setMessages((current) => [...current, { from: 'you', text: text.trim() }, { from: 'carely', text: 'Thanks — a care guide will help with that. For this demo, you can continue by booking a visit.' }])
    setChatText('')
  }
  if (booking) return <MedicalWorkflow initialCare={booking.care} initialDoctor={booking.doctor} onExit={() => setBooking(null)} />

  return <main className="carely-site" id="carely-top">
    <header className="carely-header carely-shell">
      <button className="carely-return" onClick={onExit}><ArrowLeft size={16} /> Flowly</button>
      <a className="carely-logo" href={routeUrl('/medical')} onClick={(event)=>handleSectionLink(event,'carely-top')}><span><HeartPulse size={19} /></span>carely.</a>
      <nav id="carely-navigation" className={menu ? 'open' : ''}><a href={routeUrl('/medical')} onClick={(event) => handleSectionLink(event,'carely-care',()=>setMenu(false))}>Our care</a><a href={routeUrl('/medical')} onClick={(event) => handleSectionLink(event,'carely-doctors',()=>setMenu(false))}>Doctors</a><a href={routeUrl('/medical')} onClick={(event) => handleSectionLink(event,'carely-story',()=>setMenu(false))}>Why Carely</a></nav>
      <div className="carely-actions"><button className="carely-signin" onClick={() => setAuthOpen(true)}>Sign in</button><button className="carely-primary small" onClick={() => startBooking()}>Book a visit <ArrowRight size={15}/></button></div>
      <button className="carely-menu" aria-label={menu ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={menu} aria-controls="carely-navigation" onClick={() => setMenu(!menu)}>{menu ? <X/> : <Menu/>}</button>
    </header>

    <section className="carely-hero carely-shell">
      <div className="carely-hero-copy">
        <span className="carely-kicker"><Sparkles size={14}/> Thoughtful care, made simple</span>
        <h1>Healthcare that<br/><em>feels human.</em></h1>
        <p>Exceptional doctors, unrushed appointments, and a care experience designed around your real life.</p>
        <div className="carely-hero-actions"><button className="carely-primary" onClick={() => startBooking()}>Find your doctor <ArrowRight size={18}/></button><a href={routeUrl('/medical')} onClick={(event)=>handleSectionLink(event,'carely-story')}><span><Video size={16}/></span> See how it works</a></div>
        <div className="carely-trust"><div className="carely-faces"><span>AS</span><span>RM</span><span>MI</span></div><div><strong>4.9 <Star size={13} fill="currentColor"/></strong><small>Loved by 12,000+ patients</small></div></div>
      </div>
      <div className="carely-visual">
        <div className="carely-pulse one"/><div className="carely-pulse two"/>
        <div className="carely-doctor"><div className="head"/><div className="body"><span/></div></div>
        <div className="carely-available"><i/> Available today</div>
        <div className="carely-book-card"><div><span><CalendarCheck size={20}/></span><small>NEXT AVAILABLE</small></div><h3>Dr. Aanya Shah</h3><p>Family medicine · 4.9 ★</p><button onClick={() => startBooking({ doctor: 1 })}>Today, 10:30 AM <ArrowRight size={15}/></button><small><ShieldCheck size={13}/> Private and secure</small></div>
      </div>
    </section>

    <section className="carely-care carely-shell" id="carely-care">
      <div className="carely-section-head"><span>CARE FOR THE WHOLE YOU</span><h2>Start with what<br/>you need today.</h2><p>From everyday concerns to specialist support, your care stays thoughtfully connected.</p></div>
      <div className="carely-services">{services.map(({id,title,note,icon:Icon,tone})=><button key={title} onClick={()=>startBooking({ care: id })}><span className={tone}><Icon size={22}/></span><strong>{title}</strong><small>{note}</small><i><ArrowRight size={17}/></i></button>)}</div>
    </section>

    <section className="carely-feature carely-shell" id="carely-story">
      <div className="carely-feature-art"><div className="carely-note"><Check size={17}/><span><strong>Your care, connected</strong><small>One calm place for every visit</small></span></div></div>
      <div className="carely-feature-copy"><span className="carely-label">A BETTER CARE EXPERIENCE</span><h2>More listening.<br/><em>Less waiting.</em></h2><p>We give doctors time to understand the whole picture, then keep your visits, notes, and next steps easy to find.</p><ul><li><Check size={16}/> Longer, unrushed appointments</li><li><Check size={16}/> Clear pricing before you book</li><li><Check size={16}/> In-person and video visits</li></ul><button className="carely-text-link" onClick={()=>startBooking()}>Explore care options <ArrowRight size={17}/></button></div>
    </section>

    <section className="carely-doctors-section carely-shell" id="carely-doctors"><div className="carely-section-head centered"><span>DOCTORS WHO LISTEN</span><h2>Care starts with<br/>the right person.</h2></div><div className="carely-doctor-grid"><article><div className="portrait p1">AS</div><h3>Dr. Aanya Shah</h3><p>Family medicine</p><span>★ 4.9 · 1.2k visits</span><button onClick={()=>startBooking({ doctor: 1 })}>Book with Aanya <ArrowRight size={15}/></button></article><article><div className="portrait p2">RM</div><h3>Dr. Rohan Mehta</h3><p>Internal medicine</p><span>★ 4.8 · 980 visits</span><button onClick={()=>startBooking({ doctor: 2 })}>Book with Rohan <ArrowRight size={15}/></button></article><article><div className="portrait p3">MI</div><h3>Dr. Maya Iyer</h3><p>Primary care</p><span>★ 5.0 · 760 visits</span><button onClick={()=>startBooking({ doctor: 3 })}>Book with Maya <ArrowRight size={15}/></button></article></div></section>

    <section className="carely-cta carely-shell"><div><span>READY WHEN YOU ARE</span><h2>Your health deserves<br/>a little more care.</h2></div><button className="carely-primary light" onClick={()=>startBooking()}>Book your first visit <ArrowRight size={18}/></button></section>
    <footer className="carely-footer carely-shell"><a className="carely-logo" href={routeUrl('/medical')} onClick={(event)=>handleSectionLink(event,'carely-top')}><span><HeartPulse size={19}/></span>carely.</a><p>Healthcare, made human.</p><div><a href={routeUrl('/medical')} onClick={(event)=>handleSectionLink(event,'carely-care')}>Care</a><a href={routeUrl('/medical')} onClick={(event)=>handleSectionLink(event,'carely-doctors')}>Doctors</a><a href={routeUrl('/medical')} onClick={(event)=>handleSectionLink(event,'carely-top')}>Privacy</a></div><small>© 2026 Carely</small></footer>
    <button className="carely-chat" aria-label="Chat with Carely" onClick={()=>setChatOpen(!chatOpen)}>{chatOpen ? <X size={21}/> : <MessageCircle size={21}/>}</button>
    {chatOpen && <aside className="carely-chat-panel" aria-label="Carely guide chat"><div className="chat-head"><span><HeartPulse size={17}/></span><div><strong>Carely guide</strong><small>Usually replies instantly</small></div><button onClick={()=>setChatOpen(false)} aria-label="Close chat"><X size={17}/></button></div><div className="chat-body">{messages.map((item,index)=><p key={index} className={item.from}>{item.text}</p>)}</div><div className="chat-quick"><button onClick={()=>sendMessage('I need help choosing a doctor')}>Choose a doctor</button><button onClick={()=>sendMessage('I have a question about pricing')}>Pricing</button></div><div className="chat-input"><input aria-label="Chat message" value={chatText} onChange={(e)=>setChatText(e.target.value)} onKeyDown={(e)=>e.key==='Enter'&&sendMessage()} placeholder="Type a message..."/><button onClick={()=>sendMessage()} aria-label="Send message"><Send size={17}/></button></div></aside>}
    {authOpen && <AuthModal brand="Carely" onClose={()=>setAuthOpen(false)}/>} 
  </main>
}
