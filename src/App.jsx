import { useState, useEffect, useRef } from "react";

const SB_URL = import.meta.env.VITE_SUPABASE_URL;
const SB_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const sb = {
  get: async (table, q="") => {
    const r = await fetch(`${SB_URL}/rest/v1/${table}${q}`, { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } });
    return r.json();
  },
  post: async (table, body) => {
    const r = await fetch(`${SB_URL}/rest/v1/${table}`, { method:"POST", headers:{ apikey:SB_KEY, Authorization:`Bearer ${SB_KEY}`, "Content-Type":"application/json", Prefer:"return=representation" }, body:JSON.stringify(body) });
    return r.json();
  },
  patch: async (table, body, match) => {
    const q = Object.entries(match).map(([k,v])=>`${k}=eq.${v}`).join("&");
    const r = await fetch(`${SB_URL}/rest/v1/${table}?${q}`, { method:"PATCH", headers:{ apikey:SB_KEY, Authorization:`Bearer ${SB_KEY}`, "Content-Type":"application/json", Prefer:"return=representation" }, body:JSON.stringify(body) });
    return r.json();
  },
  del: async (table, match) => {
    const q = Object.entries(match).map(([k,v])=>`${k}=eq.${v}`).join("&");
    await fetch(`${SB_URL}/rest/v1/${table}?${q}`, { method:"DELETE", headers:{ apikey:SB_KEY, Authorization:`Bearer ${SB_KEY}` } });
  }
};

const LISA_STAGES = [
  { key:"new_sale",       label:"New Sale",          color:"#7eb8f7" },
  { key:"in_progress",    label:"In Progress",       color:"#e8c547" },
  { key:"ready_for_lupe", label:"Ready for Lupe",    color:"#4caf7d" },
];
const LUPE_STAGES = [
  { key:"ready_for_lupe",  label:"Incoming from Lisa",  color:"#4caf7d" },
  { key:"pre_production",  label:"Pre-Production",      color:"#ff9f43" },
  { key:"in_production",   label:"In Production",       color:"#c8392b" },
  { key:"boxing",          label:"Boxing",              color:"#a29bfe" },
  { key:"ready_to_ship",   label:"Ready to Ship",       color:"#00cec9" },
  { key:"shipping",        label:"Shipped / Picked Up", color:"#2a7a4b" },
];
const ALL_STAGES = [...LISA_STAGES, ...LUPE_STAGES];

const LISA_CHECKLIST = [
  { key:"deposit_received",  label:"Deposit Received" },
  { key:"artwork_received",  label:"Artwork Received" },
  { key:"artwork_to_andrew", label:"Artwork Provided to Andrew (if required)" },
  { key:"mockup_created",    label:"Digital Mockup Created" },
  { key:"mockup_approved",   label:"Digital Mockup Approved" },
  { key:"product_ordered",   label:"Product Ordered" },
  { key:"receiving_doc",     label:"Receiving Doc Completed" },
];
const LUPE_CHECKLIST = [
  { key:"product_received", label:"Product Received" },
  { key:"screens_burned",   label:"Screens Burned / Digitized" },
  { key:"ink_mixed",        label:"Ink Mixed / Thread Pulled" },
  { key:"product_on_carts", label:"Product on Carts" },
];

const PRODUCTION_TYPES = ["Screen Print — Fionn","Embroidery","DTF","Vinyl"];
const SUPPLIERS = ["S&S Canada","SanMar Canada","Private Agent","AS Colour","Other"];

const DEC_COLORS = {
  "Screen Printing":{ bg:"#fffbe6", border:"#e8c547", dot:"#c49a2a" },
  "Embroidery":     { bg:"#f3eeff", border:"#b39ddb", dot:"#7c4dbd" },
  "DTF":            { bg:"#e8f4fd", border:"#7eb8f7", dot:"#1a6eb5" },
  "Vinyl":          { bg:"#fce8f0", border:"#f7a8c4", dot:"#c8215a" },
  "Mixed":          { bg:"#fff2e8", border:"#ffb37a", dot:"#e07b20" },
};

const C = {
  bg:"#f5f2eb", panel:"#ffffff", card:"#ffffff", border:"#e0dbd4",
  red:"#c8392b", gold:"#c49a2a", text:"#0d0d0d", muted:"#999", sub:"#666",
  green:"#2a7a4b", orange:"#e07b20", cardBg:"#faf8f4", headerBg:"#0d0d0d",
};

const S = {
  root:{ minHeight:"100vh", background:C.bg, color:C.text, fontFamily:"'DM Mono','Courier New',monospace", fontSize:13 },
  header:{ background:C.headerBg, borderBottom:`3px solid ${C.red}`, padding:"12px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:100 },
  logo:{ fontFamily:"'Bebas Neue',sans-serif", fontSize:22, letterSpacing:4, color:"#f5f2eb" },
  btn:(v="p")=>({ padding:"8px 16px", background:v==="p"?C.red:v==="g"?C.green:v==="y"?C.gold:"transparent", color:v==="y"?"#fff":v==="p"||v==="g"?"#fff":C.text, border:`1px solid ${v==="p"?C.red:v==="g"?C.green:v==="y"?C.gold:"#ccc"}`, borderRadius:3, cursor:"pointer", fontSize:11, letterSpacing:"1px", textTransform:"uppercase", fontFamily:"'DM Mono',monospace", fontWeight:700 }),
  inp:{ background:"#fff", border:"1px solid #ddd", borderBottom:"2px solid #ccc", color:C.text, padding:"8px 12px", fontSize:13, fontFamily:"'DM Mono',monospace", width:"100%", outline:"none", borderRadius:3, boxSizing:"border-box" },
  sel:{ background:"#fff", border:"1px solid #ddd", borderBottom:"2px solid #ccc", color:C.text, padding:"8px 12px", fontSize:13, fontFamily:"'DM Mono',monospace", width:"100%", outline:"none", borderRadius:3, appearance:"none", boxSizing:"border-box" },
  ta:{ background:"#fff", border:"1px solid #ddd", borderBottom:"2px solid #ccc", color:C.text, padding:"8px 12px", fontSize:12, fontFamily:"'DM Mono',monospace", width:"100%", outline:"none", borderRadius:3, resize:"vertical", minHeight:70, boxSizing:"border-box" },
  lbl:{ fontSize:10, letterSpacing:"1.5px", textTransform:"uppercase", color:C.muted, display:"block", marginBottom:5 },
  tag:(c)=>({ fontSize:10, letterSpacing:"1px", textTransform:"uppercase", padding:"3px 8px", background:c+"18", color:c, border:`1px solid ${c}40`, borderRadius:2, display:"inline-block" }),
  g2:{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 },
  g3:{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14, marginBottom:14 },
  divider:{ height:1, background:"#e8e2d8", margin:"14px 0" },
  check:(done)=>({ width:20, height:20, border:`2px solid ${done?C.green:"#ccc"}`, borderRadius:3, background:done?C.green:"#fff", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0, transition:"all .15s" }),
};

const stageInfo = (key) => ALL_STAGES.find(s=>s.key===key) || { label:key, color:"#555" };
const isLisaStage = (key) => LISA_STAGES.some(s=>s.key===key);
const isLupeStage = (key) => LUPE_STAGES.some(s=>s.key===key);

function r2j(r) {
  return {
    id:r.id, jobNum:r.job_num||"", customer:r.customer||r.client||"",
    company:r.company||"", product:r.product||r.garment_style||"",
    qty:r.qty||0, dueDate:r.due_date||"", decorationType:r.decoration_type||"",
    supplier:r.supplier||"", styleNum:r.style_num||"",
    colour:r.garment_colour||r.colour||"", eta:r.eta||"", notes:r.notes||"",
    stage:r.stage||"new_sale", lisaChecklist:r.lisa_checklist||{},
    lupeChecklist:r.lupe_checklist||{}, productionAssignee:r.production_assignee||"",
    priority:r.priority||99, isRush:r.is_rush||false,
    multiOrder:r.multi_order||false, printRunId:r.print_run_id||null,
    printRunName:r.print_run_name||"", files:r.files||[],
  };
}

// ── Print Summary ─────────────────────────────────────────────────────────────
function printSummary(jobs) {
  const date = new Date().toLocaleDateString("en-CA",{year:"numeric",month:"long",day:"numeric"});
  const ALL_SUMMARY_STAGES = [
    ...LISA_STAGES,
    ...LUPE_STAGES.filter(s=>s.key!=="ready_for_lupe"),
  ];
  const activeJobs = jobs.filter(j=>j.stage!=="archived");
  const rush = activeJobs.filter(j=>j.isRush).length;

  const sections = ALL_SUMMARY_STAGES.map(s=>{
    const sJobs = activeJobs.filter(j=>j.stage===s.key);
    if(!sJobs.length) return "";
    const col = s.color;

    const jobRows = sJobs.map(j=>{
      const due = j.dueDate ? new Date(j.dueDate+"T00:00:00").toLocaleDateString("en-CA",{month:"short",day:"numeric"}) : "—";

      const flags = [
        j.isRush?`<span style="background:#c8392b;color:#fff;padding:1px 6px;border-radius:2px;font-size:9px;font-weight:700;letter-spacing:1px">⚡ RUSH</span>`:"",
        j.multiOrder?`<span style="background:#0097a7;color:#fff;padding:1px 6px;border-radius:2px;font-size:9px;font-weight:700;letter-spacing:1px">⊕ MULTI</span>`:"",
        j.printRunName?`<span style="background:#4a1a7a;color:#d4a8ff;padding:1px 6px;border-radius:2px;font-size:9px;font-weight:700;letter-spacing:1px">🖨 ${j.printRunName}</span>`:"",
      ].filter(Boolean).join(" ");

      return `<tr style="border-bottom:1px solid #f0ede8">
        <td style="padding:7px 10px;font-weight:700;color:#c49a2a;white-space:nowrap;font-size:11px">#${j.jobNum||"—"}</td>
        <td style="padding:7px 10px">
          <div style="font-weight:700;font-size:12px">${j.customer||"—"}</div>
          ${j.company?`<div style="font-size:10px;color:#888">${j.company}</div>`:""}
        </td>
        <td style="padding:7px 10px;font-size:11px;color:#444">${j.product||"—"}${j.qty?`<span style="color:#aaa"> · ${j.qty} u</span>`:""}</td>
        <td style="padding:7px 10px;font-size:11px;text-align:center;white-space:nowrap;font-weight:${j.isRush?"700":"400"};color:${j.isRush?"#c8392b":"#444"}">${due}</td>
        <td style="padding:7px 10px;font-size:11px">${flags||"<span style='color:#ddd'>—</span>"}</td>
        <td style="padding:7px 10px;font-size:11px;color:#444">${j.notes||"<span style='color:#ddd'>—</span>"}</td>
      </tr>`;
    }).join("");

    return `<div style="margin-bottom:20px;page-break-inside:avoid">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;padding-bottom:6px;border-bottom:2px solid ${col}">
        <div style="width:10px;height:10px;border-radius:50%;background:${col};flex-shrink:0"></div>
        <div style="font-family:'DM Mono',monospace;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${col}">${s.label}</div>
        <div style="font-family:'DM Mono',monospace;font-size:10px;color:#aaa;background:#f5f2eb;padding:2px 8px;border-radius:10px;border:1px solid #e0dbd4">${sJobs.length} job${sJobs.length!==1?"s":""}</div>
      </div>
      <table style="width:100%;border-collapse:collapse;background:#fff;border:1px solid #e0dbd4">
        <thead>
          <tr style="background:#f5f2eb">
            <th style="padding:5px 10px;text-align:left;font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:#999;border-bottom:1px solid #e0dbd4">Job #</th>
            <th style="padding:5px 10px;text-align:left;font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:#999;border-bottom:1px solid #e0dbd4">Customer</th>
            <th style="padding:5px 10px;text-align:left;font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:#999;border-bottom:1px solid #e0dbd4">Product</th>
            <th style="padding:5px 10px;text-align:center;font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:#999;border-bottom:1px solid #e0dbd4">Due</th>
            <th style="padding:5px 10px;text-align:left;font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:#999;border-bottom:1px solid #e0dbd4">Flags</th>
            <th style="padding:5px 10px;text-align:left;font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:#999;border-bottom:1px solid #e0dbd4">Notes</th>
          </tr>
        </thead>
        <tbody>${jobRows}</tbody>
      </table>
    </div>`;
  }).join("");

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<title>True North — Job Summary</title>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;700&display=swap" rel="stylesheet"/>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'DM Mono',monospace;background:#fff;color:#0d0d0d;font-size:12px;padding:28px 32px}
  @media print{
    body{padding:0}
    @page{margin:10mm 12mm;size:landscape}
    .no-print{display:none}
  }
</style>
</head>
<body>
  <div style="display:flex;justify-content:space-between;align-items:flex-end;padding-bottom:14px;border-bottom:3px solid #c8392b;margin-bottom:20px">
    <div>
      <div style="font-family:'Bebas Neue',sans-serif;font-size:30px;letter-spacing:4px;line-height:1">TRUE <span style="color:#c8392b">NORTH</span></div>
      <div style="font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#888;margin-top:3px">Screen Printing &amp; Embroidery — Production Job Summary</div>
    </div>
    <div style="text-align:right">
      <div style="font-size:10px;color:#aaa">Generated ${date}</div>
      <div style="font-size:14px;font-weight:700;margin-top:3px">${activeJobs.length} active job${activeJobs.length!==1?"s":""}${rush?` &nbsp;·&nbsp; <span style="color:#c8392b">⚡ ${rush} rush</span>`:""}</div>
    </div>
  </div>

  ${sections||`<div style="color:#aaa;font-size:13px;padding:40px 0;text-align:center">No active jobs.</div>`}

  <div style="margin-top:20px;padding-top:14px;border-top:1px solid #e0dbd4;display:flex;gap:20px;flex-wrap:wrap;font-size:10px;color:#888">
    <span style="font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#aaa">Flags:</span>
    <span style="color:#c8392b">⚡ Rush — prioritize above all others</span>
    <span style="color:#0097a7">⊕ Multi-item — do not ship until all items for this customer are ready</span>
    <span style="color:#7c4dbd">🖨 Print run — run all products in this group at the same time</span>
  </div>

  <div class="no-print" style="margin-top:24px;text-align:center">
    <button onclick="window.print()" style="background:#c8392b;color:#fff;border:none;padding:10px 28px;font-family:'DM Mono',monospace;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;cursor:pointer;border-radius:3px">⎙ Print / Save as PDF</button>
    <span style="margin-left:16px;font-size:11px;color:#aaa">Or use Ctrl+P / Cmd+P · Landscape orientation recommended</span>
  </div>
</body>
</html>`;

  const w = window.open("","_blank");
  if(w){ w.document.write(html); w.document.close(); w.focus(); }
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [jobs,setJobs]=useState([]);
  const [loading,setLoading]=useState(true);
  const [view,setView]=useState("lisa");
  const [selJob,setSelJob]=useState(null);
  const [showNew,setShowNew]=useState(false);
  const [toast,setToast]=useState("");
  const [activeStage,setActiveStage]=useState(null);
  const [archiveJobs,setArchiveJobs]=useState([]);
  const [archiveSearch,setArchiveSearch]=useState("");
  const [archiveLoading,setArchiveLoading]=useState(false);
  const [printRuns,setPrintRuns]=useState([]);
  const pollRef=useRef(null);

  useEffect(()=>{ loadJobs(); loadPrintRuns(); pollRef.current=setInterval(loadJobs,60000); return()=>clearInterval(pollRef.current); },[]);

  const loadPrintRuns=async()=>{ try{ const d=await sb.get("print_runs","?select=id,name&order=name.asc"); setPrintRuns(Array.isArray(d)?d:[]); }catch(e){setPrintRuns([]);} };
  const showToast=(msg)=>{ setToast(msg); setTimeout(()=>setToast(""),3000); };

  const loadJobs=async()=>{
    try{
      const data=await sb.get("jobs","?select=*&source=eq.scheduler&order=priority.asc");
      setJobs(prev=>{
        const fresh=(Array.isArray(data)?data:[]).map(r2j);
        return fresh.map(fj=>{ const local=prev.find(lj=>lj.id===fj.id); if(!local)return fj;
          return{...fj, lisaChecklist:Object.keys(fj.lisaChecklist||{}).length>=Object.keys(local.lisaChecklist||{}).length?fj.lisaChecklist:local.lisaChecklist,
            lupeChecklist:Object.keys(fj.lupeChecklist||{}).length>=Object.keys(local.lupeChecklist||{}).length?fj.lupeChecklist:local.lupeChecklist}; });
      });
    }catch(e){console.error(e);}
    setLoading(false);
  };

  const saveJob=async(job)=>{
    try{
      await sb.patch("jobs",{ job_num:job.jobNum, customer:job.customer, company:job.company, product:job.product, qty:job.qty, due_date:job.dueDate, decoration_type:job.decorationType, supplier:job.supplier, style_num:job.styleNum, garment_colour:job.colour, eta:job.eta, notes:job.notes, stage:job.stage, lisa_checklist:job.lisaChecklist, lupe_checklist:job.lupeChecklist, production_assignee:job.productionAssignee, files:job.files||[], is_rush:job.isRush||false, multi_order:job.multiOrder||false, print_run_id:job.printRunId||null, print_run_name:job.printRunName||null },{id:job.id});
      setJobs(prev=>prev.map(j=>j.id===job.id?job:j)); if(selJob?.id===job.id)setSelJob(job); showToast("Saved ✓");
    }catch(e){showToast("Save failed");}
  };

  const addJob=async(fields)=>{
    try{
      let nextNum=String(Date.now()).slice(-5);
      try{ const s=await sb.get("settings","?key=eq.last_job_num&select=value"); if(Array.isArray(s)&&s[0]?.value){const last=parseInt(s[0].value)||26421;nextNum=String(last+1);await sb.patch("settings",{value:nextNum},{key:"last_job_num"});} }catch(e){}
      const[r]=await sb.post("jobs",{ job_num:nextNum, customer:fields.customer, company:fields.company, product:fields.product, qty:parseInt(fields.qty)||0, due_date:fields.dueDate, decoration_type:fields.decorationType, notes:fields.notes, stage:"new_sale", lisa_checklist:{}, lupe_checklist:{}, priority:jobs.length+1, source:"scheduler", is_rush:false, multi_order:false, print_run_id:fields.printRunId||null, print_run_name:fields.printRunName||null });
      setJobs(prev=>[...prev,r2j(r)]); showToast(`Job #${nextNum} created ✓`);
    }catch(e){showToast("Failed to create job: "+e.message);}
  };

  const deleteJob=async(id)=>{ if(!confirm("Delete this job?"))return; await sb.del("jobs",{id}); setJobs(prev=>prev.filter(j=>j.id!==id)); setSelJob(null); showToast("Deleted"); };
  const archiveJob=async(job)=>{ await sb.patch("jobs",{stage:"archived"},{id:job.id}); setJobs(prev=>prev.filter(j=>j.id!==job.id)); setSelJob(null); showToast("Job archived ✓"); };
  const restoreJob=async(job)=>{ await sb.patch("jobs",{stage:"new_sale"},{id:job.id}); setArchiveJobs(prev=>prev.filter(j=>j.id!==job.id)); setJobs(prev=>[...prev,{...job,stage:"new_sale"}]); showToast("Job restored ✓"); };

  const loadArchive=async(search="")=>{
    setArchiveLoading(true);
    try{ const q=search.trim(); const f=q?`&or=(customer.ilike.*${q}*,company.ilike.*${q}*,job_num.ilike.*${q}*,product.ilike.*${q}*)`:"";
      const data=await sb.get("jobs",`?select=*&stage=eq.archived&source=eq.scheduler${f}&order=updated_at.desc&limit=50`); setArchiveJobs(Array.isArray(data)?data.map(r2j):[]);
    }catch(e){showToast("Could not load archive");} setArchiveLoading(false);
  };

  const lisaJobs=jobs.filter(j=>LISA_STAGES.some(s=>s.key===j.stage));
  const lupeJobs=jobs.filter(j=>LUPE_STAGES.some(s=>s.key===j.stage));
  const visibleJobs=view==="lisa"?lisaJobs:lupeJobs;

  const stageGroups=(view==="lisa"?LISA_STAGES:LUPE_STAGES).map(s=>({
    ...s,
    jobs:visibleJobs.filter(j=>j.stage===s.key).sort((a,b)=>{ if(a.isRush&&!b.isRush)return -1; if(!a.isRush&&b.isRush)return 1; return(a.priority||99)-(b.priority||99); })
  }));

  return (
    <div style={S.root}>
      <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500&display=swap" rel="stylesheet"/>
      <meta name="viewport" content="width=device-width, initial-scale=1"/>

      <div style={{...S.header,padding:"10px 14px",flexWrap:"wrap",gap:8}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{...S.logo,fontSize:18}}>TRUE <span style={{color:C.red}}>NORTH</span></div>
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
          {[["lisa","Lisa"],["lupe","Lupe"]].map(([v,label])=>(
            <button key={v}
              style={{padding:"6px 14px",fontSize:10,fontFamily:"'DM Mono',monospace",fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",cursor:"pointer",borderRadius:3,border:`2px solid ${view===v?"#fff":"#555"}`,background:view===v?"#fff":"transparent",color:view===v?C.red:"#888",transition:"all .15s"}}
              onClick={()=>{setView(v);setSelJob(null);setActiveStage(null);}}>
              {label}
            </button>
          ))}
          <button
            style={{padding:"6px 14px",fontSize:10,fontFamily:"'DM Mono',monospace",fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",cursor:"pointer",borderRadius:3,border:`2px solid ${view==="archive"?"#e8c547":"#555"}`,background:view==="archive"?"#e8c547":"transparent",color:view==="archive"?"#0d0d0d":"#888"}}
            onClick={()=>{setView("archive");setSelJob(null);setActiveStage(null);loadArchive("");}}>
            Archive
          </button>
          <button style={{...S.btn("p"),padding:"6px 12px",fontSize:10}} onClick={()=>setShowNew(true)}>+ New</button>
          <button
            style={{padding:"6px 12px",fontSize:10,fontFamily:"'DM Mono',monospace",fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",cursor:"pointer",borderRadius:3,border:"2px solid #4a7a4b",background:"transparent",color:"#4a7a4b"}}
            onClick={()=>printSummary(jobs)}
            title="Open printable job summary">
            ⎙ Summary
          </button>
          <button style={{padding:"6px 10px",fontSize:12,fontFamily:"'DM Mono',monospace",background:"transparent",border:"2px solid #555",color:"#888",borderRadius:3,cursor:"pointer"}} onClick={loadJobs}>↺</button>
        </div>
      </div>

      <div style={{overflowX:"auto",display:"flex",gap:0,borderBottom:`1px solid ${C.border}`,background:"#eee9e0",WebkitOverflowScrolling:"touch"}}>
        {view!=="archive"&&stageGroups.map(sg=>(
          <button key={sg.key} onClick={()=>setActiveStage(activeStage===sg.key?null:sg.key)}
            style={{flexShrink:0,padding:"8px 14px",background:activeStage===sg.key?sg.color+"22":"transparent",border:"none",borderBottom:activeStage===sg.key?`3px solid ${sg.color}`:"3px solid transparent",cursor:"pointer",fontFamily:"'DM Mono',monospace",fontSize:10,letterSpacing:"1px",textTransform:"uppercase",color:activeStage===sg.key?sg.color:C.muted,whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:5}}>
            <span style={{width:7,height:7,borderRadius:"50%",background:sg.color,display:"inline-block",flexShrink:0}}/>
            {sg.label}
            <span style={{background:sg.color+"33",color:sg.color,borderRadius:10,padding:"1px 6px",fontSize:9}}>{sg.jobs.length}</span>
          </button>
        ))}
      </div>

      {loading&&<div style={{textAlign:"center",padding:60,color:C.muted,letterSpacing:2}}>LOADING…</div>}

      {!loading&&view==="archive"&&(
        <div style={{flex:1,overflowY:"auto",padding:20,background:C.bg}}>
          <div style={{marginBottom:16,display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
            <input style={{...S.inp,maxWidth:360,padding:"8px 14px"}} placeholder="Search by customer, company, job #, or product…" value={archiveSearch} onChange={e=>setArchiveSearch(e.target.value)} onKeyDown={e=>e.key==="Enter"&&loadArchive(archiveSearch)}/>
            <button style={{...S.btn("p"),padding:"8px 16px"}} onClick={()=>loadArchive(archiveSearch)}>Search</button>
            {archiveSearch&&<button style={{...S.btn("o"),padding:"8px 12px"}} onClick={()=>{setArchiveSearch("");loadArchive("");}}>Clear</button>}
          </div>
          {archiveLoading&&<div style={{color:C.muted,letterSpacing:2,fontSize:12}}>LOADING…</div>}
          {!archiveLoading&&archiveJobs.length===0&&<div style={{color:C.muted,fontSize:12}}>No archived jobs found.</div>}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:12}}>
            {archiveJobs.map(job=>{
              const dk=Object.keys(DEC_COLORS).find(k=>(job.decorationType||"").toLowerCase().includes(k.toLowerCase()));
              const dc=dk?DEC_COLORS[dk]:null;
              return (
                <div key={job.id} style={{background:dc?.bg||"#fff",border:`1px solid ${dc?.border||C.border}`,borderRadius:4,padding:"12px 14px",boxShadow:"0 1px 3px rgba(0,0,0,.06)"}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                    <div style={{fontSize:11,color:C.gold,fontWeight:700,letterSpacing:1}}>#{job.jobNum}</div>
                    {job.dueDate&&<div style={{fontSize:10,color:C.muted}}>{new Date(job.dueDate+"T00:00:00").toLocaleDateString("en-CA",{month:"short",day:"numeric",year:"numeric"})}</div>}
                  </div>
                  <div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:2}}>{job.customer}</div>
                  {job.company&&<div style={{fontSize:11,color:C.sub,marginBottom:4}}>{job.company}</div>}
                  <div style={{fontSize:11,color:C.sub,marginBottom:8}}>{job.product}{job.qty?` · ${job.qty} units`:""}</div>
                  {job.decorationType&&<div style={{fontSize:9,letterSpacing:"1px",textTransform:"uppercase",padding:"2px 7px",background:dc?.bg||"#f5f5f5",color:dc?.dot||"#666",border:`1px solid ${dc?.border||"#ddd"}`,borderRadius:2,display:"inline-block",marginBottom:8,fontWeight:700}}>{job.decorationType}</div>}
                  <div style={{display:"flex",gap:8,marginTop:8}}>
                    <button style={{...S.btn("g"),flex:1,fontSize:10,padding:"6px 10px"}} onClick={()=>restoreJob(job)}>↩ Restore as New Job</button>
                    <button style={{...S.btn("o"),fontSize:10,padding:"6px 10px",color:C.red,borderColor:"#e0b0b0"}} onClick={async()=>{if(confirm(`Permanently delete job #${job.jobNum}?`)){await sb.del("jobs",{id:job.id});setArchiveJobs(prev=>prev.filter(j=>j.id!==job.id));showToast("Deleted");}}}> Delete</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!loading&&view!=="archive"&&(
        <div style={{display:"flex",height:"calc(100vh - 100px)"}}>
          <div style={{flex:1,overflowX:"auto",overflowY:"hidden",display:"flex",gap:0}}>
            {stageGroups.filter(sg=>!activeStage||sg.key===activeStage).map(sg=>(
              <div key={sg.key} style={{minWidth:activeStage?"100%":280,maxWidth:activeStage?"100%":320,flex:activeStage?"1":"0 0 300px",borderRight:activeStage?"none":`1px solid ${C.border}`,display:"flex",flexDirection:"column",height:"100%",background:C.bg}}>
                {!activeStage&&(
                  <div style={{padding:"10px 14px",borderBottom:`1px solid ${C.border}`,background:"#eee9e0",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <div style={{width:8,height:8,borderRadius:"50%",background:sg.color}}/>
                      <span style={{fontSize:11,letterSpacing:"1.5px",textTransform:"uppercase",color:C.text}}>{sg.label}</span>
                    </div>
                    <span style={{fontSize:11,color:C.muted}}>{sg.jobs.length}</span>
                  </div>
                )}
                <div style={{flex:1,overflowY:"auto",padding:"10px 10px",WebkitOverflowScrolling:"touch"}}>
                  {(sg.key==="pre_production"||sg.key==="in_production")?(
                    (()=>{
                      const prJobs=sg.jobs.filter(j=>j.printRunId);
                      const soloJobs=sg.jobs.filter(j=>!j.printRunId);
                      const groups={};
                      prJobs.forEach(j=>{ if(!groups[j.printRunId])groups[j.printRunId]={name:j.printRunName,jobs:[]}; groups[j.printRunId].jobs.push(j); });
                      const PRC=["#7c4dbd","#1a6eb5","#c8392b","#e07b20","#2a7a4b"];
                      return <>
                        {Object.entries(groups).map(([rid,{name,jobs:rj}],gi)=>{
                          const col=PRC[gi%PRC.length];
                          return <div key={rid} style={{marginBottom:12}}>
                            <div style={{display:"flex",alignItems:"center",gap:6,padding:"6px 8px",background:col+"18",border:`1px solid ${col}55`,borderRadius:"3px 3px 0 0"}}>
                              <span style={{width:8,height:8,borderRadius:"50%",background:col,flexShrink:0,display:"inline-block"}}/>
                              <span style={{fontSize:10,color:col,fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",flex:1}}>🖨 {name}</span>
                              <span style={{fontSize:10,color:col+"bb"}}>{rj.length} products</span>
                            </div>
                            <div style={{border:`2px solid ${col}44`,borderTop:"none",borderRadius:"0 0 3px 3px",padding:"4px 4px 0"}}>
                              {rj.map(job=><JobCard key={job.id} job={job} selected={selJob?.id===job.id} onClick={()=>setSelJob(selJob?.id===job.id?null:job)} onDelete={deleteJob}/>)}
                            </div>
                          </div>;
                        })}
                        {soloJobs.map(job=><JobCard key={job.id} job={job} selected={selJob?.id===job.id} onClick={()=>setSelJob(selJob?.id===job.id?null:job)} onDelete={deleteJob}/>)}
                        {sg.jobs.length===0&&<div style={{fontSize:10,color:"#bbb",textAlign:"center",padding:20,letterSpacing:1}}>NO JOBS</div>}
                      </>;
                    })()
                  ):sg.key==="ready_to_ship"?(
                    (()=>{
                      const mj=sg.jobs.filter(j=>j.multiOrder);
                      const sj=sg.jobs.filter(j=>!j.multiOrder);
                      const groups={};
                      mj.forEach(j=>{ const k=j.company||j.customer||"Unknown"; if(!groups[k])groups[k]=[]; groups[k].push(j); });
                      return <>
                        {Object.entries(groups).map(([cust,gj])=>(
                          <div key={cust} style={{marginBottom:12}}>
                            <div style={{display:"flex",alignItems:"center",gap:6,padding:"5px 8px",background:"#deeaf7",border:"1px solid #7eb8f7",borderRadius:"3px 3px 0 0",marginBottom:2}}>
                              <span style={{fontSize:10,color:"#1a6eb5",fontWeight:700,letterSpacing:"1px",textTransform:"uppercase"}}>⊕ Combined Shipment</span>
                              <span style={{fontSize:10,color:"#4a8abf",marginLeft:"auto"}}>{gj.length} items</span>
                            </div>
                            <div style={{border:"2px solid #7eb8f7",borderTop:"none",borderRadius:"0 0 3px 3px",padding:"4px 4px 0"}}>
                              {gj.map(job=><JobCard key={job.id} job={job} selected={selJob?.id===job.id} onClick={()=>setSelJob(selJob?.id===job.id?null:job)} onDelete={deleteJob}/>)}
                            </div>
                          </div>
                        ))}
                        {sj.map(job=><JobCard key={job.id} job={job} selected={selJob?.id===job.id} onClick={()=>setSelJob(selJob?.id===job.id?null:job)} onDelete={deleteJob}/>)}
                        {sg.jobs.length===0&&<div style={{fontSize:10,color:"#bbb",textAlign:"center",padding:20,letterSpacing:1}}>NO JOBS</div>}
                      </>;
                    })()
                  ):(
                    <>
                      {sg.jobs.map(job=><JobCard key={job.id} job={job} selected={selJob?.id===job.id} onClick={()=>setSelJob(selJob?.id===job.id?null:job)} onDelete={deleteJob}/>)}
                      {sg.jobs.length===0&&<div style={{fontSize:10,color:"#bbb",textAlign:"center",padding:20,letterSpacing:1}}>NO JOBS</div>}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
          {selJob&&(
            <div style={{position:"fixed",top:0,right:0,bottom:0,left:0,background:"#faf8f4",overflowY:"auto",zIndex:200,boxShadow:"-4px 0 24px rgba(0,0,0,.1)"}}>
              <JobDetail job={selJob} onSave={saveJob} onDelete={()=>deleteJob(selJob.id)} onArchive={()=>archiveJob(selJob)} onClose={()=>setSelJob(null)} printRuns={printRuns} onPrintRunCreated={pr=>setPrintRuns(prev=>[...prev,pr])}/>
            </div>
          )}
        </div>
      )}

      {showNew&&<NewJobModal printRuns={printRuns} onAdd={f=>{addJob(f);setShowNew(false);}} onPrintRunCreated={pr=>setPrintRuns(prev=>[...prev,pr])} onClose={()=>setShowNew(false)}/>}
      {toast&&<div style={{position:"fixed",bottom:20,left:"50%",transform:"translateX(-50%)",background:C.green,color:"#fff",padding:"10px 20px",borderRadius:4,fontSize:11,letterSpacing:1,zIndex:9999}}>{toast}</div>}
    </div>
  );
}

// ── Job Card ──────────────────────────────────────────────────────────────────
function JobCard({job,selected,onClick,onDelete}){
  const si=stageInfo(job.stage);
  const lisaDone=LISA_CHECKLIST.filter(c=>job.lisaChecklist[c.key]).length;
  const lupeDone=LUPE_CHECKLIST.filter(c=>job.lupeChecklist[c.key]).length;
  const isLupe=isLupeStage(job.stage);
  const total=isLupe?LUPE_CHECKLIST.length:LISA_CHECKLIST.length;
  const done=isLupe?lupeDone:lisaDone;
  const dk=Object.keys(DEC_COLORS).find(k=>(job.decorationType||"").toLowerCase().includes(k.toLowerCase()));
  const dc=dk?DEC_COLORS[dk]:null;
  const cardBg=selected?"#f0ede8":(dc?.bg||C.card);
  const cardBorder=selected?C.red:job.isRush?C.red:(dc?.border||C.border);
  return (
    <div style={{background:cardBg,border:`2px solid ${cardBorder}`,borderLeft:`4px solid ${job.isRush?C.red:si.color}`,borderRadius:4,marginBottom:8,boxShadow:job.isRush?"0 2px 8px rgba(200,57,43,.25)":"0 1px 3px rgba(0,0,0,.06)",overflow:"hidden"}}>
      {job.isRush&&<div style={{background:C.red,padding:"3px 10px",display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:10,fontWeight:700,letterSpacing:"2px",color:"#fff",fontFamily:"'DM Mono',monospace"}}>⚡ RUSH JOB</span>{job.dueDate&&<span style={{fontSize:10,color:"rgba(255,255,255,.8)",marginLeft:"auto",fontFamily:"'DM Mono',monospace"}}>Due: {new Date(job.dueDate+"T00:00:00").toLocaleDateString("en-CA",{month:"short",day:"numeric"})}</span>}</div>}
      {job.printRunName&&<div style={{background:"#4a1a7a",padding:"3px 10px",display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:10,fontWeight:700,letterSpacing:"2px",color:"#d4a8ff",fontFamily:"'DM Mono',monospace"}}>🖨 PRINT RUN</span><span style={{fontSize:10,color:"#c084fc",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontFamily:"'DM Mono',monospace"}}>{job.printRunName}</span></div>}
      {job.multiOrder&&<div style={{background:"#0a3d4a",padding:"3px 10px",display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:10,fontWeight:700,letterSpacing:"2px",color:"#67e8f9",fontFamily:"'DM Mono',monospace"}}>⊕ MULTI-ITEM SHIPMENT</span></div>}
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
        {total>0&&<div style={{marginTop:8}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:9,color:C.muted,letterSpacing:1}}>{isLupe?"PRE-PROD":"CHECKLIST"}</span><span style={{fontSize:9,color:done===total?C.green:C.muted}}>{done}/{total}</span></div><div style={{height:3,background:"#e0dbd4",borderRadius:2}}><div style={{height:"100%",width:`${(done/total)*100}%`,background:done===total?C.green:C.gold,borderRadius:2,transition:"width .3s"}}/></div></div>}
      </div>
      <div style={{borderTop:`1px solid ${cardBorder}`,display:"flex"}}>
        <button onClick={onClick} style={{flex:1,padding:"5px 8px",background:"transparent",border:"none",color:C.muted,fontSize:10,letterSpacing:"1px",cursor:"pointer",textTransform:"uppercase",fontFamily:"'DM Mono',monospace"}}>{selected?"▲ Close":"▼ Open"}</button>
        <button onClick={e=>{e.stopPropagation();if(window.confirm(`Delete job #${job.jobNum} — ${job.customer}?`))onDelete(job.id);}} style={{padding:"5px 12px",background:"transparent",border:"none",borderLeft:`1px solid ${cardBorder}`,color:"#c8392b",fontSize:10,letterSpacing:"1px",cursor:"pointer",textTransform:"uppercase",fontFamily:"'DM Mono',monospace"}}>✕ Delete</button>
      </div>
    </div>
  );
}

function Field({label,k,type="text",opts,value,onChange}){
  return <div style={{marginBottom:12}}><label style={S.lbl}>{label}</label>{opts?<select style={S.sel} value={value||""} onChange={e=>onChange(k,e.target.value)}><option value="">— Select —</option>{opts.map(o=><option key={o} value={o}>{o}</option>)}</select>:<input style={S.inp} type={type} value={value||""} onChange={e=>onChange(k,e.target.value)}/>}</div>;
}

function FileAttachments({jobId,files,onFilesChanged}){
  const[uploading,setUploading]=useState(false);
  const U=(import.meta.env.VITE_SUPABASE_URL||"").replace(/\/rest\/v1\/?$/,"").replace(/\/+$/,"");
  const K=import.meta.env.VITE_SUPABASE_ANON_KEY;
  const uploadFile=async(file)=>{
    setUploading(true);
    try{ const path=`jobs/${jobId}/${Date.now()}_${file.name}`;
      const res=await fetch(`${U}/storage/v1/object/job-files/${path}`,{method:"POST",headers:{apikey:K,Authorization:`Bearer ${K}`,"Content-Type":file.type||"application/octet-stream"},body:file});
      if(!res.ok)throw new Error("Upload failed");
      onFilesChanged([...(files||[]),{name:file.name,path,size:file.size}]);
    }catch(e){alert("Upload failed: "+e.message);} setUploading(false);
  };
  const deleteFile=async(path,idx)=>{
    if(!confirm("Remove this file?"))return;
    try{await fetch(`${U}/storage/v1/object/job-files/${path}`,{method:"DELETE",headers:{apikey:K,Authorization:`Bearer ${K}`}});}catch(e){}
    onFilesChanged((files||[]).filter((_,i)=>i!==idx));
  };
  const getUrl=(path)=>`${U}/storage/v1/object/public/job-files/${path}`;
  return <div>
    <div style={{fontSize:10,letterSpacing:"2px",color:C.red,textTransform:"uppercase",marginBottom:10,fontWeight:700}}>Attachments</div>
    {(files||[]).map((f,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:"#faf8f4",border:`1px solid ${C.border}`,borderRadius:4,marginBottom:6}}>
      <span style={{fontSize:11,color:"#7eb8f7"}}>📎</span>
      <a href={getUrl(f.path)} target="_blank" rel="noopener noreferrer" style={{flex:1,fontSize:12,color:C.text,textDecoration:"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.name}</a>
      <span style={{fontSize:10,color:C.muted,flexShrink:0}}>{f.size?Math.round(f.size/1024)+"KB":""}</span>
      <button onClick={()=>deleteFile(f.path,i)} style={{background:"none",border:"none",color:C.red,cursor:"pointer",fontSize:13,padding:"0 2px",flexShrink:0}}>✕</button>
    </div>)}
    <label style={{display:"flex",alignItems:"center",gap:8,padding:"10px",border:`2px dashed ${C.border}`,borderRadius:4,cursor:"pointer",background:uploading?"#f5f2eb":"transparent"}}>
      <input type="file" multiple style={{display:"none"}} onChange={e=>Array.from(e.target.files).forEach(uploadFile)}/>
      <span style={{fontSize:12,color:C.muted,letterSpacing:"1px"}}>{uploading?"Uploading…":"+ Attach files (drag & drop or click)"}</span>
    </label>
  </div>;
}

function PrintRunSelector({value,valueName,printRuns,onChange,onPrintRunCreated}){
  const[showNew,setShowNew]=useState(false);
  const[newName,setNewName]=useState("");
  const U=(import.meta.env.VITE_SUPABASE_URL||"").replace(/\/rest\/v1\/?$/,"").replace(/\/+$/,"");
  const K=import.meta.env.VITE_SUPABASE_ANON_KEY;
  const createRun=async()=>{
    if(!newName.trim())return;
    try{ const res=await fetch(`${U}/rest/v1/print_runs`,{method:"POST",headers:{apikey:K,Authorization:`Bearer ${K}`,"Content-Type":"application/json",Prefer:"return=representation"},body:JSON.stringify({name:newName.trim()})});
      const data=await res.json();const pr=data[0];
      if(pr?.id){onPrintRunCreated(pr);onChange(pr.id,pr.name);setShowNew(false);setNewName("");}
    }catch(e){alert("Could not create print run");}
  };
  return <div style={{padding:"10px 12px",background:"#faf8f4",border:`1px solid ${C.border}`,borderRadius:4,marginBottom:4}}>
    <div style={{fontSize:10,letterSpacing:"1.5px",textTransform:"uppercase",color:C.muted,marginBottom:8,fontFamily:"'DM Mono',monospace"}}>🖨 Print Run <span style={{textTransform:"none",letterSpacing:0,color:"#aaa",fontSize:9}}>(optional)</span></div>
    {value?<div style={{display:"flex",alignItems:"center",gap:8}}><div style={{flex:1,padding:"6px 10px",background:"#edf7f1",border:`1px solid ${C.green}44`,borderRadius:3,fontSize:12,color:C.green,fontWeight:700}}>🖨 {valueName}</div><button style={{...S.btn("o"),padding:"4px 10px",fontSize:10}} onClick={()=>onChange(null,"")}>Remove</button></div>
    :<>
      <div style={{display:"flex",gap:8}}>
        <select style={{...S.sel,flex:1,fontSize:12}} value="" onChange={e=>{const pr=printRuns.find(r=>r.id===e.target.value);if(pr)onChange(pr.id,pr.name);}}>
          <option value="">— Link to a print run —</option>
          {printRuns.map(pr=><option key={pr.id} value={pr.id}>{pr.name}</option>)}
        </select>
        <button style={{...S.btn("o"),padding:"6px 10px",fontSize:10,whiteSpace:"nowrap"}} onClick={()=>setShowNew(v=>!v)}>+ New</button>
      </div>
      {showNew&&<div style={{display:"flex",gap:8,marginTop:8}}><input style={{...S.inp,flex:1,fontSize:12}} placeholder="e.g. Tofino Eagle Summer Run" value={newName} onChange={e=>setNewName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&createRun()}/><button style={{...S.btn("g"),padding:"6px 10px",fontSize:10}} onClick={createRun}>Create</button></div>}
    </>}
  </div>;
}

function JobDetail({job,onSave,onDelete,onArchive,onClose,printRuns=[],onPrintRunCreated}){
  const[f,setF]=useState({...job});
  const[dirty,setDirty]=useState(false);
  useEffect(()=>{setF({...job});setDirty(false);},[job.id]);
  const update=(k,v)=>{setF(x=>({...x,[k]:v}));setDirty(true);};
  const toggleLisa=(key)=>{const u={...f,lisaChecklist:{...f.lisaChecklist,[key]:!f.lisaChecklist[key]}};setF(u);setDirty(false);onSave(u);};
  const toggleLupe=(key)=>{const u={...f,lupeChecklist:{...f.lupeChecklist,[key]:!f.lupeChecklist[key]}};setF(u);setDirty(false);onSave(u);};
  const handleSave=()=>{onSave(f);setDirty(false);};
  const handleFilesChanged=(nf)=>{const u={...f,files:nf};setF(u);onSave(u);};
  const lisaAllDone=LISA_CHECKLIST.every(c=>f.lisaChecklist[c.key]);
  const lupeAllDone=LUPE_CHECKLIST.every(c=>f.lupeChecklist[c.key]);
  const advanceStage=(to)=>{const u={...f,stage:to};setF(u);setDirty(false);onSave(u);};
  const si=stageInfo(f.stage);
  return <div>
    <div style={{padding:"12px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",background:"#0d0d0d",position:"sticky",top:0,zIndex:10}}>
      <div><div style={{fontSize:11,color:C.gold,letterSpacing:1}}>#{f.jobNum}</div><div style={{fontSize:15,fontWeight:700,color:"#f5f2eb"}}>{f.customer}</div></div>
      <div style={{display:"flex",gap:6,alignItems:"center"}}><span style={S.tag(si.color)}>{si.label}</span><button style={{...S.btn("o"),padding:"4px 10px"}} onClick={onClose}>✕</button></div>
    </div>
    <div style={{padding:"16px"}}>
      <div style={{marginBottom:16}}>
        <label style={S.lbl}>Stage</label>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {ALL_STAGES.map(s=><button key={s.key} style={{padding:"5px 10px",background:f.stage===s.key?s.color+"33":"transparent",color:f.stage===s.key?s.color:C.muted,border:`1px solid ${f.stage===s.key?s.color:"#ccc"}`,borderRadius:3,cursor:"pointer",fontSize:10,letterSpacing:"1px",textTransform:"uppercase",fontFamily:"'DM Mono',monospace"}} onClick={()=>update("stage",s.key)}>{s.label}</button>)}
        </div>
      </div>
      <div style={S.divider}/>
      <div onClick={()=>{const u={...f,isRush:!f.isRush};setF(u);setDirty(true);}} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",marginBottom:4,background:f.isRush?"#fef0ee":"#faf8f4",border:`2px solid ${f.isRush?C.red:"#ddd"}`,borderRadius:4,cursor:"pointer",userSelect:"none"}}>
        <div style={{width:22,height:22,borderRadius:3,background:f.isRush?C.red:"#fff",border:`2px solid ${f.isRush?C.red:"#ccc"}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{f.isRush&&<span style={{color:"#fff",fontSize:13,lineHeight:1}}>✓</span>}</div>
        <div><div style={{fontSize:12,fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",color:f.isRush?C.red:C.muted,fontFamily:"'DM Mono',monospace"}}>⚡ Rush Job</div><div style={{fontSize:11,color:C.sub,fontFamily:"'DM Sans',sans-serif"}}>Flags this job as urgent — sorted to top of every column</div></div>
      </div>
      <div onClick={()=>{const u={...f,multiOrder:!f.multiOrder};setF(u);setDirty(true);}} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",marginBottom:4,background:f.multiOrder?"#e0f7fa":"#faf8f4",border:`2px solid ${f.multiOrder?"#0097a7":"#ddd"}`,borderRadius:4,cursor:"pointer",userSelect:"none"}}>
        <div style={{width:22,height:22,borderRadius:3,background:f.multiOrder?"#0097a7":"#fff",border:`2px solid ${f.multiOrder?"#0097a7":"#ccc"}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{f.multiOrder&&<span style={{color:"#fff",fontSize:13,lineHeight:1}}>✓</span>}</div>
        <div><div style={{fontSize:12,fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",color:f.multiOrder?"#0097a7":C.muted,fontFamily:"'DM Mono',monospace"}}>⊕ Multi-Item Shipment</div><div style={{fontSize:11,color:C.sub,fontFamily:"'DM Sans',sans-serif"}}>Links with other products that must ship together to the same customer</div></div>
      </div>
      <PrintRunSelector value={f.printRunId} valueName={f.printRunName} printRuns={printRuns} onChange={(id,name)=>{setF(x=>({...x,printRunId:id,printRunName:name}));setDirty(true);}} onPrintRunCreated={onPrintRunCreated}/>
      <div style={S.divider}/>
      <div style={{fontSize:10,letterSpacing:"2px",color:C.red,textTransform:"uppercase",marginBottom:12,fontWeight:700}}>Job Info</div>
      <div style={S.g2}><Field label="Customer Name" k="customer" value={f.customer} onChange={update}/><Field label="Company" k="company" value={f.company} onChange={update}/></div>
      <div style={S.g3}><Field label="Job #" k="jobNum" value={f.jobNum} onChange={update}/><Field label="Quantity" k="qty" type="number" value={f.qty} onChange={update}/><Field label="Due Date" k="dueDate" type="date" value={f.dueDate} onChange={update}/></div>
      <Field label="Product / Garment" k="product" value={f.product} onChange={update}/>
      <Field label="Decoration Type" k="decorationType" opts={["Screen Printing","Embroidery","DTF","Vinyl","Mixed"]} value={f.decorationType} onChange={update}/>
      <div style={S.divider}/>
      <div style={{fontSize:10,letterSpacing:"2px",color:C.red,textTransform:"uppercase",marginBottom:12,fontWeight:700}}>Product Details</div>
      <div style={S.g2}><Field label="Supplier" k="supplier" opts={SUPPLIERS} value={f.supplier} onChange={update}/><Field label="Style #" k="styleNum" value={f.styleNum} onChange={update}/></div>
      <div style={S.g2}><Field label="Colour" k="colour" value={f.colour} onChange={update}/><Field label="ETA" k="eta" type="date" value={f.eta} onChange={update}/></div>
      <div style={S.divider}/>
      <div style={{marginBottom:16}}><label style={S.lbl}>Notes</label><textarea style={S.ta} value={f.notes||""} onChange={e=>update("notes",e.target.value)}/></div>
      <div style={S.divider}/>
      <FileAttachments jobId={job.id} files={f.files||[]} onFilesChanged={handleFilesChanged}/>
      <div style={S.divider}/>
      <div style={{fontSize:10,letterSpacing:"2px",color:C.red,textTransform:"uppercase",marginBottom:12,fontWeight:700}}>Lisa's Checklist</div>
      {LISA_CHECKLIST.map(item=>{const done=f.lisaChecklist[item.key];return<div key={item.key} onClick={()=>toggleLisa(item.key)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",marginBottom:6,background:done?"#edf7f1":"#faf8f4",border:`1px solid ${done?C.green+"66":"#ddd"}`,borderRadius:4,cursor:"pointer",userSelect:"none"}}><div style={S.check(done)}>{done&&<span style={{color:"#fff",fontSize:12,lineHeight:1}}>✓</span>}</div><span style={{fontSize:13,color:done?C.green:C.text}}>{item.label}</span></div>;})}
      {lisaAllDone&&LISA_STAGES.some(s=>s.key===f.stage)&&<button style={{...S.btn("g"),width:"100%",padding:"12px",marginTop:12,fontSize:12,letterSpacing:2}} onClick={()=>advanceStage("ready_for_lupe")}>✓ All Done — Send to Lupe →</button>}
      {isLupeStage(f.stage)&&<>
        <div style={S.divider}/>
        {f.stage==="ready_for_lupe"?<>
          <div style={{fontSize:10,letterSpacing:"2px",color:C.green,textTransform:"uppercase",marginBottom:12,fontWeight:700}}>✓ Ready from Lisa</div>
          <div style={{fontSize:12,color:C.sub,marginBottom:16,fontFamily:"'DM Sans',sans-serif"}}>Lisa has completed all checklist items. Start pre-production when ready.</div>
          <button style={{...S.btn("p"),width:"100%",padding:"12px",fontSize:12,letterSpacing:2}} onClick={()=>advanceStage("pre_production")}>→ Start Pre-Production</button>
          <button style={{...S.btn("o"),width:"100%",padding:"10px",marginTop:8,fontSize:11,letterSpacing:1}} onClick={()=>advanceStage("in_progress")}>← Return to Lisa</button>
        </>:<>
          <div style={{fontSize:10,letterSpacing:"2px",color:C.orange,textTransform:"uppercase",marginBottom:12,fontWeight:700}}>Lupe's Pre-Production</div>
          {LUPE_CHECKLIST.map(item=>{const done=f.lupeChecklist[item.key];return<div key={item.key} onClick={()=>toggleLupe(item.key)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",marginBottom:6,background:done?"#fff4eb":"#faf8f4",border:`1px solid ${done?C.orange+"66":"#ddd"}`,borderRadius:4,cursor:"pointer",userSelect:"none"}}><div style={{...S.check(done),borderColor:done?C.orange:"#ccc",background:done?C.orange:"#fff"}}>{done&&<span style={{color:"#fff",fontSize:12,lineHeight:1}}>✓</span>}</div><span style={{fontSize:13,color:done?C.orange:C.text}}>{item.label}</span></div>;})}
          {f.stage==="pre_production"&&<div style={{marginTop:12}}><label style={S.lbl}>Assign to Production</label><select style={S.sel} value={f.productionAssignee||""} onChange={e=>update("productionAssignee",e.target.value)}><option value="">— Select —</option>{PRODUCTION_TYPES.map(o=><option key={o} value={o}>{o}</option>)}</select></div>}
          {lupeAllDone&&f.stage==="pre_production"&&f.productionAssignee&&<button style={{...S.btn("p"),width:"100%",padding:"12px",marginTop:12,fontSize:12,letterSpacing:2}} onClick={()=>advanceStage("in_production")}>→ Send to Production ({f.productionAssignee})</button>}
          {f.stage==="pre_production"&&<button style={{...S.btn("o"),width:"100%",padding:"10px",marginTop:8,fontSize:11,letterSpacing:1}} onClick={()=>advanceStage("in_progress")}>← Return to Lisa</button>}
          {f.stage==="in_production"&&<button style={{...S.btn("o"),width:"100%",padding:"12px",marginTop:12,fontSize:12,letterSpacing:2}} onClick={()=>advanceStage("boxing")}>→ Move to Boxing</button>}
          {f.stage==="boxing"&&<button style={{...S.btn("o"),width:"100%",padding:"12px",marginTop:12,fontSize:12,letterSpacing:2}} onClick={()=>advanceStage("ready_to_ship")}>→ Ready to Ship</button>}
          {f.stage==="ready_to_ship"&&<button style={{...S.btn("g"),width:"100%",padding:"12px",marginTop:12,fontSize:12,letterSpacing:2}} onClick={()=>advanceStage("shipping")}>✓ Mark as Shipped / Picked Up</button>}
          {f.stage==="shipping"&&<button style={{background:"#e8c547",color:"#0d0d0d",border:"none",width:"100%",padding:"12px",marginTop:12,fontSize:12,letterSpacing:2,fontFamily:"'DM Mono',monospace",fontWeight:700,cursor:"pointer",borderRadius:3,textTransform:"uppercase"}} onClick={onArchive}>↓ Archive This Job</button>}
        </>}
      </>}
      <div style={S.divider}/>
      <div style={{display:"flex",gap:8}}>
        <button style={{...S.btn(dirty?"p":"o"),flex:1,padding:"12px",fontSize:12,letterSpacing:2}} onClick={handleSave}>{dirty?"● Save Changes":"✓ Saved"}</button>
        <button style={{...S.btn("o"),color:"#c8392b",borderColor:"#c8392b33",padding:"10px 16px"}} onClick={onDelete}>Delete</button>
      </div>
    </div>
  </div>;
}

function NewJobModal({onAdd,onClose,printRuns=[],onPrintRunCreated}){
  const[f,setF]=useState({customer:"",company:"",product:"",qty:"",dueDate:"",decorationType:"",notes:"",printRunId:"",printRunName:""});
  const[newRunName,setNewRunName]=useState("");
  const[showNewRun,setShowNewRun]=useState(false);
  const sf=(k,v)=>setF(x=>({...x,[k]:v}));
  const valid=f.customer&&f.product;
  const U=(import.meta.env.VITE_SUPABASE_URL||"").replace(/\/rest\/v1\/?$/,"").replace(/\/+$/,"");
  const K=import.meta.env.VITE_SUPABASE_ANON_KEY;
  const createPrintRun=async()=>{
    if(!newRunName.trim())return;
    try{ const res=await fetch(`${U}/rest/v1/print_runs`,{method:"POST",headers:{apikey:K,Authorization:`Bearer ${K}`,"Content-Type":"application/json",Prefer:"return=representation"},body:JSON.stringify({name:newRunName.trim()})});
      const data=await res.json();const pr=data[0];
      if(pr?.id){onPrintRunCreated(pr);setF(x=>({...x,printRunId:pr.id,printRunName:pr.name}));setShowNewRun(false);setNewRunName("");}
    }catch(e){alert("Could not create print run");}
  };
  return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.8)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:20}}>
    <div style={{background:C.panel,border:`1px solid ${C.border}`,borderRadius:6,width:"100%",maxWidth:540,padding:24,maxHeight:"90vh",overflowY:"auto"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:20,letterSpacing:4,color:C.text}}>NEW JOB</div>
        <button style={S.btn("o")} onClick={onClose}>✕</button>
      </div>
      <div style={S.g2}><div><label style={S.lbl}>Customer Name *</label><input style={S.inp} value={f.customer} onChange={e=>sf("customer",e.target.value)} placeholder="First & Last"/></div><div><label style={S.lbl}>Company</label><input style={S.inp} value={f.company} onChange={e=>sf("company",e.target.value)} placeholder="Company name"/></div></div>
      <div><label style={S.lbl}>Product / Garment *</label><input style={S.inp} value={f.product} onChange={e=>sf("product",e.target.value)} placeholder="e.g. Comfort Colors 1717 Tee"/></div>
      <div style={{height:12}}/>
      <div style={S.g3}>
        <div><label style={S.lbl}>Quantity</label><input style={S.inp} type="number" value={f.qty} onChange={e=>sf("qty",e.target.value)}/></div>
        <div><label style={S.lbl}>Due Date</label><input style={S.inp} type="date" value={f.dueDate} onChange={e=>sf("dueDate",e.target.value)}/></div>
        <div><label style={S.lbl}>Decoration</label><select style={S.sel} value={f.decorationType} onChange={e=>sf("decorationType",e.target.value)}><option value="">— Select —</option>{["Screen Printing","Embroidery","DTF","Vinyl","Mixed"].map(o=><option key={o}>{o}</option>)}</select></div>
      </div>
      <div style={{height:12}}/>
      <div style={{marginBottom:14,padding:"12px 14px",background:"#faf8f4",border:`1px solid ${C.border}`,borderRadius:4}}>
        <label style={{...S.lbl,marginBottom:8}}>🖨 Print Run <span style={{color:C.muted,fontWeight:400,textTransform:"none",letterSpacing:0}}>(optional — link jobs with the same screens/setup)</span></label>
        {f.printRunId?<div style={{display:"flex",alignItems:"center",gap:8}}><div style={{flex:1,padding:"6px 10px",background:"#edf7f1",border:`1px solid ${C.green}44`,borderRadius:3,fontSize:12,color:C.green,fontWeight:700}}>🖨 {f.printRunName}</div><button style={{...S.btn("o"),padding:"4px 10px",fontSize:10}} onClick={()=>setF(x=>({...x,printRunId:"",printRunName:""}))}>Remove</button></div>
        :<div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <select style={{...S.sel,flex:1}} value="" onChange={e=>{const pr=printRuns.find(r=>r.id===e.target.value);if(pr)setF(x=>({...x,printRunId:pr.id,printRunName:pr.name}));}}><option value="">— Select existing print run —</option>{printRuns.map(pr=><option key={pr.id} value={pr.id}>{pr.name}</option>)}</select>
          <button style={{...S.btn("o"),padding:"6px 12px",fontSize:10,whiteSpace:"nowrap"}} onClick={()=>setShowNewRun(v=>!v)}>+ New Run</button>
        </div>}
        {showNewRun&&!f.printRunId&&<div style={{display:"flex",gap:8,marginTop:8}}><input style={{...S.inp,flex:1}} placeholder="e.g. Tofino Eagle Summer Run" value={newRunName} onChange={e=>setNewRunName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&createPrintRun()}/><button style={{...S.btn("g"),padding:"6px 12px",fontSize:10}} onClick={createPrintRun}>Create</button></div>}
      </div>
      <div><label style={S.lbl}>Notes</label><textarea style={S.ta} value={f.notes} onChange={e=>sf("notes",e.target.value)} rows={2}/></div>
      <div style={{display:"flex",gap:10,marginTop:20}}>
        <button style={{...S.btn("p"),flex:1,padding:12,fontSize:12,letterSpacing:2}} disabled={!valid} onClick={()=>valid&&onAdd(f)}>Create Job →</button>
        <button style={S.btn("o")} onClick={onClose}>Cancel</button>
      </div>
    </div>
  </div>;
}
