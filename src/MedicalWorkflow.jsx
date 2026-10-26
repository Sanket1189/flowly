import { useMemo, useState } from 'react'
import {
  ArrowLeft, ArrowRight, CalendarDays, Check, CheckCircle2, ChevronLeft,
  Clock3, HeartPulse, MapPin, ShieldCheck, Sparkles, Stethoscope, UserRound,
  Video, X,
} from 'lucide-react'

const careTypes = [
  { id: 'general', name: 'General care', note: 'Checkups, common symptoms & everyday health', icon: HeartPulse, color: 'mint' },
  { id: 'specialist', name: 'Specialist care', note: 'Focused expertise for a specific concern', icon: Stethoscope, color: 'peach' },
  { id: 'virtual', name: 'Virtual visit', note: 'Talk to a doctor from wherever you are', icon: Video, color: 'blue' },
]

const doctors = [
  { id: 1, name: 'Dr. Aanya Shah', field: 'Family medicine', rating: '4.9', visits: '1.2k visits', initials: 'AS', color: '#d6e8dc', next: 'Today' },
  { id: 2, name: 'Dr. Rohan Mehta', field: 'Internal medicine', rating: '4.8', visits: '980 visits', initials: 'RM', color: '#f0ddd3', next: 'Tomorrow' },
  { id: 3, name: 'Dr. Maya Iyer', field: 'Primary care', rating: '5.0', visits: '760 visits', initials: 'MI', color: '#dce5f2', next: 'Mon, Oct 19' },
]

const schedules = [
  { label: 'October 2026', long: 'October', dates: [{ day: 'SAT', date: '17' }, { day: 'SUN', date: '18' }, { day: 'MON', date: '19' }, { day: 'TUE', date: '20' }, { day: 'WED', date: '21' }] },
  { label: 'November 2026', long: 'November', dates: [{ day: 'MON', date: '02' }, { day: 'TUE', date: '03' }, { day: 'WED', date: '04' }, { day: 'THU', date: '05' }, { day: 'FRI', date: '06' }] },
  { label: 'December 2026', long: 'December', dates: [{ day: 'MON', date: '07' }, { day: 'TUE', date: '08' }, { day: 'WED', date: '09' }, { day: 'THU', date: '10' }, { day: 'FRI', date: '11' }] },
]
const times = ['09:00 AM', '10:30 AM', '12:00 PM', '02:30 PM', '04:00 PM', '05:30 PM']

function Brand() {
  return <div className="med-brand"><span className="med-brand-icon"><HeartPulse size={18} /></span><span>carely.</span></div>
}

export default function MedicalWorkflow({ onExit, initialCare = 'general', initialDoctor = 1 }) {
  const [step, setStep] = useState(1)
  const [care, setCare] = useState(initialCare || 'general')
  const [doctor, setDoctor] = useState(initialDoctor || 1)
  const [month, setMonth] = useState(0)
  const [date, setDate] = useState(2)
  const [time, setTime] = useState('10:30 AM')
  const [form, setForm] = useState({ name: '', email: '', phone: '', reason: '' })
  const [error, setError] = useState('')

  const selectedDoctor = useMemo(() => doctors.find((item) => item.id === doctor), [doctor])
  const selectedCare = careTypes.find((item) => item.id === care)
  const dates = schedules[month].dates

  const changeMonth = (direction) => {
    const nextMonth = Math.max(0, Math.min(schedules.length - 1, month + direction))
    setMonth(nextMonth)
    setDate(0)
  }

  const next = () => {
    if (step === 4 && (!form.name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))) {
      setError('Please add your name and a valid email to continue.')
      return
    }
    setError('')
    setStep((current) => Math.min(current + 1, 6))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const back = () => {
    if (step === 1) return onExit()
    setStep((current) => current - 1)
  }

  return (
    <main className="medical-app">
      <header className="med-header">
        <button className="med-back" onClick={back}><ArrowLeft size={18} /> {step === 1 ? 'Carely home' : 'Back'}</button>
        <Brand />
        <button className="med-close" onClick={onExit} aria-label="Close booking"><X size={20} /></button>
      </header>

      {step < 6 && <div className="med-progress-wrap">
        <div className="med-progress-labels"><span>Care · Doctor · Time · Details · Review</span><strong>{step} of 5</strong></div>
        <div className="med-progress"><span style={{ width: `${step * 20}%` }} /></div>
      </div>}

      <div className="medical-shell">
        {step === 1 && <section className="med-step">
          <div className="med-title"><span className="med-kicker">LET’S GET YOU CARED FOR</span><h1>What kind of care<br />do you need?</h1><p>Choose the option that feels closest. You can always adjust this later.</p></div>
          <div className="care-options">
            {careTypes.map((item) => { const Icon = item.icon; return <button key={item.id} className={care === item.id ? 'care-option selected' : 'care-option'} onClick={() => setCare(item.id)}>
              <span className={`care-icon ${item.color}`}><Icon size={24} /></span><span><strong>{item.name}</strong><small>{item.note}</small></span><span className="radio">{care === item.id && <Check size={14} />}</span>
            </button> })}
          </div>
          <div className="med-help"><Sparkles size={17} /><span><strong>Not sure where to start?</strong> General care is a great first step for most concerns.</span></div>
        </section>}

        {step === 2 && <section className="med-step wide">
          <div className="med-title row-title"><div><span className="med-kicker">YOUR CARE TEAM</span><h1>Choose your doctor.</h1></div><p>Every doctor is verified, highly rated, and currently accepting new patients.</p></div>
          <div className="doctor-list">
            {doctors.map((item) => <button key={item.id} className={doctor === item.id ? 'doctor-card selected' : 'doctor-card'} onClick={() => setDoctor(item.id)}>
              <span className="doctor-avatar" style={{ background: item.color }}>{item.initials}</span>
              <span className="doctor-info"><strong>{item.name}</strong><small>{item.field}</small><span>★ {item.rating} <i>·</i> {item.visits}</span></span>
              <span className="doctor-next"><small>Next available</small><strong>{item.next}</strong></span>
              <span className="radio">{doctor === item.id && <Check size={14} />}</span>
            </button>)}
          </div>
            <div className="med-trust"><ShieldCheck size={18} /><span>All Carely doctors are identity-verified and license-checked.</span></div>
        </section>}

        {step === 3 && <section className="med-step wide">
          <div className="med-title row-title"><div><span className="med-kicker">PICK A TIME</span><h1>When works for you?</h1></div><p>All times are shown in your local timezone.</p></div>
          <div className="schedule-layout">
            <div className="schedule-main">
              <div className="date-head"><button onClick={() => changeMonth(-1)} disabled={month === 0} aria-label="Previous month"><ChevronLeft size={18} /></button><strong>{schedules[month].label}</strong><button onClick={() => changeMonth(1)} disabled={month === schedules.length - 1} aria-label="Next month"><ArrowRight size={18} /></button></div>
              <div className="date-row">{dates.map((item, index) => <button key={item.date} className={date === index ? 'selected' : ''} onClick={() => setDate(index)}><small>{item.day}</small><strong>{item.date}</strong>{index === 2 && <i>Earliest</i>}</button>)}</div>
              <div className="time-label"><Clock3 size={17} /> Available times</div>
              <div className="time-grid">{times.map((item) => <button key={item} className={time === item ? 'selected' : ''} onClick={() => setTime(item)}>{item}</button>)}</div>
            </div>
            <aside className="doctor-summary"><span className="doctor-avatar" style={{ background: selectedDoctor.color }}>{selectedDoctor.initials}</span><div><small>YOU’RE BOOKING WITH</small><h3>{selectedDoctor.name}</h3><p>{selectedDoctor.field}</p></div><hr/><span><CalendarDays size={16} /> {dates[date].day}, {schedules[month].long.slice(0, 3).toUpperCase()} {dates[date].date}</span><span><Clock3 size={16} /> {time}</span><span><Video size={16} /> Video or in-clinic</span></aside>
          </div>
        </section>}

        {step === 4 && <section className="med-step form-step">
          <div className="med-title"><span className="med-kicker">ALMOST THERE</span><h1>Tell us a little<br />about you.</h1><p>We’ll use this only for your appointment and care communication.</p></div>
          <div className="patient-form">
            <label>Full name *<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your full name" /></label>
            <label>Email address *<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" /></label>
            <label>Phone number<input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Optional" /></label>
            <label>Reason for visit<textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="A short note for your doctor (optional)" /></label>
            {error && <div className="form-error">{error}</div>}
            <div className="privacy-note"><ShieldCheck size={18} /><span>Your information is encrypted and never sold.</span></div>
          </div>
        </section>}

        {step === 5 && <section className="med-step med-review-step">
          <div className="med-title"><span className="med-kicker">REVIEW YOUR REQUEST</span><h1>Everything look right?</h1><p>Check the appointment details before sending your request.</p></div>
          <div className="med-review-card">
            <div className="med-review-person"><span className="doctor-avatar" style={{ background: selectedDoctor.color }}>{selectedDoctor.initials}</span><span><small>DOCTOR</small><strong>{selectedDoctor.name}</strong><p>{selectedCare.name} · {selectedDoctor.field}</p></span><button onClick={() => setStep(2)}>Edit</button></div>
            <div className="med-review-grid">
              <div><small>DATE & TIME</small><strong>{dates[date].day}, {schedules[month].long} {dates[date].date}, 2026</strong><span>{time}</span><button onClick={() => setStep(3)}>Edit schedule</button></div>
              <div><small>PATIENT</small><strong>{form.name}</strong><span>{form.email}</span><button onClick={() => setStep(4)}>Edit details</button></div>
            </div>
            {form.reason.trim() && <div className="med-review-note"><small>NOTE FOR THE DOCTOR</small><p>{form.reason}</p></div>}
            <div className="med-demo-notice"><ShieldCheck size={17}/><span>This is a UI demo. Confirming will not contact a doctor or create an appointment.</span></div>
          </div>
        </section>}

        {step === 6 && <section className="med-success">
          <div className="success-icon"><CheckCircle2 size={45} /></div><span className="med-kicker">APPOINTMENT REQUESTED</span><h1>You’re all set.</h1><p>We’ve saved your appointment details. This is a UI demo, so no real appointment was created.</p>
          <div className="confirmation-card">
            <div><span className="doctor-avatar" style={{ background: selectedDoctor.color }}>{selectedDoctor.initials}</span><span><small>APPOINTMENT WITH</small><strong>{selectedDoctor.name}</strong><p>{selectedDoctor.field}</p></span></div>
            <hr/><div className="confirmation-details"><span><CalendarDays size={18} /> {dates[date].day}, {schedules[month].long} {dates[date].date}, 2026</span><span><Clock3 size={18} /> {time}</span><span><MapPin size={18} /> Video or Carely Clinic</span></div>
          </div>
          <button className="med-primary" onClick={onExit}>Return to Carely home <ArrowRight size={17} /></button>
        </section>}
      </div>

      {step < 6 && <footer className="med-footer"><div><span className="mobile-step">Step {step} of 5</span><span className="med-summary-line">{selectedCare?.name} {step > 1 && `· ${selectedDoctor.name}`} {step > 2 && `· ${dates[date].day} ${dates[date].date}, ${time}`}</span></div><button className="med-primary" onClick={next}>{step === 5 ? 'Confirm request' : step === 4 ? 'Review appointment' : 'Continue'} <ArrowRight size={17} /></button></footer>}
    </main>
  )
}
