import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft, ArrowRight, CalendarDays, Check, CheckCircle2, ChevronDown, Clock3,
  CreditCard, Film, MapPin, Minus, Play, Plus, Popcorn, Search, Sparkles, Ticket, X,
} from 'lucide-react'
import { routeUrl } from './navigation.js'
import afterlightPoster from './assets/movie-tickets/afterlight.jpg'
import monsoonPoster from './assets/movie-tickets/monsoon-letters.jpg'
import lastLocalPoster from './assets/movie-tickets/last-local.jpg'
import wildlinePoster from './assets/movie-tickets/wildline.jpg'
import './movie-ticket.css'

const movies = [
  { id: 'afterlight', title: 'Afterlight', genre: 'Sci-fi mystery', certificate: 'UA 13+', duration: '2h 08m', language: 'English', rating: '8.6', tone: 'violet', poster: afterlightPoster, blurb: 'A radio astronomer hears a signal from tomorrow—and has one night to change what it predicts.' },
  { id: 'monsoon', title: 'Monsoon Letters', genre: 'Romance drama', certificate: 'U', duration: '1h 54m', language: 'Hindi', rating: '8.1', tone: 'coral', poster: monsoonPoster, blurb: 'Two old friends reconnect through letters that arrive every year with the first rain.' },
  { id: 'last-local', title: 'The Last Local', genre: 'Comedy', certificate: 'UA 7+', duration: '1h 42m', language: 'Marathi', rating: '7.9', tone: 'amber', poster: lastLocalPoster, blurb: 'Five strangers miss the final train and turn one chaotic station night into an unlikely adventure.' },
  { id: 'wildline', title: 'Wildline', genre: 'Adventure', certificate: 'UA 13+', duration: '2h 16m', language: 'English', rating: '8.3', tone: 'teal', poster: wildlinePoster, blurb: 'A young cartographer follows a vanished trail through a forest that refuses to stay on the map.' },
]

const dates = [
  { day: 'Today', date: '03', month: 'NOV' },
  { day: 'Wed', date: '04', month: 'NOV' },
  { day: 'Thu', date: '05', month: 'NOV' },
  { day: 'Fri', date: '06', month: 'NOV' },
  { day: 'Sat', date: '07', month: 'NOV' },
]

const showtimes = ['10:20 AM', '1:45 PM', '5:10 PM', '8:35 PM', '11:20 PM']
const occupiedSeats = new Set(['A3', 'A4', 'B2', 'B7', 'C5', 'D3', 'D4', 'D8', 'E1', 'E6', 'F5'])
const snacks = [
  { id: 'popcorn', name: 'Classic popcorn', note: 'Salted · regular', price: 220, icon: '🍿' },
  { id: 'combo', name: 'Movie combo', note: 'Popcorn + cold drink', price: 360, icon: '🥤' },
  { id: 'nachos', name: 'Cheesy nachos', note: 'Salsa on the side', price: 280, icon: '🌮' },
  { id: 'water', name: 'Mineral water', note: '750 ml bottle', price: 80, icon: '💧' },
]

const money = value => `₹${value.toLocaleString('en-IN')}`
const stepOrder = ['details', 'seats', 'snacks', 'checkout']

function Poster({ movie, compact = false }) {
  return <div className={`cinema-poster ${movie.tone} ${compact ? 'compact' : ''}`} style={{ '--poster-image': `url(${movie.poster})` }} aria-label={`${movie.title} poster artwork`}>
    <span className="poster-grain"/><i/><b>{movie.title}</b><small>AN ORIGINAL MOTION PICTURE</small>
  </div>
}

export default function MovieTicketSite({ onExit }) {
  const [step, setStep] = useState('movies')
  const [selectedMovieId, setSelectedMovieId] = useState('afterlight')
  const [language, setLanguage] = useState('All')
  const [query, setQuery] = useState('')
  const [dateIndex, setDateIndex] = useState(0)
  const [showtime, setShowtime] = useState('5:10 PM')
  const [seats, setSeats] = useState([])
  const [snackCounts, setSnackCounts] = useState({})
  const [locationOpen, setLocationOpen] = useState(false)
  const [location, setLocation] = useState('Simple Theatre · Aundh')
  const [trailerOpen, setTrailerOpen] = useState(false)
  const [payment, setPayment] = useState('upi')
  const [guest, setGuest] = useState({ name: '', phone: '' })
  const [error, setError] = useState('')
  const [seatNotice, setSeatNotice] = useState('')
  const selectedMovie = movies.find(movie => movie.id === selectedMovieId) || movies[0]
  const visibleMovies = useMemo(() => movies.filter(movie => {
    const matchesLanguage = language === 'All' || movie.language === language
    const search = query.trim().toLowerCase()
    return matchesLanguage && (!search || `${movie.title} ${movie.genre} ${movie.language}`.toLowerCase().includes(search))
  }), [language, query])
  const snackTotal = snacks.reduce((sum, snack) => sum + (snackCounts[snack.id] || 0) * snack.price, 0)
  const seatTotal = seats.length * 280
  const convenience = seats.length * 24
  const total = seatTotal + snackTotal + convenience
  const updateSnack = (id, delta) => setSnackCounts(current => ({ ...current, [id]: Math.max(0, Math.min(6, (current[id] || 0) + delta)) }))
  const changeDate = index => { if (index !== dateIndex) { setDateIndex(index); setSeats([]); setSnackCounts({}); setSeatNotice('') } }
  const changeShowtime = time => { if (time !== showtime) { setShowtime(time); setSeats([]); setSnackCounts({}); setSeatNotice('') } }
  const toggleSeat = seat => {
    if (occupiedSeats.has(seat)) return
    setSeats(current => {
      if (current.includes(seat)) { setSeatNotice(''); return current.filter(item => item !== seat) }
      if (current.length >= 6) { setSeatNotice('You can select up to 6 seats in one booking.'); return current }
      setSeatNotice(''); return [...current, seat]
    })
  }
  const chooseMovie = movie => {
    setSelectedMovieId(movie.id); setDateIndex(0); setShowtime('5:10 PM'); setSeats([])
    setSnackCounts({}); setGuest({ name: '', phone: '' }); setError(''); setSeatNotice('')
    setStep('details'); window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const continueCheckout = () => {
    if (!guest.name.trim() || !/^\d{10}$/.test(guest.phone.replace(/\D/g, ''))) {
      setError('Add your name and a 10-digit mobile number to create the demo ticket.')
      return
    }
    setError(''); setStep('done'); window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const goBack = () => {
    const previous = { details: 'movies', seats: 'details', snacks: 'seats', checkout: 'snacks', done: 'movies' }
    setStep(previous[step] || 'movies'); window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const restart = () => { setStep('movies'); setSeats([]); setSnackCounts({}); setGuest({ name: '', phone: '' }); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const navigateStep = target => {
    if (stepOrder.indexOf(target) > stepOrder.indexOf(step)) return
    setStep(target); setError(''); window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const mobileContinue = () => {
    if (step === 'seats' && seats.length) setStep('snacks')
    else if (step === 'snacks') setStep('checkout')
    else if (step === 'checkout') { continueCheckout(); return }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  useEffect(() => {
    const closeOverlays = event => { if (event.key === 'Escape') { setTrailerOpen(false); setLocationOpen(false) } }
    window.addEventListener('keydown', closeOverlays)
    return () => window.removeEventListener('keydown', closeOverlays)
  }, [])

  return <main className="cinema-app">
    <header className="cinema-header">
      <button className="cinema-exit" onClick={onExit}><ArrowLeft size={16}/> Flowly</button>
      <a className="cinema-brand" href={routeUrl('/movie-tickets')}><span><Film size={19}/></span><b>simple</b><em>theatre</em></a>
      <div className="cinema-location-wrap">
        <button className="cinema-location" onClick={() => setLocationOpen(value => !value)} aria-expanded={locationOpen}><MapPin size={16}/><span><small>YOUR CINEMA</small><strong>{location}</strong></span><ChevronDown size={15}/></button>
        {locationOpen && <div className="cinema-location-menu">{['Simple Theatre · Aundh','Simple Theatre · Kothrud','Simple Theatre · Camp'].map(item => <button key={item} className={location === item ? 'active' : ''} onClick={() => { if (item !== location) { setLocation(item); setSeats([]); setSnackCounts({}); setSeatNotice('') }; setLocationOpen(false) }}><MapPin size={15}/><span>{item}</span>{location === item && <Check size={15}/>}</button>)}</div>}
      </div>
    </header>

    {step !== 'movies' && step !== 'done' && <>
      <nav className="cinema-progress" aria-label="Ticket purchase progress">{['Movie','Seats','Snacks','Checkout'].map((label, index) => { const currentIndex = stepOrder.indexOf(step); const target = stepOrder[index]; return <button type="button" className={index === currentIndex ? 'active' : index < currentIndex ? 'done' : ''} disabled={index > currentIndex} onClick={() => navigateStep(target)} key={label}><i>{index < currentIndex ? <Check size={12}/> : index + 1}</i>{label}</button> })}</nav>
      <aside className="cinema-booking-rail" aria-label="Current booking summary"><Poster movie={selectedMovie} compact/><div><small>YOUR MOVIE</small><strong>{selectedMovie.title}</strong><button onClick={() => navigateStep('details')}>Change movie or show</button></div><span><small>WHEN</small><strong>{dates[dateIndex].day}, {dates[dateIndex].date} Nov · {showtime}</strong></span><span><small>SEATS</small><strong>{seats.length ? seats.join(', ') : 'Choose seats'}</strong></span><span><small>CURRENT TOTAL</small><strong>{money(total)}</strong></span></aside>
    </>}

    {step === 'movies' && <>
      <section className="cinema-hero">
        <div><span className="cinema-eyebrow"><Sparkles size={14}/> CURATED FOR THE BIG SCREEN</span><h1>A good night starts<br/>with a <em>great story.</em></h1><p>Choose a film, your favourite seats and the snacks. Your ticket will be ready before the trailers begin.</p><button onClick={() => document.getElementById('now-showing')?.scrollIntoView({ behavior: 'smooth' })}>See what’s playing <ArrowRight size={16}/></button></div>
        <div className="cinema-feature"><Poster movie={movies[0]}/><button onClick={() => setTrailerOpen(true)}><Play size={18} fill="currentColor"/> Watch trailer</button><span><b>TONIGHT’S PICK</b><strong>Afterlight</strong><small>5 shows · from ₹280</small></span></div>
      </section>
      <section className="cinema-discovery" id="now-showing">
        <header><div><small>NOW SHOWING</small><h2>Pick your next story</h2></div><label><Search size={17}/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search films or genres"/>{query && <button aria-label="Clear search" onClick={() => setQuery('')}><X size={14}/></button>}</label></header>
        <div className="cinema-languages">{['All','English','Hindi','Marathi'].map(item => <button className={language === item ? 'active' : ''} onClick={() => setLanguage(item)} key={item}>{item}</button>)}</div>
        <div className="cinema-movie-grid">{visibleMovies.map(movie => <article key={movie.id}><button className="poster-button" onClick={() => chooseMovie(movie)}><Poster movie={movie}/><span className="movie-rating">★ {movie.rating}</span></button><div><span>{movie.genre}</span><h3>{movie.title}</h3><p>{movie.language} · {movie.certificate} · {movie.duration}</p><button onClick={() => chooseMovie(movie)}>View shows <ArrowRight size={14}/></button></div></article>)}</div>
        {!visibleMovies.length && <div className="cinema-no-results"><Film size={26}/><strong>No films found</strong><p>Try another language or a shorter search.</p><button onClick={() => { setLanguage('All'); setQuery('') }}>Show all films</button></div>}
      </section>
    </>}

    {step === 'details' && <section className="cinema-detail-screen">
      <button className="cinema-back" onClick={goBack}><ArrowLeft size={16}/> All films</button>
      <div className="cinema-detail-hero"><Poster movie={selectedMovie}/><div><span className="cinema-eyebrow">NOW SHOWING</span><h1>{selectedMovie.title}</h1><p className="cinema-meta">{selectedMovie.language} · {selectedMovie.genre} · {selectedMovie.duration} · {selectedMovie.certificate}</p><p className="cinema-blurb">{selectedMovie.blurb}</p><div><button onClick={() => setTrailerOpen(true)}><Play size={16} fill="currentColor"/> Trailer</button><span>★ {selectedMovie.rating} audience score</span></div></div></div>
      <div className="cinema-show-picker"><header><div><small>CHOOSE YOUR SHOW</small><h2>{location}</h2></div><span><MapPin size={16}/> Screen 2 · Dolby 7.1</span></header><div className="cinema-dates">{dates.map((item,index) => <button className={dateIndex === index ? 'active' : ''} onClick={() => changeDate(index)} key={item.date}><small>{item.day}</small><strong>{item.date}</strong><span>{item.month}</span></button>)}</div><div className="cinema-times">{showtimes.map(time => <button className={showtime === time ? 'active' : ''} onClick={() => changeShowtime(time)} key={time}><Clock3 size={14}/><strong>{time}</strong><small>{time === '8:35 PM' ? 'Filling fast' : 'Available'}</small></button>)}</div><footer><span><b>{dates[dateIndex].day}, {dates[dateIndex].date} Nov</b><small>{showtime} · 2D · {selectedMovie.language}</small></span><button onClick={() => { setStep('seats'); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>Choose seats <ArrowRight size={16}/></button></footer></div>
    </section>}

    {step === 'seats' && <section className="cinema-seat-screen">
      <header><button className="cinema-back" onClick={goBack}><ArrowLeft size={16}/> Showtime</button><div><small>{selectedMovie.title.toUpperCase()}</small><h1>Choose where the story finds you.</h1><p>{dates[dateIndex].day}, {dates[dateIndex].date} Nov · {showtime} · Screen 2</p></div></header>
      <div className="cinema-seat-layout"><div className="cinema-seat-map"><div className="cinema-screen"><span>SCREEN · BEST VIEW FROM ROWS C–E</span></div><div className="seat-grid">{['A','B','C','D','E','F'].map(row => <div className="seat-row" key={row}><b>{row}</b>{Array.from({length:8},(_,index) => `${row}${index+1}`).map((seat, seatIndex) => <button key={seat} disabled={occupiedSeats.has(seat)} onClick={() => toggleSeat(seat)} className={seats.includes(seat) ? 'selected' : ''} aria-label={`Seat ${seat}${occupiedSeats.has(seat) ? ', unavailable' : ''}`}>{seatIndex + 1}</button>) }<b>{row}</b></div>)}</div><div className="seat-legend"><span><i/>Available</span><span><i className="chosen"/>Selected</span><span><i className="taken"/>Unavailable</span></div>{seatNotice && <p className="cinema-seat-notice" role="status">{seatNotice}</p>}</div><aside className="cinema-seat-summary"><span><Ticket size={22}/></span><small>YOUR SHOW</small><h2>{selectedMovie.title}</h2><p>{dates[dateIndex].day}, {dates[dateIndex].date} Nov · {showtime}</p><hr/><div><span>Selected seats</span><strong>{seats.length ? seats.join(', ') : 'None yet'}</strong></div><div><span>{seats.length} × Standard</span><strong>{money(seatTotal)}</strong></div><small>Up to 6 seats per booking</small><button disabled={!seats.length} onClick={() => { setStep('snacks'); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>Continue <ArrowRight size={15}/></button></aside></div>
    </section>}

    {step === 'snacks' && <section className="cinema-snack-screen">
      <header><button className="cinema-back" onClick={goBack}><ArrowLeft size={16}/> Seats</button><div><small>OPTIONAL EXTRAS</small><h1>Make it a proper movie night.</h1><p>Pick up everything at the express counter before your show.</p></div></header>
      <div className="cinema-snack-layout"><div className="cinema-snack-grid">{snacks.map(snack => <article className={(snackCounts[snack.id] || 0) ? 'active' : ''} key={snack.id}><span>{snack.icon}</span><div><h2>{snack.name}</h2><p>{snack.note}</p><strong>{money(snack.price)}</strong></div><div className="snack-stepper"><button onClick={() => updateSnack(snack.id,-1)} disabled={!snackCounts[snack.id]} aria-label={`Remove ${snack.name}`}><Minus size={14}/></button><b>{snackCounts[snack.id] || 0}</b><button onClick={() => updateSnack(snack.id,1)} aria-label={`Add ${snack.name}`}><Plus size={14}/></button></div></article>)}</div><aside className="cinema-order-card"><Popcorn size={24}/><small>ORDER SUMMARY</small><h2>{seats.join(', ')}</h2><p>{selectedMovie.title} · {showtime}</p><div><span>Tickets</span><strong>{money(seatTotal)}</strong></div><div><span>Food & drinks</span><strong>{money(snackTotal)}</strong></div><hr/><div className="total"><span>Before fees</span><strong>{money(seatTotal + snackTotal)}</strong></div><button onClick={() => { setStep('checkout'); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>Review and pay <ArrowRight size={15}/></button><button className="skip" onClick={() => { setSnackCounts({}); setStep('checkout'); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>Skip snacks</button></aside></div>
    </section>}

    {step === 'checkout' && <section className="cinema-checkout-screen">
      <header><button className="cinema-back" onClick={goBack}><ArrowLeft size={16}/> Snacks</button><div><small>FINAL STEP</small><h1>Your tickets are almost ready.</h1></div></header>
      <div className="cinema-checkout-layout"><div className="cinema-checkout-form"><section><span>1</span><div><h2>Send tickets to</h2><p>Used only for this UI demonstration.</p></div></section><label>Full name<input value={guest.name} onChange={event => setGuest({...guest,name:event.target.value})} placeholder="Your name"/></label><label>Mobile number<input inputMode="numeric" value={guest.phone} onChange={event => setGuest({...guest,phone:event.target.value})} placeholder="10-digit mobile number"/></label><section><span>2</span><div><h2>Choose payment</h2><p>No real payment will be made.</p></div></section><div className="cinema-payment-options">{[['upi','UPI','Pay using any UPI app'],['card','Card','Credit or debit card'],['wallet','Wallet','Use a cinema wallet']].map(([id,title,note]) => <button className={payment === id ? 'active' : ''} onClick={() => setPayment(id)} key={id}><CreditCard size={18}/><span><strong>{title}</strong><small>{note}</small></span><i>{payment === id && <Check size={13}/>}</i></button>)}</div>{error && <p className="cinema-form-error">{error}</p>}</div><aside className="cinema-ticket-review"><Poster movie={selectedMovie} compact/><div><small>BOOKING SUMMARY</small><h2>{selectedMovie.title}</h2><p>{location}<br/>{dates[dateIndex].day}, {dates[dateIndex].date} Nov · {showtime}<br/>Seats {seats.join(', ')}</p></div><hr/><p><span>Tickets</span><strong>{money(seatTotal)}</strong></p><p><span>Food & drinks</span><strong>{money(snackTotal)}</strong></p><p><span>Convenience fee</span><strong>{money(convenience)}</strong></p><p className="total"><span>Total</span><strong>{money(total)}</strong></p><div className="cinema-demo-note"><Sparkles size={15}/><span><strong>Safe demo checkout</strong><small>Nothing is charged or submitted.</small></span></div><button onClick={continueCheckout}>Create demo ticket <ArrowRight size={15}/></button></aside></div>
    </section>}

    {step === 'done' && <section className="cinema-success-screen"><div className="cinema-confetti"/><span className="success-icon"><CheckCircle2 size={38}/></span><small>BOOKING DEMO COMPLETE</small><h1>Your seats are waiting.</h1><p>This is a sample ticket—no booking or payment was made.</p><article className="cinema-final-ticket"><div><Poster movie={selectedMovie} compact/><span><small>NOW SHOWING</small><h2>{selectedMovie.title}</h2><p>{selectedMovie.language} · {selectedMovie.duration}</p></span></div><div className="ticket-facts"><span><small>DATE</small><strong>{dates[dateIndex].date} NOV</strong></span><span><small>TIME</small><strong>{showtime}</strong></span><span><small>SCREEN</small><strong>02</strong></span><span><small>SEATS</small><strong>{seats.join(', ')}</strong></span></div><div className="ticket-code"><span className="fake-qr">{Array.from({length:49},(_,i)=><i key={i} className={[0,1,2,7,8,9,14,15,16,4,5,6,11,12,13,18,19,20,28,30,32,34,36,38,40,42,44,46,48].includes(i)?'dark':''}/>)}</span><span><small>BOOKING ID</small><strong>ST-{selectedMovie.id.slice(0,3).toUpperCase()}-4827</strong><p>{location}</p></span></div></article><div><button onClick={restart}>Book another film</button><button onClick={onExit}>Return to Flowly</button></div></section>}

    {(step === 'seats' || step === 'snacks' || step === 'checkout') && <div className="cinema-mobile-action"><span><small>{step === 'seats' ? `${seats.length} seat${seats.length === 1 ? '' : 's'}` : step === 'snacks' ? 'Tickets + snacks' : 'Final total'}</small><strong>{money(total)}</strong></span><button disabled={step === 'seats' && !seats.length} onClick={mobileContinue}>{step === 'seats' ? 'Continue' : step === 'snacks' ? 'Review & pay' : 'Create ticket'} <ArrowRight size={15}/></button></div>}

    {trailerOpen && <div className="cinema-trailer-modal" role="dialog" aria-modal="true" aria-label={`${selectedMovie.title} trailer`}><button className="cinema-modal-backdrop" onClick={() => setTrailerOpen(false)} aria-label="Close trailer"/><section><button onClick={() => setTrailerOpen(false)} aria-label="Close trailer"><X/></button><div className={`trailer-art ${selectedMovie.tone}`}><span><Play size={34} fill="currentColor"/></span></div><small>TRAILER PREVIEW</small><h2>{selectedMovie.title}</h2><p>A cinematic preview would play here in the connected product.</p></section></div>}
  </main>
}
