/* Мұғалім экраны: QR, оқушылар тізімі, тапсырма бетін телефонға ашу, нәтижелер.
   Ереже: тапсырма бетінде QR-ды үлкейткенде, слайдтың сол беті барлық телефонға ашылады. */
"use strict";
const PH=(()=>{
  const today=new Date().toISOString().slice(0,10);
  const newRoom=()=>{ const A='ABCDEFGHJKMNPQRSTUVWXYZ'; let s=''; for(let i=0;i<4;i++) s+=A[Math.floor(Math.random()*A.length)]; return s; };
  let D=store.get('ms_ph',null); if(!D||D.date!==today) D={date:today,room:newRoom(),st:{},kick:[],act:null};
  const save=()=>store.set('ms_ph',D);
  const seen={};
  let net=null, linkInfo=null, status=[];
  const online=pid=>Date.now()-(seen[pid]||0)<9000;
  const ids=()=>Object.keys(D.st);
  const isLocal=()=>linkInfo&&linkInfo.local;
  const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const pageOf=k=>document.querySelector(`.slide[data-phone="${k}"]`);
  const titleOf=k=>{ const s=pageOf(k); return s?s.dataset.title:''; };
  const keyHere=()=>slides[cur].dataset.phone||null;
  const overlayOn=()=>$('phOv').style.display!=='none';

  /* ---------- сілтеме және QR ---------- */
  function joinUrl(){ if(isLocal()) return /^127\./.test(linkInfo.host)?'':`http://${linkInfo.host}:${linkInfo.port}/index.html?r=${D.room}`;
    if(location.protocol==='http:'||location.protocol==='https:'){ const p=location.pathname.replace(/[^/]*$/,''); return location.origin+p+'index.html?r='+D.room; }
    const b=store.get('ms_puburl','').trim(); if(b) return b.replace(/\/?(index\.html)?$/,'/')+'index.html?r='+D.room; return ''; }
  function qrSvg(u){ const q=qrcode(0,'M'); q.addData(u); q.make(); return q.createSvgTag({cellSize:6,margin:2,scalable:true}); }
  function paintQR(){ const u=joinUrl(), loc=isLocal(); document.querySelectorAll('[data-qr]').forEach(b=>{ b.innerHTML=u?qrSvg(u):(loc?'<div class="qrno">QR жоқ:<br>компьютерді Wi-Fi-ға қосыңыз</div>':'<div class="qrno">QR жоқ:<br>сілтеме керек</div>'); });
    document.querySelectorAll('[data-url]').forEach(b=>{ b.textContent=u?u.replace(/^https?:\/\//,''):'—'; });
    const w=$('phFile'); if(w) w.style.display=(u||loc)?'none':'block'; const i=$('phPub'); if(i&&!i.value) i.value=store.get('ms_puburl','');
    const f=$('phWifi'); if(f){ f.style.display=(loc&&u)?'block':'none'; f.innerHTML=linkInfo&&linkInfo.ssid?`Алдымен телефонды <b>«${esc(linkInfo.ssid)}»</b> Wi-Fi-ына қос (мобильді интернетті өшір).`:'Алдымен телефонды осы компьютер қосылған Wi-Fi-ға қос.'; } }

  /* ---------- оқушылар ---------- */
  function groupFor(name){ const f=GD.list.find(x=>x.name===name); if(f) return f.c; let c; if(GD.bag.length) c=GD.bag.pop(); else { const n=[0,0,0]; GD.list.forEach(x=>n[x.c]++); c=n.indexOf(Math.min(...n)); } GD.list.push({name,c}); store.set('ms_gd',GD); gdShow(); return c; }
  function ensureRoster(name){ if(ROSTER.includes(name)) return; const i=ROSTER.findIndex(n=>/^\d+-оқушы$/.test(n)&&!RES[n]); if(i>=0) ROSTER[i]=name; else ROSTER.push(name); store.set('ms_roster',ROSTER); $('roster').value=ROSTER.join('\n'); tkFill(); grBuild(); }
  /* Атау кестелерге HTML болып түседі, сондықтан белгілерді алып тастаймыз */
  function cleanName(v){ return String(v||'').replace(/[<>&"'`]/g,'').slice(0,24).trim()||'Оқушы'; }
  function reg(pid,raw){ const name=cleanName(raw); let s=D.st[pid]; if(!s){ s=D.st[pid]={n:name,g:groupFor(name),prog:{}}; ensureRoster(name); save(); SND.clink(); paintList(); } else if(s.n!==name){ s.n=name; save(); paintList(); } return s; }

  /* Топтық бет: топтың алғашқы дұрыс жауабы топ ұпайына түседі. Практикалық жұмыстың жауабы қорғауда тақтада ғана енгізіледі. */
  function mergeGt(v){ if(!v||!v.ok||!GR[v.g]) return; const s=GTS[v.g]=GTS[v.g]||{t:0,done:false,ok:false}; if(s.ok) return; s.done=true; s.ok=true; s.t=s.t||1; addGS(v.g,2); store.set('ms_gt',GTS); gtShow(v.g); }
  function applyGrade(s,v){ if(!v||!v.it) return; const r=RES[s.n]=RES[s.n]||{}; let ch=false; Object.keys(v.it).forEach(q=>{ const a=v.it[q]; if(!TQ[q]||!a) return; if(!r[q]||r[q].t!==a.t||r[q].done!==a.done){ r[q]={t:a.t,p:a.p,v:a.v,done:a.done}; ch=true; } }); if(ch){ store.set('ms_res',RES); tkLoad(); grBuild(); } }
  function setProg(pid,key,v){ const s=D.st[pid]; if(!s||!v||!pageOf(key)) return; const brief={g:v.g||0,b:v.b||0}; if(v.sc!=null) brief.sc=v.sc;
    if(JSON.stringify(s.prog[key])!==JSON.stringify(brief)){ s.prog[key]=brief; save(); paintChip(); paintMon(); }
    applyGrade(s,v); mergeGt(v.gt); }

  function stFor(pid){ const s=D.st[pid], o={t:'st',pid,act:D.started?D.act:null,started:!!D.started,g:s?s.g:null}; if(D.act==='pt') o.pt={left:PTM.left[ptG],run:PTM.run}; return o; }
  function paintStart(){ const n=ids().length; document.querySelectorAll('[data-phstart]').forEach(b=>{ b.style.display=D.started?'none':''; b.disabled=!!D.started||!n; b.textContent=n?`▶ Бастау (${n} оқушы)`:'▶ Бастау: оқушыларды күтудеміз'; }); }
  function markStarted(){ if(D.started) return; D.started=true; save(); paintStart(); paintChip(); all(); }
  function begin(){ if(D.started||!ids().length) return; SND.bell(); markStarted(); toast('▶ Сабақ басталды! Тапсырма бетінде QR-ды үлкейткенде, сол бет телефонға ашылады.'); monitor(false); if(slides[cur].id==='slJoin') go(cur+1); }
  /* Осы беттегі тапсырманы телефондарға ашу */
  function release(key){ if(D.act===key&&D.started) return; D.act=key; D.started=true; save(); SND.bell(); paintStart(); all(); paintChip(); }
  function tell(pid){ if(net) net.send(pid,stFor(pid)); }
  function all(){ ids().forEach(pid=>{ if(online(pid)) tell(pid); }); }
  function onMsg(m){ const pid=m.pid; if(!pid) return; seen[pid]=Date.now();
    if(D.kick.includes(pid)&&!m.force){ net.send(pid,{t:'kicked',pid}); return; }
    if(m.force) D.kick=D.kick.filter(x=>x!==pid);
    if(m.t==='hello'){ reg(pid,m.name); tell(pid); paintChip(); return; }
    if(!D.st[pid]){ if(m.n) reg(pid,m.n); else return; }
    if(m.t==='ping'){ if(m.n) reg(pid,m.n); if(m.p) Object.keys(m.p).forEach(k=>setProg(pid,k,m.p[k])); tell(pid); return; }
    if(m.t==='res'){ setProg(pid,m.pack,m.v); return; } }
  function kick(pid){ const s=D.st[pid]; if(!s) return; if(!confirm(s.n+' тізімнен алынсын ба?')) return; delete D.st[pid]; D.kick.push(pid); save(); if(net) net.send(pid,{t:'kicked',pid}); paintList(); }
  function resetAll(){ if(!confirm('Жаңа сабақ: жаңа QR жасалады, топтар мен осы сыныптың нәтижелері тазарады. Жалғастырамыз ба?')) return; store.set('ms_ph',{date:today,room:newRoom(),st:{},kick:[],act:null}); store.set('ms_gd',null); store.set('ms_res',{}); store.set('ms_pt',[{},{},{}]); store.set('ms_ptp',[{},{},{}]); store.set('ms_gt',{}); store.set('ms_gs',[0,0,0]); store.set('ms_lt',[0,0,0]); store.set('ms_lt_log',[]); store.set('ms_less',null); location.reload(); }

  /* ---------- экрандағы тізім ---------- */
  function paintChip(){ const c=$('phChip'); if(!c) return; const n=ids().length, k=keyHere(); let t='📱 QR · '+n, hot=false;
    if(k&&!(D.started&&D.act===k)){ t='📱 QR-ды үлкейт: бет телефонға ашылады · '+n; hot=true; }
    else if(D.started&&D.act==='pt') t+=' · '+titleOf('pt');
    else if(D.started&&D.act){ const dn=ids().filter(p=>{ const v=D.st[p].prog[D.act]; return v&&(v.g||v.b||v.sc); }).length; t+=` · ${titleOf(D.act)}: ${dn}/${n}`; }
    else if(!D.started&&n) t+=' · «Бастау» күтілуде';
    c.textContent=t; c.classList.toggle('hot',hot); }
  function paintList(){ paintChip(); const g=$('phNames'); if(g){ $('phCount').textContent=ids().length; g.innerHTML=ids().map(p=>{ const s=D.st[p]; return `<span class="nmc" style="background:${GR[s.g].c}" data-k="${p}" title="Алып тастау">${esc(s.n)}</span>`; }).join('')||'<span style="color:var(--muted);font-size:20px">Әзірге ешкім қосылған жоқ…</span>'; } paintStart(); paintMon(); }
  function cell(v){ if(!v) return '<td>–</td>'; if(v.sc!=null) return `<td class="${v.sc>0?'ok':''}"><b>${nf(v.sc,1)}</b> / ${MAXP}</td>`; return `<td class="${v.g&&!v.b?'ok':''}">${v.g?'✔ '+v.g:''}${v.g&&v.b?' · ':''}${v.b?'✘ '+v.b:''}${!v.g&&!v.b?'…':''}</td>`; }
  function paintMon(){ const b=$('phMonT'); if(!b||!overlayOn()) return; const now=$('phNow'), k=keyHere();
    now.innerHTML=D.started&&D.act?`Телефондарда ашық: <b>${esc(titleOf(D.act))}</b>${k&&k!==D.act?'':''}`:(k?'':'Әзірге телефонға бет ашылған жоқ. <b>Тапсырма бетінде</b> QR-ды үлкейткенде, сол бет ашылады.');
    const keys=[...document.querySelectorAll('.slide[data-phone]')].map(s=>s.dataset.phone).filter(x=>x===D.act||ids().some(p=>D.st[p].prog[x]));
    let h='<tr><th>Оқушы</th><th>Топ</th>'+keys.map(x=>`<th>${esc(titleOf(x))}</th>`).join('')+'<th>Байланыс</th><th></th></tr>';
    ids().forEach(p=>{ const s=D.st[p]; h+=`<tr><td class="l"><b>${esc(s.n)}</b></td><td style="color:${GR[s.g].c};font-weight:700">${GR[s.g].n}</td>`+keys.map(x=>cell(s.prog[x])).join('')+`<td>${online(p)?'🟢':'⚪'}</td><td><button class="btn" data-x="${p}" style="padding:1px 8px">×</button></td></tr>`; });
    b.innerHTML=h; }
  function monitor(on){ $('phOv').style.display=on?'flex':'none'; if(on){ const k=keyHere(); if(k) release(k); paintQR(); paintMon(); } }
  function paintNet(){ const ok=status.filter(x=>x.on); document.querySelectorAll('[data-net]').forEach(e=>{ e.textContent=ok.length?'Байланыс бар: '+ok.map(x=>x.name).join(', '):'Байланыс орнатылып жатыр…'; e.style.color=ok.length?'var(--green)':'var(--red)'; }); }

  function init(){ net=NET.openPanel({room:D.room,onMsg,onStatus:l=>{ status=l; paintNet(); },onReady:i=>{ linkInfo=i; paintQR(); paintNet(); }});
    $('phChip').onclick=()=>monitor(!overlayOn());
    $('phClose').onclick=()=>monitor(false);
    document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&overlayOn()) monitor(false); });
    $('phOv').addEventListener('click',e=>{ const x=e.target.closest('[data-x]'); if(x) kick(x.dataset.x); });
    $('phNames').addEventListener('click',e=>{ const x=e.target.closest('[data-k]'); if(x) kick(x.dataset.k); });
    $('phReset').onclick=resetAll;
    /* тақтадағы таймер телефондарда да көрінеді */
    ['ptGo','ptRe','ptClr','ptTabs'].forEach(id=>$(id).addEventListener('click',all));
    document.querySelectorAll('[data-phstart]').forEach(b=>b.onclick=begin);
    $('phPubOk').onclick=()=>{ store.set('ms_puburl',$('phPub').value.trim()); paintQR(); };
    setInterval(()=>{ if(overlayOn()) paintMon(); },2000);
    const og=go; go=function(i){ og(i); paintChip(); };
    paintList(); paintQR(); }
  return {init,get D(){return D;},monitor,begin};
})();
window.__ph=PH;
