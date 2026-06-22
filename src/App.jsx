import { useState, useEffect, useRef } from "react";

const SB_URL = import.meta.env.VITE_SUPABASE_URL;
const SB_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const sb = {
  get: async (table, q="") => {
    const r = await fetch(`${SB_URL}/rest/v1/${table}${q}`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }
    });
    return r.json();
  },
  post: async (table, body) => {
    const r = await fetch(`${SB_URL}/rest/v1/${table}`, {
      method: "POST",
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify(body)
    });
    return r.json();
  },
  patch: async (table, body, match) => {
    const q = Object.entries(match).map(([k,v])=>`${k}=eq.${v}`).join("&");
    const r = await fetch(`${SB_URL}/rest/v1/${table}?${q}`, {
      method: "PATCH",
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify(body)
    });
    return r.json();
  },
  del: async (table, match) => {
    const q = Object.entries(match).map(([k,v])=>`${k}=eq.${v}`).join("&");
    await fetch(`${SB_URL}/rest/v1/${table}?${q}`, {
      method: "DELETE",
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` }
    });
  }
};

// ── Pipeline stages ────────────────────────────────────────────────────────
const LISA_STAGES = [
  { key: "new_sale",         label: "New Sale",           color: "#7eb8f7" },
  { key: "in_progress",      label: "In Progress",        color: "#e8c547" },
  { key: "ready_for_lupe",   label: "Ready for Lupe",     color: "#4caf7d" },
];

const LUPE_STAGES = [
  { key: "ready_for_lupe",   label: "Incoming from Lisa",  color: "#4caf7d" },
  { key: "pre_production",   label: "Pre-Production",      color: "#ff9f43" },
  { key: "in_production",    label: "In Production",       color: "#c8392b" },
  { key: "boxing",           label: "Boxing",              color: "#a29bfe" },
  { key: "qc",               label: "QC",                  color: "#fd79a8" },
  { key: "shipping",         label: "Shipping / Pickup",   color: "#00cec9" },
];

const ALL_STAGES = [...LISA_STAGES, ...LUPE_STAGES];

const LISA_CHECKLIST = [
  { key: "deposit_received",      label: "Deposit Received" },
  { key: "artwork_received",      label: "Artwork Received" },
  { key: "artwork_to_andrew",     label: "Artwork Provided to Andrew (if required)" },
  { key: "mockup_created",        label: "Digital Mockup Created" },
  { key: "mockup_approved",       label: "Digital Mockup Approved" },
  { key: "product_ordered",       label: "Product Ordered" },
  { key: "receiving_doc",         label: "Receiving Doc Completed" },
];

const LUPE_CHECKLIST = [
  { key: "product_received",      label: "Product Received" },
  { key: "screens_burned",        label: "Screens Burned / Digitized" },
  { key: "ink_mixed",             label: "Ink Mixed / Thread Pulled" },
  { key: "product_on_carts",      label: "Product on Carts" },
];

const DEC_COLORS = {
  "Screen Printing": { bg:"#fffbe6", border:"#e8c547", dot:"#c49a2a" },
  "Embroidery":      { bg:"#f3eeff", border:"#b39ddb", dot:"#7c4dbd" },
  "DTF":             { bg:"#e8f4fd", border:"#7eb8f7", dot:"#1a6eb5" },
  "Vinyl":           { bg:"#fce8f0", border:"#f7a8c4", dot:"#c8215a" },
  "Mixed":           { bg:"#fff2e8", border:"#ffb37a", dot:"#e07b20" },
};
const SUPPLIERS = ["S&S Canada", "SanMar Canada", "Private Agent", "AS Colour", "Other"];

// ── Styles ──────────────────────────────────────────────────────────────────
const C = {
  bg: "#f5f2eb", panel: "#ffffff", card: "#ffffff",
  border: "#e0dbd4", red: "#c8392b", gold: "#c49a2a",
  text: "#0d0d0d", muted: "#999", sub: "#666",
  green: "#2a7a4b", orange: "#e07b20",
  cardBg: "#faf8f4", headerBg: "#0d0d0d",
};

const S = {
  root: { minHeight:"100vh", background:C.bg, color:C.text, fontFamily:"'DM Mono','Courier New',monospace", fontSize:13 },
  header: { background:C.headerBg, borderBottom:`3px solid ${C.red}`, padding:"12px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:100 },
  logo: { fontFamily:"'Bebas Neue',sans-serif", fontSize:22, letterSpacing:4, color:"#f5f2eb" },
  btn: (v="p") => ({ padding:"8px 16px", background:v==="p"?C.red:v==="g"?C.green:v==="y"?C.gold:"transparent", color:v==="y"?"#fff":v==="p"||v==="g"?"#fff":C.text, border:`1px solid ${v==="p"?C.red:v==="g"?C.green:v==="y"?C.gold:"#ccc"}`, borderRadius:3, cursor:"pointer", fontSize:11, letterSpacing:"1px", textTransform:"uppercase", fontFamily:"'DM Mono',monospace", fontWeight:700 }),
  inp: { background:"#fff", border:"1px solid #ddd", borderBottom:"2px solid #ccc", color:C.text, padding:"8px 12px", fontSize:13, fontFamily:"'DM Mono',monospace", width:"100%", outline:"none", borderRadius:3, boxSizing:"border-box" },
  sel: { background:"#fff", border:"1px solid #ddd", borderBottom:"2px solid #ccc", color:C.text, padding:"8px 12px", fontSize:13, fontFamily:"'DM Mono',monospace", width:"100%", outline:"none", borderRadius:3, appearance:"none", boxSizing:"border-box" },
  ta: { background:"#fff", border:"1px solid #ddd", borderBottom:"2px solid #ccc", color:C.text, padding:"8px 12px", fontSize:12, fontFamily:"'DM Mono',monospace", width:"100%", outline:"none", borderRadius:3, resize:"vertical", minHeight:70, boxSizing:"border-box" },
  lbl: { fontSize:10, letterSpacing:"1.5px", textTransform:"uppercase", color:C.muted, display:"block", marginBottom:5 },
  card: { background:C.card, border:`1px solid ${C.border}`, borderRadius:6, overflow:"hidden", marginBottom:12 },
  tag: (c) => ({ fontSize:10, letterSpacing:"1px", textTransform:"uppercase", padding:"3px 8px", background:c+"18", color:c, border:`1px solid ${c}40`, borderRadius:2, display:"inline-block" }),
  g2: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 },
  g3: { display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14, marginBottom:14 },
  divider: { height:1, background:"#e8e2d8", margin:"14px 0" },
  check: (done) => ({ width:20, height:20, border:`2px solid ${done?C.green:"#ccc"}`, borderRadius:3, background:done?C.green:"#fff", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0, transition:"all .15s" }),
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const stageInfo = (key) => ALL_STAGES.find(s=>s.key===key) || { label:key, color:"#555" };
const isLisaStage = (key) => LISA_STAGES.some(s=>s.key===key);
const isLupeStage = (key) => LUPE_STAGES.some(s=>s.key===key);

function r2j(r) {
  return {
    id: r.id,
    jobNum: r.job_num || "",
    customer: r.customer || r.client || "",
    company: r.company || "",
    product: r.product || r.garment_style || "",
    qty: r.qty || 0,
    dueDate: r.due_date || "",
    decorationType: r.decoration_type || r.type || "",
    supplier: r.supplier || "",
    styleNum: r.style_num || "",
    colour: r.garment_colour || r.colour || "",
    eta: r.eta || "",
    notes: r.notes || "",
    stage: r.stage || r.current_step || "new_sale",
    lisaChecklist: r.lisa_checklist || {},
    lupeChecklist: r.lupe_checklist || {},
    productionAssignee: r.production_assignee || "",
    priority: r.priority || 99,
    createdAt: r.created_at || "",
    files: r.files || [],
  };
}

// ── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("lisa"); // "lisa" | "lupe"
  const [selJob, setSelJob] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [toast, setToast] = useState("");
  const pollRef = useRef(null);

  useEffect(() => {
    loadJobs();
    pollRef.current = setInterval(loadJobs, 60000);
    return () => clearInterval(pollRef.current);
  }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(""),3000); };

  const loadJobs = async () => {
    try {
      const data = await sb.get("jobs", "?order=priority.asc&select=*");
      setJobs(prev => {
        const fresh = (Array.isArray(data)?data:[]).map(r2j);
        return fresh.map(fj => {
          const local = prev.find(lj=>lj.id===fj.id);
          if (!local) return fj;
          return { ...fj,
            lisaChecklist: Object.keys(fj.lisaChecklist||{}).length >= Object.keys(local.lisaChecklist||{}).length ? fj.lisaChecklist : local.lisaChecklist,
            lupeChecklist: Object.keys(fj.lupeChecklist||{}).length >= Object.keys(local.lupeChecklist||{}).length ? fj.lupeChecklist : local.lupeChecklist,
          };
        });
      });
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const saveJob = async (job) => {
    try {
      await sb.patch("jobs", {
        job_num: job.jobNum,
        customer: job.customer,
        company: job.company,
        product: job.product,
        qty: job.qty,
        due_date: job.dueDate,
        decoration_type: job.decorationType,
        supplier: job.supplier,
        style_num: job.styleNum,
        garment_colour: job.colour,
        eta: job.eta,
        notes: job.notes,
        stage: job.stage,
        lisa_checklist: job.lisaChecklist,
        lupe_checklist: job.lupeChecklist,
        production_assignee: job.productionAssignee,
        files: job.files || [],
      }, { id: job.id });
      setJobs(prev => prev.map(j=>j.id===job.id?job:j));
      if (selJob?.id===job.id) setSelJob(job);
      showToast("Saved ✓");
    } catch(e) { showToast("Save failed"); }
  };

  const addJob = async (fields) => {
    try {
      // Get next job number — fall back gracefully if settings table missing
      let nextNum = String(Date.now()).slice(-5); // fallback
      try {
        const settings = await sb.get("settings", "?key=eq.last_job_num&select=value");
        if (Array.isArray(settings) && settings[0]?.value) {
          const last = parseInt(settings[0].value) || 26421;
          nextNum = String(last + 1);
          await sb.patch("settings", { value: nextNum }, { key: "last_job_num" });
        }
      } catch(e) {
        console.warn("Could not get job counter, using fallback:", e);
      }

      const [r] = await sb.post("jobs", {
        job_num: nextNum,
        customer: fields.customer,
        company: fields.company,
        product: fields.product,
        qty: parseInt(fields.qty)||0,
        due_date: fields.dueDate,
        decoration_type: fields.decorationType,
        notes: fields.notes,
        stage: "new_sale",
        lisa_checklist: {},
        lupe_checklist: {},
        priority: jobs.length + 1,
      });
      setJobs(prev => [...prev, r2j(r)]);
      showToast(`Job #${nextNum} created ✓`);
    } catch(e) {
      console.error("addJob error:", e);
      showToast("Failed to create job: " + e.message);
    }
  };

  const deleteJob = async (id) => {
    if (!confirm("Delete this job?")) return;
    await sb.del("jobs", { id });
    setJobs(prev => prev.filter(j=>j.id!==id));
    setSelJob(null);
    showToast("Deleted");
  };

  // Filter jobs by view
  const lisaJobs = jobs.filter(j => LISA_STAGES.some(s=>s.key===j.stage));
  const lupeJobs = jobs.filter(j => LUPE_STAGES.some(s=>s.key===j.stage));

  const visibleJobs = view==="lisa" ? lisaJobs : lupeJobs;

  // Group by stage
  const stageGroups = (view==="lisa" ? LISA_STAGES : LUPE_STAGES).map(s => ({
    ...s,
    jobs: visibleJobs.filter(j=>j.stage===s.key).sort((a,b)=>a.priority-b.priority)
  }));

  return (
    <div style={S.root}>
      <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500&display=swap" rel="stylesheet"/>

      {/* Header */}
      <div style={S.header}>
        <div style={{display:"flex",alignItems:"center",gap:16}}>
          <div style={S.logo}>TRUE <span style={{color:C.red}}>NORTH</span></div>
          <div style={{fontSize:10,color:"#333",letterSpacing:2}}>PRODUCTION SCHEDULER</div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <button style={{...S.btn(view==="lisa"?"p":"o"),borderColor:view==="lisa"?C.red:"#ccc"}} onClick={()=>{setView("lisa");setSelJob(null);}}>Lisa</button>
          <button style={{...S.btn(view==="lupe"?"p":"o"),borderColor:view==="lupe"?C.red:"#ccc"}} onClick={()=>{setView("lupe");setSelJob(null);}}>Lupe / Production</button>
          <button style={S.btn("p")} onClick={()=>setShowNew(true)}>+ New Job</button>
          <button style={S.btn("o")} onClick={loadJobs}>↺</button>
        </div>
      </div>

      {loading && <div style={{textAlign:"center",padding:60,color:C.muted,letterSpacing:2}}>LOADING…</div>}

      {!loading && (
        <div style={{display:"flex",height:"calc(100vh - 55px)"}}>

          {/* Board */}
          <div style={{flex:1,overflowX:"auto",overflowY:"hidden",display:"flex",gap:0}}>
            {stageGroups.map(sg => (
              <div key={sg.key} style={{minWidth:280,maxWidth:320,flex:"0 0 300px",borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",height:"100%",background:C.bg}}>
                {/* Column header */}
                <div style={{padding:"10px 14px",borderBottom:`1px solid ${C.border}`,background:"#eee9e0",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <div style={{width:8,height:8,borderRadius:"50%",background:sg.color}}/>
                    <span style={{fontSize:11,letterSpacing:"1.5px",textTransform:"uppercase",color:C.text}}>{sg.label}</span>
                  </div>
                  <span style={{fontSize:11,color:C.muted}}>{sg.jobs.length}</span>
                </div>
                {/* Jobs */}
                <div style={{flex:1,overflowY:"auto",padding:"10px 10px"}}>
                  {sg.jobs.map(job => (
                    <JobCard key={job.id} job={job} selected={selJob?.id===job.id}
                      onClick={()=>setSelJob(selJob?.id===job.id?null:job)}
                      onDelete={deleteJob}/>
                  ))}
                  {sg.jobs.length===0&&<div style={{fontSize:10,color:"#bbb",textAlign:"center",padding:20,letterSpacing:1}}>NO JOBS</div>}
                </div>
              </div>
            ))}
          </div>

          {/* Detail panel */}
          {selJob && (
            <div style={{width:420,borderLeft:`1px solid ${C.border}`,background:"#faf8f4",overflowY:"auto",flexShrink:0}}>
              <JobDetail job={selJob} onSave={saveJob} onDelete={()=>deleteJob(selJob.id)} onClose={()=>setSelJob(null)}/>
            </div>
          )}
        </div>
      )}

      {/* New job modal */}
      {showNew && <NewJobModal onAdd={f=>{addJob(f);setShowNew(false);}} onClose={()=>setShowNew(false)}/>}

      {/* Toast */}
      {toast && (
        <div style={{position:"fixed",bottom:20,left:"50%",transform:"translateX(-50%)",background:C.green,color:"#fff",padding:"10px 20px",borderRadius:4,fontSize:11,letterSpacing:1,zIndex:9999}}>
          {toast}
        </div>
      )}
    </div>
  );
}

// ── Job Card ─────────────────────────────────────────────────────────────────
function JobCard({ job, selected, onClick, onDelete }) {
  const si = stageInfo(job.stage);
  const lisaDone = LISA_CHECKLIST.filter(c=>job.lisaChecklist[c.key]).length;
  const lupeDone = LUPE_CHECKLIST.filter(c=>job.lupeChecklist[c.key]).length;
  const isLupe = isLupeStage(job.stage);
  const total = isLupe ? LUPE_CHECKLIST.length : LISA_CHECKLIST.length;
  const done = isLupe ? lupeDone : lisaDone;
  const decKey = Object.keys(DEC_COLORS).find(k=>(job.decorationType||"").toLowerCase().includes(k.toLowerCase()));
  const dc = decKey ? DEC_COLORS[decKey] : null;
  const cardBg = selected ? "#f0ede8" : (dc?.bg || C.card);
  const cardBorder = selected ? C.red : (dc?.border || C.border);

  return (
    <div style={{background:cardBg,border:`1px solid ${cardBorder}`,borderLeft:`3px solid ${si.color}`,borderRadius:4,marginBottom:8,boxShadow:"0 1px 3px rgba(0,0,0,.06)",overflow:"hidden"}}>
      <div onClick={onClick} style={{padding:"10px 12px",cursor:"pointer",transition:"all .15s"}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:6}}>
          <div>
            <div style={{fontSize:11,color:C.gold,fontWeight:700,letterSpacing:1}}>#{job.jobNum}</div>
            <div style={{fontSize:13,fontWeight:700,color:C.text,marginTop:2}}>{job.customer}</div>
            {job.company&&<div style={{fontSize:11,color:C.sub}}>{job.company}</div>}
          </div>
          <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
            {job.dueDate&&<div style={{fontSize:10,color:C.muted}}>{new Date(job.dueDate+"T00:00:00").toLocaleDateString("en-CA",{month:"short",day:"numeric"})}</div>}
            {dc&&<div style={{fontSize:9,letterSpacing:"1px",textTransform:"uppercase",padding:"2px 7px",background:dc.bg,color:dc.dot,border:`1px solid ${dc.border}`,borderRadius:2,fontWeight:700}}>{job.decorationType}</div>}
          </div>
        </div>
        <div style={{fontSize:11,color:C.sub,marginBottom:6}}>{job.product}{job.qty?` · ${job.qty} units`:""}</div>
        {total>0&&(
          <div style={{marginTop:8}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
              <span style={{fontSize:9,color:C.muted,letterSpacing:1}}>{isLupe?"PRE-PROD":"CHECKLIST"}</span>
              <span style={{fontSize:9,color:done===total?C.green:C.muted}}>{done}/{total}</span>
            </div>
            <div style={{height:3,background:"#e0dbd4",borderRadius:2}}>
              <div style={{height:"100%",width:`${(done/total)*100}%`,background:done===total?C.green:C.gold,borderRadius:2,transition:"width .3s"}}/>
            </div>
          </div>
        )}
      </div>
      {/* Quick action bar */}
      <div style={{borderTop:`1px solid ${cardBorder}`,display:"flex"}}>
        <button onClick={onClick} style={{flex:1,padding:"5px 8px",background:"transparent",border:"none",color:C.muted,fontSize:10,letterSpacing:"1px",cursor:"pointer",textTransform:"uppercase",fontFamily:"'DM Mono',monospace"}}>
          {selected ? "▲ Close" : "▼ Open"}
        </button>
        <button
          onClick={e=>{e.stopPropagation();if(window.confirm(`Delete job #${job.jobNum} — ${job.customer}?`))onDelete(job.id);}}
          style={{padding:"5px 12px",background:"transparent",border:"none",borderLeft:`1px solid ${cardBorder}`,color:"#c8392b",fontSize:10,letterSpacing:"1px",cursor:"pointer",textTransform:"uppercase",fontFamily:"'DM Mono',monospace"}}>
          ✕ Delete
        </button>
      </div>
    </div>
  );
}

// ── Field component — must be OUTSIDE JobDetail to avoid remount on every keystroke
function Field({ label, k, type="text", opts, value, onChange }) {
  return (
    <div style={{marginBottom:12}}>
      <label style={S.lbl}>{label}</label>
      {opts ? (
        <select style={S.sel} value={value||""} onChange={e=>onChange(k,e.target.value)}>
          <option value="">— Select —</option>
          {opts.map(o=><option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input style={S.inp} type={type} value={value||""} onChange={e=>onChange(k,e.target.value)}/>
      )}
    </div>
  );
}

// ── File Upload component
function FileAttachments({ jobId, files, onFilesChanged }) {
  const [uploading, setUploading] = useState(false);
  const SB_URL = import.meta.env.VITE_SUPABASE_URL;
  const SB_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const uploadFile = async (file) => {
    setUploading(true);
    try {
      const path = `jobs/${jobId}/${Date.now()}_${file.name}`;
      const res = await fetch(`${SB_URL}/storage/v1/object/job-files/${path}`, {
        method: "POST",
        headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": file.type||"application/octet-stream" },
        body: file,
      });
      if (!res.ok) throw new Error("Upload failed");
      const newFiles = [...(files||[]), { name: file.name, path, size: file.size }];
      onFilesChanged(newFiles);
    } catch(e) { alert("Upload failed: "+e.message); }
    setUploading(false);
  };

  const deleteFile = async (path, idx) => {
    if (!confirm("Remove this file?")) return;
    try {
      await fetch(`${SB_URL}/storage/v1/object/job-files/${path}`, {
        method: "DELETE",
        headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
      });
    } catch(e) {}
    const newFiles = (files||[]).filter((_,i)=>i!==idx);
    onFilesChanged(newFiles);
  };

  const getUrl = (path) => `${SB_URL}/storage/v1/object/public/job-files/${path}`;

  return (
    <div>
      <div style={{fontSize:10,letterSpacing:"2px",color:C.red,textTransform:"uppercase",marginBottom:10,fontWeight:700}}>Attachments</div>
      {/* Existing files */}
      {(files||[]).map((f,i)=>(
        <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:"#faf8f4",border:`1px solid ${C.border}`,borderRadius:4,marginBottom:6}}>
          <span style={{fontSize:11,color:"#7eb8f7"}}>📎</span>
          <a href={getUrl(f.path)} target="_blank" rel="noopener noreferrer"
            style={{flex:1,fontSize:12,color:C.text,textDecoration:"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
            {f.name}
          </a>
          <span style={{fontSize:10,color:C.muted,flexShrink:0}}>{f.size ? Math.round(f.size/1024)+"KB" : ""}</span>
          <button onClick={()=>deleteFile(f.path,i)}
            style={{background:"none",border:"none",color:C.red,cursor:"pointer",fontSize:13,padding:"0 2px",flexShrink:0}}>✕</button>
        </div>
      ))}
      {/* Upload zone */}
      <label style={{display:"flex",alignItems:"center",gap:8,padding:"10px",border:`2px dashed ${C.border}`,borderRadius:4,cursor:"pointer",background:uploading?"#f5f2eb":"transparent"}}>
        <input type="file" multiple style={{display:"none"}}
          onChange={e=>Array.from(e.target.files).forEach(uploadFile)}/>
        <span style={{fontSize:12,color:C.muted,letterSpacing:"1px"}}>{uploading?"Uploading…":"+ Attach files (drag & drop or click)"}</span>
      </label>
    </div>
  );
}

// ── Job Detail Panel ─────────────────────────────────────────────────────────
function JobDetail({ job, onSave, onDelete, onClose }) {
  const [f, setF] = useState({...job});
  const [dirty, setDirty] = useState(false);

  useEffect(()=>{ setF({...job}); setDirty(false); },[job.id]);

  const update = (k,v) => { setF(x=>({...x,[k]:v})); setDirty(true); };

  const toggleLisa = (key) => {
    const updated = {...f, lisaChecklist:{...f.lisaChecklist,[key]:!f.lisaChecklist[key]}};
    setF(updated); setDirty(false); onSave(updated);
  };

  const toggleLupe = (key) => {
    const updated = {...f, lupeChecklist:{...f.lupeChecklist,[key]:!f.lupeChecklist[key]}};
    setF(updated); setDirty(false); onSave(updated);
  };

  const handleSave = () => { onSave(f); setDirty(false); };

  const handleFilesChanged = (newFiles) => {
    const updated = {...f, files: newFiles};
    setF(updated); onSave(updated);
  };

  const lisaAllDone = LISA_CHECKLIST.every(c=>f.lisaChecklist[c.key]);
  const lupeAllDone = LUPE_CHECKLIST.every(c=>f.lupeChecklist[c.key]);

  const advanceStage = (toStage) => {
    const updated = {...f, stage:toStage};
    setF(updated); setDirty(false); onSave(updated);
  };

  const si = stageInfo(f.stage);

  return (
    <div>
      {/* Detail header */}
      <div style={{padding:"12px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",background:"#0d0d0d",position:"sticky",top:0,zIndex:10}}>
        <div>
          <div style={{fontSize:11,color:C.gold,letterSpacing:1}}>#{f.jobNum}</div>
          <div style={{fontSize:15,fontWeight:700,color:"#f5f2eb"}}>{f.customer}</div>
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          <span style={S.tag(si.color)}>{si.label}</span>
          <button style={{...S.btn("o"),padding:"4px 10px"}} onClick={onClose}>✕</button>
        </div>
      </div>

      <div style={{padding:"16px"}}>

        {/* Stage selector */}
        <div style={{marginBottom:16}}>
          <label style={S.lbl}>Stage</label>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {ALL_STAGES.map(s=>(
              <button key={s.key}
                style={{padding:"5px 10px",background:f.stage===s.key?s.color+"33":"transparent",color:f.stage===s.key?s.color:C.muted,border:`1px solid ${f.stage===s.key?s.color:"#ccc"}`,borderRadius:3,cursor:"pointer",fontSize:10,letterSpacing:"1px",textTransform:"uppercase",fontFamily:"'DM Mono',monospace"}}
                onClick={()=>update("stage",s.key)}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div style={S.divider}/>

        {/* Job Info */}
        <div style={{fontSize:10,letterSpacing:"2px",color:C.red,textTransform:"uppercase",marginBottom:12,fontWeight:700}}>Job Info</div>
        <div style={S.g2}>
          <Field label="Customer Name" k="customer" value={f.customer} onChange={update}/>
          <Field label="Company" k="company" value={f.company} onChange={update}/>
        </div>
        <div style={S.g3}>
          <Field label="Job #" k="jobNum" value={f.jobNum} onChange={update}/>
          <Field label="Quantity" k="qty" type="number" value={f.qty} onChange={update}/>
          <Field label="Due Date" k="dueDate" type="date" value={f.dueDate} onChange={update}/>
        </div>
        <Field label="Product / Garment" k="product" value={f.product} onChange={update}/>
        <Field label="Decoration Type" k="decorationType" opts={["Screen Printing","Embroidery","DTF","Vinyl","Mixed"]} value={f.decorationType} onChange={update}/>

        <div style={S.divider}/>

        {/* Product Details */}
        <div style={{fontSize:10,letterSpacing:"2px",color:C.red,textTransform:"uppercase",marginBottom:12,fontWeight:700}}>Product Details</div>
        <div style={S.g2}>
          <Field label="Supplier" k="supplier" opts={SUPPLIERS} value={f.supplier} onChange={update}/>
          <Field label="Style #" k="styleNum" value={f.styleNum} onChange={update}/>
        </div>
        <div style={S.g2}>
          <Field label="Colour" k="colour" value={f.colour} onChange={update}/>
          <Field label="ETA" k="eta" type="date" value={f.eta} onChange={update}/>
        </div>

        <div style={S.divider}/>

        {/* Notes */}
        <div style={{marginBottom:16}}>
          <label style={S.lbl}>Notes</label>
          <textarea style={S.ta} value={f.notes||""} onChange={e=>update("notes",e.target.value)}/>
        </div>

        <div style={S.divider}/>

        {/* File attachments */}
        <FileAttachments jobId={job.id} files={f.files||[]} onFilesChanged={handleFilesChanged}/>

        <div style={S.divider}/>

        {/* Lisa's Checklist */}
        <div style={{fontSize:10,letterSpacing:"2px",color:C.red,textTransform:"uppercase",marginBottom:12,fontWeight:700}}>Lisa's Checklist</div>
        {LISA_CHECKLIST.map(item=>{
          const done = f.lisaChecklist[item.key];
          return (
            <div key={item.key} onClick={()=>toggleLisa(item.key)}
              style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",marginBottom:6,background:done?"#edf7f1":"#faf8f4",border:`1px solid ${done?C.green+"66":"#ddd"}`,borderRadius:4,cursor:"pointer",userSelect:"none"}}>
              <div style={S.check(done)}>{done&&<span style={{color:"#fff",fontSize:12,lineHeight:1}}>✓</span>}</div>
              <span style={{fontSize:13,color:done?C.green:C.text}}>{item.label}</span>
            </div>
          );
        })}

        {lisaAllDone && LISA_STAGES.some(s=>s.key===f.stage) && (
          <button style={{...S.btn("g"),width:"100%",padding:"12px",marginTop:12,fontSize:12,letterSpacing:2}}
            onClick={()=>advanceStage("ready_for_lupe")}>
            ✓ All Done — Send to Lupe →
          </button>
        )}

        {/* Lupe's Checklist */}
        {isLupeStage(f.stage) && (
          <>
            <div style={S.divider}/>
            {f.stage==="ready_for_lupe" ? (
              <>
                <div style={{fontSize:10,letterSpacing:"2px",color:C.green,textTransform:"uppercase",marginBottom:12,fontWeight:700}}>✓ Ready from Lisa</div>
                <div style={{fontSize:12,color:C.sub,marginBottom:16,fontFamily:"'DM Sans',sans-serif"}}>Lisa has completed all checklist items. Start pre-production when ready.</div>
                <button style={{...S.btn("p"),width:"100%",padding:"12px",fontSize:12,letterSpacing:2}}
                  onClick={()=>advanceStage("pre_production")}>
                  → Start Pre-Production
                </button>
                <button style={{...S.btn("o"),width:"100%",padding:"10px",marginTop:8,fontSize:11,letterSpacing:1}}
                  onClick={()=>advanceStage("in_progress")}>
                  ← Return to Lisa
                </button>
              </>
            ) : (
              <>
                <div style={{fontSize:10,letterSpacing:"2px",color:C.orange,textTransform:"uppercase",marginBottom:12,fontWeight:700}}>Lupe's Pre-Production</div>
            {LUPE_CHECKLIST.map(item=>{
              const done = f.lupeChecklist[item.key];
              return (
                <div key={item.key} onClick={()=>toggleLupe(item.key)}
                  style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",marginBottom:6,background:done?"#fff4eb":"#faf8f4",border:`1px solid ${done?C.orange+"66":"#ddd"}`,borderRadius:4,cursor:"pointer",userSelect:"none"}}>
                  <div style={{...S.check(done),borderColor:done?C.orange:"#ccc",background:done?C.orange:"#fff"}}>
                    {done&&<span style={{color:"#fff",fontSize:12,lineHeight:1}}>✓</span>}
                  </div>
                  <span style={{fontSize:13,color:done?C.orange:C.text}}>{item.label}</span>
                </div>
              );
            })}

            {f.stage==="pre_production"&&(
              <div style={{marginTop:12}}>
                <label style={S.lbl}>Assign to Production</label>
                <select style={S.sel} value={f.productionAssignee||""} onChange={e=>update("productionAssignee",e.target.value)}>
                  <option value="">— Select —</option>
                  {PRODUCTION_TYPES.map(o=><option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            )}

            {lupeAllDone && f.stage==="pre_production" && f.productionAssignee && (
              <button style={{...S.btn("p"),width:"100%",padding:"12px",marginTop:12,fontSize:12,letterSpacing:2}}
                onClick={()=>advanceStage("in_production")}>
                → Send to Production ({f.productionAssignee})
              </button>
            )}
            {f.stage==="pre_production" && (
              <button style={{...S.btn("o"),width:"100%",padding:"10px",marginTop:8,fontSize:11,letterSpacing:1}}
                onClick={()=>advanceStage("in_progress")}>
                ← Return to Lisa
              </button>
            )}
            {f.stage==="in_production"&&<button style={{...S.btn("o"),width:"100%",padding:"12px",marginTop:12,fontSize:12,letterSpacing:2}} onClick={()=>advanceStage("boxing")}>→ Move to Boxing</button>}
            {f.stage==="boxing"&&<button style={{...S.btn("o"),width:"100%",padding:"12px",marginTop:12,fontSize:12,letterSpacing:2}} onClick={()=>advanceStage("qc")}>→ Move to QC</button>}
            {f.stage==="qc"&&<button style={{...S.btn("g"),width:"100%",padding:"12px",marginTop:12,fontSize:12,letterSpacing:2}} onClick={()=>advanceStage("shipping")}>✓ QC Passed — Move to Shipping</button>}
            </>
            )}
          </>
        )}

        <div style={S.divider}/>
        <div style={{display:"flex",gap:8}}>
          <button style={{...S.btn(dirty?"p":"o"),flex:1,padding:"12px",fontSize:12,letterSpacing:2}} onClick={handleSave}>
            {dirty ? "● Save Changes" : "✓ Saved"}
          </button>
          <button style={{...S.btn("o"),color:"#c8392b",borderColor:"#c8392b33",padding:"10px 16px"}} onClick={onDelete}>Delete</button>
        </div>
      </div>
    </div>
  );
}

// ── New Job Modal ─────────────────────────────────────────────────────────────
function NewJobModal({ onAdd, onClose }) {
  const [f, setF] = useState({ customer:"", company:"", product:"", qty:"", dueDate:"", decorationType:"", notes:"" });
  const sf = (k,v) => setF(x=>({...x,[k]:v}));
  const valid = f.customer && f.product;

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.8)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:20}}>
      <div style={{background:C.panel,border:`1px solid ${C.border}`,borderRadius:6,width:"100%",maxWidth:520,padding:24,maxHeight:"90vh",overflowY:"auto"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:20,letterSpacing:4,color:C.text}}>NEW JOB</div>
          <button style={S.btn("o")} onClick={onClose}>✕</button>
        </div>
        <div style={S.g2}>
          <div><label style={S.lbl}>Customer Name *</label><input style={S.inp} value={f.customer} onChange={e=>sf("customer",e.target.value)} placeholder="First & Last"/></div>
          <div><label style={S.lbl}>Company</label><input style={S.inp} value={f.company} onChange={e=>sf("company",e.target.value)} placeholder="Company name"/></div>
        </div>
        <div><label style={S.lbl}>Product / Garment *</label><input style={S.inp} value={f.product} onChange={e=>sf("product",e.target.value)} placeholder="e.g. Comfort Colors 1717 Tee"/></div>
        <div style={{height:12}}/>
        <div style={S.g3}>
          <div><label style={S.lbl}>Quantity</label><input style={S.inp} type="number" value={f.qty} onChange={e=>sf("qty",e.target.value)}/></div>
          <div><label style={S.lbl}>Due Date</label><input style={S.inp} type="date" value={f.dueDate} onChange={e=>sf("dueDate",e.target.value)}/></div>
          <div>
            <label style={S.lbl}>Decoration</label>
            <select style={S.sel} value={f.decorationType} onChange={e=>sf("decorationType",e.target.value)}>
              <option value="">— Select —</option>
              {["Screen Printing","Embroidery","DTF","Vinyl","Mixed"].map(o=><option key={o}>{o}</option>)}
            </select>
          </div>
        </div>
        <div style={{height:12}}/>
        <div><label style={S.lbl}>Notes</label><textarea style={S.ta} value={f.notes} onChange={e=>sf("notes",e.target.value)} rows={3}/></div>
        <div style={{display:"flex",gap:10,marginTop:20}}>
          <button style={{...S.btn("p"),flex:1,padding:12,fontSize:12,letterSpacing:2}} disabled={!valid} onClick={()=>valid&&onAdd(f)}>Create Job →</button>
          <button style={S.btn("o")} onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
