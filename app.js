(() => {
'use strict';
// <core>
const DAYS=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const DAYFULL=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const H0=7*60, H1=23*60, STEP=30, ROWS=(H1-H0)/STEP;
const ap=m=>Math.floor(m/60)%24>=12?'pm':'am';
const clock=m=>{const h=Math.floor(m/60),mm=m%60;return ((h+11)%12+1)+':'+String(mm).padStart(2,'0');};
const range=(a,b)=>ap(a)===ap(b)?clock(a)+'–'+clock(b)+' '+ap(b):clock(a)+' '+ap(a)+'–'+clock(b)+' '+ap(b);
const hourLabel=h=>((h+11)%12+1)+' '+(h%24>=12?'pm':'am');
const durText=min=>(min/60).toFixed(min%60?1:0)+' h';
const toMin=s=>{const m=/^(\d{1,2}):(\d{2})/.exec(String(s||'').trim());if(!m)return null;const v=+m[1]*60+ +m[2];return v<=1440&&+m[2]<60?v:null;};
const toHHMM=m=>String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');
const DAYMAP={mon:0,tue:1,wed:2,thu:3,fri:4,sat:5,sun:6};
const normDay=x=>DAYMAP[String(x).trim().toLowerCase().slice(0,3)];

// grid[d][i] = ids of members busy during slot i of day d
function compute(act){
  const grid=Array.from({length:7},()=>Array.from({length:ROWS},()=>[]));
  act.forEach(m=>(m.blocks||[]).forEach(b=>{
    const d=Number(b.day); if(!(d>=0&&d<=6)) return;
    const s=Math.max(0,Math.floor((Number(b.start)-H0)/STEP)), e=Math.min(ROWS,Math.ceil((Number(b.end)-H0)/STEP));
    for(let i=s;i<e;i++) if(!grid[d][i].includes(m.id)) grid[d][i].push(m.id);
  }));
  return grid;
}
// runs of slots inside [w0,w1] where at most maxMissing people are busy and the busy set stays the same
function findWindows(grid,maxMissing,w0,w1){
  const out=[];
  const i0=Math.max(0,Math.ceil((w0-H0)/STEP)), i1=Math.min(ROWS,Math.floor((w1-H0)/STEP));
  const key=(d,i)=>grid[d][i].length<=maxMissing?grid[d][i].slice().sort().join(','):null;
  for(let d=0;d<7;d++){
    let i=i0;
    while(i<i1){
      const k=key(d,i);
      if(k===null){i++;continue;}
      let j=i+1; while(j<i1&&key(d,j)===k) j++;
      out.push({day:d,start:H0+i*STEP,end:H0+j*STEP,missing:k?k.split(','):[]});
      i=j;
    }
  }
  return out;
}
function score(w){
  const dur=w.end-w.start;
  const prime=Math.max(0,Math.min(w.end,21*60)-Math.max(w.start,11*60))/dur;
  return Math.min(dur,240)/240*50+prime*30+(w.day>=5?15:0)+(w.start>=17*60?5:0);
}
function rank(wins,minDur){
  return wins.filter(w=>w.end-w.start>=minDur).map(w=>Object.assign({score:score(w)},w))
    .sort((a,b)=>b.score-a.score||a.day-b.day||a.start-b.start);
}
function parseTimetable(raw){
  const rows=[];let skipped=0;
  (Array.isArray(raw)?raw:[]).forEach(it=>{
    if(!it||typeof it!=='object'){skipped++;return;}
    const ds=[...new Set((Array.isArray(it.days)?it.days:[it.day]).map(normDay).filter(v=>v!==undefined))];
    const s=toMin(it.start),e=toMin(it.end);
    if(!ds.length||s==null||e==null||e<=s){skipped++;return;}
    rows.push({label:String(it.label||'Class').trim().slice(0,40)||'Class',days:ds.sort(),start:s,end:e});
  });
  return {rows,skipped};
}
// </core>

const $=(s,r=document)=>r.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=p=>p+Math.random().toString(36).slice(2,9)+Date.now().toString(36).slice(-3);
const COLOR_NAMES=['Vermilion','Blue','Green','Amber','Violet','Pink','Teal','Olive'];
// Page link used in invite links and QR codes. Change it if you host the page somewhere else.
const SHARE_URL='https://claude.ai/artifact/6DX4NX5w7A71RKAxBSJrnU';
// A page opened from your own computer (VS Code preview, Live Server, a file) has an address friends cannot reach.
const isLocalAddress=()=>location.protocol==='file:'||/^(localhost|127\.|0\.0\.0\.0|\[::1\]|192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(location.hostname);
// Invite links use SITE_URL (set in firebase-config.js) whenever the page is opened from a local address.
const pageUrl=()=>{
  if(window.claude&&window.claude.use)return SHARE_URL;
  if(window.SITE_URL&&isLocalAddress())return window.SITE_URL;
  return location.href.split('#')[0].split('?')[0];
};
const CODE_CHARS='ABCDEFGHJKMNPQRSTUVWXYZ23456789';
function newCode(){
  const a=new Uint32Array(6);
  if(window.crypto&&crypto.getRandomValues)crypto.getRandomValues(a);else for(let i=0;i<6;i++)a[i]=Math.floor(Math.random()*4294967295);
  return [...a].map(v=>CODE_CHARS[v%CODE_CHARS.length]).join('');
}
const normCode=s=>String(s||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
const showCode=c=>{const n=normCode(c);return n.slice(0,3)+' '+n.slice(3);};
const cx=m=>((Number(m&&m.color)||0)%8+8)%8;
const pref={
  get(k,d){try{const v=localStorage.getItem('ft:'+k);return v==null?d:JSON.parse(v);}catch(e){return d;}},
  set(k,v){try{localStorage.setItem('ft:'+k,JSON.stringify(v));}catch(e){}}
};

const S={
  groups:{},members:{},gid:pref.get('gid',null),view:'avail',edit:null,
  off:new Set(pref.get('off',[])),minDur:pref.get('minDur',60),w0:pref.get('w0',9*60),w1:pref.get('w1',22*60),
  firebase:false,mode:'loading',ready:false,me:null,owner:false,joined:new Set(pref.get('joined',[])),canWrite:true,err:'',hl:null,
  sample:null,imgCaps:null,aiText:'',aiBusy:false,grid:null,act:[],db:null
};
const W=()=>S.canWrite!==false;

/* ---------- storage ---------- */
const queues=new Map();
function q(key,fn){const p=(queues.get(key)||Promise.resolve()).catch(()=>{}).then(fn);queues.set(key,p);return p;}
function persistLocal(){pref.set('data',{groups:S.groups,members:S.members});}
async function put(col,id,data){
  const prev=S[col][id]; S[col][id]=data; render();
  if(S.mode==='db'){
    try{await q(col+'/'+id,()=>S.db.doc(col+'/'+id).set(data));}
    catch(e){if(prev===undefined)delete S[col][id];else S[col][id]=prev;render();throw e;}
  } else persistLocal();
}
async function del(col,id){
  const prev=S[col][id]; delete S[col][id]; render();
  if(S.mode==='db'){
    try{await q(col+'/'+id,()=>S.db.doc(col+'/'+id).delete());}
    catch(e){if(prev!==undefined)S[col][id]=prev;render();throw e;}
  } else persistLocal();
}
async function safe(fn){
  try{await fn();return true;}
  catch(e){toast(e&&e.code==='invalid_argument'?'You can view this calendar but not change it. Ask the owner for Contributor access.':e&&e.code==='permission-denied'?'Firebase refused that change. Check that the Firestore rules allow writes (see README.md).':'That change did not save. Check your connection and try again.');return false;}
}
/* ---------- Firebase (used when the page runs on its own, outside Claude) ---------- */
const FB_VERSION='10.14.1';
async function firebaseDb(cfg){
  const base='https://www.gstatic.com/firebasejs/'+FB_VERSION+'/';
  const [app,fs]=await Promise.all([import(base+'firebase-app.js'),import(base+'firebase-firestore.js')]);
  const fdb=fs.getFirestore(app.initializeApp(cfg));
  // Same small interface the Claude-hosted version uses: collection(name).onSnapshot, doc('name/id').set/delete
  return{
    collection:c=>({onSnapshot:(next,err)=>fs.onSnapshot(fs.collection(fdb,c),
      snap=>next({docs:snap.docs.map(d=>({id:d.id,exists:true,data:()=>d.data()}))}),
      e=>{if(err)err(e);})}),
    doc:path=>{const [c,id]=path.split('/');const ref=fs.doc(fdb,c,id);return{set:d=>fs.setDoc(ref,d),delete:()=>fs.deleteDoc(ref)};}
  };
}
// No sign-in on this version, so each device gets a random id. It marks which person is "you" on this device.
function deviceId(){let id=pref.get('deviceId',null);if(!id){id=uid('d');pref.set('deviceId',id);}return id;}
const connErr=()=>S.firebase
  ?'Could not reach the Firebase database. Check that Firestore is created and its rules allow reads and writes (see README.md).'
  :'The connection to the shared calendar dropped. Reload the page to reconnect.';
function startDb(db){
  S.db=db;let g=false,m=false;
  const done=()=>{const was=S.ready;if(g&&m)S.ready=true;render();if(!was&&S.ready)handleHash();};
  db.collection('groups').onSnapshot(snap=>{const o={};snap.docs.forEach(d=>{const v=d.data();if(v)o[d.id]=v;});S.groups=o;g=true;done();},()=>{S.err=connErr();render();});
  db.collection('members').onSnapshot(snap=>{const o={};snap.docs.forEach(d=>{const v=d.data();if(v)o[d.id]=v;});S.members=o;m=true;done();},()=>{S.err=connErr();render();});
}
function startLocal(){
  const d=pref.get('data',null)||{groups:{},members:{}};
  S.groups=d.groups||{};S.members=d.members||{};S.ready=true;render();
}
async function init(){
  render();
  const c=window.claude;let db=null,user=null;
  if(c&&c.use){[db,user]=await Promise.all([c.use('db').catch(()=>null),c.use('user').catch(()=>null)]);}
  if(!db&&!(c&&c.use)&&window.FIREBASE_CONFIG){
    try{db=await firebaseDb(window.FIREBASE_CONFIG);S.firebase=true;S.me=deviceId();}
    catch(e){db=null;S.err='Could not load Firebase, so schedules are saved on this device only. Check your connection and the settings in firebase-config.js.';}
  }
  if(user){
    try{S.me=await user.id();}catch(e){}
    try{S.owner=await user.isOwner();}catch(e){}
    try{if((await user.can('data.write'))===false)S.canWrite=false;}catch(e){}
  }
  if(db){S.mode='db';startDb(db);}else{S.mode='local';startLocal();}
  if(c&&c.use){
    c.use('sample').then(async s=>{
      if(!s)return;S.sample=s;
      try{const l=await s.limits();S.imgCaps=l&&l.images?l.images:null;}catch(e){}
      render();
    }).catch(()=>{});
  }
}

/* ---------- derived ---------- */
const visible=id=>S.mode!=='db'||S.owner||S.joined.has(id);
const groupList=()=>Object.entries(S.groups).filter(([id])=>visible(id)).map(([id,g])=>Object.assign({id},g)).sort((a,b)=>(a.createdAt||0)-(b.createdAt||0));
const membersOf=gid=>Object.entries(S.members).filter(([,m])=>m&&m.gid===gid).map(([id,m])=>Object.assign({id},m,{blocks:Array.isArray(m.blocks)?m.blocks:[]})).sort((a,b)=>(a.createdAt||0)-(b.createdAt||0));
function nextDate(d,endMin){
  const now=new Date();const t=(now.getDay()+6)%7;let delta=(d-t+7)%7;
  if(delta===0&&endMin<=now.getHours()*60+now.getMinutes())delta=7;
  const dt=new Date(now.getFullYear(),now.getMonth(),now.getDate()+delta);
  return delta===0?'Today':delta===1?'Tomorrow':dt.toLocaleDateString(undefined,{month:'short',day:'numeric'});
}
function nextColor(members){const used=new Set(members.map(cx));for(let i=0;i<8;i++)if(!used.has(i))return i;return members.length%8;}
const clone=o=>JSON.parse(JSON.stringify(o));

/* ---------- toast + dialog ---------- */
let toastT=0;
function toast(msg){const t=$('#toast');t.textContent=msg;t.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>{t.hidden=true;},4200);}
let onClose=null;
function openDlg(html,wire,cleanup){
  const dlg=$('#dlg');onClose=cleanup||null;
  dlg.innerHTML='<div class="dlg-body">'+html+'</div>';
  if(wire)wire(dlg);
  if(!dlg.open)dlg.showModal();
}
function closeDlg(){const d=$('#dlg');if(d.open)d.close();}
$('#dlg').addEventListener('close',()=>{const f=onClose;onClose=null;if(f)f();});
$('#dlg').addEventListener('click',e=>{if(e.target===$('#dlg')||e.target.closest('[data-close]'))closeDlg();});

/* ---------- render ---------- */
function render(){
  const sl=($('.gridwrap')||{}).scrollLeft||0;
  const gl=groupList();
  if(!gl.find(g=>g.id===S.gid))S.gid=gl[0]?gl[0].id:null;
  const g=S.gid?S.groups[S.gid]:null;
  const members=g?membersOf(S.gid):[];
  if(S.edit&&!members.find(m=>m.id===S.edit))S.edit=null;
  renderTabs(gl);renderBanner();renderRail(g,members);renderMain(g,members);
  const gw=$('.gridwrap');if(gw)gw.scrollLeft=sl;
}
function renderTabs(gl){
  $('#tabs').innerHTML=gl.map(g=>'<button class="tab" data-act="tab" data-id="'+esc(g.id)+'" aria-current="'+(g.id===S.gid)+'">'+esc(g.name)+'</button>').join('')
    +(S.mode==='db'&&S.ready?'<button class="tab new" data-act="joincode">Join with code</button>':'')
    +(W()&&S.ready?'<button class="tab new" data-act="newgroup">+ New group</button>':'');
}
function renderBanner(){
  let h='';
  if(S.err)h='<div class="banner err" role="alert">'+esc(S.err)+'</div>';
  else if(S.mode==='local')h='<div class="banner">'+(window.claude?'Sync is off in this view, so schedules stay on this device only.':'Saving on this device only. Add your Firebase settings in firebase-config.js to share calendars with friends.')+'</div>';
  else if(!W())h='<div class="banner">You can look around, but only people with Contributor access can add or change schedules.</div>';
  $('#banner').innerHTML=h;
}
function renderRail(g,members){
  const el=$('#rail');
  if(!S.ready||!g){el.innerHTML='';return;}
  let h='<section class="panel"><div class="ph"><h2>People</h2>'+(W()?'<button class="btn sm" data-act="addperson">+ Add person</button>':'')+'</div>';
  if(!members.length)h+='<p class="note muted">Nobody here yet.</p>';
  members.forEach(m=>{
    const off=S.off.has(m.id);
    const mins=m.blocks.reduce((a,b)=>a+Math.max(0,(b.end||0)-(b.start||0)),0);
    h+='<div class="prow'+(off?' off':'')+'"><input type="checkbox" class="mc" style="--c:var(--m'+cx(m)+')" data-act="toggle" data-id="'+esc(m.id)+'" '+(off?'':'checked')+' aria-label="Include '+esc(m.name)+' when finding free time">'
      +'<div class="pn"><b>'+esc(m.name)+(m.ownerId&&m.ownerId===S.me?'<span class="you">you</span>':'')+'</b><small>'+m.blocks.length+' blocks · '+(mins/60).toFixed(mins%60?1:0)+' h busy a week</small></div>'
      +(W()?'<button class="btn sm" data-act="edit" data-id="'+esc(m.id)+'">Schedule</button>':'')+'</div>';
  });
  h+='</section>';
  if(S.mode==='db'&&W())h+='<button class="btn" data-act="invite">Invite friends with a code or QR</button>';
  h+='<section class="panel set"><h2>Hangout settings</h2>'
    +'<label>At least<select data-act="minDur" id="minDur">'+[30,60,90,120,180,240].map(v=>'<option value="'+v+'"'+(v===S.minDur?' selected':'')+'>'+durText(v)+'</option>').join('')+'</select></label>'
    +'<div class="two"><label>Earliest<select data-act="w0" id="w0">'+Array.from({length:14},(_,i)=>7+i).map(h2=>'<option value="'+h2*60+'"'+(h2*60===S.w0?' selected':'')+'>'+hourLabel(h2)+'</option>').join('')+'</select></label>'
    +'<label>Latest<select data-act="w1" id="w1">'+Array.from({length:14},(_,i)=>10+i).map(h2=>'<option value="'+h2*60+'"'+(h2*60===S.w1?' selected':'')+'>'+hourLabel(h2)+'</option>').join('')+'</select></label></div></section>';
  if(W())h+='<button class="btn ghost" data-act="groupset">Rename or delete this group</button>';
  el.innerHTML=h;
}
function renderMain(g,members){
  const el=$('#main');
  if(!S.ready){el.innerHTML='<div class="empty"><p>Loading calendars…</p></div>';return;}
  if(!g){
    el.innerHTML='<div class="empty"><h2>Find a time everyone is free</h2><p>Make a calendar for each friend group. Everyone adds their class schedule in their own colour, and Free Together shows the hours nobody is busy.</p>'
      +(S.mode==='db'&&!S.owner?'<p>Did a friend send you a join code or QR code? Choose Join with a code to open their calendar.</p>':'')+'<div class="row">'
      +(S.mode==='db'?'<button class="btn'+(S.owner?'':' primary')+'" data-act="joincode">Join with a code</button>':'')
      +(W()?'<button class="btn'+(S.mode==='db'&&!S.owner?'':' primary')+'" data-act="newgroup">Create a friend group</button>':'')
      +(S.mode==='local'?'<button class="btn" data-act="example">Try an example</button>':'')+'</div></div>';
    return;
  }
  if(!members.length){
    el.innerHTML='<div class="empty"><h2>Add the first person to '+esc(g.name)+'</h2><p>Add yourself, then enter your classes by hand or import them from a photo of your timetable.</p>'
      +(W()?'<div class="row"><button class="btn primary" data-act="addperson">Add person</button></div>':'')+'</div>';
    return;
  }
  const act=members.filter(m=>!S.off.has(m.id));
  const grid=compute(act);S.grid=grid;S.act=act;
  const n=act.length;
  const full=n>=2?rank(findWindows(grid,0,S.w0,S.w1),S.minDur):[];
  const recs=full.slice(0,4);S.recs=recs;
  const almost=n>=3?rank(findWindows(grid,1,S.w0,S.w1).filter(w=>w.missing.length===1),S.minDur).slice(0,4):[];
  S.almost=almost;
  const editing=S.edit?members.find(m=>m.id===S.edit):null;
  const mode=editing?'edit':S.view;
  let h=bestHTML(act,recs,almost);
  h+='<div class="toolbar"><div class="seg" role="group" aria-label="Calendar view"><button data-act="view" data-v="avail" aria-pressed="'+(S.view==='avail')+'">Free time</button><button data-act="view" data-v="sched" aria-pressed="'+(S.view==='sched')+'">Schedules</button></div>'
    +'<div class="legend">'+(mode==='avail'
      ?'<span><i class="sw-l all"></i>Everyone free</span><span><i class="sw-l some"></i>Some free</span><span><i class="sw-l none"></i>Nobody free</span><span>Dots show who is busy</span>'
      :act.map(m=>'<span><i class="dot" style="--c:var(--m'+cx(m)+')"></i>'+esc(m.name)+'</span>').join(''))+'</div></div>';
  if(editing){
    h+='<div class="editbar" style="--c:var(--m'+cx(editing)+')"><b>'+esc(editing.name)+'\'s schedule</b>'
      +'<button class="btn sm" data-act="addclass">+ Add Event</button>'
      +(S.imgCaps?'<button class="btn sm" data-act="import">Import from photo</button>':'')
      +'<button class="btn sm" data-act="persondtl">Name and colour</button>'
      +'<button class="btn sm primary" data-act="done">Done</button></div>'
      +'<p class="info">Click an empty slot to add a class, or click a block to change it.</p>';
  } else h+='<p class="info" id="slotInfo">Hover or tap a time slot to see who is free.</p>';
  h+=gridHTML(act,grid,mode,editing,recs);
  el.innerHTML=h;
}
function bestHTML(act,recs,almost){
  const n=act.length,byId=Object.fromEntries(act.map(m=>[m.id,m]));
  let h='<section class="best" aria-labelledby="bt"><div class="sec-head"><h2 id="bt">Best times to meet</h2><p class="sub">'+n+' '+(n===1?'person':'people')+' · every week · '+range(S.w0,S.w1)+' · '+durText(S.minDur)+' or longer</p></div>';
  if(n<2)h+='<p class="note">Tick at least two people to compare their schedules.</p>';
  else if(!recs.length)h+='<p class="note">There is no stretch where everyone is free for '+durText(S.minDur)+'. Try a shorter hangout or a wider window'+(almost.length?', or look at the options below where one person sits out':'')+'.</p>';
  else h+='<ol class="cards">'+recs.map((r,i)=>'<li><button class="card'+(i===0?' top':'')+(S.hl===i?' on':'')+'" data-act="rec" data-i="'+i+'"><span class="rk">'+(i===0?'Top pick':'Option '+(i+1))+'</span><span class="day">'+DAYFULL[r.day]+'</span><span class="when">'+esc(nextDate(r.day,r.end))+'</span><span class="time">'+range(r.start,r.end)+'</span><span class="len">'+durText(r.end-r.start)+' free for all</span></button></li>').join('')+'</ol>';
  if(almost.length)h+='<details class="more"'+(recs.length?'':' open')+'><summary>If one person sits out</summary><ul class="alm">'+almost.map(w=>{const m=byId[w.missing[0]];return '<li><b>'+DAYFULL[w.day]+'</b><span class="mono">'+range(w.start,w.end)+'</span><span>everyone except <i class="dot" style="--c:var(--m'+cx(m)+')"></i>'+esc(m?m.name:'one person')+'</span></li>';}).join('')+'</ul></details>';
  if(S.sample&&n>=2&&(recs.length||almost.length))h+='<div class="ai"><button class="btn sm" data-act="ai"'+(S.aiBusy?' disabled':'')+'>'+(S.aiBusy?'Thinking…':'Ask Claude to pick')+'</button><p class="ai-out" id="aiOut" aria-live="polite">'+esc(S.aiText)+'</p></div>';
  return h+'</section>';
}
function gridHTML(act,grid,mode,editing,recs){
  const T=(new Date().getDay()+6)%7;
  const cidx=Object.fromEntries(act.map(m=>[m.id,cx(m)]));
  let gut='';for(let h=7;h<23;h++)gut+='<span style="top:calc('+((h*60-H0)/STEP)+'*var(--row))">'+hourLabel(h)+'</span>';
  let cols='';
  for(let d=0;d<7;d++){
    let cells='';
    for(let i=0;i<ROWS;i++){
      const busy=grid[d][i];let cls='cell',st='',pips='';
      if(mode==='avail'){
        if(!busy.length)cls+=' all';
        else if(busy.length>=act.length)cls+=' none';
        else st=' style="--p:'+((act.length-busy.length)/act.length).toFixed(2)+'"';
        if(busy.length)pips='<div class="pips">'+busy.map(id=>'<i class="pip" style="--c:var(--m'+cidx[id]+')"></i>').join('')+'</div>';
      }
      cells+='<div class="'+cls+'" data-act="cell" data-d="'+d+'" data-i="'+i+'"'+st+'>'+pips+'</div>';
    }
    let layer='';
    if(mode==='avail'){
      recs.forEach((r,i)=>{if(r.day===d)layer+='<div class="rec'+(S.hl===i?' on':'')+'" style="--y:'+((r.start-H0)/STEP)+';--h:'+((r.end-r.start)/STEP)+'"><span>'+(i+1)+'</span></div>';});
    } else {
      const shown=editing?[editing]:act;const lanes=shown.length;
      shown.forEach((m,k)=>{
        (m.blocks||[]).forEach(b=>{
          if(Number(b.day)!==d)return;
          const s=Math.max(Number(b.start),H0),e=Math.min(Number(b.end),H1);if(!(e>s))return;
          layer+='<button class="blk" data-act="blk" data-mid="'+esc(m.id)+'" data-bid="'+esc(b.id)+'" title="'+esc(m.name+' · '+(b.label||'Busy')+' · '+range(Number(b.start),Number(b.end)))+'" style="--c:var(--m'+cx(m)+');--y:'+((s-H0)/STEP)+';--h:'+((e-s)/STEP)+';left:calc('+(k/lanes*100)+'% + 1px);width:calc('+(100/lanes)+'% - 3px)"><b>'+esc(b.label||'Busy')+'</b><span>'+range(Number(b.start),Number(b.end))+'</span></button>';
        });
      });
    }
    cols+='<div class="col'+(mode!=='avail'&&(editing?1:act.length)>3?' dense':'')+'">'+cells+layer+'</div>';
  }
  return '<div class="gridwrap mode-'+mode+'"><div class="grid" style="--rows:'+ROWS+'"><div class="gh gh0"></div>'
    +DAYS.map((d,i)=>'<div class="gh'+(i===T?' today':'')+'">'+d+'</div>').join('')
    +'<div class="gutter">'+gut+'</div>'+cols+'</div></div>';
}
function slotInfo(d,i){
  const busy=S.grid[d][i],t=H0+i*STEP;
  const free=S.act.filter(m=>!busy.includes(m.id)).map(m=>m.name);
  const bz=busy.map(id=>{const m=S.act.find(x=>x.id===id);if(!m)return '';const b=(m.blocks||[]).find(x=>Number(x.day)===d&&x.start<t+STEP&&x.end>t);return m.name+(b&&b.label?' ('+b.label+')':'');}).filter(Boolean);
  return DAYS[d]+' '+range(t,t+STEP)+' · Free: '+(free.join(', ')||'nobody')+' · Busy: '+(bz.join(', ')||'nobody');
}

/* ---------- events ---------- */
document.addEventListener('click',e=>{
  const el=e.target.closest('[data-act]');if(!el||el.closest('dialog'))return;
  const a=el.dataset.act;
  if(a==='tab'){S.gid=el.dataset.id;S.edit=null;S.hl=null;S.aiText='';pref.set('gid',S.gid);render();}
  else if(a==='newgroup')groupDlg(null);
  else if(a==='groupset')groupDlg(S.gid);
  else if(a==='joincode')joinDlg('');
  else if(a==='invite')inviteDlg(S.gid);
  else if(a==='addperson')personDlg(null);
  else if(a==='edit'){S.edit=el.dataset.id;S.view='sched';render();}
  else if(a==='done'){S.edit=null;render();}
  else if(a==='persondtl')personDlg(S.edit);
  else if(a==='view'){S.view=el.dataset.v;S.edit=null;render();}
  else if(a==='rec'){const i=+el.dataset.i;S.hl=S.hl===i?null:i;render();const gw=$('.gridwrap');if(gw&&S.hl!=null)gw.scrollIntoView({block:'nearest',behavior:'smooth'});}
  else if(a==='addclass')blockDlg({mid:S.edit});
  else if(a==='import')importDlg(S.edit);
  else if(a==='blk'){if(W())blockDlg({mid:el.dataset.mid,bid:el.dataset.bid});}
  else if(a==='cell'){
    const d=+el.dataset.d,i=+el.dataset.i;
    if(S.edit&&W()){const t=H0+i*STEP;blockDlg({mid:S.edit,day:d,start:t,end:Math.min(t+60,H1)});}
    else{const inf=$('#slotInfo');if(inf)inf.textContent=slotInfo(d,i);}
  }
  else if(a==='ai')askClaude();
  else if(a==='example')loadExample();
});
document.addEventListener('mouseover',e=>{
  const c=e.target.closest&&e.target.closest('.cell');const inf=$('#slotInfo');
  if(c&&inf&&S.grid)inf.textContent=slotInfo(+c.dataset.d,+c.dataset.i);
});
document.addEventListener('change',e=>{
  const el=e.target.closest('[data-act]');if(!el||el.closest('dialog'))return;
  const a=el.dataset.act;
  if(a==='toggle'){if(el.checked)S.off.delete(el.dataset.id);else S.off.add(el.dataset.id);pref.set('off',[...S.off]);S.hl=null;render();}
  else if(a==='minDur'){S.minDur=+el.value;pref.set('minDur',S.minDur);S.hl=null;render();}
  else if(a==='w0'){S.w0=+el.value;if(S.w1<=S.w0)S.w1=S.w0+60;pref.set('w0',S.w0);pref.set('w1',S.w1);S.hl=null;render();}
  else if(a==='w1'){S.w1=+el.value;if(S.w0>=S.w1)S.w0=S.w1-60;pref.set('w0',S.w0);pref.set('w1',S.w1);S.hl=null;render();}
});

/* ---------- dialogs ---------- */
function groupDlg(id){
  const g=id?S.groups[id]:null;
  openDlg('<h2>'+(g?'Rename group':'New friend group')+'</h2><form class="form" id="f"><label>Group name<input type="text" id="gn" required maxlength="40" value="'+esc(g?g.name:'')+'" placeholder="e.g. Floor 3 study crew" autocomplete="off"></label>'
    +'<div class="actions">'+(g?'<button type="button" class="btn danger" id="del">Delete group</button>':'')+'<span class="sp"></span><button type="button" class="btn ghost" data-close>Cancel</button><button class="btn primary">'+(g?'Save':'Create group')+'</button></div></form>',dlg=>{
    $('#f',dlg).addEventListener('submit',async ev=>{
      ev.preventDefault();const name=$('#gn',dlg).value.trim();if(!name)return;
      if(g){closeDlg();await safe(()=>put('groups',id,Object.assign({},g,{name})));}
      else{
        const nid=uid('g');S.gid=nid;S.edit=null;S.hl=null;S.aiText='';pref.set('gid',nid);closeDlg();
        joinLocal(nid);
        if(await safe(()=>put('groups',nid,{name,createdAt:Date.now(),code:newCode()})))personDlg(null);
      }
    });
    const del_=$('#del',dlg);
    if(del_)del_.addEventListener('click',()=>{
      if(!del_.dataset.sure){del_.dataset.sure='1';del_.textContent='Delete group and all its schedules?';return;}
      closeDlg();
      safe(async()=>{for(const m of membersOf(id))await del('members',m.id);await del('groups',id);});
    });
  });
}
function personDlg(mid){
  const m=mid?S.members[mid]:null;const members=membersOf(S.gid);
  const col=m?cx(m):nextColor(members);
  openDlg('<h2>'+(m?'Name and colour':'Add person')+'</h2><form class="form" id="f"><label>Name<input type="text" id="pn" required maxlength="30" value="'+esc(m?m.name:'')+'" placeholder="Your name" autocomplete="off"></label>'
    +'<div><div class="muted" style="font-size:13px;font-weight:500;margin-bottom:6px">Colour</div><div class="swatches" role="radiogroup" aria-label="Colour">'
    +COLOR_NAMES.map((n,i)=>'<label class="swc" style="--c:var(--m'+i+')" title="'+n+'"><input type="radio" name="col" value="'+i+'" aria-label="'+n+'"'+(i===col?' checked':'')+'><span></span></label>').join('')+'</div></div>'
    +'<div class="actions">'+(m?'<button type="button" class="btn danger" id="del">Remove person</button>':'')+'<span class="sp"></span><button type="button" class="btn ghost" data-close>Cancel</button><button class="btn primary">'+(m?'Save':'Add person')+'</button></div></form>',dlg=>{
    $('#f',dlg).addEventListener('submit',async ev=>{
      ev.preventDefault();const name=$('#pn',dlg).value.trim();if(!name)return;
      const color=+(dlg.querySelector('input[name=col]:checked')||{value:col}).value;closeDlg();
      if(m)await safe(()=>put('members',mid,Object.assign(clone(m),{name,color})));
      else{
        const nid=uid('m');
        if(await safe(()=>put('members',nid,{gid:S.gid,name,color,ownerId:S.me||null,blocks:[],createdAt:Date.now()}))){S.edit=nid;S.view='sched';render();}
      }
    });
    const del_=$('#del',dlg);
    if(del_)del_.addEventListener('click',()=>{
      if(!del_.dataset.sure){del_.dataset.sure='1';del_.textContent='Remove '+m.name+' and their schedule?';return;}
      closeDlg();if(S.edit===mid)S.edit=null;safe(()=>del('members',mid));
    });
    setTimeout(()=>{const i=$('#pn',dlg);if(i)i.focus();},0);
  });
}
function blockDlg(o){
  const m=S.members[o.mid];if(!m)return;
  const blocks=Array.isArray(m.blocks)?m.blocks:[];
  const b=o.bid?blocks.find(x=>x.id===o.bid):null;
  if(o.bid&&!b)return;
  const sel=new Set(b?[Number(b.day)]:(o.day!=null?[o.day]:[]));
  const s0=b?b.start:(o.start!=null?o.start:9*60),e0=b?b.end:(o.end!=null?o.end:10*60);
  openDlg('<h2>'+(b?'Change class':'Add class')+' · '+esc(m.name)+'</h2><form class="form" id="f"><label>Name<input type="text" id="bl" maxlength="40" value="'+esc(b?b.label:'')+'" placeholder="e.g. CHEM 110 lecture" autocomplete="off"></label>'
    +'<div><div class="muted" style="font-size:13px;font-weight:500;margin-bottom:6px">'+(b?'Day':'Days (pick every day it repeats)')+'</div><div class="days">'+DAYS.map((d,i)=>'<button type="button" class="dayt" data-d="'+i+'" aria-pressed="'+sel.has(i)+'">'+d+'</button>').join('')+'</div></div>'
    +'<div class="two"><label>Starts<input type="time" id="bs" step="900" required value="'+toHHMM(s0)+'"></label><label>Ends<input type="time" id="be" step="900" required value="'+toHHMM(e0)+'"></label></div>'
    +'<p class="err" id="er" role="alert" hidden></p>'
    +'<div class="actions">'+(b?'<button type="button" class="btn danger" id="del">Delete</button>':'')+'<span class="sp"></span><button type="button" class="btn ghost" data-close>Cancel</button><button class="btn primary">'+(b?'Save':'Add to calendar')+'</button></div></form>',dlg=>{
    dlg.querySelectorAll('.dayt').forEach(btn=>btn.addEventListener('click',()=>{
      const d=+btn.dataset.d;
      if(b){sel.clear();sel.add(d);}else if(sel.has(d))sel.delete(d);else sel.add(d);
      dlg.querySelectorAll('.dayt').forEach(x=>x.setAttribute('aria-pressed',String(sel.has(+x.dataset.d))));
    }));
    $('#f',dlg).addEventListener('submit',async ev=>{
      ev.preventDefault();const er=$('#er',dlg);
      const s=toMin($('#bs',dlg).value),e=toMin($('#be',dlg).value),label=$('#bl',dlg).value.trim()||'Busy';
      const fail=t=>{er.textContent=t;er.hidden=false;};
      if(s==null||e==null)return fail('Enter a start and end time.');
      if(e<=s)return fail('The end time must be after the start time.');
      if(!sel.size)return fail('Pick at least one day.');
      const next=clone(m);next.blocks=Array.isArray(next.blocks)?next.blocks:[];
      if(b){const t=next.blocks.find(x=>x.id===b.id);t.day=[...sel][0];t.start=s;t.end=e;t.label=label;}
      else [...sel].sort().forEach(d=>next.blocks.push({id:uid('b'),day:d,start:s,end:e,label}));
      closeDlg();await safe(()=>put('members',o.mid,next));
    });
    const del_=$('#del',dlg);
    if(del_)del_.addEventListener('click',async()=>{const next=clone(m);next.blocks=next.blocks.filter(x=>x.id!==b.id);closeDlg();if(await safe(()=>put('members',o.mid,next)))toast('Removed '+(b.label||'block')+'.');});
  });
}

/* ---------- joining from other devices ---------- */
function joinLocal(gid){S.joined.add(gid);pref.set('joined',[...S.joined]);}
function findByCode(raw){
  const n=normCode(raw);if(n.length<4)return null;
  const hit=Object.entries(S.groups).find(([,g])=>g&&g.code&&normCode(g.code)===n);
  return hit?hit[0]:null;
}
function joinGroup(gid){
  joinLocal(gid);S.gid=gid;S.edit=null;S.hl=null;S.aiText='';pref.set('gid',gid);render();
  const g=S.groups[gid];toast('Joined '+(g?g.name:'the group')+'.');
  const mine=membersOf(gid).some(m=>S.me&&m.ownerId===S.me);
  if(W()&&!mine)personDlg(null);
}
function handleHash(){
  const m=/^#join-([A-Za-z0-9]{4,12})$/.exec(location.hash||'');
  if(!m||!S.ready||S.mode!=='db')return;
  try{history.replaceState(null,'',location.pathname+location.search);}catch(e){}
  const gid=findByCode(m[1]);
  if(gid)joinGroup(gid);
  else joinDlg(m[1],'That join code did not match a group. Check it with whoever invited you.');
}
window.addEventListener('hashchange',handleHash);
function joinDlg(prefill,err){
  openDlg('<h2>Join a friend group</h2><p class="muted">Type the code your friend shared, or open the invite link or scan the QR code they sent.</p>'
    +'<form class="form" id="f"><label>Join code<input type="text" class="mono" id="jc" required maxlength="12" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="K7M 2QX" value="'+esc(prefill?showCode(prefill):'')+'"></label>'
    +'<p class="err" id="er" role="alert"'+(err?'':' hidden')+'>'+esc(err||'')+'</p>'
    +'<div class="actions"><span class="sp"></span><button type="button" class="btn ghost" data-close>Cancel</button><button class="btn primary">Join group</button></div></form>',dlg=>{
    $('#f',dlg).addEventListener('submit',ev=>{
      ev.preventDefault();const gid=findByCode($('#jc',dlg).value);
      if(!gid){const er=$('#er',dlg);er.textContent='No group has that code. Check it and try again.';er.hidden=false;return;}
      closeDlg();joinGroup(gid);
    });
    setTimeout(()=>{const i=$('#jc',dlg);if(i)i.focus();},0);
  });
}
function copyText(text,input,btn){
  const ok=()=>{if(btn){const t=btn.textContent;btn.textContent='Copied';setTimeout(()=>{btn.textContent=t;},1500);}};
  const fallback=()=>{if(input){input.focus();input.select();}toast('Press Ctrl+C (or Cmd+C) to copy.');};
  try{navigator.clipboard.writeText(text).then(ok,fallback);}catch(e){fallback();}
}
async function inviteDlg(gid){
  const g=S.groups[gid];if(!g)return;
  let code=g.code;
  if(!code){code=newCode();if(!(await safe(()=>put('groups',gid,Object.assign(clone(g),{code})))))return;}
  const localOnly=!(window.claude&&window.claude.use)&&isLocalAddress()&&!window.SITE_URL;
  openDlg('<h2>Invite friends to '+esc(g.name)+'</h2><p class="muted">Friends open the page, choose Join with code and type this code, or scan the QR code with their phone camera.</p>'
    +(localOnly?'<p class="err" role="alert">This link only works on this computer, so friends will see "site can\'t be reached". Open your published website and create the invite there, or replace the link below with the website address.</p>':'')
    +'<div class="invite"><div class="codebox"><span class="code" id="cd">'+esc(showCode(code))+'</span><button type="button" class="btn sm" id="cpc">Copy code</button></div><div class="qrbox" id="qr"></div></div>'
    +'<div class="form"><label>Invite link<span class="row-in"><input type="text" id="lnk" value="'+esc(pageUrl()+'#join-'+normCode(code))+'"><button type="button" class="btn sm" id="cpl">Copy link</button></span></label></div>'
    +'<p class="muted small">'+(S.firebase?'Friends open the same website address, then enter this code or scan the QR code. The code takes them to the right group. It does not hide groups from each other.':'Friends need access to this page first, so invite them from the page\'s Share menu with Contributor access. The code takes them to the right group. It does not hide groups from each other.')+'</p>'
    +'<div class="actions"><span class="sp"></span><button type="button" class="btn primary" data-close>Done</button></div>',dlg=>{
    const qrEl=$('#qr',dlg),lnk=$('#lnk',dlg);let qr=null;
    const draw=()=>{
      if(!window.QRCode){qrEl.hidden=true;return;}
      try{
        if(!qr)qr=new QRCode(qrEl,{text:lnk.value,width:168,height:168,colorDark:'#000000',colorLight:'#ffffff',correctLevel:QRCode.CorrectLevel.M});
        else{qr.clear();qr.makeCode(lnk.value);}
        qrEl.hidden=false;
      }catch(e){qrEl.hidden=true;}
    };
    draw();
    lnk.addEventListener('input',draw);
    lnk.addEventListener('focus',()=>lnk.select());
    $('#cpc',dlg).addEventListener('click',ev=>copyText(showCode(code),null,ev.currentTarget));
    $('#cpl',dlg).addEventListener('click',ev=>copyText(lnk.value,lnk,ev.currentTarget));
  });
}

/* ---------- photo import ---------- */
function aiErr(e){
  switch(e&&e.code){
    case 'not_granted':return 'Claude access was declined, so the photo cannot be read. You can still add classes by hand.';
    case 'rate_limited':return 'Too many requests right now. Wait a minute and try again.';
    case 'image_rejected':return 'That image could not be used. Try a JPEG, PNG or WebP under 20 MB.';
    case 'invalid_json':case 'empty_completion':case 'refused':return 'Claude could not find a timetable in that image. Try a clearer or closer photo.';
    case 'session_expired':return 'Your session expired. Reload the page and sign in again.';
    case 'cancelled':return '';
    default:return 'Something went wrong while reading the image. Try again.';
  }
}
function importDlg(mid){
  const m=S.members[mid],caps=S.imgCaps;if(!m||!caps||!S.sample)return;
  let ctl=null;
  const stop=()=>{if(ctl)ctl.abort();ctl=null;};
  const pick=err=>openDlg('<h2>Import '+esc(m.name)+'\'s schedule from a photo</h2><p class="muted">Claude reads the image and lists the classes it finds. You check them before anything is added. The image is sent to Claude and is not stored.</p>'
    +(err?'<p class="err" role="alert">'+esc(err)+'</p>':'')
    +'<label class="drop" id="drop"><input type="file" id="pf" accept="'+esc((caps.mediaTypes||['image/*']).join(','))+'"><strong>Choose a photo or screenshot</strong><span>or drop it here, or paste it</span></label>'
    +'<div class="actions"><span class="sp"></span><button type="button" class="btn ghost" data-close>Cancel</button></div>',dlg=>{
      const drop=$('#drop',dlg);
      $('#pf',dlg).addEventListener('change',ev=>{const f=ev.target.files&&ev.target.files[0];if(f)run(f);});
      ['dragenter','dragover'].forEach(t=>drop.addEventListener(t,ev=>{ev.preventDefault();drop.classList.add('over');}));
      ['dragleave','drop'].forEach(t=>drop.addEventListener(t,ev=>{ev.preventDefault();drop.classList.remove('over');}));
      drop.addEventListener('drop',ev=>{const f=ev.dataTransfer&&ev.dataTransfer.files&&ev.dataTransfer.files[0];if(f)run(f);});
      dlg.addEventListener('paste',ev=>{const f=ev.clipboardData&&ev.clipboardData.files&&ev.clipboardData.files[0];if(f)run(f);});
    },stop);
  async function run(file){
    if(caps.mediaTypes&&caps.mediaTypes.length&&!caps.mediaTypes.includes(file.type))return pick('That file type is not supported. Use a JPEG, PNG or WebP image.');
    if(caps.maxInputBytes&&file.size>caps.maxInputBytes)return pick('That image is too large. Try a smaller screenshot.');
    ctl=new AbortController();
    openDlg('<h2>Reading the timetable…</h2><div class="reading"><div class="spin" aria-hidden="true"></div><p class="muted">This usually takes under a minute.</p></div><div class="actions"><span class="sp"></span><button type="button" class="btn ghost" data-close>Cancel</button></div>',null,stop);
    const prompt='The attached image is a student\'s weekly class timetable (a screenshot or a photo). Read every class or commitment that repeats weekly and reply with only a JSON array. Each item is {"label": short course or activity name, "days": array drawn from ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], "start": "HH:MM" in 24-hour time, "end": "HH:MM" in 24-hour time}. If the same entry meets at the same time on several days, list those days in one item. Convert 12-hour times using am/pm or context (classes rarely start before 7:00). Skip anything you cannot read confidently. Example: [{"label":"MATH 101","days":["Mon","Wed"],"start":"09:00","end":"10:30"}]';
    try{
      const raw=await S.sample.json(prompt,{images:file,signal:ctl.signal});
      ctl=null;review(parseTimetable(raw));
    }catch(e){
      ctl=null;const msg=aiErr(e);if(e&&e.code==='cancelled')return;pick(msg);
    }
  }
  function review(res){
    const rows=res.rows;
    if(!rows.length)return pick('No classes were found in that image. Try a clearer or closer photo.');
    const cur=S.members[mid];const have=cur&&Array.isArray(cur.blocks)?cur.blocks.length:0;
    openDlg('<h2>Found '+rows.length+' class'+(rows.length===1?'':'es')+'</h2><p class="muted">Untick anything that looks wrong. You can adjust times later by clicking a block.</p>'
      +'<ul class="rv">'+rows.map((r,i)=>'<li><label class="rvrow"><input type="checkbox" class="mc" style="--c:var(--m'+cx(m)+')" data-i="'+i+'" checked><span class="rvl"><b>'+esc(r.label)+'</b><small>'+r.days.map(d=>DAYS[d]).join(', ')+' · '+range(r.start,r.end)+'</small></span></label></li>').join('')+'</ul>'
      +(have?'<fieldset class="mode"><label><input type="radio" name="mode" value="add" checked> Add to existing classes</label><label><input type="radio" name="mode" value="replace"> Replace existing schedule</label></fieldset>':'')
      +(res.skipped?'<p class="muted">'+res.skipped+' item'+(res.skipped===1?' was':'s were')+' unreadable and skipped.</p>':'')
      +'<div class="actions"><span class="sp"></span><button type="button" class="btn ghost" data-close>Cancel</button><button type="button" class="btn primary" id="ok">Add to calendar</button></div>',dlg=>{
        const ok=$('#ok',dlg);
        const chosen=()=>[...dlg.querySelectorAll('input.mc')].filter(x=>x.checked).map(x=>rows[+x.dataset.i]);
        const sync=()=>{const c=chosen().length;ok.disabled=!c;ok.textContent=c?'Add '+c+' class'+(c===1?'':'es'):'Nothing selected';};
        dlg.querySelectorAll('input.mc').forEach(x=>x.addEventListener('change',sync));sync();
        ok.addEventListener('click',async()=>{
          const picked=chosen();if(!picked.length)return;
          const replace=(dlg.querySelector('input[name=mode]:checked')||{}).value==='replace';
          const next=clone(S.members[mid]);next.blocks=replace||!Array.isArray(next.blocks)?[]:next.blocks;
          const seen=new Set(next.blocks.map(b=>[b.day,b.start,b.end,String(b.label).toLowerCase()].join('|')));
          let added=0;
          picked.forEach(r=>r.days.forEach(d=>{const k=[d,r.start,r.end,r.label.toLowerCase()].join('|');if(seen.has(k))return;seen.add(k);next.blocks.push({id:uid('b'),day:d,start:r.start,end:r.end,label:r.label});added++;}));
          closeDlg();
          if(await safe(()=>put('members',mid,next)))toast('Added '+added+' class block'+(added===1?'':'s')+' to '+m.name+'\'s schedule.');
        });
      });
  }
  pick('');
}

/* ---------- ask Claude ---------- */
async function askClaude(){
  if(!S.sample||S.aiBusy)return;
  const act=S.act,recs=S.recs||[],almost=S.almost||[];
  const byId=Object.fromEntries(act.map(m=>[m.id,m.name]));
  const lines=recs.map((r,i)=>(i+1)+'. '+DAYFULL[r.day]+' '+range(r.start,r.end)+' ('+durText(r.end-r.start)+')').join('\n');
  const alm=almost.map(w=>DAYFULL[w.day]+' '+range(w.start,w.end)+', without '+(byId[w.missing[0]]||'one person')).join('\n');
  const prompt='A friend group of students ('+act.map(m=>m.name).join(', ')+') wants to hang out. Their classes repeat weekly and these windows are free for everyone:\n'+(lines||'(none)')+'\n'+(alm?'Windows where exactly one person is busy:\n'+alm+'\n':'')+'Pick the two best options, give one short reason each, and suggest one fitting activity for each (study session, dinner, movie, and so on). Plain text, no markdown, under 90 words.';
  S.aiBusy=true;S.aiText='';render();
  try{
    const r=await S.sample(prompt,{modelTier:'quick',onText:({text})=>{S.aiText=text;const o=$('#aiOut');if(o)o.textContent=text;}});
    S.aiText=r.text;
  }catch(e){S.aiText=e&&e.text?e.text:(e&&e.code==='not_granted'?'Claude access was declined.':e&&e.code==='rate_limited'?'Too many requests right now. Try again in a minute.':'Could not get a suggestion. Try again.');}
  S.aiBusy=false;render();
}

/* ---------- example (device-only mode) ---------- */
async function loadExample(){
  const gid=uid('g');
  const mk=(name,color,list)=>({gid,name,color,ownerId:null,createdAt:Date.now()+color,blocks:list.flatMap(([days,s,e,label])=>days.map(d=>({id:uid('b'),day:d,start:s*60,end:e*60,label})))});
  await put('groups',gid,{name:'Example: study crew',createdAt:Date.now()});
  await put('members',uid('m'),mk('Maya',0,[[[0,2],9,10.5,'BIO 201'],[[0,2],13,14.5,'CHEM 110'],[[1,3],10,11.5,'STAT 150'],[[1],15,18,'Lab'],[[4],9,12,'Shift']]));
  await put('members',uid('m'),mk('Dev',1,[[[0,2,4],10,11,'CS 101'],[[1,3],13,15,'MATH 120'],[[0],16,18,'Club'],[[3],17,21,'Part-time job']]));
  await put('members',uid('m'),mk('Sam',2,[[[0,2],8,9.5,'ECON 100'],[[1,3],11,12.5,'HIST 210'],[[2],14,17,'Lab'],[[4],13,16,'Studio']]));
  S.gid=gid;pref.set('gid',gid);render();
}

init();
})();
