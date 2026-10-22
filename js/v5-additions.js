/* Performance Powerhouse V5 — evidence graph, lifecycle intelligence, reports, interoperability. */
(() => {
  'use strict';
  const TRACKER_KEY = 'al_performance_powerhouse_study_tracker_v1';
  const PHYSICS_KEY = 'al_performance_powerhouse_physics_intelligence_v1';
  const BUILD = PowerhouseCore.BUILD;
  const DAY = 86400000;

  const q = (sel, root=document) => root.querySelector(sel);
  const qa = (sel, root=document) => [...root.querySelectorAll(sel)];
  const safeJSON = (key, fallback=null) => { try { const v=JSON.parse(localStorage.getItem(key) || 'null'); return v ?? fallback; } catch (_) { return fallback; } };
  const dl = (name, text, type='text/plain') => { const blob=new Blob([text],{type}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),500); };
  const csv = value => `"${String(value ?? '').replaceAll('"','""')}"`;
  const pct = (n,d) => d ? Math.round(Number(n||0)/Number(d||0)*100) : null;
  const fullPass = PowerhouseCore.isFullPass;
  const independentType = a => ['reattempt','fresh-transfer','delayed-retest','topic-question','mixed-set','mcq-section','structured-section','paper-section','full-paper','practical-data','mcq-set','structured-essay','essay'].includes(a?.type);
  const toDate = d => new Date(`${d}T12:00:00Z`);
  const daysAgo = d => d ? Math.max(0, Math.floor((toDate(v5Today())-toDate(d))/DAY)) : Infinity;
  const v5Today = () => PowerhouseCore.zonedToday('Asia/Colombo');

  function ensureState(){
    if (!Array.isArray(state.repairEvents)) state.repairEvents=[];
    state.schemaVersion=12; state.version=12; state.productVersion='V5'; state.buildVersion=BUILD;
    state.v5Settings={retestIntervals:[3,7],timezone:'Asia/Colombo',shareSafe:false,searchScope:'all',...(state.v5Settings||{})};
    if (!Array.isArray(state.v5Settings.retestIntervals) || state.v5Settings.retestIntervals.length<2) state.v5Settings.retestIntervals=[3,7];
    state.migration={sourceVersion:null,migratedAt:null,baselineSnapshotId:null,...(state.migration||{})};
    (state.retests||[]).forEach(r=>{ if(!Array.isArray(r.attempts)) r.attempts=[]; if(!Number.isFinite(Number(r.failures))) r.failures=0; });
    saveState();
  }

  function laterAttempts(source, types=null){
    return (state.attempts||[]).filter(a => a.topicKey===source.topicKey && a.id!==source.id && String(a.date||'')>=String(source.date||'') && independentType(a) && (!types || types.includes(a.type)))
      .sort((a,b)=>(String(a.date)+String(a.createdAt||'')).localeCompare(String(b.date)+String(b.createdAt||'')));
  }
  function repairFor(source){ return (state.repairEvents||[]).filter(r=>r.sourceAttemptId===source.id).sort((a,b)=>String(a.completedAt||'').localeCompare(String(b.completedAt||''))).at(-1)||null; }
  function firstPassing(list, after=''){ return list.find(a=>(!after || String(a.date)>=String(after)) && fullPass(a)) || null; }

  function evidenceChains(){
    const sourceAttempts=(state.attempts||[]).filter(a => !['reattempt','fresh-transfer','delayed-retest'].includes(a.type) && (Number(a.earned)<Number(a.total) || a.error || Number(a.guesses||0)>0));
    return sourceAttempts.map(source => {
      const repair=repairFor(source);
      const later=laterAttempts(source);
      const reattempt=firstPassing(later.filter(a=>a.type==='reattempt'), repair?.completedAt||source.date);
      const transfer=firstPassing(later.filter(a=>a.type==='fresh-transfer'), reattempt?.date||repair?.completedAt||source.date);
      const delayed=firstPassing(later.filter(a=>a.type==='delayed-retest'), transfer?.date||reattempt?.date||repair?.completedAt||source.date);
      const closedAt=delayed?.date||null;
      const relapse=closedAt ? later.find(a=>String(a.date)>closedAt && !fullPass(a) && (a.error || Number(a.earned)<Number(a.total) || Number(a.guesses||0)>0)) : null;
      let lifecycle='Open';
      if (source.error) lifecycle='Diagnosed';
      if (source.note) lifecycle='Repair planned';
      if (repair) lifecycle='Repair completed';
      if (repair && !reattempt) lifecycle='Reattempt due';
      if (reattempt) lifecycle='Reattempt passed';
      if (reattempt && !transfer) lifecycle='Fresh transfer due';
      if (transfer) lifecycle='Transfer passed';
      if (transfer && !delayed) lifecycle='Delayed retest due';
      if (delayed) lifecycle='Closed';
      if (relapse) lifecycle='Reopened';
      return {source,repair,reattempt,transfer,delayed,relapse,lifecycle,closedAt,topic:getTopic(source.topicKey)};
    }).sort((a,b)=>{
      const rank={Reopened:99,'Delayed retest due':90,'Fresh transfer due':80,'Reattempt due':70,'Repair planned':60,Diagnosed:50,Open:40,'Repair completed':30,'Reattempt passed':20,'Transfer passed':10,Closed:0};
      return (rank[b.lifecycle]||0)-(rank[a.lifecycle]||0) || String(b.source.date).localeCompare(String(a.source.date));
    });
  }

  function recoveryMetrics(chains=evidenceChains()){
    let lost=0,targeted=0,recovered=0,closed=0,transferPassed=0,delayedPassed=0,delayedAttempted=0;
    chains.forEach(c=>{
      const initialLost=Math.max(0,Number(c.source.total||0)-Number(c.source.earned||0)); lost+=initialLost;
      if(c.repair){
        targeted+=initialLost;
        const candidates=laterAttempts(c.source,['reattempt','fresh-transfer','delayed-retest']).filter(a=>Number(a.total)===Number(c.source.total));
        const best=candidates.reduce((m,a)=>Math.max(m,Number(a.earned||0)),Number(c.source.earned||0));
        recovered+=Math.max(0,Math.min(initialLost,best-Number(c.source.earned||0)));
      }
      if(c.lifecycle==='Closed') closed++;
      if(c.transfer) transferPassed++;
      const delayedAny=laterAttempts(c.source,['delayed-retest']); if(delayedAny.length) delayedAttempted++;
      if(c.delayed) delayedPassed++;
    });
    const repaired=chains.filter(c=>c.repair).length;
    return {lost,targeted,recovered,repaired,closed,transferPassed,delayedPassed,delayedAttempted,
      closureRate:repaired?Math.round(closed/repaired*100):null,
      transferRate:repaired?Math.round(transferPassed/repaired*100):null,
      survivalRate:delayedAttempted?Math.round(delayedPassed/delayedAttempted*100):null};
  }

  function calibrationMetrics(){
    const rows=state.attempts||[];
    let danger=0,fragile=0,secure=0,guesses=0,raw=0,total=0,trusted=0,trustedTotal=0;
    rows.forEach(a=>{
      const wrong=Number(a.earned)<Number(a.total);
      if(a.confidence==='high'&&wrong) danger++;
      if(a.confidence==='low'&&fullPass(a)) fragile++;
      if(fullPass(a) && a.confidence==='high') secure++;
      guesses+=Number(a.guesses||0);
      raw+=Number(a.earned||0); total+=Number(a.total||0);
      if(a.trustedEarned!==null&&a.trustedEarned!==undefined&&a.trustedEarned!==''){ trusted+=Number(a.trustedEarned||0); trustedTotal+=Number(a.total||0); }
    });
    return {danger,fragile,secure,guesses,rawAccuracy:pct(raw,total),trustedAccuracy:pct(trusted,trustedTotal),gap:total&&trustedTotal?Math.max(0,pct(raw,total)-pct(trusted,trustedTotal)):null};
  }

  function subjectBalance(){
    const today=v5Today();
    return SUBJECTS.map(subject=>{
      const recent=(state.attempts||[]).filter(a=>a.subject===subject && a.date>=addDays(today,-13) && a.date<=today);
      const all=(state.attempts||[]).filter(a=>a.subject===subject).sort((a,b)=>String(a.date).localeCompare(String(b.date)));
      const days=new Set(recent.map(a=>a.date)).size;
      let earned=0,total=0;
      recent.forEach(a=>{ const e=(a.trustedEarned!==null&&a.trustedEarned!==undefined&&a.trustedEarned!=='')?Number(a.trustedEarned):Number(a.earned); earned+=e; total+=Number(a.total||0); });
      const chains=evidenceChains().filter(c=>c.source.subject===subject && c.lifecycle!=='Closed');
      const debt=(state.retests||[]).filter(r=>!r.completedAt && getTopic(r.topicKey)?.subject===subject).length;
      const full=recent.filter(a=>a.type==='full-paper').length;
      const last=all.at(-1)?.date||null;
      return {subject,days,attempts:recent.length,trusted:pct(earned,total),repairDebt:chains.length,retestDebt:debt,fullPapers:full,last,daysSince:daysAgo(last)};
    });
  }

  function trackerState(){ return safeJSON(TRACKER_KEY,{version:1,sessions:[],activeSession:null,settings:{}}) || {version:1,sessions:[],activeSession:null,settings:{}}; }
  function sessionClass(s){
    if(s.evidenceClass) return s.evidenceClass;
    const t=String(s.type||'').toLowerCase();
    if(/timed|mcq|structured|essay|reattempt|transfer|retest|mark|correction|repair/.test(t)) return 'evidence';
    if(/theory|lecture|practical|recall|revision/.test(t)) return 'supporting';
    if(/resource|admin|planning|organ/.test(t)) return 'passive';
    return 'uncertain';
  }
  function trackerMetrics(days=1){
    const floor=addDays(v5Today(),-(days-1)); const t=trackerState();
    const sessions=(t.sessions||[]).filter(s=>String(s.date||'')>=floor && String(s.date||'')<=v5Today() && s.status!=='discarded');
    const sums={total:0,evidence:0,supporting:0,passive:0,uncertain:0,count:sessions.length};
    sessions.forEach(s=>{ const mins=Math.max(0,Number(s.durationMs||0)/60000 || Number(s.minutes||0)); sums.total+=mins; sums[sessionClass(s)]+=mins; });
    return sums;
  }

  function planUnitIndex(row){
    if(row.subject==='physics'){
      const map={
        'physics-12-measurements':0,'physics-12-mechanics':1,'physics-12-waves':2,'physics-12-thermal':3,
        'physics-13-gravity':6,'physics-13-electrostatic':4,'physics-13-magnetic':5,'physics-13-current':7,
        'physics-13-electronics':8,'physics-13-matter-properties':9,'physics-13-radiation':10
      }; return map[row.id] ?? null;
    }
    const m=row.id.match(/-(\d{2})$/); return m ? Number(m[1])-1 : (row.id.includes('-05')?4:null);
  }
  function planEvidence(row){
    const ui=planUnitIndex(row);
    const attempts=(state.attempts||[]).filter(a=>a.subject===row.subject && (ui===null || getTopic(a.topicKey)?.unitIndex===ui));
    const recent=[...attempts].sort((a,b)=>String(b.date).localeCompare(String(a.date))).slice(0,5);
    let earned=0,total=0,lost=0;
    recent.forEach(a=>{ const e=(a.trustedEarned!==null&&a.trustedEarned!==undefined&&a.trustedEarned!=='')?Number(a.trustedEarned):Number(a.earned); earned+=e; total+=Number(a.total||0); lost+=Math.max(0,Number(a.total||0)-Number(a.earned||0)); });
    const relatedKeys=new Set(attempts.map(a=>a.topicKey));
    const chainDebt=evidenceChains().filter(c=>relatedKeys.has(c.source.topicKey)&&c.lifecycle!=='Closed').length;
    const retestDebt=(state.retests||[]).filter(r=>!r.completedAt && relatedKeys.has(r.topicKey)).length;
    const last=attempts.sort((a,b)=>String(a.date).localeCompare(String(b.date))).at(-1)?.date||null;
    return {attempts:attempts.length,performance:pct(earned,total),lost,debt:chainDebt+retestDebt,last,recency:daysAgo(last)};
  }

  function nextRecommendation(){
    const today=v5Today(); const chains=evidenceChains();
    const overdue=(state.retests||[]).filter(r=>!r.completedAt && r.due<=today).sort((a,b)=>String(a.due).localeCompare(String(b.due)))[0];
    if(overdue){ const topic=getTopic(overdue.topicKey); return {subject:topic?.subject||'physics',topicKey:overdue.topicKey,type:overdue.stage===1?'fresh-transfer':'delayed-retest',minutes:30,
      title:`Close overdue ${overdue.stage===1?'transfer':'retest'}: ${topic?.name||'weak point'}`,
      why:`${overdue.due<today?`${dateDiffDays(overdue.due,today)} day(s) overdue`:'Due today'} · ${overdue.failures||0} prior failed check(s).`,
      what:`30-minute closed-book fresh question → strict marking → update the same evidence chain.`,
      complete:`A marked ${overdue.stage===1?'fresh-transfer':'delayed-retest'} attempt is saved; the check closes only on a clean independent pass.`}; }
    const open=chains.find(c=>c.lifecycle==='Reopened'||c.lifecycle==='Reattempt due'||c.lifecycle==='Fresh transfer due'||c.lifecycle==='Delayed retest due'||c.lifecycle==='Repair planned'||c.lifecycle==='Diagnosed');
    if(open){
      const t=open.topic; const lost=Math.max(0,Number(open.source.total)-Number(open.source.earned));
      if(!open.repair) return {subject:open.source.subject,topicKey:open.source.topicKey,type:'repair',minutes:20,title:`Repair the smallest true cause: ${t?.name||'weak point'}`,
        why:`${lost} mark(s) lost · ${open.source.error?`${open.source.error} ${ERROR_NAMES[open.source.error]}`:'diagnosis recorded'} · chain not yet verified.`,
        what:`Target only the exposed cause, write one prevention rule, then immediately reattempt closed-book.`,complete:`Repair is logged against the source attempt and the closed-book reattempt is ready to run.`};
      if(!open.reattempt) return {subject:open.source.subject,topicKey:open.source.topicKey,type:'reattempt',minutes:25,title:`Prove the repair: ${t?.name||'weak point'}`,why:`Repair completed, but there is no clean closed-book reproduction yet.`,what:`25-minute closed-book reattempt with no notes/AI.`,complete:`A full-credit, zero-guess reattempt is saved against this topic.`};
      if(!open.transfer) return {subject:open.source.subject,topicKey:open.source.topicKey,type:'fresh-transfer',minutes:30,title:`Prove transfer: ${t?.name||'weak point'}`,why:`The same skill was reattempted successfully; transfer to a fresh surface is still unproven.`,what:`30-minute fresh question with changed numbers/context → strict mark.`,complete:`A clean fresh-transfer attempt is saved.`};
      return {subject:open.source.subject,topicKey:open.source.topicKey,type:'delayed-retest',minutes:30,title:`Prove retention: ${t?.name||'weak point'}`,why:`Repair and transfer passed; delayed independent retrieval is still outstanding.`,what:`30-minute delayed retest using a fresh question.`,complete:`A clean delayed-retest attempt closes the chain; any later recurrence reopens it.`};
    }
    const danger=(state.attempts||[]).filter(a=>a.confidence==='high'&&Number(a.earned)<Number(a.total)).sort((a,b)=>String(b.date).localeCompare(String(a.date)))[0];
    if(danger){const t=getTopic(danger.topicKey); return {subject:danger.subject,topicKey:danger.topicKey,type:'fresh-transfer',minutes:30,title:`Attack confidence trap: ${t?.name||danger.question}`,why:`High confidence + lost marks is the most dangerous calibration pattern.`,what:`Fresh question first; explain the decision rule before checking any solution.`,complete:`Marked fresh evidence is saved with confidence and trusted score audited.`};}
    const bal=subjectBalance().sort((a,b)=>b.daysSince-a.daysSince)[0];
    if(bal && bal.daysSince>=4){ const topic=allTopics(bal.subject).find(t=>!state.attempts.some(a=>a.topicKey===t.key)) || allTopics(bal.subject)[0]; return {subject:bal.subject,topicKey:topic?.key||'',type:'mixed-set',minutes:45,title:`Restore ${titleCase(bal.subject)} evidence: ${topic?.name||'mixed set'}`,why:`${Number.isFinite(bal.daysSince)?`${bal.daysSince} days`:'No logged evidence'} since the last meaningful ${titleCase(bal.subject)} attempt.`,what:`45-minute closed-book mixed set → strict marking → diagnose only actual lost marks.`,complete:`A marked ${titleCase(bal.subject)} attempt is saved and any error chain is created.`}; }
    const recent14=(state.attempts||[]).filter(a=>a.date>=addDays(today,-13));
    if(recent14.length>=5 && !recent14.some(a=>a.type==='full-paper')) return {subject:'physics',topicKey:'',type:'paper-section',minutes:60,title:'Increase paper exposure: one timed paper section',why:'Recent evidence exists, but the last 14 days contain no full-paper exposure.','what':'60-minute timed paper section under honest exam conditions → strict marking.','complete':'Paper-section evidence is saved with raw/trusted score, timing and diagnosis.'};
    const priority=priorityTopics(1)[0];
    if(priority) return {subject:priority.subject,topicKey:priority.key,type:'topic-question',minutes:45,title:`Attack highest-return leak: ${priority.name}`,why:`${priority.lost||0} marks lost · ${priority.due||0} due check(s) · ${priority.confidenceTraps||0} confidence trap(s).`,what:`45-minute closed-book targeted set → mark → repair only the recurring cause.`,complete:'Marked attempt saved and resulting repair/retest chain updated.'};
    return {subject:'physics',topicKey:'',type:'topic-question',minutes:30,title:'Build the evidence base: one honest marked attempt',why:'There is not enough performance evidence for a more specific recommendation.',what:'30-minute closed-book question set → strict marking → log confidence, trusted score and any mark leak.',complete:'One marked attempt exists. Then V5 can prioritize using evidence rather than guesswork.'};
  }

  function buildUnifiedBackup(){
    return {
      product:'A/L Performance Powerhouse', backup_version:5, schema_version:Number(state.schemaVersion||12), product_version:'V5', build_version:BUILD,
      created_at:new Date().toISOString(), timezone:'Asia/Colombo',
      core:JSON.parse(JSON.stringify(state)),
      study_tracker:trackerState(),
      physics_intelligence:safeJSON(PHYSICS_KEY,{}),
      storage_namespaces:{core:APP_KEY,legacy_v4:'al_performance_powerhouse_v4',legacy_v3:'al_performance_powerhouse_v3',study_tracker:TRACKER_KEY,physics_intelligence:PHYSICS_KEY,recovery:RECOVERY_KEY}
    };
  }
  window.buildUnifiedBackup=buildUnifiedBackup;

  function addNavAndPanels(){
    const tabs=q('#app-tabs'); if(!tabs || q('[data-panel="intelligence"]',tabs)) return;
    const guide=q('[data-panel="guide"]',tabs);
    const items=[['papers','Papers'],['retests','Retests'],['intelligence','Intelligence'],['weekly','Weekly'],['study-tracker','Study Tracker']];
    items.forEach(([id,label])=>{ const b=document.createElement('button'); b.className='tab'; b.type='button'; b.dataset.panel=id; b.textContent=label; tabs.insertBefore(b,guide); });
    const main=q('main');
    main.insertAdjacentHTML('beforeend', `
      <section class="content" id="panel-papers"><div id="v5-papers-root"></div></section>
      <section class="content" id="panel-retests"><div id="v5-retests-root"></div></section>
      <section class="content" id="panel-intelligence"><div id="v5-intelligence-root"></div></section>
      <section class="content" id="panel-weekly"><div id="v5-weekly-root"></div></section>
      <section class="content" id="panel-study-tracker"><div id="v5-tracker-root"></div></section>`);
  }

  function augmentCommand(){
    const focus=q('#panel-command .focus-card'); if(!focus || q('#v5-command-rationale')) return;
    q('#panel-command .focus-actions')?.insertAdjacentHTML('beforeend','<button class="secondary-btn" id="v5-start-tracker" type="button">Start in Study Tracker</button>');
    focus.insertAdjacentHTML('beforeend','<div class="v5-command-rationale" id="v5-command-rationale"><div class="v5-rationale-card"><b>Why this?</b><span id="v5-why">Evidence-driven priority.</span></div><div class="v5-rationale-card"><b>What exactly?</b><span id="v5-what">One marks-producing block.</span></div><div class="v5-rationale-card"><b>Completion</b><span id="v5-complete">Marked evidence saved.</span></div></div>');
    const subjectGrid=q('#subject-pulse');
    subjectGrid?.insertAdjacentHTML('afterend','<div class="v5-kpi-grid" id="v5-command-kpis"></div>');
    q('#v5-start-tracker')?.addEventListener('click',()=>launchTracker(window.__v5NextAction||nextRecommendation(),true));
  }

  function augmentRepairs(){
    const p=q('#panel-repairs'); if(!p || q('#v5-evidence-graph')) return;
    p.insertAdjacentHTML('beforeend','<section class="panel" id="v5-evidence-graph" style="margin-top:12px"><div class="panel-head"><div><div class="eyebrow">V5 evidence graph</div><h3>Repair chains · source → survival</h3><p>Statuses are derived from actual attempts whenever possible. A later recurrence reopens a previously closed weakness.</p></div></div><div class="chain-list" id="v5-chain-list"></div></section>');
  }

  function augmentDataDialog(){
    const body=q('#data-dialog .dialog-body'); if(!body || q('#v5-backup-box')) return;
    const exp=q('#export-data'); if(exp) exp.textContent='Export unified V5 backup';
    body.insertAdjacentHTML('beforeend',`<div class="v5-unified-backup" id="v5-backup-box"><div class="eyebrow">V5 complete backup</div><p class="muted" style="font-size:9px;line-height:1.55;margin:5px 0 10px">Includes core state, Study Tracker state and Physics Intelligence personal overlay when present. Legacy V4/V3 keys are never deleted by migration.</p><button class="secondary-btn" id="v5-export-markdown" type="button">Export weekly Markdown</button></div>`);
    q('#v5-export-markdown')?.addEventListener('click',()=>dl(`powerhouse-weekly-${v5Today()}.md`,weeklyReport(),'text/markdown'));
  }

  function renderCommandV5(){
    const action=nextRecommendation(); window.__v5NextAction=action;
    const t=action.topicKey?getTopic(action.topicKey):null;
    focusTopicKey=action.topicKey||''; focusRecommendedMinutes=action.minutes||30; focusCustomLabel=action.title||'';
    q('#next-action-title').textContent=action.title;
    q('#next-action-copy').textContent=action.why;
    q('#next-action-meta').innerHTML=`<span class="pill">${escapeHTML(titleCase(action.subject))}</span><span class="pill">${action.minutes} min</span><span class="pill">${escapeHTML(ATTEMPT_TYPE_NAMES[action.type]||action.type)}</span><span class="pill">closed-book where applicable</span>`;
    q('#start-focus-btn').textContent=`Start ${action.minutes}-min block`;
    q('#v5-why').textContent=action.why; q('#v5-what').textContent=action.what; q('#v5-complete').textContent=action.complete;
    const r=recoveryMetrics(), tm=trackerMetrics(1);
    q('#v5-command-kpis').innerHTML=`
      <article class="v5-kpi"><span>Marks targeted</span><strong>${fmt(r.targeted)}</strong><small>initial lost marks with an explicit repair completed</small></article>
      <article class="v5-kpi"><span>Observed recovered</span><strong>${fmt(r.recovered)}</strong><small>same-mark-scale improvement after repair; descriptive, not causal</small></article>
      <article class="v5-kpi"><span>Repair closure</span><strong>${r.closureRate===null?'—':r.closureRate+'%'}</strong><small>${r.closed}/${r.repaired} repaired chains closed</small></article>
      <article class="v5-kpi"><span>Evidence conversion today</span><strong>${tm.total?Math.round(tm.evidence/tm.total*100)+'%':'—'}</strong><small>${Math.round(tm.evidence)} of ${Math.round(tm.total)} tracked min produced/directly supported exam evidence</small></article>`;
    if(t) q('#timer-topic')?.setAttribute('data-v5-topic',t.name);
  }
  function fmt(n){ return Number(n||0)%1?Number(n||0).toFixed(1):String(Number(n||0)); }

  function chainStep(label, value, cls=''){ return `<div class="chain-step ${cls}"><b>${label}</b><span>${value}</span></div>`; }
  function renderChains(){
    const root=q('#v5-chain-list'); if(!root) return;
    const chains=evidenceChains();
    root.innerHTML=chains.length?chains.slice(0,30).map(c=>{
      const s=c.source,t=c.topic; const statusClass=c.lifecycle==='Closed'?'closed':c.lifecycle==='Reopened'?'reopened':'open';
      const repairRule=c.repair?.rule||s.note||'No repair rule logged';
      return `<article class="chain-card"><div class="chain-head"><div><div class="chain-title">${escapeHTML(t?.name||s.question||'Evidence chain')}</div><div class="chain-meta">${titleCase(s.subject)} · ${escapeHTML(s.question||'source attempt')} · ${s.earned}/${s.total} · ${s.error?`${s.error} ${ERROR_NAMES[s.error]}`:'unsupported/other loss'}</div></div><span class="chain-status ${statusClass}">${escapeHTML(c.lifecycle)}</span></div>
      <div class="chain-flow">
        ${chainStep('Original',`${s.earned}/${s.total}`,'done')}
        ${chainStep('Diagnosis',s.error?`${s.error} ${ERROR_NAMES[s.error]}`:'Needs diagnosis',s.error?'done':'due')}
        ${chainStep('Repair',c.repair?escapeHTML(short(repairRule,56)):(s.note?'Planned · not completed':'Not logged'),c.repair?'done':'due')}
        ${chainStep('Reattempt',c.reattempt?`${c.reattempt.earned}/${c.reattempt.total} clean pass`:'Due',c.reattempt?'done':'due')}
        ${chainStep('Transfer',c.transfer?`${c.transfer.earned}/${c.transfer.total} clean pass`:'Due after reattempt',c.transfer?'done':'due')}
        ${chainStep('Delayed',c.delayed?`${c.delayed.earned}/${c.delayed.total} survived`:'Due after transfer',c.relapse?'fail':c.delayed?'done':'due')}
        ${chainStep('State',c.relapse?'Reopened by later failure':c.lifecycle,c.relapse?'fail':c.lifecycle==='Closed'?'done':'due')}
      </div><div class="chain-actions">
        ${!c.repair?`<button class="secondary-btn" type="button" data-v5-repair="${s.id}">Log smallest repair</button>`:''}
        ${c.repair&&!c.reattempt?`<button class="primary-btn" type="button" data-v5-attempt="${s.topicKey}" data-v5-type="reattempt">Closed-book reattempt</button>`:''}
        ${c.reattempt&&!c.transfer?`<button class="primary-btn" type="button" data-v5-attempt="${s.topicKey}" data-v5-type="fresh-transfer">Fresh transfer</button>`:''}
        ${c.transfer&&!c.delayed?`<button class="primary-btn" type="button" data-v5-attempt="${s.topicKey}" data-v5-type="delayed-retest">Delayed retest</button>`:''}
      </div></article>`;
    }).join(''):'<div class="v5-no-data">No open error chains yet. A lost-mark or unsupported-guess attempt will create one automatically.</div>';
  }
  function short(v,n){ const s=String(v||''); return s.length>n?s.slice(0,n-1)+'…':s; }

  function paperClosure(a){
    const lost=Number(a.earned)<Number(a.total)||a.error||Number(a.guesses||0)>0;
    if(!lost) return {label:'Verified clean',cls:'good'};
    const chain=evidenceChains().find(c=>c.source.id===a.id);
    if(!chain) return {label:'Marked',cls:'warn'};
    if(chain.lifecycle==='Closed') return {label:'Verified',cls:'good'};
    if(chain.repair) return {label:'Repaired · verification due',cls:'warn'};
    if(a.error) return {label:'Diagnosed',cls:'warn'};
    return {label:'Attempted only',cls:'bad'};
  }
  function renderPapers(){
    const root=q('#v5-papers-root');if(!root)return;
    const types=['mcq-section','structured-section','paper-section','full-paper'];
    const papers=(state.attempts||[]).filter(a=>types.includes(a.type)).sort((a,b)=>String(b.date).localeCompare(String(a.date)));
    const full=papers.filter(a=>a.type==='full-paper');
    const recent=papers.filter(a=>a.date>=addDays(v5Today(),-29));
    const audited=recent.filter(a=>a.trustedEarned!==null&&a.trustedEarned!==undefined&&a.trustedEarned!=='');
    const best=audited.length?Math.max(...audited.map(a=>Math.round(Number(a.trustedEarned)/Number(a.total)*100))):null;
    const debt=evidenceChains().filter(c=>types.includes(c.source.type)&&c.lifecycle!=='Closed').length;
    root.innerHTML=`<div class="panel-head"><div><div class="eyebrow">Paper Engine</div><h2>Paper quantity is not paper quality.</h2><p>Every paper or section is classified by how far the review-and-verification chain actually progressed.</p></div><button class="primary-btn" id="v5-log-paper" type="button">Log paper evidence</button></div>
    <div class="v5-kpi-grid"><article class="v5-kpi"><span>Full papers</span><strong>${full.length}</strong><small>all-time logged full timed papers</small></article><article class="v5-kpi"><span>Paper output · 30d</span><strong>${recent.length}</strong><small>MCQ/structured/paper/full sections</small></article><article class="v5-kpi"><span>Best recent trusted</span><strong>${best===null?'—':best+'%'}</strong><small>only attempts with trusted-score audit</small></article><article class="v5-kpi"><span>Unresolved paper debt</span><strong>${debt}</strong><small>paper-exposed errors not yet verified closed</small></article></div>
    <section class="v5-panel"><div class="eyebrow">Paper quality / closure</div><h3>Attempted → marked → diagnosed → repaired → verified</h3><div class="v5-table-wrap" style="margin-top:10px"><table class="v5-table"><thead><tr><th>Date</th><th>Subject</th><th>Source</th><th>Type</th><th>Raw / trusted</th><th>Time</th><th>Closure</th></tr></thead><tbody>${papers.length?papers.slice(0,40).map(a=>{const st=paperClosure(a),trusted=a.trustedEarned!==null&&a.trustedEarned!==undefined&&a.trustedEarned!==''?`${a.trustedEarned}/${a.total}`:'not audited';return`<tr><td>${escapeHTML(a.date)}</td><td>${titleCase(a.subject)}</td><td>${escapeHTML(a.question||'—')}</td><td>${escapeHTML(ATTEMPT_TYPE_NAMES[a.type]||a.type)}</td><td>${a.earned}/${a.total} · ${trusted}</td><td>${Number(a.minutes||0)}m</td><td><span class="v5-badge ${st.cls}">${st.label}</span></td></tr>`}).join(''):'<tr><td colspan="7">No paper-section evidence yet.</td></tr>'}</tbody></table></div></section>`;
    q('#v5-log-paper')?.addEventListener('click',()=>openAttemptDialog('', 'paper-section'));
  }

  function renderRetestsV5(){
    const root=q('#v5-retests-root'); if(!root)return;
    const today=v5Today(), all=state.retests||[], open=all.filter(r=>!r.completedAt), due=open.filter(r=>r.due===today), overdue=open.filter(r=>r.due<today), upcoming=open.filter(r=>r.due>today).sort((a,b)=>String(a.due).localeCompare(String(b.due))), failed=open.filter(r=>Number(r.failures||0)>0);
    const closed=all.filter(r=>r.completedAt), survival=all.filter(r=>Array.isArray(r.attempts)&&r.attempts.length).length?Math.round(closed.length/all.filter(r=>Array.isArray(r.attempts)&&r.attempts.length).length*100):null;
    root.innerHTML=`<div class="panel-head"><div><div class="eyebrow">Retest Engine 2.0</div><h2>Retrieval debt must become visible.</h2><p>Intervals are configurable. Failed checks stay open; a check closes only when the logged retest is a clean independent pass.</p></div><button class="secondary-btn" id="v5-export-ics" type="button">Export important retests .ics</button></div>
      <div class="v5-kpi-grid"><article class="v5-kpi"><span>Overdue</span><strong>${overdue.length}</strong><small>highest priority retrieval debt</small></article><article class="v5-kpi"><span>Due today</span><strong>${due.length}</strong><small>fresh independent checks</small></article><article class="v5-kpi"><span>Failed / reopened</span><strong>${failed.length}</strong><small>checks attempted but not cleanly passed</small></article><article class="v5-kpi"><span>Retest survival</span><strong>${survival===null?'—':survival+'%'}</strong><small>passed among retests with recorded V5 attempts</small></article></div>
      <div class="v5-panel" style="margin-bottom:12px"><div class="v5-policy"><div><label>Fresh-transfer interval (days)</label><input id="v5-int1" type="number" min="0" max="60" value="${Number(state.v5Settings.retestIntervals[0]??3)}"></div><div><label>Delayed-retest interval (days)</label><input id="v5-int2" type="number" min="1" max="180" value="${Number(state.v5Settings.retestIntervals[1]??7)}"></div><button class="secondary-btn" id="v5-save-policy" type="button">Save retest policy</button><span class="v5-copy">Existing due dates stay unchanged; new error chains use the updated policy.</span></div></div>
      <div class="retest-columns">${retestColumn('Overdue',overdue)}${retestColumn('Due today',due)}${retestColumn('Upcoming',upcoming.slice(0,20))}${retestColumn('Completed',closed.sort((a,b)=>String(b.completedAt).localeCompare(String(a.completedAt))).slice(0,20))}</div>`;
    q('#v5-save-policy')?.addEventListener('click',()=>{ const a=Math.max(0,Number(q('#v5-int1').value||3)),b=Math.max(a+1,Number(q('#v5-int2').value||7)); state.v5Settings.retestIntervals=[a,b];saveState();renderRetestsV5();toast('Retest policy saved for new chains.'); });
    q('#v5-export-ics')?.addEventListener('click',exportRetestICS);
  }
  function retestColumn(title,list){ return `<div class="retest-col"><h4>${title} · ${list.length}</h4>${list.length?list.map(r=>{const t=getTopic(r.topicKey);return `<div class="retest-mini"><b>${escapeHTML(t?.name||'Unknown topic')}</b><span>${titleCase(t?.subject||'')} · ${r.stage===1?'Fresh transfer':'Delayed stability'} · ${escapeHTML(r.due||r.completedAt||'')} ${r.failures?`· ${r.failures} failed`:''}</span>${!r.completedAt?`<button class="log-mini" style="margin-top:6px" data-v5-attempt="${r.topicKey}" data-v5-type="${r.stage===1?'fresh-transfer':'delayed-retest'}">Attempt</button>`:''}</div>`}).join(''):'<div class="v5-copy">None.</div>'}</div>`; }

  function renderIntelligence(){
    const root=q('#v5-intelligence-root'); if(!root)return;
    const r=recoveryMetrics(), c=calibrationMetrics(), bal=subjectBalance();
    root.innerHTML=`<div class="panel-head"><div><div class="eyebrow">Performance Analytics 2.0</div><h2>Marks, calibration and evidence-backed coverage.</h2><p>Transparent descriptive analytics only. No predicted grades, ranks, exam probabilities or opaque mastery scores.</p></div></div>
      <div class="v5-kpi-grid"><article class="v5-kpi"><span>Marks initially lost</span><strong>${fmt(r.lost)}</strong><small>across traceable source errors</small></article><article class="v5-kpi"><span>Marks targeted</span><strong>${fmt(r.targeted)}</strong><small>lost marks with a completed repair</small></article><article class="v5-kpi"><span>Observed improvement</span><strong>${fmt(r.recovered)}</strong><small>same-mark-scale improvement after repair; not causal attribution</small></article><article class="v5-kpi"><span>Delayed survival</span><strong>${r.survivalRate===null?'—':r.survivalRate+'%'}</strong><small>clean delayed passes / delayed attempts</small></article></div>
      <div class="v5-grid equal" style="margin-bottom:12px"><section class="v5-panel"><div class="eyebrow">Confidence calibration</div><h3>Where certainty is misleading</h3><div class="calibration-grid"><div class="calibration-card danger"><b>${c.danger}</b><span>Dangerous blind spots<br>high confidence + wrong</span></div><div class="calibration-card fragile"><b>${c.fragile}</b><span>Fragile successes<br>low confidence + clean correct</span></div><div class="calibration-card secure"><b>${c.secure}</b><span>Secure mastery signals<br>high confidence + clean correct</span></div><div class="calibration-card guess"><b>${c.guesses}</b><span>Unsupported / guessed items logged</span></div></div><p class="v5-copy" style="margin-top:10px">Raw accuracy ${c.rawAccuracy??'—'}% · Trusted accuracy ${c.trustedAccuracy??'—'}% · Raw/trusted gap ${c.gap??'—'}${c.gap===null?'':' pp'}.</p></section>
      <section class="v5-panel"><div class="eyebrow">Three-subject balance</div><h3>Evidence balance, not equal hours</h3><div class="v5-grid three" style="margin-top:10px">${bal.map(balanceCard).join('')}</div></section></div>
      <section class="v5-panel" style="margin-bottom:12px"><div class="eyebrow">Evidence-backed syllabus map</div><h3>Coverage ≠ mastery</h3><p>Each row separates manual coverage context from closed-book testing, current performance, mark loss, closure debt and recency.</p><div class="v5-table-wrap" style="margin-top:10px"><div id="v5-evidence-map"></div></div></section>
      <section class="v5-panel"><div class="eyebrow">Universal search</div><h3>Find attempts, repairs and syllabus evidence</h3><div class="v5-toolbar"><input id="v5-search" type="search" placeholder="Question reference, topic, unit, correction rule, error family…"><select id="v5-search-subject"><option value="all">All subjects</option><option value="physics">Physics</option><option value="chemistry">Chemistry</option><option value="biology">Biology</option></select></div><div class="v5-search-results" id="v5-search-results"></div></section>`;
    renderEvidenceMap(); renderSearch('');
    q('#v5-search')?.addEventListener('input',e=>renderSearch(e.target.value)); q('#v5-search-subject')?.addEventListener('change',()=>renderSearch(q('#v5-search').value));
  }
  function balanceCard(x){const color=`var(--${SYL[x.subject].abbr})`;return `<article class="balance-card"><header><strong style="color:${color}">${titleCase(x.subject)}</strong><b style="color:${color}">${x.trusted===null?'—':x.trusted+'%'}</b></header><div class="balance-metrics"><div><small>Evidence days · 14d</small><b>${x.days}</b></div><div><small>Marked attempts</small><b>${x.attempts}</b></div><div><small>Repair debt</small><b>${x.repairDebt}</b></div><div><small>Retest debt</small><b>${x.retestDebt}</b></div><div><small>Full papers · 14d</small><b>${x.fullPapers}</b></div><div><small>Days since evidence</small><b>${Number.isFinite(x.daysSince)?x.daysSince:'—'}</b></div></div></article>`;}
  function renderEvidenceMap(){ const root=q('#v5-evidence-map'); if(!root)return; root.innerHTML=SYLLABUS_PLAN.filter(r=>!r.reconciled).map(row=>{const e=planEvidence(row),coverage=planProgress(row.id);return `<div class="evidence-map-row"><div><div class="name" style="color:var(--${SYL[row.subject].abbr})">${escapeHTML(row.name)}</div><small>${titleCase(row.subject)} · Grade ${row.grade}</small></div><div class="evidence-pill">Coverage ${coverage}%</div><div class="evidence-pill">Tests ${e.attempts}</div><div class="evidence-pill">Recent ${e.performance===null?'—':e.performance+'%'}</div><div class="evidence-pill">Lost ${fmt(e.lost)}</div><div class="evidence-pill">Debt ${e.debt} · ${Number.isFinite(e.recency)?e.recency+'d':'never'}</div></div>`}).join(''); }

  function searchIndex(){
    const out=[];
    (state.attempts||[]).forEach(a=>{const t=getTopic(a.topicKey);out.push({kind:'Attempt',subject:a.subject,title:a.question||t?.name||'Attempt',meta:`${a.date} · ${ATTEMPT_TYPE_NAMES[a.type]||a.type} · ${a.earned}/${a.total} · ${t?.unit||''} · ${a.error?ERROR_NAMES[a.error]:''}`,text:`${a.question} ${t?.name} ${t?.unit} ${a.note} ${a.error} ${ERROR_NAMES[a.error]||''}`.toLowerCase(),panel:'attempts'});});
    (state.repairEvents||[]).forEach(r=>{const s=state.attempts.find(a=>a.id===r.sourceAttemptId),t=getTopic(s?.topicKey);out.push({kind:'Repair',subject:s?.subject,title:t?.name||'Repair',meta:`${r.completedAt} · ${r.rule||''}`,text:`${t?.name} ${t?.unit} ${r.rule} ${s?.question}`.toLowerCase(),panel:'repairs'});});
    allTopics().forEach(t=>out.push({kind:'Syllabus',subject:t.subject,title:t.name,meta:`${titleCase(t.subject)} · ${t.unit}`,text:`${t.name} ${t.unit}`.toLowerCase(),panel:t.subject}));
    return out;
  }
  function renderSearch(query){ const root=q('#v5-search-results');if(!root)return;const term=String(query||'').trim().toLowerCase(),sub=q('#v5-search-subject')?.value||'all';let rows=searchIndex().filter(x=>(sub==='all'||x.subject===sub)&&(!term||x.text.includes(term)||x.title.toLowerCase().includes(term)));if(!term)rows=rows.filter(x=>x.kind!=='Syllabus').slice(0,12);else rows=rows.slice(0,40);root.innerHTML=rows.length?rows.map((x,i)=>`<div class="v5-search-hit" data-v5-search-hit="${i}" data-panel-target="${x.panel}"><b>${escapeHTML(x.kind)} · ${escapeHTML(x.title)}</b><span>${escapeHTML(x.meta)}</span></div>`).join(''):'<div class="v5-no-data">No matches.</div>'; qa('[data-panel-target]',root).forEach(el=>el.addEventListener('click',()=>navigate(el.dataset.panelTarget))); }

  function weeklyReport(){
    const end=v5Today(),start=addDays(end,-6), attempts=(state.attempts||[]).filter(a=>a.date>=start&&a.date<=end), chains=evidenceChains(), reps=(state.repairEvents||[]).filter(r=>r.completedAt>=start&&r.completedAt<=end), tm=trackerMetrics(7), rm=recoveryMetrics(chains.filter(c=>c.source.date>=start&&c.source.date<=end));
    const count=t=>attempts.filter(a=>a.type===t).length;
    const gains=[]; chains.filter(c=>c.repair&&c.source.date>=start&&c.source.date<=end).forEach(c=>{const same=laterAttempts(c.source,['reattempt','fresh-transfer','delayed-retest']).filter(a=>Number(a.total)===Number(c.source.total));if(same.length){const best=Math.max(...same.map(a=>Number(a.earned)));const d=best-Number(c.source.earned);if(d>0)gains.push(`${getTopic(c.source.topicKey)?.name||c.source.question}: +${fmt(d)} / ${c.source.total} observed after repair`);}});
    const uncertain=trackerState().sessions?.filter(s=>s.date>=start&&s.date<=end&&sessionClass(s)==='uncertain').length||0;
    return `# Performance Powerhouse · Weekly Evidence Report\n\n**Window:** ${start} → ${end} · Asia/Colombo\n\n## Exam-output work\n- Marked attempts: ${attempts.length}\n- Timed/full paper attempts: ${attempts.filter(a=>['paper-section','full-paper','mcq-section','structured-section'].includes(a.type)).length}\n- Full papers: ${count('full-paper')}\n- Paper sections: ${count('paper-section')+count('mcq-section')+count('structured-section')}\n- Diagnosed lost-mark attempts: ${attempts.filter(a=>a.error||Number(a.earned)<Number(a.total)).length}\n- Repairs completed: ${reps.length}\n- Closed-book reattempts: ${count('reattempt')}\n- Fresh transfers: ${count('fresh-transfer')}\n- Delayed retests: ${count('delayed-retest')}\n- Observed marks recovered on comparable mark scales: ${fmt(rm.recovered)}\n\n## Supporting work\n- Targeted/supporting tracker time: ${Math.round(tm.supporting)} min\n\n## Passive / admin work\n- Passive/admin tracker time: ${Math.round(tm.passive)} min\n- Total tracked time: ${Math.round(tm.total)} min\n- Direct evidence-producing tracker time: ${Math.round(tm.evidence)} min\n${tm.total?`- Evidence conversion: ${Math.round(tm.evidence/tm.total*100)}%\n`:''}\n## Score-gain evidence\n${gains.length?gains.map(x=>`- ${x}`).join('\n'):'- No comparable post-repair score gain logged in this window.'}\n\n## Active debt at week end\n- Open repair chains: ${chains.filter(c=>c.lifecycle!=='Closed').length}\n- Overdue retests: ${(state.retests||[]).filter(r=>!r.completedAt&&r.due<end).length}\n- Confidence traps recorded in window: ${attempts.filter(a=>a.confidence==='high'&&Number(a.earned)<Number(a.total)).length}\n\n## Classification uncertainty\n- Tracker sessions with uncertain classification: ${uncertain}${uncertain?' — review these manually rather than treating the split as exact.':' — none.'}\n\n> Time describes behaviour. Marked evidence, repair closure, transfer and delayed survival are the primary outputs.\n`;
  }

  function coachBrief(days=14,subject='all'){
    const end=v5Today(),start=addDays(end,-(days-1));const attempts=(state.attempts||[]).filter(a=>a.date>=start&&a.date<=end&&(subject==='all'||a.subject===subject));const chains=evidenceChains().filter(c=>c.source.date>=start&&(subject==='all'||c.source.subject===subject));const byErr={};attempts.forEach(a=>{if(a.error)byErr[a.error]=(byErr[a.error]||0)+Math.max(0,Number(a.total)-Number(a.earned));});const dom=Object.entries(byErr).sort((a,b)=>b[1]-a[1]);const bal=subjectBalance();const action=nextRecommendation();return `# AI Coach Brief · Performance Powerhouse V5\nWindow: ${start} → ${end} · ${subject==='all'?'Physics + Chemistry + Biology':titleCase(subject)}\n\nRules for the coach:\n- Do not assist during the initial closed-book TEST phase.\n- Use this evidence to identify one highest-return corrective action.\n- Do not invent mastery, grade, rank or exam-probability scores.\n\nEvidence:\n- Marked attempts: ${attempts.length}\n- Raw marks: ${attempts.reduce((s,a)=>s+Number(a.earned||0),0)} / ${attempts.reduce((s,a)=>s+Number(a.total||0),0)}\n- Trusted-score audits available: ${attempts.filter(a=>a.trustedEarned!==null&&a.trustedEarned!==undefined&&a.trustedEarned!=='').length}\n- High-confidence wrong attempts: ${attempts.filter(a=>a.confidence==='high'&&Number(a.earned)<Number(a.total)).length}\n- Unsupported/guessed items: ${attempts.reduce((s,a)=>s+Number(a.guesses||0),0)}\n- Open evidence chains: ${chains.filter(c=>c.lifecycle!=='Closed').length}\n- Overdue retests: ${(state.retests||[]).filter(r=>!r.completedAt&&r.due<=end).length}\n- Dominant lost-mark families: ${dom.slice(0,4).map(([k,v])=>`${k} ${ERROR_NAMES[k]}: ${fmt(v)} marks`).join('; ')||'none yet'}\n- Subject balance: ${bal.map(x=>`${titleCase(x.subject)} — ${x.attempts} attempts/14d, ${x.repairDebt} repair debt, ${x.retestDebt} retest debt`).join(' | ')}\n\nCurrent V5 bottleneck candidate:\n${action.title}\nWhy: ${action.why}\nCompletion evidence: ${action.complete}\n\nRequest: Analyse this evidence and identify the single highest-return corrective action. Explain your reasoning using only observable evidence and flag uncertainty.\n`; }

  function renderWeekly(){
    const root=q('#v5-weekly-root');if(!root)return;const tm=trackerMetrics(7);root.innerHTML=`<div class="panel-head"><div><div class="eyebrow">Weekly Accomplishments Engine</div><h2>Count output, not system maintenance.</h2><p>Exam-output work is separated from supporting and passive/admin activity. Uncertain tracker classifications are flagged rather than guessed.</p></div></div>
      <div class="v5-kpi-grid"><article class="v5-kpi"><span>Exam evidence sessions</span><strong>${Math.round(tm.evidence)}</strong><small>tracked minutes classified as evidence-producing</small></article><article class="v5-kpi"><span>Supporting</span><strong>${Math.round(tm.supporting)}</strong><small>targeted theory/lecture/practical support</small></article><article class="v5-kpi"><span>Passive/admin</span><strong>${Math.round(tm.passive)}</strong><small>resource browsing, organization, planning</small></article><article class="v5-kpi"><span>Conversion</span><strong>${tm.total?Math.round(tm.evidence/tm.total*100)+'%':'—'}</strong><small>evidence-producing tracked time ÷ all tracked time</small></article></div>
      <div class="v5-grid"><section class="v5-panel"><div class="eyebrow">Copyable report</div><h3>Last 7 days</h3><pre class="week-report" id="v5-week-report"></pre><div class="report-actions"><button class="primary-btn" id="v5-copy-week" type="button">Copy Markdown</button><button class="secondary-btn" id="v5-download-week" type="button">Download .md</button></div></section><section class="v5-panel"><div class="eyebrow">Interoperability</div><h3>AI Coach Brief + Anki bridge</h3><p class="v5-copy">AI receives a locally assembled brief only when you explicitly copy it. Nothing is silently uploaded. Anki export includes concise retrieval-suitable correction rules only.</p><div class="report-actions"><button class="secondary-btn" id="v5-copy-coach" type="button">Copy 14-day AI Coach Brief</button><button class="secondary-btn" id="v5-anki" type="button">Export Anki-ready CSV</button></div><div class="v5-warning" style="margin-top:12px">Method/calculation errors are deliberately excluded from automatic Anki export; practice is usually a better repair than a flashcard.</div></section></div>`;
    q('#v5-week-report').textContent=weeklyReport(); q('#v5-copy-week')?.addEventListener('click',()=>copyText(weeklyReport(),'Weekly report copied.')); q('#v5-download-week')?.addEventListener('click',()=>dl(`powerhouse-weekly-${v5Today()}.md`,weeklyReport(),'text/markdown')); q('#v5-copy-coach')?.addEventListener('click',()=>copyText(coachBrief(14),'AI Coach Brief copied.')); q('#v5-anki')?.addEventListener('click',exportAnki);
  }

  function renderTrackerPanel(){
    const root=q('#v5-tracker-root');if(!root)return;const tm=trackerMetrics(7),t=trackerState();root.innerHTML=`<div class="panel-head"><div><div class="eyebrow">Native Study Tracker</div><h2>Time describes behaviour. Output proves progress.</h2><p>The tracker is a first-class local module under <code>/study-tracker/</code>; it is not an iframe and does not depend on the original reference tracker.</p></div><button class="primary-btn" id="v5-open-tracker" type="button">Open Study Tracker</button></div>
      <div class="v5-kpi-grid"><article class="v5-kpi"><span>Sessions · 7d</span><strong>${tm.count}</strong><small>completed local sessions</small></article><article class="v5-kpi"><span>Tracked · 7d</span><strong>${Math.round(tm.total)}m</strong><small>behavioural context, not mastery</small></article><article class="v5-kpi"><span>Evidence-producing</span><strong>${Math.round(tm.evidence)}m</strong><small>attempt/mark/repair/transfer/retest categories</small></article><article class="v5-kpi"><span>Active session</span><strong>${t.activeSession?'YES':'NO'}</strong><small>timestamp-based recovery state</small></article></div>
      <div class="v5-panel"><h3>Execution bridge</h3><p>Command → start the recommended block → tracker measures execution → finish → log the resulting evidence → Error Engine chooses the next smallest repair.</p><div class="report-actions"><button class="secondary-btn" id="v5-open-prefill" type="button">Start current Command action</button><button class="secondary-btn" id="v5-tracker-share" type="button">Open share-safe tracker</button></div></div>`;
    q('#v5-open-tracker')?.addEventListener('click',()=>launchTracker(null,false)); q('#v5-open-prefill')?.addEventListener('click',()=>launchTracker(window.__v5NextAction||nextRecommendation(),true)); q('#v5-tracker-share')?.addEventListener('click',()=>location.href='./study-tracker/?share=1');
  }

  function launchTracker(action,prefill){
    if(!prefill||!action){location.href='./study-tracker/';return;}
    const params=new URLSearchParams({start:'1',subject:action.subject||'physics',type:trackerType(action.type),task:action.title||'Marks-producing block',minutes:String(action.minutes||30)});if(action.topicKey)params.set('topicKey',action.topicKey);location.href=`./study-tracker/?${params}`;
  }
  function trackerType(type){const map={'topic-question':'timed-question','mixed-set':'mixed-question-set','mcq-section':'mcq-set','structured-section':'structured-questions','paper-section':'timed-paper','full-paper':'timed-paper',reattempt:'closed-book-reattempt','fresh-transfer':'fresh-transfer','delayed-retest':'delayed-retest',repair:'repair'};return map[type]||type||'timed-question';}

  function exportAnki(){
    const eligible=[];(state.repairEvents||[]).forEach(r=>{const s=state.attempts.find(a=>a.id===r.sourceAttemptId);if(!s||!['K','R','P','G','C'].includes(s.error))return;const rule=String(r.rule||s.note||'').trim();if(!rule||rule.length>240)return;const t=getTopic(s.topicKey);eligible.push([`What rule prevents the ${ERROR_NAMES[s.error]} error in ${t?.name||s.question}?`,rule,titleCase(s.subject),t?.unit||'',t?.name||'',`${s.error} ${ERROR_NAMES[s.error]}`,s.question||s.id,r.completedAt||s.date,`powerhouse_v5 ${s.subject} error_${s.error}`]);});if(!eligible.length){toast('No concise retrieval-suitable repaired errors are eligible for Anki yet.');return;}const rows=[['Front','Back','Subject','Unit','Topic','Error Family','Source Attempt','Date','Tags'],...eligible].map(r=>r.map(csv).join(',')).join('\n');dl(`powerhouse-anki-repairs-${v5Today()}.csv`,rows,'text/csv');toast(`${eligible.length} Anki-ready repair item(s) exported.`); }
  function exportRetestICS(){const rows=(state.retests||[]).filter(r=>!r.completedAt&&r.due>=addDays(v5Today(),-7)&&r.due<=addDays(v5Today(),30)).sort((a,b)=>String(a.due).localeCompare(String(b.due))).slice(0,20);if(!rows.length){toast('No important retests in the next 30 days.');return;}const body=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Performance Powerhouse V5//EN','CALSCALE:GREGORIAN',...rows.flatMap(r=>{const t=getTopic(r.topicKey),d=String(r.due).replaceAll('-','');return ['BEGIN:VEVENT',`UID:${r.id}@performance-powerhouse-v5`,`DTSTART;VALUE=DATE:${d}`,`SUMMARY:${icsText(`Powerhouse · ${r.stage===1?'Fresh transfer':'Delayed retest'} · ${t?.name||'Retest'}`)}`,`DESCRIPTION:${icsText('Complete a fresh independent question, mark strictly, and update the evidence chain. Do not treat calendar presence as mastery.')}`,'END:VEVENT'];}),'END:VCALENDAR'].join('\r\n');dl(`powerhouse-important-retests-${v5Today()}.ics`,body,'text/calendar');toast(`Exported ${rows.length} important retest event(s).`);}
  function icsText(s){return String(s||'').replace(/([,;])/g,'\\$1').replace(/\n/g,'\\n');}
  function copyText(text,msg){ if(navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(()=>toast(msg)).catch(()=>fallbackCopy(text,msg));else fallbackCopy(text,msg); }
  function fallbackCopy(text,msg){const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();toast(msg);}

  function openEditAttempt(id){
    const a=(state.attempts||[]).find(x=>x.id===id);if(!a)return;
    openAttemptDialog(a.topicKey,a.type||'topic-question');
    $('attempt-form').dataset.editId=a.id;
    $('attempt-date').value=a.date||v5Today();
    $('attempt-question').value=a.question||'';
    $('marks-earned').value=a.earned;
    $('marks-total').value=a.total;
    $('trusted-earned').value=a.trustedEarned??'';
    $('attempt-minutes').value=a.minutes||1;
    $('attempt-items').value=a.items||1;
    $('attempt-confidence').value=a.confidence||'medium';
    $('attempt-guesses').value=a.guesses||0;
    $('attempt-error').value=a.error||'';
    $('attempt-note').value=a.note||'';
    q('#attempt-dialog h2').textContent='Edit logged attempt';
    q('#attempt-dialog .primary-btn[type="submit"]').textContent='Save correction';
  }

  function bindDynamicActions(){
    document.addEventListener('click',e=>{
      const edit=e.target.closest('[data-v5-edit-attempt]'); if(edit){openEditAttempt(edit.dataset.v5EditAttempt);return;}
      const repair=e.target.closest('[data-v5-repair]'); if(repair){const s=state.attempts.find(a=>a.id===repair.dataset.v5Repair);if(!s)return;const rule=prompt('Smallest repair completed — enter one precise prevention / correction rule:',s.note||'');if(rule===null)return;if(!String(rule).trim()){toast('A repair needs one precise rule or intervention.');return;}state.repairEvents.push({id:uid(),sourceAttemptId:s.id,completedAt:v5Today(),createdAt:new Date().toISOString(),rule:String(rule).trim()});saveState();refreshAll();toast('Repair linked to its source attempt. Reattempt is now due.');return;}
      const a=e.target.closest('[data-v5-attempt]');if(a){q('#attempt-dialog h2').textContent='Log a completed attempt';q('#attempt-dialog .primary-btn[type="submit"]').textContent='Save evidence + update repair queue';openAttemptDialog(a.dataset.v5Attempt||'',a.dataset.v5Type||'topic-question');return;}
    });
  }

  function renderAllV5(){ renderCommandV5();renderChains();renderPapers();renderRetestsV5();renderIntelligence();renderWeekly();renderTrackerPanel(); }

  function linkTrackerSessionToAttempt(attempt){
    if(!attempt?.sessionId) return;
    const t=trackerState(); const s=(t.sessions||[]).find(x=>x.id===attempt.sessionId);
    if(!s) return; s.linkedAttemptId=attempt.id; s.linkedEvidenceAt=new Date().toISOString();
    try{ localStorage.setItem(TRACKER_KEY,JSON.stringify(t)); }catch(_){}
  }
  window.linkTrackerSessionToAttempt=linkTrackerSessionToAttempt;

  function handleTrackerEvidenceDeepLink(){
    const p=new URLSearchParams(location.search); if(p.get('logEvidence')!=='1') return;
    const type=p.get('type')||'topic-question', topicKey=p.get('topicKey')||'';
    setTimeout(()=>{
      openAttemptDialog(topicKey,type);
      if(!topicKey && SUBJECTS.includes(p.get('subject'))) { $('attempt-subject').value=p.get('subject'); fillTopicSelect(p.get('subject')); }
      if(p.get('minutes')) $('attempt-minutes').value=Math.max(1,Number(p.get('minutes'))||1);
      if(p.get('question')) $('attempt-question').value=String(p.get('question')).slice(0,120);
      $('attempt-form').dataset.sessionId=p.get('sessionId')||'';
      history.replaceState({},'',location.pathname+location.hash);
      toast('Tracker session saved. Mark strictly and attach the resulting evidence.');
    },80);
  }

  function enhanceShareSafe(){
    const original=window.toggleShareSafe;
    if(typeof original==='function'){
      window.toggleShareSafe=function(){original();state.v5Settings.shareSafe=document.body.classList.contains('share-safe');saveState();};
    }
    if(state.v5Settings.shareSafe && !document.body.classList.contains('share-safe')) window.toggleShareSafe?.();
  }

  function init(){
    ensureState(); addNavAndPanels(); augmentCommand(); augmentRepairs(); augmentDataDialog(); bindDynamicActions(); enhanceShareSafe();
    const header=q('.topbar')||q('header'); if(header && !q('.v5-version-strip')) header.insertAdjacentHTML('afterend',`<div class="v5-version-strip"><span><strong>V5 · ${BUILD}</strong> · schema 12 · local-first · Asia/Colombo</span><span>Evidence over guesswork · no predicted grades / ranks / exam probabilities</span></div>`);
    const oldRefresh=window.refreshAll;
    if(typeof oldRefresh==='function'){ window.refreshAll=function(){ oldRefresh(); renderAllV5(); }; }
    const oldRenderNext=window.renderNextAction;
    if(typeof oldRenderNext==='function'){ window.renderNextAction=function(){ renderCommandV5(); }; }
    const oldRenderPlanner=window.renderPlanner;
    if(typeof oldRenderPlanner==='function'){ window.renderPlanner=function(){oldRenderPlanner(); /* evidence-backed map lives in Intelligence to avoid corrupting coverage controls */}; }
    renderAllV5(); handleTrackerEvidenceDeepLink();
    const current=q('#recovery-status');if(current)current.textContent=`Recovery snapshots: ${recoveryCount()} · V5 keeps up to 12 · V4 source remains untouched`;
    if(q('#welcome-dialog .eyebrow'))q('#welcome-dialog .eyebrow').textContent='V5 Exam Performance OS · local-first';
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
})();
