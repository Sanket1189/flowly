import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft, ArrowRight, BarChart3, Bike, BriefcaseBusiness, CalendarDays,
  Check, CheckCircle2, ChevronRight, CircleDollarSign, Compass, Dumbbell,
  GraduationCap, Heart, Landmark, Lightbulb, Map, MapPin, Menu, MessageCircle,
  Mountain, PiggyBank, Plane, Rocket, Route, ShieldCheck, Sparkles, Star,
  Target, TrendingUp, Trophy, UserRound, WalletCards, X, Zap,
} from 'lucide-react'
import AuthModal from './AuthModal.jsx'
import { handleSectionLink, routeUrl } from './navigation.js'
import SelfServiceTool from './SelfServiceTools.jsx'
import './journey-sites.css'

const configs = {
  travel: {
    route: '/trip-planner', theme: 'travel-theme', brand: 'roamly.', mark: Compass, selfService: true,
    title: 'Roamly — Trips made personal', kicker: 'TRAVEL, DESIGNED AROUND YOU',
    lead: <>Go somewhere.<br/><em>Feel everything.</em></>,
    description: 'Thoughtful itineraries built around your interests, pace, and the moments you want to remember.',
    cta: 'Plan my trip', secondary: 'Browse trip styles', sectionLabel: 'CHOOSE YOUR KIND OF ESCAPE',
    sectionTitle: <>Every good trip starts<br/>with a feeling.</>,
    proof: ['Local-first ideas', 'Flexible itineraries', 'Built in minutes'],
    choices: [
      { id: 'culture', name: 'Culture & food', note: 'Local flavours, art and hidden stories', icon: Map },
      { id: 'nature', name: 'Nature & calm', note: 'Landscapes, slow mornings and fresh air', icon: Mountain },
      { id: 'adventure', name: 'Big adventure', note: 'Active days and unforgettable firsts', icon: Route },
    ],
    guides: [
      { id: 1, name: 'Ishita Kapoor', role: 'Culture & food curator', initials: 'IK', rating: '4.9' },
      { id: 2, name: 'Kabir Malhotra', role: 'Adventure planner', initials: 'KM', rating: '4.8' },
      { id: 3, name: 'Naina Joshi', role: 'Slow travel expert', initials: 'NJ', rating: '5.0' },
    ],
    outcomes: [
      { name: 'Day-by-day itinerary', note: 'Morning, afternoon and evening ideas balanced around your pace.', icon: CalendarDays },
      { name: 'Useful budget guide', note: 'See the daily and per-person budget before you leave.', icon: CircleDollarSign },
      { name: 'Easy to reshape', note: 'Change the duration, interests or pace and generate it again.', icon: Route },
    ],
    labels: { choice: 'trip style', guide: 'travel curator', plan: 'trip plan', note: 'Where would you love to go?', placeholder: 'Goa, Kyoto, anywhere...' },
    visual: { stat: '7 day escape', sub: 'Goa · India', metric: '82%', metricLabel: 'planned', icon: Plane },
  },
  fitness: {
    route: '/fitness-coaching', theme: 'fitness-theme', brand: 'stride.', mark: Dumbbell,
    title: 'Stride — Coaching that moves with you', kicker: 'YOUR PACE. YOUR PROGRESS.',
    lead: <>Get stronger.<br/><em>Stay yourself.</em></>,
    description: 'Human coaching and flexible plans that fit your body, your schedule, and your version of progress.',
    cta: 'Find my coach', secondary: 'Explore programs', sectionLabel: 'START WITH YOUR GOAL',
    sectionTitle: <>Training that meets<br/>you where you are.</>,
    proof: ['Real coaches', 'Flexible plans', 'No judgment'],
    choices: [
      { id: 'strength', name: 'Build strength', note: 'Feel capable, stable and powerful', icon: Dumbbell },
      { id: 'energy', name: 'Move & energise', note: 'More stamina for real everyday life', icon: Zap },
      { id: 'balance', name: 'Mobility & balance', note: 'Move freely and recover thoughtfully', icon: Bike },
    ],
    guides: [
      { id: 1, name: 'Aarav Kulkarni', role: 'Strength coach', initials: 'AK', rating: '4.9' },
      { id: 2, name: 'Meera Nair', role: 'Mobility specialist', initials: 'MN', rating: '5.0' },
      { id: 3, name: 'Dev Patel', role: 'Functional fitness coach', initials: 'DP', rating: '4.8' },
    ],
    labels: { choice: 'fitness goal', guide: 'coach', plan: 'coaching plan', note: 'Anything your coach should know?', placeholder: 'Your routine, preferences or limitations...' },
    visual: { stat: 'Today’s plan', sub: 'Full body · 32 min', metric: '4 wk', metricLabel: 'streak', icon: Trophy },
  },
  finance: {
    route: '/money-planning', theme: 'money-theme', brand: 'niva.', mark: WalletCards, selfService: true,
    title: 'Niva — Make money feel clear', kicker: 'MONEY CLARITY, MINUS THE JARGON',
    lead: <>Know your money.<br/><em>Shape your future.</em></>,
    description: 'Simple, guided planning for saving, spending and the milestones that matter to you.',
    cta: 'Build my plan', secondary: 'Explore money goals', sectionLabel: 'WHAT ARE YOU WORKING TOWARD?',
    sectionTitle: <>A plan for now.<br/>Confidence for later.</>,
    proof: ['Private by design', 'Plain-language guidance', 'Your pace'],
    choices: [
      { id: 'save', name: 'Build my savings', note: 'Create a cushion that feels achievable', icon: PiggyBank },
      { id: 'spend', name: 'Plan my spending', note: 'A realistic rhythm for everyday money', icon: BarChart3 },
      { id: 'future', name: 'Plan a milestone', note: 'Home, travel, education or something big', icon: Landmark },
    ],
    guides: [
      { id: 1, name: 'Riya Deshmukh', role: 'Financial wellness coach', initials: 'RD', rating: '4.9' },
      { id: 2, name: 'Aditya Verma', role: 'Savings strategist', initials: 'AV', rating: '4.8' },
      { id: 3, name: 'Neha Bansal', role: 'Goal planning specialist', initials: 'NB', rating: '5.0' },
    ],
    outcomes: [
      { name: 'Monthly allocation', note: 'See how income can flow across needs, wants, goals and buffer.', icon: BarChart3 },
      { name: 'Goal timeline', note: 'Turn a target amount into a sustainable monthly contribution.', icon: Target },
      { name: 'Spending guardrails', note: 'Get a daily flexible-spend guide and visible breathing room.', icon: ShieldCheck },
    ],
    labels: { choice: 'money goal', guide: 'planning coach', plan: 'money plan', note: 'What would feeling financially clear mean to you?', placeholder: 'Share your goal in your own words...' },
    visual: { stat: 'October goals', sub: '3 goals on track', metric: '68%', metricLabel: 'saved', icon: TrendingUp },
  },
  career: {
    route: '/career-mentor', theme: 'career-theme', brand: 'mento.', mark: BriefcaseBusiness,
    title: 'Mento — Career clarity, together', kicker: 'THE NEXT MOVE STARTS HERE',
    lead: <>Your career.<br/><em>More intentional.</em></>,
    description: 'One-to-one guidance for your next role, interview, pivot, or big professional decision.',
    cta: 'Meet my mentor', secondary: 'Explore career paths', sectionLabel: 'WHAT WOULD MOVE YOU FORWARD?',
    sectionTitle: <>Guidance for the moment<br/>you’re actually in.</>,
    proof: ['1:1 sessions', 'Experienced mentors', 'Practical next steps'],
    choices: [
      { id: 'role', name: 'Find my next role', note: 'Direction, search strategy and positioning', icon: Target },
      { id: 'interview', name: 'Prepare to interview', note: 'Practice, stories and clear confidence', icon: MessageCircle },
      { id: 'pivot', name: 'Make a career pivot', note: 'Translate your strengths into a new path', icon: Rocket },
    ],
    guides: [
      { id: 1, name: 'Ananya Sen', role: 'Product & leadership mentor', initials: 'AS', rating: '4.9' },
      { id: 2, name: 'Vikram Sethi', role: 'Career transition mentor', initials: 'VS', rating: '4.8' },
      { id: 3, name: 'Pooja Menon', role: 'Interview coach', initials: 'PM', rating: '5.0' },
    ],
    labels: { choice: 'career goal', guide: 'mentor', plan: 'mentoring session', note: 'What would you like to work through?', placeholder: 'Tell your mentor what is on your mind...' },
    visual: { stat: 'Your next move', sub: '3 clear action steps', metric: '1:1', metricLabel: 'support', icon: GraduationCap },
  },
}

export const TravelSite = ({ onExit }) => <JourneySite kind="travel" onExit={onExit}/>
export const FitnessSite = ({ onExit }) => <JourneySite kind="fitness" onExit={onExit}/>
export const MoneySite = ({ onExit }) => <JourneySite kind="finance" onExit={onExit}/>
export const CareerSite = ({ onExit }) => <JourneySite kind="career" onExit={onExit}/>

function Brand({ config }) { const Icon=config.mark; return <a className="journey-logo" href={routeUrl(config.route)} onClick={(event)=>handleSectionLink(event,'journey-top')}><span><Icon size={18}/></span>{config.brand}</a> }

function JourneySite({ kind, onExit }) {
  const config=configs[kind], [planner,setPlanner]=useState(false), [auth,setAuth]=useState(false), [help,setHelp]=useState(false), [menu,setMenu]=useState(false)
  useEffect(()=>{document.title=config.title;return()=>{document.title="Flowly — There's a flow for it"}},[config.title])
  if(planner)return config.selfService
    ? <SelfServiceTool kind={kind} config={config} initialChoice={planner===true?undefined:planner} onExit={()=>setPlanner(false)}/>
    : <JourneyPlanner config={config} initialChoice={planner===true?undefined:planner} onExit={()=>setPlanner(false)}/>
  const VisualIcon=config.visual.icon
  return <main className={`journey-site ${config.theme}`} id="journey-top" style={{'--j-accent':undefined}}>
    <header className="journey-header journey-shell"><button className="journey-return" onClick={onExit}><ArrowLeft size={16}/> Flowly</button><Brand config={config}/><nav id="journey-navigation" className={menu?'open':''}><a href={routeUrl(config.route)} onClick={(event)=>handleSectionLink(event,'journey-programs',()=>setMenu(false))}>Explore</a><a href={routeUrl(config.route)} onClick={(event)=>handleSectionLink(event,'journey-how',()=>setMenu(false))}>How it works</a><a href={routeUrl(config.route)} onClick={(event)=>handleSectionLink(event,'journey-guides',()=>setMenu(false))}>{config.selfService?'What you get':'Experts'}</a></nav><div className="journey-actions"><button onClick={()=>setHelp(true)}>Help</button>{!config.selfService&&<button onClick={()=>setAuth(true)}>Sign in</button>}<button className="journey-primary small" onClick={()=>setPlanner(true)}>{config.cta}</button></div><button className="journey-menu" aria-label={menu ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={menu} aria-controls="journey-navigation" onClick={()=>setMenu(!menu)}>{menu?<X/>:<Menu/>}</button></header>
    <section className="journey-hero journey-shell"><div className="journey-copy"><span className="journey-kicker"><Sparkles size={14}/>{config.kicker}</span><h1>{config.lead}</h1><p>{config.description}</p><div className="journey-hero-actions"><button className="journey-primary" onClick={()=>setPlanner(true)}>{config.cta}<ArrowRight size={17}/></button><a href={routeUrl(config.route)} onClick={(event)=>handleSectionLink(event,'journey-programs')}>{config.secondary}<ChevronRight size={16}/></a></div><div className="journey-proof">{config.proof.map(item=><span key={item}><Check size={13}/>{item}</span>)}</div></div><div className="journey-visual"><div className="visual-ring one"/><div className="visual-ring two"/><div className="journey-dashboard"><span className="dashboard-icon"><VisualIcon size={27}/></span><small>{config.visual.stat}</small><h3>{config.visual.sub}</h3><div className="dashboard-line"><i/><i/><i/><i/><i/></div><div><strong>{config.visual.metric}</strong><span>{config.visual.metricLabel}</span></div></div><span className="float-chip chip-a">✦ Personalised</span><span className="float-chip chip-b"><Star size={12} fill="currentColor"/> 4.9 member love</span></div></section>
    <section className="journey-programs journey-shell" id="journey-programs"><div className="journey-section-head"><div><span>{config.sectionLabel}</span><h2>{config.sectionTitle}</h2></div><p>Choose a starting point. Your experience will adapt as you share what matters most.</p></div><div className="journey-choice-grid">{config.choices.map(({id,name,note,icon:Icon},index)=><button key={id} onClick={()=>setPlanner(id)}><span>0{index+1}</span><i><Icon size={25}/></i><h3>{name}</h3><p>{note}</p><b>Start here <ArrowRight size={16}/></b></button>)}</div></section>
    <section className="journey-how journey-shell" id="journey-how"><div><span>{config.selfService?'A SIMPLE, PRIVATE PROCESS':'A SIMPLE, HUMAN PROCESS'}</span><h2>Clarity doesn’t have<br/>to feel complicated.</h2><p>{config.selfService?'Share a few practical details and the tool will build a useful plan immediately—right in your browser.':'Start with a few focused choices, meet the right expert, and leave with a path you can actually use.'}</p><button onClick={()=>setPlanner(true)}>Begin now <ArrowRight size={16}/></button></div><ol>{config.selfService?<><li><b>01</b><span><strong>Add the essentials</strong><small>Only the details needed to shape your result.</small></span></li><li><b>02</b><span><strong>Set your preferences</strong><small>Make the plan fit your real priorities.</small></span></li><li><b>03</b><span><strong>Use your plan</strong><small>Get a clear result you can adjust instantly.</small></span></li></>:<><li><b>01</b><span><strong>Choose your goal</strong><small>Start with the outcome that matters now.</small></span></li><li><b>02</b><span><strong>Choose your expert</strong><small>Find the experience and style that fit you.</small></span></li><li><b>03</b><span><strong>Shape the session</strong><small>Pick a time and share useful context.</small></span></li><li><b>04</b><span><strong>Review your request</strong><small>Check every detail before confirming.</small></span></li></>}</ol></section>
    <section className="journey-guides journey-shell" id="journey-guides">{config.selfService?<><div className="journey-section-head centered"><div><span>BUILT FOR DOING</span><h2>A useful result.<br/>Not another appointment.</h2></div></div><div className="journey-output-grid">{config.outcomes.map(({name,note,icon:Icon})=><article key={name}><i><Icon size={25}/></i><h3>{name}</h3><p>{note}</p><button onClick={()=>setPlanner(true)}>Try the tool <ArrowRight size={15}/></button></article>)}</div></>:<><div className="journey-section-head centered"><div><span>MEET YOUR PEOPLE</span><h2>Expertise with a<br/>human point of view.</h2></div></div><div className="journey-guide-grid">{config.guides.map((guide,index)=><article key={guide.id}><div className={`guide-portrait gp-${index+1}`}>{guide.initials}</div><h3>{guide.name}</h3><p>{guide.role}</p><span><Star size={12} fill="currentColor"/> {guide.rating}</span><button onClick={()=>setPlanner(true)}>Choose {guide.name.split(' ')[0]}<ArrowRight size={15}/></button></article>)}</div></>}</section>
    <section className="journey-cta journey-shell"><div><span>YOUR NEXT STEP</span><h2>Start with clarity.<br/>Move with confidence.</h2></div><button className="journey-primary light" onClick={()=>setPlanner(true)}>{config.cta}<ArrowRight size={17}/></button></section>
    <footer className="journey-footer journey-shell"><Brand config={config}/><p>Designed around your next step.</p><div><a href={routeUrl(config.route)} onClick={(event)=>handleSectionLink(event,'journey-programs')}>Explore</a><a href={routeUrl(config.route)} onClick={(event)=>handleSectionLink(event,'journey-guides')}>{config.selfService?'Your result':'Experts'}</a><button onClick={()=>setHelp(true)}>Support</button></div><small>© 2026 {config.brand.replace('.','')}</small></footer>
    {auth&&<AuthModal brand={config.brand.replace('.','')} onClose={()=>setAuth(false)}/>} {help&&<JourneyHelp config={config} onClose={()=>setHelp(false)} onStart={()=>{setHelp(false);setPlanner(true)}}/>}
  </main>
}

function JourneyHelp({config,onClose,onStart}){const[topic,setTopic]=useState('');const topics=config.selfService?['What details do I need?','How is my plan calculated?','Is anything saved?']:['Choosing where to start','How experts are selected','Pricing and availability'];return <div className="journey-overlay" role="dialog" aria-modal="true" aria-label={`${config.brand.replace('.','')} help`}><button className="journey-overlay-bg" onClick={onClose} aria-label="Close help"/><aside className="journey-help"><button className="journey-help-close" onClick={onClose} aria-label="Close help"><X size={18}/></button><span><HelpCircleIcon/></span><h2>How can we help?</h2><p>Choose what you need and we’ll guide you.</p>{topics.map(item=><button key={item} className={topic===item?'active':''} onClick={()=>setTopic(item)}>{item}<ChevronRight size={15}/></button>)}{topic&&<div className="journey-help-answer"><Check size={15}/>{config.selfService?'The tool uses only the details you enter, calculates locally, and does not save them.':'That’s exactly what the guided flow is designed to help with.'}</div>}<button className="journey-primary" onClick={onStart}>Start now <ArrowRight size={15}/></button></aside></div>}
function HelpCircleIcon(){return <Lightbulb size={23}/>}

function JourneyPlanner({config,onExit,initialChoice}){
  const [step,setStep]=useState(1)
  const [choice,setChoice]=useState(initialChoice||config.choices[0].id)
  const [guide,setGuide]=useState(1)
  const [slot,setSlot]=useState('Tue · 6:00 PM')
  const [form,setForm]=useState({name:'',email:'',note:''})
  const [error,setError]=useState('')
  const [done,setDone]=useState(false)
  const selectedChoice=useMemo(()=>config.choices.find(item=>item.id===choice),[choice,config.choices])
  const selectedGuide=config.guides.find(item=>item.id===guide)
  const goTo=value=>{setError('');setStep(value);window.scrollTo(0,0)}
  const next=()=>{
    if(step===4&&(!form.name.trim()||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))){setError('Add your name and a valid email to continue.');return}
    setError('')
    if(step===4)setDone(true)
    else goTo(step+1)
  }
  if(done)return <main className={`journey-planner ${config.theme}`}><PlannerHead config={config} onBack={onExit}/><section className="journey-success"><span><CheckCircle2 size={45}/></span><small>SESSION REQUESTED</small><h1>Your next step<br/>is taking shape.</h1><p>Your choices are saved in this demo. No real expert or service was contacted.</p><div className="journey-confirm"><div><span>{selectedGuide.initials}</span><div><small>YOUR {config.labels.guide.toUpperCase()}</small><strong>{selectedGuide.name}</strong><p>{selectedGuide.role}</p></div></div><hr/><p><Target size={17}/>{selectedChoice.name}</p><p><CalendarDays size={17}/>{slot}</p></div><button className="journey-primary" onClick={onExit}>Return to {config.brand}<ArrowRight size={16}/></button></section></main>
  return <main className={`journey-planner ${config.theme}`}>
    <PlannerHead config={config} onBack={()=>step===1?onExit():goTo(step-1)} back={step>1}/>
    <div className="journey-progress"><span style={{width:`${step*25}%`}}/></div>
    <div className="journey-flow-label"><span>Goal</span><span>{config.labels.guide}</span><span>Session</span><span>Review</span><strong>{step} of 4</strong></div>
    <section className="journey-plan-shell">
      {step===1&&<><PlanTitle label={`CHOOSE YOUR ${config.labels.choice.toUpperCase()}`} title="What feels most like your next step?" text="Pick the closest match. You can shape the details as you go."/><div className="plan-choice-list">{config.choices.map(({id,name,note,icon:Icon})=><button key={id} className={choice===id?'selected':''} onClick={()=>setChoice(id)}><i><Icon size={23}/></i><span><strong>{name}</strong><small>{note}</small></span><b>{choice===id&&<Check size={14}/>}</b></button>)}</div></>}
      {step===2&&<><PlanTitle label={`CHOOSE YOUR ${config.labels.guide.toUpperCase()}`} title="Who feels like the right fit?" text="Compare expertise and choose the person you would feel comfortable working with."/><div className="plan-guide-list">{config.guides.map((item,index)=><button key={item.id} className={guide===item.id?'selected':''} onClick={()=>setGuide(item.id)}><span className={`gp-${index+1}`}>{item.initials}</span><span><strong>{item.name}</strong><small>{item.role}</small><i><Star size={11} fill="currentColor"/>{item.rating}</i></span><b>{guide===item.id&&<Check size={14}/>}</b></button>)}</div></>}
      {step===3&&<><PlanTitle label="SHAPE YOUR SESSION" title="When should you connect?" text="Choose a time and give your expert a little context before the conversation."/><div className="plan-final"><div className="plan-slots"><h3>Available sessions</h3>{['Tue · 6:00 PM','Wed · 11:30 AM','Thu · 4:00 PM','Sat · 10:00 AM'].map(item=><button key={item} className={slot===item?'selected':''} onClick={()=>setSlot(item)}><CalendarDays size={16}/>{item}<i>{slot===item&&<Check size={13}/>}</i></button>)}</div><div className="plan-form"><label>{config.labels.note}<textarea value={form.note} onChange={e=>setForm({...form,note:e.target.value})} placeholder={config.labels.placeholder}/></label><div className="plan-session-summary"><small>YOUR SESSION</small><strong>{selectedChoice.name}</strong><span>with {selectedGuide.name}</span></div><small><ShieldCheck size={14}/> Your note stays private in this demo.</small></div></div></>}
      {step===4&&<><PlanTitle label="REVIEW & CONTACT" title="Ready for your next step?" text="Add your contact details and review the request before confirming."/><div className="plan-review-layout"><div className="journey-review-card"><div><span>{selectedGuide.initials}</span><section><small>YOUR {config.labels.guide.toUpperCase()}</small><strong>{selectedGuide.name}</strong><p>{selectedGuide.role}</p></section><button onClick={()=>goTo(2)}>Edit</button></div><hr/><p><Target size={17}/><span><small>GOAL</small><strong>{selectedChoice.name}</strong></span><button onClick={()=>goTo(1)}>Edit</button></p><p><CalendarDays size={17}/><span><small>SESSION</small><strong>{slot}</strong></span><button onClick={()=>goTo(3)}>Edit</button></p>{form.note&&<blockquote>{form.note}</blockquote>}</div><div className="plan-form"><label>Full name *<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Your name"/></label><label>Email address *<input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="you@example.com"/></label>{error&&<span>{error}</span>}<small><ShieldCheck size={14}/> This is a UI demo. Confirming will not contact an expert.</small></div></div></>}
    </section>
    <footer className="journey-plan-footer"><span>{selectedChoice.name} {step>1&&`· ${selectedGuide.name}`} {step>2&&`· ${slot}`}</span><button className="journey-primary" onClick={next}>{step===4?'Request session':step===3?'Review details':'Continue'}<ArrowRight size={16}/></button></footer>
  </main>
}
function PlannerHead({config,onBack,back}){return <header className="journey-plan-head"><button onClick={onBack}><ArrowLeft size={17}/>{back?'Back':`${config.brand} home`}</button><Brand config={config}/><button onClick={onBack} aria-label="Close"><X size={18}/></button></header>}
function PlanTitle({label,title,text}){return <div className="plan-title"><span>{label}</span><h1>{title}</h1><p>{text}</p></div>}
