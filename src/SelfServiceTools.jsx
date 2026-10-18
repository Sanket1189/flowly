import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft, ArrowRight, CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, Clock, Compass, Download,
  IndianRupee, MapPin, Pencil, PiggyBank, Plus, RefreshCw, Route, Save, ShieldCheck,
  Sparkles, Target, Trash2, WalletCards, X,
} from 'lucide-react'
import './self-service-tools.css'
import { downloadTripPdf } from './tripPdf.js'
import { downloadMoneyPdf } from './moneyPdf.js'

const money = (value) => new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR', maximumFractionDigits: 0,
}).format(Math.max(0, Number(value) || 0))

const dateForDay = (startDate, day) => {
  if (!startDate) return 'Date not set'
  const [year, month, date] = startDate.split('-').map(Number)
  const value = new Date(year, month - 1, date + day - 1)
  return value.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}
const displayTime = (value) => {
  if (!value) return 'Time TBD'
  const [hour, minute] = value.split(':').map(Number)
  return new Date(2000, 0, 1, hour, minute).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
}

const travelIdeas = {
  food: ['A locally loved breakfast spot', 'A guided market and street-food walk', 'Dinner at a regional kitchen'],
  culture: ['A heritage neighbourhood walk', 'A museum or artisan studio', 'An evening cultural performance'],
  nature: ['A quiet sunrise viewpoint', 'A scenic trail or garden', 'Golden hour by the water'],
  beach: ['A slow beach morning', 'A coastal café and swim break', 'A sunset promenade'],
  nightlife: ['A relaxed late breakfast', 'A creative district and café hop', 'Live music or a neighbourhood bar'],
  wellness: ['A mindful morning or yoga class', 'A nourishing lunch and spa break', 'A calm sunset walk'],
}

const interestOptions = [
  ['food', 'Food & local flavours'], ['culture', 'Culture & stories'], ['nature', 'Nature'],
  ['beach', 'Beaches'], ['nightlife', 'Nightlife'], ['wellness', 'Wellness'],
]

export default function SelfServiceTool({ kind, config, initialChoice, onExit }) {
  if (kind === 'travel') return <TravelBuilder config={config} initialChoice={initialChoice} onExit={onExit}/>
  return <MoneyBuilder config={config} initialChoice={initialChoice} onExit={onExit}/>
}

function ToolHead({ config, onExit, label }) {
  const Mark = config.mark
  return <header className="self-head"><button onClick={onExit}><ArrowLeft size={17}/>{config.brand} home</button><a><span><Mark size={17}/></span>{config.brand}</a><small>{label}</small></header>
}

function TravelBuilder({ config, initialChoice, onExit }) {
  const initialInterests = initialChoice === 'nature' ? ['nature', 'wellness'] : initialChoice === 'adventure' ? ['nature', 'nightlife'] : ['food', 'culture']
  const [step, setStep] = useState(1)
  const [details, setDetails] = useState({ destination: 'Goa', startDate: new Date().toISOString().slice(0, 10), days: 4, budget: 36000, people: 2, pace: 'balanced' })
  const [interests, setInterests] = useState(initialInterests)
  const [error, setError] = useState('')
  const [editingPlan, setEditingPlan] = useState(false)
  const [customPlans, setCustomPlans] = useState({})
  const defaultSpots = (item) => [
    { id: `${item.day}-morning`, time: '09:00', text: item.morning },
    { id: `${item.day}-afternoon`, time: '14:00', text: item.afternoon },
    { id: `${item.day}-evening`, time: '19:00', text: item.evening },
  ]
  const spotsFor = (item) => customPlans[item.day] ?? defaultSpots(item)
  const changeSpots = (item, change) => setCustomPlans(current => ({ ...current, [item.day]: change(current[item.day] ?? defaultSpots(item)) }))
  const updateSpot = (item, index, patch) => changeSpots(item, spots => spots.map((spot, spotIndex) => spotIndex === index ? { ...spot, ...patch } : spot))
  const addSpot = (item) => changeSpots(item, spots => [...spots, { id: `${item.day}-${Date.now()}`, time: '15:00', text: '' }])
  const deleteSpot = (item, index) => changeSpots(item, spots => spots.filter((_, spotIndex) => spotIndex !== index))
  const toggleEditing = () => {
    if (!editingPlan) setCustomPlans(current => Object.fromEntries(itinerary.map(item => [item.day, current[item.day] ?? defaultSpots(item)])))
    setEditingPlan(!editingPlan)
  }
  const exportPdf = () => downloadTripPdf(details, itinerary.map(item => ({ day: item.day, date: dateForDay(details.startDate, item.day), spots: spotsFor(item) })))
  const toggle = (id) => setInterests(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id])
  const next = () => {
    if (!details.destination.trim() || !details.startDate || details.days < 1 || details.budget < 1000 || details.people < 1) {
      setError('Add a destination, start date, valid trip length, travellers and budget.')
      return
    }
    setError('')
    setStep(2)
  }
  const itinerary = useMemo(() => {
    const selected = interests.length ? interests : ['food', 'culture']
    return Array.from({ length: Math.min(10, Number(details.days) || 1) }, (_, index) => {
      const first = travelIdeas[selected[index % selected.length]]
      const second = travelIdeas[selected[(index + 1) % selected.length]]
      return { day: index + 1, morning: first[0], afternoon: second[1], evening: first[2] }
    })
  }, [details.days, interests])
  if (step === 3) return <main className="self-tool travel-theme"><ToolHead config={config} onExit={onExit} label="YOUR ITINERARY"/><section className="self-result-shell"><div className="result-hero"><div><span><Sparkles size={14}/> READY TO EXPLORE</span><h1>{details.days} days in<br/><em>{details.destination}</em></h1><p>A flexible {details.pace} itinerary for {details.people} {details.people === 1 ? 'traveller' : 'travellers'}, starting {dateForDay(details.startDate,1)}.</p></div><div className="result-stat-card"><small>DAILY TRIP BUDGET</small><strong>{money(details.budget / details.days)}</strong><span>{money(details.budget)} total · {details.people} people</span><hr/><p><ShieldCheck size={15}/> Keep roughly 12% unplanned for spontaneous moments.</p></div></div><div className={`itinerary-layout ${editingPlan?'is-editing':''}`}><div className="itinerary-days">{itinerary.map(item => <article key={item.day}><b>DAY {String(item.day).padStart(2, '0')}<small>{dateForDay(details.startDate,item.day)}</small></b><div>{spotsFor(item).map((spot,index) => <span className={editingPlan?'spot-edit-row':''} key={spot.id}><i>{editingPlan?<CustomTimePicker value={spot.time} onChange={time=>updateSpot(item,index,{time})} label={`Day ${item.day} spot time`}/>:displayTime(spot.time)}</i>{editingPlan?<><input aria-label={`Day ${item.day} spot ${index+1}`} value={spot.text} onChange={event=>updateSpot(item,index,{text:event.target.value})} placeholder="Enter a place, meal or activity"/><button aria-label={`Delete day ${item.day} spot ${index+1}`} onClick={()=>deleteSpot(item,index)}><Trash2 size={15}/></button></>:<strong>{spot.text || 'Open time'}</strong>}</span>)}{editingPlan&&<button className="add-spot" onClick={()=>addSpot(item)}><Plus size={15}/> Add another spot</button>}</div></article>)}</div><aside><h3>Your trip rhythm</h3><p><CalendarDays size={16}/> Starts {dateForDay(details.startDate,1)}</p><p><Route size={16}/> {details.pace[0].toUpperCase() + details.pace.slice(1)} pace</p><p><Compass size={16}/> {interests.length || 2} interests included</p><p><IndianRupee size={16}/> {money(details.budget / details.people)} per person</p><button className={editingPlan?'edit-active':''} onClick={toggleEditing}>{editingPlan?<><Save size={15}/> Save my spot lines</>:<><Pencil size={15}/> Edit day spots</>}</button><button onClick={exportPdf}><Download size={15}/> Download PDF</button><button onClick={() => setStep(1)}><RefreshCw size={15}/> Adjust my trip</button><button className="solid" onClick={onExit}>Done <Check size={15}/></button></aside></div></section></main>
  return <main className="self-tool travel-theme">
    <ToolHead config={config} onExit={onExit} label={`STEP ${step} OF 2`}/>
    <div className="self-progress"><span style={{ width: `${step * 50}%` }}/></div>
    <section className="self-form-shell">
      {step === 1 ? <>
        <Title label="BUILD YOUR TRIP" title="Where are you heading?" text="Start with the practical details. Your live trip brief updates as you go."/>
        <div className="trip-brief-layout">
          <div className="self-form-card">
            <div className="form-card-head"><span><MapPin size={19}/></span><div><strong>Trip essentials</strong><small>Everything can be changed later</small></div></div>
            <div className="self-form-grid">
              <label className="wide">Destination<input value={details.destination} onChange={e => setDetails({...details, destination:e.target.value})} placeholder="Goa, Jaipur, Kyoto..."/></label>
              <label>Trip start date<CustomDatePicker value={details.startDate} onChange={startDate => setDetails({...details, startDate})}/></label>
              <label>Number of days<input type="number" min="1" max="10" value={details.days} onChange={e => setDetails({...details, days:Number(e.target.value)})}/></label>
              <label>Travellers<input type="number" min="1" max="12" value={details.people} onChange={e => setDetails({...details, people:Number(e.target.value)})}/></label>
              <label className="wide">Total trip budget (₹)<input type="number" min="1000" step="1000" value={details.budget} onChange={e => setDetails({...details, budget:Number(e.target.value)})}/></label>
              <fieldset className="wide"><legend>Preferred pace</legend><div className="segmented">{['relaxed','balanced','full'].map(item => <button type="button" className={details.pace === item ? 'selected' : ''} onClick={() => setDetails({...details, pace:item})} key={item}>{details.pace === item && <Check size={14}/>} {item}</button>)}</div></fieldset>
              {error && <span className="self-error">{error}</span>}
            </div>
          </div>
          <aside className="trip-preview">
            <span className="preview-mark"><Compass size={23}/></span><small>YOUR TRIP BRIEF</small>
            <h2>{details.destination || 'Your destination'}</h2>
            <div><span><CalendarDays size={16}/>{dateForDay(details.startDate,1)}</span><span><CalendarDays size={16}/>{details.days || 0} days</span><span><Route size={16}/>{details.pace} pace</span><span><IndianRupee size={16}/>{money(details.budget / Math.max(1, details.days))}/day</span></div>
            <hr/><p>For {details.people || 0} {details.people === 1 ? 'traveller' : 'travellers'} · roughly {money(details.budget / Math.max(1, details.people))} per person</p>
          </aside>
        </div>
      </> : <>
        <Title label="MAKE IT YOURS" title="What should the trip feel like?" text="Choose as many as you like. We’ll balance your days automatically."/>
        <div className="interest-grid">{interestOptions.map(([id,label]) => <button className={interests.includes(id) ? 'selected' : ''} key={id} onClick={() => toggle(id)}><span>{interests.includes(id) && <Check size={16}/>}</span>{label}</button>)}</div>
      </>}
    </section>
    <footer className="self-footer"><button className="back" onClick={() => step === 1 ? onExit() : setStep(1)}><ArrowLeft size={16}/>{step === 1 ? 'Cancel' : 'Back'}</button><span>{details.destination} · {details.days} days · {money(details.budget)}</span><button className="next" onClick={() => step === 1 ? next() : setStep(3)}>{step === 1 ? 'Choose interests' : 'Build my itinerary'}<ArrowRight size={16}/></button></footer>
  </main>
}

function MoneyBuilder({ config, initialChoice, onExit }) {
  const [step, setStep] = useState(1)
  const [values, setValues] = useState({ income: 80000 })
  const [expenseItems, setExpenseItems] = useState([
    { id: 1, name: 'Rent & utilities', amount: 24000, type: 'essential' },
    { id: 2, name: 'Groceries & transport', amount: 10000, type: 'essential' },
    { id: 3, name: 'Lifestyle & subscriptions', amount: 16000, type: 'flexible' },
    { id: 4, name: 'Loan repayments', amount: 5000, type: 'debt' },
  ])
  const [savingsGoals, setSavingsGoals] = useState([
    { id: 1, name: initialChoice === 'future' ? 'Home deposit' : initialChoice === 'spend' ? 'New laptop' : 'Travel fund', target: 100000, saved: 10000, monthly: 7500 },
  ])
  const [error, setError] = useState('')
  const plan = useMemo(() => {
    const income = Number(values.income) || 0
    const essentials = expenseItems.filter(item => item.type === 'essential').reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
    const flexible = expenseItems.filter(item => item.type === 'flexible').reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
    const debt = expenseItems.filter(item => item.type === 'debt').reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
    const committed = essentials + flexible + debt
    const available = Math.max(0, income - committed)
    const goals = savingsGoals.map(goal => ({ ...goal, remaining: Math.max(0, (Number(goal.target) || 0) - (Number(goal.saved) || 0)), monthly: Math.max(0, Number(goal.monthly) || 0) }))
    const remainingGoal = goals.reduce((sum, goal) => sum + goal.remaining, 0)
    const requestedMonthly = goals.reduce((sum, goal) => sum + Math.min(goal.remaining, goal.monthly), 0)
    const goalContribution = requestedMonthly
    const buffer = available - goalContribution
    const overBudget = Math.max(0, -buffer)
    const goalPlans = goals.map(goal => ({ ...goal, monthly: Math.min(goal.remaining, goal.monthly), actualMonths: goal.monthly > 0 ? Math.ceil(goal.remaining / goal.monthly) : 0 }))
    const actualMonths = goalPlans.reduce((longest, goal) => Math.max(longest, goal.actualMonths), 0)
    const totalTarget = goals.reduce((sum, goal) => sum + (Number(goal.target) || 0), 0)
    const totalSaved = goals.reduce((sum, goal) => sum + (Number(goal.saved) || 0), 0)
    const savedPercent = totalTarget > 0 ? Math.min(100, (totalSaved / totalTarget) * 100) : 0
    return {
      essentials, flexible, debt, committed, available, remainingGoal, requestedMonthly, goalContribution, buffer, actualMonths,
      daily: flexible / 30, weekly: flexible / 4.33, healthy: overBudget <= 0, overBudget,
      savedPercent, totalTarget, totalSaved, goalPlans, debtRatio: income > 0 ? (debt / income) * 100 : 0,
    }
  }, [values, expenseItems, savingsGoals])
  const updateExpense = (id, patch) => setExpenseItems(items => items.map(item => item.id === id ? { ...item, ...patch } : item))
  const addExpense = () => setExpenseItems(items => [...items, { id: Date.now(), name: 'New budget item', amount: 0, type: 'flexible' }])
  const deleteExpense = id => setExpenseItems(items => items.filter(item => item.id !== id))
  const updateGoal = (id, patch) => setSavingsGoals(goals => goals.map(goal => goal.id === id ? { ...goal, ...patch } : goal))
  const addGoal = () => setSavingsGoals(goals => [...goals, { id: Date.now(), name: 'New savings goal', target: 50000, saved: 0, monthly: 5000 }])
  const deleteGoal = id => setSavingsGoals(goals => goals.length === 1 ? goals : goals.filter(goal => goal.id !== id))
  const nextBasics = () => {
    if (values.income <= 0 || expenseItems.some(item => !item.name.trim() || Number(item.amount) < 0)) {
      setError('Add a monthly salary and make sure every budget item has a name and valid amount.')
      return
    }
    if (plan.committed >= values.income) {
      setError('Monthly spending and repayments need to stay below take-home income before building a goal plan.')
      return
    }
    setError('')
    setStep(2)
    window.scrollTo(0, 0)
  }
  const generate = () => {
    if (!savingsGoals.length || savingsGoals.some(goal => !goal.name.trim() || goal.target <= 0 || goal.saved < 0 || goal.saved > goal.target || (goal.saved < goal.target && goal.monthly <= 0))) {
      setError('Check every savings goal. Each needs a name, target, current savings, and a monthly saving amount; saved money cannot exceed the target.')
      return
    }
    if (plan.overBudget > 0) {
      setError(`Reduce your monthly goal amounts by ${money(plan.overBudget)} so they fit the ${money(plan.available)} you have available.`)
      return
    }
    setError('')
    setStep(3)
    window.scrollTo(0, 0)
  }
  if (step === 3) return <main className="self-tool money-theme"><ToolHead config={config} onExit={onExit} label="YOUR MONEY MAP"/><section className="self-result-shell money-result"><div className="result-hero"><div><span><Sparkles size={14}/> YOUR ACTIONABLE PLAN</span><h1>Make room for<br/><em>{savingsGoals.length === 1 ? savingsGoals[0].name : 'your savings goals'}</em></h1><p>{plan.healthy ? 'Your monthly budget can support the timelines you selected.' : `This plan keeps some breathing room and shows a sustainable path for all ${savingsGoals.length} goals.`}</p><div className="goal-progress"><span><b>{Math.round(plan.savedPercent)}%</b> saved across all goals</span><i><b style={{width:`${plan.savedPercent}%`}}/></i></div></div><div className="result-stat-card"><small>TOTAL MONTHLY SAVINGS</small><strong>{money(plan.goalContribution)}</strong><span>{plan.actualMonths ? `Longest goal: about ${plan.actualMonths} months` : 'Adjust spending to begin'}</span><hr/><p><ShieldCheck size={15}/> Educational estimate only—not investment or financial advice.</p></div></div><div className="money-map"><section><h2>Your monthly money map</h2><p className="money-map-intro">Every rupee has a clear job, while the buffer stays available for real life.</p><div className="allocation-list">{expenseItems.filter(item => Number(item.amount) > 0).map(item => <Allocation key={item.id} label={item.name} value={item.amount} total={values.income}/>)}</div>{plan.goalPlans.map(goal => <Allocation key={goal.id} label={goal.name} value={goal.monthly} total={values.income}/>)}<Allocation label="Breathing room" value={plan.buffer} total={values.income}/></section><aside><span><WalletCards size={21}/></span><h3>Your guardrails</h3><p><strong>{money(plan.weekly)}</strong><small>weekly flexible-spend limit</small></p><p><strong>{money(plan.remainingGoal)}</strong><small>remaining across all goals</small></p><p><strong>{money(plan.buffer)}</strong><small>monthly breathing room</small></p>{!plan.healthy && <div>Your selected timelines would need {money(plan.requestedMonthly)} per month. This plan contributes {money(plan.goalContribution)} and adjusts each ETA safely.</div>}<button className="solid" onClick={() => downloadMoneyPdf({...values,goal:savingsGoals.length===1?savingsGoals[0].name:`${savingsGoals.length} savings goals`}, expenseItems, plan)}><Download size={15}/> Download PDF</button><button onClick={() => setStep(1)}><RefreshCw size={15}/> Adjust my plan</button><button onClick={onExit}>Done <Check size={15}/></button></aside></div><section className="goal-result-list"><div className="goal-result-head"><span>SAVINGS GOALS</span><h2>Your goal-by-goal plan</h2></div>{plan.goalPlans.map(goal => <article key={goal.id}><span><Target size={18}/></span><div><strong>{goal.name}</strong><small>{money(goal.saved)} saved of {money(goal.target)}</small></div><div><small>MONTHLY</small><strong>{money(goal.monthly)}</strong></div><div><small>ESTIMATED</small><strong>{goal.actualMonths || '—'} months</strong></div></article>)}</section><section className="money-actions"><div><span><Check size={16}/></span><p><strong>Automate your savings</strong>Move {money(plan.goalContribution)} across your goals after salary arrives.</p></div><div><span><WalletCards size={16}/></span><p><strong>Use a weekly guardrail</strong>Keep flexible spending near {money(plan.weekly)} per week.</p></div><div><span><PiggyBank size={16}/></span><p><strong>Protect the buffer</strong>Leave {money(plan.buffer)} unassigned for surprises and month-to-month variation.</p></div></section></section></main>

  return <main className="self-tool money-theme">
    <ToolHead config={config} onExit={onExit} label={`STEP ${step} OF 2`}/><div className="self-progress"><span style={{width:`${step * 50}%`}}/></div>
    <section className="self-form-shell money-builder-shell">{step === 1 ? <>
      <Title label="YOUR MONTHLY FOUNDATION" title="Build your real monthly budget." text="Start with salary, then add every regular spending item. Edit the list until it matches your month."/>
      <div className="salary-card"><span><IndianRupee size={20}/></span><label>Monthly take-home salary (₹)<input type="number" min="0" value={values.income} onChange={e => setValues({...values,income:Number(e.target.value)})}/></label><div><small>AVAILABLE BEFORE GOAL</small><strong>{money(plan.available)}</strong></div></div>
      <div className="expense-builder"><div className="expense-builder-head"><div><h3>Monthly spending items</h3><p>Add fixed costs, flexible budgets, and repayments. Every change updates your plan instantly.</p></div><button onClick={addExpense}><Plus size={15}/> Add item</button></div><div className="expense-list">{expenseItems.map((item,index) => <div className="expense-row" key={item.id}><span>{String(index+1).padStart(2,'0')}</span><label className="expense-name">Budget item<input aria-label={`Budget item ${index+1} name`} value={item.name} onChange={event=>updateExpense(item.id,{name:event.target.value})}/></label><div className="expense-field expense-category-field"><span>Category</span><ExpenseCategoryPicker value={item.type} onChange={type=>updateExpense(item.id,{type})} label={`Budget item ${index+1} category`}/></div><label className="expense-amount">Monthly amount<input aria-label={`Budget item ${index+1} amount`} type="number" min="0" value={item.amount} onChange={event=>updateExpense(item.id,{amount:Number(event.target.value)})}/></label><button className="delete-expense" aria-label={`Delete ${item.name}`} onClick={()=>deleteExpense(item.id)}><Trash2 size={15}/></button></div>)}</div><button className="add-expense-wide" onClick={addExpense}><Plus size={16}/> Add another spending item</button></div>
      {error && <span className="self-error money-error">{error}</span>}<div className="budget-totals"><span><small>Essentials</small><strong>{money(plan.essentials)}</strong></span><span><small>Flexible</small><strong>{money(plan.flexible)}</strong></span><span><small>Debt / EMI</small><strong>{money(plan.debt)}</strong></span><span><small>Total committed</small><strong>{money(plan.committed)}</strong></span></div>
    </> : <>
      <Title label="STEP 2 · ADD YOUR SAVINGS GOALS" title={`You have ${money(plan.available)} left each month.`} text={`That is your ${money(values.income)} salary minus ${money(plan.committed)} of spending. Add everything you want to save for below.`}/>
      <div className="budget-bridge"><span><small>MONTHLY SALARY</small><strong>{money(values.income)}</strong></span><i>−</i><span><small>YOUR SPENDING</small><strong>{money(plan.committed)}</strong></span><i>=</i><span className="available"><small>AVAILABLE TO SAVE</small><strong>{money(plan.available)}</strong></span></div>
      <div className="saving-only-card"><span><Check size={17}/></span><div><strong>Save for something</strong><small>Travel, education, a home, a device, or anything personal. Add as many goals as you need.</small></div></div>
      <div className="goal-planner-layout multi-goal-layout"><section className="savings-goal-builder"><div className="savings-goal-head"><div><h3>Your savings goals</h3><p>Set a different monthly saving amount for every goal. The timeline updates automatically.</p></div><button onClick={addGoal}><Plus size={15}/> Add goal</button></div><div className="savings-goal-list">{savingsGoals.map((goal,index) => { const preview=plan.goalPlans.find(item=>item.id===goal.id); return <article className="savings-goal-row" key={goal.id}><span>{String(index+1).padStart(2,'0')}</span><label className="goal-name">Saving for<input aria-label={`Savings goal ${index+1} name`} value={goal.name} onChange={event=>updateGoal(goal.id,{name:event.target.value})}/></label><label>Target amount<input aria-label={`Savings goal ${index+1} target`} type="number" min="0" value={goal.target} onChange={event=>updateGoal(goal.id,{target:Number(event.target.value)})}/></label><label>Already saved<input aria-label={`Savings goal ${index+1} saved`} type="number" min="0" value={goal.saved} onChange={event=>updateGoal(goal.id,{saved:Number(event.target.value)})}/></label><label>Save each month<div className="goal-monthly"><input aria-label={`Savings goal ${index+1} monthly amount`} type="number" min="0" value={goal.monthly} onChange={event=>updateGoal(goal.id,{monthly:Number(event.target.value)})}/><small>{preview?.actualMonths ? `~${preview.actualMonths} months` : 'Set amount'}</small></div></label><button className="delete-goal" disabled={savingsGoals.length === 1} aria-label={`Delete ${goal.name}`} onClick={()=>deleteGoal(goal.id)}><Trash2 size={15}/></button></article>})}</div><button className="add-goal-wide" onClick={addGoal}><Plus size={16}/> Add another savings goal</button><div className={`custom-saving-summary ${plan.overBudget > 0 ? 'over' : ''}`}><div><small>YOUR MONTHLY SAVINGS TOTAL</small><strong>{money(plan.goalContribution)}</strong></div><div><small>{plan.overBudget > 0 ? 'REDUCE BY' : 'MONEY LEFT FREE'}</small><strong>{money(plan.overBudget > 0 ? plan.overBudget : plan.buffer)}</strong></div><p>{plan.overBudget > 0 ? `Your goal amounts are ${money(plan.overBudget)} above the ${money(plan.available)} available after spending.` : 'These are your own amounts—not presets. Change any goal and the plan updates instantly.'}</p></div>{error && <span className="self-error">{error}</span>}</section><aside className="goal-live-preview multi-goal-preview"><span><Sparkles size={15}/> LIVE SAVINGS PLAN</span><h3>{savingsGoals.length} {savingsGoals.length === 1 ? 'goal' : 'goals'}</h3><div><small>Total still needed</small><strong>{money(plan.remainingGoal)}</strong></div><div className="highlight"><small>Your monthly total</small><strong>{money(plan.goalContribution)}</strong></div><div><small>{plan.overBudget > 0 ? 'Over available budget' : 'Breathing room'}</small><strong>{money(plan.overBudget > 0 ? plan.overBudget : plan.buffer)}</strong></div><section>{plan.goalPlans.map(goal => <article key={goal.id}><div><strong>{goal.name}</strong><small>{money(goal.remaining)} remaining</small></div><span><b>{money(goal.monthly)}</b><small>/month · ~{goal.actualMonths || '—'} months</small></span></article>)}</section><p className={plan.overBudget > 0 ? 'warning' : ''}>{plan.overBudget > 0 ? <>Reduce the individual amounts by a combined {money(plan.overBudget)} to continue.</> : <><Check size={15}/> Every amount fits inside your available monthly money.</>}</p></aside></div>
    </>}</section>
    <footer className="self-footer"><button className="back" onClick={() => step === 1 ? onExit() : (setError(''),setStep(1))}><ArrowLeft size={16}/>{step === 1 ? 'Cancel' : 'Back to budget'}</button><span>{step === 1 ? `${expenseItems.length} budget items · ${money(plan.available)} available` : `${savingsGoals.length} goals · ${money(plan.goalContribution)} saved monthly`}</span><button className="next" onClick={step === 1 ? nextBasics : generate}>{step === 1 ? 'Add savings goals' : 'Create my money map'}<ArrowRight size={16}/></button></footer>
  </main>
}

function Title({ label, title, text }) { return <div className="self-title"><span>{label}</span><h1>{title}</h1><p>{text}</p></div> }
function Allocation({ label, value, total }) { const width = total > 0 ? Math.min(100, (value / total) * 100) : 0; return <div className="allocation"><div><span>{label}</span><strong>{money(value)}</strong></div><i><b style={{width:`${width}%`}}/></i><small>{Math.round(width)}% of income</small></div> }

function ExpenseCategoryPicker({ value, onChange, label }) {
  const [open, setOpen] = useState(false)
  const ref = useOutsideClose(open, () => setOpen(false))
  const options = [
    ['essential', 'Essential', 'Fixed and necessary'],
    ['flexible', 'Flexible', 'Adjustable each month'],
    ['debt', 'Debt / EMI', 'Loan or card repayment'],
  ]
  const selected = options.find(([id]) => id === value) || options[0]
  return <div className="expense-category-picker" ref={ref}>
    <button type="button" className="expense-category-trigger" aria-label={label} aria-expanded={open} onClick={() => setOpen(!open)}><i className={`category-dot ${value}`}/><span>{selected[1]}</span><ChevronDown size={14}/></button>
    {open && <div className="expense-category-menu" role="listbox" aria-label={label}>{options.map(([id,name,note]) => <button type="button" role="option" aria-selected={value === id} className={value === id ? 'selected' : ''} key={id} onClick={() => { onChange(id); setOpen(false) }}><i className={`category-dot ${id}`}/><span><strong>{name}</strong><small>{note}</small></span>{value === id && <Check size={14}/>}</button>)}</div>}
  </div>
}

function useOutsideClose(open, onClose) {
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return undefined
    const close = event => { if (ref.current && !ref.current.contains(event.target)) onClose() }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [open, onClose])
  return ref
}

function isoDate(date) {
  const year = date.getFullYear(), month = String(date.getMonth() + 1).padStart(2, '0'), day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function CustomDatePicker({ value, onChange }) {
  const selected = value ? new Date(`${value}T00:00:00`) : new Date()
  const [open, setOpen] = useState(false)
  const [cursor, setCursor] = useState(new Date(selected.getFullYear(), selected.getMonth(), 1))
  const ref = useOutsideClose(open, () => setOpen(false))
  const year = cursor.getFullYear(), month = cursor.getMonth()
  const firstWeekday = new Date(year, month, 1).getDay()
  const gridStart = new Date(year, month, 1 - firstWeekday)
  const days = Array.from({ length: 42 }, (_, index) => new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + index))
  const choose = date => { onChange(isoDate(date)); setCursor(new Date(date.getFullYear(), date.getMonth(), 1)); setOpen(false) }
  return <div className="roam-picker" ref={ref}><button type="button" className="picker-trigger" aria-expanded={open} onClick={() => setOpen(!open)}><CalendarDays size={17}/><span>{selected.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</span><ChevronDown size={15}/></button>{open&&<div className="date-popover"><div className="picker-head"><button type="button" onClick={()=>setCursor(new Date(year,month-1,1))}><ChevronLeft size={17}/></button><strong>{cursor.toLocaleDateString('en-IN',{month:'long',year:'numeric'})}</strong><button type="button" onClick={()=>setCursor(new Date(year,month+1,1))}><ChevronRight size={17}/></button></div><div className="weekday-row">{['S','M','T','W','T','F','S'].map((day,index)=><span key={`${day}-${index}`}>{day}</span>)}</div><div className="calendar-grid">{days.map(date => { const id=isoDate(date), current=id===value, today=id===isoDate(new Date()), outside=date.getMonth()!==month; return <button type="button" key={id} className={`${current?'selected ':''}${today?'today ':''}${outside?'outside':''}`} onClick={()=>choose(date)}>{date.getDate()}</button> })}</div><div className="picker-foot"><span>Your trip begins</span><button type="button" onClick={()=>choose(new Date())}>Today</button></div></div>}</div>
}

function CustomTimePicker({ value, onChange, label }) {
  const [open, setOpen] = useState(false)
  const sourceHour = Number(value?.split(':')[0] || 9), sourceMinute = value?.split(':')[1] || '00'
  const [hour, setHour] = useState(sourceHour % 12 || 12)
  const [minute, setMinute] = useState(['00','15','30','45'].includes(sourceMinute) ? sourceMinute : '00')
  const [period, setPeriod] = useState(sourceHour >= 12 ? 'PM' : 'AM')
  const ref = useOutsideClose(open, () => setOpen(false))
  const apply = () => { const hour24 = period === 'PM' ? (hour % 12) + 12 : hour % 12; onChange(`${String(hour24).padStart(2,'0')}:${minute}`); setOpen(false) }
  return <div className="roam-picker time-picker" ref={ref}><button type="button" className="picker-trigger time-trigger" aria-label={label} aria-expanded={open} onClick={()=>setOpen(!open)}><Clock size={14}/><span>{displayTime(value)}</span><ChevronDown size={13}/></button>{open&&<div className="time-popover"><div className="time-display"><Clock size={17}/><strong>{String(hour).padStart(2,'0')}:{minute}</strong><span>{period}</span></div><small>HOUR</small><div className="hour-grid">{Array.from({length:12},(_,index)=>index+1).map(item=><button type="button" className={hour===item?'selected':''} key={item} onClick={()=>setHour(item)}>{item}</button>)}</div><small>MINUTE</small><div className="minute-grid">{['00','15','30','45'].map(item=><button type="button" className={minute===item?'selected':''} key={item} onClick={()=>setMinute(item)}>{item}</button>)}</div><div className="period-row"><button type="button" className={period==='AM'?'selected':''} onClick={()=>setPeriod('AM')}>AM</button><button type="button" className={period==='PM'?'selected':''} onClick={()=>setPeriod('PM')}>PM</button><button type="button" className="apply-time" onClick={apply}>Apply <Check size={14}/></button></div></div>}</div>
}
