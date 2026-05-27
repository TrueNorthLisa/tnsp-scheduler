import { useState, useEffect, useRef } from "react";

// ── Workflow definitions ──────────────────────────────────────────────────────
const WORKFLOW = {
  screenprint_new: [
    { id: "quote",        label: "Quote Sent",             icon: "📋", owner: "lisa" },
    { id: "approved",     label: "Estimate Approved",      icon: "✅", owner: "lisa" },
    { id: "deposit",      label: "Deposit Received",       icon: "💰", owner: "lisa" },
    { id: "blanks",       label: "Blanks Ordered",         icon: "📦", owner: "lisa" },
    { id: "print_forms",  label: "Print Production Forms", icon: "🖨️", owner: "lupe" },
    { id: "seps",         label: "Seps / Burn Folder",     icon: "🎨", owner: "brother" },
    { id: "burn",         label: "Screens Burned",         icon: "🔥", owner: "press_assist" },
    { id: "presscheck",   label: "Press Check",            icon: "👁",  owner: "lead_printer" },
    { id: "production",   label: "Full Production",        icon: "⚙️", owner: "lead_printer" },
    { id: "readyship",    label: "Ready to Ship",          icon: "📫", owner: "press_assist" },
    { id: "shipped",      label: "Shipped",                icon: "🚚", owner: "press_assist" },
    { id: "followup",     label: "Follow Up",              icon: "📞", owner: "lisa" },
  ],
  screenprint_reprint: [
    { id: "quote",        label: "Quote Sent",             icon: "📋", owner: "lisa" },
    { id: "approved",     label: "Estimate Approved",      icon: "✅", owner: "lisa" },
    { id: "deposit",      label: "Deposit Received",       icon: "💰", owner: "lisa" },
    { id: "blanks",       label: "Blanks Ordered",         icon: "📦", owner: "lisa" },
    { id: "print_forms",  label: "Print Production Forms", icon: "🖨️", owner: "lupe" },
    { id: "burn",         label: "Screens Burned",         icon: "🔥", owner: "press_assist" },
    { id: "production",   label: "Full Production",        icon: "⚙️", owner: "lead_printer" },
    { id: "readyship",    label: "Ready to Ship",          icon: "📫", owner: "press_assist" },
    { id: "shipped",      label: "Shipped",                icon: "🚚", owner: "press_assist" },
    { id: "followup",     label: "Follow Up",              icon: "📞", owner: "lisa" },
  ],
  embroidery: [
    { id: "quote",        label: "Quote Sent",             icon: "📋", owner: "lisa" },
    { id: "approved",     label: "Estimate Approved",      icon: "✅", owner: "lisa" },
    { id: "deposit",      label: "Deposit Received",       icon: "💰", owner: "lisa" },
    { id: "blanks",       label: "Blanks Ordered",         icon: "📦", owner: "lisa" },
    { id: "print_forms",  label: "Print Production Forms", icon: "🖨️", owner: "lupe" },
    { id: "digitizing",   label: "Sent to Harrison",       icon: "🧵", owner: "harrison" },
    { id: "sewout",       label: "Sew Out",                icon: "🪡", owner: "harrison" },
    { id: "production",   label: "Full Production",        icon: "⚙️", owner: "harrison" },
    { id: "readyship",    label: "Ready to Ship",          icon: "📫", owner: "press_assist" },
    { id: "shipped",      label: "Shipped",                icon: "🚚", owner: "press_assist" },
    { id: "followup",     label: "Follow Up",              icon: "📞", owner: "lisa" },
  ],
};

const JOB_TYPES = [
  { value: "screenprint_new",     label: "Screen Print – New" },
  { value: "screenprint_reprint", label: "Screen Print – Reprint" },
  { value: "embroidery",          label: "Embroidery" },
];

const ROLES = [
  { id: "lisa",         label: "Lisa",            color: "#e8c547", desc: "Office / Remote" },
  { id: "brother",      label: "Shop Manager",    color: "#4ec9a0", desc: "On-Site Manager" },
  { id: "lead_printer", label: "Lead Printer",    color: "#7eb8f7", desc: "Print Floor" },
  { id: "press_assist", label: "Press Assistant", color: "#f79e7e", desc: "Print Floor" },
  { id: "harrison",     label: "Harrison",        color: "#c084fc", desc: "Embroidery" },
  { id: "emb_assist",   label: "Emb Assistant",   color: "#34d399", desc: "Embroidery" },
  { id: "lupe",         label: "Lupe",            color: "#fb923c", desc: "Admin / Production" },
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
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, { method: "POST", headers: this.headers, body: JSON.stringify(data) });
    return r.json();
  },
  async update(table, data, match) {
    const params = Object.entries(match).map(([k,v])=>`${k}=eq.${encodeURIComponent(v)}`).join("&");
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, { method: "PATCH", headers: this.headers, body: JSON.stringify(data) });
    return r.json();
  },
  async upsert(table, data) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: "POST", headers: { ...this.headers, "Prefer": "resolution=merge-duplicates,return=representation" }, body: JSON.stringify(data),
    });
    return r.json();
  },
  poll(table, cb, interval = 5000) {
    const id = setInterval(async () => {
      const data = await this.select(table, "?order=priority.asc");
      if (!data?.error) cb(data);
    }, interval);
    return () => clearInterval(id);
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function dbToJob(r) {
  return {
    id:             r.id,
    jobNum:         r.job_num         || "",
    customer:       r.customer        || r.client || "",
    product:        r.product         || r.garment_style || "",
    qty:            r.qty             || 0,
    type:           r.type            || "screenprint_new",
    currentStep:    r.current_step    || "quote",
    stepOwner:      r.step_owner      || null,
    dueDate:        r.due_date        || "",
    urgency:        r.urgency         || "normal",
    priority:       r.priority        || 99,
    depositPaid:    r.deposit_paid    || false,
    assignedTo:     r.assigned_to     || null,
    notes:          r.notes           || "",
    mockupUrl:      r.mockup_url      || null,
    workOrderUrl:   r.work_order_url  || null,
    trackingNum:    r.tracking_num    || "",
    isPickup:       r.is_pickup       || false,
    archived:       r.archived        || false,
    approvalStatus: r.approval_status || "pending",
  };
}

function jobToDb(j) {
  return {
    job_num:        j.jobNum,
    customer:       j.customer,
    product:        j.product,
    qty:            j.qty,
    type:           j.type,
    current_step:   j.currentStep,
    step_owner:     j.stepOwner,
    due_date:       j.dueDate || null,
    urgency:        j.urgency,
    priority:       j.priority,
    deposit_paid:   j.depositPaid,
    assigned_to:    j.assignedTo,
    notes:          j.notes,
    tracking_num:   j.trackingNum,
    is_pickup:      j.isPickup,
    archived:       j.archived,
  };
}

function getStepIndex(job) {
  return (WORKFLOW[job.type] || WORKFLOW.screenprint_new).findIndex(s => s.id === job.currentStep);
}
function getStep(job) {
  return (WORKFLOW[job.type] || WORKFLOW.screenprint_new)[getStepIndex(job)];
}
function getNextStep(job) {
  const steps = WORKFLOW[job.type] || WORKFLOW.screenprint_new;
  return steps[getStepIndex(job) + 1] || null;
}
function progressPct(job) {
  const steps = WORKFLOW[job.type] || WORKFLOW.screenprint_new;
  return Math.round(((getStepIndex(job) + 1) / steps.length) * 100);
}
function daysUntil(dateStr) {
  if (!dateStr) return 999;
  return Math.ceil((new Date(dateStr) - new Date()) / 86400000);
}
function dueDateColor(dateStr) {
  const d = daysUntil(dateStr);
  if (d < 0)  return "#ff4d4d";
  if (d <= 3) return "#ff9f43";
  if (d <= 7) return "#e8c547";
  return "#4ec9a0";
}
function roleColor(roleId) { return ROLES.find(r => r.id === roleId)?.color || "#888"; }
function roleName(roleId)  { return ROLES.find(r => r.id === roleId)?.label || roleId; }

// Default step owner based on workflow
function defaultStepOwner(job, stepId) {
  const steps = WORKFLOW[job.type] || WORKFLOW.screenprint_new;
  return steps.find(s => s.id === stepId)?.owner || null;
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [jobs, setJobs]               = useState([]);
  const [loading, setLoading]         = useState(true);
  const [dbError, setDbError]         = useState(null);
  const [activeRole, setActiveRole]   = useState("lisa");
  const [view, setView]               = useState("board");
  const [selectedJob, setSelectedJob] = useState(null);
  const [filterUrgency, setFilterUrgency] = useState("all");
  const [filterType, setFilterType]   = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [notification, setNotification] = useState(null);
  const [dragOver, setDragOver]       = useState(null);
  const dragJob = useRef(null);
  const [todaySheet, setTodaySheet]   = useState({ lead_printer:[], press_assist:[], harrison:[], emb_assist:[], lupe:[] });
  const [todayNotes, setTodayNotes]   = useState("");
  const [history, setHistory]         = useState([]);

  const notify = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // ── Load jobs ──
  const loadJobs = async () => {
    const data = await sb.select("jobs", "?order=priority.asc");
    if (data?.error) { setDbError(data.error.message); setLoading(false); return; }
    setJobs((data || []).map(dbToJob));
    setLoading(false);
  };

  const loadRunsheet = async () => {
    const today = new Date().toISOString().slice(0,10);
    const data  = await sb.select("runsheets", `?date=eq.${today}&order=id.desc&limit=1`);
    if (data?.[0]) {
      setTodaySheet({
        lead_printer: data[0].lead_printer || [],
        press_assist: data[0].press_assist || [],
        harrison:     data[0].harrison     || [],
        emb_assist:   data[0].emb_assist   || [],
      });
      setTodayNotes(data[0].manager_note || "");
    }
    const hist = await sb.select("runsheets", `?date=neq.${today}&order=date.desc&limit=30`);
    if (Array.isArray(hist)) setHistory(hist.map(r => ({
      date: r.date, notes: r.manager_note||"",
      lead_printer: r.lead_printer||[], press_assist: r.press_assist||[],
      harrison: r.harrison||[], emb_assist: r.emb_assist||[],
    })));
  };

  useEffect(() => {
    loadJobs();
    loadRunsheet();
    const stop = sb.poll("jobs", data => setJobs((data||[]).map(dbToJob)));
    return stop;
  }, []);

  const todayKey = new Date().toISOString().slice(0,10);
  useEffect(() => {
    const last = localStorage.getItem("tnsp_last_reset");
    if (last && last !== todayKey) setTodaySheet({ lead_printer:[], press_assist:[], harrison:[], emb_assist:[], lupe:[] });
    localStorage.setItem("tnsp_last_reset", todayKey);
  }, []);

  // ── Runsheet persistence ──
  const saveRunsheet = async (sheet, notes) => {
    await sb.upsert("runsheets", {
      date: todayKey, manager_note: notes, created_by: activeRole,
      lead_printer: sheet.lead_printer, press_assist: sheet.press_assist,
      harrison: sheet.harrison||[], emb_assist: sheet.emb_assist||[],
    });
  };
  const updateTodaySheet = s => { setTodaySheet(s); saveRunsheet(s, todayNotes); };
  const updateTodayNotes = n => { setTodayNotes(n); saveRunsheet(todaySheet, n); };

  // ── Advance job step ──
  const advanceJob = async (jobId, extraData = {}) => {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;
    const next = getNextStep(job);
    if (!next) return;
    const nextOwner = defaultStepOwner(job, next.id);
    const updates = { current_step: next.id, step_owner: nextOwner, ...extraData };
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, currentStep: next.id, stepOwner: nextOwner, ...extraData } : j));
    notify(`${job.customer} → ${next.label}`);
    await sb.update("jobs", updates, { id: jobId });
    await sb.insert("job_history", { job_id: jobId, from_step: job.currentStep, to_step: next.id, changed_by: activeRole });
  };

  // ── Step back ──
  const stepBackJob = async (jobId) => {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;
    const steps = WORKFLOW[job.type] || WORKFLOW.screenprint_new;
    const idx = steps.findIndex(s => s.id === job.currentStep);
    if (idx <= 0) return;
    const prev = steps[idx - 1];
    const prevOwner = defaultStepOwner(job, prev.id);
    setJobs(js => js.map(j => j.id === jobId ? { ...j, currentStep: prev.id, stepOwner: prevOwner, trackingNum: "", isPickup: false } : j));
    notify(`${job.customer} ← moved back to ${prev.label}`);
    await sb.update("jobs", { current_step: prev.id, step_owner: prevOwner, tracking_num: null, is_pickup: false }, { id: jobId });
    await sb.insert("job_history", { job_id: jobId, from_step: job.currentStep, to_step: prev.id, changed_by: activeRole, note: "stepped back" });
  };

  // ── Archive job ──
  const archiveJob = async (jobId) => {
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, archived: true } : j));
    notify("Job archived ✓");
    await sb.update("jobs", { archived: true }, { id: jobId });
    await sb.insert("job_history", { job_id: jobId, from_step: "followup", to_step: "archived", changed_by: activeRole });
  };

  const toggleDeposit  = async (jobId) => {
    const job = jobs.find(j=>j.id===jobId);
    const v = !job.depositPaid;
    setJobs(prev=>prev.map(j=>j.id===jobId?{...j,depositPaid:v}:j));
    notify("Deposit status updated");
    await sb.update("jobs",{deposit_paid:v},{id:jobId});
  };
  const toggleUrgency  = async (jobId) => {
    const job = jobs.find(j=>j.id===jobId);
    const v = job.urgency==="rush"?"normal":"rush";
    setJobs(prev=>prev.map(j=>j.id===jobId?{...j,urgency:v}:j));
    await sb.update("jobs",{urgency:v},{id:jobId});
  };
  const updateAssign   = async (jobId, person) => {
    setJobs(prev=>prev.map(j=>j.id===jobId?{...j,assignedTo:person}:j));
    notify(`Assigned to ${roleName(person)}`);
    await sb.update("jobs",{assigned_to:person},{id:jobId});
  };
  const updateNotes    = async (jobId, notes) => {
    setJobs(prev=>prev.map(j=>j.id===jobId?{...j,notes}:j));
    notify("Notes updated");
    await sb.update("jobs",{notes},{id:jobId});
  };

  // ── Full job update ──
  const updateJob = async (jobId, updates) => {
    const dbUpdates = {
      job_num:      updates.jobNum,
      customer:     updates.customer,
      client:       updates.customer,
      product:      updates.product,
      garment_style:updates.product,
      qty:          updates.qty,
      type:         updates.type,
      current_step: updates.currentStep,
      step_owner:   defaultStepOwner({type:updates.type}, updates.currentStep),
      due_date:     updates.dueDate || null,
      urgency:      updates.urgency,
      deposit_paid: updates.depositPaid,
      assigned_to:  updates.assignedTo,
      notes:        updates.notes,
    };
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, ...updates, stepOwner: defaultStepOwner({type:updates.type}, updates.currentStep) } : j));
    notify("Job updated ✓");
    await sb.update("jobs", dbUpdates, { id: jobId });
  };
  const handleDragStart = id => { dragJob.current = id; };
  const handleDrop = async targetId => {
    if (!dragJob.current || dragJob.current === targetId) return;
    const sorted = [...jobs].sort((a,b)=>a.priority-b.priority);
    const fi = sorted.findIndex(j=>j.id===dragJob.current);
    const ti = sorted.findIndex(j=>j.id===targetId);
    const moved = sorted.splice(fi,1)[0];
    sorted.splice(ti,0,moved);
    const reordered = sorted.map((j,i)=>({...j,priority:i+1}));
    setJobs(reordered); setDragOver(null); dragJob.current = null;
    await Promise.all(reordered.map(j=>sb.update("jobs",{priority:j.priority},{id:j.id})));
  };

  const addJob = async job => {
    const maxP = jobs.length > 0 ? Math.max(...jobs.map(j=>j.priority)) : 0;
    const newJob = { ...job, priority: maxP+1, stepOwner: defaultStepOwner(job, job.currentStep) };
    const [created] = await sb.insert("jobs", jobToDb(newJob));
    if (created) { setJobs(prev=>[...prev, dbToJob(created)]); notify(`${job.customer} added`); }
  };

  const resetRunsheet = async () => {
    const hasJobs = Object.values(todaySheet).flat().length > 0;
    if (hasJobs) setHistory(prev=>[{date:todayKey, notes:todayNotes, ...todaySheet}, ...prev]);
    const empty = { lead_printer:[], press_assist:[], harrison:[], emb_assist:[], lupe:[] };
    setTodaySheet(empty); setTodayNotes("");
    await saveRunsheet(empty, "");
    notify("Runsheet cleared");
  };

  // ── Role-based filtering ──
  const activeJobs = jobs.filter(j => !j.archived);
  const archivedJobs = jobs.filter(j => j.archived);

  const FLOOR_ROLES = ["lead_printer","press_assist","harrison","emb_assist","lupe"];

  const visibleJobs = activeJobs
    .filter(j => filterUrgency==="all" || j.urgency===filterUrgency)
    .filter(j => filterType==="all" || j.type===filterType)
    .filter(j => {
      switch(activeRole) {
        case "lisa":
          // Only jobs where Lisa owns the current step
          return j.stepOwner==="lisa";
        case "brother":
          // Floor team's jobs + his own (seps)
          return j.stepOwner==="brother" || FLOOR_ROLES.includes(j.assignedTo) || FLOOR_ROLES.includes(j.stepOwner);
        case "harrison":
          return j.type==="embroidery" && (j.assignedTo==="harrison" || j.stepOwner==="harrison");
        case "emb_assist":
          return j.type==="embroidery" && (j.assignedTo==="emb_assist" || j.stepOwner==="emb_assist");
        case "lead_printer":
          return j.type!=="embroidery" && (j.assignedTo==="lead_printer" || j.stepOwner==="lead_printer");
        case "press_assist":
          return j.type!=="embroidery" && (j.assignedTo==="press_assist" || j.stepOwner==="press_assist");
        case "lupe":
          return j.stepOwner==="lupe" || j.currentStep==="print_forms";
        default:
          return j.assignedTo===activeRole || j.stepOwner===activeRole;
      }
    })
    .sort((a,b)=>a.priority-b.priority);

  // Stats
  const rushJobs    = activeJobs.filter(j=>j.urgency==="rush").length;
  const overdueJobs = activeJobs.filter(j=>j.dueDate&&daysUntil(j.dueDate)<0).length;
  const dueThisWeek = activeJobs.filter(j=>{if(!j.dueDate)return false;const d=daysUntil(j.dueDate);return d>=0&&d<=7;}).length;
  const noDeposit   = activeJobs.filter(j=>!j.depositPaid&&j.currentStep!=="quote").length;
  const myTasks     = activeRole==="lisa" ? activeJobs.filter(j=>j.stepOwner==="lisa").length : 0;

  if (loading) return (
    <div style={{minHeight:"100vh",background:"#0d0d0d",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16}}>
      <div style={{width:42,height:42,background:"#e8c547",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:16,clipPath:"polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)"}}>TN</div>
      <div style={{color:"#555",fontSize:13,letterSpacing:2}}>LOADING…</div>
    </div>
  );
  if (dbError) return (
    <div style={{minHeight:"100vh",background:"#0d0d0d",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12,padding:40}}>
      <div style={{color:"#ff4d4d",fontSize:16,fontWeight:700}}>Database error</div>
      <div style={{color:"#555",fontSize:13,maxWidth:400,textAlign:"center"}}>{dbError}</div>
      <button style={{padding:"8px 20px",background:"#e8c547",color:"#0d0d0d",border:"none",borderRadius:4,fontWeight:700,cursor:"pointer"}} onClick={loadJobs}>Retry</button>
    </div>
  );

  return (
    <div style={S.root}>
      <div style={S.bgGrid} />
      {notification && <div style={{...S.notification, background: notification.type==="error"?"#ff4d4d":"#4ec9a0"}}>{notification.msg}</div>}

      {/* Header */}
      <header style={S.header}>
        <div style={S.logo}>
          <div style={S.logoMark}>TN</div>
          <div>
            <div style={S.logoTitle}>TRUE NORTH</div>
            <div style={S.logoSub}>PRODUCTION BOARD</div>
            <div style={{fontSize:9,color:"#4ec9a0",letterSpacing:1,marginTop:1}}>● LIVE SYNC</div>
          </div>
        </div>
        <div style={S.roleBar}>
          {ROLES.map(r=>(
            <button key={r.id} style={{...S.roleBtn,...(activeRole===r.id?{background:r.color,color:"#0d0d0d"}:{})}}
              onClick={()=>setActiveRole(r.id)}>
              <span style={S.roleName}>{r.label}</span>
              <span style={S.roleDesc}>{r.desc}</span>
            </button>
          ))}
        </div>
        <button style={S.addBtn} onClick={()=>setShowAddModal(true)}>+ New Job</button>
      </header>

      {/* Stats */}
      <div style={S.statsBar}>
        {[
          {label:"Active Jobs",   value:activeJobs.length, color:"#7eb8f7"},
          {label:"Rush",          value:rushJobs,          color:"#ff9f43"},
          {label:"Due This Week", value:dueThisWeek,       color:"#e8c547"},
          {label:"Overdue",       value:overdueJobs,       color:"#ff4d4d"},
          {label:"⚠ No Deposit",  value:noDeposit,         color:"#f79e7e"},
          ...(activeRole==="lisa"?[{label:"My Tasks", value:myTasks, color:"#e8c547"}]:[]),
        ].map(s=>(
          <div key={s.label} style={S.stat}>
            <div style={{...S.statValue,color:s.color}}>{s.value}</div>
            <div style={S.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={S.toolbar}>
        <div style={S.filters}>
          <select style={S.select} value={filterUrgency} onChange={e=>setFilterUrgency(e.target.value)}>
            <option value="all">All Urgency</option>
            <option value="rush">Rush Only</option>
            <option value="normal">Normal Only</option>
          </select>
          <select style={S.select} value={filterType} onChange={e=>setFilterType(e.target.value)}>
            <option value="all">All Types</option>
            {JOB_TYPES.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div style={S.viewToggle}>
          {[
            {id:"board",    label:"⬛ Board"},
            {id:"list",     label:"☰ List"},
            {id:"overview", label:"🔭 Overview"},
            {id:"today",    label:"📋 Today"},
            {id:"admin",    label:"🗂 Admin"},
            {id:"archive",  label:"📁 Archive"},
          ].map(v=>(
            <button key={v.id} style={{...S.viewBtn,...(view===v.id?S.viewBtnActive:{})}}
              onClick={()=>setView(v.id)}>{v.label}</button>
          ))}
        </div>
      </div>

      {/* Main */}
      <main style={S.main}>
        {view==="board"    && <BoardView jobs={visibleJobs} activeRole={activeRole} onAdvance={advanceJob} onArchive={archiveJob} onToggleDeposit={toggleDeposit} onToggleUrgency={toggleUrgency} onAssign={updateAssign} onSelect={j=>{setSelectedJob(j);setView("detail");}} dragOver={dragOver} setDragOver={setDragOver} onDragStart={handleDragStart} onDrop={handleDrop} />}
        {view==="list"     && <ListView  jobs={visibleJobs} activeRole={activeRole} onAdvance={advanceJob} onArchive={archiveJob} onToggleDeposit={toggleDeposit} onToggleUrgency={toggleUrgency} onAssign={updateAssign} onSelect={j=>{setSelectedJob(j);setView("detail");}} dragOver={dragOver} setDragOver={setDragOver} onDragStart={handleDragStart} onDrop={handleDrop} />}
        {view==="overview" && <OverviewView jobs={activeJobs} onSelect={j=>{setSelectedJob(j);setView("detail");}} />}
        {view==="today"    && <TodayView jobs={activeJobs} activeRole={activeRole} todaySheet={todaySheet} setTodaySheet={updateTodaySheet} todayNotes={todayNotes} setTodayNotes={updateTodayNotes} onAdvance={advanceJob} onSelect={j=>{setSelectedJob(j);setView("detail");}} onReset={resetRunsheet} history={history} notify={notify} />}
        {view==="admin"    && <AdminView jobs={activeJobs} activeRole={activeRole} onAdvance={advanceJob} onSelect={j=>{setSelectedJob(j);setView("detail");}} notify={notify} />}
        {view==="archive"  && <ArchiveView jobs={archivedJobs} onSelect={j=>{setSelectedJob(j);setView("detail");}} />}
      </main>

      {view==="detail" && selectedJob && (
        <DetailModal job={jobs.find(j=>j.id===selectedJob.id)||selectedJob}
          activeRole={activeRole} onAdvance={advanceJob} onArchive={archiveJob}
          onStepBack={stepBackJob} onUpdateJob={updateJob}
          onToggleDeposit={toggleDeposit} onToggleUrgency={toggleUrgency}
          onAssign={updateAssign} onUpdateNotes={updateNotes}
          onClose={()=>{setView(selectedJob.archived?"archive":"board");setSelectedJob(null);}} />
      )}
      {showAddModal && <AddJobModal onAdd={j=>{addJob(j);setShowAddModal(false);}} onClose={()=>setShowAddModal(false)} />}
    </div>
  );
}

// ── Board View ────────────────────────────────────────────────────────────────
function BoardView({ jobs, activeRole, onAdvance, onArchive, onToggleDeposit, onToggleUrgency, onAssign, onSelect, dragOver, setDragOver, onDragStart, onDrop }) {
  const buckets = [
    { key:"pre",        label:"Pre-Production",  steps:["quote","approved","deposit","blanks"] },
    { key:"artwork",    label:"Artwork / Setup",  steps:["seps","burn","digitizing"] },
    { key:"production", label:"Production",       steps:["presscheck","sewout","production"] },
    { key:"outgoing",   label:"Outgoing",         steps:["readyship","shipped","followup"] },
  ];
  return (
    <div style={S.boardGrid}>
      {buckets.map(bucket=>{
        const bJobs = jobs.filter(j=>bucket.steps.includes(j.currentStep));
        return (
          <div key={bucket.key} style={S.boardCol}>
            <div style={S.boardColHeader}>
              <span>{bucket.label}</span>
              <span style={S.boardCount}>{bJobs.length}</span>
            </div>
            <div style={S.boardColBody}>
              {bJobs.length===0 && <div style={S.emptyCol}>No jobs here</div>}
              {bJobs.map(job=>(
                <JobCard key={job.id} job={job} activeRole={activeRole}
                  onAdvance={onAdvance} onArchive={onArchive} onToggleDeposit={onToggleDeposit}
                  onToggleUrgency={onToggleUrgency} onAssign={onAssign} onSelect={onSelect}
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

// ── List View ─────────────────────────────────────────────────────────────────
function ListView({ jobs, activeRole, onAdvance, onArchive, onToggleDeposit, onToggleUrgency, onAssign, onSelect, dragOver, setDragOver, onDragStart, onDrop }) {
  return (
    <div style={S.listView}>
      <div style={S.listHeader}>
        <span style={{width:36}}>#</span>
        <span style={{flex:2}}>Customer / Product</span>
        <span style={{flex:1}}>Type</span>
        <span style={{flex:1.5}}>Current Step</span>
        <span style={{flex:1}}>Due</span>
        <span style={{flex:1}}>Assigned</span>
        <span style={{flex:1}}>Actions</span>
      </div>
      {jobs.map(job=>(
        <ListRow key={job.id} job={job} activeRole={activeRole}
          onAdvance={onAdvance} onArchive={onArchive} onToggleDeposit={onToggleDeposit}
          onToggleUrgency={onToggleUrgency} onAssign={onAssign} onSelect={onSelect}
          isDragOver={dragOver===job.id}
          onDragStart={()=>onDragStart(job.id)}
          onDragOver={e=>{e.preventDefault();setDragOver(job.id);}}
          onDrop={()=>onDrop(job.id)} />
      ))}
    </div>
  );
}

// ── Archive View ──────────────────────────────────────────────────────────────
function ArchiveView({ jobs, onSelect }) {
  const [search, setSearch] = useState("");
  const filtered = jobs.filter(j =>
    !search || [j.customer,j.product,j.jobNum].some(v=>v?.toLowerCase().includes(search.toLowerCase()))
  );
  return (
    <div style={{maxWidth:1100,margin:"0 auto"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div>
          <div style={{fontSize:11,color:"#555",letterSpacing:2,textTransform:"uppercase"}}>Completed Jobs</div>
          <div style={{fontSize:20,fontWeight:800,letterSpacing:3,color:"#f0ede8"}}>ARCHIVE</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <input style={{...S.select,padding:"8px 14px",width:260}} placeholder="Search by customer, product, job #…"
            value={search} onChange={e=>setSearch(e.target.value)} />
          <span style={{fontSize:12,color:"#555"}}>{filtered.length} jobs</span>
        </div>
      </div>
      {filtered.length===0 && (
        <div style={{textAlign:"center",padding:"60px 0",color:"#333"}}>
          {search ? "No matching archived jobs" : "No archived jobs yet"}
        </div>
      )}
      <div style={S.listView}>
        {filtered.map(job=>{
          const dc = dueDateColor(job.dueDate);
          return (
            <div key={job.id} style={{...S.listRow,opacity:0.7,cursor:"pointer"}} onClick={()=>onSelect(job)}>
              <span style={{width:36,fontSize:11,color:"#555"}}>#{job.priority}</span>
              <span style={{flex:2}}>
                <div style={{fontWeight:600,color:"#888"}}>{job.customer} {job.jobNum&&<span style={{fontSize:11,color:"#555",marginLeft:6}}>#{job.jobNum}</span>}</div>
                <div style={{fontSize:12,color:"#444"}}>{job.product} · {job.qty} pcs</div>
              </span>
              <span style={{flex:1,fontSize:12,color:"#555"}}>{JOB_TYPES.find(t=>t.value===job.type)?.label}</span>
              <span style={{flex:1.5,fontSize:13,color:"#4ec9a0"}}>✓ Archived</span>
              <span style={{flex:1,fontSize:12,color:"#444"}}>{job.dueDate}</span>
              <span style={{flex:1,fontSize:12,color:"#444"}}>{roleName(job.assignedTo)||"—"}</span>
              <span style={{flex:1}}><button style={{...S.advanceBtnSm,color:"#555",borderColor:"#333"}} onClick={e=>{e.stopPropagation();onSelect(job);}}>View</button></span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Job Card ──────────────────────────────────────────────────────────────────
function JobCard({ job, activeRole, onAdvance, onArchive, onToggleDeposit, onToggleUrgency, onAssign, onSelect, isDragOver, onDragStart, onDragOver, onDrop }) {
  const step = getStep(job);
  const next = getNextStep(job);
  const pct  = progressPct(job);
  const dc   = dueDateColor(job.dueDate);
  const days = daysUntil(job.dueDate);
  const isManager = activeRole==="lisa"||activeRole==="brother";

  return (
    <div style={{...S.card,...(isDragOver?S.cardDragOver:{}),...(job.urgency==="rush"?S.cardRush:{})}}
      draggable onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop}
      onClick={()=>onSelect(job)}>

      <div style={S.cardTop}>
        <span style={S.priorityBadge}>#{job.priority}</span>
        {job.jobNum && <span style={S.jobNumBadge}>#{job.jobNum}</span>}
        {job.urgency==="rush" && <span style={S.rushBadge}>RUSH</span>}
        {!job.depositPaid && <span style={S.depositBadge}>💰</span>}
        <span style={{...S.typeBadge,background:job.type==="embroidery"?"#7eb8f720":"#f79e7e20",color:job.type==="embroidery"?"#7eb8f7":"#f79e7e"}}>
          {job.type==="embroidery"?"EMB":"SP"}
        </span>
      </div>

      <div style={S.cardCustomer}>{job.customer}</div>
      <div style={S.cardProduct}>{job.product} · {job.qty} pcs</div>

      <div style={S.cardStep}>
        <span>{step?.icon}</span>
        <span style={S.stepLabel}>{step?.label}</span>
        {step?.owner && <span style={{...S.stepOwnerTag,color:roleColor(step.owner)}}>→ {roleName(step.owner)}</span>}
      </div>

      <div style={S.progressBar}><div style={{...S.progressFill,width:`${pct}%`,background:pct===100?"#4ec9a0":job.urgency==="rush"?"#ff9f43":"#e8c547"}} /></div>

      <div style={{...S.dueDate,color:dc}}>
        {days<0?`⚠ ${Math.abs(days)}d overdue`:days===0?"Due today!":`Due in ${days}d · ${job.dueDate}`}
      </div>

      {job.assignedTo && <div style={S.assignedTag}><span style={{...S.assignedDot,background:roleColor(job.assignedTo)}} />{roleName(job.assignedTo)}</div>}

      {/* Mockup thumbnail if available */}
      {job.mockupUrl && <div style={S.mockupThumb}><img src={job.mockupUrl} alt="mockup" style={{width:"100%",borderRadius:4,objectFit:"cover",maxHeight:60}} /></div>}

      {isManager && (
        <div style={S.cardActions} onClick={e=>e.stopPropagation()}>
          <select style={S.cardAssignSelect} value={job.assignedTo||""} onChange={e=>onAssign(job.id,e.target.value)}>
            <option value="">Assign to…</option>
            {ROLES.filter(r=>r.id!=="lisa").map(r=><option key={r.id} value={r.id}>{r.label}</option>)}
          </select>
          {next && job.currentStep!=="readyship" && (
            <button style={S.advanceBtn} onClick={()=>onAdvance(job.id)}>→ {next.label}</button>
          )}
          {job.currentStep==="followup" && (
            <button style={{...S.advanceBtn,background:"#4ec9a022",borderColor:"#4ec9a060",color:"#4ec9a0"}}
              onClick={()=>onArchive(job.id)}>✓ Archive Job</button>
          )}
        </div>
      )}
    </div>
  );
}

// ── List Row ──────────────────────────────────────────────────────────────────
function ListRow({ job, activeRole, onAdvance, onArchive, onToggleDeposit, onToggleUrgency, onAssign, onSelect, isDragOver, onDragStart, onDragOver, onDrop }) {
  const step = getStep(job);
  const next = getNextStep(job);
  const dc   = dueDateColor(job.dueDate);
  const days = daysUntil(job.dueDate);
  const isManager = activeRole==="lisa"||activeRole==="brother";
  return (
    <div style={{...S.listRow,...(isDragOver?S.cardDragOver:{}),...(job.urgency==="rush"?{borderLeft:"3px solid #ff9f43"}:{borderLeft:"3px solid transparent"})}}
      draggable onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop}>
      <span style={{width:36,display:"flex",alignItems:"center"}}><span style={S.priorityBadge}>#{job.priority}</span></span>
      <span style={{flex:2,cursor:"pointer"}} onClick={()=>onSelect(job)}>
        <div style={{fontWeight:600,color:"#f0ede8"}}>{job.customer}{job.jobNum&&<span style={{fontSize:11,color:"#e8c547",marginLeft:8}}>#{job.jobNum}</span>}</div>
        <div style={{fontSize:12,color:"#888"}}>{job.product} · {job.qty} pcs</div>
      </span>
      <span style={{flex:1,fontSize:12,color:job.type==="embroidery"?"#7eb8f7":"#f79e7e"}}>{job.type==="embroidery"?"Embroidery":"Screen Print"}</span>
      <span style={{flex:1.5}}>
        <div style={{display:"flex",alignItems:"center",gap:6}}><span>{step?.icon}</span><span style={{fontSize:13,color:"#d4d0c8"}}>{step?.label}</span></div>
        {!job.depositPaid&&<div style={{fontSize:11,color:"#f79e7e"}}>⚠ Deposit pending</div>}
      </span>
      <span style={{flex:1,fontSize:13,color:dc}}>{days<0?`${Math.abs(days)}d over`:`${days}d`}<div style={{fontSize:11,color:"#666"}}>{job.dueDate}</div></span>
      <span style={{flex:1}} onClick={e=>e.stopPropagation()}>
        {isManager ? (
          <select style={S.assignSelect} value={job.assignedTo||""} onChange={e=>onAssign(job.id,e.target.value)}>
            <option value="">Unassigned</option>
            {ROLES.filter(r=>r.id!=="lisa").map(r=><option key={r.id} value={r.id}>{r.label}</option>)}
          </select>
        ) : <span style={{fontSize:13,color:roleColor(job.assignedTo)}}>{roleName(job.assignedTo)||"—"}</span>}
      </span>
      <span style={{flex:1,display:"flex",gap:6}} onClick={e=>e.stopPropagation()}>
        {next && isManager && job.currentStep!=="readyship" && <button style={S.advanceBtnSm} onClick={()=>onAdvance(job.id)}>→</button>}
        {job.currentStep==="followup" && isManager && <button style={{...S.advanceBtnSm,color:"#4ec9a0",borderColor:"#4ec9a060"}} onClick={()=>onArchive(job.id)}>✓</button>}
        <button style={{...S.advanceBtnSm,background:"#ffffff10"}} onClick={()=>onToggleUrgency(job.id)}>{job.urgency==="rush"?"🔥":"⬜"}</button>
      </span>
    </div>
  );
}

// ── Shipping Modal (for Ready to Ship → Shipped) ──────────────────────────────
function ShippingModal({ job, onConfirm, onClose }) {
  const [trackingNum, setTrackingNum] = useState("");
  const [isPickup, setIsPickup]       = useState(false);
  const canSubmit = isPickup || trackingNum.trim().length > 0;
  return (
    <div style={S.modalOverlay} onClick={onClose}>
      <div style={{...S.modal,maxWidth:460}} onClick={e=>e.stopPropagation()}>
        <div style={S.modalHeader}>
          <div style={S.modalCustomer}>Mark as Shipped</div>
          <button style={S.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={{color:"#666",fontSize:13,marginBottom:20}}>{job.customer} — {job.product}</div>

        <label style={{display:"flex",alignItems:"center",gap:10,marginBottom:16,cursor:"pointer"}}>
          <input type="checkbox" checked={isPickup} onChange={e=>setIsPickup(e.target.checked)} style={{width:16,height:16}} />
          <span style={{color:"#d4d0c8",fontSize:14}}>Customer pickup — no tracking needed</span>
        </label>

        {!isPickup && (
          <label style={S.formLabel}>
            <span style={S.formLabelText}>Tracking Number *</span>
            <input style={S.formInput} type="text" placeholder="e.g. 1Z999AA10123456784"
              value={trackingNum} onChange={e=>setTrackingNum(e.target.value)} />
          </label>
        )}

        <div style={{display:"flex",gap:10,marginTop:20}}>
          <button style={{...S.modalAdvanceBtn,opacity:canSubmit?1:0.4,cursor:canSubmit?"pointer":"not-allowed"}}
            disabled={!canSubmit}
            onClick={()=>canSubmit&&onConfirm({trackingNum:isPickup?"PICKUP":trackingNum.trim(),isPickup})}>
            {isPickup?"✓ Mark Picked Up":"✓ Mark Shipped"}
          </button>
          <button style={S.modalSecBtn} onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Detail Modal ──────────────────────────────────────────────────────────────
function DetailModal({ job, activeRole, onAdvance, onArchive, onStepBack, onUpdateJob, onToggleDeposit, onToggleUrgency, onAssign, onUpdateNotes, onClose }) {
  const steps      = WORKFLOW[job.type] || WORKFLOW.screenprint_new;
  const currentIdx = getStepIndex(job);
  const next       = getNextStep(job);
  const hasPrev    = currentIdx > 0;
  const prevStep   = hasPrev ? steps[currentIdx - 1] : null;
  const isManager  = activeRole==="lisa"||activeRole==="brother";
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesVal, setNotesVal]         = useState(job.notes||"");
  const [showShipping, setShowShipping] = useState(false);
  const [editing, setEditing]           = useState(false);
  const [editForm, setEditForm]         = useState({
    jobNum: job.jobNum||"", customer: job.customer||"", product: job.product||"",
    qty: job.qty||0, type: job.type||"screenprint_new", currentStep: job.currentStep||"quote",
    dueDate: job.dueDate||"", urgency: job.urgency||"normal",
    depositPaid: job.depositPaid||false, assignedTo: job.assignedTo||"", notes: job.notes||"",
  });
  const setField = (k,v) => setEditForm(f=>({...f,[k]:v}));
  const saveEdit = () => { onUpdateJob(job.id, {...editForm, qty:parseInt(editForm.qty)||0}); setEditing(false); };

  const saveNotes = () => { onUpdateNotes(job.id, notesVal); setEditingNotes(false); };

  const handleAdvance = () => {
    if (job.currentStep==="readyship") { setShowShipping(true); return; }
    onAdvance(job.id);
    onClose();
  };

  const handleShipConfirm = (data) => {
    onAdvance(job.id, { tracking_num: data.trackingNum, is_pickup: data.isPickup });
    setShowShipping(false);
    onClose();
  };

  return (
    <>
    <div style={S.modalOverlay} onClick={onClose}>
      <div style={S.modal} onClick={e=>e.stopPropagation()}>
        <div style={S.modalHeader}>
          <div>
            <div style={S.modalOrderNum}>{job.jobNum?`Order #${job.jobNum}`:`Job ID: ${job.id.slice(0,8)}…`}</div>
            <div style={S.modalCustomer}>{job.customer}</div>
            <div style={{fontSize:14,color:"#666"}}>{job.product} · {job.qty} pcs</div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"flex-start"}}>
            {job.urgency==="rush"&&<span style={S.rushBadge}>RUSH</span>}
            {isManager && !editing && (
              <button style={{...S.closeBtn,width:"auto",padding:"6px 12px",fontSize:12,color:"#e8c547",borderColor:"#e8c54740"}}
                onClick={()=>setEditing(true)}>✏ Edit</button>
            )}
            <button style={S.closeBtn} onClick={onClose}>✕</button>
          </div>
        </div>

        {editing ? (
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              {[["Job Number","jobNum","text"],["Customer","customer","text"],["Product","product","text"],["Quantity","qty","number"],["Due Date","dueDate","date"]].map(([label,key,type])=>(
                <label key={key} style={S.formLabel}>
                  <span style={S.formLabelText}>{label}</span>
                  <input style={S.formInput} type={type} value={editForm[key]} onChange={e=>setField(key,e.target.value)} />
                </label>
              ))}
              <label style={S.formLabel}>
                <span style={S.formLabelText}>Job Type</span>
                <select style={S.formInput} value={editForm.type} onChange={e=>setField("type",e.target.value)}>
                  {JOB_TYPES.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </label>
              <label style={S.formLabel}>
                <span style={S.formLabelText}>Current Step</span>
                <select style={S.formInput} value={editForm.currentStep} onChange={e=>setField("currentStep",e.target.value)}>
                  {(WORKFLOW[editForm.type]||[]).map(s=><option key={s.id} value={s.id}>{s.icon} {s.label}</option>)}
                </select>
              </label>
              <label style={S.formLabel}>
                <span style={S.formLabelText}>Urgency</span>
                <select style={S.formInput} value={editForm.urgency} onChange={e=>setField("urgency",e.target.value)}>
                  <option value="normal">Normal</option>
                  <option value="rush">Rush 🔥</option>
                </select>
              </label>
              <label style={S.formLabel}>
                <span style={S.formLabelText}>Assigned To</span>
                <select style={S.formInput} value={editForm.assignedTo} onChange={e=>setField("assignedTo",e.target.value)}>
                  <option value="">Unassigned</option>
                  {ROLES.map(r=><option key={r.id} value={r.id}>{r.label}</option>)}
                </select>
              </label>
            </div>
            <label style={{display:"flex",alignItems:"center",gap:10,color:"#888",fontSize:14}}>
              <input type="checkbox" checked={editForm.depositPaid} onChange={e=>setField("depositPaid",e.target.checked)} />
              Deposit received
            </label>
            <label style={S.formLabel}>
              <span style={S.formLabelText}>Notes</span>
              <textarea style={{...S.formInput,resize:"vertical"}} rows={3} value={editForm.notes} onChange={e=>setField("notes",e.target.value)} />
            </label>
            <div style={{display:"flex",gap:10,marginTop:8}}>
              <button style={S.modalAdvanceBtn} onClick={saveEdit}>Save Changes</button>
              <button style={S.modalSecBtn} onClick={()=>setEditing(false)}>Cancel</button>
            </div>
          </div>
        ) : (
          <>
        {/* Timeline */}
        <div style={S.timeline}>
          {steps.map((step,i)=>(
            <div key={step.id} style={S.timelineStep}>
              <div style={{...S.timelineDot,background:i<currentIdx?"#4ec9a0":i===currentIdx?"#e8c547":"#333",border:i===currentIdx?"2px solid #e8c547":"2px solid transparent"}}>
                {i<currentIdx?"✓":step.icon}
              </div>
              {i<steps.length-1&&<div style={{...S.timelineLine,background:i<currentIdx?"#4ec9a0":"#333"}} />}
              <div style={{...S.timelineLabel,color:i===currentIdx?"#e8c547":i<currentIdx?"#4ec9a0":"#555"}}>{step.label}</div>
            </div>
          ))}
        </div>

        {/* Details grid */}
        <div style={S.detailGrid}>
          <DetailField label="Job Type"   value={JOB_TYPES.find(t=>t.value===job.type)?.label} />
          <DetailField label="Due Date"   value={job.dueDate} valueStyle={{color:dueDateColor(job.dueDate)}} />
          <DetailField label="Deposit"    value={job.depositPaid?"✅ Received":"⚠ Pending"} valueStyle={{color:job.depositPaid?"#4ec9a0":"#f79e7e"}} />
          <DetailField label="Priority"   value={`#${job.priority}`} />
          <DetailField label="Step Owner" value={roleName(job.stepOwner)||"Unassigned"} valueStyle={{color:roleColor(job.stepOwner)}} />
          <DetailField label="Assigned"   value={roleName(job.assignedTo)||"Unassigned"} />
          {job.trackingNum && <DetailField label={job.isPickup?"Fulfillment":"Tracking #"} value={job.isPickup?"Customer Pickup":job.trackingNum} valueStyle={{color:"#4ec9a0"}} />}
        </div>

        {/* Mockup + Work Order */}
        {(job.mockupUrl||job.workOrderUrl) && (
          <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
            {job.mockupUrl && (
              <a href={job.mockupUrl} target="_blank" rel="noreferrer" style={S.assetLink}>
                🖼 View Mockup
              </a>
            )}
            {job.workOrderUrl && (
              <a href={job.workOrderUrl} target="_blank" rel="noreferrer" style={S.assetLink}>
                📄 Work Order
              </a>
            )}
          </div>
        )}

        {/* Notes */}
        <div style={S.notesBox}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
            <div style={S.notesLabel}>Notes</div>
            {isManager&&!editingNotes&&<button style={S.editNotesBtn} onClick={()=>setEditingNotes(true)}>✏ Edit</button>}
          </div>
          {editingNotes ? (
            <div>
              <textarea style={S.notesTextarea} value={notesVal} onChange={e=>setNotesVal(e.target.value)} rows={3} autoFocus />
              <div style={{display:"flex",gap:8,marginTop:8}}>
                <button style={S.modalAdvanceBtn} onClick={saveNotes}>Save</button>
                <button style={S.modalSecBtn} onClick={()=>{setNotesVal(job.notes||"");setEditingNotes(false);}}>Cancel</button>
              </div>
            </div>
          ) : (
            <div style={S.notesText}>{notesVal||<span style={{color:"#444",fontStyle:"italic"}}>No notes</span>}</div>
          )}
        </div>

        {/* Actions */}
        {isManager && (
          <div style={S.modalActions}>
            {next && job.currentStep!=="followup" && (
              <button style={S.modalAdvanceBtn} onClick={handleAdvance}>
                {job.currentStep==="readyship"?"🚚 Enter Shipping Info":`→ ${next.label}`}
              </button>
            )}
            {job.currentStep==="followup" && (
              <button style={{...S.modalAdvanceBtn,background:"#4ec9a0",color:"#0d0d0d"}} onClick={()=>{onArchive(job.id);onClose();}}>✓ Followed Up — Archive Job</button>
            )}
            {hasPrev && !job.archived && (
              <button style={{...S.modalSecBtn,color:"#ff9f43",borderColor:"#ff9f4340"}}
                onClick={()=>{onStepBack(job.id);onClose();}}>
                ← Back to {prevStep.label}
              </button>
            )}
            <button style={S.modalSecBtn} onClick={()=>onToggleDeposit(job.id)}>{job.depositPaid?"Mark Deposit Unpaid":"Mark Deposit Paid"}</button>
            <button style={S.modalSecBtn} onClick={()=>onToggleUrgency(job.id)}>{job.urgency==="rush"?"Remove Rush":"Mark Rush 🔥"}</button>
          </div>
        )}

        {/* Assign */}
        {isManager && (
          <div style={S.assignRow}>
            <span style={S.assignLabel}>Assign to:</span>
            <select style={S.assignSelectModal} value={job.assignedTo||""} onChange={e=>onAssign(job.id,e.target.value)}>
              <option value="">Unassigned</option>
              {ROLES.filter(r=>r.id!=="lisa"&&r.id!=="brother").map(r=>(
                <option key={r.id} value={r.id}>{r.label}</option>
              ))}
            </select>
          </div>
        )}
          </>
        )}
      </div>
    </div>
    {showShipping && <ShippingModal job={job} onConfirm={handleShipConfirm} onClose={()=>setShowShipping(false)} />}
    </>
  );
}

function DetailField({ label, value, valueStyle }) {
  return (
    <div style={S.detailField}>
      <div style={S.detailLabel}>{label}</div>
      <div style={{...S.detailValue,...valueStyle}}>{value}</div>
    </div>
  );
}

// ── Today View ────────────────────────────────────────────────────────────────
function TodayView({ jobs, activeRole, todaySheet, setTodaySheet, todayNotes, setTodayNotes, onAdvance, onSelect, onReset, history, notify }) {
  const isManager = activeRole==="lisa"||activeRole==="brother";
  const today = new Date().toLocaleDateString("en-CA",{weekday:"long",year:"numeric",month:"long",day:"numeric"});
  const floorRoles = [
    {id:"lead_printer",label:"Lead Printer",   color:"#7eb8f7"},
    {id:"press_assist",label:"Press Assistant",color:"#f79e7e"},
    {id:"harrison",    label:"Harrison",       color:"#c084fc"},
    {id:"emb_assist",  label:"Emb Assistant",  color:"#34d399"},
  ];
  const assignedIds = Object.values(todaySheet).flat();
  const eligible = jobs.filter(j=>j.currentStep!=="shipped"&&j.currentStep!=="followup"&&!j.archived).sort((a,b)=>a.priority-b.priority);

  const addToRunsheet = (roleId, jobId) => {
    if (todaySheet[roleId]?.includes(jobId)) return;
    const updated = {...todaySheet, [roleId]:[...(todaySheet[roleId]||[]),jobId]};
    setTodaySheet(updated);
    notify(`Added to ${floorRoles.find(r=>r.id===roleId)?.label}'s runsheet`);
  };
  const removeFromRunsheet = (roleId, jobId) => setTodaySheet({...todaySheet,[roleId]:todaySheet[roleId].filter(id=>id!==jobId)});
  const moveUp = (roleId, idx) => {
    const arr=[...todaySheet[roleId]]; if(idx===0)return;
    [arr[idx-1],arr[idx]]=[arr[idx],arr[idx-1]]; setTodaySheet({...todaySheet,[roleId]:arr});
  };
  const moveDown = (roleId, idx) => {
    const arr=[...todaySheet[roleId]]; if(idx===arr.length-1)return;
    [arr[idx],arr[idx+1]]=[arr[idx+1],arr[idx]]; setTodaySheet({...todaySheet,[roleId]:arr});
  };
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);

  if (!isManager) {
    const myJobs = (todaySheet[activeRole]||[]).map(id=>jobs.find(j=>j.id===id)).filter(Boolean);
    return (
      <div style={TS.root}>
        <div style={TS.floorHeader}>
          <div style={TS.floorDate}>{today}</div>
          <div style={{...TS.floorRoleTag,background:floorRoles.find(r=>r.id===activeRole)?.color+"22",color:floorRoles.find(r=>r.id===activeRole)?.color}}>
            {floorRoles.find(r=>r.id===activeRole)?.label}
          </div>
          <div style={TS.floorTitle}>YOUR JOBS TODAY</div>
        </div>
        {myJobs.length===0 ? (
          <div style={TS.emptyState}><div style={{fontSize:40,marginBottom:12}}>☕</div><div style={{color:"#555",fontSize:14}}>No jobs assigned yet.</div></div>
        ) : (
          <div style={TS.floorJobList}>
            {myJobs.map((job,i)=>{
              const step=getStep(job); const next=getNextStep(job);
              return (
                <div key={job.id} style={TS.floorJobCard}>
                  <div style={TS.floorJobNum}><span style={TS.floorSeq}>{i+1}</span>{job.urgency==="rush"&&<span style={S.rushBadge}>RUSH</span>}</div>
                  <div style={TS.floorJobMain}>
                    <div style={TS.floorJobCustomer}>{job.customer}{job.jobNum&&<span style={{fontSize:12,color:"#e8c547",marginLeft:8}}>#{job.jobNum}</span>}</div>
                    <div style={TS.floorJobProduct}>{job.product} · {job.qty} pcs</div>
                    <div style={TS.floorJobStep}><span>{step?.icon}</span> {step?.label}</div>
                    {job.notes&&<div style={TS.floorJobNotes}>{job.notes}</div>}
                  </div>
                  <div style={TS.floorJobRight}>
                    <div style={{...TS.floorDue,color:dueDateColor(job.dueDate)}}>{daysUntil(job.dueDate)<0?"OVERDUE":daysUntil(job.dueDate)===0?"DUE TODAY":`${daysUntil(job.dueDate)}d left`}</div>
                    {next&&<button style={TS.floorAdvanceBtn} onClick={()=>onAdvance(job.id)}>✓ {next.label}</button>}
                    <button style={TS.floorDetailBtn} onClick={()=>onSelect(job)}>Details →</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {todayNotes&&<div style={TS.managerNote}><div style={TS.managerNoteLabel}>📌 NOTE FROM MANAGER</div><div style={TS.managerNoteText}>{todayNotes}</div></div>}
      </div>
    );
  }

  return (
    <div style={TS.root}>
      {showHistoryPanel ? (
        <HistoryPanel history={history} jobs={jobs} onClose={()=>setShowHistoryPanel(false)} />
      ) : (
      <>
        <div style={TS.managerHeader}>
          <div>
            <div style={TS.floorDate}>{today}</div>
            <div style={TS.managerTitle}>BUILD TODAY'S RUNSHEET</div>
          </div>
          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            {history.length>0&&<button style={TS.historyBtn} onClick={()=>setShowHistoryPanel(true)}>📅 History ({history.length})</button>}
            <div style={TS.assignedCount}>{assignedIds.length} jobs assigned</div>
            <button style={TS.resetBtn} onClick={onReset}>↺ Reset Day</button>
          </div>
        </div>
        <div style={TS.noteArea}>
          <div style={TS.noteLabelRow}><span style={TS.noteAreaLabel}>📌 Note to floor team</span><span style={{fontSize:11,color:"#555"}}>Visible to all floor roles</span></div>
          <textarea style={TS.noteTextarea} placeholder="Daily notes, reminders, ink locations…" value={todayNotes} onChange={e=>setTodayNotes(e.target.value)} rows={2} />
        </div>
        <div style={TS.managerGrid}>
          <div style={TS.jobPool}>
            <div style={TS.poolHeader}>ALL ACTIVE JOBS · Click + to assign</div>
            {eligible.map(job=>{
              const step=getStep(job); const already=assignedIds.includes(job.id);
              return (
                <div key={job.id} style={{...TS.poolJob,opacity:already?0.35:1}}>
                  <div style={TS.poolJobLeft}>
                    <span style={S.priorityBadge}>#{job.priority}</span>
                    {job.jobNum&&<span style={S.jobNumBadge}>#{job.jobNum}</span>}
                    {job.urgency==="rush"&&<span style={S.rushBadge}>RUSH</span>}
                    <div><div style={TS.poolJobCustomer}>{job.customer}</div><div style={TS.poolJobProduct}>{job.product} · {step?.icon} {step?.label}</div></div>
                  </div>
                  {!already&&<div style={TS.poolBtns}>{floorRoles.map(r=><button key={r.id} style={{...TS.poolAssignBtn,borderColor:r.color+"60",color:r.color}} onClick={()=>addToRunsheet(r.id,job.id)}>+ {r.label.split(" ")[0]}</button>)}</div>}
                  {already&&<span style={TS.assignedTick}>✓</span>}
                </div>
              );
            })}
          </div>
          <div style={TS.runsheetCols}>
            {floorRoles.map(role=>{
              const roleJobs=(todaySheet[role.id]||[]).map(id=>jobs.find(j=>j.id===id)).filter(Boolean);
              return (
                <div key={role.id} style={TS.runsheetCol}>
                  <div style={{...TS.runsheetColHeader,borderColor:role.color}}><span style={{color:role.color}}>{role.label}</span><span style={S.boardCount}>{roleJobs.length}</span></div>
                  {roleJobs.length===0&&<div style={TS.runsheetEmpty}>No jobs yet</div>}
                  {roleJobs.map((job,idx)=>{
                    const step=getStep(job);
                    return (
                      <div key={job.id} style={TS.runsheetJob}>
                        <div style={TS.runsheetJobSeq}>
                          <span style={{...TS.floorSeq,background:role.color+"22",color:role.color}}>{idx+1}</span>
                          <div style={{display:"flex",flexDirection:"column",gap:2}}>
                            <button style={TS.nudgeBtn} onClick={()=>moveUp(role.id,idx)}>▲</button>
                            <button style={TS.nudgeBtn} onClick={()=>moveDown(role.id,idx)}>▼</button>
                          </div>
                        </div>
                        <div style={{flex:1}}>
                          <div style={TS.runsheetJobCustomer}>{job.customer}{job.jobNum&&<span style={{fontSize:10,color:"#e8c547",marginLeft:6}}>#{job.jobNum}</span>}</div>
                          <div style={TS.runsheetJobProduct}>{job.product} · {step?.icon} {step?.label}</div>
                          {job.urgency==="rush"&&<span style={S.rushBadge}>RUSH</span>}
                        </div>
                        <button style={TS.removeBtn} onClick={()=>removeFromRunsheet(role.id,job.id)}>✕</button>
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
  const floorRoles = [{id:"lead_printer",label:"Lead Printer",color:"#7eb8f7"},{id:"press_assist",label:"Press Assistant",color:"#f79e7e"},{id:"harrison",label:"Harrison",color:"#c084fc"},{id:"emb_assist",label:"Emb Assistant",color:"#34d399"},{id:"lupe",label:"Lupe",color:"#fb923c"}];
  const fmt = d => new Date(d).toLocaleDateString("en-CA",{weekday:"long",year:"numeric",month:"long",day:"numeric"});
  const getJobName = (id) => { const j=jobs.find(j=>j.id===id); return j?`${j.customer} — ${j.product}`:`Job #${id}`; };
  return (
    <div style={HS.root}>
      <div style={HS.header}>
        <div><div style={HS.headerSub}>DAILY RUNSHEET</div><div style={HS.headerTitle}>HISTORY LOG</div></div>
        <button style={{...S.closeBtn,width:"auto",padding:"6px 16px",fontSize:13}} onClick={onClose}>← Back</button>
      </div>
      {history.length===0&&<div style={{padding:"60px 0",textAlign:"center",color:"#555"}}>No history yet.</div>}
      {history.map((entry,i)=>{
        const total=(entry.lead_printer?.length||0)+(entry.press_assist?.length||0)+(entry.harrison?.length||0)+(entry.emb_assist?.length||0)+(entry.lupe?.length||0);
        const isOpen=expanded===i;
        return (
          <div key={i} style={HS.entry}>
            <div style={HS.entryHeader} onClick={()=>setExpanded(isOpen?null:i)}>
              <div><div style={HS.entryDate}>{fmt(entry.date)}</div><div style={HS.entrySummary}>{total} jobs assigned</div></div>
              <div style={{display:"flex",gap:10,alignItems:"center"}}>
                {entry.notes&&<span style={HS.hasNote}>📌</span>}
                <span style={HS.chevron}>{isOpen?"▲":"▼"}</span>
              </div>
            </div>
            {isOpen&&(
              <div style={HS.entryBody}>
                {entry.notes&&<div style={HS.noteBox}><div style={HS.noteLabel}>Manager Note</div><div style={HS.noteText}>{entry.notes}</div></div>}
                <div style={HS.rolesGrid}>
                  {floorRoles.map(role=>{
                    const rj=entry[role.id]||[]; if(!rj.length)return null;
                    return (
                      <div key={role.id} style={HS.roleCol}>
                        <div style={{...HS.roleHeader,color:role.color,borderColor:role.color}}>{role.label} · {rj.length}</div>
                        {rj.map((id,idx)=>(
                          <div key={id} style={HS.historyJob}>
                            <span style={{...TS.floorSeq,background:role.color+"22",color:role.color,width:22,height:22,fontSize:11,flexShrink:0}}>{idx+1}</span>
                            <span style={HS.historyJobName}>{getJobName(id)}</span>
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

// ── Add Job Modal ─────────────────────────────────────────────────────────────
function AddJobModal({ onAdd, onClose }) {
  const [form, setForm] = useState({
    id:`JOB-${Date.now()}`, jobNum:"", customer:"", product:"", qty:"",
    type:"screenprint_new", dueDate:"", urgency:"normal", currentStep:"quote",
    depositPaid:false, notes:"", assignedTo:null,
  });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  return (
    <div style={S.modalOverlay} onClick={onClose}>
      <div style={{...S.modal,maxWidth:500}} onClick={e=>e.stopPropagation()}>
        <div style={S.modalHeader}>
          <div style={S.modalCustomer}>Add New Job</div>
          <button style={S.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:12,marginTop:16}}>
          {[["Job Number","jobNum","text"],["Customer","customer","text"],["Product / Description","product","text"],["Quantity","qty","number"],["Due Date","dueDate","date"],["Notes","notes","text"]].map(([label,key,type])=>(
            <label key={key} style={S.formLabel}>
              <span style={S.formLabelText}>{label}</span>
              <input style={S.formInput} type={type} value={form[key]} onChange={e=>set(key,e.target.value)} />
            </label>
          ))}
          <label style={S.formLabel}>
            <span style={S.formLabelText}>Job Type</span>
            <select style={S.formInput} value={form.type} onChange={e=>set("type",e.target.value)}>
              {JOB_TYPES.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </label>
          <label style={S.formLabel}>
            <span style={S.formLabelText}>Starting Step</span>
            <select style={S.formInput} value={form.currentStep} onChange={e=>set("currentStep",e.target.value)}>
              {(WORKFLOW[form.type]||[]).map(s=><option key={s.id} value={s.id}>{s.icon} {s.label}</option>)}
            </select>
          </label>
          <label style={S.formLabel}>
            <span style={S.formLabelText}>Urgency</span>
            <select style={S.formInput} value={form.urgency} onChange={e=>set("urgency",e.target.value)}>
              <option value="normal">Normal</option>
              <option value="rush">Rush 🔥</option>
            </select>
          </label>
          <label style={{display:"flex",alignItems:"center",gap:10,color:"#888",fontSize:14}}>
            <input type="checkbox" checked={form.depositPaid} onChange={e=>set("depositPaid",e.target.checked)} />
            Deposit already received
          </label>
        </div>
        <div style={{display:"flex",gap:10,marginTop:20}}>
          <button style={S.modalAdvanceBtn} onClick={()=>{if(!form.customer||!form.product||!form.dueDate)return;onAdd({...form,qty:parseInt(form.qty)||0});}}>Add to Queue</button>
          <button style={S.modalSecBtn} onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Admin View ────────────────────────────────────────────────────────────────
function AdminView({ jobs, activeRole, onAdvance, onSelect, notify }) {
  const today = new Date().toISOString().slice(0,10);
  const [blanksChecked,  setBlanksChecked]  = useState(() => JSON.parse(localStorage.getItem(`tnsp_blanks_${today}`)  || "{}"));
  const [formsChecked,   setFormsChecked]   = useState(() => JSON.parse(localStorage.getItem(`tnsp_forms_${today}`)   || "{}"));

  const saveBlanks = (updated) => { setBlanksChecked(updated); localStorage.setItem(`tnsp_blanks_${today}`, JSON.stringify(updated)); };
  const saveForms  = (updated) => { setFormsChecked(updated);  localStorage.setItem(`tnsp_forms_${today}`,  JSON.stringify(updated)); };

  // Jobs waiting on blanks (at blanks step)
  const blankJobs  = jobs.filter(j => j.currentStep==="blanks" && !j.archived);
  // Jobs ready for production forms (at print_forms step)
  const formJobs   = jobs.filter(j => j.currentStep==="print_forms" && !j.archived);

  const toggleBlanks = (jobId) => {
    const updated = { ...blanksChecked, [jobId]: !blanksChecked[jobId] };
    saveBlanks(updated);
    if (updated[jobId]) notify("Blanks received ✓");
  };

  const toggleForms = (jobId) => {
    const updated = { ...formsChecked, [jobId]: !formsChecked[jobId] };
    saveForms(updated);
    if (updated[jobId]) notify("Production forms printed ✓");
  };

  const advanceAndCheck = (jobId, type) => {
    if (type==="blanks") saveBlanks({ ...blanksChecked, [jobId]: true });
    if (type==="forms")  saveForms({ ...formsChecked,  [jobId]: true });
    onAdvance(jobId);
    notify("Step advanced ✓");
  };

  const blanksRemaining = blankJobs.filter(j=>!blanksChecked[j.id]).length;
  const formsRemaining  = formJobs.filter(j=>!formsChecked[j.id]).length;

  return (
    <div style={{maxWidth:900, margin:"0 auto"}}>
      <div style={{marginBottom:28}}>
        <div style={{fontSize:11,color:"#555",letterSpacing:2,textTransform:"uppercase"}}>Daily Checklist</div>
        <div style={{fontSize:20,fontWeight:800,letterSpacing:3,color:"#f0ede8",marginTop:4}}>ADMIN TASKS</div>
        <div style={{fontSize:12,color:"#555",marginTop:4}}>Resets daily · {new Date().toLocaleDateString("en-CA",{weekday:"long",month:"long",day:"numeric"})}</div>
      </div>

      {/* Section 1: Receive Blanks */}
      <div style={AS.section}>
        <div style={AS.sectionHeader}>
          <div style={AS.sectionLeft}>
            <span style={AS.sectionIcon}>📦</span>
            <div>
              <div style={AS.sectionTitle}>Receive Blanks Orders</div>
              <div style={AS.sectionSub}>Jobs waiting on blanks to arrive</div>
            </div>
          </div>
          <div style={{...AS.badge, background: blanksRemaining===0?"#4ec9a022":"#f79e7e22", color: blanksRemaining===0?"#4ec9a0":"#f79e7e"}}>
            {blanksRemaining===0 ? "✓ All received" : `${blanksRemaining} pending`}
          </div>
        </div>

        {blankJobs.length===0 ? (
          <div style={AS.emptyMsg}>No jobs waiting on blanks right now.</div>
        ) : (
          blankJobs.map(job => {
            const checked = !!blanksChecked[job.id];
            return (
              <div key={job.id} style={{...AS.taskRow, opacity: checked?0.5:1}}>
                <div style={AS.taskCheck} onClick={()=>toggleBlanks(job.id)}>
                  <div style={{...AS.checkbox, background: checked?"#4ec9a0":"transparent", borderColor: checked?"#4ec9a0":"#444"}}>
                    {checked && <span style={{color:"#0d0d0d",fontSize:12,fontWeight:900}}>✓</span>}
                  </div>
                </div>
                <div style={AS.taskMain} onClick={()=>onSelect(job)}>
                  <div style={AS.taskCustomer}>
                    {job.customer}
                    {job.jobNum && <span style={{fontSize:11,color:"#e8c547",marginLeft:8}}>#{job.jobNum}</span>}
                    {job.urgency==="rush" && <span style={{...AS.urgencyTag,background:"#ff9f4322",color:"#ff9f43"}}>RUSH</span>}
                  </div>
                  <div style={AS.taskProduct}>{job.product} · {job.qty} pcs</div>
                  {job.notes && <div style={AS.taskNotes}>{job.notes}</div>}
                </div>
                <div style={AS.taskRight}>
                  <div style={{fontSize:11,color:dueDateColor(job.dueDate),fontWeight:600}}>
                    {daysUntil(job.dueDate)<0?"OVERDUE":`${daysUntil(job.dueDate)}d`}
                  </div>
                  {checked && (
                    <button style={AS.advanceTaskBtn} onClick={()=>advanceAndCheck(job.id,"blanks")}>
                      → Print Forms
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Section 2: Print Production Forms */}
      <div style={AS.section}>
        <div style={AS.sectionHeader}>
          <div style={AS.sectionLeft}>
            <span style={AS.sectionIcon}>🖨️</span>
            <div>
              <div style={AS.sectionTitle}>Print & Organize Production Forms</div>
              <div style={AS.sectionSub}>Jobs ready for production forms — blanks received</div>
            </div>
          </div>
          <div style={{...AS.badge, background: formsRemaining===0?"#4ec9a022":"#f79e7e22", color: formsRemaining===0?"#4ec9a0":"#f79e7e"}}>
            {formsRemaining===0 ? "✓ All printed" : `${formsRemaining} to print`}
          </div>
        </div>

        {formJobs.length===0 ? (
          <div style={AS.emptyMsg}>No forms to print right now.</div>
        ) : (
          formJobs.map(job => {
            const checked = !!formsChecked[job.id];
            return (
              <div key={job.id} style={{...AS.taskRow, opacity: checked?0.5:1}}>
                <div style={AS.taskCheck} onClick={()=>toggleForms(job.id)}>
                  <div style={{...AS.checkbox, background: checked?"#4ec9a0":"transparent", borderColor: checked?"#4ec9a0":"#444"}}>
                    {checked && <span style={{color:"#0d0d0d",fontSize:12,fontWeight:900}}>✓</span>}
                  </div>
                </div>
                <div style={AS.taskMain} onClick={()=>onSelect(job)}>
                  <div style={AS.taskCustomer}>
                    {job.customer}
                    {job.jobNum && <span style={{fontSize:11,color:"#e8c547",marginLeft:8}}>#{job.jobNum}</span>}
                    {job.urgency==="rush" && <span style={{...AS.urgencyTag,background:"#ff9f4322",color:"#ff9f43"}}>RUSH</span>}
                  </div>
                  <div style={AS.taskProduct}>{job.product} · {job.qty} pcs</div>
                  {job.workOrderUrl && <a href={job.workOrderUrl} target="_blank" rel="noreferrer" style={AS.workOrderLink}>📄 Work Order</a>}
                  {job.notes && <div style={AS.taskNotes}>{job.notes}</div>}
                </div>
                <div style={AS.taskRight}>
                  <div style={{fontSize:11,color:dueDateColor(job.dueDate),fontWeight:600}}>
                    {daysUntil(job.dueDate)<0?"OVERDUE":`${daysUntil(job.dueDate)}d`}
                  </div>
                  {checked && (
                    <button style={AS.advanceTaskBtn} onClick={()=>advanceAndCheck(job.id,"forms")}>
                      → {job.type==="embroidery"?"Send to Harrison":"Seps"}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

const AS = {
  section:       { background:"#141414", border:"1px solid #ffffff10", borderRadius:8, overflow:"hidden", marginBottom:20 },
  sectionHeader: { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"16px 20px", background:"#1a1a1a", borderBottom:"1px solid #ffffff10" },
  sectionLeft:   { display:"flex", alignItems:"center", gap:14 },
  sectionIcon:   { fontSize:24 },
  sectionTitle:  { fontSize:15, fontWeight:700, color:"#f0ede8" },
  sectionSub:    { fontSize:12, color:"#555", marginTop:2 },
  badge:         { padding:"4px 12px", borderRadius:12, fontSize:12, fontWeight:700 },
  emptyMsg:      { padding:"20px", fontSize:13, color:"#333", textAlign:"center" },
  taskRow:       { display:"flex", alignItems:"center", gap:14, padding:"14px 20px", borderBottom:"1px solid #ffffff08", transition:"opacity 0.2s" },
  taskCheck:     { flexShrink:0, cursor:"pointer" },
  checkbox:      { width:22, height:22, borderRadius:4, border:"2px solid", display:"flex", alignItems:"center", justifyContent:"center" },
  taskMain:      { flex:1, cursor:"pointer" },
  taskCustomer:  { fontSize:14, fontWeight:700, color:"#f0ede8", display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" },
  taskProduct:   { fontSize:12, color:"#666", marginTop:2 },
  taskNotes:     { fontSize:11, color:"#555", marginTop:4, fontStyle:"italic" },
  workOrderLink: { display:"inline-flex", alignItems:"center", gap:4, fontSize:11, color:"#7eb8f7", marginTop:4 },
  urgencyTag:    { fontSize:10, fontWeight:800, padding:"2px 7px", borderRadius:3 },
  taskRight:     { display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6, flexShrink:0, minWidth:110 },
  advanceTaskBtn:{ padding:"6px 12px", background:"#e8c54720", border:"1px solid #e8c54760", color:"#e8c547", borderRadius:4, cursor:"pointer", fontSize:11, fontWeight:700 },
};

// ── Overview View ─────────────────────────────────────────────────────────────
function OverviewView({ jobs, onSelect }) {
  const [search, setSearch]   = useState("");
  const [sortBy, setSortBy]   = useState("priority");
  const [filterStep, setFilterStep] = useState("all");

  // Collect all unique steps across workflows
  const allSteps = [...new Set(Object.values(WORKFLOW).flat().map(s=>s.id))];

  const filtered = jobs
    .filter(j => filterStep==="all" || j.currentStep===filterStep)
    .filter(j => !search || [j.customer,j.product,j.jobNum,j.notes].some(v=>v?.toLowerCase().includes(search.toLowerCase())))
    .sort((a,b) => {
      if (sortBy==="priority") return a.priority - b.priority;
      if (sortBy==="due")      return new Date(a.dueDate||"9999") - new Date(b.dueDate||"9999");
      if (sortBy==="customer") return a.customer.localeCompare(b.customer);
      return 0;
    });

  // Group by workflow stage bucket
  const buckets = [
    {key:"Pre-Production",  steps:["quote","approved","deposit","blanks","print_forms"]},
    {key:"Artwork / Setup", steps:["seps","burn","digitizing"]},
    {key:"Production",      steps:["presscheck","sewout","production"]},
    {key:"Outgoing",        steps:["readyship","shipped","followup"]},
  ];

  return (
    <div style={{maxWidth:1200, margin:"0 auto"}}>
      {/* Header */}
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:20, flexWrap:"wrap", gap:12}}>
        <div>
          <div style={{fontSize:11,color:"#555",letterSpacing:2,textTransform:"uppercase"}}>All Active Jobs</div>
          <div style={{fontSize:20,fontWeight:800,letterSpacing:3,color:"#f0ede8",marginTop:4}}>OVERVIEW</div>
        </div>
        <div style={{display:"flex", gap:10, alignItems:"center", flexWrap:"wrap"}}>
          <input style={{...S.select, padding:"8px 14px", width:220}} placeholder="Search customer, product, job #…"
            value={search} onChange={e=>setSearch(e.target.value)} />
          <select style={S.select} value={filterStep} onChange={e=>setFilterStep(e.target.value)}>
            <option value="all">All Steps</option>
            {Object.values(WORKFLOW).flat().filter((s,i,arr)=>arr.findIndex(x=>x.id===s.id)===i).map(s=>(
              <option key={s.id} value={s.id}>{s.icon} {s.label}</option>
            ))}
          </select>
          <select style={S.select} value={sortBy} onChange={e=>setSortBy(e.target.value)}>
            <option value="priority">Sort: Priority</option>
            <option value="due">Sort: Due Date</option>
            <option value="customer">Sort: Customer</option>
          </select>
          <span style={{fontSize:12,color:"#555"}}>{filtered.length} jobs</span>
        </div>
      </div>

      {/* Stage summary cards */}
      <div style={{display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:24}}>
        {buckets.map(b=>{
          const bJobs = jobs.filter(j=>b.steps.includes(j.currentStep));
          const rush  = bJobs.filter(j=>j.urgency==="rush").length;
          const over  = bJobs.filter(j=>j.dueDate&&daysUntil(j.dueDate)<0).length;
          return (
            <div key={b.key} style={OV.stageSummary} onClick={()=>setFilterStep(filterStep==="all"?b.steps[0]:"all")}>
              <div style={OV.stageLabel}>{b.key}</div>
              <div style={OV.stageCount}>{bJobs.length}</div>
              <div style={{display:"flex", gap:8, marginTop:6}}>
                {rush>0 && <span style={{fontSize:10,color:"#ff9f43"}}>🔥 {rush}</span>}
                {over>0 && <span style={{fontSize:10,color:"#ff4d4d"}}>⚠ {over} overdue</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Job table */}
      <div style={S.listView}>
        <div style={{...S.listHeader, gridTemplateColumns:"none", display:"flex"}}>
          <span style={{width:40}}>Pri</span>
          <span style={{width:80}}>Job #</span>
          <span style={{flex:2}}>Customer / Product</span>
          <span style={{flex:1}}>Type</span>
          <span style={{flex:1.5}}>Current Step</span>
          <span style={{flex:1}}>Step Owner</span>
          <span style={{flex:1}}>Assigned</span>
          <span style={{flex:1}}>Due</span>
          <span style={{width:80}}>Deposit</span>
          <span style={{width:60}}>Urgent</span>
        </div>
        {filtered.length===0 && <div style={{padding:"40px",textAlign:"center",color:"#333"}}>No jobs match your filters</div>}
        {filtered.map(job=>{
          const step = getStep(job);
          const dc   = dueDateColor(job.dueDate);
          const days = daysUntil(job.dueDate);
          return (
            <div key={job.id} style={{...S.listRow, cursor:"pointer",
              borderLeft: job.urgency==="rush"?"3px solid #ff9f43":"3px solid transparent"}}
              onClick={()=>onSelect(job)}>
              <span style={{width:40,fontSize:11,color:"#555"}}>#{job.priority}</span>
              <span style={{width:80,fontSize:11,color:"#e8c547",fontWeight:700}}>{job.jobNum||"—"}</span>
              <span style={{flex:2}}>
                <div style={{fontWeight:600,color:"#f0ede8"}}>{job.customer}</div>
                <div style={{fontSize:11,color:"#666"}}>{job.product} · {job.qty} pcs</div>
              </span>
              <span style={{flex:1,fontSize:11,color:job.type==="embroidery"?"#7eb8f7":"#f79e7e"}}>
                {job.type==="embroidery"?"EMB":job.type==="screenprint_reprint"?"SP Reprint":"SP New"}
              </span>
              <span style={{flex:1.5,fontSize:12}}>
                <span>{step?.icon} {step?.label}</span>
              </span>
              <span style={{flex:1,fontSize:11,color:roleColor(job.stepOwner)}}>{roleName(job.stepOwner)||"—"}</span>
              <span style={{flex:1,fontSize:11,color:roleColor(job.assignedTo)}}>{roleName(job.assignedTo)||"—"}</span>
              <span style={{flex:1,fontSize:12,color:dc}}>
                {!job.dueDate?"—":days<0?`${Math.abs(days)}d over`:days===0?"Today":`${days}d`}
                <div style={{fontSize:10,color:"#555"}}>{job.dueDate}</div>
              </span>
              <span style={{width:80,fontSize:11,color:job.depositPaid?"#4ec9a0":"#f79e7e"}}>
                {job.depositPaid?"✓ Paid":"⚠ Pending"}
              </span>
              <span style={{width:60,fontSize:14,textAlign:"center"}}>
                {job.urgency==="rush"?"🔥":""}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const OV = {
  stageSummary: { background:"#141414", border:"1px solid #ffffff10", borderRadius:8, padding:"14px 18px", cursor:"pointer", transition:"border-color 0.15s" },
  stageLabel:   { fontSize:11, color:"#555", letterSpacing:1, textTransform:"uppercase", marginBottom:4 },
  stageCount:   { fontSize:32, fontWeight:800, color:"#f0ede8" },
};

// ── Styles ────────────────────────────────────────────────────────────────────
const S = {
  root:        { minHeight:"100vh", background:"#0d0d0d", color:"#f0ede8", fontFamily:"'DM Mono','Courier New',monospace", position:"relative", overflow:"hidden" },
  bgGrid:      { position:"fixed", inset:0, zIndex:0, backgroundImage:"linear-gradient(#ffffff08 1px,transparent 1px),linear-gradient(90deg,#ffffff08 1px,transparent 1px)", backgroundSize:"40px 40px", pointerEvents:"none" },
  notification:{ position:"fixed", top:20, left:"50%", transform:"translateX(-50%)", padding:"10px 24px", borderRadius:6, color:"#0d0d0d", fontWeight:700, fontSize:13, zIndex:1000, letterSpacing:1 },
  header:      { position:"relative", zIndex:10, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 24px", borderBottom:"1px solid #ffffff15", background:"#0d0d0dcc", backdropFilter:"blur(12px)", flexWrap:"wrap", gap:12 },
  logo:        { display:"flex", alignItems:"center", gap:14 },
  logoMark:    { width:42, height:42, background:"#e8c547", color:"#0d0d0d", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:16, clipPath:"polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)" },
  logoTitle:   { fontSize:16, fontWeight:800, letterSpacing:3, color:"#f0ede8" },
  logoSub:     { fontSize:10, letterSpacing:4, color:"#e8c547", marginTop:1 },
  roleBar:     { display:"flex", gap:6, flexWrap:"wrap" },
  roleBtn:     { padding:"6px 14px", border:"1px solid #ffffff20", borderRadius:4, background:"transparent", color:"#888", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", fontSize:12, transition:"all 0.15s", gap:1 },
  roleName:    { fontWeight:700, fontSize:13 },
  roleDesc:    { fontSize:10, opacity:0.7 },
  addBtn:      { padding:"8px 18px", background:"#e8c547", color:"#0d0d0d", border:"none", borderRadius:4, fontWeight:800, cursor:"pointer", fontSize:13, letterSpacing:1 },
  statsBar:    { position:"relative", zIndex:10, display:"flex", gap:0, borderBottom:"1px solid #ffffff15" },
  stat:        { flex:1, padding:"12px 20px", borderRight:"1px solid #ffffff10", display:"flex", flexDirection:"column", alignItems:"center" },
  statValue:   { fontSize:28, fontWeight:800, lineHeight:1 },
  statLabel:   { fontSize:10, color:"#555", letterSpacing:1, marginTop:4, textTransform:"uppercase" },
  toolbar:     { position:"relative", zIndex:10, display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 24px", borderBottom:"1px solid #ffffff10" },
  filters:     { display:"flex", gap:10 },
  select:      { background:"#1a1a1a", border:"1px solid #ffffff20", color:"#d4d0c8", padding:"6px 12px", borderRadius:4, fontSize:12, cursor:"pointer" },
  viewToggle:  { display:"flex", gap:4 },
  viewBtn:     { padding:"6px 14px", background:"transparent", border:"1px solid #ffffff20", color:"#666", borderRadius:4, cursor:"pointer", fontSize:12 },
  viewBtnActive:{ background:"#ffffff15", color:"#f0ede8", borderColor:"#ffffff40" },
  main:        { position:"relative", zIndex:10, padding:"20px 24px", overflowX:"auto" },
  boardGrid:   { display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, minWidth:900 },
  boardCol:    { background:"#141414", border:"1px solid #ffffff10", borderRadius:8, overflow:"hidden", minHeight:400 },
  boardColHeader:{ padding:"12px 16px", background:"#1a1a1a", borderBottom:"1px solid #ffffff10", display:"flex", justifyContent:"space-between", fontSize:11, fontWeight:700, letterSpacing:2, textTransform:"uppercase", color:"#888" },
  boardCount:  { background:"#ffffff15", borderRadius:10, padding:"1px 8px", fontSize:11, color:"#f0ede8" },
  boardColBody:{ padding:10, display:"flex", flexDirection:"column", gap:8 },
  emptyCol:    { padding:20, textAlign:"center", color:"#333", fontSize:12 },
  card:        { background:"#1e1e1e", border:"1px solid #ffffff10", borderRadius:6, padding:12, cursor:"pointer", transition:"all 0.15s", userSelect:"none" },
  cardRush:    { borderLeft:"3px solid #ff9f43" },
  cardDragOver:{ background:"#e8c54710", borderColor:"#e8c547" },
  cardTop:     { display:"flex", gap:6, alignItems:"center", marginBottom:8, flexWrap:"wrap" },
  priorityBadge:{ fontSize:10, fontWeight:700, color:"#555", background:"#ffffff08", padding:"1px 6px", borderRadius:3 },
  jobNumBadge: { fontSize:11, fontWeight:800, color:"#e8c547", background:"#e8c54722", padding:"2px 7px", borderRadius:3, letterSpacing:0.5 },
  rushBadge:   { fontSize:10, fontWeight:800, background:"#ff9f4322", color:"#ff9f43", padding:"2px 7px", borderRadius:3, letterSpacing:1 },
  depositBadge:{ fontSize:10, background:"#f79e7e22", color:"#f79e7e", padding:"2px 7px", borderRadius:3 },
  typeBadge:   { fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:3, marginLeft:"auto" },
  cardCustomer:{ fontWeight:700, fontSize:14, color:"#f0ede8", marginBottom:2 },
  cardProduct: { fontSize:12, color:"#666", marginBottom:10 },
  cardStep:    { display:"flex", alignItems:"center", gap:6, background:"#ffffff08", borderRadius:4, padding:"5px 8px", marginBottom:8 },
  stepLabel:   { fontSize:12, color:"#d4d0c8" },
  stepOwnerTag:{ fontSize:10, marginLeft:"auto", fontWeight:600 },
  progressBar: { height:3, background:"#ffffff10", borderRadius:2, marginBottom:8, overflow:"hidden" },
  progressFill:{ height:"100%", borderRadius:2, transition:"width 0.4s" },
  dueDate:     { fontSize:11, fontWeight:600, marginBottom:6 },
  assignedTag: { display:"flex", alignItems:"center", gap:6, fontSize:11, color:"#666", marginBottom:8 },
  assignedDot: { width:7, height:7, borderRadius:"50%", display:"inline-block" },
  mockupThumb: { marginBottom:8, borderRadius:4, overflow:"hidden" },
  cardActions: { marginTop:4 },
  cardAssignSelect:{ width:"100%", background:"#ffffff08", border:"1px solid #ffffff15", color:"#888", padding:"5px 8px", borderRadius:4, fontSize:11, marginBottom:6, cursor:"pointer" },
  advanceBtn:  { width:"100%", padding:"6px", background:"#e8c54720", border:"1px solid #e8c54760", color:"#e8c547", borderRadius:4, cursor:"pointer", fontSize:11, fontWeight:700, letterSpacing:0.5 },
  listView:    { background:"#141414", border:"1px solid #ffffff10", borderRadius:8, overflow:"hidden" },
  listHeader:  { display:"flex", gap:10, padding:"10px 16px", background:"#1a1a1a", borderBottom:"1px solid #ffffff10", fontSize:11, letterSpacing:1, textTransform:"uppercase", color:"#555", alignItems:"center" },
  listRow:     { display:"flex", gap:10, padding:"12px 16px", borderBottom:"1px solid #ffffff08", alignItems:"center", transition:"background 0.1s" },
  assignSelect:{ background:"#1a1a1a", border:"1px solid #ffffff20", color:"#d4d0c8", padding:"4px 8px", borderRadius:4, fontSize:11 },
  advanceBtnSm:{ padding:"4px 10px", background:"#e8c54720", border:"1px solid #e8c54760", color:"#e8c547", borderRadius:4, cursor:"pointer", fontSize:11, fontWeight:700 },
  modalOverlay:{ position:"fixed", inset:0, background:"#000000cc", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100, padding:20 },
  modal:       { background:"#141414", border:"1px solid #ffffff20", borderRadius:10, padding:28, width:"100%", maxWidth:680, maxHeight:"90vh", overflowY:"auto", boxShadow:"0 30px 80px #000000cc" },
  modalHeader: { display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 },
  modalOrderNum:{ fontSize:11, color:"#e8c547", letterSpacing:2, marginBottom:4 },
  modalCustomer:{ fontSize:22, fontWeight:800, color:"#f0ede8", marginBottom:4 },
  closeBtn:    { background:"#ffffff10", border:"none", color:"#888", width:30, height:30, borderRadius:4, cursor:"pointer", fontSize:14 },
  timeline:    { display:"flex", alignItems:"flex-start", gap:0, marginBottom:24, overflowX:"auto", paddingBottom:8 },
  timelineStep:{ display:"flex", flexDirection:"column", alignItems:"center", minWidth:70 },
  timelineDot: { width:32, height:32, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, zIndex:1, flexShrink:0 },
  timelineLine:{ height:2, width:38, marginTop:14, flexShrink:0 },
  timelineLabel:{ fontSize:10, marginTop:6, textAlign:"center", lineHeight:1.3, maxWidth:65 },
  detailGrid:  { display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:16 },
  detailField: { background:"#1e1e1e", border:"1px solid #ffffff10", borderRadius:6, padding:"10px 14px" },
  detailLabel: { fontSize:10, color:"#555", letterSpacing:1, textTransform:"uppercase", marginBottom:4 },
  detailValue: { fontSize:14, fontWeight:600, color:"#d4d0c8" },
  assetLink:   { display:"inline-flex", alignItems:"center", gap:6, padding:"8px 14px", background:"#ffffff08", border:"1px solid #ffffff20", borderRadius:6, color:"#7eb8f7", fontSize:13, textDecoration:"none", fontWeight:600 },
  notesBox:    { background:"#1e1e1e", border:"1px solid #ffffff10", borderRadius:6, padding:"12px 14px", marginBottom:16 },
  notesLabel:  { fontSize:10, color:"#555", letterSpacing:1, textTransform:"uppercase" },
  notesText:   { fontSize:13, color:"#888", lineHeight:1.5 },
  notesTextarea:{ width:"100%", background:"#0d0d0d", border:"1px solid #ffffff20", color:"#d4d0c8", borderRadius:4, padding:"8px 10px", fontSize:13, fontFamily:"inherit", resize:"vertical", boxSizing:"border-box" },
  editNotesBtn:{ background:"transparent", border:"1px solid #ffffff20", color:"#555", padding:"2px 10px", borderRadius:4, cursor:"pointer", fontSize:11 },
  modalActions:{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:14 },
  modalAdvanceBtn:{ flex:1, padding:"10px", background:"#e8c547", color:"#0d0d0d", border:"none", borderRadius:6, fontWeight:800, cursor:"pointer", fontSize:13 },
  modalSecBtn: { flex:1, padding:"10px", background:"#ffffff10", color:"#d4d0c8", border:"1px solid #ffffff20", borderRadius:6, fontWeight:600, cursor:"pointer", fontSize:13 },
  assignRow:   { display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" },
  assignLabel: { fontSize:12, color:"#555", marginRight:4 },
  assignSelectModal:{ flex:1, background:"#1e1e1e", border:"1px solid #ffffff20", color:"#d4d0c8", padding:"8px 12px", borderRadius:6, fontSize:13, cursor:"pointer" },
  formLabel:   { display:"flex", flexDirection:"column", gap:4 },
  formLabelText:{ fontSize:11, color:"#555", letterSpacing:1, textTransform:"uppercase" },
  formInput:   { background:"#1e1e1e", border:"1px solid #ffffff20", color:"#f0ede8", padding:"8px 12px", borderRadius:4, fontSize:13, fontFamily:"inherit" },
};

const TS = {
  root:              { maxWidth:1100, margin:"0 auto" },
  floorHeader:       { marginBottom:24, display:"flex", flexDirection:"column", gap:6 },
  floorDate:         { fontSize:11, color:"#555", letterSpacing:2, textTransform:"uppercase" },
  floorTitle:        { fontSize:22, fontWeight:800, letterSpacing:3, color:"#f0ede8" },
  floorRoleTag:      { display:"inline-flex", padding:"3px 12px", borderRadius:12, fontSize:12, fontWeight:700, width:"fit-content" },
  emptyState:        { textAlign:"center", padding:"60px 0" },
  floorJobList:      { display:"flex", flexDirection:"column", gap:12 },
  floorJobCard:      { background:"#141414", border:"1px solid #ffffff15", borderRadius:8, padding:16, display:"flex", gap:16, alignItems:"flex-start" },
  floorJobNum:       { display:"flex", flexDirection:"column", gap:6, alignItems:"center", minWidth:32 },
  floorSeq:          { width:28, height:28, borderRadius:"50%", background:"#e8c54722", color:"#e8c547", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:13 },
  floorJobMain:      { flex:1 },
  floorJobCustomer:  { fontSize:16, fontWeight:700, color:"#f0ede8", marginBottom:2 },
  floorJobProduct:   { fontSize:13, color:"#666", marginBottom:8 },
  floorJobStep:      { display:"inline-flex", alignItems:"center", gap:6, fontSize:13, background:"#ffffff08", padding:"4px 10px", borderRadius:4, color:"#d4d0c8" },
  floorJobNotes:     { fontSize:12, color:"#555", marginTop:8, fontStyle:"italic" },
  floorJobRight:     { display:"flex", flexDirection:"column", gap:8, alignItems:"flex-end", minWidth:130 },
  floorDue:          { fontSize:12, fontWeight:700 },
  floorAdvanceBtn:   { padding:"8px 14px", background:"#4ec9a022", border:"1px solid #4ec9a060", color:"#4ec9a0", borderRadius:6, cursor:"pointer", fontSize:12, fontWeight:700, width:"100%", textAlign:"center" },
  floorDetailBtn:    { padding:"6px 14px", background:"#ffffff08", border:"1px solid #ffffff15", color:"#666", borderRadius:6, cursor:"pointer", fontSize:12, width:"100%" },
  managerNote:       { marginTop:24, background:"#e8c54710", border:"1px solid #e8c54740", borderRadius:8, padding:"14px 18px" },
  managerNoteLabel:  { fontSize:10, color:"#e8c547", letterSpacing:2, marginBottom:6, fontWeight:700 },
  managerNoteText:   { fontSize:14, color:"#d4d0c8", lineHeight:1.6 },
  managerHeader:     { display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:20 },
  managerTitle:      { fontSize:20, fontWeight:800, letterSpacing:3, color:"#f0ede8", marginTop:4 },
  assignedCount:     { background:"#ffffff10", padding:"6px 16px", borderRadius:20, fontSize:12, color:"#888" },
  resetBtn:          { padding:"6px 16px", background:"#ff4d4d18", border:"1px solid #ff4d4d40", color:"#ff4d4d", borderRadius:6, cursor:"pointer", fontSize:12, fontWeight:700 },
  historyBtn:        { padding:"6px 16px", background:"#e8c54715", border:"1px solid #e8c54740", color:"#e8c547", borderRadius:6, cursor:"pointer", fontSize:12, fontWeight:700 },
  noteArea:          { marginBottom:20 },
  noteLabelRow:      { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 },
  noteAreaLabel:     { fontSize:11, color:"#e8c547", letterSpacing:1, fontWeight:700 },
  noteTextarea:      { width:"100%", background:"#1a1a1a", border:"1px solid #e8c54730", color:"#d4d0c8", borderRadius:6, padding:"10px 14px", fontSize:13, fontFamily:"'DM Mono',monospace", resize:"vertical", boxSizing:"border-box" },
  managerGrid:       { display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 },
  jobPool:           { background:"#141414", border:"1px solid #ffffff10", borderRadius:8, overflow:"hidden", maxHeight:600, overflowY:"auto" },
  poolHeader:        { padding:"10px 14px", background:"#1a1a1a", borderBottom:"1px solid #ffffff10", fontSize:10, letterSpacing:2, color:"#555", textTransform:"uppercase", position:"sticky", top:0 },
  poolJob:           { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 14px", borderBottom:"1px solid #ffffff08", gap:10 },
  poolJobLeft:       { display:"flex", alignItems:"center", gap:8, flex:1 },
  poolJobCustomer:   { fontSize:13, fontWeight:600, color:"#d4d0c8" },
  poolJobProduct:    { fontSize:11, color:"#555" },
  poolBtns:          { display:"flex", gap:6, flexShrink:0 },
  poolAssignBtn:     { padding:"4px 10px", background:"transparent", border:"1px solid", borderRadius:4, cursor:"pointer", fontSize:11, fontWeight:700 },
  assignedTick:      { fontSize:11, color:"#4ec9a0", flexShrink:0 },
  runsheetCols:      { display:"flex", flexDirection:"column", gap:16 },
  runsheetCol:       { background:"#141414", border:"1px solid #ffffff10", borderRadius:8, overflow:"hidden" },
  runsheetColHeader: { padding:"10px 14px", background:"#1a1a1a", borderBottom:"1px solid #ffffff10", borderLeft:"3px solid", display:"flex", justifyContent:"space-between", alignItems:"center", fontSize:11, fontWeight:800, letterSpacing:2, textTransform:"uppercase" },
  runsheetEmpty:     { padding:"20px 14px", fontSize:12, color:"#333", textAlign:"center" },
  runsheetJob:       { display:"flex", alignItems:"center", gap:10, padding:"10px 14px", borderBottom:"1px solid #ffffff08" },
  runsheetJobSeq:    { display:"flex", alignItems:"center", gap:6, flexShrink:0 },
  runsheetJobCustomer:{ fontSize:13, fontWeight:600, color:"#d4d0c8" },
  runsheetJobProduct:{ fontSize:11, color:"#555", marginBottom:3 },
  nudgeBtn:          { background:"#ffffff08", border:"none", color:"#555", cursor:"pointer", fontSize:9, padding:"1px 4px", borderRadius:2, lineHeight:1.5 },
  removeBtn:         { background:"transparent", border:"none", color:"#444", cursor:"pointer", fontSize:14, padding:"2px 6px", flexShrink:0 },
};

const HS = {
  root:         { maxWidth:1100, margin:"0 auto" },
  header:       { display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:24 },
  headerSub:    { fontSize:11, color:"#555", letterSpacing:2, textTransform:"uppercase", marginBottom:4 },
  headerTitle:  { fontSize:22, fontWeight:800, letterSpacing:3, color:"#f0ede8" },
  entry:        { background:"#141414", border:"1px solid #ffffff10", borderRadius:8, marginBottom:10, overflow:"hidden" },
  entryHeader:  { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 18px", cursor:"pointer" },
  entryDate:    { fontSize:14, fontWeight:700, color:"#f0ede8", marginBottom:3 },
  entrySummary: { fontSize:12, color:"#555" },
  hasNote:      { fontSize:11, background:"#e8c54715", color:"#e8c547", padding:"2px 8px", borderRadius:10 },
  chevron:      { fontSize:12, color:"#555" },
  entryBody:    { padding:"0 18px 16px", borderTop:"1px solid #ffffff08" },
  noteBox:      { background:"#e8c54708", border:"1px solid #e8c54720", borderRadius:6, padding:"10px 14px", margin:"14px 0" },
  noteLabel:    { fontSize:10, color:"#e8c547", letterSpacing:1, marginBottom:4 },
  noteText:     { fontSize:13, color:"#d4d0c8", lineHeight:1.6 },
  rolesGrid:    { display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginTop:14 },
  roleCol:      { background:"#1a1a1a", border:"1px solid #ffffff10", borderRadius:6, overflow:"hidden" },
  roleHeader:   { padding:"8px 12px", fontSize:11, fontWeight:800, letterSpacing:1, textTransform:"uppercase", borderLeft:"3px solid", background:"#ffffff05" },
  historyJob:   { display:"flex", alignItems:"center", gap:10, padding:"8px 12px", borderTop:"1px solid #ffffff08" },
  historyJobName:{ fontSize:13, color:"#888" },
};

