/* Оқушының телефоны: атын сұрайды, күтеді, мұғалім ашқан слайд бетін көрсетеді.
   Бет – слайдтың өзі, сондықтан таразылар мен «Тексеру» түймелері дәл слайдтағыдай жұмыс істейді. */
"use strict";
const OQ=(()=>{
  const NKEY='ms_oq_name'+OQTAG, GN=[['Қызыл','#c8352b'],['Жасыл','#2e7d4f'],['Көк','#1f5fa8']];
  const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const buzz=n=>{ try{ navigator.vibrate&&navigator.vibrate(n); }catch(e){} };
  let PID=store.get('pid',null); if(!PID){ PID=Math.random().toString(36).slice(2,10); store.set('pid',PID); }
  let NAME=''; try{ NAME=localStorage.getItem(NKEY)||''; }catch(e){}
  let net=null, joined=false, kicked=false, lastSeen=0, ST={act:null,g:null,started:false}, shown=null, screen='', waitSig='';
  const PROG=store.get('prog',{}), VALS=store.get('vals',{}); delete PROG.gt;   // топтық жауап бет жаңартылғанда тазарады
  let top,app;

  function setTop(){ top.querySelector('.nm').textContent=(NAME||'Сабаққа қосылу')+(shown?' · '+pageOf(shown).dataset.title:''); const e=top.querySelector('.oqgp'), g=GN[ST.g]; if(g&&joined){ e.hidden=false; e.textContent=g[0]; e.style.background=g[1]; } else e.hidden=true; }
  const pageOf=k=>document.querySelector(`.slide[data-phone="${k}"]`);
  function cover(on){ app.style.display=on?'block':'none'; window.oqPaused=on; if(on) shown=null; }

  function vName(){ screen='name'; cover(true); app.innerHTML=`<div class="box"><h1>Сабаққа қосылу</h1><p class="mut">Атың мен тегіңді жаз. Ол мұғалімнің экранында шығады.</p><input id="oqNm" maxlength="24" autocomplete="off" placeholder="Мысалы: Аружан Серікова" value="${esc(NAME)}"><button class="go" id="oqGo">Кіру</button></div>`;
    const ok=()=>{ const v=$('oqNm').value.replace(/[<>&"'`]/g,'').trim().replace(/\s+/g,' '); if(v.length<2){ $('oqNm').focus(); return; } NAME=v; try{ localStorage.setItem(NKEY,v); }catch(e){} store.set('in',true); start(); };
    $('oqGo').onclick=ok; $('oqNm').addEventListener('keydown',e=>{ if(e.key==='Enter') ok(); }); }
  function vWait(){ screen='wait'; cover(true); const g=GN[ST.g]; app.innerHTML=`<div class="box" style="text-align:center;padding-top:34px"><div style="font-size:54px">${!joined?'📡':ST.started?'🚀':'⏳'}</div><h1>${joined?'Сен қосылдың, '+esc(NAME.split(' ')[0])+'!':'Қосылып жатырмын…'}</h1>${joined&&g?`<p>Сенің тобың: <b style="color:${g[1]}">${g[0]}</b></p>`:''}<p class="mut">${!joined?'Бір сәт күт. Ұзаққа созылса, интернетті немесе Wi-Fi-ды тексер.':ST.started?'Сабақ басталды! Мұғалім тапсырма бетін ашқанда, ол осы жерде шығады.':'Атың экранда шықты. Мұғалім тапсырманы ашқанша күте тұр.'}</p></div>`; }

  /* Бет ашылғанда: топқа және өз атына бейімдеу */
  function setup(key){ const g=ST.g==null?0:ST.g;
    if(key==='gt') [...$('gtRow').children].forEach((c,i)=>{ c.style.display=i===g?'':'none'; });
    if(key==='pt'&&(ptG!==g||!$('ptTab').children.length)){ ptG=g; ptBuild(); }
    if(key==='jk'){ ROSTER=[NAME]; who=0; tkFill(); }
    document.querySelectorAll(`.slide[data-phone="${key}"] input[id]`).forEach(i=>{ if(VALS[i.id]!=null&&i.value===''&&i.type!=='range') i.value=VALS[i.id]; }); }
  function showPage(key){ if(shown===key&&screen==='page') return; const i=slides.indexOf(pageOf(key)); if(i<0) return; screen='page'; go(i); cover(false); shown=key; setup(key); setTop(); scrollTo(0,0); buzz(120); report(); }

  /* ---------- нәтижені мұғалімге жіберу ---------- */
  function collect(key){ const s=pageOf(key); if(!s) return null; const v={g:s.querySelectorAll('.good').length,b:[...s.querySelectorAll('.bad')].filter(x=>!x.closest('.status')).length};
    if(key==='jk'){ v.sc=pts(NAME); v.it=RES[NAME]||{}; }
    if(key==='gt') v.gt={g:ST.g,ok:!!(GTS[ST.g]&&GTS[ST.g].ok)};
    return v; }
  function report(){ if(!shown) return; const v=collect(shown); if(!v) return; const was=JSON.stringify(PROG[shown]), now=JSON.stringify(v); if(was===now) return; PROG[shown]=v; store.set('prog',PROG); if(net) net.send({t:'res',pack:shown,v}); }
  let rt=0; const later=()=>{ clearTimeout(rt); rt=setTimeout(report,250); };

  function render(){ setTop(); if(kicked) return; if(joined&&ST.act){ showPage(ST.act); return; } const sig=joined+'|'+ST.g+'|'+!!ST.started; if(screen!=='wait'||waitSig!==sig){ waitSig=sig; vWait(); } }
  function onMsg(m){ if(m.pid&&m.pid!==PID) return; lastSeen=Date.now();
    if(m.t==='kicked'){ kicked=true; joined=false; screen=''; cover(true); app.innerHTML=`<div class="box" style="text-align:center;padding-top:40px"><h1>Мұғалім тізімнен алып тастады</h1><button class="go" id="oqRe">Қайта кіру</button></div>`; $('oqRe').onclick=()=>{ kicked=false; net.send({t:'hello',name:NAME,force:true}); vWait(); }; return; }
    if(m.t==='st'){ joined=true; const was=ST.started, gWas=ST.g; ST=Object.assign(ST,m); if(m.pt){ PTM.left=[m.pt.left,m.pt.left,m.pt.left]; PTM.run=m.pt.run; PTM.last=performance.now(); ptTm(); } if(ST.started&&!was) buzz(120); if(gWas!==ST.g&&shown) setup(shown); render(); } }

  function start(){ top.hidden=false; setTop(); vWait(); if(net){ net.send({t:'hello',name:NAME}); return; }
    net=NET.openPad({room:OQROOM,pid:PID,onMsg,onStatus:s=>{ top.querySelector('.oqdot').className='oqdot '+(s==='on'?'on':s==='off'?'off':''); if(s==='on'&&net) net.send({t:'hello',name:NAME}); }});
    setTimeout(()=>net.send({t:'hello',name:NAME}),700);
    setInterval(()=>{ if(!net||!net.online) return; if(!joined) net.send({t:'hello',name:NAME}); else net.send({t:'ping',n:NAME,p:PROG}); if(lastSeen&&Date.now()-lastSeen>14000&&!document.hidden){ lastSeen=Date.now(); net.next(); } },2500);
    document.addEventListener('visibilitychange',()=>{ if(!document.hidden&&net&&net.online) net.send({t:'ping',n:NAME,p:PROG}); }); }

  function init(){ document.title='Физика: сабаққа қосылу';
    top=document.createElement('div'); top.className='oqtop'; top.innerHTML='<span class="oqdot"></span><span class="nm"></span><span class="oqgp" hidden></span>'; document.body.appendChild(top);
    app=document.createElement('div'); app.className='oqapp'; document.body.appendChild(app);
    const box=$('slides');
    new MutationObserver(later).observe(box,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['class']});
    box.addEventListener('input',e=>{ const i=e.target; if(i.tagName==='INPUT'&&i.type!=='range'&&i.id){ VALS[i.id]=i.value; store.set('vals',VALS); } });
    box.addEventListener('focusin',e=>{ const i=e.target; if(i.tagName==='INPUT'&&i.type!=='range') i.inputMode=i.dataset.q?'text':'decimal'; });
    if(store.get('in',false)&&NAME) start(); else vName(); }
  return {init,get ST(){return ST;},get PROG(){return PROG;},PID,get shown(){return shown;}};
})();
window.__oq=OQ;
