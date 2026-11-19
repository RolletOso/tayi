import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, ArrowUpDown, Bookmark, Bus, Check, Clock3, Compass, Info, MapPin, Navigation, Plus, Search, ShieldCheck, SlidersHorizontal, X } from "lucide-react";
import { categories, formatNaira, legs, resolveStop, stops, vehicleInfo } from "./data";
import { findTrips, rankTrips } from "./routing";
import type { Trip, VehicleType } from "./types";

type Tab = "trip" | "fares" | "saved";
type FareReport = { legId: string; amount: string; vehicle: VehicleType; note: string; at: string };
const tripStyles = ["Cheapest", "Fastest", "Fewest changes", "Easiest for visitors", "Better at night"];
const popular = ["UNIPORT", "Mile 1 Park", "Rumuokoro", "Choba", "Garrison", "Waterlines"];

function readSaved<T>(key: string, fallback: T): T {
  try { const value = localStorage.getItem(key); return value ? JSON.parse(value) as T : fallback; } catch { return fallback; }
}

export default function App() {
  const [from, setFrom] = useState("Mile 1 Park");
  const [to, setTo] = useState("UNIPORT");
  const [style, setStyle] = useState("Cheapest");
  const [tab, setTab] = useState<Tab>("trip");
  const [searched, setSearched] = useState(false);
  const [selected, setSelected] = useState<Trip | null>(null);
  const [notice, setNotice] = useState("");
  const [saved, setSaved] = useState<string[]>(() => readSaved<string[]>("tayi-saved", []));
  const [reports, setReports] = useState<FareReport[]>(() => readSaved<FareReport[]>("tayi-reports", []));
  const [reportFor, setReportFor] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [vehicle, setVehicle] = useState<VehicleType>("Normal Bus");
  const [note, setNote] = useState("");

  const origin = resolveStop(from);
  const destination = resolveStop(to);
  const trips = useMemo(() => origin && destination ? rankTrips(findTrips(origin.id, destination.id), style) : [], [origin?.id, destination?.id, style]);

  function search(event: FormEvent) {
    event.preventDefault();
    setSelected(null);
    setSearched(true);
    if (!origin || !destination) setNotice("Choose a recognised place from the suggestions.");
    else if (origin.id === destination.id) setNotice("Choose two different places for your journey.");
    else { setNotice(""); setTab("trip"); }
  }

  function swap() { setFrom(to); setTo(from); setSearched(false); setSelected(null); }

  function saveTrip(trip: Trip) {
    const next = saved.includes(trip.id) ? saved.filter((id) => id !== trip.id) : [...saved, trip.id];
    setSaved(next);
    localStorage.setItem("tayi-saved", JSON.stringify(next));
    setNotice(next.includes(trip.id) ? "Journey saved on this device." : "Journey removed from saved trips.");
  }

  function openReport(id: string) {
    const leg = legs.find((item) => item.id === id);
    if (!leg) return;
    setReportFor(id); setVehicle(leg.vehicle); setAmount(""); setNote("");
  }

  function submitReport(event: FormEvent) {
    event.preventDefault();
    if (!reportFor || Number(amount) <= 0) return;
    const next = [{ legId: reportFor, amount, vehicle, note, at: new Date().toISOString() }, ...reports];
    setReports(next);
    localStorage.setItem("tayi-reports", JSON.stringify(next));
    setReportFor(null);
    setNotice("Thanks. Your report is saved in this browser preview; it has not been sent to Tayi yet.");
  }

  const savedTrips = useMemo(() => {
    const found = new Map<string, Trip>();
    for (const a of stops) for (const b of stops) for (const trip of findTrips(a.id, b.id)) if (saved.includes(trip.id)) found.set(trip.id, trip);
    return [...found.values()];
  }, [saved]);

  const currentReportLeg = legs.find((leg) => leg.id === reportFor);

  function useMyLocation() {
    if (!navigator.geolocation) { setNotice("Location is not available in this browser. Type a nearby landmark instead."); return; }
    setNotice("Requesting location permission…");
    navigator.geolocation.getCurrentPosition(
      () => setNotice("Location permission received. Choose the nearest landmark as your starting point; automatic stop matching is not connected yet."),
      () => setNotice("Location permission was not granted. You can type a nearby landmark instead."),
      { enableHighAccuracy: false, timeout: 8000 }
    );
  }

  function openSaved(trip: Trip) {
    setFrom(stops.find((s) => s.id === trip.from)?.name ?? trip.from);
    setTo(stops.find((s) => s.id === trip.to)?.name ?? trip.to);
    setSelected(trip); setSearched(false); setTab("trip");
  }

  return <div className="app-shell">
    <header className="topbar">
      <button className="brand" onClick={() => { setTab("trip"); setSelected(null); }} aria-label="Tayi home">
        <span className="brand-mark"><Compass size={21} /></span><span>Tayi<span className="brand-dot">.</span></span>
      </button>
      <div className="topbar-right"><span className="city-label"><MapPin size={14} /> Port Harcourt</span><span className="sample-label"><i /> Sample data</span></div>
    </header>

    <main className="main-content">
      {tab === "trip" && !selected && !searched && <>
        <section className="hero">
          <div className="hero-copy"><div className="eyebrow"><i /> YOUR CITY, YOUR WAY</div><h1>Where you<br /><em>dey go?</em></h1><p>Find a way there with buses, keke and the everyday routes people use.</p></div>
          <div className="hero-art" aria-hidden="true"><div className="art-sun" /><div className="art-route" /><div className="art-route route-two" /><div className="art-pin"><MapPin size={24} /></div><div className="art-bus"><Bus size={40} /></div><i className="art-dot dot-one" /><i className="art-dot dot-two" /></div>
        </section>

        <section className="search-panel">
          <div className="search-heading"><div><span className="section-kicker">START A JOURNEY</span><h2>Where are you heading?</h2></div><span className="step-count">01 <small>/ 02</small></span></div>
          <form onSubmit={search}>
            <div className="location-fields">
              <div className="field-stack"><label htmlFor="from">FROM</label><div className="location-input"><i className="location-bullet start" /><input id="from" list="tayi-places" value={from} onChange={(e) => setFrom(e.target.value)} placeholder="Enter your starting point" /></div><div className="field-subtext"><Navigation size={13} /><button type="button" onClick={useMyLocation}>Use my location</button><span>or type a nearby place</span></div></div>
              <button type="button" className="swap-button" onClick={swap} aria-label="Swap places"><ArrowUpDown size={17} /></button>
              <div className="field-stack"><label htmlFor="to">TO</label><div className="location-input"><i className="location-bullet end" /><input id="to" list="tayi-places" value={to} onChange={(e) => setTo(e.target.value)} placeholder="Where do you want to go?" /></div><div className="field-subtext"><MapPin size={13} /><span>School, market, hospital or landmark</span></div></div>
            </div>
            <datalist id="tayi-places">{stops.flatMap((stop) => [stop.name, ...stop.aliases]).map((label) => <option key={label} value={label} />)}</datalist>
            <button className="primary-button search-button" type="submit"><Search size={18} /> Find my route <ArrowRight size={17} /></button>
          </form>
          {notice && <div className="inline-notice"><Info size={15} />{notice}<button onClick={() => setNotice("")} aria-label="Dismiss"><X size={14} /></button></div>}
        </section>

        <section className="popular-section"><div className="section-heading"><div><span className="section-kicker">QUICK PICKS</span><h2>Popular places</h2></div><span className="muted-small">Around Port Harcourt</span></div>
          <div className="popular-grid">{popular.map((place, i) => <button className="popular-place" key={place} onClick={() => { setTo(place); setNotice(""); }}><span className={"popular-icon icon-" + (i % 6)}>{["🎓", "🚌", "📍", "🏙️", "🚏", "🏘️"][i]}</span><span>{place}</span><ArrowUpDown size={13} className="place-arrow" /></button>)}</div>
        </section>

        <section className="category-section"><div className="section-heading"><div><span className="section-kicker">EXPLORE BY TYPE</span><h2>What are you looking for?</h2></div></div>
          <div className="category-grid">{categories.map((category) => <button className="category-card" key={category.label} onClick={() => { setTo(category.examples[0]); setNotice(category.examples[0] + " selected. Press Find my route to continue."); }}><span>{category.icon}</span><strong>{category.label}</strong><small>{category.examples[0]}</small></button>)}</div>
        </section>

        <section className="how-card"><span className="how-icon"><ShieldCheck size={21} /></span><div><strong>Built around how people actually move</strong><p>Use familiar places and landmarks. Community fare reports will help improve the guide over time.</p></div><ArrowRight size={17} /></section>
      </>}

      {tab === "trip" && searched && !selected && <section className="results-view">
        <button className="back-link" onClick={() => setSearched(false)}><ArrowLeft size={16} /> Back to search</button>
        <span className="section-kicker">ROUTE SEARCH</span><h1 className="result-header">{from} <span>to</span> {to}</h1>
        {!origin || !destination ? <Empty title="Choose a known place" text="Try Mile 1 Park, Rumuokoro, Choba, UNIPORT, Garrison or Waterlines." />
          : trips.length === 0 ? <Empty title="No mapped connection yet" text="We do not have a route between these places in the current sample network. We will add a way to suggest missing stops and connections." />
          : <><div className="style-picker"><div><SlidersHorizontal size={16} /><strong>Choose your trip style</strong></div><div className="style-options">{tripStyles.map((item) => <button key={item} className={style === item ? "active" : ""} onClick={() => setStyle(item)}>{item}</button>)}</div></div>
            <div className="routes-list">{trips.map((trip, index) => <button className="route-option" key={trip.id} onClick={() => setSelected(trip)}>
              <div className="route-option-top"><span className="route-tag">{index === 0 ? "Suggested route" : "Alternative route"}</span><span className="route-option-time"><Clock3 size={14} /> {trip.minutes[0]}–{trip.minutes[1]} min</span></div>
              <div className="route-path">{trip.legs.map((leg, i) => <span key={leg.id + i}>{stops.find((s) => s.id === leg.start)?.name}{i < trip.legs.length - 1 && <i> → </i>}</span>)}<i> → </i><strong>{to}</strong></div>
              <div className="route-option-bottom"><span>{trip.legs.map((leg) => leg.vehicle).join(" · ")}</span><strong>{trip.unpricedCount ? "Fare partly known" : formatNaira(trip.pricedFare[0]) + "–" + formatNaira(trip.pricedFare[1])}</strong><ArrowRight size={16} /></div>
            </button>)}</div>
          </>}
        {notice && <div className="inline-notice"><Info size={15} />{notice}<button onClick={() => setNotice("")}><X size={14} /></button></div>}
      </section>}

      {tab === "trip" && selected && <section className="results-view">
        <button className="back-link" onClick={() => setSelected(null)}><ArrowLeft size={16} /> Back to routes</button>
        <div className="result-title-row"><div><span className="section-kicker">YOUR JOURNEY</span><h1>{from} <span>to</span><br />{to}</h1></div><span className="sample-label"><i /> Sample data</span></div>
        <div className="journey-summary">
          <Summary icon={<Clock3 size={17} />} value={selected.minutes[0] + "–" + selected.minutes[1] + " min"} label="Travel time" />
          <Summary icon={<Bus size={17} />} value={selected.legs.length + " rides"} label={selected.changes + " change" + (selected.changes === 1 ? "" : "s")} />
          <Summary icon={<span className="naira-symbol">₦</span>} value={selected.unpricedCount ? "Partial fare" : formatNaira(selected.pricedFare[0]) + "–" + formatNaira(selected.pricedFare[1])} label={selected.unpricedCount ? selected.unpricedCount + " price needed" : "Estimated total"} />
        </div>
        {selected.unpricedCount > 0 && <div className="fare-warning"><Info size={18} /><div><strong>Some fares are not confirmed yet</strong><p>This route is still shown. The amount above only covers priced legs, so your full journey cost is not available yet.</p></div></div>}
        <div className="timeline-heading"><div><span className="section-kicker">STEP BY STEP</span><h2>Your route</h2></div><button className="save-button" onClick={() => saveTrip(selected)}><Bookmark size={15} fill={saved.includes(selected.id) ? "currentColor" : "none"} />{saved.includes(selected.id) ? "Saved" : "Save trip"}</button></div>
        <div className="timeline">{selected.legs.map((leg, index) => {
          const reverse = leg.direction === "reverse";
          const startName = stops.find((s) => s.id === leg.start)?.name ?? leg.start;
          const endName = stops.find((s) => s.id === leg.end)?.name ?? leg.end;
          return <article className="leg-card" key={leg.id + index}>
            <div className="leg-number">{index + 1}</div><div className="leg-main">
              <div className="leg-topline"><span className="vehicle-pill"><Bus size={14} />{leg.vehicle}</span><span className="time-pill"><Clock3 size={13} />{leg.minutes[0]}–{leg.minutes[1]} min</span></div>
              <h3>{startName} <ArrowRight size={15} /> {endName}</h3>
              <Instruction label="Board at" value={reverse ? leg.dropAt : leg.boardAt} />
              <Instruction label="Look for" value={reverse ? "Vehicles heading towards " + startName : leg.heading} />
              <Instruction label="Drop at" value={reverse ? leg.boardAt : leg.dropAt} />
              <div className="landmark-line"><MapPin size={13} />{leg.landmarks.join(" → ")}</div>
              <div className="leg-bottom"><div>{leg.fare ? <><strong className="fare-value">{formatNaira(leg.fare[0])}–{formatNaira(leg.fare[1])}</strong><small>Sample fare range · Not verified</small></> : <><strong className="unknown-fare">Price needed</strong><small>Help riders by reporting what you paid</small></>}</div><button className="contribute-button" onClick={() => openReport(leg.id)}><Plus size={14} /> Report fare</button></div>
            </div>
          </article>;
        })}</div>
        <div className="end-point"><span className="end-icon"><MapPin size={17} /></span><div><strong>You have arrived</strong><p>{to}</p></div></div>
        <div className="route-feedback"><strong>Did these directions help?</strong><div><button onClick={() => setNotice("Thanks for your feedback.")}>Yes, helpful</button><button onClick={() => setNotice("Thanks. We will use this feedback to improve route details.")}>Needs improvement</button></div></div>
        {notice && <div className="inline-notice"><Info size={15} />{notice}<button onClick={() => setNotice("")}><X size={14} /></button></div>}
      </section>}

      {tab === "fares" && <section className="subpage"><span className="section-kicker">COMMUNITY FARE GUIDE</span><h1>Fare <em>check.</em></h1><p className="subpage-intro">See sample coverage for individual connections. Only reviewed community reports will become public fares.</p>
        <div className="data-note"><Info size={17} /><span>These values are unverified sample data for the preview. Do not rely on them as actual fares.</span></div>
        <div className="fare-table">{legs.map((leg) => <div className="fare-row" key={leg.id}><div><strong>{stops.find((s) => s.id === leg.from)?.name} → {stops.find((s) => s.id === leg.to)?.name}</strong><small>{leg.vehicle} · {vehicleInfo[leg.vehicle]}</small></div><div className="fare-row-price">{leg.fare ? <><strong>{formatNaira(leg.fare[0])}–{formatNaira(leg.fare[1])}</strong><small>Sample only</small></> : <><strong className="unknown-fare">Price needed</strong><small>Not yet supplied</small></>}</div><button onClick={() => openReport(leg.id)} aria-label="Report fare"><Plus size={16} /></button></div>)}</div>
      </section>}

      {tab === "saved" && <section className="subpage"><span className="section-kicker">YOUR SHORTLIST</span><h1>Saved <em>trips.</em></h1><p className="subpage-intro">Your saved journeys stay on this device for quick access.</p>
        {savedTrips.length ? <div className="routes-list">{savedTrips.map((trip) => <button className="route-option" key={trip.id} onClick={() => openSaved(trip)}><div className="route-option-top"><span className="route-tag">Saved</span><span className="route-option-time"><Clock3 size={14} /> {trip.minutes[0]}–{trip.minutes[1]} min</span></div><div className="route-path">{stops.find((s) => s.id === trip.from)?.name} <i>→</i> <strong>{stops.find((s) => s.id === trip.to)?.name}</strong></div><div className="route-option-bottom"><span>{trip.legs.length} rides</span><strong>Open trip</strong><ArrowRight size={16} /></div></button>)}</div>
          : <Empty title="No saved trips yet" text="Search for a journey and tap Save trip to keep it here." action={() => setTab("trip")} />}
        <div className="local-report-count">{reports.length} fare report{reports.length === 1 ? "" : "s"} saved on this device in preview mode.</div>
      </section>}
    </main>

    <footer className="bottom-nav">
      <button className={tab === "trip" ? "selected" : ""} onClick={() => { setTab("trip"); setSelected(null); setSearched(false); }}><Compass size={19} /><span>Journey</span></button>
      <button className={tab === "fares" ? "selected" : ""} onClick={() => { setTab("fares"); setSelected(null); }}><SlidersHorizontal size={19} /><span>Fare check</span></button>
      <button className={tab === "saved" ? "selected" : ""} onClick={() => { setTab("saved"); setSelected(null); }}><Bookmark size={19} /><span>Saved</span></button>
    </footer>
    <div className="desktop-footer">Tayi helps you navigate local transport. <span>People move better when local knowledge is shared.</span></div>

    {reportFor && currentReportLeg && <div className="modal-backdrop" onClick={() => setReportFor(null)}><div className="report-modal" onClick={(event) => event.stopPropagation()}>
      <div className="modal-head"><div><span className="section-kicker">HELP IMPROVE TAYI</span><h2>Report a fare</h2></div><button onClick={() => setReportFor(null)} aria-label="Close"><X size={19} /></button></div>
      <p className="modal-route">{stops.find((s) => s.id === currentReportLeg.from)?.name} → {stops.find((s) => s.id === currentReportLeg.to)?.name}</p>
      <form onSubmit={submitReport}><label>Vehicle type</label><select value={vehicle} onChange={(e) => setVehicle(e.target.value as VehicleType)}>{Object.keys(vehicleInfo).map((item) => <option key={item} value={item}>{item}</option>)}</select>
        <label>How much did you pay? (₦)</label><input type="number" min="1" step="10" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 300" />
        <label>Extra detail (optional)</label><textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Time of day, direction or anything useful…" rows={3} />
        <div className="modal-note"><Info size={15} />Preview mode: reports are saved only in this browser until the Tayi database is connected.</div>
        <button className="primary-button full-button" type="submit"><Check size={17} /> Save fare report</button>
      </form>
    </div></div>}
  </div>;
}

function Summary({ icon, value, label }: { icon: ReactNode; value: string; label: string }) {
  return <div>{icon}<strong>{value}</strong><small>{label}</small></div>;
}
function Instruction({ label, value }: { label: string; value: string }) {
  return <div className="instruction"><strong>{label}</strong><span>{value}</span></div>;
}
function Empty({ title, text, action }: { title: string; text: string; action?: () => void }) {
  return <div className="empty-card"><Compass size={24} /><h3>{title}</h3><p>{text}</p>{action && <button className="primary-button" onClick={action}>Plan a trip</button>}</div>;
}
