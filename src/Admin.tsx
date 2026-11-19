import { useEffect, useState, type FormEvent } from "react";
import { createClient } from "@supabase/supabase-js";
import { ArrowLeft, Check, CircleAlert, Edit3, LogOut, MapPin, Plus, RefreshCw, ShieldCheck, Trash2, X } from "lucide-react";
import "./admin.css";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
const db = url && key ? createClient(url, key) : null;

type Section = "overview" | "places" | "stops" | "links" | "legs" | "fares" | "reports";
const sections: { id: Section; label: string; table?: string }[] = [
  { id: "overview", label: "Overview" }, { id: "places", label: "Places", table: "places" },
  { id: "stops", label: "Stops", table: "stops" }, { id: "links", label: "Place ↔ stops", table: "place_stops" },
  { id: "legs", label: "Route legs", table: "legs" }, { id: "fares", label: "Fares", table: "fares" },
  { id: "reports", label: "Community reports", table: "community_reports" }
];

export default function Admin() {
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [section, setSection] = useState<Section>("overview");
  const [rows, setRows] = useState<any[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [places, setPlaces] = useState<any[]>([]);
  const [stops, setStops] = useState<any[]>([]);
  const [legs, setLegs] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);

  useEffect(() => {
    if (!db) return;
    db.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = db.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => { if (session) load(); }, [session, section]);

  async function load() {
    if (!db) return;
    setBusy(true); setMessage("");
    try {
      const [p, s, l, v] = await Promise.all([
        db.from("places").select("id,name,is_approved").order("name"),
        db.from("stops").select("id,name,is_approved").order("name"),
        db.from("legs").select("id,heading,from_stop_id,to_stop_id").order("created_at", { ascending: false }),
        db.from("vehicle_types").select("id,name,min_capacity,max_capacity").order("sort_order")
      ]);
      if (p.error) throw p.error; if (s.error) throw s.error; if (l.error) throw l.error; if (v.error) throw v.error;
      setPlaces(p.data || []); setStops(s.data || []); setLegs(l.data || []); setVehicles(v.data || []);
      if (section === "overview") {
        const names = ["places", "stops", "place_stops", "legs", "fares", "community_reports"];
        const result = await Promise.all(names.map(name => db!.from(name).select("*", { count: "exact", head: true })));
        setCounts(Object.fromEntries(names.map((name, i) => [name, result[i].count || 0])));
        setRows([]);
      } else {
        const table = sections.find(s => s.id === section)?.table;
        if (!table) return;
        const result = await db.from(table).select("*").order("created_at", { ascending: false }).limit(100);
        if (result.error) throw result.error;
        setRows(result.data || []);
      }
    } catch (error: any) {
      setMessage(error.message || "Could not load records.");
    } finally { setBusy(false); }
  }

  async function signIn(event: FormEvent) {
    event.preventDefault(); if (!db) return;
    setBusy(true); setMessage("");
    const { error } = await db.auth.signInWithPassword({ email, password });
    if (error) setMessage(error.message);
    setBusy(false);
  }

  function startNew() { setEditingId(null); setForm({}); setMessage(""); }
  async function startEdit(row: any) {
    if (section === "links" || section === "reports") return;
    setEditingId(row.id);
    const next: Record<string, string> = {};
    Object.keys(row).forEach(key => {
      const value = row[key];
      next[key] = Array.isArray(value) ? value.join(", ") : value == null ? "" : String(value);
    });
    if (section === "places" && db) {
      const { data } = await db.from("place_aliases").select("alias").eq("place_id", row.id);
      next.aliases = (data || []).map(x => x.alias).join(", ");
    }
    setForm(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function save(event: FormEvent) {
    event.preventDefault(); if (!db) return;
    setBusy(true); setMessage("");
    try {
      const table = sections.find(s => s.id === section)?.table;
      if (!table || section === "reports") return;
      const payload: Record<string, any> = { ...form };
      delete payload.id; delete payload.created_at; delete payload.aliases;
      const numeric = section === "places" ? ["latitude", "longitude"] :
        section === "stops" ? ["latitude", "longitude"] :
        section === "links" ? ["walking_minutes"] :
        section === "legs" ? ["min_minutes", "max_minutes", "distance_km"] :
        ["min_amount", "max_amount"];
      for (const field of numeric) payload[field] = payload[field] === "" || payload[field] == null ? null : Number(payload[field]);
      if (section === "places" || section === "stops" || section === "legs" || section === "fares") payload.is_approved = true;
      if (section === "legs") payload.landmarks = form.landmarks ? form.landmarks.split(",").map(x => x.trim()).filter(Boolean) : [];
      let recordId = editingId;
      if (editingId) {
        const { error } = await db.from(table).update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { data, error } = await db.from(table).insert(payload).select("id").single();
        if (error) throw error;
        recordId = data.id;
      }
      if (section === "places" && recordId) {
        const aliases = (form.aliases || "").split(",").map(x => x.trim()).filter(Boolean);
        const { error: deleteError } = await db.from("place_aliases").delete().eq("place_id", recordId);
        if (deleteError) throw deleteError;
        if (aliases.length) {
          const { error: insertError } = await db.from("place_aliases").insert(aliases.map(alias => ({ place_id: recordId, alias })));
          if (insertError) throw insertError;
        }
      }
      setForm({}); setEditingId(null); setMessage(editingId ? "Changes saved." : "Record added and published.");
      await load();
    } catch (error: any) { setMessage(error.message || "Could not save record."); }
    finally { setBusy(false); }
  }

  async function remove(row: any) {
    if (!db || !confirm("Delete this record? Related data may also be removed.")) return;
    const table = sections.find(s => s.id === section)?.table;
    if (!table) return;
    const query = db.from(table).delete();
    const result = section === "links"
      ? await query.eq("place_id", row.place_id).eq("stop_id", row.stop_id)
      : await query.eq("id", row.id);
    if (result.error) setMessage(result.error.message);
    else { setMessage("Record deleted."); await load(); }
  }

  async function review(id: string, status: "approved" | "rejected") {
    if (!db) return;
    const { error } = await db.from("community_reports").update({ status }).eq("id", id);
    if (error) setMessage(error.message); else { setMessage("Report " + status + "."); await load(); }
  }

  function set(field: string, value: string) { setForm(current => ({ ...current, [field]: value })); }
  const input = (field: string, label: string, required = false, type = "text") =>
    <label key={field}>{label}<input type={type} value={form[field] || ""} required={required}
      onChange={event => set(field, event.target.value)} /></label>;
  const select = (field: string, label: string, options: { id: string; label: string }[], required = true) =>
    <label key={field}>{label}<select value={form[field] || ""} required={required} onChange={event => set(field, event.target.value)}>
      <option value="">Choose {label.toLowerCase()}</option>{options.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
    </select></label>;

  function formFields() {
    if (section === "places") return <>
      {input("name", "Place name", true)}
      <label>Category<select value={form.category || "other"} onChange={e => set("category", e.target.value)}>
        {["market", "school", "hospital", "transport_hub", "mall", "hotel", "other"].map(x => <option key={x}>{x}</option>)}</select></label>
      {input("area", "Area / neighbourhood")}{input("aliases", "Aliases (comma separated)")}
      {input("latitude", "Latitude", false, "number")}{input("longitude", "Longitude", false, "number")}
    </>;
    if (section === "stops") return <>
      {input("name", "Stop name", true)}{input("area", "Area / neighbourhood")}
      {input("boarding_hint", "Boarding hint")}
      {input("latitude", "Latitude", false, "number")}{input("longitude", "Longitude", false, "number")}
    </>;
    if (section === "links") return <>
      {select("place_id", "Place", places.map(x => ({ id: x.id, label: x.name })))}
      {select("stop_id", "Nearest stop", stops.map(x => ({ id: x.id, label: x.name })))}
      {input("walking_minutes", "Walking minutes", false, "number")}
    </>;
    if (section === "legs") return <>
      {select("from_stop_id", "From stop", stops.map(x => ({ id: x.id, label: x.name })))}
      {select("to_stop_id", "To stop", stops.map(x => ({ id: x.id, label: x.name })))}
      {select("vehicle_type_id", "Vehicle type", vehicles.map(x => ({ id: x.id, label: x.name + " (" + x.min_capacity + "–" + x.max_capacity + ")" })))}
      {input("heading", "Vehicle destination sign / heading")}
      {input("min_minutes", "Minimum minutes", false, "number")}{input("max_minutes", "Maximum minutes", false, "number")}
      {input("distance_km", "Distance (km)", false, "number")}{input("landmarks", "Landmarks (comma separated)")}
    </>;
    if (section === "fares") return <>
      {select("leg_id", "Route leg", legs.map(x => ({ id: x.id, label: (stops.find(s => s.id === x.from_stop_id)?.name || "Stop") + " → " + (stops.find(s => s.id === x.to_stop_id)?.name || "Stop") })))}
      {select("vehicle_type_id", "Vehicle type", vehicles.map(x => ({ id: x.id, label: x.name })))}
      <label>Fare type<select value={form.fare_type || "shared_seat"} onChange={e => set("fare_type", e.target.value)}>
        <option value="shared_seat">Shared seat</option><option value="charter">Charter</option></select></label>
      {input("min_amount", "Minimum fare (₦)", true, "number")}{input("max_amount", "Maximum fare (₦)", true, "number")}
    </>;
    return null;
  }

  if (!db) return <div className="admin-wrap"><div className="admin-login"><ShieldCheck /><h1>Admin setup needed</h1><p>Supabase URL and publishable key are not configured for this deployment.</p></div></div>;
  if (!session) return <div className="admin-wrap"><form className="admin-login" onSubmit={signIn}>
    <a href="/" className="admin-back"><ArrowLeft size={16} /> Back to Tayi</a><div className="admin-logo"><ShieldCheck /></div>
    <span className="admin-kicker">TAYI CONTROL ROOM</span><h1>Admin sign in</h1><p>Sign in with the administrator account created in Supabase.</p>
    <label>Email address</label><input type="email" required value={email} onChange={e => setEmail(e.target.value)} />
    <label>Password</label><input type="password" required value={password} onChange={e => setPassword(e.target.value)} />
    {message && <div className="admin-message error">{message}</div>}<button className="admin-primary" disabled={busy}>{busy ? "Signing in…" : "Sign in securely"}</button>
  </form></div>;

  return <div className="admin-shell">
    <aside className="admin-sidebar"><a href="/" className="admin-brand"><span>t</span> tayi <small>ADMIN</small></a>
      <div className="admin-nav-label">MANAGE</div>
      {sections.map(item => <button key={item.id} className={section === item.id ? "active" : ""} onClick={() => { setSection(item.id); startNew(); }}>
        {item.id === "overview" ? <ShieldCheck /> : <MapPin />}{item.label}
      </button>)}
      <div className="admin-side-bottom"><button onClick={() => db.auth.signOut()}><LogOut /> Sign out</button><a href="/">← View rider app</a></div>
    </aside>
    <main className="admin-main">
      <header className="admin-top"><div><span className="admin-kicker">TAYI / ADMIN</span><h1>{sections.find(s => s.id === section)?.label}</h1></div>
        <button className="admin-refresh" onClick={load}><RefreshCw size={16} /> Refresh</button></header>
      {message && <div className="admin-message"><CircleAlert size={16} />{message}<button onClick={() => setMessage("")}>×</button></div>}
      {section === "overview" ? <>
        <div className="admin-welcome"><div><span>GOOD TO SEE YOU</span><h2>Keep local knowledge moving.</h2><p>Manage verified places, stops, route connections, fares and rider submissions.</p></div><MapPin size={42} /></div>
        <div className="admin-stats">{[["Places","places"],["Stops","stops"],["Place–stop links","place_stops"],["Route legs","legs"],["Fares","fares"],["Reports","community_reports"]].map(([label,key]) =>
          <div key={key}><span>{label}</span><strong>{counts[key] ?? "—"}</strong></div>)}</div>
        <div className="admin-tip"><Check /><div><strong>Keep information trustworthy</strong><p>Records added here are marked approved. Only add routes and fares you have checked in the real world.</p></div></div>
      </> : <>
        {section !== "reports" && <section className="admin-panel">
          <div className="admin-panel-head"><div><h2>{editingId ? "Edit record" : "Add " + (section === "legs" ? "route leg" : section === "links" ? "place–stop connection" : section.slice(0, -1))}</h2>
            <p>Saved directly to the Tayi database. Approved records are visible to riders when the app is connected to live data.</p></div></div>
          <form className="admin-form" onSubmit={save}>{formFields()}
            <div className="admin-form-actions"><button className="admin-primary" disabled={busy}><Plus size={16} />{busy ? "Saving…" : editingId ? "Save changes" : "Add record"}</button>
              {editingId && <button type="button" className="admin-cancel" onClick={startNew}><X size={14} /> Cancel</button>}</div>
          </form>
        </section>}
        <section className="admin-panel"><div className="admin-panel-head"><div><h2>{section === "reports" ? "Submitted reports" : "Existing records"}</h2><p>Showing up to 100 most recent records.</p></div><span className="admin-count">{rows.length} records</span></div>
          {busy ? <p className="admin-muted">Loading…</p> : rows.length === 0 ? <p className="admin-muted">No records found yet.</p> :
            <div className="admin-records">{rows.map(row => {
              const label = section === "places" || section === "stops" ? row.name :
                section === "legs" ? (stops.find(s => s.id === row.from_stop_id)?.name || "Unknown") + " → " + (stops.find(s => s.id === row.to_stop_id)?.name || "Unknown") :
                section === "fares" ? "₦" + row.min_amount + "–₦" + row.max_amount :
                section === "links" ? (places.find(p => p.id === row.place_id)?.name || "Place") + " ↔ " + (stops.find(s => s.id === row.stop_id)?.name || "Stop") :
                row.report_type + " report";
              const identity = row.id || row.place_id + ":" + row.stop_id;
              return <article className="admin-record" key={identity}><div><strong>{label}</strong>
                <small>{section === "reports" ? row.status + " · " + JSON.stringify(row.payload || {}) : section === "legs" ? (vehicles.find(v => v.id === row.vehicle_type_id)?.name || "") + (row.is_approved ? " · Approved" : " · Draft") : row.is_approved === false ? "Draft" : "Approved"}</small>
              </div>{section === "reports" ? <div className="admin-actions">{row.status === "pending" && <><button onClick={() => review(row.id, "approved")}><Check size={14} /> Approve</button><button onClick={() => review(row.id, "rejected")}>Reject</button></>}</div> :
                <div className="admin-actions">{section !== "links" && <button onClick={() => startEdit(row)}><Edit3 size={14} /> Edit</button>}<button className="admin-delete" onClick={() => remove(row)}><Trash2 size={14} /> Delete</button></div>}</article>;
            })}</div>}
        </section>
      </>}
    </main>
  </div>;
}
