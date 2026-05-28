import { useState, useEffect, useRef } from "react";

// ── Workflow ──────────────────────────────────────────────────────────────────
const WORKFLOW = {
  screenprint_new: [
    { id:"quote",          label:"Quote Sent",             icon:"📋", owner:"lisa" },
    { id:"approved",       label:"Estimate Approved",      icon:"✅", owner:"lisa" },
    { id:"deposit",        label:"Deposit Received",       icon:"💰", owner:"lisa" },
    { id:"blanks",         label:"Blanks Ordered",         icon:"📦", owner:"lisa" },
    { id:"blanks_received",label:"Blanks Received",        icon:"📬", owner:"lisa" },
    { id:"print_forms",    label:"Print Production Forms", icon:"🖨️", owner:"lupe" },
    { id:"seps",           label:"Seps / Burn Folder",     icon:"🎨", owner:"brother" },
    { id:"burn",           label:"Screens Burned",         icon:"🔥", owner:"press_assist" },
    { id:"presscheck",     label:"Press Check",            icon:"👁",  owner:"lead_printer" },
    { id:"production",     label:"Full Production",        icon:"⚙️", owner:"lead_printer" },
    { id:"readyship",      label:"Ready to Ship",          icon:"📫", owner:"press_assist" },
    { id:"shipped",        label:"Shipped",                icon:"🚚", owner:"press_assist" },
    { id:"followup",       label:"Follow Up",              icon:"📞", owner:"lisa" },
  ],
  screenprint_reprint: [
    { id:"quote",          label:"Quote Sent",             icon:"📋", owner:"lisa" },
    { id:"approved",       label:"Estimate Approved",      icon:"✅", owner:"lisa" },
    { id:"deposit",        label:"Deposit Received",       icon:"💰", owner:"lisa" },
    { id:"blanks",         label:"Blanks Ordered",         icon:"📦", owner:"lisa" },
    { id:"blanks_received",label:"Blanks Received",        icon:"📬", owner:"lisa" },
    { id:"print_forms",    label:"Print Production Forms", icon:"🖨️", owner:"lupe" },
    { id:"burn",           label:"Screens Burned",         icon:"🔥", owner:"press_assist" },
    { id:"production",     label:"Full Production",        icon:"⚙️", owner:"lead_printer" },
    { id:"readyship",      label:"Ready to Ship",          icon:"📫", owner:"press_assist" },
    { id:"shipped",        label:"Shipped",                icon:"🚚", owner:"press_assist" },
    { id:"followup",       label:"Follow Up",              icon:"📞", owner:"lisa" },
  ],
  embroidery: [
    { id:"quote",          label:"Quote Sent",             icon:"📋", owner:"lisa" },
    { id:"approved",       label:"Estimate Approved",      icon:"✅", owner:"lisa" },
    { id:"deposit",        label:"Deposit Received",       icon:"💰", owner:"lisa" },
    { id:"blanks",         label:"Blanks Ordered",         icon:"📦", owner:"lisa" },
    { id:"blanks_received",label:"Blanks Received",        icon:"📬", owner:"lisa" },
    { id:"print_forms",    label:"Print Production Forms", icon:"🖨️", owner:"lupe" },
    { id:"digitizing",     label:"Sent to Harrison",       icon:"🧵", owner:"harrison" },
    { id:"sewout",         label:"Sew Out",                icon:"🪡", owner:"harrison" },
    { id:"production",     label:"Full Production",        icon:"⚙️", owner:"harrison" },
    { id:"readyship",      label:"Ready to Ship",          icon:"📫", owner:"press_assist" },
    { id:"shipped",        label:"Shipped",                icon:"🚚", owner:"press_assist" },
    { id:"followup",       label:"Follow Up",              icon:"📞", owner:"lisa" },
  ],
};

const STAGE_BUCKETS = [
  { key:"pre",        label:"Pre-Production",  steps:["quote","approved","deposit","blanks","blanks_received","print_forms"] },
  { key:"artwork",    label:"Artwork / Setup",  steps:["seps","burn","digitizing"] },
  { key:"production", label:"Production",       steps:["presscheck","sewout","production"] },
  { key:"outgoing",   label:"Outgoing",         steps:["readyship","shipped","followup"] },
];

const JOB_TYPES = [
  { value:"screenprint_new",     label:"Screen Print – New" },
  { value:"screenprint_reprint", label:"Screen Print – Reprint" },
  { value:"embroidery",          label:"Embroidery" },
];

const ALL_ROLES = [
  { id:"lisa",         label:"Lisa",            color:"#e8c547" },
  { id:"brother",      label:"Andrew",          color:"#4ec9a0" },
  { id:"lead_printer", label:"Lead Printer",    color:"#7eb8f7" },
  { id:"press_assist", label:"Press Assistant", color:"#f79e7e" },
  { id:"harrison",     label:"Harrison",        color:"#c084fc" },
  { id:"emb_assist",   label:"Emb Assistant",   color:"#34d399" },
  { id:"lupe",         label:"Lupe",            color:"#fb923c" },
];

const RUNSHEET_ROLES = [
  { id:"brother",      label:"Andrew",          color:"#4ec9a0" },
  { id:"lead_printer", label:"Lead Printer",    color:"#7eb8f7" },
  { id:"press_assist", label:"Press Assistant", color:"#f79e7e" },
  { id:"harrison",     label:"Harrison",        color:"#c084fc" },
  { id:"emb_assist",   label:"Emb Assistant",   color:"#34d399" },
  { id:"lupe",         label:"Lupe",            color:"#fb923c" },
];

// ── Supabase ──────────────────────────────────────────────────────────────────
const SB_URL  = "https://piiyxripiynzoabazhjd.supabase.co";
const SB_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpaXl4cmlwaXluem9hYmF6aGpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0NTg3NzYsImV4cCI6MjA5NTAzNDc3Nn0.uizOdL2vseQwVjpQgFONlDkEleHQosGZxt4QbzVQVbk";
const HDR = { "apikey":SB_ANON, "Authorization":`Bearer ${SB_ANON}`, "Content-Type":"application/json", "Prefer":"return=representation" };

const sb = {
  async get(t,q="")      { return (await fetch(`${SB_URL}/rest/v1/${t}${q}`,{headers:HDR})).json(); },
  async post(t,d)        { return (await fetch(`${SB_URL}/rest/v1/${t}`,{method:"POST",headers:HDR,body:JSON.stringify(d)})).json(); },
  async patch(t,d,m)     { const p=Object.entries(m).map(([k,v])=>`${k}=eq.${encodeURIComponent(v)}`).join("&"); return (await fetch(`${SB_URL}/rest/v1/${t}?${p}`,{method:"PATCH",headers:HDR,body:JSON.stringify(d)})).json(); },
  async upsert(t,d)      { return (await fetch(`${SB_URL}/rest/v1/${t}`,{method:"POST",headers:{...HDR,"Prefer":"resolution=merge-duplicates,return=representation"},body:JSON.stringify(d)})).json(); },
  async uploadFile(path,file) {
    const r = await fetch(`${SB_URL}/storage/v1/object/job-files/${path}`,{method:"POST",headers:{"apikey":SB_ANON,"Authorization":`Bearer ${SB_ANON}`,"Content-Type":file.type},body:file});
    return r.ok ? `${SB_URL}/storage/v1/object/public/job-files/${path}` : null;
  },
  poll(t,cb,ms=5000) { const id=setInterval(async()=>{const d=await sb.get(t,"?order=priority.asc");if(!d?.error)cb(d);},ms); return()=>clearInterval(id); },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const r2j = r => ({
  id:r.id, jobNum:r.job_num||"", customer:r.customer||r.client||"",
  product:r.product||r.garment_style||"", qty:r.qty||0,
  type:r.type||"screenprint_new", currentStep:r.current_step||"quote",
  stepOwner:r.step_owner||null, dueDate:r.due_date||"",
  urgency:r.urgency||"normal", priority:r.priority||99,
  depositPaid:r.deposit_paid||false, assignedTo:r.assigned_to||null,
  notes:r.notes||"", mockupUrl:r.mockup_url||null,
  workOrderUrl:r.work_order_url||null, trackingNum:r.tracking_num||"",
  isPickup:r.is_pickup||false, archived:r.archived||false,
  files:r.files||[],
});
const j2d = j => ({
  job_num:j.jobNum, customer:j.customer, client:j.customer,
  product:j.product, garment_style:j.product, qty:j.qty,
  type:j.type, current_step:j.currentStep, step_owner:j.stepOwner,
  due_date:j.dueDate||null, urgency:j.urgency, priority:j.priority,
  deposit_paid:j.depositPaid, assigned_to:j.assignedTo, notes:j.notes,
  tracking_num:j.trackingNum, is_pickup:j.isPickup, archived:j.archived,
  files:j.files||[],
});
const wfSteps  = j => WORKFLOW[j.type]||WORKFLOW.screenprint_new;
const stepIdx  = j => wfSteps(j).findIndex(s=>s.id===j.currentStep);
const curStep  = j => wfSteps(j)[stepIdx(j)];
const nxtStep  = j => wfSteps(j)[stepIdx(j)+1]||null;
const prvStep  = j => wfSteps(j)[stepIdx(j)-1]||null;
const pct      = j => Math.round(((stepIdx(j)+1)/wfSteps(j).length)*100);
const daysUntil= d => d?Math.ceil((new Date(d)-new Date())/86400000):999;
const dcol     = d => { const n=daysUntil(d); return n<0?"#ff4d4d":n<=3?"#ff9f43":n<=7?"#e8c547":"#4ec9a0"; };
const rcol     = id => ALL_ROLES.find(r=>r.id===id)?.color||"#888";
const rname    = id => ALL_ROLES.find(r=>r.id===id)?.label||"—";
const defOwner = (type,sid) => (WORKFLOW[type]||WORKFLOW.screenprint_new).find(s=>s.id===sid)?.owner||null;

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [jobs,    setJobs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(null);
  const [view,    setView]    = useState("today");
  const [selJob,  setSelJob]  = useState(null);
  const [notif,   setNotif]   = useState(null);
  const [ovFilter,setOvFilter]= useState({urgency:"all",type:"all",stage:"all",stat:null});
  const [listMode,setListMode]= useState("list");
  const [todaySheet,setTodaySheet]=useState({brother:[],lead_printer:[],press_assist:[],harrison:[],emb_assist:[],lupe:[]});
  const [todayNotes,setTodayNotes]=useState("");
  const [rsHistory, setRsHistory] =useState([]);
  const [calDate,   setCalDate]   =useState(new Date());
  const dragJob = useRef(null);
  const todayKey = new Date().toISOString().slice(0,10);

  const toast = (msg,type="success")=>{setNotif({msg,type});setTimeout(()=>setNotif(null),3000);};

  const loadJobs = async()=>{
    const d=await sb.get("jobs","?order=priority.asc");
    if(d?.error){setDbError(d.error.message);setLoading(false);return;}
    setJobs((d||[]).map(r2j));setLoading(false);
  };
  const loadRS = async()=>{
    const d=await sb.get("runsheets",`?date=eq.${todayKey}&order=id.desc&limit=1`);
    if(d?.[0]){
      setTodaySheet({brother:d[0].brother||[],lead_printer:d[0].lead_printer||[],press_assist:d[0].press_assist||[],harrison:d[0].harrison||[],emb_assist:d[0].emb_assist||[],lupe:d[0].lupe||[]});
      setTodayNotes(d[0].manager_note||"");
    }
    const hist=await sb.get("runsheets",`?date=neq.${todayKey}&order=date.desc&limit=30`);
    if(Array.isArray(hist)) setRsHistory(hist.map(r=>({date:r.date,notes:r.manager_note||"",brother:r.brother||[],lead_printer:r.lead_printer||[],press_assist:r.press_assist||[],harrison:r.harrison||[],emb_assist:r.emb_assist||[],lupe:r.lupe||[]})));
  };

  useEffect(()=>{loadJobs();loadRS();const stop=sb.poll("jobs",d=>setJobs((d||[]).map(r2j)));return stop;},[]);
  useEffect(()=>{const l=localStorage.getItem("tnsp_reset");if(l&&l!==todayKey)setTodaySheet({brother:[],lead_printer:[],press_assist:[],harrison:[],emb_assist:[],lupe:[]});localStorage.setItem("tnsp_reset",todayKey);},[]);

  const saveRS=async(sheet,notes)=>{
    await sb.upsert("runsheets",{date:todayKey,manager_note:notes,brother:sheet.brother||[],lead_printer:sheet.lead_printer,press_assist:sheet.press_assist,harrison:sheet.harrison||[],emb_assist:sheet.emb_assist||[],lupe:sheet.lupe||[]});
  };
  const setSheet=s=>{setTodaySheet(s);saveRS(s,todayNotes);};
  const setNotes=n=>{setTodayNotes(n);saveRS(todaySheet,n);};

  const advance=async(jobId,extra={})=>{
    const j=jobs.find(x=>x.id===jobId);if(!j)return;
    const nx=nxtStep(j);if(!nx)return;
    const owner=defOwner(j.type,nx.id);
    setJobs(p=>p.map(x=>x.id===jobId?{...x,currentStep:nx.id,stepOwner:owner,...extra}:x));
    toast(`${j.customer} → ${nx.label}`);
    await sb.patch("jobs",{current_step:nx.id,step_owner:owner,...extra},{id:jobId});
    await sb.post("job_history",{job_id:jobId,from_step:j.currentStep,to_step:nx.id,changed_by:"manager"});
  };
  const stepBack=async(jobId)=>{
    const j=jobs.find(x=>x.id===jobId);if(!j)return;
    const pv=prvStep(j);if(!pv)return;
    const owner=defOwner(j.type,pv.id);
    setJobs(p=>p.map(x=>x.id===jobId?{...x,currentStep:pv.id,stepOwner:owner,trackingNum:"",isPickup:false}:x));
    toast(`← ${pv.label}`);
    await sb.patch("jobs",{current_step:pv.id,step_owner:owner,tracking_num:null,is_pickup:false},{id:jobId});
  };
  const archive=async(jobId)=>{
    setJobs(p=>p.map(x=>x.id===jobId?{...x,archived:true}:x));
    toast("Archived ✓");
    await sb.patch("jobs",{archived:true},{id:jobId});
  };
  const updateJob=async(jobId,upd)=>{
    const owner=defOwner(upd.type,upd.currentStep);
    setJobs(p=>p.map(x=>x.id===jobId?{...x,...upd,stepOwner:owner}:x));
    toast("Saved ✓");
    await sb.patch("jobs",{...j2d({...upd,stepOwner:owner}),step_owner:owner},{id:jobId});
  };
  const addFile=async(jobId,file)=>{
    const job=jobs.find(j=>j.id===jobId);if(!job)return;
    const path=`${jobId}/${Date.now()}_${file.name}`;
    toast("Uploading…");
    const url=await sb.uploadFile(path,file);
    if(!url){toast("Upload failed","error");return;}
    const newFiles=[...(job.files||[]),{name:file.name,url,type:file.type,uploadedAt:new Date().toISOString()}];
    setJobs(p=>p.map(x=>x.id===jobId?{...x,files:newFiles}:x));
    await sb.patch("jobs",{files:newFiles},{id:jobId});
    toast(`${file.name} attached ✓`);
  };
  const removeFile=async(jobId,fileUrl)=>{
    const job=jobs.find(j=>j.id===jobId);if(!job)return;
    const newFiles=(job.files||[]).filter(f=>f.url!==fileUrl);
    setJobs(p=>p.map(x=>x.id===jobId?{...x,files:newFiles}:x));
    await sb.patch("jobs",{files:newFiles},{id:jobId});
    toast("File removed");
  };
  const resetRS=async()=>{
    const total=Object.values(todaySheet).flat().length;
    if(total>0)setRsHistory(p=>[{date:todayKey,notes:todayNotes,...todaySheet},...p]);
    const empty={brother:[],lead_printer:[],press_assist:[],harrison:[],emb_assist:[],lupe:[]};
    setTodaySheet(empty);setTodayNotes("");await saveRS(empty,"");toast("Runsheet cleared");
  };
  const addJob=async(j)=>{
    const maxP=jobs.length>0?Math.max(...jobs.map(x=>x.priority)):0;
    const owner=defOwner(j.type,j.currentStep);
    const nj={...j,priority:maxP+1,stepOwner:owner,files:[]};
    const [c]=await sb.post("jobs",j2d(nj));
    if(c){setJobs(p=>[...p,r2j(c)]);toast(`${j.customer} added`);}
  };
  const dragStart=id=>{dragJob.current=id;};
  const drop=async(targetId)=>{
    if(!dragJob.current||dragJob.current===targetId)return;
    const sorted=[...jobs].sort((a,b)=>a.priority-b.priority);
    const fi=sorted.findIndex(j=>j.id===dragJob.current);
    const ti=sorted.findIndex(j=>j.id===targetId);
    const moved=sorted.splice(fi,1)[0];sorted.splice(ti,0,moved);
    const reordered=sorted.map((j,i)=>({...j,priority:i+1}));
    setJobs(reordered);dragJob.current=null;
    await Promise.all(reordered.map(j=>sb.patch("jobs",{priority:j.priority},{id:j.id})));
  };

  const openOverview=(statFilter)=>{setOvFilter(f=>({urgency:"all",type:"all",stage:"all",stat:null,...statFilter}));setView("overview");};

  const activeJobs  =jobs.filter(j=>!j.archived);
  const archivedJobs=jobs.filter(j=>j.archived);
  const rushCount   =activeJobs.filter(j=>j.urgency==="rush").length;
  const overdueCount=activeJobs.filter(j=>j.dueDate&&daysUntil(j.dueDate)<0).length;
  const weekCount   =activeJobs.filter(j=>{if(!j.dueDate)return false;const d=daysUntil(j.dueDate);return d>=0&&d<=7;}).length;
  const nodepCount  =activeJobs.filter(j=>!j.depositPaid&&j.currentStep!=="quote").length;
  const shipCount   =activeJobs.filter(j=>j.currentStep==="readyship").length;

  if(loading) return <div style={{minHeight:"100vh",background:"#0d0d0d",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16}}><div style={{width:42,height:42,background:"#e8c547",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:16,clipPath:"polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)"}}>TN</div><div style={{color:"#555",fontSize:13,letterSpacing:2}}>LOADING…</div></div>;
  if(dbError)  return <div style={{minHeight:"100vh",background:"#0d0d0d",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12}}><div style={{color:"#ff4d4d",fontSize:16}}>DB Error: {dbError}</div><button style={{padding:"8px 20px",background:"#e8c547",color:"#0d0d0d",border:"none",borderRadius:4,cursor:"pointer",fontWeight:700}} onClick={loadJobs}>Retry</button></div>;

  return (
    <div style={S.root}>
      <div style={S.bgGrid}/>
      {notif&&<div style={{...S.notif,background:notif.type==="error"?"#ff4d4d":"#4ec9a0"}}>{notif.msg}</div>}

      {/* ── Header ── */}
      <header style={S.header}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={S.logo}>
            <div style={S.logoMark}>TN</div>
            <div>
              <div style={S.logoTitle}>TRUE NORTH</div>
              <div style={S.logoSub}>PRODUCTION</div>
              <div style={{fontSize:9,color:"#4ec9a0",letterSpacing:1}}>● LIVE</div>
            </div>
          </div>
          <div style={S.navBtns}>
            <button style={{...S.navBtn,...(view==="today"?S.navBtnActive:{})}} onClick={()=>setView("today")}>📋 Today</button>
            <button style={{...S.navBtn,...(view==="overview"?S.navBtnActive:{})}} onClick={()=>setView("overview")}>🔭 Overview</button>
            <button style={{...S.navBtn,...(view==="calendar"?S.navBtnActive:{})}} onClick={()=>setView("calendar")}>📅 Calendar</button>
            <button style={{...S.navBtn,...(view==="admin"?S.navBtnActive:{})}} onClick={()=>setView("admin")}>🗂 Admin</button>
            <button style={{...S.navBtn,...(view==="archive"?S.navBtnActive:{})}} onClick={()=>setView("archive")}>📁 Archive</button>
          </div>
        </div>
        <button style={S.addBtn} onClick={()=>setSelJob("new")}>+ New Job</button>
      </header>

      {/* ── Stats bar ── */}
      <div style={S.statsBar}>
        {[
          {label:"Active Jobs",    value:activeJobs.length, color:"#7eb8f7", filter:{}},
          {label:"Rush",           value:rushCount,          color:"#ff9f43", filter:{urgency:"rush"}},
          {label:"Due This Week",  value:weekCount,          color:"#e8c547", filter:{stat:"week"}},
          {label:"Overdue",        value:overdueCount,       color:"#ff4d4d", filter:{stat:"overdue"}},
          {label:"⚠ No Deposit",   value:nodepCount,         color:"#f79e7e", filter:{stat:"nodeposit"}},
          {label:"📫 Ready to Ship",value:shipCount,          color:"#4ec9a0", filter:{stat:"readyship"}},
        ].map(s=>(
          <div key={s.label} style={{...S.stat,cursor:"pointer"}} onClick={()=>openOverview(s.filter)}>
            <div style={{...S.statVal,color:s.color}}>{s.value}</div>
            <div style={S.statLbl}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Main ── */}
      <main style={S.main}>
        {view==="today"    && <TodayView jobs={activeJobs} sheet={todaySheet} setSheet={setSheet} notes={todayNotes} setNotes={setNotes} onAdvance={advance} onSelect={j=>{setSelJob(j);}} onReset={resetRS} history={rsHistory} toast={toast}/>}
        {view==="overview" && <OverviewView jobs={activeJobs} filter={ovFilter} setFilter={setOvFilter} listMode={listMode} setListMode={setListMode} onSelect={j=>{setSelJob(j);}} onDragStart={dragStart} onDrop={drop} onAdvance={advance}/>}
        {view==="calendar" && <CalendarView jobs={activeJobs} calDate={calDate} setCalDate={setCalDate} onSelect={j=>{setSelJob(j);}}/>}
        {view==="admin"    && <AdminView jobs={activeJobs} onAdvance={advance} onSelect={j=>{setSelJob(j);}} toast={toast}/>}
        {view==="archive"  && <ArchiveView jobs={archivedJobs} history={rsHistory} onSelect={j=>{setSelJob(j);}}/>}
      </main>

      {selJob&&selJob!=="new"&&(
        <DetailModal key={selJob.id} job={jobs.find(j=>j.id===selJob.id)||selJob}
          onAdvance={advance} onStepBack={stepBack} onArchive={archive}
          onUpdateJob={updateJob} onAddFile={addFile} onRemoveFile={removeFile}
          onClose={()=>setSelJob(null)} toast={toast}/>
      )}
      {selJob==="new"&&<AddJobModal onAdd={j=>{addJob(j);setSelJob(null);}} onClose={()=>setSelJob(null)}/>}
    </div>
  );
}

// ── Today View ────────────────────────────────────────────────────────────────
function TodayView({jobs,sheet,setSheet,notes,setNotes,onAdvance,onSelect,onReset,history,toast}){
  const today=new Date().toLocaleDateString("en-CA",{weekday:"long",year:"numeric",month:"long",day:"numeric"});
  const assignedIds=Object.values(sheet).flat();
  const eligible=jobs.filter(j=>!["shipped","followup"].includes(j.currentStep)).sort((a,b)=>a.priority-b.priority);

  const addToRS=(rid,jid)=>{
    if(sheet[rid]?.includes(jid))return;
    setSheet({...sheet,[rid]:[...(sheet[rid]||[]),jid]});
    toast(`Added to ${RUNSHEET_ROLES.find(r=>r.id===rid)?.label}`);
  };
  const removeFromRS=(rid,jid)=>setSheet({...sheet,[rid]:sheet[rid].filter(id=>id!==jid)});
  const moveUp=(rid,idx)=>{const a=[...sheet[rid]];if(idx===0)return;[a[idx-1],a[idx]]=[a[idx],a[idx-1]];setSheet({...sheet,[rid]:a});};
  const moveDown=(rid,idx)=>{const a=[...sheet[rid]];if(idx===a.length-1)return;[a[idx],a[idx+1]]=[a[idx+1],a[idx]];setSheet({...sheet,[rid]:a});};

  return (
    <div style={{maxWidth:1200,margin:"0 auto"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:20,flexWrap:"wrap",gap:12}}>
        <div>
          <div style={{fontSize:11,color:"#555",letterSpacing:2,textTransform:"uppercase"}}>{today}</div>
          <div style={{fontSize:22,fontWeight:800,letterSpacing:3,color:"#f0ede8",marginTop:4}}>TODAY'S RUNSHEET</div>
        </div>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          <div style={{background:"#ffffff10",padding:"6px 16px",borderRadius:20,fontSize:12,color:"#888"}}>{assignedIds.length} assigned</div>
          <button style={{padding:"6px 16px",background:"#ff4d4d18",border:"1px solid #ff4d4d40",color:"#ff4d4d",borderRadius:6,cursor:"pointer",fontSize:12,fontWeight:700}} onClick={onReset}>↺ Reset Day</button>
        </div>
      </div>

      <div style={{marginBottom:20}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
          <span style={{fontSize:11,color:"#e8c547",letterSpacing:1,fontWeight:700}}>📌 Team Notes</span>
        </div>
        <textarea style={{width:"100%",background:"#1a1a1a",border:"1px solid #e8c54730",color:"#d4d0c8",borderRadius:6,padding:"10px 14px",fontSize:13,fontFamily:"inherit",resize:"vertical",boxSizing:"border-box"}}
          placeholder="Daily notes, ink locations, priorities…" value={notes} onChange={e=>setNotes(e.target.value)} rows={2}/>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1.8fr",gap:20}}>
        {/* Job pool */}
        <div style={{background:"#141414",border:"1px solid #ffffff10",borderRadius:8,overflow:"hidden",maxHeight:680,overflowY:"auto"}}>
          <div style={{padding:"10px 14px",background:"#1a1a1a",borderBottom:"1px solid #ffffff10",fontSize:10,letterSpacing:2,color:"#555",textTransform:"uppercase",position:"sticky",top:0,zIndex:1}}>
            ALL ACTIVE JOBS ({eligible.length})
          </div>
          {eligible.map(job=>{
            const s=curStep(job);const already=assignedIds.includes(job.id);
            return (
              <div key={job.id} style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",padding:"10px 14px",borderBottom:"1px solid #ffffff08",gap:10,opacity:already?0.4:1}}>
                <div style={{flex:1,minWidth:0,cursor:"pointer"}} onClick={()=>onSelect(job)}>
                  <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap",marginBottom:3}}>
                    <span style={S.priBadge}>#{job.priority}</span>
                    {job.jobNum&&<span style={S.jobBadge}>#{job.jobNum}</span>}
                    {job.urgency==="rush"&&<span style={S.rushBadge}>RUSH</span>}
                  </div>
                  <div style={{fontSize:13,fontWeight:600,color:"#d4d0c8",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{job.customer}</div>
                  <div style={{fontSize:11,color:"#555"}}>{s?.icon} {s?.label}</div>
                  {job.dueDate&&<div style={{fontSize:10,color:dcol(job.dueDate),marginTop:2}}>{daysUntil(job.dueDate)<0?"OVERDUE":`Due ${job.dueDate}`}</div>}
                </div>
                {!already?(
                  <div style={{display:"flex",flexDirection:"column",gap:4,flexShrink:0}}>
                    {RUNSHEET_ROLES.map(r=>(
                      <button key={r.id} style={{padding:"3px 8px",background:"transparent",border:`1px solid ${r.color}50`,color:r.color,borderRadius:4,cursor:"pointer",fontSize:10,fontWeight:700,whiteSpace:"nowrap"}}
                        onClick={()=>addToRS(r.id,job.id)}>+{r.label.split(" ")[0]}</button>
                    ))}
                  </div>
                ):<span style={{fontSize:11,color:"#4ec9a0",flexShrink:0,marginTop:4}}>✓</span>}
              </div>
            );
          })}
        </div>

        {/* Runsheet columns */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
          {RUNSHEET_ROLES.map(fr=>{
            const rjobs=(sheet[fr.id]||[]).map(id=>jobs.find(j=>j.id===id)).filter(Boolean);
            return (
              <div key={fr.id} style={{background:"#141414",border:"1px solid #ffffff10",borderRadius:8,overflow:"hidden",display:"flex",flexDirection:"column"}}>
                <div style={{padding:"8px 12px",background:"#1a1a1a",borderBottom:"1px solid #ffffff10",borderLeft:`3px solid ${fr.color}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:11,fontWeight:800,letterSpacing:1,color:fr.color}}>{fr.label}</span>
                  <span style={{background:"#ffffff15",borderRadius:10,padding:"1px 6px",fontSize:10,color:"#f0ede8"}}>{rjobs.length}</span>
                </div>
                <div style={{flex:1,overflowY:"auto",maxHeight:520}}>
                  {rjobs.length===0&&<div style={{padding:"12px",fontSize:11,color:"#333",textAlign:"center"}}>None</div>}
                  {rjobs.map((job,idx)=>{
                    const s=curStep(job);const nx=nxtStep(job);
                    return (
                      <div key={job.id} style={{padding:"8px 10px",borderBottom:"1px solid #ffffff08"}}>
                        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                          <span style={{width:20,height:20,borderRadius:"50%",background:fr.color+"22",color:fr.color,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:10,flexShrink:0}}>{idx+1}</span>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:12,fontWeight:600,color:"#d4d0c8",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{job.customer}{job.jobNum&&<span style={{fontSize:9,color:"#e8c547",marginLeft:4}}>#{job.jobNum}</span>}</div>
                            <div style={{fontSize:10,color:"#555"}}>{s?.icon} {s?.label}</div>
                          </div>
                          <button style={{background:"transparent",border:"none",color:"#333",cursor:"pointer",fontSize:12,padding:"0 2px",flexShrink:0}} onClick={()=>removeFromRS(fr.id,job.id)}>✕</button>
                        </div>
                        <div style={{display:"flex",gap:4}}>
                          <button style={{fontSize:9,background:"#ffffff08",border:"none",color:"#555",cursor:"pointer",padding:"2px 5px",borderRadius:2}} onClick={()=>moveUp(fr.id,idx)}>▲</button>
                          <button style={{fontSize:9,background:"#ffffff08",border:"none",color:"#555",cursor:"pointer",padding:"2px 5px",borderRadius:2}} onClick={()=>moveDown(fr.id,idx)}>▼</button>
                          {nx&&<button style={{fontSize:9,background:"#e8c54715",border:"1px solid #e8c54740",color:"#e8c547",cursor:"pointer",padding:"2px 6px",borderRadius:2,marginLeft:"auto"}} onClick={()=>{onAdvance(job.id);toast(`→ ${nx.label}`);}}>→{nx.label.slice(0,8)}</button>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Overview View ─────────────────────────────────────────────────────────────
function OverviewView({jobs,filter,setFilter,listMode,setListMode,onSelect,onDragStart,onDrop,onAdvance}){
  const [search,setSearch]=useState("");
  const filtered=jobs.filter(j=>{
    if(filter.urgency!=="all"&&j.urgency!==filter.urgency)return false;
    if(filter.type!=="all"&&j.type!==filter.type)return false;
    if(filter.stat==="overdue"&&!(j.dueDate&&daysUntil(j.dueDate)<0))return false;
    if(filter.stat==="week"){const d=daysUntil(j.dueDate);if(!(d>=0&&d<=7))return false;}
    if(filter.stat==="nodeposit"&&!(!j.depositPaid&&j.currentStep!=="quote"))return false;
    if(filter.stat==="readyship"&&j.currentStep!=="readyship")return false;
    if(filter.stage!=="all"){
      if(filter.stage.startsWith("step_")){if(j.currentStep!==filter.stage.slice(5))return false;}
      else{const b=STAGE_BUCKETS.find(x=>x.key===filter.stage);if(b&&!b.steps.includes(j.currentStep))return false;}
    }
    if(search){const q=search.toLowerCase();if(![j.customer,j.product,j.jobNum,j.notes].some(v=>v?.toLowerCase().includes(q)))return false;}
    return true;
  }).sort((a,b)=>a.priority-b.priority);

  const hasFilter=filter.urgency!=="all"||filter.type!=="all"||filter.stage!=="all"||filter.stat||search;

  return (
    <div style={{maxWidth:1200,margin:"0 auto"}}>
      {/* Filters */}
      <div style={{display:"flex",gap:10,marginBottom:20,flexWrap:"wrap",alignItems:"center"}}>
        <input style={{...S.sel,padding:"8px 14px",width:220}} placeholder="Search…" value={search} onChange={e=>setSearch(e.target.value)}/>
        <select style={S.sel} value={filter.urgency} onChange={e=>setFilter(f=>({...f,urgency:e.target.value,stat:null}))}>
          <option value="all">All Urgency</option><option value="rush">Rush</option><option value="normal">Normal</option>
        </select>
        <select style={S.sel} value={filter.type} onChange={e=>setFilter(f=>({...f,type:e.target.value}))}>
          <option value="all">All Types</option>
          {JOB_TYPES.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <select style={S.sel} value={filter.stage} onChange={e=>setFilter(f=>({...f,stage:e.target.value,stat:null}))}>
          <option value="all">All Stages</option>
          {STAGE_BUCKETS.map(b=><option key={b.key} value={b.key}>{b.label}</option>)}
          {Object.values(WORKFLOW).flat().filter((s,i,a)=>a.findIndex(x=>x.id===s.id)===i).map(s=><option key={s.id} value={`step_${s.id}`}>{s.icon} {s.label}</option>)}
        </select>
        {hasFilter&&<button style={{...S.sel,color:"#ff4d4d",borderColor:"#ff4d4d40"}} onClick={()=>{setFilter({urgency:"all",type:"all",stage:"all",stat:null});setSearch("");}}>✕ Clear</button>}
        <span style={{fontSize:12,color:"#555",marginLeft:"auto"}}>{filtered.length} jobs</span>
        <div style={{display:"flex",gap:4}}>
          <button style={{...S.viewTogBtn,...(listMode==="list"?S.viewTogBtnActive:{})}} onClick={()=>setListMode("list")}>☰</button>
          <button style={{...S.viewTogBtn,...(listMode==="board"?S.viewTogBtnActive:{})}} onClick={()=>setListMode("board")}>⬛</button>
        </div>
      </div>

      {/* Stage tiles */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:20}}>
        {STAGE_BUCKETS.map(b=>{
          const bj=jobs.filter(j=>b.steps.includes(j.currentStep));
          const active=filter.stage===b.key;
          return (
            <div key={b.key} style={{...S.stageTile,borderColor:active?"#e8c547":"#ffffff10"}}
              onClick={()=>setFilter(f=>({...f,stage:active?"all":b.key,stat:null}))}>
              <div style={{fontSize:11,color:"#555",letterSpacing:1,textTransform:"uppercase"}}>{b.label}</div>
              <div style={{fontSize:28,fontWeight:800,color:"#f0ede8",margin:"4px 0"}}>{bj.length}</div>
              <div style={{display:"flex",gap:8}}>
                {bj.filter(j=>j.urgency==="rush").length>0&&<span style={{fontSize:10,color:"#ff9f43"}}>🔥 {bj.filter(j=>j.urgency==="rush").length}</span>}
                {bj.filter(j=>j.dueDate&&daysUntil(j.dueDate)<0).length>0&&<span style={{fontSize:10,color:"#ff4d4d"}}>⚠ {bj.filter(j=>j.dueDate&&daysUntil(j.dueDate)<0).length}</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* List */}
      {listMode==="list"?(
        <div style={S.listWrap}>
          <div style={S.listHead}>
            <span style={{width:36}}>Pri</span><span style={{width:70}}>Job #</span>
            <span style={{flex:2}}>Customer / Product</span><span style={{flex:1}}>Type</span>
            <span style={{flex:1.5}}>Step</span><span style={{flex:1}}>Owner</span>
            <span style={{flex:1}}>Assigned</span><span style={{flex:1}}>Due</span>
            <span style={{width:72}}>Deposit</span>
          </div>
          {filtered.length===0&&<div style={{padding:"40px",textAlign:"center",color:"#333"}}>No jobs match</div>}
          {filtered.map(job=>{
            const s=curStep(job);const dc=dcol(job.dueDate);const d=daysUntil(job.dueDate);
            return (
              <div key={job.id} style={{...S.listRow,cursor:"pointer",borderLeft:job.urgency==="rush"?"3px solid #ff9f43":"3px solid transparent"}}
                draggable onDragStart={()=>onDragStart(job.id)} onDragOver={e=>e.preventDefault()} onDrop={()=>onDrop(job.id)}
                onClick={()=>onSelect(job)}>
                <span style={{width:36,fontSize:11,color:"#555"}}>#{job.priority}</span>
                <span style={{width:70,fontSize:11,color:"#e8c547",fontWeight:700}}>{job.jobNum||"—"}</span>
                <span style={{flex:2}}><div style={{fontWeight:600,color:"#f0ede8"}}>{job.customer}</div><div style={{fontSize:11,color:"#666"}}>{job.product}·{job.qty}pcs</div></span>
                <span style={{flex:1,fontSize:11,color:job.type==="embroidery"?"#7eb8f7":"#f79e7e"}}>{job.type==="embroidery"?"EMB":job.type==="screenprint_reprint"?"SP-R":"SP"}</span>
                <span style={{flex:1.5,fontSize:12}}>{s?.icon} {s?.label}</span>
                <span style={{flex:1,fontSize:11,color:rcol(job.stepOwner)}}>{rname(job.stepOwner)}</span>
                <span style={{flex:1,fontSize:11,color:rcol(job.assignedTo)}}>{rname(job.assignedTo)}</span>
                <span style={{flex:1,fontSize:12,color:dc}}>{!job.dueDate?"—":d<0?`${Math.abs(d)}d over`:d===0?"Today":`${d}d`}</span>
                <span style={{width:72,fontSize:11,color:job.depositPaid?"#4ec9a0":"#f79e7e"}}>{job.depositPaid?"✓":"⚠ Pend"}</span>
              </div>
            );
          })}
        </div>
      ):(
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,minWidth:900}}>
          {STAGE_BUCKETS.map(bucket=>{
            const bj=filtered.filter(j=>bucket.steps.includes(j.currentStep));
            return (
              <div key={bucket.key} style={S.boardCol}>
                <div style={S.boardHead}><span>{bucket.label}</span><span style={S.boardCnt}>{bj.length}</span></div>
                <div style={{padding:8,display:"flex",flexDirection:"column",gap:8}}>
                  {bj.map(job=>{
                    const s=curStep(job);const nx=nxtStep(job);const p=pct(job);const d=daysUntil(job.dueDate);
                    return (
                      <div key={job.id} style={{...S.card,...(job.urgency==="rush"?S.cardRush:{})}}
                        draggable onDragStart={()=>onDragStart(job.id)} onDragOver={e=>e.preventDefault()} onDrop={()=>onDrop(job.id)}
                        onClick={()=>onSelect(job)}>
                        <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:5}}>
                          <span style={S.priBadge}>#{job.priority}</span>
                          {job.jobNum&&<span style={S.jobBadge}>#{job.jobNum}</span>}
                          {job.urgency==="rush"&&<span style={S.rushBadge}>RUSH</span>}
                          <span style={{...S.typBadge,background:job.type==="embroidery"?"#7eb8f720":"#f79e7e20",color:job.type==="embroidery"?"#7eb8f7":"#f79e7e",marginLeft:"auto"}}>{job.type==="embroidery"?"EMB":"SP"}</span>
                        </div>
                        <div style={{fontWeight:700,fontSize:13,color:"#f0ede8",marginBottom:1}}>{job.customer}</div>
                        <div style={{fontSize:11,color:"#666",marginBottom:6}}>{job.product}·{job.qty}</div>
                        <div style={{display:"flex",alignItems:"center",gap:5,background:"#ffffff08",borderRadius:3,padding:"4px 7px",marginBottom:5,fontSize:11,color:"#d4d0c8"}}>{s?.icon} {s?.label}</div>
                        <div style={{height:2,background:"#ffffff10",borderRadius:2,marginBottom:5}}><div style={{height:"100%",width:`${p}%`,background:p===100?"#4ec9a0":job.urgency==="rush"?"#ff9f43":"#e8c547",borderRadius:2}}/></div>
                        <div style={{fontSize:10,color:dcol(job.dueDate)}}>{d<0?`⚠${Math.abs(d)}d over`:d===0?"Today!":job.dueDate}</div>
                        {nx&&<button style={{...S.advBtn,marginTop:6}} onClick={e=>{e.stopPropagation();onAdvance(job.id);}}>→ {nx.label}</button>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Calendar View ─────────────────────────────────────────────────────────────
function CalendarView({jobs,calDate,setCalDate,onSelect}){
  const year=calDate.getFullYear();
  const month=calDate.getMonth();
  const firstDay=new Date(year,month,1).getDay();
  const daysInMonth=new Date(year,month+1,0).getDate();
  const monthName=calDate.toLocaleDateString("en-CA",{month:"long",year:"numeric"});
  const today=new Date().toISOString().slice(0,10);

  const jobsByDate={};
  jobs.forEach(j=>{
    if(!j.dueDate||j.archived)return;
    if(!jobsByDate[j.dueDate])jobsByDate[j.dueDate]=[];
    jobsByDate[j.dueDate].push(j);
  });

  const cells=[];
  for(let i=0;i<firstDay;i++)cells.push(null);
  for(let d=1;d<=daysInMonth;d++)cells.push(d);

  return (
    <div style={{maxWidth:1100,margin:"0 auto"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div>
          <div style={{fontSize:11,color:"#555",letterSpacing:2,textTransform:"uppercase"}}>Production Schedule</div>
          <div style={{fontSize:22,fontWeight:800,letterSpacing:3,color:"#f0ede8",marginTop:4}}>{monthName.toUpperCase()}</div>
        </div>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          <button style={{...S.sel,cursor:"pointer",padding:"8px 16px"}} onClick={()=>setCalDate(new Date(year,month-1,1))}>← Prev</button>
          <button style={{...S.sel,cursor:"pointer",padding:"8px 16px"}} onClick={()=>setCalDate(new Date())}>Today</button>
          <button style={{...S.sel,cursor:"pointer",padding:"8px 16px"}} onClick={()=>setCalDate(new Date(year,month+1,1))}>Next →</button>
        </div>
      </div>

      {/* Legend */}
      <div style={{display:"flex",gap:16,marginBottom:16,flexWrap:"wrap"}}>
        {[["#ff4d4d","Overdue"],["#ff9f43","Rush"],["#e8c547","Due Soon (≤7d)"],["#4ec9a0","On Track"]].map(([c,l])=>(
          <div key={l} style={{display:"flex",alignItems:"center",gap:6,fontSize:11,color:"#666"}}>
            <div style={{width:10,height:10,borderRadius:2,background:c}}/>{l}
          </div>
        ))}
      </div>

      {/* Day headers */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,marginBottom:4}}>
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d=>(
          <div key={d} style={{textAlign:"center",fontSize:11,color:"#555",letterSpacing:1,padding:"8px 0"}}>{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4}}>
        {cells.map((day,i)=>{
          if(!day) return <div key={`empty-${i}`}/>;
          const dateStr=`${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
          const dayJobs=jobsByDate[dateStr]||[];
          const isToday=dateStr===today;
          const isPast=new Date(dateStr)<new Date(today.slice(0,10));
          return (
            <div key={day} style={{background:isToday?"#e8c54715":"#141414",border:`1px solid ${isToday?"#e8c547":"#ffffff10"}`,borderRadius:6,padding:"8px",minHeight:100}}>
              <div style={{fontSize:12,fontWeight:isToday?800:400,color:isToday?"#e8c547":isPast?"#444":"#888",marginBottom:6}}>{day}</div>
              {dayJobs.slice(0,4).map(job=>{
                const d=daysUntil(job.dueDate);
                const col=d<0?"#ff4d4d":job.urgency==="rush"?"#ff9f43":d<=7?"#e8c547":"#4ec9a0";
                return (
                  <div key={job.id} style={{background:col+"20",border:`1px solid ${col}40`,borderRadius:3,padding:"3px 6px",marginBottom:3,cursor:"pointer",fontSize:10,color:col,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}
                    onClick={()=>onSelect(job)}>
                    {job.jobNum?`#${job.jobNum} `:""}{job.customer}
                  </div>
                );
              })}
              {dayJobs.length>4&&<div style={{fontSize:10,color:"#555",marginTop:2}}>+{dayJobs.length-4} more</div>}
            </div>
          );
        })}
      </div>

      {/* Jobs due this month list */}
      {Object.entries(jobsByDate).filter(([d])=>d.startsWith(`${year}-${String(month+1).padStart(2,"0")}`)).length>0&&(
        <div style={{marginTop:24,background:"#141414",border:"1px solid #ffffff10",borderRadius:8,overflow:"hidden"}}>
          <div style={{padding:"12px 16px",background:"#1a1a1a",borderBottom:"1px solid #ffffff10",fontSize:11,letterSpacing:2,color:"#555",textTransform:"uppercase"}}>
            JOBS DUE THIS MONTH ({Object.entries(jobsByDate).filter(([d])=>d.startsWith(`${year}-${String(month+1).padStart(2,"0")}`)).reduce((acc,[,j])=>acc+j.length,0)})
          </div>
          {Object.entries(jobsByDate)
            .filter(([d])=>d.startsWith(`${year}-${String(month+1).padStart(2,"0")}`))
            .sort(([a],[b])=>a.localeCompare(b))
            .map(([date,dayJobs])=>dayJobs.map(job=>{
              const d=daysUntil(job.dueDate);const dc=dcol(job.dueDate);
              return (
                <div key={job.id} style={{...S.listRow,cursor:"pointer"}} onClick={()=>onSelect(job)}>
                  <span style={{width:80,fontSize:12,color:dc,fontWeight:600}}>{date.slice(5)}</span>
                  <span style={{width:70,fontSize:11,color:"#e8c547"}}>{job.jobNum?`#${job.jobNum}`:""}</span>
                  <span style={{flex:2,fontWeight:600,color:"#f0ede8"}}>{job.customer}</span>
                  <span style={{flex:1.5,fontSize:12,color:"#888"}}>{job.product}</span>
                  <span style={{flex:1,fontSize:12}}>{curStep(job)?.icon} {curStep(job)?.label}</span>
                  <span style={{width:80,fontSize:12,color:dc}}>{d<0?`${Math.abs(d)}d over`:d===0?"Today":`${d}d`}</span>
                  {job.urgency==="rush"&&<span style={S.rushBadge}>RUSH</span>}
                </div>
              );
            }))
          }
        </div>
      )}
    </div>
  );
}

// ── Admin View ────────────────────────────────────────────────────────────────
function AdminView({jobs,onAdvance,onSelect,toast}){
  const today=new Date().toISOString().slice(0,10);
  const [bc,setBc]=useState(()=>JSON.parse(localStorage.getItem(`tnsp_blanks_${today}`)||"{}"));
  const [fc,setFc]=useState(()=>JSON.parse(localStorage.getItem(`tnsp_forms_${today}`)||"{}"));
  const savB=u=>{setBc(u);localStorage.setItem(`tnsp_blanks_${today}`,JSON.stringify(u));};
  const savF=u=>{setFc(u);localStorage.setItem(`tnsp_forms_${today}`,JSON.stringify(u));};
  const blankJobs=jobs.filter(j=>j.currentStep==="blanks");
  const rcvdJobs =jobs.filter(j=>j.currentStep==="blanks_received");
  const formJobs =jobs.filter(j=>j.currentStep==="print_forms");

  const TaskSection=({icon,title,sub,jobs,checked,onCheck,advLabel,onAdv})=>(
    <div style={{background:"#141414",border:"1px solid #ffffff10",borderRadius:8,overflow:"hidden",marginBottom:20}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 20px",background:"#1a1a1a",borderBottom:"1px solid #ffffff10"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <span style={{fontSize:22}}>{icon}</span>
          <div><div style={{fontSize:14,fontWeight:700,color:"#f0ede8"}}>{title}</div><div style={{fontSize:11,color:"#555",marginTop:2}}>{sub}</div></div>
        </div>
        <div style={{padding:"4px 12px",borderRadius:12,fontSize:12,fontWeight:700,...(jobs.filter(j=>!checked[j.id]).length===0?{background:"#4ec9a022",color:"#4ec9a0"}:{background:"#f79e7e22",color:"#f79e7e"})}}>
          {jobs.filter(j=>!checked[j.id]).length===0?"✓ Done":`${jobs.filter(j=>!checked[j.id]).length} pending`}
        </div>
      </div>
      {jobs.length===0&&<div style={{padding:"20px",fontSize:13,color:"#333",textAlign:"center"}}>Nothing here.</div>}
      {jobs.map(job=>{
        const done=!!checked[job.id];
        return (
          <div key={job.id} style={{display:"flex",alignItems:"center",gap:14,padding:"12px 20px",borderBottom:"1px solid #ffffff08",opacity:done?0.5:1}}>
            <div style={{cursor:"pointer"}} onClick={()=>{const u={...checked,[job.id]:!done};onCheck(u);if(!done)toast("✓");}}>
              <div style={{width:22,height:22,borderRadius:4,border:"2px solid",borderColor:done?"#4ec9a0":"#444",background:done?"#4ec9a0":"transparent",display:"flex",alignItems:"center",justifyContent:"center"}}>
                {done&&<span style={{color:"#0d0d0d",fontSize:12,fontWeight:900}}>✓</span>}
              </div>
            </div>
            <div style={{flex:1,cursor:"pointer"}} onClick={()=>onSelect(job)}>
              <div style={{fontSize:14,fontWeight:700,color:"#f0ede8",display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                {job.customer}{job.jobNum&&<span style={{fontSize:11,color:"#e8c547"}}>#{job.jobNum}</span>}{job.urgency==="rush"&&<span style={S.rushBadge}>RUSH</span>}
              </div>
              <div style={{fontSize:12,color:"#666",marginTop:2}}>{job.product} · {job.qty} pcs</div>
            </div>
            <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6}}>
              <div style={{fontSize:11,color:dcol(job.dueDate),fontWeight:600}}>{daysUntil(job.dueDate)<0?"OVERDUE":`${daysUntil(job.dueDate)}d`}</div>
              {done&&<button style={{padding:"5px 10px",background:"#e8c54720",border:"1px solid #e8c54760",color:"#e8c547",borderRadius:4,cursor:"pointer",fontSize:11,fontWeight:700}} onClick={()=>{onAdv(job.id);toast(`→ ${advLabel}`);}}>→ {advLabel}</button>}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div style={{maxWidth:900,margin:"0 auto"}}>
      <div style={{marginBottom:24}}>
        <div style={{fontSize:11,color:"#555",letterSpacing:2,textTransform:"uppercase"}}>Daily Checklist</div>
        <div style={{fontSize:20,fontWeight:800,letterSpacing:3,color:"#f0ede8",marginTop:4}}>ADMIN TASKS</div>
        <div style={{fontSize:12,color:"#555",marginTop:4}}>{new Date().toLocaleDateString("en-CA",{weekday:"long",month:"long",day:"numeric"})}</div>
      </div>
      <TaskSection icon="📦" title="Blanks Ordered — Awaiting Arrival" sub="Mark received when blanks arrive" jobs={blankJobs} checked={bc} onCheck={savB} advLabel="Blanks Received" onAdv={onAdvance}/>
      <TaskSection icon="📬" title="Blanks Received — Print Forms" sub="Blanks in — print & organize production forms" jobs={[...rcvdJobs,...formJobs]} checked={fc} onCheck={savF} advLabel="Seps / Harrison" onAdv={onAdvance}/>
    </div>
  );
}

// ── Archive View ──────────────────────────────────────────────────────────────
function ArchiveView({jobs,history,onSelect}){
  const [search,setSearch]=useState("");
  const [tab,setTab]=useState("jobs");
  const filtered=jobs.filter(j=>!search||[j.customer,j.product,j.jobNum].some(v=>v?.toLowerCase().includes(search.toLowerCase())));
  return (
    <div style={{maxWidth:1100,margin:"0 auto"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:20,flexWrap:"wrap",gap:12}}>
        <div><div style={{fontSize:11,color:"#555",letterSpacing:2,textTransform:"uppercase"}}>Completed</div><div style={{fontSize:20,fontWeight:800,letterSpacing:3,color:"#f0ede8",marginTop:4}}>ARCHIVE</div></div>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          <input style={{...S.sel,padding:"8px 14px",width:220}} placeholder="Search…" value={search} onChange={e=>setSearch(e.target.value)}/>
          <div style={{display:"flex",gap:4}}>
            <button style={{...S.viewTogBtn,...(tab==="jobs"?S.viewTogBtnActive:{})}} onClick={()=>setTab("jobs")}>Jobs</button>
            <button style={{...S.viewTogBtn,...(tab==="history"?S.viewTogBtnActive:{})}} onClick={()=>setTab("history")}>Runsheet History</button>
          </div>
        </div>
      </div>
      {tab==="jobs"&&(
        <div style={S.listWrap}>
          {filtered.length===0&&<div style={{padding:"40px",textAlign:"center",color:"#333"}}>No archived jobs</div>}
          {filtered.map(job=>(
            <div key={job.id} style={{...S.listRow,opacity:0.6,cursor:"pointer"}} onClick={()=>onSelect(job)}>
              <span style={{width:36,fontSize:11,color:"#555"}}>#{job.priority}</span>
              <span style={{width:70,fontSize:11,color:"#555"}}>{job.jobNum||"—"}</span>
              <span style={{flex:2}}><div style={{fontWeight:600,color:"#888"}}>{job.customer}</div><div style={{fontSize:11,color:"#444"}}>{job.product}</div></span>
              <span style={{flex:1,fontSize:12,color:"#4ec9a0"}}>✓ Done</span>
              <span style={{flex:1,fontSize:12,color:"#444"}}>{job.dueDate}</span>
            </div>
          ))}
        </div>
      )}
      {tab==="history"&&(
        <div>
          {(history||[]).length===0&&<div style={{padding:"40px",textAlign:"center",color:"#333"}}>No history yet</div>}
          {(history||[]).map((entry,i)=><HistoryEntry key={i} entry={entry} jobs={jobs}/>)}
        </div>
      )}
    </div>
  );
}

function HistoryEntry({entry,jobs}){
  const [open,setOpen]=useState(false);
  const fmt=d=>new Date(d).toLocaleDateString("en-CA",{weekday:"long",year:"numeric",month:"long",day:"numeric"});
  const total=RUNSHEET_ROLES.reduce((a,r)=>(a+(entry[r.id]?.length||0)),0);
  const getJob=id=>{const j=jobs.find(j=>j.id===id);return j?`${j.customer} — ${j.product}`:`Job #${id}`;};
  return (
    <div style={{background:"#141414",border:"1px solid #ffffff10",borderRadius:8,marginBottom:10,overflow:"hidden"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 18px",cursor:"pointer"}} onClick={()=>setOpen(o=>!o)}>
        <div><div style={{fontSize:14,fontWeight:700,color:"#f0ede8",marginBottom:3}}>{fmt(entry.date)}</div><div style={{fontSize:12,color:"#555"}}>{total} jobs assigned</div></div>
        <span style={{fontSize:12,color:"#555"}}>{open?"▲":"▼"}</span>
      </div>
      {open&&(
        <div style={{padding:"0 18px 16px",borderTop:"1px solid #ffffff08"}}>
          {entry.notes&&<div style={{background:"#e8c54708",border:"1px solid #e8c54720",borderRadius:6,padding:"10px 14px",margin:"14px 0"}}><div style={{fontSize:10,color:"#e8c547",letterSpacing:1,marginBottom:4}}>Team Notes</div><div style={{fontSize:13,color:"#d4d0c8"}}>{entry.notes}</div></div>}
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginTop:14}}>
            {RUNSHEET_ROLES.map(fr=>{
              const rj=entry[fr.id]||[];if(!rj.length)return null;
              return (
                <div key={fr.id} style={{background:"#1a1a1a",border:"1px solid #ffffff10",borderRadius:6,overflow:"hidden"}}>
                  <div style={{padding:"7px 10px",fontSize:10,fontWeight:800,letterSpacing:1,textTransform:"uppercase",borderLeft:`3px solid ${fr.color}`,color:fr.color}}>{fr.label}·{rj.length}</div>
                  {rj.map((id,idx)=>(
                    <div key={id} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",borderTop:"1px solid #ffffff08"}}>
                      <span style={{width:18,height:18,borderRadius:"50%",background:fr.color+"22",color:fr.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:800,flexShrink:0}}>{idx+1}</span>
                      <span style={{fontSize:11,color:"#888"}}>{getJob(id)}</span>
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
}

// ── Detail Modal ──────────────────────────────────────────────────────────────
function DetailModal({job,onAdvance,onStepBack,onArchive,onUpdateJob,onAddFile,onRemoveFile,onClose,toast}){
  const wf=wfSteps(job);const cidx=stepIdx(job);const nx=nxtStep(job);const pv=prvStep(job);
  const [mode,setMode]=useState("view");
  const [showShip,setShowShip]=useState(false);
  const [dragging,setDragging]=useState(false);
  const [form,setForm]=useState({
    jobNum:job.jobNum||"",customer:job.customer||"",product:job.product||"",
    qty:job.qty||0,type:job.type||"screenprint_new",currentStep:job.currentStep||"quote",
    dueDate:job.dueDate||"",urgency:job.urgency||"normal",
    depositPaid:job.depositPaid||false,assignedTo:job.assignedTo||"",notes:job.notes||"",
  });
  const sf=(k,v)=>setForm(f=>({...f,[k]:v}));
  const save=()=>{onUpdateJob(job.id,{...form,qty:parseInt(form.qty)||0});setMode("view");};

  const handleAdv=()=>{if(job.currentStep==="readyship"){setShowShip(true);return;}onAdvance(job.id);onClose();};
  const handleShip=data=>{onAdvance(job.id,{tracking_num:data.trackingNum,is_pickup:data.isPickup});setShowShip(false);onClose();};

  const handleDrop=e=>{
    e.preventDefault();setDragging(false);
    const files=Array.from(e.dataTransfer.files);
    files.forEach(f=>onAddFile(job.id,f));
  };

  return (
    <>
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={e=>e.stopPropagation()}>
        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
          <div>
            <div style={{fontSize:11,color:"#e8c547",letterSpacing:2,marginBottom:4}}>{job.jobNum?`Order #${job.jobNum}`:`ID: ${job.id.slice(0,8)}…`}</div>
            <div style={{fontSize:22,fontWeight:800,color:"#f0ede8",marginBottom:2}}>{job.customer}</div>
            <div style={{fontSize:14,color:"#666"}}>{job.product} · {job.qty} pcs</div>
          </div>
          <div style={{display:"flex",gap:8}}>
            {job.urgency==="rush"&&<span style={S.rushBadge}>RUSH</span>}
            <button style={{...S.closeBtn,width:"auto",padding:"6px 12px",fontSize:12,color:mode==="edit"?"#4ec9a0":"#e8c547",borderColor:mode==="edit"?"#4ec9a040":"#e8c54740"}} onClick={()=>setMode(m=>m==="edit"?"view":"edit")}>{mode==="edit"?"✓ Done":"✏ Edit"}</button>
            <button style={S.closeBtn} onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Timeline */}
        {mode==="view"&&(
          <div style={{display:"flex",alignItems:"flex-start",overflowX:"auto",paddingBottom:8,marginBottom:20}}>
            {wf.map((step,i)=>(
              <div key={step.id} style={{display:"flex",flexDirection:"column",alignItems:"center",minWidth:64}}>
                <div style={{width:30,height:30,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,background:i<cidx?"#4ec9a0":i===cidx?"#e8c547":"#333",border:i===cidx?"2px solid #e8c547":"2px solid transparent"}}>
                  {i<cidx?"✓":step.icon}
                </div>
                {i<wf.length-1&&<div style={{height:2,width:34,marginTop:13,background:i<cidx?"#4ec9a0":"#333"}}/>}
                <div style={{fontSize:9,marginTop:5,textAlign:"center",lineHeight:1.3,maxWidth:60,color:i===cidx?"#e8c547":i<cidx?"#4ec9a0":"#555"}}>{step.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Edit form */}
        {mode==="edit"&&(
          <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:20}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              {[["Job #","jobNum","text"],["Customer","customer","text"],["Product","product","text"],["Qty","qty","number"],["Due Date","dueDate","date"]].map(([l,k,t])=>(
                <label key={k} style={{display:"flex",flexDirection:"column",gap:4}}>
                  <span style={{fontSize:11,color:"#555",letterSpacing:1,textTransform:"uppercase"}}>{l}</span>
                  <input style={S.inp} type={t} value={form[k]} onChange={e=>sf(k,e.target.value)}/>
                </label>
              ))}
              <label style={{display:"flex",flexDirection:"column",gap:4}}>
                <span style={{fontSize:11,color:"#555",letterSpacing:1,textTransform:"uppercase"}}>Job Type</span>
                <select style={S.inp} value={form.type} onChange={e=>sf("type",e.target.value)}>
                  {JOB_TYPES.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </label>
              <label style={{display:"flex",flexDirection:"column",gap:4}}>
                <span style={{fontSize:11,color:"#555",letterSpacing:1,textTransform:"uppercase"}}>Step</span>
                <select style={S.inp} value={form.currentStep} onChange={e=>sf("currentStep",e.target.value)}>
                  {(WORKFLOW[form.type]||[]).map(s=><option key={s.id} value={s.id}>{s.icon} {s.label}</option>)}
                </select>
              </label>
              <label style={{display:"flex",flexDirection:"column",gap:4}}>
                <span style={{fontSize:11,color:"#555",letterSpacing:1,textTransform:"uppercase"}}>Urgency</span>
                <select style={S.inp} value={form.urgency} onChange={e=>sf("urgency",e.target.value)}>
                  <option value="normal">Normal</option><option value="rush">Rush 🔥</option>
                </select>
              </label>
              <label style={{display:"flex",flexDirection:"column",gap:4}}>
                <span style={{fontSize:11,color:"#555",letterSpacing:1,textTransform:"uppercase"}}>Assign To</span>
                <select style={S.inp} value={form.assignedTo} onChange={e=>sf("assignedTo",e.target.value)}>
                  <option value="">Unassigned</option>
                  {ALL_ROLES.map(r=><option key={r.id} value={r.id}>{r.label}</option>)}
                </select>
              </label>
            </div>
            <label style={{display:"flex",alignItems:"center",gap:10,color:"#888",fontSize:14,cursor:"pointer"}}>
              <input type="checkbox" checked={form.depositPaid} onChange={e=>sf("depositPaid",e.target.checked)}/> Deposit received
            </label>
            <label style={{display:"flex",flexDirection:"column",gap:4}}>
              <span style={{fontSize:11,color:"#555",letterSpacing:1,textTransform:"uppercase"}}>Notes</span>
              <textarea style={{...S.inp,resize:"vertical"}} rows={3} value={form.notes} onChange={e=>sf("notes",e.target.value)}/>
            </label>
            <div style={{display:"flex",gap:10}}>
              <button style={{flex:1,padding:"10px",background:"#e8c547",color:"#0d0d0d",border:"none",borderRadius:6,fontWeight:800,cursor:"pointer",fontSize:13}} onClick={save}>Save Changes</button>
              <button style={{flex:1,padding:"10px",background:"#ffffff10",color:"#d4d0c8",border:"1px solid #ffffff20",borderRadius:6,cursor:"pointer",fontSize:13}} onClick={()=>setMode("view")}>Cancel</button>
            </div>
          </div>
        )}

        {/* View mode */}
        {mode==="view"&&(
          <>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:14}}>
            {[
              ["Job Type",   JOB_TYPES.find(t=>t.value===job.type)?.label, {}],
              ["Due Date",   job.dueDate||"Not set", {color:job.dueDate?dcol(job.dueDate):"#555"}],
              ["Deposit",    job.depositPaid?"✅ Received":"⚠ Pending", {color:job.depositPaid?"#4ec9a0":"#f79e7e"}],
              ["Step Owner", rname(job.stepOwner), {color:rcol(job.stepOwner)}],
              ["Assigned",   rname(job.assignedTo), {color:rcol(job.assignedTo)}],
              ["Priority",   `#${job.priority}`, {}],
              ...(job.trackingNum?[["Tracking", job.isPickup?"Pickup":job.trackingNum, {color:"#4ec9a0"}]]:[]),
            ].map(([l,v,st])=>(
              <div key={l} style={{background:"#1e1e1e",border:"1px solid #ffffff10",borderRadius:6,padding:"9px 12px"}}>
                <div style={{fontSize:10,color:"#555",letterSpacing:1,textTransform:"uppercase",marginBottom:3}}>{l}</div>
                <div style={{fontSize:13,fontWeight:600,color:"#d4d0c8",...st}}>{v}</div>
              </div>
            ))}
          </div>

          {job.notes&&<div style={{background:"#1e1e1e",border:"1px solid #ffffff10",borderRadius:6,padding:"10px 12px",marginBottom:14}}><div style={{fontSize:10,color:"#555",letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>Notes</div><div style={{fontSize:13,color:"#888",lineHeight:1.5}}>{job.notes}</div></div>}

          {/* Files */}
          <div style={{marginBottom:14}}>
            <div style={{fontSize:10,color:"#555",letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>Files & Attachments</div>
            <div
              style={{border:`2px dashed ${dragging?"#e8c547":"#333"}`,borderRadius:8,padding:"16px",textAlign:"center",transition:"all 0.2s",background:dragging?"#e8c54710":"transparent",marginBottom:8,cursor:"default"}}
              onDragOver={e=>{e.preventDefault();setDragging(true);}}
              onDragLeave={()=>setDragging(false)}
              onDrop={handleDrop}>
              <div style={{fontSize:12,color:dragging?"#e8c547":"#444"}}>
                {dragging?"Drop to attach":"🗂 Drag & drop files here (mockups, work orders, PDFs)"}
              </div>
            </div>
            {(job.files||[]).length>0&&(
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {(job.files||[]).map(f=>(
                  <div key={f.url} style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:"#1e1e1e",border:"1px solid #ffffff10",borderRadius:6,padding:"8px 12px"}}>
                    <a href={f.url} target="_blank" rel="noreferrer" style={{color:"#7eb8f7",fontSize:13,textDecoration:"none",display:"flex",alignItems:"center",gap:8}}>
                      <span>{f.type?.includes("image")?"🖼":f.type?.includes("pdf")?"📄":"📎"}</span>
                      <span style={{maxWidth:300,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.name}</span>
                    </a>
                    <button style={{background:"transparent",border:"none",color:"#444",cursor:"pointer",fontSize:14,padding:"2px 6px"}} onClick={()=>onRemoveFile(job.id,f.url)}>✕</button>
                  </div>
                ))}
              </div>
            )}
            {(job.mockupUrl||job.workOrderUrl)&&(
              <div style={{display:"flex",gap:8,marginTop:8,flexWrap:"wrap"}}>
                {job.mockupUrl&&<a href={job.mockupUrl} target="_blank" rel="noreferrer" style={{display:"inline-flex",alignItems:"center",gap:6,padding:"7px 12px",background:"#ffffff08",border:"1px solid #ffffff20",borderRadius:6,color:"#7eb8f7",fontSize:12,textDecoration:"none"}}>🖼 Mockup</a>}
                {job.workOrderUrl&&<a href={job.workOrderUrl} target="_blank" rel="noreferrer" style={{display:"inline-flex",alignItems:"center",gap:6,padding:"7px 12px",background:"#ffffff08",border:"1px solid #ffffff20",borderRadius:6,color:"#7eb8f7",fontSize:12,textDecoration:"none"}}>📄 Work Order</a>}
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {nx&&job.currentStep!=="followup"&&(
              <button style={{flex:2,padding:"10px",background:"#e8c547",color:"#0d0d0d",border:"none",borderRadius:6,fontWeight:800,cursor:"pointer",fontSize:13,minWidth:140}}
                onClick={handleAdv}>{job.currentStep==="readyship"?"🚚 Shipping Info":`→ ${nx.label}`}</button>
            )}
            {job.currentStep==="followup"&&(
              <button style={{flex:2,padding:"10px",background:"#4ec9a0",color:"#0d0d0d",border:"none",borderRadius:6,fontWeight:800,cursor:"pointer",fontSize:13}} onClick={()=>{onArchive(job.id);onClose();}}>✓ Archive Job</button>
            )}
            {pv&&!job.archived&&(
              <button style={{flex:1,padding:"10px",background:"transparent",color:"#ff9f43",border:"1px solid #ff9f4340",borderRadius:6,cursor:"pointer",fontSize:13}}
                onClick={()=>{onStepBack(job.id);onClose();}}>← {pv.label}</button>
            )}
          </div>
          </>
        )}
      </div>
    </div>
    {showShip&&<ShipModal job={job} onConfirm={handleShip} onClose={()=>setShowShip(false)}/>}
    </>
  );
}

// ── Ship Modal ────────────────────────────────────────────────────────────────
function ShipModal({job,onConfirm,onClose}){
  const [track,setTrack]=useState("");
  const [pickup,setPickup]=useState(false);
  const ok=pickup||track.trim().length>0;
  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={{...S.modal,maxWidth:420}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
          <div style={{fontSize:18,fontWeight:800,color:"#f0ede8"}}>Mark Shipped</div>
          <button style={S.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={{fontSize:13,color:"#666",marginBottom:16}}>{job.customer} — {job.product}</div>
        <label style={{display:"flex",alignItems:"center",gap:10,marginBottom:16,cursor:"pointer"}}>
          <input type="checkbox" checked={pickup} onChange={e=>setPickup(e.target.checked)} style={{width:16,height:16}}/>
          <span style={{color:"#d4d0c8",fontSize:14}}>Customer pickup — no tracking needed</span>
        </label>
        {!pickup&&<label style={{display:"flex",flexDirection:"column",gap:4,marginBottom:16}}>
          <span style={{fontSize:11,color:"#555",letterSpacing:1,textTransform:"uppercase"}}>Tracking Number *</span>
          <input style={S.inp} type="text" placeholder="e.g. 1Z999AA10123456784" value={track} onChange={e=>setTrack(e.target.value)}/>
        </label>}
        <div style={{display:"flex",gap:10}}>
          <button style={{flex:1,padding:"10px",background:ok?"#e8c547":"#333",color:ok?"#0d0d0d":"#555",border:"none",borderRadius:6,fontWeight:800,cursor:ok?"pointer":"not-allowed",fontSize:13}}
            disabled={!ok} onClick={()=>ok&&onConfirm({trackingNum:pickup?"PICKUP":track.trim(),isPickup:pickup})}>
            {pickup?"✓ Picked Up":"✓ Shipped"}
          </button>
          <button style={{flex:1,padding:"10px",background:"#ffffff10",color:"#d4d0c8",border:"1px solid #ffffff20",borderRadius:6,cursor:"pointer",fontSize:13}} onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Add Job Modal ─────────────────────────────────────────────────────────────
function AddJobModal({onAdd,onClose}){
  const [f,setF]=useState({jobNum:"",customer:"",product:"",qty:"",type:"screenprint_new",dueDate:"",urgency:"normal",currentStep:"quote",depositPaid:false,notes:""});
  const sf=(k,v)=>setF(x=>({...x,[k]:v}));
  const valid=f.customer&&f.product&&f.dueDate;
  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={{...S.modal,maxWidth:500}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:20}}>
          <div style={{fontSize:20,fontWeight:800,color:"#f0ede8"}}>New Job</div>
          <button style={S.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {[["Job #","jobNum","text"],["Customer *","customer","text"],["Product *","product","text"],["Qty","qty","number"],["Due Date *","dueDate","date"],["Notes","notes","text"]].map(([l,k,t])=>(
            <label key={k} style={{display:"flex",flexDirection:"column",gap:4}}>
              <span style={{fontSize:11,color:"#555",letterSpacing:1,textTransform:"uppercase"}}>{l}</span>
              <input style={S.inp} type={t} value={f[k]} onChange={e=>sf(k,e.target.value)}/>
            </label>
          ))}
          <label style={{display:"flex",flexDirection:"column",gap:4}}>
            <span style={{fontSize:11,color:"#555",letterSpacing:1,textTransform:"uppercase"}}>Type</span>
            <select style={S.inp} value={f.type} onChange={e=>sf("type",e.target.value)}>
              {JOB_TYPES.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </label>
          <label style={{display:"flex",flexDirection:"column",gap:4}}>
            <span style={{fontSize:11,color:"#555",letterSpacing:1,textTransform:"uppercase"}}>Starting Step</span>
            <select style={S.inp} value={f.currentStep} onChange={e=>sf("currentStep",e.target.value)}>
              {(WORKFLOW[f.type]||[]).map(s=><option key={s.id} value={s.id}>{s.icon} {s.label}</option>)}
            </select>
          </label>
          <label style={{display:"flex",flexDirection:"column",gap:4}}>
            <span style={{fontSize:11,color:"#555",letterSpacing:1,textTransform:"uppercase"}}>Urgency</span>
            <select style={S.inp} value={f.urgency} onChange={e=>sf("urgency",e.target.value)}>
              <option value="normal">Normal</option><option value="rush">Rush 🔥</option>
            </select>
          </label>
          <label style={{display:"flex",alignItems:"center",gap:10,color:"#888",fontSize:14,cursor:"pointer"}}>
            <input type="checkbox" checked={f.depositPaid} onChange={e=>sf("depositPaid",e.target.checked)}/> Deposit received
          </label>
        </div>
        <div style={{display:"flex",gap:10,marginTop:20}}>
          <button style={{flex:1,padding:"10px",background:valid?"#e8c547":"#333",color:valid?"#0d0d0d":"#555",border:"none",borderRadius:6,fontWeight:800,cursor:valid?"pointer":"not-allowed",fontSize:13}}
            disabled={!valid} onClick={()=>valid&&onAdd({...f,qty:parseInt(f.qty)||0})}>Add to Queue</button>
          <button style={{flex:1,padding:"10px",background:"#ffffff10",color:"#d4d0c8",border:"1px solid #ffffff20",borderRadius:6,cursor:"pointer",fontSize:13}} onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const S={
  root:       {minHeight:"100vh",background:"#0d0d0d",color:"#f0ede8",fontFamily:"'DM Mono','Courier New',monospace",position:"relative",overflow:"hidden"},
  bgGrid:     {position:"fixed",inset:0,zIndex:0,backgroundImage:"linear-gradient(#ffffff08 1px,transparent 1px),linear-gradient(90deg,#ffffff08 1px,transparent 1px)",backgroundSize:"40px 40px",pointerEvents:"none"},
  notif:      {position:"fixed",top:20,left:"50%",transform:"translateX(-50%)",padding:"10px 24px",borderRadius:6,color:"#0d0d0d",fontWeight:700,fontSize:13,zIndex:1000,letterSpacing:1},
  header:     {position:"relative",zIndex:10,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 24px",borderBottom:"1px solid #ffffff15",background:"#0d0d0dcc",backdropFilter:"blur(12px)",flexWrap:"wrap",gap:10},
  logo:       {display:"flex",alignItems:"center",gap:10},
  logoMark:   {width:38,height:38,background:"#e8c547",color:"#0d0d0d",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:14,clipPath:"polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)"},
  logoTitle:  {fontSize:14,fontWeight:800,letterSpacing:3,color:"#f0ede8"},
  logoSub:    {fontSize:8,letterSpacing:4,color:"#e8c547"},
  navBtns:    {display:"flex",gap:4,marginLeft:12},
  navBtn:     {padding:"7px 14px",background:"transparent",border:"1px solid #ffffff15",color:"#666",borderRadius:6,cursor:"pointer",fontSize:12,fontWeight:700,letterSpacing:0.5},
  navBtnActive:{background:"#e8c54720",borderColor:"#e8c54760",color:"#e8c547"},
  addBtn:     {padding:"8px 18px",background:"#e8c547",color:"#0d0d0d",border:"none",borderRadius:4,fontWeight:800,cursor:"pointer",fontSize:13,letterSpacing:1},
  statsBar:   {position:"relative",zIndex:10,display:"flex",borderBottom:"1px solid #ffffff15"},
  stat:       {flex:1,padding:"10px 16px",borderRight:"1px solid #ffffff10",display:"flex",flexDirection:"column",alignItems:"center"},
  statVal:    {fontSize:26,fontWeight:800,lineHeight:1},
  statLbl:    {fontSize:9,color:"#555",letterSpacing:1,marginTop:3,textTransform:"uppercase",textAlign:"center"},
  main:       {position:"relative",zIndex:10,padding:"20px 24px",overflowX:"auto"},
  sel:        {background:"#1a1a1a",border:"1px solid #ffffff20",color:"#d4d0c8",padding:"6px 12px",borderRadius:4,fontSize:12,cursor:"pointer"},
  viewTogBtn: {padding:"6px 10px",background:"transparent",border:"1px solid #ffffff20",color:"#666",borderRadius:4,cursor:"pointer",fontSize:11},
  viewTogBtnActive:{background:"#ffffff15",color:"#f0ede8",borderColor:"#ffffff40"},
  stageTile:  {background:"#141414",border:"1px solid",borderRadius:8,padding:"12px 16px",cursor:"pointer",transition:"border-color 0.15s"},
  listWrap:   {background:"#141414",border:"1px solid #ffffff10",borderRadius:8,overflow:"hidden"},
  listHead:   {display:"flex",gap:10,padding:"10px 16px",background:"#1a1a1a",borderBottom:"1px solid #ffffff10",fontSize:11,letterSpacing:1,textTransform:"uppercase",color:"#555"},
  listRow:    {display:"flex",gap:10,padding:"11px 16px",borderBottom:"1px solid #ffffff08",alignItems:"center"},
  boardCol:   {background:"#141414",border:"1px solid #ffffff10",borderRadius:8,overflow:"hidden",minHeight:200},
  boardHead:  {padding:"10px 14px",background:"#1a1a1a",borderBottom:"1px solid #ffffff10",display:"flex",justifyContent:"space-between",fontSize:11,fontWeight:700,letterSpacing:2,textTransform:"uppercase",color:"#888"},
  boardCnt:   {background:"#ffffff15",borderRadius:10,padding:"1px 8px",fontSize:11,color:"#f0ede8"},
  card:       {background:"#1e1e1e",border:"1px solid #ffffff10",borderRadius:6,padding:10,cursor:"pointer",userSelect:"none"},
  cardRush:   {borderLeft:"3px solid #ff9f43"},
  priBadge:   {fontSize:10,fontWeight:700,color:"#555",background:"#ffffff08",padding:"1px 5px",borderRadius:3},
  jobBadge:   {fontSize:10,fontWeight:800,color:"#e8c547",background:"#e8c54722",padding:"2px 6px",borderRadius:3},
  rushBadge:  {fontSize:10,fontWeight:800,background:"#ff9f4322",color:"#ff9f43",padding:"2px 6px",borderRadius:3,letterSpacing:1},
  typBadge:   {fontSize:10,fontWeight:700,padding:"2px 6px",borderRadius:3},
  advBtn:     {width:"100%",padding:"5px",background:"#e8c54720",border:"1px solid #e8c54760",color:"#e8c547",borderRadius:4,cursor:"pointer",fontSize:11,fontWeight:700},
  overlay:    {position:"fixed",inset:0,background:"#000000cc",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,padding:20},
  modal:      {background:"#141414",border:"1px solid #ffffff20",borderRadius:10,padding:24,width:"100%",maxWidth:680,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 30px 80px #000000cc"},
  closeBtn:   {background:"#ffffff10",border:"none",color:"#888",width:30,height:30,borderRadius:4,cursor:"pointer",fontSize:14},
  inp:        {background:"#1e1e1e",border:"1px solid #ffffff20",color:"#f0ede8",padding:"8px 12px",borderRadius:4,fontSize:13,fontFamily:"inherit"},
};

