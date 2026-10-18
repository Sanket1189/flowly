import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, BookOpenCheck, CalendarDays, Check, Clock3, Download, GraduationCap, ListChecks, MoonStar, Plus, RotateCcw, Sparkles, SunMedium, Trash2 } from 'lucide-react'
import { downloadPlannerPdf } from './plannerPdf.js'
import './planner-tools.css'
import './routine-groups.css'

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const minutesLabel = minutes => `${Math.floor(minutes / 60) ? `${Math.floor(minutes / 60)}h ` : ''}${minutes % 60 ? `${minutes % 60}m` : ''}`.trim()
const suggestedStudyWeek = subjects => {
  const week = days.map(day => ({ day, sessions: [] }))
  subjects.filter(item => item.hours > 0).forEach((item, subjectIndex) => {
    const totalMinutes = Math.round(Number(item.hours) * 60)
    const sessionCount = Math.min(7, Math.max(1, Math.ceil(totalMinutes / 60)))
    const regularMinutes = Math.floor(totalMinutes / sessionCount / 5) * 5
    for (let index = 0; index < sessionCount; index += 1) {
      const dayIndex = (subjectIndex + index * 2) % 7
      const minutes = index === sessionCount - 1 ? totalMinutes - regularMinutes * (sessionCount - 1) : regularMinutes
      week[dayIndex].sessions.push({ id: `${days[dayIndex]}-${item.id}-${index}`, subject: item.name, minutes, slot: ['Morning', 'Afternoon', 'Evening'][(subjectIndex + index) % 3] })
    }
  })
  return week
}

function ToolHeader({ brand, icon: Icon, onExit, result, onEdit }) {
  return <header className="planner-tool-head"><button onClick={onExit}><ArrowLeft size={17}/> Flowly</button><a><span><Icon size={18}/></span>{brand}</a>{result ? <button className="edit-link" onClick={onEdit}><RotateCcw size={15}/> Edit plan</button> : <small>PRIVATE · IN BROWSER</small>}</header>
}

function StudyPlanner({ onExit }) {
  const [result, setResult] = useState(false)
  const [goal, setGoal] = useState('Prepare consistently without last-minute stress')
  const [subjects, setSubjects] = useState([
    { id: 1, name: 'Mathematics', hours: 6, priority: 'High' },
    { id: 2, name: 'Physics', hours: 4, priority: 'Medium' },
    { id: 3, name: 'English', hours: 3, priority: 'Medium' },
  ])
  const [schedule, setSchedule] = useState([])
  const [error, setError] = useState('')
  useEffect(() => { document.title = 'Sora — Study planner'; return () => { document.title = "Flowly — There's a flow for it" } }, [])
  const totalHours = subjects.reduce((sum, item) => sum + (Number(item.hours) || 0), 0)
  const plannedMinutes = schedule.reduce((total, day) => total + day.sessions.reduce((sum, item) => sum + (Number(item.minutes) || 0), 0), 0)
  const update = (id, patch) => setSubjects(items => items.map(item => item.id === id ? { ...item, ...patch } : item))
  const add = () => setSubjects(items => [...items, { id: Date.now(), name: 'New subject', hours: 3, priority: 'Medium' }])
  const remove = id => setSubjects(items => items.filter(item => item.id !== id))
  const updateSession = (dayName, id, patch) => setSchedule(week => week.map(day => day.day === dayName ? { ...day, sessions: day.sessions.map(session => session.id === id ? { ...session, ...patch } : session) } : day))
  const addSession = dayName => setSchedule(week => week.map(day => day.day === dayName ? { ...day, sessions: [...day.sessions, { id: `${dayName}-${Date.now()}`, subject: subjects[0]?.name || 'New subject', minutes: 30, slot: 'Morning' }] } : day))
  const removeSession = (dayName, id) => setSchedule(week => week.map(day => day.day === dayName ? { ...day, sessions: day.sessions.filter(session => session.id !== id) } : day))
  const pdfData = { brand: 'Sora.', title: 'My weekly study plan', subtitle: goal, summary: [{ label: 'Subjects', value: String(subjects.length) }, { label: 'Planned study', value: minutesLabel(plannedMinutes) }, { label: 'Daily average', value: `${Math.round(plannedMinutes / 7)} min` }], sections: [{ title: 'Subjects and targets', rows: subjects.map(item => ({ label: item.name, detail: `${item.priority} priority`, meta: `${item.hours}h / week` })) }, { title: 'My customised week', rows: schedule.map(day => ({ label: day.day, detail: day.sessions.map(item => `${item.slot}: ${item.subject} (${item.minutes} min)`).join('  |  ') || 'Rest and catch-up', meta: `${day.sessions.reduce((sum, item) => sum + (Number(item.minutes) || 0), 0)} min` })) }] }
  const create = () => { if (!subjects.length || subjects.some(item => !item.name.trim() || item.hours <= 0)) { setError('Add at least one subject with a name and weekly study hours.'); return } setError(''); setSchedule(suggestedStudyWeek(subjects)); setResult(true); window.scrollTo(0, 0) }
  if (result) return <PlannerResult type="study" brand="sora." icon={GraduationCap} title="Here’s a starting point. Make it yours." subtitle={goal} stat={minutesLabel(plannedMinutes)} statLabel="currently planned" onExit={onExit} onEdit={() => setResult(false)} onDownload={() => downloadPlannerPdf(pdfData, 'sora-study-plan.pdf')}><section className="custom-plan-intro"><div><Sparkles size={18}/><span><strong>Suggested for you</strong><small>Change any subject, time of day, or duration. Add and remove sessions until the week fits your life.</small></span></div><button onClick={() => setSchedule(suggestedStudyWeek(subjects))}><RotateCcw size={14}/> Reset suggestion</button></section><div className="editable-week">{schedule.map(day => <article className="editable-day" key={day.day}><header><div><b>{day.day}</b><small>{day.sessions.reduce((sum, item) => sum + (Number(item.minutes) || 0), 0)} min</small></div><button onClick={() => addSession(day.day)}><Plus size={14}/> Add session</button></header><div>{day.sessions.length ? day.sessions.map(session => <section className="study-session-editor" key={session.id}><label>Subject<input value={session.subject} onChange={event => updateSession(day.day, session.id, { subject: event.target.value })}/></label><div className="session-slot"><small>Time of day</small><span>{['Morning', 'Afternoon', 'Evening'].map(slot => <button className={session.slot === slot ? 'active' : ''} onClick={() => updateSession(day.day, session.id, { slot })} key={slot}>{slot}</button>)}</span></div><label className="session-duration">Minutes<input type="number" min="10" step="5" value={session.minutes} onChange={event => updateSession(day.day, session.id, { minutes: Number(event.target.value) })}/></label><button className="remove-session" onClick={() => removeSession(day.day, session.id)} aria-label={`Delete ${session.subject} from ${day.day}`}><Trash2 size={14}/></button></section>) : <p className="empty-study-day">No study planned. Keep it free or add a session.</p>}</div></article>)}</div></PlannerResult>
  return <PlannerBuilder brand="sora." icon={GraduationCap} eyebrow="BUILD YOUR STUDY WEEK" title="Study with direction, not pressure." text="Add your subjects and weekly commitment. Your schedule updates as you type." onExit={onExit} summary={[['Subjects', subjects.length], ['Weekly hours', totalHours], ['Daily average', `${Math.round(totalHours * 60 / 7)} min`]]} onCreate={create} action="Build my study plan">
    <section className="planner-panel"><div className="panel-heading"><div><span>01</span><h2>Your study goal</h2></div><p>Keep the reason visible when motivation dips.</p></div><label className="wide-input">What are you working toward?<input value={goal} onChange={event => setGoal(event.target.value)}/></label></section>
    <section className="planner-panel"><div className="panel-heading"><div><span>02</span><h2>Subjects and time</h2></div><button onClick={add}><Plus size={15}/> Add subject</button></div><div className="study-guidance"><Sparkles size={15}/><span><strong>We’ll suggest a balanced week.</strong><small>You can completely customise every session after the suggestion is created.</small></span></div><div className="planner-item-list">{subjects.map((item, index) => <article className="study-item" key={item.id}><b>{String(index + 1).padStart(2, '0')}</b><label>Subject<input value={item.name} onChange={event => update(item.id, { name: event.target.value })}/></label><label>Hours / week<input type="number" min="1" max="40" value={item.hours} onChange={event => update(item.id, { hours: Number(event.target.value) })}/></label><div className="priority-field"><small>Priority</small><div>{['High', 'Medium', 'Low'].map(level => <button className={item.priority === level ? 'active' : ''} key={level} onClick={() => update(item.id, { priority: level })}>{level}</button>)}</div></div><button className="remove-item" onClick={() => remove(item.id)} aria-label={`Delete ${item.name}`}><Trash2 size={15}/></button></article>)}</div>{error && <span className="planner-error">{error}</span>}</section>
  </PlannerBuilder>
}

const shiftTime = (value, change) => {
  const [hours = 0, minutes = 0] = value.split(':').map(Number)
  const total = (hours * 60 + minutes + change + 1440) % 1440
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

function TimeControl({ value, onChange, name }) {
  return <div className="time-control"><button type="button" onClick={() => onChange(shiftTime(value, -15))} aria-label={`Make ${name} 15 minutes earlier`}>−</button><input aria-label={`Start time for ${name}`} inputMode="numeric" value={value} onChange={event => /^([01]\d|2[0-3]):[0-5]\d$/.test(event.target.value) && onChange(event.target.value)}/><button type="button" onClick={() => onChange(shiftTime(value, 15))} aria-label={`Make ${name} 15 minutes later`}>+</button></div>
}

function RoutineBuilder({ onExit }) {
  const [result, setResult] = useState(false)
  const [planName, setPlanName] = useState('My weekly rhythm')
  const [groups, setGroups] = useState([
    { id: 1, name: 'Weekdays', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], items: [
      { id: 11, name: 'Wake up and hydrate', time: '06:30', minutes: 15, category: 'Morning' },
      { id: 12, name: 'Focused work block', time: '09:00', minutes: 90, category: 'Focus' },
      { id: 13, name: 'Walk and reset', time: '18:00', minutes: 30, category: 'Health' },
      { id: 14, name: 'Read and wind down', time: '21:30', minutes: 30, category: 'Evening' },
    ] },
    { id: 2, name: 'Weekend', days: ['Sat', 'Sun'], items: [
      { id: 21, name: 'Slow breakfast', time: '08:30', minutes: 45, category: 'Morning' },
      { id: 22, name: 'Personal project', time: '11:00', minutes: 90, category: 'Personal' },
      { id: 23, name: 'Outdoor time', time: '17:00', minutes: 60, category: 'Health' },
    ] },
  ])
  const [error, setError] = useState('')
  useEffect(() => { document.title = 'Ritual — Daily routine builder'; return () => { document.title = "Flowly — There's a flow for it" } }, [])
  const activityCount = groups.reduce((sum, group) => sum + group.items.length, 0)
  const coveredDays = new Set(groups.flatMap(group => group.days)).size
  const updateGroup = (id, patch) => setGroups(list => list.map(group => group.id === id ? { ...group, ...patch } : group))
  const addGroup = () => setGroups(list => [...list, { id: Date.now(), name: 'New day group', days: [], items: [{ id: Date.now() + 1, name: 'New activity', time: '09:00', minutes: 30, category: 'Personal' }] }])
  const removeGroup = id => setGroups(list => list.filter(group => group.id !== id))
  const toggleDay = (groupId, day) => setGroups(list => { const selected = list.find(group => group.id === groupId)?.days.includes(day); return list.map(group => group.id === groupId ? { ...group, days: selected ? group.days.filter(item => item !== day) : [...group.days, day] } : selected ? group : { ...group, days: group.days.filter(item => item !== day) }) })
  const updateItem = (groupId, itemId, patch) => setGroups(list => list.map(group => group.id === groupId ? { ...group, items: group.items.map(item => item.id === itemId ? { ...item, ...patch } : item) } : group))
  const addItem = groupId => setGroups(list => list.map(group => group.id === groupId ? { ...group, items: [...group.items, { id: Date.now(), name: 'New activity', time: '12:00', minutes: 30, category: 'Personal' }] } : group))
  const removeItem = (groupId, itemId) => setGroups(list => list.map(group => group.id === groupId ? { ...group, items: group.items.filter(item => item.id !== itemId) } : group))
  const sortedItems = group => [...group.items].sort((a, b) => a.time.localeCompare(b.time))
  const pdfData = { brand: 'Ritual.', title: planName, subtitle: `${groups.length} day groups combined into one weekly plan`, summary: [{ label: 'Day groups', value: String(groups.length) }, { label: 'Activities', value: String(activityCount) }, { label: 'Days covered', value: String(coveredDays) }], sections: groups.map(group => ({ title: `${group.name} - ${group.days.join(', ')}`, rows: sortedItems(group).map(item => ({ label: item.time, detail: `${item.name} - ${item.category}`, meta: minutesLabel(item.minutes) })) })) }
  const create = () => { const invalid = !planName.trim() || !groups.length || groups.some(group => !group.name.trim() || !group.days.length || !group.items.length || group.items.some(item => !item.name.trim() || !item.time || item.minutes <= 0)); if (invalid) { setError('Every group needs a name, at least one day, and one valid activity.'); return } setError(''); setResult(true); window.scrollTo(0, 0) }
  if (result) return <PlannerResult type="routine" brand="ritual." icon={SunMedium} title="One week. Different rhythms." subtitle={`${planName} · ${groups.length} day groups`} stat={`${activityCount} activities`} statLabel="across one plan" onExit={onExit} onEdit={() => setResult(false)} onDownload={() => downloadPlannerPdf(pdfData, 'ritual-weekly-routine.pdf')}><div className="routine-group-results">{groups.map(group => <section key={group.id}><header><div><small>DAY GROUP</small><h2>{group.name}</h2></div><span>{group.days.join(' · ')}</span></header><div className="routine-timeline">{sortedItems(group).map(item => <article key={item.id}><time>{item.time}</time><i/><div><small>{item.category}</small><strong>{item.name}</strong><span>{minutesLabel(item.minutes)}</span></div></article>)}</div></section>)}</div></PlannerResult>
  return <PlannerBuilder brand="ritual." icon={SunMedium} eyebrow="DESIGN YOUR WEEKLY RHYTHM" title="Different days deserve different plans." text="Group similar days together, then build a routine for each group. Everything exports in one PDF." onExit={onExit} summary={[['Day groups', groups.length], ['Activities', activityCount], ['Days covered', `${coveredDays}/7`]]} onCreate={create} action="Create my weekly plan">
    <section className="planner-panel"><div className="panel-heading"><div><span>01</span><h2>Name your plan</h2></div><p>This title appears on your combined PDF.</p></div><label className="wide-input">Plan name<input value={planName} onChange={event => setPlanName(event.target.value)}/></label></section>
    <section className="routine-groups-heading"><div><span>02</span><div><h2>Build your day groups</h2><p>Weekdays and weekends are ready to customise. Add more groups whenever you need them.</p></div></div><button onClick={addGroup}><Plus size={15}/> Add day group</button></section>
    <div className="routine-groups">{groups.map((group, groupIndex) => <section className="routine-group-card" key={group.id}><header><div className="group-number">{String(groupIndex + 1).padStart(2, '0')}</div><label>Group name<input value={group.name} onChange={event => updateGroup(group.id, { name: event.target.value })}/></label>{groups.length > 1 && <button className="delete-group" onClick={() => removeGroup(group.id)} aria-label={`Delete ${group.name} group`}><Trash2 size={15}/></button>}</header><div className="group-days"><small>USE THIS ROUTINE ON</small><div>{days.map(day => <button className={group.days.includes(day) ? 'active' : ''} onClick={() => toggleDay(group.id, day)} key={day}>{group.days.includes(day) && <Check size={12}/>} {day}</button>)}</div></div><div className="group-activities-head"><div><strong>{group.name || 'Untitled group'} routine</strong><small>{group.items.length} activities · {minutesLabel(group.items.reduce((sum, item) => sum + (Number(item.minutes) || 0), 0))}</small></div><button onClick={() => addItem(group.id)}><Plus size={14}/> Add activity</button></div><div className="group-activity-list">{group.items.map(item => <article key={item.id}><label className="activity-name">Activity<input value={item.name} onChange={event => updateItem(group.id, item.id, { name: event.target.value })}/></label><label className="activity-time">Start time<TimeControl value={item.time} name={item.name} onChange={time => updateItem(group.id, item.id, { time })}/></label><label>Duration<input type="number" min="5" step="5" value={item.minutes} onChange={event => updateItem(group.id, item.id, { minutes: Number(event.target.value) })}/><small>min</small></label><label>Category<input value={item.category} onChange={event => updateItem(group.id, item.id, { category: event.target.value })}/></label><button className="remove-item" onClick={() => removeItem(group.id, item.id)} aria-label={`Delete ${item.name}`}><Trash2 size={15}/></button></article>)}</div></section>)}</div>{error && <span className="planner-error routine-error">{error}</span>}
  </PlannerBuilder>
}

function PlannerBuilder({ brand, icon, eyebrow, title, text, onExit, summary, children, onCreate, action }) {
  return <main className={`planner-tool ${brand.startsWith('sora') ? 'study-tool' : 'routine-tool'}`}><ToolHeader brand={brand} icon={icon} onExit={onExit}/><section className="planner-builder"><header><span><Sparkles size={14}/> {eyebrow}</span><h1>{title}</h1><p>{text}</p></header><div className="planner-summary">{summary.map(([label, value]) => <span key={label}><small>{label}</small><strong>{value}</strong></span>)}</div>{children}</section><footer className="planner-footer"><button onClick={onExit}><ArrowLeft size={16}/> Cancel</button><span>Everything stays in this browser</span><button className="create-plan" onClick={onCreate}>{action}<ArrowRight size={16}/></button></footer></main>
}

function PlannerResult({ type, brand, icon, title, subtitle, stat, statLabel, onExit, onEdit, onDownload, children }) {
  return <main className={`planner-tool planner-result ${type === 'study' ? 'study-tool' : 'routine-tool'}`}><ToolHeader brand={brand} icon={icon} onExit={onExit} result onEdit={onEdit}/><section className="planner-result-shell"><header><div><span><Sparkles size={14}/> YOUR PLAN IS READY</span><h1>{title}</h1><p>{subtitle}</p></div><aside><small>{statLabel}</small><strong>{stat}</strong><button onClick={onDownload}><Download size={16}/> Download PDF</button></aside></header>{children}<div className="result-actions"><button onClick={onEdit}><RotateCcw size={15}/> Adjust plan</button><button onClick={onExit}>Done <Check size={15}/></button></div></section></main>
}

export { StudyPlanner, RoutineBuilder }
