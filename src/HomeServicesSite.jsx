import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft, ArrowRight, CalendarDays, Check, CheckCircle2, ChevronLeft,
  ChevronRight, Clock3, Hammer, HelpCircle, Home, KeyRound, MapPin, Menu,
  Paintbrush, Search, ShieldCheck, Sparkles, SprayCan, Star, Wrench, X, Zap,
} from 'lucide-react'
import AuthModal from './AuthModal.jsx'
import { handleSectionLink, routeUrl, scrollToSection } from './navigation.js'
import './home-services.css'

const services = [
  { id: 'plumbing', name: 'Plumbing', note: 'Leaks, fixtures & repairs', icon: Wrench, tone: 'coral', from: '$65' },
  { id: 'electrical', name: 'Electrical', note: 'Lights, outlets & wiring', icon: Zap, tone: 'yellow', from: '$75' },
  { id: 'cleaning', name: 'Home cleaning', note: 'Regular or deep cleaning', icon: SprayCan, tone: 'mint', from: '$49' },
  { id: 'handyman', name: 'Handyman', note: 'Assembly, mounting & fixes', icon: Hammer, tone: 'blue', from: '$55' },
  { id: 'painting', name: 'Painting', note: 'Rooms, walls & touch-ups', icon: Paintbrush, tone: 'lilac', from: '$120' },
  { id: 'locks', name: 'Locksmith', note: 'Locks, keys & home access', icon: KeyRound, tone: 'sand', from: '$80' },
]

const pros = [
  { id: 1, name: 'Arjun Rao', business: 'AR Home Care', rating: '4.9', jobs: '430 jobs', initials: 'AR', color: '#f0cdbf', next: 'Today, 2 PM' },
  { id: 2, name: 'Sana Thakur', business: 'Neat & Ready', rating: '4.8', jobs: '285 jobs', initials: 'ST', color: '#cfe3d6', next: 'Tomorrow, 9 AM' },
  { id: 3, name: 'Jay Mehta', business: 'Good Hands Co.', rating: '5.0', jobs: '190 jobs', initials: 'JM', color: '#d8e1ef', next: 'Mon, 11 AM' },
]

const dates = [{ day: 'SAT', date: '17' }, { day: 'SUN', date: '18' }, { day: 'MON', date: '19' }, { day: 'TUE', date: '20' }, { day: 'WED', date: '21' }]
const times = ['09:00 AM', '11:00 AM', '02:00 PM', '04:30 PM']

function NestlyLogo() { return <a className="nestly-logo" href={routeUrl('/home-services')} onClick={(event) => handleSectionLink(event, 'nestly-top')}><span><Home size={19}/></span>nestly.</a> }

export default function HomeServicesSite({ onExit }) {
  const [booking, setBooking] = useState(null)
  const [auth, setAuth] = useState(false)
  const [help, setHelp] = useState(false)
  const [menu, setMenu] = useState(false)
  const [zip, setZip] = useState('')
  const [zipError, setZipError] = useState('')

  useEffect(() => { document.title = 'Nestly — Home help, handled'; return () => { document.title = "Flowly — There's a flow for it" } }, [])
  const start = (service = 'cleaning') => { setBooking({ service }); window.scrollTo(0, 0) }
  const checkArea = () => {
    if (!/^\d{5,6}$/.test(zip.trim())) { setZipError('Enter a valid 5 or 6 digit postal code.'); return }
    setZipError('')
    scrollToSection('nestly-services')
  }

  if (booking) return <HomeBooking initialService={booking.service} onExit={() => setBooking(null)} />

  return <main className="nestly-site" id="nestly-top">
    <header className="nestly-header nestly-shell"><button className="nestly-return" onClick={onExit}><ArrowLeft size={16}/> Flowly</button><NestlyLogo/><nav id="nestly-navigation" className={menu?'open':''}><a href={routeUrl('/home-services')} onClick={(event)=>handleSectionLink(event,'nestly-services',()=>setMenu(false))}>Services</a><a href={routeUrl('/home-services')} onClick={(event)=>handleSectionLink(event,'nestly-how',()=>setMenu(false))}>How it works</a><a href={routeUrl('/home-services')} onClick={(event)=>handleSectionLink(event,'nestly-trust',()=>setMenu(false))}>Our promise</a></nav><div className="nestly-actions"><button onClick={()=>setHelp(true)}>Get help</button><button onClick={()=>setAuth(true)}>Sign in</button><button className="nestly-primary small" onClick={()=>start()}>Book a pro</button></div><button className="nestly-menu" aria-label={menu ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={menu} aria-controls="nestly-navigation" onClick={()=>setMenu(!menu)}>{menu?<X/>:<Menu/>}</button></header>

    <section className="nestly-hero nestly-shell"><div className="nestly-copy"><span className="nestly-kicker"><Sparkles size={14}/> Home help without the hassle</span><h1>Your to-do list,<br/><em>handled.</em></h1><p>Book trusted local professionals for cleaning, repairs, and everything your home needs to feel right.</p><div className="zip-search"><MapPin size={19}/><input aria-label="Postal code" value={zip} onChange={(e)=>setZip(e.target.value.replace(/\D/g,''))} onKeyDown={(e)=>e.key==='Enter'&&checkArea()} placeholder="Enter postal code"/><button onClick={checkArea}>Find help <ArrowRight size={16}/></button></div>{zipError&&<span className="zip-error">{zipError}</span>}<div className="nestly-proof"><span><ShieldCheck size={16}/> Background checked</span><span><Star size={15} fill="currentColor"/> 4.9 average rating</span></div></div><div className="nestly-visual"><div className="room-wall"><span className="window"><i/><i/></span><span className="plant">✦</span><span className="cabinet"><i/><i/></span></div><div className="task-card tc-one"><span><Wrench size={17}/></span><div><small>PLUMBING</small><strong>Faucet repaired</strong></div><Check size={16}/></div><div className="task-card tc-two"><span><SprayCan size={17}/></span><div><small>CLEANING</small><strong>Friday · 10 AM</strong></div><CalendarDays size={16}/></div><div className="pro-badge"><span>AR</span><div><strong>Arjun is nearby</strong><small>★ 4.9 · 8 min away</small></div></div></div></section>

    <section className="nestly-services nestly-shell" id="nestly-services"><div className="nestly-section-head"><div><span>WHATEVER YOUR HOME NEEDS</span><h2>One place.<br/>Six ways to help.</h2></div><p>Clear pricing, verified professionals, and appointments that fit your schedule.</p></div><div className="service-grid">{services.map(({id,name,note,icon:Icon,tone,from})=><button key={id} onClick={()=>start(id)}><span className={`service-icon ${tone}`}><Icon size={23}/></span><i>From {from}</i><h3>{name}</h3><p>{note}</p><b>Book now <ArrowRight size={16}/></b></button>)}</div></section>

    <section className="nestly-how nestly-shell" id="nestly-how"><div className="nestly-how-copy"><span>HOME CARE, SIMPLIFIED</span><h2>From “need it done”<br/>to done.</h2><p>A clear, dependable process for every job—big, small, expected, or urgent.</p><button onClick={()=>start('handyman')}>Get started <ArrowRight size={16}/></button></div><div className="nestly-steps"><article><b>01</b><span><h3>Choose the service</h3><p>Start with the closest match for the job.</p></span></article><article><b>02</b><span><h3>Choose your professional</h3><p>Compare trusted experts and availability.</p></span></article><article><b>03</b><span><h3>Schedule and explain</h3><p>Pick a time, then add the address and job details.</p></span></article><article><b>04</b><span><h3>Review your request</h3><p>Check everything before confirming the demo booking.</p></span></article></div></section>

    <section className="nestly-trust nestly-shell" id="nestly-trust"><div className="trust-art"><span className="big-key"><KeyRound size={70}/></span><div><ShieldCheck size={25}/><strong>Nestly protected</strong><small>Every booking, every time</small></div></div><div><span>THE NESTLY PROMISE</span><h2>Good help should<br/>feel easy to trust.</h2><p>Every professional is identity-verified, reviewed, and supported by our happiness guarantee.</p><ul><li><Check size={16}/> Vetted local professionals</li><li><Check size={16}/> Upfront, transparent pricing</li><li><Check size={16}/> Support before and after every job</li></ul><button onClick={()=>setHelp(true)}>Learn about our promise <ArrowRight size={16}/></button></div></section>

    <section className="nestly-cta nestly-shell"><div><span>YOUR HOME, YOUR TIME</span><h2>Ready to clear<br/>that to-do list?</h2></div><button onClick={()=>start()} className="nestly-primary light">Find your pro <ArrowRight size={17}/></button></section>
    <footer className="nestly-footer nestly-shell"><NestlyLogo/><p>Home help, handled.</p><div><a href={routeUrl('/home-services')} onClick={(event)=>handleSectionLink(event,'nestly-services')}>Services</a><a href={routeUrl('/home-services')} onClick={(event)=>handleSectionLink(event,'nestly-trust')}>Trust</a><button onClick={()=>setHelp(true)}>Support</button></div><small>© 2026 Nestly</small></footer>
    {auth&&<AuthModal brand="Nestly" onClose={()=>setAuth(false)}/>} {help&&<HelpPanel onClose={()=>setHelp(false)} onBook={()=>{setHelp(false);start()}}/>}
  </main>
}

function HelpPanel({ onClose, onBook }) {
  const [topic,setTopic]=useState('')
  return <div className="nestly-overlay" role="dialog" aria-modal="true" aria-label="Nestly help"><button className="overlay-bg" onClick={onClose} aria-label="Close help"/><aside className="help-panel"><button className="panel-close" onClick={onClose} aria-label="Close help"><X size={19}/></button><span className="help-icon"><HelpCircle size={24}/></span><h2>How can we help?</h2><p>Choose a topic and we’ll point you in the right direction.</p><div className="help-topics">{['Choosing a service','Pricing questions','Change a booking','Safety & trust'].map(item=><button key={item} className={topic===item?'active':''} onClick={()=>setTopic(item)}>{item}<ChevronRight size={16}/></button>)}</div>{topic&&<div className="help-answer"><Check size={16}/><span><strong>{topic}</strong><small>A Nestly guide can help. In this demo, start a booking to see the full experience.</small></span></div>}<button className="nestly-primary" onClick={onBook}>Start a booking <ArrowRight size={16}/></button></aside></div>
}

function HomeBooking({ initialService, onExit }) {
  const [step, setStep] = useState(1)
  const [service, setService] = useState(initialService)
  const [pro, setPro] = useState(1)
  const [date, setDate] = useState(2)
  const [time, setTime] = useState('11:00 AM')
  const [done, setDone] = useState(false)
  const [details, setDetails] = useState({ note: '', address: '', name: '', phone: '' })
  const [error, setError] = useState('')
  const selectedService = services.find(item => item.id === service)
  const selectedPro = pros.find(item => item.id === pro)
  const goTo = value => { setError(''); setStep(value); window.scrollTo(0, 0) }
  const next = () => {
    if (step === 4 && (!details.address.trim() || !details.name.trim())) {
      setError('Add your name and service address to continue.')
      return
    }
    setError('')
    if (step === 5) setDone(true)
    else goTo(step + 1)
  }

  if (done) return <main className="home-booking">
    <header className="home-book-head"><NestlyLogo/><button onClick={onExit} aria-label="Close booking"><X size={19}/></button></header>
    <section className="home-success"><span><CheckCircle2 size={44}/></span><small>BOOKING REQUESTED</small><h1>Consider it handled.</h1><p>Your choices have been saved in this demo. No real professional was contacted.</p><div className="home-confirm"><div><span className="pro-avatar" style={{background:selectedPro.color}}>{selectedPro.initials}</span><div><small>YOUR PROFESSIONAL</small><strong>{selectedPro.name}</strong><p>{selectedService.name} · {selectedPro.business}</p></div></div><hr/><p><CalendarDays size={17}/>{dates[date].day}, October {dates[date].date} · {time}</p><p><MapPin size={17}/>{details.address}</p></div><button className="nestly-primary" onClick={onExit}>Return to Nestly home <ArrowRight size={16}/></button></section>
  </main>

  return <main className="home-booking">
    <header className="home-book-head"><button onClick={() => step === 1 ? onExit() : goTo(step - 1)}><ArrowLeft size={17}/>{step === 1 ? 'Nestly home' : 'Back'}</button><NestlyLogo/><button onClick={onExit} aria-label="Close booking"><X size={19}/></button></header>
    <div className="home-progress"><span style={{width:`${step * 20}%`}}/></div>
    <div className="home-flow-label"><span>Service</span><span>Professional</span><span>Schedule</span><span>Details</span><span>Review</span><strong>{step} of 5</strong></div>
    <section className="home-book-shell">
      {step === 1 && <><div className="book-title"><span>CHOOSE A SERVICE</span><h1>What can we<br/>take care of?</h1><p>Select the closest match. Your professional can fine-tune the job details later.</p></div><div className="book-service-grid">{services.map(({id,name,note,icon:Icon,tone})=><button key={id} className={service===id?'selected':''} onClick={()=>setService(id)}><span className={`service-icon ${tone}`}><Icon size={22}/></span><span><strong>{name}</strong><small>{note}</small></span><i>{service===id&&<Check size={14}/>}</i></button>)}</div></>}
      {step === 2 && <><div className="book-title"><span>CHOOSE YOUR PROFESSIONAL</span><h1>Who feels like<br/>the right fit?</h1><p>Every professional is vetted, reviewed, and backed by Nestly support.</p></div><div className="pro-list">{pros.map(item=><button key={item.id} className={pro===item.id?'selected':''} onClick={()=>setPro(item.id)}><span className="pro-avatar" style={{background:item.color}}>{item.initials}</span><span><strong>{item.name}</strong><small>{item.business}</small><i>★ {item.rating} · {item.jobs}</i></span><span><small>Next available</small><strong>{item.next}</strong></span><b>{pro===item.id&&<Check size={14}/>}</b></button>)}</div></>}
      {step === 3 && <><div className="book-title"><span>CHOOSE A TIME</span><h1>When should we come?</h1><p>Select an available date and arrival window that works for your home.</p></div><div className="home-calendar standalone"><h3>October 2026</h3><div className="home-dates">{dates.map((item,index)=><button key={item.date} className={date===index?'selected':''} onClick={()=>setDate(index)}><small>{item.day}</small><strong>{item.date}</strong></button>)}</div><h4><Clock3 size={16}/> Available arrival windows</h4><div className="home-times">{times.map(item=><button key={item} className={time===item?'selected':''} onClick={()=>setTime(item)}>{item}</button>)}</div></div></>}
      {step === 4 && <><div className="book-title"><span>JOB DETAILS</span><h1>Where is the work?</h1><p>Add the essentials so your professional arrives prepared.</p></div><div className="home-details standalone"><label>Service address *<input value={details.address} onChange={e=>setDetails({...details,address:e.target.value})} placeholder="Street and city"/></label><label>Your name *<input value={details.name} onChange={e=>setDetails({...details,name:e.target.value})} placeholder="Full name"/></label><label>Phone number<input value={details.phone} onChange={e=>setDetails({...details,phone:e.target.value})} placeholder="Optional"/></label><label>Job notes<textarea value={details.note} onChange={e=>setDetails({...details,note:e.target.value})} placeholder="What should your professional know?"/></label>{error&&<span className="home-error">{error}</span>}<small className="home-privacy"><ShieldCheck size={15}/> Details stay private in this demo.</small></div></>}
      {step === 5 && <><div className="book-title"><span>REVIEW YOUR REQUEST</span><h1>Ready to book?</h1><p>Check each detail before sending this demo request.</p></div><div className="home-review"><div className="home-review-pro"><span className="pro-avatar" style={{background:selectedPro.color}}>{selectedPro.initials}</span><div><small>PROFESSIONAL</small><strong>{selectedPro.name}</strong><p>{selectedService.name} · {selectedPro.business}</p></div><button onClick={()=>goTo(2)}>Edit</button></div><div className="home-review-grid"><section><small>SCHEDULE</small><strong>{dates[date].day}, October {dates[date].date}</strong><span>{time}</span><button onClick={()=>goTo(3)}>Edit schedule</button></section><section><small>SERVICE ADDRESS</small><strong>{details.name}</strong><span>{details.address}</span><button onClick={()=>goTo(4)}>Edit details</button></section></div>{details.note&&<div className="home-review-note"><small>JOB NOTES</small><p>{details.note}</p></div>}<div className="home-demo-notice"><ShieldCheck size={16}/> This is a UI demo. No professional will be contacted.</div></div></>}
    </section>
    <footer className="home-book-footer"><span>{selectedService.name} {step>1&&`· ${selectedPro.name}`} {step>2&&`· ${dates[date].day} ${dates[date].date}, ${time}`}</span><button className="nestly-primary" onClick={next}>{step===5?'Confirm request':step===4?'Review booking':'Continue'}<ArrowRight size={16}/></button></footer>
  </main>
}
