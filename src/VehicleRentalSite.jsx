import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft, ArrowRight, CalendarDays, CarFront, Check, CheckCircle2, ChevronDown,
  Fuel, Gauge, GitCompareArrows, Luggage, MapPin, Minus, Plus, Search, ShieldCheck,
  SlidersHorizontal, Sparkles, Star, Users, X, Zap,
} from 'lucide-react'
import { routeUrl } from './navigation.js'
import './vehicle-rental.css'

const vehicles = [
  { id: 'swift', name: 'Maruti Swift', type: 'City', price: 1890, rating: 4.8, seats: 5, bags: 2, fuel: 'Petrol', gearbox: 'Automatic', tone: 'mint', tag: 'Best value', distance: '1.2 km away' },
  { id: 'creta', name: 'Hyundai Creta', type: 'SUV', price: 2790, rating: 4.9, seats: 5, bags: 4, fuel: 'Petrol', gearbox: 'Automatic', tone: 'amber', tag: 'Most booked', distance: 'Airport terminal' },
  { id: 'nexon', name: 'Tata Nexon EV', type: 'Electric', price: 3190, rating: 4.9, seats: 5, bags: 3, fuel: 'Electric', gearbox: 'Automatic', tone: 'blue', tag: 'Electric', distance: '2.4 km away' },
  { id: 'thar', name: 'Mahindra Thar', type: 'Adventure', price: 3890, rating: 4.7, seats: 4, bags: 2, fuel: 'Diesel', gearbox: 'Manual', tone: 'clay', tag: 'Weekend pick', distance: '3.1 km away' },
]

const extras = [
  { id: 'cover', name: 'Complete protection', note: 'Reduce damage liability for the whole trip.', price: 649, icon: ShieldCheck },
  { id: 'driver', name: 'Additional driver', note: 'Share driving with one more eligible driver.', price: 299, icon: Users },
  { id: 'roadside', name: 'Priority roadside help', note: 'Move to the front of the support queue.', price: 199, icon: Zap },
]

const money = value => `₹${value.toLocaleString('en-IN')}`

function VehicleArt({ vehicle }) {
  return <div className={`rental-car-art ${vehicle.tone}`} aria-hidden="true"><span/><i/><CarFront size={72}/><b/><b/></div>
}

export default function VehicleRentalSite({ onExit }) {
  const [category, setCategory] = useState('All')
  const [sort, setSort] = useState('recommended')
  const [passengers, setPassengers] = useState(2)
  const [selectedId, setSelectedId] = useState(null)
  const [compare, setCompare] = useState([])
  const [compareOpen, setCompareOpen] = useState(false)
  const [utilityPanel, setUtilityPanel] = useState(null)
  const [pickup, setPickup] = useState('Pune Airport')
  const [tripDates, setTripDates] = useState('12 Nov, 10:00 → 15 Nov, 18:00')
  const [mapZoom, setMapZoom] = useState(1)
  const [drawer, setDrawer] = useState(null)
  const [chosenExtras, setChosenExtras] = useState(['cover'])
  const [driver, setDriver] = useState({ name: '', email: '', age: '25–69' })
  const [error, setError] = useState('')
  const [searchNotice, setSearchNotice] = useState('')
  const selected = vehicles.find(vehicle => vehicle.id === selectedId) || vehicles[1]
  const visible = useMemo(() => vehicles.filter(vehicle => (category === 'All' || vehicle.type === category) && vehicle.seats >= passengers).sort((a,b) => sort === 'price' ? a.price - b.price : b.rating - a.rating), [category, passengers, sort])
  const extrasTotal = extras.filter(extra => chosenExtras.includes(extra.id)).reduce((total, extra) => total + extra.price * 3, 0)
  const subtotal = selected.price * 3
  const taxes = Math.round((subtotal + extrasTotal) * .18)
  const total = subtotal + extrasTotal + taxes
  const chooseVehicle = id => { setSelectedId(id); setDrawer('configure'); setError('') }
  const toggleCompare = id => setCompare(current => current.includes(id) ? current.filter(item => item !== id) : current.length < 2 ? [...current, id] : [current[1], id])
  const toggleExtra = id => setChosenExtras(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id])
  const continueDrawer = () => {
    if (drawer === 'configure') { setDrawer('driver'); return }
    if (drawer === 'driver') {
      if (!driver.name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(driver.email.trim())) { setError('Add a name and valid email to review this demo rental.'); return }
      setError(''); setDrawer('review'); return
    }
    if (drawer === 'review') setDrawer('success')
  }
  useEffect(() => {
    if (!drawer && !compareOpen && !utilityPanel) return undefined
    const previous = document.body.style.overflow
    const close = event => { if (event.key === 'Escape') { setCompareOpen(false); setDrawer(null); setUtilityPanel(null) } }
    if (drawer || compareOpen || utilityPanel === 'saved' || utilityPanel === 'trips') document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', close)
    return () => { document.body.style.overflow = previous; window.removeEventListener('keydown', close) }
  }, [drawer, compareOpen, utilityPanel])
  const refreshSearch = () => {
    setSearchNotice(`${visible.length} vehicle${visible.length === 1 ? '' : 's'} fit ${passengers} traveller${passengers === 1 ? '' : 's'}.`)
    window.setTimeout(() => setSearchNotice(''), 2600)
  }
  return <main className="rental-app">
    <header className="rental-appbar"><button className="rental-flowly" onClick={onExit}><ArrowLeft size={16}/> Flowly</button><a className="rental-brand" href={routeUrl('/vehicle-rental')}><span><CarFront size={18}/></span>roamly</a><div><button onClick={() => setUtilityPanel('saved')}>Saved cars</button><button onClick={() => setUtilityPanel('trips')}>Trips</button><span className="rental-avatar">SD</span></div></header>

    <section className="rental-querybar" aria-label="Rental search">
      <div className={`rental-query-control ${utilityPanel === 'pickup' ? 'open' : ''}`}><button className="rental-query-field" aria-expanded={utilityPanel === 'pickup'} onClick={() => setUtilityPanel(current => current === 'pickup' ? null : 'pickup')}><small>Pick-up & return</small><span><MapPin size={15}/><strong>{pickup}</strong><ChevronDown size={14}/></span></button>{utilityPanel === 'pickup' && <><button className="rental-popover-dismiss" aria-label="Close pick-up options" onClick={() => setUtilityPanel(null)}/><div className="rental-query-popover" role="dialog" aria-label="Choose a pick-up point"><header><span><MapPin size={16}/></span><div><strong>Pick-up point</strong><small>Return to the same location</small></div></header>{['Pune Airport','Pune Railway Station','Hinjewadi Phase 1'].map(item => <button className={pickup===item?'active':''} key={item} onClick={() => {setPickup(item);setUtilityPanel(null)}}><span><strong>{item}</strong><small>{item === 'Pune Airport' ? 'Terminal forecourt' : item === 'Pune Railway Station' ? 'Main entrance' : 'Rajiv Gandhi Infotech Park'}</small></span>{pickup===item&&<Check/>}</button>)}</div></>}</div>
      <div className={`rental-query-control ${utilityPanel === 'dates' ? 'open' : ''}`}><button className="rental-query-field" aria-expanded={utilityPanel === 'dates'} onClick={() => setUtilityPanel(current => current === 'dates' ? null : 'dates')}><small>Trip dates</small><span><CalendarDays size={15}/><strong>{tripDates}</strong><ChevronDown size={14}/></span></button>{utilityPanel === 'dates' && <><button className="rental-popover-dismiss" aria-label="Close date options" onClick={() => setUtilityPanel(null)}/><div className="rental-query-popover rental-date-popover" role="dialog" aria-label="Choose trip dates"><header><span><CalendarDays size={16}/></span><div><strong>Trip dates</strong><small>Choose a three-day sample</small></div></header>{['12 Nov, 10:00 → 15 Nov, 18:00','20 Nov, 09:00 → 23 Nov, 19:00','28 Nov, 08:00 → 1 Dec, 18:00'].map(item => <button className={tripDates===item?'active':''} key={item} onClick={() => {setTripDates(item);setUtilityPanel(null)}}><span><strong>{item.split(' → ')[0]}</strong><small>Return {item.split(' → ')[1]}</small></span>{tripDates===item&&<Check/>}</button>)}</div></>}</div>
      <label><small>Travellers</small><span><button aria-label="Remove passenger" onClick={() => setPassengers(value => Math.max(1, value - 1))}><Minus size={13}/></button><strong>{passengers} people</strong><button aria-label="Add passenger" onClick={() => setPassengers(value => Math.min(8, value + 1))}><Plus size={13}/></button></span></label><button className="rental-search" onClick={refreshSearch}><Search size={17}/> Update search</button>
    </section>
    {searchNotice && <div className="rental-search-notice" role="status"><Check size={14}/>{searchNotice}</div>}

    <section className="rental-workspace">
      <div className="rental-map" aria-label="Map showing available rental vehicles"><div className="rental-map-canvas" style={{transform:`scale(${mapZoom})`}}><div className="map-grid"/><span className="road r1"/><span className="road r2"/><span className="road r3"/><span className="route-line"/><div className="map-label airport">PUNE AIRPORT</div><div className="map-label viman">VIMAN NAGAR</div><div className="map-label kharadi">KHARADI</div><span className="map-pin start"><MapPin size={17}/></span>{vehicles.map((vehicle, index) => <button key={vehicle.id} className={`map-price pin-${index + 1} ${selectedId === vehicle.id ? 'active' : ''}`} onClick={() => chooseVehicle(vehicle.id)}>{money(vehicle.price)}</button>)}</div><div className="map-zoom"><button aria-label="Zoom map in" disabled={mapZoom >= 1.3} onClick={() => setMapZoom(value => Math.min(1.3, +(value + .1).toFixed(1)))}><Plus size={16}/></button><button aria-label="Zoom map out" disabled={mapZoom <= .8} onClick={() => setMapZoom(value => Math.max(.8, +(value - .1).toFixed(1)))}><Minus size={16}/></button></div><div className="map-status"><span><Sparkles size={14}/></span><strong>{Math.round(mapZoom * 100)}% map view</strong><small>Map and availability use sample data.</small></div></div>

      <aside className="rental-results"><header><div><small>12–15 NOV · PUNE</small><h1>{visible.length} vehicles nearby</h1></div><button onClick={() => setCategory('All')}><SlidersHorizontal size={16}/> Clear filters <b>{category === 'All' ? 0 : 1}</b></button></header><div className="rental-filter-row">{['All','City','SUV','Electric','Adventure'].map(item => <button className={category === item ? 'active' : ''} onClick={() => setCategory(item)} key={item}>{item}</button>)}<button className="sort" onClick={() => setSort(current => current === 'recommended' ? 'price' : 'recommended')}>{sort === 'recommended' ? 'Recommended' : 'Lowest price'} <ChevronDown size={13}/></button></div><div className="rental-result-list">{visible.length ? visible.map(vehicle => <article className={selectedId === vehicle.id ? 'selected' : ''} key={vehicle.id}><VehicleArt vehicle={vehicle}/><div className="vehicle-result-copy"><span className="vehicle-tag">{vehicle.tag}</span><h2>{vehicle.name}</h2><p>{vehicle.type} · {vehicle.distance}</p><div className="vehicle-spec-row"><span><Users size={14}/>{vehicle.seats}</span><span><Luggage size={14}/>{vehicle.bags}</span><span><Fuel size={14}/>{vehicle.fuel}</span><span><Gauge size={14}/>{vehicle.gearbox}</span></div><label><input type="checkbox" checked={compare.includes(vehicle.id)} onChange={() => toggleCompare(vehicle.id)}/><GitCompareArrows size={14}/> Compare</label></div><div className="vehicle-result-price"><span><Star size={12} fill="currentColor"/> {vehicle.rating}</span><strong>{money(vehicle.price)}</strong><small>per day</small><button onClick={() => chooseVehicle(vehicle.id)}>View deal <ArrowRight size={14}/></button></div></article>) : <div className="rental-empty"><Users size={25}/><strong>No vehicle fits {passengers} travellers</strong><p>Reduce the traveller count or choose a larger vehicle category.</p><button onClick={() => setPassengers(4)}>Search for 4 people</button></div>}</div></aside>
    </section>

    {compare.length > 0 && !drawer && !compareOpen && <div className="rental-compare-bar"><div><GitCompareArrows size={19}/><span><strong>{compare.length} selected</strong><small>Select {compare.length === 1 ? 'one more vehicle' : 'compare to see differences'}</small></span></div><div>{compare.map(id => { const vehicle = vehicles.find(item => item.id === id); return <span key={id}>{vehicle.name}<button aria-label={`Remove ${vehicle.name}`} onClick={() => toggleCompare(id)}><X size={12}/></button></span> })}</div><button disabled={compare.length < 2} onClick={()=>setCompareOpen(true)}>Compare vehicles</button></div>}

    {compareOpen&&<div className="rental-compare-modal" role="dialog" aria-modal="true" aria-label="Vehicle comparison"><button className="rental-compare-backdrop" onClick={()=>setCompareOpen(false)} aria-label="Close comparison"/><section><header><div><small>SIDE-BY-SIDE</small><h2>Choose the right drive.</h2></div><button onClick={()=>setCompareOpen(false)} aria-label="Close comparison"><X/></button></header><div className="rental-compare-columns"><span/><strong>DAILY PRICE</strong><strong>RATING</strong><strong>SEATS</strong><strong>LUGGAGE</strong><strong>FUEL</strong><strong>GEARBOX</strong><strong>PICK-UP</strong></div>{compare.map(id=>{const vehicle=vehicles.find(item=>item.id===id);return <div className="rental-compare-vehicle" key={id}><VehicleArt vehicle={vehicle}/><h3>{vehicle.name}</h3><span>{vehicle.type}</span><b>{money(vehicle.price)}</b><b><Star size={12} fill="currentColor"/> {vehicle.rating}</b><b>{vehicle.seats} people</b><b>{vehicle.bags} bags</b><b>{vehicle.fuel}</b><b>{vehicle.gearbox}</b><b>{vehicle.distance}</b><button onClick={()=>{setCompareOpen(false);chooseVehicle(vehicle.id)}}>Choose this car <ArrowRight size={14}/></button></div>})}</section></div>}

    {drawer && <><button className="rental-drawer-backdrop" onClick={() => setDrawer(null)} aria-label="Close rental details"/><aside className="rental-drawer" role="dialog" aria-modal="true" aria-label="Build rental"><header><div><small>BUILD YOUR RENTAL</small><strong>{selected.name}</strong></div><button onClick={() => setDrawer(null)} aria-label="Close"><X size={18}/></button></header><nav><button className={drawer === 'configure' ? 'active' : ''} onClick={() => setDrawer('configure')}>Car & cover</button><button className={drawer === 'driver' ? 'active' : ''} onClick={() => setDrawer('driver')}>Driver</button><button className={drawer === 'review' || drawer === 'success' ? 'active' : ''} disabled={drawer === 'configure' || drawer === 'driver'} onClick={() => setDrawer('review')}>Review</button></nav>
      <div className="rental-drawer-scroll">
        {drawer === 'configure' && <><VehicleArt vehicle={selected}/><section className="drawer-vehicle-title"><div><span className="vehicle-tag">{selected.tag}</span><h2>{selected.name}</h2><p>{selected.type} · {selected.gearbox} · {selected.fuel}</p></div><span><Star size={13} fill="currentColor"/> {selected.rating}</span></section><section className="drawer-trip-line"><MapPin size={18}/><div><small>PICK-UP & RETURN</small><strong>Pune Airport</strong><span>12 Nov, 10:00 → 15 Nov, 18:00</span></div></section><div className="drawer-section-title"><span>Choose what you need</span><small>Optional extras update the total instantly.</small></div><div className="drawer-extras">{extras.map(({ id, name, note, price, icon: Icon }) => <button className={chosenExtras.includes(id) ? 'active' : ''} onClick={() => toggleExtra(id)} key={id}><i><Icon size={18}/></i><span><strong>{name}</strong><small>{note}</small></span><b>+{money(price)}<small>/day</small></b><em>{chosenExtras.includes(id) && <Check size={13}/>}</em></button>)}</div></>}
        {drawer === 'driver' && <><div className="drawer-driver-intro"><span><Users size={24}/></span><h2>Who’s driving?</h2><p>These details remain in this browser and only demonstrate the review experience.</p></div><div className="drawer-form"><label>Full name *<input value={driver.name} onChange={event => setDriver({ ...driver, name: event.target.value })} placeholder="Driver name"/></label><label>Email address *<input type="email" value={driver.email} onChange={event => setDriver({ ...driver, email: event.target.value })} placeholder="you@example.com"/></label><label>Driver age<select value={driver.age} onChange={event => setDriver({...driver, age:event.target.value})}><option>25–69</option><option>21–24</option><option>70+</option></select></label><div><ShieldCheck size={16}/><span><strong>Demo privacy</strong><small>No account is created and nothing is submitted.</small></span></div></div>{error && <p className="drawer-error">{error}</p>}</>}
        {drawer === 'review' && <><div className="drawer-review-hero"><VehicleArt vehicle={selected}/><span><small>YOUR VEHICLE</small><strong>{selected.name}</strong><p>{pickup} · {tripDates}</p></span><button onClick={() => setDrawer('configure')}>Edit</button></div><div className="drawer-review-lines"><p><span>Vehicle × 3 days</span><strong>{money(subtotal)}</strong></p>{extras.filter(extra => chosenExtras.includes(extra.id)).map(extra => <p key={extra.id}><span>{extra.name}</span><strong>{money(extra.price * 3)}</strong></p>)}<p><span>Taxes and fees</span><strong>{money(taxes)}</strong></p></div><div className="drawer-driver-card"><span className="rental-avatar">{driver.name.split(' ').map(part => part[0]).join('').slice(0,2).toUpperCase()}</span><div><small>PRIMARY DRIVER · {driver.age}</small><strong>{driver.name}</strong><p>{driver.email}</p></div><button onClick={() => setDrawer('driver')}>Edit</button></div><div className="drawer-demo-note"><ShieldCheck size={17}/><span><strong>UI demonstration only</strong><small>No vehicle or payment will be processed.</small></span></div></>}
        {drawer === 'success' && <div className="drawer-success"><span><CheckCircle2 size={45}/></span><small>DEMO RENTAL READY</small><h2>Everything is lined up.</h2><p>You completed a realistic rental flow without reserving a vehicle or sharing data.</p><div><strong>{selected.name}</strong><span>12–15 Nov · Pune Airport</span><b>{money(total)}</b></div><button onClick={() => { setDrawer(null); setSelectedId(null) }}>Explore more vehicles</button></div>}
      </div>
      {drawer !== 'success' && <footer><span><small>3-DAY DEMO TOTAL</small><strong>{money(total)}</strong><em>Taxes included</em></span><button onClick={continueDrawer}>{drawer === 'configure' ? 'Add driver' : drawer === 'driver' ? 'Review rental' : 'Confirm demo rental'} <ArrowRight size={15}/></button></footer>}
    </aside></>}
    {(utilityPanel === 'saved' || utilityPanel === 'trips') && <div className="rental-utility-modal" role="dialog" aria-modal="true" aria-label="Rental preferences"><button className="rental-compare-backdrop" onClick={() => setUtilityPanel(null)} aria-label="Close preferences"/><section><header><div><small>ROAMLY DEMO</small><h2>{utilityPanel === 'saved' ? 'Saved cars' : 'Your trips'}</h2></div><button onClick={() => setUtilityPanel(null)} aria-label="Close"><X/></button></header>{utilityPanel === 'saved' && <div className="rental-utility-content"><VehicleArt vehicle={vehicles[1]}/><div><strong>Hyundai Creta</strong><p>Your sample saved car is ready to compare or continue.</p><button onClick={() => {setUtilityPanel(null); chooseVehicle('creta')}}>View saved car <ArrowRight size={14}/></button></div></div>}{utilityPanel === 'trips' && <div className="rental-utility-empty"><CalendarDays/><strong>No upcoming trips</strong><p>Complete the demo rental flow and it will appear here.</p><button onClick={() => setUtilityPanel(null)}>Explore vehicles</button></div>}</section></div>}
  </main>
}
