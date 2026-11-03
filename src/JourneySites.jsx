import { useEffect, useMemo, useState } from 'react'
import {
  Activity, ArrowLeft, ArrowRight, BarChart3, Bike, BookOpen, BriefcaseBusiness,
  CalendarDays, Check, CheckCircle2, ChevronRight, CircleDollarSign, Clock,
  Compass, Dumbbell, FileText, Flame, Gauge, GraduationCap, Heart, Landmark,
  Layers3, Lightbulb, Map, MapPin, Menu, MessageCircle, Mountain, Network,
  PiggyBank, Plane, Plus, Rocket, Route, Search, ShieldCheck, Sparkles, Star, Target,
  TrendingUp, Trophy, UserRound, Users, WalletCards, X, Zap,
} from 'lucide-react'
import AuthModal from './AuthModal.jsx'
import { handleSectionLink, routeUrl } from './navigation.js'
import SelfServiceTool from './SelfServiceTools.jsx'
import './journey-sites.css'
import './specialized-journeys.css'

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
export const FitnessSite = ({ onExit }) => <FitnessExperience onExit={onExit}/>
export const MoneySite = ({ onExit }) => <JourneySite kind="finance" onExit={onExit}/>
export const CareerSite = ({ onExit }) => <CareerExperience onExit={onExit}/>

const fitnessGoals = [
  { id: 'strength', label: 'Build strength', note: 'Progressive full-body training', icon: Dumbbell },
  { id: 'energy', label: 'Feel more energised', note: 'Conditioning without burnout', icon: Zap },
  { id: 'mobility', label: 'Move more freely', note: 'Mobility, balance and recovery', icon: Activity },
]
const trainingDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function FitnessExperience({ onExit }) {
  const [studio, setStudio] = useState(false)
  useEffect(()=>{document.title='Stride — Build a training rhythm';return()=>{document.title="Flowly — There's a flow for it"}},[])
  if(studio) return <FitnessStudioComplete onExit={()=>setStudio(false)}/>
  return <main className="stride-site" id="stride-top">
    <header className="stride-nav stride-wrap">
      <button className="stride-flowly" onClick={onExit}><ArrowLeft size={16}/> Flowly</button>
      <a className="stride-brand" href={routeUrl('/fitness-coaching')} onClick={event=>handleSectionLink(event,'stride-top')}><span><Activity size={19}/></span>stride</a>
      <nav><a href={routeUrl('/fitness-coaching')} onClick={event=>handleSectionLink(event,'stride-method')}>Method</a><a href={routeUrl('/fitness-coaching')} onClick={event=>handleSectionLink(event,'stride-week')}>Your week</a></nav>
      <button className="stride-start" onClick={()=>setStudio(true)}>Build my plan <ArrowRight size={16}/></button>
    </header>
    <section className="stride-hero stride-wrap">
      <div className="stride-hero-copy"><span>COACHING WITHOUT THE COPY-PASTE PLAN</span><h1>Train for your<br/><em>actual life.</em></h1><p>Tell us what your week feels like. Stride turns your energy, time and equipment into a training rhythm you can keep.</p><div><button onClick={()=>setStudio(true)}>Build my training week <ArrowRight size={17}/></button><small><ShieldCheck size={14}/> No sign-up · takes about 60 seconds</small></div></div>
      <div className="stride-board" aria-label="Example weekly training plan">
        <div className="stride-board-head"><span>THIS WEEK</span><strong>3 sessions · 96 min</strong><i><Flame size={17}/> 7 day streak</i></div>
        <article className="stride-session lime"><b>MON</b><div><small>FULL BODY</small><strong>Foundation strength</strong><span>32 min · Moderate</span></div><Dumbbell size={23}/></article>
        <article className="stride-session violet"><b>WED</b><div><small>MOBILITY</small><strong>Hips + spine reset</strong><span>22 min · Gentle</span></div><Activity size={23}/></article>
        <article className="stride-session orange"><b>SAT</b><div><small>CONDITIONING</small><strong>Weekend engine</strong><span>42 min · Build</span></div><Zap size={23}/></article>
        <div className="stride-readiness"><Gauge size={22}/><span><small>TODAY'S READINESS</small><strong>Feeling good</strong></span><b>78</b></div>
      </div>
    </section>
    <section className="stride-method" id="stride-method">
      <div className="stride-wrap"><div className="stride-section-title"><span>THE INPUTS THAT MATTER</span><h2>A plan that bends<br/>before you break.</h2><p>Instead of choosing a coach and booking a slot, you shape a living plan around the reality of your week.</p></div><div className="stride-metrics"><article><strong>01</strong><Activity/><h3>Readiness first</h3><p>Choose how you feel today and the effort adapts.</p></article><article><strong>02</strong><Clock/><h3>Time, honestly</h3><p>Ten useful minutes beats an imaginary hour.</p></article><article><strong>03</strong><Layers3/><h3>Equipment aware</h3><p>Home, gym or no equipment—the plan still works.</p></article></div></div>
    </section>
    <section className="stride-week stride-wrap" id="stride-week"><div><span>START SMALL. STAY CONSISTENT.</span><h2>Your week is the<br/>training interface.</h2></div><button onClick={()=>setStudio(true)}>Open plan studio <ArrowRight size={17}/></button></section>
    <footer className="stride-footer stride-wrap"><span>stride</span><p>Adaptive training for ordinary weeks.</p><small>© 2026 Stride demo</small></footer>
  </main>
}

function FitnessStudio({ onExit }) {
  const [step,setStep]=useState(1), [goal,setGoal]=useState('strength'), [energy,setEnergy]=useState('steady')
  const [equipment,setEquipment]=useState('bodyweight'), [minutes,setMinutes]=useState(30), [days,setDays]=useState(['Mon','Wed','Sat'])
  const [completed,setCompleted]=useState([])
  const toggleDay=day=>setDays(current=>current.includes(day)?(current.length>1?current.filter(item=>item!==day):current):[...current,day])
  const selectedGoal=fitnessGoals.find(item=>item.id===goal)
  const sessions=[...days].sort((a,b)=>trainingDays.indexOf(a)-trainingDays.indexOf(b)).map((day,index)=>({day,title:index%2?goal==='mobility'?'Flow + balance':'Recovery mobility':selectedGoal.label,duration:Math.max(10,minutes-(index%2?5:0)),tone:['lime','violet','orange','blue'][index%4]}))
  return <main className="stride-studio">
    <header><button onClick={onExit}><ArrowLeft size={16}/> Back to Stride</button><strong><Activity size={18}/> stride / plan studio</strong><span>STEP {step} OF 3</span></header>
    <div className="stride-studio-progress"><i style={{width:`${step*33.333}%`}}/></div>
    {step===1&&<section className="stride-studio-shell"><div className="stride-studio-intro"><span>01 · DIRECTION</span><h1>What should training do for you?</h1><p>There is no coach catalogue here. Start with the change you want to feel.</p></div><div className="stride-goal-cards">{fitnessGoals.map(({id,label,note,icon:Icon})=><button key={id} className={goal===id?'active':''} onClick={()=>setGoal(id)}><Icon/><span><strong>{label}</strong><small>{note}</small></span><i>{goal===id&&<Check/>}</i></button>)}</div><div className="stride-energy"><span>How is your energy lately?</span>{[['low','Running low'],['steady','Fairly steady'],['high','Ready to push']].map(([id,label])=><button key={id} className={energy===id?'active':''} onClick={()=>setEnergy(id)}>{label}</button>)}</div></section>}
    {step===2&&<section className="stride-studio-shell"><div className="stride-studio-intro"><span>02 · REALITY CHECK</span><h1>Build around your week.</h1><p>Pick the days that are genuinely available. You can reshuffle later.</p></div><div className="stride-rhythm-grid"><article><label>TRAINING DAYS</label><div className="stride-day-picker">{trainingDays.map(day=><button key={day} className={days.includes(day)?'active':''} onClick={()=>toggleDay(day)}>{day}<i>{days.includes(day)&&<Check size={12}/>}</i></button>)}</div></article><article><label>TIME PER SESSION</label><strong>{minutes} min</strong><input type="range" min="10" max="60" step="5" value={minutes} onChange={event=>setMinutes(Number(event.target.value))}/><div><span>10</span><span>Quick enough to keep</span><span>60</span></div></article><article><label>AVAILABLE EQUIPMENT</label><div className="stride-equipment">{[['bodyweight','Bodyweight'],['home','Home kit'],['gym','Full gym']].map(([id,label])=><button key={id} className={equipment===id?'active':''} onClick={()=>setEquipment(id)}>{label}</button>)}</div></article><aside><Flame/><div><small>PLAN LOAD</small><strong>{days.length*minutes} minutes / week</strong><p>{energy==='low'?'Recovery-forward and intentionally light.':energy==='high'?'Progressive with one higher-effort day.':'Balanced effort with space to recover.'}</p></div></aside></div></section>}
    {step===3&&<section className="stride-result"><div className="stride-result-title"><span>YOUR FIRST WEEK</span><h1>A rhythm you can edit,<br/>not a promise to break.</h1><p>{selectedGoal.label} · {equipment} · {days.length} days</p><div className="stride-completion"><strong>{completed.length}/{sessions.length}</strong><span>sessions complete<i><b style={{width:`${sessions.length?completed.length/sessions.length*100:0}%`}}/></i></span></div></div><div className="stride-plan-list">{sessions.map((session,index)=><article className={`${session.tone} ${completed.includes(session.day)?'completed':''}`} key={session.day}><b>{String(index+1).padStart(2,'0')}</b><div><small>{session.day.toUpperCase()} · {session.duration} MIN</small><strong>{session.title}</strong><span>{index%2?'Easy technique + recovery':'Progressive working sets'}</span></div><button aria-label={`${completed.includes(session.day)?'Mark':'Mark'} ${session.title} ${completed.includes(session.day)?'incomplete':'complete'}`} onClick={()=>setCompleted(current=>current.includes(session.day)?current.filter(day=>day!==session.day):[...current,session.day])}><Check/></button></article>)}</div><div className="stride-result-note"><ShieldCheck/><span><strong>Demo plan only</strong><small>Use professional guidance for injuries or medical conditions.</small></span></div></section>}
    <footer className="stride-studio-footer"><button onClick={()=>step===1?onExit():setStep(step-1)}>{step===1?'Cancel':'Back'}</button><span>{selectedGoal.label} · {days.length} days · {minutes} min</span>{step<3?<button onClick={()=>setStep(step+1)}>Continue <ArrowRight size={16}/></button>:<button onClick={()=>setStep(2)}>Adjust plan <Activity size={16}/></button>}</footer>
  </main>
}

const careerDirections=[
  {id:'next',label:'Move into a stronger role',note:'Position your experience for the next level',icon:TrendingUp},
  {id:'pivot',label:'Explore a thoughtful pivot',note:'Translate what you know into a new direction',icon:Network},
  {id:'interview',label:'Tell my story better',note:'Turn experience into clear, memorable evidence',icon:MessageCircle},
]
const careerEvidence=['Led a project','Improved a metric','Mentored someone','Presented to leaders','Owned a difficult decision','Built a new skill']

function CareerExperience({ onExit }) {
  const [lab,setLab]=useState(false), [initialDirection,setInitialDirection]=useState('next')
  useEffect(()=>{document.title='Mento — Career decision workspace';return()=>{document.title="Flowly — There's a flow for it"}},[])
  const openLab=id=>{setInitialDirection(id);setLab(true)}
  if(lab)return <CareerLabComplete initialDirection={initialDirection} onExit={()=>setLab(false)}/>
  return <main className="mento-site" id="mento-top">
    <header className="mento-nav mento-wrap"><button onClick={onExit}><ArrowLeft size={16}/> Flowly</button><a href={routeUrl('/career-mentor')} onClick={event=>handleSectionLink(event,'mento-top')}><span>M</span> mento</a><nav><a href={routeUrl('/career-mentor')} onClick={event=>handleSectionLink(event,'mento-paths')}>Decision paths</a><a href={routeUrl('/career-mentor')} onClick={event=>handleSectionLink(event,'mento-board')}>Action board</a></nav><button onClick={()=>openLab('next')}>Open workspace</button></header>
    <section className="mento-hero mento-wrap"><div className="mento-issue"><span>CAREER CLARITY / 2026</span><h1>Don’t book advice.<br/><em>Build a case.</em></h1></div><div className="mento-hero-side"><p>A visual workspace that turns scattered experience into a direction, an evidence story and a practical 30-day move.</p><button onClick={()=>openLab('next')}>Map my next move <ArrowRight/></button></div><div className="mento-marquee"><span>ROLE DIRECTION</span><i/> <span>SKILL EVIDENCE</span><i/> <span>DECISION MAP</span><i/> <span>30-DAY SPRINT</span></div></section>
    <section className="mento-paths mento-wrap" id="mento-paths"><div className="mento-index"><span>01</span><p>CHOOSE THE QUESTION<br/>BEFORE THE ANSWER</p></div><div className="mento-path-list">{careerDirections.map(({id,label,note,icon:Icon},index)=><button key={id} onClick={()=>openLab(id)}><span>{String(index+1).padStart(2,'0')}</span><Icon/><div><strong>{label}</strong><small>{note}</small></div><ArrowRight/></button>)}</div></section>
    <section className="mento-board" id="mento-board"><div className="mento-wrap"><div className="mento-board-copy"><span>NOT ANOTHER MENTOR DIRECTORY</span><h2>See the work<br/>between here<br/>and there.</h2><p>Mento does not begin with profiles and calendars. It begins with your evidence—then exposes the smallest useful next move.</p></div><div className="mento-kanban"><article><b>WHAT I KNOW</b><span>Customer discovery</span><span>Cross-team delivery</span><span>Analytics</span></article><article><b>WHAT I NEED TO PROVE</b><span>Strategic scope</span><span>Team influence</span></article><article><b>NEXT 30 DAYS</b><span>Rewrite 2 stories</span><span>Run 3 conversations</span><span>Ship one proof project</span></article></div></div></section>
    <section className="mento-cta mento-wrap"><span>READY WHEN THE QUESTION IS</span><h2>Turn your experience<br/>into a direction.</h2><button onClick={()=>openLab('pivot')}>Start a decision map <ArrowRight/></button></section>
    <footer className="mento-footer mento-wrap"><strong>mento</strong><p>A career thinking tool—not a booking service.</p><small>© 2026 Mento demo</small></footer>
  </main>
}

function CareerLab({initialDirection,onExit}){
  const [stage,setStage]=useState('question'), [direction,setDirection]=useState(initialDirection), [evidence,setEvidence]=useState(['Led a project','Improved a metric'])
  const [target,setTarget]=useState('Senior product role')
  const [customEvidence,setCustomEvidence]=useState(''), [extraEvidence,setExtraEvidence]=useState([])
  const toggleEvidence=item=>setEvidence(current=>current.includes(item)?current.filter(value=>value!==item):[...current,item])
  const allEvidence=[...evidence,...extraEvidence]
  const addEvidence=()=>{const value=customEvidence.trim();if(!value||allEvidence.includes(value))return;setExtraEvidence(current=>[...current,value]);setCustomEvidence('')}
  const active=careerDirections.find(item=>item.id===direction)
  return <main className="mento-lab"><header><button onClick={onExit}><X/> Close</button><strong><span>M</span> Career decision workspace</strong><small>Saved in this session</small></header><div className="mento-lab-shell"><aside><span>YOUR MAP</span>{[['question','1','Direction'],['evidence','2','Evidence'],['roadmap','3','Roadmap']].map(([id,num,label])=><button key={id} disabled={id==='roadmap'&&!allEvidence.length} className={stage===id?'active':''} onClick={()=>setStage(id)}><b>{num}</b><span>{label}</span>{(id==='question'||(id==='evidence'&&stage==='roadmap'))&&<Check/>}</button>)}<div><Lightbulb/><p><strong>Keep it specific.</strong><br/>A useful career question creates a decision, not a personality test.</p></div></aside><section className="mento-workspace">
    {stage==='question'&&<><div className="mento-lab-title"><span>01 / FRAME THE DECISION</span><h1>What are you trying<br/>to make clearer?</h1></div><div className="mento-direction-grid">{careerDirections.map(({id,label,note,icon:Icon})=><button key={id} className={direction===id?'active':''} onClick={()=>setDirection(id)}><Icon/><span><strong>{label}</strong><small>{note}</small></span>{direction===id&&<Check/>}</button>)}</div><label className="mento-target">THE OUTCOME IN YOUR WORDS<input value={target} onChange={event=>setTarget(event.target.value)} placeholder="e.g. Move into product leadership"/><small>{target.trim() ? `${target.trim().length} characters · clear enough to test` : 'Add a specific outcome before continuing.'}</small></label><button className="mento-next" disabled={!target.trim()} onClick={()=>setStage('evidence')}>Map my evidence <ArrowRight/></button></>}
    {stage==='evidence'&&<><div className="mento-lab-title"><span>02 / BUILD THE CASE</span><h1>What have you<br/>already proven?</h1><p>Select real signals. The roadmap will use them as raw material.</p></div><div className="mento-evidence-grid">{careerEvidence.map(item=><button key={item} className={evidence.includes(item)?'active':''} onClick={()=>toggleEvidence(item)}><span>{evidence.includes(item)?<Check/>:<span/>}</span>{item}</button>)}{extraEvidence.map(item=><button key={item} className="active" onClick={()=>setExtraEvidence(current=>current.filter(value=>value!==item))}><span><Check/></span>{item}</button>)}</div><div className="mento-add-evidence"><input value={customEvidence} onChange={event=>setCustomEvidence(event.target.value)} onKeyDown={event=>event.key==='Enter'&&addEvidence()} placeholder="Add your own evidence signal"/><button onClick={addEvidence}><Plus size={16}/> Add</button></div><div className="mento-evidence-note"><FileText/><span><strong>{allEvidence.length} evidence signals selected</strong><small>You can remove a custom signal by selecting it again.</small></span></div><button className="mento-next" disabled={!allEvidence.length} onClick={()=>setStage('roadmap')}>Create my roadmap <ArrowRight/></button></>}
    {stage==='roadmap'&&<><div className="mento-roadmap-head"><div><span>03 / YOUR DECISION MAP</span><h1>{target||active.label}</h1><p>{active.label} · built from {allEvidence.length} evidence signals</p></div><button onClick={()=>setStage('question')}>Edit direction</button></div><div className="mento-roadmap-grid"><article><span>NOW</span><h3>Name the strongest proof</h3><p>Write one concise story showing how you created a result—not only what you were responsible for.</p><b>20 minutes</b></article><article><span>NEXT 7 DAYS</span><h3>Test the direction</h3><p>Have two conversations with people close to the work. Ask what strong performance actually looks like.</p><b>2 conversations</b></article><article><span>THIS MONTH</span><h3>Create visible evidence</h3><p>Choose one small project that demonstrates the missing scope before you ask for the title.</p><b>1 proof project</b></article></div><div className="mento-roadmap-bottom"><div><BookOpen/><span><strong>Your working brief</strong><small>{allEvidence.join(' · ')||'Add evidence to strengthen this map'}</small></span></div><button onClick={()=>setStage('evidence')}>Refine evidence</button></div></>}
  </section></div></main>
}

const fitnessSupport = [
  {id:'solo',name:'Self-guided rhythm',note:'Use the adaptive plan and weekly check-ins.',price:0,badge:'Included'},
  {id:'review',name:'Coach plan review',note:'A coach reviews your week and leaves focused notes.',price:799,badge:'Most flexible'},
  {id:'coach',name:'Coached month',note:'Four check-ins, plan adjustments and form feedback.',price:1499,badge:'Most support'},
]
const fitnessCoaches = [
  {id:'riya',name:'Riya Kapoor',initials:'RK',focus:'Strength for busy weeks',rating:'4.9'},
  {id:'dev',name:'Dev Shah',initials:'DS',focus:'Energy and conditioning',rating:'4.8'},
  {id:'tara',name:'Tara Menon',initials:'TM',focus:'Mobility and recovery',rating:'5.0'},
]

function FitnessStudioComplete({onExit}){
  const [step,setStep]=useState(1), [goal,setGoal]=useState('strength'), [energy,setEnergy]=useState('steady')
  const [equipment,setEquipment]=useState('bodyweight'), [minutes,setMinutes]=useState(30), [days,setDays]=useState(['Mon','Wed','Sat'])
  const [support,setSupport]=useState('review'), [coach,setCoach]=useState('riya'), [profile,setProfile]=useState({name:'',email:''})
  const [completed,setCompleted]=useState([]), [error,setError]=useState('')
  const selectedGoal=fitnessGoals.find(item=>item.id===goal), selectedSupport=fitnessSupport.find(item=>item.id===support), selectedCoach=fitnessCoaches.find(item=>item.id===coach)
  const sessions=[...days].sort((a,b)=>trainingDays.indexOf(a)-trainingDays.indexOf(b)).map((day,index)=>({day,title:index%2?goal==='mobility'?'Flow + balance':'Recovery mobility':selectedGoal.label,duration:Math.max(10,minutes-(index%2?5:0)),tone:['lime','violet','orange','blue'][index%4]}))
  const toggleDay=day=>setDays(current=>current.includes(day)?(current.length>1?current.filter(item=>item!==day):current):[...current,day])
  const next=()=>{
    if(step===4&&(!profile.name.trim()||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email.trim()))){setError('Add your name and a valid email to activate this demo plan.');return}
    setError('');setStep(current=>Math.min(5,current+1))
  }
  return <main className="stride-studio stride-complete-flow">
    <header><button onClick={onExit}><ArrowLeft size={16}/> Back to Stride</button><strong><Activity size={18}/> stride / coaching studio</strong><span>STEP {step} OF 5</span></header>
    <div className="stride-studio-progress"><i style={{width:`${step*20}%`}}/></div>
    {step===1&&<section className="stride-studio-shell"><div className="stride-studio-intro"><span>01 · DIRECTION</span><h1>What should training do for you?</h1><p>Start with the change you want to feel, then set the effort that fits this season.</p></div><div className="stride-goal-cards">{fitnessGoals.map(({id,label,note,icon:Icon})=><button key={id} className={goal===id?'active':''} onClick={()=>setGoal(id)}><Icon/><span><strong>{label}</strong><small>{note}</small></span><i>{goal===id&&<Check/>}</i></button>)}</div><div className="stride-energy"><span>How is your energy lately?</span>{[['low','Running low'],['steady','Fairly steady'],['high','Ready to push']].map(([id,label])=><button key={id} className={energy===id?'active':''} onClick={()=>setEnergy(id)}>{label}</button>)}</div></section>}
    {step===2&&<section className="stride-studio-shell"><div className="stride-studio-intro"><span>02 · REALITY CHECK</span><h1>Build around your week.</h1><p>Choose days you can protect, honest session length and equipment you already have.</p></div><div className="stride-rhythm-grid"><article><label>TRAINING DAYS</label><div className="stride-day-picker">{trainingDays.map(day=><button key={day} className={days.includes(day)?'active':''} onClick={()=>toggleDay(day)}>{day}<i>{days.includes(day)&&<Check size={12}/>}</i></button>)}</div></article><article><label>TIME PER SESSION</label><strong>{minutes} min</strong><input aria-label="Minutes per session" type="range" min="10" max="60" step="5" value={minutes} onChange={event=>setMinutes(Number(event.target.value))}/><div><span>10</span><span>Quick enough to keep</span><span>60</span></div></article><article><label>AVAILABLE EQUIPMENT</label><div className="stride-equipment">{[['bodyweight','Bodyweight'],['home','Home kit'],['gym','Full gym']].map(([id,label])=><button key={id} className={equipment===id?'active':''} onClick={()=>setEquipment(id)}>{label}</button>)}</div></article><aside><Flame/><div><small>PLAN LOAD</small><strong>{days.length*minutes} minutes / week</strong><p>{energy==='low'?'Recovery-forward and intentionally light.':energy==='high'?'Progressive with one higher-effort day.':'Balanced effort with space to recover.'}</p></div></aside></div></section>}
    {step===3&&<section className="stride-studio-shell stride-support-step"><div className="stride-studio-intro"><span>03 · SUPPORT LEVEL</span><h1>How much coaching feels useful?</h1><p>Your plan is ready. Choose whether to run it yourself or add a human feedback layer.</p></div><div className="stride-plan-preview"><div className="stride-plan-list">{sessions.map((session,index)=><article className={session.tone} key={session.day}><b>{String(index+1).padStart(2,'0')}</b><div><small>{session.day} · {session.duration} MIN</small><strong>{session.title}</strong><span>{index%2?'Technique + recovery':'Progressive working sets'}</span></div><Activity/></article>)}</div><div className="stride-support-list">{fitnessSupport.map(item=><button key={item.id} className={support===item.id?'active':''} onClick={()=>setSupport(item.id)}><span><small>{item.badge}</small><strong>{item.name}</strong><p>{item.note}</p></span><b>{item.price?`₹${item.price}`:'Free'}</b>{support===item.id&&<Check/>}</button>)}</div></div></section>}
    {step===4&&<section className="stride-studio-shell stride-activate"><div className="stride-studio-intro"><span>04 · ACTIVATE</span><h1>Make this week yours.</h1><p>{support==='solo'?'Save the rhythm and start checking off sessions.':'Choose the coaching voice you want beside the plan.'}</p></div>{support!=='solo'&&<div className="stride-coach-grid">{fitnessCoaches.map(item=><button key={item.id} className={coach===item.id?'active':''} onClick={()=>setCoach(item.id)}><i>{item.initials}</i><span><strong>{item.name}</strong><small>{item.focus}</small><b><Star size={12} fill="currentColor"/> {item.rating}</b></span>{coach===item.id&&<Check/>}</button>)}</div>}<div className="stride-activation-card"><div><small>YOUR PLAN</small><h2>{selectedGoal.label}</h2><p>{days.length} sessions · {days.length*minutes} min/week · {selectedSupport.name}</p>{support!=='solo'&&<span><UserRound size={15}/> Feedback from {selectedCoach.name}</span>}</div><div><label>Your name<input value={profile.name} onChange={event=>setProfile({...profile,name:event.target.value})} placeholder="Name"/></label><label>Email<input type="email" value={profile.email} onChange={event=>setProfile({...profile,email:event.target.value})} placeholder="you@example.com"/></label>{error&&<em>{error}</em>}</div></div></section>}
    {step===5&&<section className="stride-dashboard stride-studio-shell"><div className="stride-dashboard-head"><div><span>PLAN ACTIVE · DEMO</span><h1>Your week has somewhere to go.</h1><p>{selectedSupport.name}{support!=='solo'&&` with ${selectedCoach.name}`} · ₹{selectedSupport.price}</p></div><div><strong>{completed.length}/{sessions.length}</strong><small>sessions complete</small></div></div><div className="stride-dashboard-grid"><section><header><span>THIS WEEK</span><b>{Math.round(completed.length/sessions.length*100)||0}%</b></header>{sessions.map(session=><button key={session.day} className={completed.includes(session.day)?'done':''} onClick={()=>setCompleted(current=>current.includes(session.day)?current.filter(item=>item!==session.day):[...current,session.day])}><i>{completed.includes(session.day)&&<Check/>}</i><span><small>{session.day} · {session.duration} MIN</small><strong>{session.title}</strong></span><ChevronRight/></button>)}</section><aside><Sparkles/><small>WEEKLY ADAPTATION</small><h2>{energy==='low'?'Protect recovery.':'Keep the rhythm.'}</h2><p>{completed.length?'Nice start. The next session stays at the planned effort.':'Complete the first session to unlock an adaptive check-in.'}</p>{support!=='solo'&&<div><i>{selectedCoach.initials}</i><span><strong>{selectedCoach.name}</strong><small>Coach feedback will appear here.</small></span></div>}</aside></div><button className="stride-start-over" onClick={()=>setStep(1)}>Build another plan</button></section>}
    <footer className="stride-studio-footer"><button onClick={()=>step===1?onExit():setStep(step-1)}>{step===1?'Cancel':'Back'}</button><span>{selectedGoal.label} · {days.length} days · {selectedSupport.name}</span>{step<5?<button onClick={next}>{step===4?'Activate demo plan':'Continue'} <ArrowRight size={16}/></button>:<button onClick={onExit}>Finish <Check size={16}/></button>}</footer>
  </main>
}

const careerSupport=[
  {id:'async',name:'Async story review',note:'Written feedback on two evidence stories.',price:499,badge:'48-hour demo'},
  {id:'panel',name:'Mock decision panel',note:'Stress-test your case against role criteria.',price:899,badge:'Deepest feedback'},
  {id:'sprint',name:'Accountability sprint',note:'Four weekly prompts and progress checks.',price:299,badge:'30-day rhythm'},
]

function CareerLabComplete({initialDirection,onExit}){
  const [stage,setStage]=useState('question'), [direction,setDirection]=useState(initialDirection), [evidence,setEvidence]=useState(['Led a project','Improved a metric'])
  const [target,setTarget]=useState('Senior product role'), [customEvidence,setCustomEvidence]=useState(''), [extraEvidence,setExtraEvidence]=useState([])
  const [support,setSupport]=useState('async'), [profile,setProfile]=useState({name:'',email:''}), [tasks,setTasks]=useState([]), [error,setError]=useState('')
  const allEvidence=[...evidence,...extraEvidence], active=careerDirections.find(item=>item.id===direction), selectedSupport=careerSupport.find(item=>item.id===support)
  const stages=[['question','1','Direction'],['evidence','2','Evidence'],['roadmap','3','Roadmap'],['support','4','Support'],['board','5','Action board']]
  const toggleEvidence=item=>setEvidence(current=>current.includes(item)?current.filter(value=>value!==item):[...current,item])
  const addEvidence=()=>{const value=customEvidence.trim();if(!value||allEvidence.includes(value))return;setExtraEvidence(current=>[...current,value]);setCustomEvidence('')}
  const activate=()=>{if(!profile.name.trim()||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email.trim())){setError('Add your name and a valid email to open the action board.');return}setError('');setStage('board')}
  const boardTasks=['Write the strongest evidence story','Run two direction-testing conversations','Ship one visible proof project','Review the decision with fresh evidence']
  return <main className="mento-lab mento-complete-flow"><header><button onClick={onExit}><X/> Close</button><strong><span>M</span> Career decision workspace</strong><small>{stage==='board'?'Board active':'Saved in this session'}</small></header><div className="mento-lab-shell"><aside><span>YOUR MAP</span>{stages.map(([id,num,label],index)=><button key={id} disabled={(index>1&&!allEvidence.length)||(id==='board'&&stage!=='board')} className={stage===id?'active':''} onClick={()=>setStage(id)}><b>{num}</b><span>{label}</span>{stages.findIndex(item=>item[0]===stage)>index&&<Check/>}</button>)}<div><Lightbulb/><p><strong>Build evidence, then move.</strong><br/>The board turns a career question into visible weekly work.</p></div></aside><section className="mento-workspace">
    {stage==='question'&&<><div className="mento-lab-title"><span>01 / FRAME THE DECISION</span><h1>What are you trying<br/>to make clearer?</h1></div><div className="mento-direction-grid">{careerDirections.map(({id,label,note,icon:Icon})=><button key={id} className={direction===id?'active':''} onClick={()=>setDirection(id)}><Icon/><span><strong>{label}</strong><small>{note}</small></span>{direction===id&&<Check/>}</button>)}</div><label className="mento-target">THE OUTCOME IN YOUR WORDS<input value={target} onChange={event=>setTarget(event.target.value)} placeholder="e.g. Move into product leadership"/><small>{target.trim()?'Specific enough to test':'Add a specific outcome before continuing.'}</small></label><button className="mento-next" disabled={!target.trim()} onClick={()=>setStage('evidence')}>Map my evidence <ArrowRight/></button></>}
    {stage==='evidence'&&<><div className="mento-lab-title"><span>02 / BUILD THE CASE</span><h1>What have you<br/>already proven?</h1><p>Select real signals. The roadmap will use them as raw material.</p></div><div className="mento-evidence-grid">{careerEvidence.map(item=><button key={item} className={evidence.includes(item)?'active':''} onClick={()=>toggleEvidence(item)}><span>{evidence.includes(item)?<Check/>:<span/>}</span>{item}</button>)}{extraEvidence.map(item=><button key={item} className="active" onClick={()=>setExtraEvidence(current=>current.filter(value=>value!==item))}><span><Check/></span>{item}</button>)}</div><div className="mento-add-evidence"><input value={customEvidence} onChange={event=>setCustomEvidence(event.target.value)} onKeyDown={event=>event.key==='Enter'&&addEvidence()} placeholder="Add your own evidence signal"/><button onClick={addEvidence}><Plus size={16}/> Add</button></div><div className="mento-evidence-note"><FileText/><span><strong>{allEvidence.length} evidence signals selected</strong><small>Enough to create a first working map.</small></span></div><button className="mento-next" disabled={!allEvidence.length} onClick={()=>setStage('roadmap')}>Create my roadmap <ArrowRight/></button></>}
    {stage==='roadmap'&&<><div className="mento-roadmap-head"><div><span>03 / YOUR DECISION MAP</span><h1>{target||active.label}</h1><p>{active.label} · built from {allEvidence.length} evidence signals</p></div><button onClick={()=>setStage('question')}>Edit direction</button></div><div className="mento-roadmap-grid"><article><span>NOW</span><h3>Name the strongest proof</h3><p>Write one concise story showing how you created a result—not only what you owned.</p><b>20 minutes</b></article><article><span>NEXT 7 DAYS</span><h3>Test the direction</h3><p>Have two conversations close to the work and compare what strong performance means.</p><b>2 conversations</b></article><article><span>THIS MONTH</span><h3>Create visible evidence</h3><p>Ship one small project demonstrating the missing scope before asking for the title.</p><b>1 proof project</b></article></div><div className="mento-roadmap-bottom"><div><BookOpen/><span><strong>Your working brief</strong><small>{allEvidence.join(' · ')}</small></span></div><button onClick={()=>setStage('support')}>Choose support <ArrowRight size={15}/></button></div></>}
    {stage==='support'&&<><div className="mento-lab-title"><span>04 / CHOOSE THE FEEDBACK LOOP</span><h1>Support the work,<br/>not another call.</h1><p>Pick an outcome-based service. Each option works asynchronously around your action board.</p></div><div className="mento-support-grid">{careerSupport.map(item=><button key={item.id} className={support===item.id?'active':''} onClick={()=>setSupport(item.id)}><small>{item.badge}</small><h3>{item.name}</h3><p>{item.note}</p><strong>₹{item.price}</strong>{support===item.id&&<Check/>}</button>)}</div><div className="mento-activate-row"><div><small>SELECTED SUPPORT</small><strong>{selectedSupport.name} · ₹{selectedSupport.price}</strong><span>{target}</span></div><div><input value={profile.name} onChange={event=>setProfile({...profile,name:event.target.value})} placeholder="Your name"/><input type="email" value={profile.email} onChange={event=>setProfile({...profile,email:event.target.value})} placeholder="you@example.com"/>{error&&<em>{error}</em>}<button onClick={activate}>Open my action board <ArrowRight/></button></div></div></>}
    {stage==='board'&&<><div className="mento-board-active-head"><div><span>05 / 30-DAY ACTION BOARD</span><h1>{target}</h1><p>{selectedSupport.name} · {allEvidence.length} evidence signals · demo activated</p></div><strong>{tasks.length}/{boardTasks.length}<small>done</small></strong></div><div className="mento-active-board"><section><header>THIS WEEK <b>{Math.round(tasks.length/boardTasks.length*100)}%</b></header>{boardTasks.map((task,index)=><button key={task} className={tasks.includes(index)?'done':''} onClick={()=>setTasks(current=>current.includes(index)?current.filter(item=>item!==index):[...current,index])}><i>{tasks.includes(index)&&<Check/>}</i><span><small>{index<2?'WEEK 1':index===2?'WEEK 2–3':'WEEK 4'}</small><strong>{task}</strong></span><ChevronRight/></button>)}</section><aside><Target/><small>NEXT USEFUL MOVE</small><h2>{tasks.length?boardTasks.find((_,index)=>!tasks.includes(index))||'Review what changed':boardTasks[0]}</h2><p>The board updates as evidence becomes action. Nothing is sent or purchased in this demo.</p><div><strong>Working brief</strong><span>{allEvidence.slice(0,3).join(' · ')}</span></div></aside></div><button className="mento-reset" onClick={()=>{setTasks([]);setStage('question')}}>Start another decision map</button></>}
  </section></div></main>
}

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
