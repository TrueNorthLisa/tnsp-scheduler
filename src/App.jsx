import { useState, useEffect, useRef } from "react";

// ── Workflow definitions ─────────────────────────────────────────────────────
const WORKFLOW = {
  screenprint_new: [
    { id: "quote",        label: "Quote Sent",         icon: "📋", owner: "lisa" },
    { id: "approved",     label: "Estimate Approved",  icon: "✅", owner: "lisa" },
    { id: "deposit",      label: "Deposit Received",   icon: "💰", owner: "lisa" },
    { id: "blanks",       label: "Blanks Ordered",     icon: "📦", owner: "lisa" },
    { id: "seps",         label: "Seps / Burn Folder", icon: "🎨", owner: "lisa" },
    { id: "burn",         label: "Screens Burned",     icon: "🔥", owner: "lead_printer" },
    { id: "presscheck",   label: "Press Check",        icon: "👁",  owner: "lead_printer" },
    { id: "production",   label: "Full Production",    icon: "⚙️", owner: "lead_printer" },
    { id: "shipping",     label: "Shipped",            icon: "🚚", owner: "brother" },
  ],
  screenprint_reprint: [
    { id: "quote",        label: "Quote Sent",         icon: "📋", owner: "lisa" },
    { id: "approved",     label: "Estimate Approved",  icon: "✅", owner: "lisa" },
    { id: "deposit",      label: "Deposit Received",   icon: "💰", owner: "lisa" },
    { id: "blanks",       label: "Blanks Ordered",     icon: "📦", owner: "lisa" },
    { id: "production",   label: "Full Production",    icon: "⚙️", owner: "lead_printer" },
    { id: "shipping",     label: "Shipped",            icon: "🚚", owner: "brother" },
  ],
  embroidery: [
    { id: "quote",        label: "Quote Sent",         icon: "📋", owner: "lisa" },
    { id: "approved",     label: "Estimate Approved",  icon: "✅", owner: "lisa" },
    { id: "deposit",      label: "Deposit Received",   icon: "💰", owner: "lisa" },
    { id: "blanks",       label: "Blanks Ordered",     icon: "📦", owner: "lisa" },
    { id: "digitizing",   label: "Sent to Harrison",   icon: "🧵", owner: "lisa" },
    { id: "sewout",       label: "Sew Out",            icon: "🪡", owner: "lead_printer" },
    { id: "production",   label: "Full Production",    icon: "⚙️", owner: "lead_printer" },
    { id: "shipping",     label: "Shipped",            icon: "🚚", owner: "brother" },
  ],
};

const JOB_TYPES = [
  { value: "screenprint_new",    label: "Screen Print – New" },
  { value: "screenprint_reprint",label: "Screen Print – Reprint" },
  { value: "embroidery",         label: "Embroidery" },
];

const ROLES = [
  { id: "lisa",           label: "Lisa",            color: "#e8c547", desc: "Office / Remote" },
  { id: "brother",        label: "Shop Manager",    color: "#4ec9a0", desc: "On-Site Manager" },
  { id: "lead_printer",   label: "Lead Printer",    color: "#7eb8f7", desc: "Floor" },
  { id: "press_assist",   label: "Press Assistant", color: "#f79e7e", desc: "Floor" },
];

// ── Supabase client ───────────────────────────────────────────────────────────
const SUPABASE_URL  = "https://piiyxripiynzoabazhjd.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpaXl4cmlwaXluem9hYmF6aGpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0NTg3NzYsImV4cCI6MjA5NTAzNDc3Nn0.uizOdL2vseQwVjpQgFONlDkEleHQosGZxt4QbzVQVbk";

const sb = {
  headers: { "apikey": SUPABASE_ANON, "Authorization": `Bearer ${SUPABASE_ANON}`, "Content-Type": "application/json", "Prefer": "return=representation" },

  async select(table, query = "") {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}${query}`, { headers: this.headers });
    return r.json();
  },
  async insert(table, data) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: "POST", headers: this.headers, body: JSON.stringify(data),
    });
    return r.json();
  },
  async update(table, data, match) {
    const params = Object.entries(match).map(([k,v])=>`${k}=eq.${v}`).join("&");
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
      method: "PATCH", headers: this.headers, body: JSON.stringify(data),
    });
    return r.json();
  },
  async upsert(table, data) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: "POST",
      headers: { ...this.headers, "Prefer": "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify(data),
    });
    return r.json();
  },
  // Realtime via polling (no ws needed)
  poll(table, cb, interval = 4000) {
    const id = setInterval(async () => {
      const data = await this.select(table, "?order=priority.asc");
      if (!data?.error) cb(data);
    }, interval);
    return () => clearInterval(id);
  },
};

// ── DB ↔ App field mapping ────────────────────────────────────────────────────
function dbToJob(r) {
  return {
    id:           r.id,
    customer:     r.customer     || "",
    product:      r.product      || "",
    qty:          r.qty          || 0,
    type:         r.type         || "screenprint_new",
    currentStep:  r.current_step || "quote",
    dueDate:      r.due_date     || "",
    urgency:      r.urgency      || "normal",
    priority:     r.priority     || 99,
    depositPaid:  r.deposit_paid || false,
    assignedTo:   r.assigned_to  || null,
    notes:        r.notes        || "",
    mockupUrl:    r.mockup_url   || null,
    approvalStatus: r.approval_status || "pending",
  };
}

function jobToDb(j) {
  return {
    customer:      j.customer,
    product:       j.product,
    qty:           j.qty,
    type:          j.type,
    current_step:  j.currentStep,
    due_date:      j.dueDate || null,
    urgency:       j.urgency,
    priority:      j.priority,
    deposit_paid:  j.depositPaid,
    assigned_to:   j.assignedTo,
    notes:         j.notes,
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function getStepIndex(job) {
  const steps = WORKFLOW[job.type];
  return steps.findIndex(s => s.id === job.currentStep);
}
function getStep(job) {
  return WORKFLOW[job.type][getStepIndex(job)];
}
function getNextStep(job) {
  const steps = WORKFLOW[job.type];
  const idx = getStepIndex(job);
  return steps[idx + 1] || null;
}
function progressPct(job) {
  const steps = WORKFLOW[job.type];
  const idx = getStepIndex(job);
  return Math.round(((idx + 1) / steps.length) * 100);
}
function daysUntil(dateStr) {
  const diff = new Date(dateStr) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
function dueDateColor(dateStr) {
  const d = daysUntil(dateStr);
  if (d < 0)  return "#ff4d4d";
  if (d <= 3) return "#ff9f43";
  if (d <= 7) return "#e8c547";
  return "#4ec9a0";
}
function roleColor(roleId) {
  return ROLES.find(r => r.id === roleId)?.color || "#888";
}

// ── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(null);
  const [activeRole, setActiveRole] = useState("lisa");
  const [view, setView] = useState("board");
  const [selectedJob, setSelectedJob] = useState(null);
  const [filterUrgency, setFilterUrgency] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [notification, setNotification] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const dragJob = useRef(null);
  const [todaySheet, setTodaySheet] = useState({ lead_printer: [], press_assist: [] });
  const [todayNotes, setTodayNotes] = useState("");
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const notify = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // ── Load jobs from Supabase ──
  const loadJobs = async () => {
    const data = await sb.select("jobs", "?order=priority.asc");
    if (data?.error) { setDbError(data.error.message); return; }
    setJobs((data || []).map(dbToJob));
    setLoading(false);
  };

  // ── Load runsheet from Supabase ──
  const loadRunsheet = async () => {
    const today = new Date().toISOString().slice(0, 10);
    const data = await sb.select("runsheets", `?date=eq.${today}&order=id.desc&limit=1`);
    if (data?.[0]) {
      setTodaySheet({ lead_printer: data[0].lead_printer || [], press_assist: data[0].press_assist || [] });
      setTodayNotes(data[0].manager_note || "");
    }
    // Load history (past runsheets)
    const hist = await sb.select("runsheets", `?date=neq.${today}&order=date.desc&limit=30`);
    if (Array.isArray(hist)) setHistory(hist.map(r => ({
      date: r.date, notes: r.manager_note || "",
      lead_printer: r.lead_printer || [], press_assist: r.press_assist || [],
    })));
  };

  useEffect(() => {
    loadJobs();
    loadRunsheet();
    // Poll for real-time updates every 5 seconds
    const stop = sb.poll("jobs", (data) => {
      setJobs((data || []).map(dbToJob));
    }, 5000);
    return stop;
  }, []);

  // ── Daily auto-reset ──
  const todayKey = new Date().toISOString().slice(0, 10);
  useEffect(() => {
    const lastReset = localStorage.getItem("tnsp_last_reset");
    if (lastReset && lastReset !== todayKey) {
      setTodaySheet({ lead_printer: [], press_assist: [] });
      setTodayNotes("");
    }
    localStorage.setItem("tnsp_last_reset", todayKey);
  }, []);

  // ── Save runsheet to Supabase whenever it changes ──
  const saveRunsheet = async (sheet, notes) => {
    const today = new Date().toISOString().slice(0, 10);
    await sb.upsert("runsheets", {
      date: today,
      lead_printer: sheet.lead_printer,
      press_assist: sheet.press_assist,
      manager_note: notes,
      created_by: activeRole,
    });
  };

  const updateTodaySheet = (newSheet) => {
    setTodaySheet(newSheet);
    saveRunsheet(newSheet, todayNotes);
  };

  const updateTodayNotes = (notes) => {
    setTodayNotes(notes);
    saveRunsheet(todaySheet, notes);
  };

  // ── Advance job step ──
  const advanceJob = async (jobId) => {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;
    const next = getNextStep(job);
    if (!next) return;
    // Optimistic update
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, currentStep: next.id } : j));
    notify(`${job.customer} → ${next.label}`);
    // Write to DB
    await sb.update("jobs", { current_step: next.id }, { id: jobId });
    // Log history
    await sb.insert("job_history", { job_id: jobId, from_step: job.currentStep, to_step: next.id, changed_by: activeRole });
  };

  // ── Toggle deposit ──
  const toggleDeposit = async (jobId) => {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;
    const newVal = !job.depositPaid;
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, depositPaid: newVal } : j));
    notify("Deposit status updated");
    await sb.update("jobs", { deposit_paid: newVal }, { id: jobId });
  };

  // ── Toggle urgency ──
  const toggleUrgency = async (jobId) => {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;
    const newVal = job.urgency === "rush" ? "normal" : "rush";
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, urgency: newVal } : j));
    await sb.update("jobs", { urgency: newVal }, { id: jobId });
  };

  // ── Update assignment ──
  const updateAssign = async (jobId, person) => {
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, assignedTo: person } : j));
    notify(`Job assigned to ${ROLES.find(r => r.id === person)?.label}`);
    await sb.update("jobs", { assigned_to: person }, { id: jobId });
  };

  // ── Drag to reprioritize ──
  const handleDragStart = (jobId) => { dragJob.current = jobId; };
  const handleDrop = async (targetId) => {
    if (!dragJob.current || dragJob.current === targetId) return;
    const sorted = [...jobs].sort((a, b) => a.priority - b.priority);
    const fromIdx = sorted.findIndex(j => j.id === dragJob.current);
    const toIdx   = sorted.findIndex(j => j.id === targetId);
    const moved = sorted.splice(fromIdx, 1)[0];
    sorted.splice(toIdx, 0, moved);
    const reordered = sorted.map((j, i) => ({ ...j, priority: i + 1 }));
    setJobs(reordered);
    setDragOver(null);
    dragJob.current = null;
    // Batch update priorities
    await Promise.all(reordered.map(j => sb.update("jobs", { priority: j.priority }, { id: j.id })));
  };

  // ── Add new job ──
  const addJob = async (job) => {
    const maxPriority = jobs.length > 0 ? Math.max(...jobs.map(j => j.priority)) : 0;
    const newJob = { ...job, priority: maxPriority + 1 };
    const [created] = await sb.insert("jobs", jobToDb(newJob));
    if (created) {
      setJobs(prev => [...prev, dbToJob(created)]);
      notify(`${job.customer} added to queue`);
    }
  };

  // ── Reset runsheet ──
  const resetRunsheet = async () => {
    const hasJobs = todaySheet.lead_printer.length + todaySheet.press_assist.length > 0;
    if (hasJobs) {
      setHistory(prev => [{ date: todayKey, notes: todayNotes, lead_printer: todaySheet.lead_printer, press_assist: todaySheet.press_assist }, ...prev]);
    }
    const empty = { lead_printer: [], press_assist: [] };
    setTodaySheet(empty);
    setTodayNotes("");
    await saveRunsheet(empty, "");
    notify("Runsheet cleared — ready for a new day");
  };

  // Filter jobs by role
  const visibleJobs = jobs
    .filter(j => filterUrgency === "all" || j.urgency === filterUrgency)
    .filter(j => filterType === "all" || j.type === filterType)
    .filter(j => {
      if (activeRole === "lisa") return true;
      if (activeRole === "brother") return true;
      return j.assignedTo === activeRole || j.assignedTo === null;
    })
    .sort((a, b) => a.priority - b.priority);

  // Stats
  const rushJobs    = jobs.filter(j=>j.urgency==="rush").length;
  const overdueJobs = jobs.filter(j=>j.dueDate && daysUntil(j.dueDate)<0).length;
  const dueThisWeek = jobs.filter(j=>{if(!j.dueDate) return false; const d=daysUntil(j.dueDate);return d>=0&&d<=7;}).length;
  const noDeposit   = jobs.filter(j=>!j.depositPaid&&j.currentStep!=="quote").length;

  if (loading) return (
    <div style={{minHeight:"100vh",background:"#0d0d0d",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16}}>
      <div style={{width:42,height:42,background:"#e8c547",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:16,clipPath:"polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)"}}>TN</div>
      <div style={{color:"#555",fontSize:13,letterSpacing:2}}>LOADING PRODUCTION DATA…</div>
    </div>
  );

  if (dbError) return (
    <div style={{minHeight:"100vh",background:"#0d0d0d",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12,padding:40}}>
      <div style={{color:"#ff4d4d",fontSize:16,fontWeight:700}}>Database connection error</div>
      <div style={{color:"#555",fontSize:13,maxWidth:400,textAlign:"center"}}>{dbError}</div>
      <button style={{padding:"8px 20px",background:"#e8c547",color:"#0d0d0d",border:"none",borderRadius:4,fontWeight:700,cursor:"pointer"}} onClick={loadJobs}>Retry</button>
    </div>
  );

  return (
    <div style={styles.root}>
      {/* ── Background ── */}
      <div style={styles.bgGrid} />

      {/* ── Notification ── */}
      {notification && (
        <div style={{...styles.notification, background: notification.type==="error"?"#ff4d4d":"#4ec9a0"}}>
          {notification.msg}
        </div>
      )}

      {/* ── Header ── */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.logo}>
            <span style={styles.logoMark}>TN</span>
            <div>
              <div style={styles.logoTitle}>TRUE NORTH</div>
              <div style={styles.logoSub}>PRODUCTION BOARD</div>
              <div style={{fontSize:9,color:"#4ec9a0",letterSpacing:1,marginTop:1}}>● LIVE SYNC</div>
            </div>
          </div>
        </div>

        {/* Role switcher */}
        <div style={styles.roleBar}>
          {ROLES.map(r => (
            <button key={r.id}
              style={{...styles.roleBtn, ...(activeRole===r.id ? {background: r.color, color:"#0d0d0d"} : {})}}
              onClick={()=>setActiveRole(r.id)}>
              <span style={styles.roleName}>{r.label}</span>
              <span style={styles.roleDesc}>{r.desc}</span>
            </button>
          ))}
        </div>

        <button style={styles.addBtn} onClick={()=>setShowAddModal(true)}>
          + New Job
        </button>
      </header>

      {/* ── Stats bar ── */}
      <div style={styles.statsBar}>
        {[
          { label: "Active Jobs",   value: jobs.length,   color: "#7eb8f7" },
          { label: "Rush",          value: rushJobs,      color: "#ff9f43" },
          { label: "Due This Week", value: dueThisWeek,   color: "#e8c547" },
          { label: "Overdue",       value: overdueJobs,   color: "#ff4d4d" },
          { label: "⚠ No Deposit",  value: noDeposit,    color: "#f79e7e" },
        ].map(s => (
          <div key={s.label} style={styles.stat}>
            <div style={{...styles.statValue, color: s.color}}>{s.value}</div>
            <div style={styles.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div style={styles.toolbar}>
        <div style={styles.filters}>
          <select style={styles.select} value={filterUrgency} onChange={e=>setFilterUrgency(e.target.value)}>
            <option value="all">All Urgency</option>
            <option value="rush">Rush Only</option>
            <option value="normal">Normal Only</option>
          </select>
          <select style={styles.select} value={filterType} onChange={e=>setFilterType(e.target.value)}>
            <option value="all">All Types</option>
            {JOB_TYPES.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div style={styles.viewToggle}>
          {[
            {id:"board", label:"⬛ Board"},
            {id:"list",  label:"☰ List"},
            {id:"today", label:"📋 Today's Run"},
          ].map(v=>(
            <button key={v.id} style={{
              ...styles.viewBtn,
              ...(view===v.id ? styles.viewBtnActive : {}),
              ...(v.id==="today" ? {borderColor:"#e8c54760", color: view==="today"?"#0d0d0d":"#e8c547"} : {}),
              ...(v.id==="today" && view==="today" ? {background:"#e8c547"} : {}),
            }}
              onClick={()=>setView(v.id)}>
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main content ── */}
      <main style={styles.main}>
        {view === "board" ? (
          <BoardView jobs={visibleJobs} activeRole={activeRole}
            onAdvance={advanceJob} onToggleDeposit={toggleDeposit}
            onToggleUrgency={toggleUrgency} onAssign={updateAssign}
            onSelect={j=>{setSelectedJob(j);setView("detail");}}
            dragOver={dragOver} setDragOver={setDragOver}
            onDragStart={handleDragStart} onDrop={handleDrop} />
        ) : view === "list" ? (
          <ListView jobs={visibleJobs} activeRole={activeRole}
            onAdvance={advanceJob} onToggleDeposit={toggleDeposit}
            onToggleUrgency={toggleUrgency} onAssign={updateAssign}
            onSelect={j=>{setSelectedJob(j);setView("detail");}}
            dragOver={dragOver} setDragOver={setDragOver}
            onDragStart={handleDragStart} onDrop={handleDrop} />
        ) : (
          <TodayView jobs={jobs} activeRole={activeRole}
            todaySheet={todaySheet} setTodaySheet={updateTodaySheet}
            todayNotes={todayNotes} setTodayNotes={updateTodayNotes}
            onAdvance={advanceJob}
            onSelect={j=>{setSelectedJob(j);setView("detail");}}
            onReset={resetRunsheet}
            history={history}
            notify={notify} />
        )}
      </main>

      {/* ── Detail modal ── */}
      {view==="detail" && selectedJob && (
        <DetailModal job={jobs.find(j=>j.id===selectedJob.id)||selectedJob}
          activeRole={activeRole}
          onAdvance={advanceJob} onToggleDeposit={toggleDeposit}
          onToggleUrgency={toggleUrgency} onAssign={updateAssign}
          onClose={()=>{setView("board");setSelectedJob(null);}} />
      )}

      {/* ── Add job modal ── */}
      {showAddModal && (
        <AddJobModal
          onAdd={(job)=>{
            addJob(job);
            setShowAddModal(false);
          }}
          onClose={()=>setShowAddModal(false)} />
      )}
    </div>
  );
}

// ── Board View ───────────────────────────────────────────────────────────────
function BoardView({ jobs, activeRole, onAdvance, onToggleDeposit, onToggleUrgency, onAssign, onSelect, dragOver, setDragOver, onDragStart, onDrop }) {
  // Group by workflow stage bucket
  const buckets = [
    { key: "pre",        label: "Pre-Production",  steps: ["quote","approved","deposit","blanks"] },
    { key: "artwork",    label: "Artwork / Setup",  steps: ["seps","burn","digitizing"] },
    { key: "production", label: "Production",       steps: ["presscheck","sewout","production"] },
    { key: "done",       label: "Outgoing",         steps: ["shipping"] },
  ];

  return (
    <div style={styles.boardGrid}>
      {buckets.map(bucket => {
        const bucketJobs = jobs.filter(j => bucket.steps.includes(j.currentStep));
        return (
          <div key={bucket.key} style={styles.boardCol}>
            <div style={styles.boardColHeader}>
              <span>{bucket.label}</span>
              <span style={styles.boardCount}>{bucketJobs.length}</span>
            </div>
            <div style={styles.boardColBody}>
              {bucketJobs.length === 0 && (
                <div style={styles.emptyCol}>No jobs here</div>
              )}
              {bucketJobs.map(job => (
                <JobCard key={job.id} job={job} activeRole={activeRole}
                  onAdvance={onAdvance} onToggleDeposit={onToggleDeposit}
                  onToggleUrgency={onToggleUrgency} onAssign={onAssign}
                  onSelect={onSelect}
                  isDragOver={dragOver===job.id}
                  onDragStart={()=>onDragStart(job.id)}
                  onDragOver={e=>{e.preventDefault();setDragOver(job.id);}}
                  onDrop={()=>onDrop(job.id)} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── List View ────────────────────────────────────────────────────────────────
function ListView({ jobs, activeRole, onAdvance, onToggleDeposit, onToggleUrgency, onAssign, onSelect, dragOver, setDragOver, onDragStart, onDrop }) {
  return (
    <div style={styles.listView}>
      <div style={styles.listHeader}>
        <span style={{width:36}}>#</span>
        <span style={{flex:2}}>Customer / Product</span>
        <span style={{flex:1}}>Type</span>
        <span style={{flex:1.5}}>Current Step</span>
        <span style={{flex:1}}>Due</span>
        <span style={{flex:1}}>Assigned</span>
        <span style={{flex:1}}>Actions</span>
      </div>
      {jobs.map(job => (
        <ListRow key={job.id} job={job} activeRole={activeRole}
          onAdvance={onAdvance} onToggleDeposit={onToggleDeposit}
          onToggleUrgency={onToggleUrgency} onAssign={onAssign}
          onSelect={onSelect}
          isDragOver={dragOver===job.id}
          onDragStart={()=>onDragStart(job.id)}
          onDragOver={e=>{e.preventDefault();setDragOver(job.id);}}
          onDrop={()=>onDrop(job.id)} />
      ))}
    </div>
  );
}

// ── Job Card (Board) ─────────────────────────────────────────────────────────
function JobCard({ job, activeRole, onAdvance, onToggleDeposit, onToggleUrgency, onAssign, onSelect, isDragOver, onDragStart, onDragOver, onDrop }) {
  const step = getStep(job);
  const next = getNextStep(job);
  const pct  = progressPct(job);
  const days = daysUntil(job.dueDate);
  const dc   = dueDateColor(job.dueDate);
  const canAdvance = activeRole === "lisa" || activeRole === "brother" ||
    (step && step.owner === activeRole);

  return (
    <div style={{
      ...styles.card,
      ...(isDragOver ? styles.cardDragOver : {}),
      ...(job.urgency==="rush" ? styles.cardRush : {}),
    }}
      draggable onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop}
      onClick={()=>onSelect(job)}>

      {/* Priority + urgency */}
      <div style={styles.cardTop}>
        <span style={styles.priorityBadge}>#{job.priority}</span>
        {job.urgency==="rush" && <span style={styles.rushBadge}>RUSH</span>}
        {!job.depositPaid && <span style={styles.depositBadge}>💰 DEP</span>}
        <span style={{...styles.typeBadge, background: job.type==="embroidery"?"#7eb8f720":"#f79e7e20",
          color: job.type==="embroidery"?"#7eb8f7":"#f79e7e"}}>
          {job.type==="embroidery"?"EMB":"SP"}
        </span>
      </div>

      {/* Customer */}
      <div style={styles.cardCustomer}>{job.customer}</div>
      <div style={styles.cardProduct}>{job.product} · {job.qty} pcs</div>

      {/* Current step */}
      <div style={styles.cardStep}>
        <span style={styles.stepIcon}>{step?.icon}</span>
        <span style={styles.stepLabel}>{step?.label}</span>
      </div>

      {/* Progress bar */}
      <div style={styles.progressBar}>
        <div style={{...styles.progressFill, width:`${pct}%`,
          background: pct===100?"#4ec9a0":job.urgency==="rush"?"#ff9f43":"#e8c547"}} />
      </div>

      {/* Due date */}
      <div style={{...styles.dueDate, color: dc}}>
        {days < 0 ? `⚠ ${Math.abs(days)}d overdue` :
         days === 0 ? "Due today!" :
         `Due in ${days}d · ${job.dueDate}`}
      </div>

      {/* Assigned */}
      {job.assignedTo && (
        <div style={styles.assignedTag}>
          <span style={{...styles.assignedDot, background: roleColor(job.assignedTo)}} />
          {ROLES.find(r=>r.id===job.assignedTo)?.label}
        </div>
      )}

      {/* Actions — stop propagation so card click doesn't fire */}
      {(activeRole==="lisa"||activeRole==="brother") && (
        <div style={styles.cardActions} onClick={e=>e.stopPropagation()}>
          {next && canAdvance && (
            <button style={styles.advanceBtn} onClick={()=>onAdvance(job.id)}>
              → {next.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── List Row ─────────────────────────────────────────────────────────────────
function ListRow({ job, activeRole, onAdvance, onToggleDeposit, onToggleUrgency, onAssign, onSelect, isDragOver, onDragStart, onDragOver, onDrop }) {
  const step = getStep(job);
  const next = getNextStep(job);
  const days = daysUntil(job.dueDate);
  const dc   = dueDateColor(job.dueDate);

  return (
    <div style={{
      ...styles.listRow,
      ...(isDragOver ? styles.cardDragOver : {}),
      ...(job.urgency==="rush" ? {borderLeft:`3px solid #ff9f43`} : {borderLeft:`3px solid transparent`}),
    }}
      draggable onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop}>

      <span style={{width:36,display:"flex",alignItems:"center",gap:4}}>
        <span style={styles.priorityBadge}>#{job.priority}</span>
      </span>

      <span style={{flex:2,cursor:"pointer"}} onClick={()=>onSelect(job)}>
        <div style={{fontWeight:600,color:"#f0ede8"}}>{job.customer}</div>
        <div style={{fontSize:12,color:"#888"}}>{job.product} · {job.qty} pcs</div>
      </span>

      <span style={{flex:1,fontSize:12,color: job.type==="embroidery"?"#7eb8f7":"#f79e7e"}}>
        {job.type==="embroidery"?"Embroidery":"Screen Print"}
        {job.type==="screenprint_reprint"?" (Reprint)":""}
      </span>

      <span style={{flex:1.5}}>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <span>{step?.icon}</span>
          <span style={{fontSize:13,color:"#d4d0c8"}}>{step?.label}</span>
        </div>
        {!job.depositPaid && <div style={{fontSize:11,color:"#f79e7e"}}>⚠ Deposit pending</div>}
      </span>

      <span style={{flex:1,fontSize:13,color:dc}}>
        {days<0 ? `${Math.abs(days)}d over` : `${days}d`}
        <div style={{fontSize:11,color:"#666"}}>{job.dueDate}</div>
      </span>

      <span style={{flex:1}} onClick={e=>e.stopPropagation()}>
        {(activeRole==="lisa"||activeRole==="brother") ? (
          <select style={styles.assignSelect}
            value={job.assignedTo||""}
            onChange={e=>onAssign(job.id,e.target.value)}>
            <option value="">Unassigned</option>
            {ROLES.filter(r=>r.id!=="lisa").map(r=>(
              <option key={r.id} value={r.id}>{r.label}</option>
            ))}
          </select>
        ) : (
          <span style={{fontSize:13,color:roleColor(job.assignedTo)}}>
            {ROLES.find(r=>r.id===job.assignedTo)?.label||"—"}
          </span>
        )}
      </span>

      <span style={{flex:1,display:"flex",gap:6}} onClick={e=>e.stopPropagation()}>
        {next && (activeRole==="lisa"||activeRole==="brother") && (
          <button style={styles.advanceBtnSm} onClick={()=>onAdvance(job.id)}>→</button>
        )}
        <button style={{...styles.advanceBtnSm, background:"#ffffff10"}}
          onClick={()=>onToggleUrgency(job.id)}>
          {job.urgency==="rush"?"🔥":"⬜"}
        </button>
      </span>
    </div>
  );
}

// ── Detail Modal ─────────────────────────────────────────────────────────────
function DetailModal({ job, activeRole, onAdvance, onToggleDeposit, onToggleUrgency, onAssign, onClose }) {
  const steps = WORKFLOW[job.type];
  const currentIdx = getStepIndex(job);
  const next = getNextStep(job);
  const canAdvance = activeRole==="lisa"||activeRole==="brother";

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modal} onClick={e=>e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <div>
            <div style={styles.modalOrderNum}>Order #{job.id}</div>
            <div style={styles.modalCustomer}>{job.customer}</div>
            <div style={styles.modalProduct}>{job.product} · {job.qty} pcs</div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"flex-start"}}>
            {job.urgency==="rush" && <span style={styles.rushBadge}>RUSH</span>}
            <button style={styles.closeBtn} onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Workflow timeline */}
        <div style={styles.timeline}>
          {steps.map((step, i) => (
            <div key={step.id} style={styles.timelineStep}>
              <div style={{
                ...styles.timelineDot,
                background: i < currentIdx ? "#4ec9a0" :
                            i === currentIdx ? "#e8c547" : "#333",
                border: i===currentIdx?"2px solid #e8c547":"2px solid transparent",
              }}>
                {i < currentIdx ? "✓" : step.icon}
              </div>
              {i < steps.length-1 && (
                <div style={{...styles.timelineLine,
                  background: i < currentIdx?"#4ec9a0":"#333"}} />
              )}
              <div style={{...styles.timelineLabel,
                color: i===currentIdx?"#e8c547": i<currentIdx?"#4ec9a0":"#555"}}>
                {step.label}
              </div>
            </div>
          ))}
        </div>

        {/* Details grid */}
        <div style={styles.detailGrid}>
          <DetailField label="Job Type" value={JOB_TYPES.find(t=>t.value===job.type)?.label} />
          <DetailField label="Due Date" value={job.dueDate}
            valueStyle={{color: dueDateColor(job.dueDate)}} />
          <DetailField label="Deposit" value={job.depositPaid?"✅ Received":"⚠ Pending"}
            valueStyle={{color: job.depositPaid?"#4ec9a0":"#f79e7e"}} />
          <DetailField label="Priority" value={`#${job.priority}`} />
          <DetailField label="Assigned To"
            value={ROLES.find(r=>r.id===job.assignedTo)?.label||"Unassigned"} />
          <DetailField label="Urgency"
            value={job.urgency==="rush"?"🔥 Rush":"Normal"}
            valueStyle={{color: job.urgency==="rush"?"#ff9f43":"#888"}} />
        </div>

        {job.notes && (
          <div style={styles.notesBox}>
            <div style={styles.notesLabel}>Notes</div>
            <div style={styles.notesText}>{job.notes}</div>
          </div>
        )}

        {/* Actions */}
        {canAdvance && (
          <div style={styles.modalActions}>
            {next && (
              <button style={styles.modalAdvanceBtn} onClick={()=>{onAdvance(job.id);onClose();}}>
                Advance → {next.label}
              </button>
            )}
            <button style={styles.modalSecBtn} onClick={()=>onToggleDeposit(job.id)}>
              {job.depositPaid?"Mark Deposit Unpaid":"Mark Deposit Paid"}
            </button>
            <button style={styles.modalSecBtn} onClick={()=>onToggleUrgency(job.id)}>
              {job.urgency==="rush"?"Remove Rush Flag":"Mark as Rush 🔥"}
            </button>
          </div>
        )}

        {/* Assign (manager only) */}
        {(activeRole==="lisa"||activeRole==="brother") && (
          <div style={styles.assignRow}>
            <span style={styles.assignLabel}>Assign to:</span>
            {ROLES.filter(r=>r.id!=="lisa").map(r=>(
              <button key={r.id}
                style={{...styles.assignBtn,
                  background: job.assignedTo===r.id ? r.color+"33" : "#ffffff08",
                  borderColor: job.assignedTo===r.id ? r.color : "transparent",
                  color: job.assignedTo===r.id ? r.color : "#888",
                }}
                onClick={()=>onAssign(job.id,r.id)}>
                {r.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DetailField({ label, value, valueStyle }) {
  return (
    <div style={styles.detailField}>
      <div style={styles.detailLabel}>{label}</div>
      <div style={{...styles.detailValue, ...valueStyle}}>{value}</div>
    </div>
  );
}

// ── Add Job Modal ─────────────────────────────────────────────────────────────
function AddJobModal({ onAdd, onClose }) {
  const [form, setForm] = useState({
    id: `JOB-${Date.now()}`,
    customer: "", product: "", qty: "",
    type: "screenprint_new", dueDate: "",
    urgency: "normal", currentStep: "quote",
    depositPaid: false, notes: "", assignedTo: null,
  });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const handleSubmit = () => {
    if (!form.customer || !form.product || !form.dueDate) return;
    onAdd({...form, qty: parseInt(form.qty)||0});
  };

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={{...styles.modal, maxWidth:500}} onClick={e=>e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <div style={styles.modalCustomer}>Add New Job</div>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:12,marginTop:16}}>
          {[
            ["Customer", "customer", "text"],
            ["Product / Description", "product", "text"],
            ["Quantity", "qty", "number"],
            ["Due Date", "dueDate", "date"],
            ["Notes", "notes", "text"],
          ].map(([label, key, type]) => (
            <label key={key} style={styles.formLabel}>
              <span style={styles.formLabelText}>{label}</span>
              <input style={styles.formInput} type={type}
                value={form[key]} onChange={e=>set(key,e.target.value)} />
            </label>
          ))}

          <label style={styles.formLabel}>
            <span style={styles.formLabelText}>Job Type</span>
            <select style={styles.formInput} value={form.type} onChange={e=>set("type",e.target.value)}>
              {JOB_TYPES.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </label>

          <label style={styles.formLabel}>
            <span style={styles.formLabelText}>Starting Step</span>
            <select style={styles.formInput} value={form.currentStep} onChange={e=>set("currentStep",e.target.value)}>
              {WORKFLOW[form.type].map(s=><option key={s.id} value={s.id}>{s.icon} {s.label}</option>)}
            </select>
          </label>

          <label style={styles.formLabel}>
            <span style={styles.formLabelText}>Urgency</span>
            <select style={styles.formInput} value={form.urgency} onChange={e=>set("urgency",e.target.value)}>
              <option value="normal">Normal</option>
              <option value="rush">Rush 🔥</option>
            </select>
          </label>

          <label style={{display:"flex",alignItems:"center",gap:10,color:"#888",fontSize:14}}>
            <input type="checkbox" checked={form.depositPaid}
              onChange={e=>set("depositPaid",e.target.checked)} />
            Deposit already received
          </label>
        </div>

        <div style={{display:"flex",gap:10,marginTop:20}}>
          <button style={styles.modalAdvanceBtn} onClick={handleSubmit}>Add to Queue</button>
          <button style={styles.modalSecBtn} onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Today's Runsheet View ────────────────────────────────────────────────────
function TodayView({ jobs, activeRole, todaySheet, setTodaySheet, todayNotes, setTodayNotes, onAdvance, onSelect, onReset, history, notify }) {
  const isManager = activeRole === "lisa" || activeRole === "brother";
  const today = new Date().toLocaleDateString("en-CA", { weekday:"long", year:"numeric", month:"long", day:"numeric" });

  const floorRoles = [
    { id: "lead_printer",  label: "Lead Printer",    color: "#7eb8f7" },
    { id: "press_assist",  label: "Press Assistant",  color: "#f79e7e" },
  ];

  // Jobs eligible to assign: not shipped, has a due date, not already in today sheet
  const assignedIds = [...todaySheet.lead_printer, ...todaySheet.press_assist];
  const eligible = jobs
    .filter(j => j.currentStep !== "shipping")
    .sort((a,b) => a.priority - b.priority);

  const addToRunsheet = (roleId, jobId) => {
    if (todaySheet[roleId]?.includes(jobId)) return;
    setTodaySheet(prev => ({ ...prev, [roleId]: [...(prev[roleId]||[]), jobId] }));
    notify(`Added to ${floorRoles.find(r=>r.id===roleId)?.label}'s runsheet`);
  };

  const removeFromRunsheet = (roleId, jobId) => {
    setTodaySheet(prev => ({ ...prev, [roleId]: prev[roleId].filter(id=>id!==jobId) }));
  };

  const moveUp = (roleId, idx) => {
    setTodaySheet(prev => {
      const arr = [...prev[roleId]];
      if (idx === 0) return prev;
      [arr[idx-1], arr[idx]] = [arr[idx], arr[idx-1]];
      return { ...prev, [roleId]: arr };
    });
  };

  const moveDown = (roleId, idx) => {
    setTodaySheet(prev => {
      const arr = [...prev[roleId]];
      if (idx === arr.length-1) return prev;
      [arr[idx], arr[idx+1]] = [arr[idx+1], arr[idx]];
      return { ...prev, [roleId]: arr };
    });
  };

  // Floor view: just see your own jobs for today
  if (!isManager) {
    const myJobs = (todaySheet[activeRole] || []).map(id => jobs.find(j=>j.id===id)).filter(Boolean);
    return (
      <div style={todayStyles.root}>
        <div style={todayStyles.floorHeader}>
          <div style={todayStyles.floorDate}>{today}</div>
          <div style={{...todayStyles.floorRoleTag, background: floorRoles.find(r=>r.id===activeRole)?.color+"22",
            color: floorRoles.find(r=>r.id===activeRole)?.color}}>
            {floorRoles.find(r=>r.id===activeRole)?.label}
          </div>
          <div style={todayStyles.floorTitle}>YOUR JOBS TODAY</div>
        </div>

        {myJobs.length === 0 ? (
          <div style={todayStyles.emptyState}>
            <div style={{fontSize:40, marginBottom:12}}>☕</div>
            <div style={{color:"#555", fontSize:14}}>No jobs assigned yet — check back soon.</div>
          </div>
        ) : (
          <div style={todayStyles.floorJobList}>
            {myJobs.map((job, i) => {
              const step = getStep(job);
              const next = getNextStep(job);
              return (
                <div key={job.id} style={todayStyles.floorJobCard}>
                  <div style={todayStyles.floorJobNum}>
                    <span style={todayStyles.floorSeq}>{i+1}</span>
                    {job.urgency==="rush" && <span style={styles.rushBadge}>RUSH</span>}
                  </div>
                  <div style={todayStyles.floorJobMain}>
                    <div style={todayStyles.floorJobCustomer}>{job.customer}</div>
                    <div style={todayStyles.floorJobProduct}>{job.product} · {job.qty} pcs</div>
                    <div style={todayStyles.floorJobStep}>
                      <span>{step?.icon}</span> {step?.label}
                    </div>
                    {job.notes && <div style={todayStyles.floorJobNotes}>{job.notes}</div>}
                  </div>
                  <div style={todayStyles.floorJobRight}>
                    <div style={{...todayStyles.floorDue, color: dueDateColor(job.dueDate)}}>
                      {daysUntil(job.dueDate) < 0 ? "OVERDUE" :
                       daysUntil(job.dueDate) === 0 ? "DUE TODAY" :
                       `${daysUntil(job.dueDate)}d left`}
                    </div>
                    {next && (
                      <button style={todayStyles.floorAdvanceBtn} onClick={()=>onAdvance(job.id)}>
                        ✓ Mark {next.label}
                      </button>
                    )}
                    <button style={todayStyles.floorDetailBtn} onClick={()=>onSelect(job)}>
                      Details →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {todayNotes && (
          <div style={todayStyles.managerNote}>
            <div style={todayStyles.managerNoteLabel}>📌 NOTE FROM MANAGER</div>
            <div style={todayStyles.managerNoteText}>{todayNotes}</div>
          </div>
        )}
      </div>
    );
  }

  const [showHistoryPanel, setShowHistoryPanel] = useState(false);

  // Manager view: build the runsheet
  return (
    <div style={todayStyles.root}>
      {showHistoryPanel ? (
        <HistoryPanel history={history} jobs={jobs} onClose={()=>setShowHistoryPanel(false)} />
      ) : (
      <>
      <div style={todayStyles.managerHeader}>
        <div>
          <div style={todayStyles.floorDate}>{today}</div>
          <div style={todayStyles.managerTitle}>BUILD TODAY'S RUNSHEET</div>
        </div>
        <div style={{display:"flex", gap:10, alignItems:"center"}}>
          {history.length > 0 && (
            <button style={todayStyles.historyBtn} onClick={()=>setShowHistoryPanel(true)}>
              📅 History ({history.length})
            </button>
          )}
          <div style={todayStyles.assignedCount}>
            {assignedIds.length} jobs assigned
          </div>
          <button style={todayStyles.resetBtn} onClick={onReset}>
            ↺ Reset Day
          </button>
        </div>
      </div>

      {/* Manager note */}
      <div style={todayStyles.noteArea}>
        <div style={todayStyles.noteLabelRow}>
          <span style={todayStyles.noteAreaLabel}>📌 Note to floor team</span>
          <span style={{fontSize:11,color:"#555"}}>Visible to all floor roles</span>
        </div>
        <textarea style={todayStyles.noteTextarea}
          placeholder="e.g. Start with rush jobs first. Ink mix for Pac Surf is in the back cabinet. Check with Andrew before lunch."
          value={todayNotes} onChange={e=>setTodayNotes(e.target.value)} rows={2} />
      </div>

      <div style={todayStyles.managerGrid}>
        {/* Left: job pool */}
        <div style={todayStyles.jobPool}>
          <div style={todayStyles.poolHeader}>ALL ACTIVE JOBS · Drag or click + to assign</div>
          {eligible.map(job => {
            const step = getStep(job);
            const alreadyIn = assignedIds.includes(job.id);
            return (
              <div key={job.id} style={{...todayStyles.poolJob, opacity: alreadyIn?0.35:1}}>
                <div style={todayStyles.poolJobLeft}>
                  <span style={styles.priorityBadge}>#{job.priority}</span>
                  {job.urgency==="rush" && <span style={styles.rushBadge}>RUSH</span>}
                  <div>
                    <div style={todayStyles.poolJobCustomer}>{job.customer}</div>
                    <div style={todayStyles.poolJobProduct}>{job.product} · {step?.icon} {step?.label}</div>
                  </div>
                </div>
                {!alreadyIn && (
                  <div style={todayStyles.poolBtns}>
                    {floorRoles.map(r => (
                      <button key={r.id} style={{...todayStyles.poolAssignBtn, borderColor:r.color+"60", color:r.color}}
                        onClick={()=>addToRunsheet(r.id, job.id)}>
                        + {r.label.split(" ")[0]}
                      </button>
                    ))}
                  </div>
                )}
                {alreadyIn && <span style={todayStyles.assignedTick}>✓ Assigned</span>}
              </div>
            );
          })}
        </div>

        {/* Right: runsheet columns per role */}
        <div style={todayStyles.runsheetCols}>
          {floorRoles.map(role => {
            const roleJobs = (todaySheet[role.id]||[]).map(id=>jobs.find(j=>j.id===id)).filter(Boolean);
            return (
              <div key={role.id} style={todayStyles.runsheetCol}>
                <div style={{...todayStyles.runsheetColHeader, borderColor: role.color}}>
                  <span style={{color: role.color}}>{role.label}</span>
                  <span style={todayStyles.boardCount}>{roleJobs.length}</span>
                </div>
                {roleJobs.length === 0 && (
                  <div style={todayStyles.runsheetEmpty}>No jobs yet — add from the pool →</div>
                )}
                {roleJobs.map((job, idx) => {
                  const step = getStep(job);
                  return (
                    <div key={job.id} style={todayStyles.runsheetJob}>
                      <div style={todayStyles.runsheetJobSeq}>
                        <span style={{...todayStyles.floorSeq, background: role.color+"22", color: role.color}}>{idx+1}</span>
                        <div style={{display:"flex",flexDirection:"column",gap:2}}>
                          <button style={todayStyles.nudgeBtn} onClick={()=>moveUp(role.id,idx)}>▲</button>
                          <button style={todayStyles.nudgeBtn} onClick={()=>moveDown(role.id,idx)}>▼</button>
                        </div>
                      </div>
                      <div style={{flex:1}}>
                        <div style={todayStyles.runsheetJobCustomer}>{job.customer}</div>
                        <div style={todayStyles.runsheetJobProduct}>{job.product} · {step?.icon} {step?.label}</div>
                        {job.urgency==="rush" && <span style={styles.rushBadge}>RUSH</span>}
                      </div>
                      <button style={todayStyles.removeBtn}
                        onClick={()=>removeFromRunsheet(role.id, job.id)}>✕</button>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
      </>
      )}
    </div>
  );
}

// ── History Panel ─────────────────────────────────────────────────────────────
function HistoryPanel({ history, jobs, onClose }) {
  const [expanded, setExpanded] = useState(null);
  const floorRoles = [
    { id: "lead_printer", label: "Lead Printer",   color: "#7eb8f7" },
    { id: "press_assist", label: "Press Assistant", color: "#f79e7e" },
  ];

  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString("en-CA", {
    weekday:"long", year:"numeric", month:"long", day:"numeric"
  });

  const getJobName = (entry, id) => {
    // Try snapshot first, fall back to live jobs
    if (entry.jobSnapshots?.[id]) {
      const j = entry.jobSnapshots[id];
      return `${j.customer} — ${j.product}`;
    }
    const j = jobs.find(j => j.id === id);
    return j ? `${j.customer} — ${j.product}` : `Job #${id}`;
  };

  return (
    <div style={historyStyles.root}>
      <div style={historyStyles.header}>
        <div>
          <div style={historyStyles.headerSub}>DAILY RUNSHEET</div>
          <div style={historyStyles.headerTitle}>HISTORY LOG</div>
        </div>
        <button style={{...styles.closeBtn, width:"auto", padding:"6px 16px", fontSize:13}}
          onClick={onClose}>← Back to Today</button>
      </div>

      {history.length === 0 && (
        <div style={{padding:"60px 0", textAlign:"center", color:"#555"}}>
          No history yet — completed runsheets will appear here.
        </div>
      )}

      {history.map((entry, i) => {
        const totalJobs = (entry.lead_printer?.length||0) + (entry.press_assist?.length||0);
        const isOpen = expanded === i;
        return (
          <div key={i} style={historyStyles.entry}>
            <div style={historyStyles.entryHeader} onClick={()=>setExpanded(isOpen?null:i)}>
              <div style={historyStyles.entryLeft}>
                <div style={historyStyles.entryDate}>{formatDate(entry.date)}</div>
                <div style={historyStyles.entrySummary}>
                  {totalJobs} jobs assigned
                  {entry.lead_printer?.length > 0 && ` · Lead: ${entry.lead_printer.length}`}
                  {entry.press_assist?.length > 0 && ` · Press: ${entry.press_assist.length}`}
                </div>
              </div>
              <div style={{display:"flex", alignItems:"center", gap:10}}>
                {entry.notes && <span style={historyStyles.hasNote}>📌 Note</span>}
                <span style={historyStyles.chevron}>{isOpen ? "▲" : "▼"}</span>
              </div>
            </div>

            {isOpen && (
              <div style={historyStyles.entryBody}>
                {entry.notes && (
                  <div style={historyStyles.noteBox}>
                    <div style={historyStyles.noteLabel}>Manager Note</div>
                    <div style={historyStyles.noteText}>{entry.notes}</div>
                  </div>
                )}
                <div style={historyStyles.rolesGrid}>
                  {floorRoles.map(role => {
                    const roleJobs = entry[role.id] || [];
                    if (roleJobs.length === 0) return null;
                    return (
                      <div key={role.id} style={historyStyles.roleCol}>
                        <div style={{...historyStyles.roleHeader, color: role.color, borderColor: role.color}}>
                          {role.label} · {roleJobs.length} jobs
                        </div>
                        {roleJobs.map((id, idx) => (
                          <div key={id} style={historyStyles.historyJob}>
                            <span style={{...todayStyles.floorSeq,
                              background: role.color+"22", color: role.color,
                              width:22, height:22, fontSize:11, flexShrink:0}}>
                              {idx+1}
                            </span>
                            <span style={historyStyles.historyJobName}>
                              {getJobName(entry, id)}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

const historyStyles = {
  root: { maxWidth: 1100, margin: "0 auto" },
  header: {
    display:"flex", justifyContent:"space-between", alignItems:"flex-end",
    marginBottom:24,
  },
  headerSub: { fontSize:11, color:"#555", letterSpacing:2, textTransform:"uppercase", marginBottom:4 },
  headerTitle: { fontSize:22, fontWeight:800, letterSpacing:3, color:"#f0ede8" },
  entry: {
    background:"#141414", border:"1px solid #ffffff10",
    borderRadius:8, marginBottom:10, overflow:"hidden",
  },
  entryHeader: {
    display:"flex", justifyContent:"space-between", alignItems:"center",
    padding:"14px 18px", cursor:"pointer",
    transition:"background 0.1s",
  },
  entryLeft: {},
  entryDate: { fontSize:14, fontWeight:700, color:"#f0ede8", marginBottom:3 },
  entrySummary: { fontSize:12, color:"#555" },
  hasNote: {
    fontSize:11, background:"#e8c54715", color:"#e8c547",
    padding:"2px 8px", borderRadius:10,
  },
  chevron: { fontSize:12, color:"#555" },
  entryBody: { padding:"0 18px 16px", borderTop:"1px solid #ffffff08" },
  noteBox: {
    background:"#e8c54708", border:"1px solid #e8c54720",
    borderRadius:6, padding:"10px 14px", margin:"14px 0",
  },
  noteLabel: { fontSize:10, color:"#e8c547", letterSpacing:1, marginBottom:4 },
  noteText: { fontSize:13, color:"#d4d0c8", lineHeight:1.6 },
  rolesGrid: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginTop:14 },
  roleCol: {
    background:"#1a1a1a", border:"1px solid #ffffff10",
    borderRadius:6, overflow:"hidden",
  },
  roleHeader: {
    padding:"8px 12px", fontSize:11, fontWeight:800,
    letterSpacing:1, textTransform:"uppercase",
    borderLeft:"3px solid", background:"#ffffff05",
  },
  historyJob: {
    display:"flex", alignItems:"center", gap:10,
    padding:"8px 12px", borderTop:"1px solid #ffffff08",
  },
  historyJobName: { fontSize:13, color:"#888" },
};

const todayStyles = {
  root: { maxWidth: 1100, margin: "0 auto" },
  floorHeader: { marginBottom: 24, display:"flex", flexDirection:"column", gap:6 },
  floorDate: { fontSize:11, color:"#555", letterSpacing:2, textTransform:"uppercase" },
  floorTitle: { fontSize:22, fontWeight:800, letterSpacing:3, color:"#f0ede8" },
  floorRoleTag: { display:"inline-flex", padding:"3px 12px", borderRadius:12, fontSize:12, fontWeight:700, width:"fit-content" },
  emptyState: { textAlign:"center", padding:"60px 0" },
  floorJobList: { display:"flex", flexDirection:"column", gap:12 },
  floorJobCard: {
    background:"#141414", border:"1px solid #ffffff15", borderRadius:8,
    padding:16, display:"flex", gap:16, alignItems:"flex-start",
  },
  floorJobNum: { display:"flex", flexDirection:"column", gap:6, alignItems:"center", minWidth:32 },
  floorSeq: {
    width:28, height:28, borderRadius:"50%", background:"#e8c54722",
    color:"#e8c547", display:"flex", alignItems:"center", justifyContent:"center",
    fontWeight:800, fontSize:13,
  },
  floorJobMain: { flex:1 },
  floorJobCustomer: { fontSize:16, fontWeight:700, color:"#f0ede8", marginBottom:2 },
  floorJobProduct: { fontSize:13, color:"#666", marginBottom:8 },
  floorJobStep: {
    display:"inline-flex", alignItems:"center", gap:6, fontSize:13,
    background:"#ffffff08", padding:"4px 10px", borderRadius:4, color:"#d4d0c8",
  },
  floorJobNotes: { fontSize:12, color:"#555", marginTop:8, fontStyle:"italic" },
  floorJobRight: { display:"flex", flexDirection:"column", gap:8, alignItems:"flex-end", minWidth:130 },
  floorDue: { fontSize:12, fontWeight:700 },
  floorAdvanceBtn: {
    padding:"8px 14px", background:"#4ec9a022", border:"1px solid #4ec9a060",
    color:"#4ec9a0", borderRadius:6, cursor:"pointer", fontSize:12, fontWeight:700,
    width:"100%", textAlign:"center",
  },
  floorDetailBtn: {
    padding:"6px 14px", background:"#ffffff08", border:"1px solid #ffffff15",
    color:"#666", borderRadius:6, cursor:"pointer", fontSize:12, width:"100%",
  },
  managerNote: {
    marginTop:24, background:"#e8c54710", border:"1px solid #e8c54740",
    borderRadius:8, padding:"14px 18px",
  },
  managerNoteLabel: { fontSize:10, color:"#e8c547", letterSpacing:2, marginBottom:6, fontWeight:700 },
  managerNoteText: { fontSize:14, color:"#d4d0c8", lineHeight:1.6 },
  managerHeader: {
    display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:20,
  },
  managerTitle: { fontSize:20, fontWeight:800, letterSpacing:3, color:"#f0ede8", marginTop:4 },
  assignedCount: {
    background:"#ffffff10", padding:"6px 16px", borderRadius:20,
    fontSize:12, color:"#888",
  },
  resetBtn: {
    padding:"6px 16px", background:"#ff4d4d18", border:"1px solid #ff4d4d40",
    color:"#ff4d4d", borderRadius:6, cursor:"pointer", fontSize:12, fontWeight:700,
  },
  historyBtn: {
    padding:"6px 16px", background:"#e8c54715", border:"1px solid #e8c54740",
    color:"#e8c547", borderRadius:6, cursor:"pointer", fontSize:12, fontWeight:700,
  },
  noteArea: { marginBottom:20 },
  noteLabelRow: { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 },
  noteAreaLabel: { fontSize:11, color:"#e8c547", letterSpacing:1, fontWeight:700 },
  noteTextarea: {
    width:"100%", background:"#1a1a1a", border:"1px solid #e8c54730",
    color:"#d4d0c8", borderRadius:6, padding:"10px 14px", fontSize:13,
    fontFamily:"'DM Mono', monospace", resize:"vertical", boxSizing:"border-box",
  },
  managerGrid: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 },
  jobPool: {
    background:"#141414", border:"1px solid #ffffff10", borderRadius:8,
    overflow:"hidden", maxHeight:600, overflowY:"auto",
  },
  poolHeader: {
    padding:"10px 14px", background:"#1a1a1a", borderBottom:"1px solid #ffffff10",
    fontSize:10, letterSpacing:2, color:"#555", textTransform:"uppercase",
    position:"sticky", top:0,
  },
  poolJob: {
    display:"flex", alignItems:"center", justifyContent:"space-between",
    padding:"10px 14px", borderBottom:"1px solid #ffffff08", gap:10,
  },
  poolJobLeft: { display:"flex", alignItems:"center", gap:8, flex:1 },
  poolJobCustomer: { fontSize:13, fontWeight:600, color:"#d4d0c8" },
  poolJobProduct: { fontSize:11, color:"#555" },
  poolBtns: { display:"flex", gap:6, flexShrink:0 },
  poolAssignBtn: {
    padding:"4px 10px", background:"transparent", border:"1px solid",
    borderRadius:4, cursor:"pointer", fontSize:11, fontWeight:700,
  },
  assignedTick: { fontSize:11, color:"#4ec9a0", flexShrink:0 },
  runsheetCols: { display:"flex", flexDirection:"column", gap:16 },
  runsheetCol: {
    background:"#141414", border:"1px solid #ffffff10", borderRadius:8, overflow:"hidden",
  },
  runsheetColHeader: {
    padding:"10px 14px", background:"#1a1a1a",
    borderBottom:"1px solid #ffffff10", borderLeft:"3px solid",
    display:"flex", justifyContent:"space-between", alignItems:"center",
    fontSize:11, fontWeight:800, letterSpacing:2, textTransform:"uppercase",
  },
  runsheetEmpty: { padding:"20px 14px", fontSize:12, color:"#333", textAlign:"center" },
  runsheetJob: {
    display:"flex", alignItems:"center", gap:10,
    padding:"10px 14px", borderBottom:"1px solid #ffffff08",
  },
  runsheetJobSeq: { display:"flex", alignItems:"center", gap:6, flexShrink:0 },
  runsheetJobCustomer: { fontSize:13, fontWeight:600, color:"#d4d0c8" },
  runsheetJobProduct: { fontSize:11, color:"#555", marginBottom:3 },
  nudgeBtn: {
    background:"#ffffff08", border:"none", color:"#555", cursor:"pointer",
    fontSize:9, padding:"1px 4px", borderRadius:2, lineHeight:1.5,
  },
  removeBtn: {
    background:"transparent", border:"none", color:"#444",
    cursor:"pointer", fontSize:14, padding:"2px 6px", flexShrink:0,
  },
};

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = {
  root: {
    minHeight:"100vh", background:"#0d0d0d", color:"#f0ede8",
    fontFamily:"'DM Mono', 'Courier New', monospace",
    position:"relative", overflow:"hidden",
  },
  bgGrid: {
    position:"fixed", inset:0, zIndex:0,
    backgroundImage:`linear-gradient(#ffffff08 1px, transparent 1px),
                     linear-gradient(90deg, #ffffff08 1px, transparent 1px)`,
    backgroundSize:"40px 40px",
    pointerEvents:"none",
  },
  notification: {
    position:"fixed", top:20, left:"50%", transform:"translateX(-50%)",
    padding:"10px 24px", borderRadius:6, color:"#0d0d0d",
    fontWeight:700, fontSize:13, zIndex:1000, letterSpacing:1,
  },
  header: {
    position:"relative", zIndex:10,
    display:"flex", alignItems:"center", justifyContent:"space-between",
    padding:"16px 24px", borderBottom:"1px solid #ffffff15",
    background:"#0d0d0dcc", backdropFilter:"blur(12px)",
    flexWrap:"wrap", gap:12,
  },
  headerLeft: { display:"flex", alignItems:"center" },
  logo: { display:"flex", alignItems:"center", gap:14 },
  logoMark: {
    width:42, height:42, background:"#e8c547", color:"#0d0d0d",
    display:"flex", alignItems:"center", justifyContent:"center",
    fontWeight:900, fontSize:16, letterSpacing:1,
    clipPath:"polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
  },
  logoTitle: { fontSize:16, fontWeight:800, letterSpacing:3, color:"#f0ede8" },
  logoSub: { fontSize:10, letterSpacing:4, color:"#e8c547", marginTop:1 },
  roleBar: { display:"flex", gap:6, flexWrap:"wrap" },
  roleBtn: {
    padding:"6px 14px", border:"1px solid #ffffff20", borderRadius:4,
    background:"transparent", color:"#888", cursor:"pointer",
    display:"flex", flexDirection:"column", alignItems:"center",
    fontSize:12, transition:"all 0.15s", gap:1,
  },
  roleName: { fontWeight:700, fontSize:13 },
  roleDesc: { fontSize:10, opacity:0.7 },
  addBtn: {
    padding:"8px 18px", background:"#e8c547", color:"#0d0d0d",
    border:"none", borderRadius:4, fontWeight:800, cursor:"pointer",
    fontSize:13, letterSpacing:1,
  },
  statsBar: {
    position:"relative", zIndex:10,
    display:"flex", gap:0, borderBottom:"1px solid #ffffff15",
  },
  stat: {
    flex:1, padding:"12px 20px", borderRight:"1px solid #ffffff10",
    display:"flex", flexDirection:"column", alignItems:"center",
  },
  statValue: { fontSize:28, fontWeight:800, lineHeight:1 },
  statLabel: { fontSize:10, color:"#555", letterSpacing:1, marginTop:4, textTransform:"uppercase" },
  toolbar: {
    position:"relative", zIndex:10,
    display:"flex", justifyContent:"space-between", alignItems:"center",
    padding:"10px 24px", borderBottom:"1px solid #ffffff10",
  },
  filters: { display:"flex", gap:10 },
  select: {
    background:"#1a1a1a", border:"1px solid #ffffff20", color:"#d4d0c8",
    padding:"6px 12px", borderRadius:4, fontSize:12, cursor:"pointer",
  },
  viewToggle: { display:"flex", gap:4 },
  viewBtn: {
    padding:"6px 14px", background:"transparent", border:"1px solid #ffffff20",
    color:"#666", borderRadius:4, cursor:"pointer", fontSize:12,
  },
  viewBtnActive: { background:"#ffffff15", color:"#f0ede8", borderColor:"#ffffff40" },
  main: {
    position:"relative", zIndex:10,
    padding:"20px 24px", overflowX:"auto",
  },
  // Board
  boardGrid: {
    display:"grid", gridTemplateColumns:"repeat(4,1fr)",
    gap:16, minWidth:900,
  },
  boardCol: {
    background:"#141414", border:"1px solid #ffffff10",
    borderRadius:8, overflow:"hidden", minHeight:400,
  },
  boardColHeader: {
    padding:"12px 16px", background:"#1a1a1a",
    borderBottom:"1px solid #ffffff10",
    display:"flex", justifyContent:"space-between",
    fontSize:11, fontWeight:700, letterSpacing:2, textTransform:"uppercase", color:"#888",
  },
  boardCount: {
    background:"#ffffff15", borderRadius:10, padding:"1px 8px",
    fontSize:11, color:"#f0ede8",
  },
  boardColBody: { padding:10, display:"flex", flexDirection:"column", gap:8 },
  emptyCol: { padding:20, textAlign:"center", color:"#333", fontSize:12 },
  // Card
  card: {
    background:"#1e1e1e", border:"1px solid #ffffff10", borderRadius:6,
    padding:12, cursor:"pointer", transition:"all 0.15s",
    userSelect:"none",
  },
  cardRush: { borderLeft:"3px solid #ff9f43" },
  cardDragOver: { background:"#e8c54710", borderColor:"#e8c547" },
  cardTop: { display:"flex", gap:6, alignItems:"center", marginBottom:8, flexWrap:"wrap" },
  priorityBadge: {
    fontSize:10, fontWeight:700, color:"#555",
    background:"#ffffff08", padding:"1px 6px", borderRadius:3,
  },
  rushBadge: {
    fontSize:10, fontWeight:800, background:"#ff9f4322",
    color:"#ff9f43", padding:"2px 7px", borderRadius:3, letterSpacing:1,
  },
  depositBadge: {
    fontSize:10, background:"#f79e7e22", color:"#f79e7e",
    padding:"2px 7px", borderRadius:3,
  },
  typeBadge: {
    fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:3,
    marginLeft:"auto",
  },
  cardCustomer: { fontWeight:700, fontSize:14, color:"#f0ede8", marginBottom:2 },
  cardProduct: { fontSize:12, color:"#666", marginBottom:10 },
  cardStep: {
    display:"flex", alignItems:"center", gap:6,
    background:"#ffffff08", borderRadius:4, padding:"5px 8px", marginBottom:8,
  },
  stepIcon: { fontSize:14 },
  stepLabel: { fontSize:12, color:"#d4d0c8" },
  progressBar: {
    height:3, background:"#ffffff10", borderRadius:2, marginBottom:8, overflow:"hidden",
  },
  progressFill: { height:"100%", borderRadius:2, transition:"width 0.4s" },
  dueDate: { fontSize:11, fontWeight:600, marginBottom:6 },
  assignedTag: {
    display:"flex", alignItems:"center", gap:6,
    fontSize:11, color:"#666", marginBottom:8,
  },
  assignedDot: { width:7, height:7, borderRadius:"50%", display:"inline-block" },
  cardActions: { marginTop:4 },
  advanceBtn: {
    width:"100%", padding:"6px", background:"#e8c54720",
    border:"1px solid #e8c54760", color:"#e8c547",
    borderRadius:4, cursor:"pointer", fontSize:11, fontWeight:700,
    letterSpacing:0.5,
  },
  // List
  listView: {
    background:"#141414", border:"1px solid #ffffff10",
    borderRadius:8, overflow:"hidden",
  },
  listHeader: {
    display:"flex", gap:10, padding:"10px 16px",
    background:"#1a1a1a", borderBottom:"1px solid #ffffff10",
    fontSize:11, letterSpacing:1, textTransform:"uppercase", color:"#555",
    alignItems:"center",
  },
  listRow: {
    display:"flex", gap:10, padding:"12px 16px",
    borderBottom:"1px solid #ffffff08", alignItems:"center",
    transition:"background 0.1s", cursor:"default",
  },
  assignSelect: {
    background:"#1a1a1a", border:"1px solid #ffffff20",
    color:"#d4d0c8", padding:"4px 8px", borderRadius:4, fontSize:11,
  },
  advanceBtnSm: {
    padding:"4px 10px", background:"#e8c54720",
    border:"1px solid #e8c54760", color:"#e8c547",
    borderRadius:4, cursor:"pointer", fontSize:11, fontWeight:700,
  },
  // Modal
  modalOverlay: {
    position:"fixed", inset:0, background:"#000000cc",
    display:"flex", alignItems:"center", justifyContent:"center",
    zIndex:100, padding:20,
  },
  modal: {
    background:"#141414", border:"1px solid #ffffff20",
    borderRadius:10, padding:28, width:"100%", maxWidth:680,
    maxHeight:"90vh", overflowY:"auto",
    boxShadow:"0 30px 80px #000000cc",
  },
  modalHeader: {
    display:"flex", justifyContent:"space-between", alignItems:"flex-start",
    marginBottom:20,
  },
  modalOrderNum: { fontSize:11, color:"#e8c547", letterSpacing:2, marginBottom:4 },
  modalCustomer: { fontSize:22, fontWeight:800, color:"#f0ede8", marginBottom:4 },
  modalProduct: { fontSize:14, color:"#666" },
  closeBtn: {
    background:"#ffffff10", border:"none", color:"#888",
    width:30, height:30, borderRadius:4, cursor:"pointer", fontSize:14,
  },
  // Timeline
  timeline: {
    display:"flex", alignItems:"flex-start", gap:0,
    marginBottom:24, overflowX:"auto", paddingBottom:8,
  },
  timelineStep: { display:"flex", flexDirection:"column", alignItems:"center", minWidth:70 },
  timelineDot: {
    width:32, height:32, borderRadius:"50%",
    display:"flex", alignItems:"center", justifyContent:"center",
    fontSize:14, zIndex:1, flexShrink:0,
  },
  timelineLine: { height:2, width:38, marginTop:14, flexShrink:0 },
  timelineLabel: { fontSize:10, marginTop:6, textAlign:"center", lineHeight:1.3, maxWidth:65 },
  // Detail
  detailGrid: {
    display:"grid", gridTemplateColumns:"1fr 1fr 1fr",
    gap:12, marginBottom:16,
  },
  detailField: {
    background:"#1e1e1e", border:"1px solid #ffffff10",
    borderRadius:6, padding:"10px 14px",
  },
  detailLabel: { fontSize:10, color:"#555", letterSpacing:1, textTransform:"uppercase", marginBottom:4 },
  detailValue: { fontSize:14, fontWeight:600, color:"#d4d0c8" },
  notesBox: {
    background:"#1e1e1e", border:"1px solid #ffffff10",
    borderRadius:6, padding:"12px 14px", marginBottom:16,
  },
  notesLabel: { fontSize:10, color:"#555", letterSpacing:1, textTransform:"uppercase", marginBottom:6 },
  notesText: { fontSize:13, color:"#888", lineHeight:1.5 },
  modalActions: { display:"flex", gap:10, flexWrap:"wrap", marginBottom:14 },
  modalAdvanceBtn: {
    flex:1, padding:"10px", background:"#e8c547", color:"#0d0d0d",
    border:"none", borderRadius:6, fontWeight:800, cursor:"pointer",
    fontSize:13, letterSpacing:0.5,
  },
  modalSecBtn: {
    flex:1, padding:"10px", background:"#ffffff10", color:"#d4d0c8",
    border:"1px solid #ffffff20", borderRadius:6, fontWeight:600,
    cursor:"pointer", fontSize:13,
  },
  assignRow: {
    display:"flex", alignItems:"center", gap:8, flexWrap:"wrap",
  },
  assignLabel: { fontSize:12, color:"#555", marginRight:4 },
  assignBtn: {
    padding:"6px 14px", border:"1px solid", borderRadius:4,
    cursor:"pointer", fontSize:12, fontWeight:600,
  },
  // Form
  formLabel: { display:"flex", flexDirection:"column", gap:4 },
  formLabelText: { fontSize:11, color:"#555", letterSpacing:1, textTransform:"uppercase" },
  formInput: {
    background:"#1e1e1e", border:"1px solid #ffffff20", color:"#f0ede8",
    padding:"8px 12px", borderRadius:4, fontSize:13,
    fontFamily:"inherit",
  },
};
