/* Shield Point Strategies — site script. No libraries. */
(function(){
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const data=JSON.parse(($('#page-data')||{textContent:'{}'}).textContent||'{}');

  /* skin: night (default) or steel — a lighter take that still fits the scheme */
  try{const k=localStorage.getItem('sps-skin');if(k==='steel')document.documentElement.dataset.skin='steel';}catch(e){}
  $$('.skin button').forEach(b=>{b.setAttribute('aria-pressed',String((document.documentElement.dataset.skin||'night')===b.dataset.skin));
    b.addEventListener('click',()=>{const s=b.dataset.skin;if(s==='night')delete document.documentElement.dataset.skin;else document.documentElement.dataset.skin=s;
      try{localStorage.setItem('sps-skin',s);}catch(e){} $$('.skin button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));});});

  /* opening — plays every time the home page opens; skippable; ends on the name */
  const op=$('#open');
  if(op){ if(reduce||window.__WM_SHOT){op.remove();} else { const end=()=>{op.classList.add('done');setTimeout(()=>op.remove(),450);}; setTimeout(end,1900); $('.skip-open',op).addEventListener('click',end); } }

  /* menu sheet */
  const sheet=$('#sheet'); const mb=$('.menu-btn');
  if(sheet&&mb){const open=o=>{sheet.classList.toggle('open',o);mb.setAttribute('aria-expanded',String(o));document.body.style.overflow=o?'hidden':'';};
    mb.addEventListener('click',()=>open(!sheet.classList.contains('open'))); $('.bg',sheet).addEventListener('click',()=>open(false));
    $$('a',sheet).forEach(a=>a.addEventListener('click',()=>open(false))); addEventListener('keydown',e=>{if(e.key==='Escape')open(false);});}

  /* reveal */
  if('IntersectionObserver' in window){const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}}),{rootMargin:'0px 0px -8% 0px'});$$('.rv').forEach(el=>io.observe(el));}
  else $$('.rv').forEach(el=>el.classList.add('in'));

  /* the plate — five layers; tap a ring, or let it cycle */
  const plate=$('.plate'); if(plate&&data.layers){
    const rings=$$('.r',plate), hits=$$('.hit',plate), lbls=$$('.lbl',plate), card=$('#layer-card'), dots=$$('.dots button'); let i=0, timer=null;
    const show=n=>{i=n;const L=data.layers[n];rings.forEach((r,k)=>r.classList.toggle('hot',k===n));lbls.forEach((l,k)=>l.classList.toggle('hot',k===n));dots.forEach((d,k)=>d.toggleAttribute('aria-current',k===n));
      if(card){card.innerHTML=`<div class="n">LAYER ${L.n}</div><h3>${L.name}</h3><p>${L.text}</p><p class="we"><b>We do</b>${L.we}</p>`;}};
    const cycle=()=>{if(reduce)return;timer=setInterval(()=>show((i+1)%data.layers.length),4200);};
    hits.forEach((r,k)=>{const go=()=>{clearInterval(timer);show(k);};r.addEventListener('click',go);r.addEventListener('pointerenter',go);r.setAttribute('tabindex','0');r.setAttribute('role','button');r.setAttribute('aria-label',data.layers[k].name+' layer');r.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go();}});});
    dots.forEach((d,k)=>d.addEventListener('click',()=>{clearInterval(timer);show(k);}));
    show(0); cycle();
  }

  /* approach page — the layers light as you walk down */
  const walk=$('.walk'); if(walk){const lyrs=$$('.lyr',walk), prings=$$('.r',walk), plbl=$$('.lbl',walk);
    const on=n=>{lyrs.forEach((l,k)=>l.classList.toggle('on',k===n));prings.forEach((r,k)=>r.classList.toggle('hot',k===n));plbl.forEach((l,k)=>l.classList.toggle('hot',k===n));};
    if('IntersectionObserver' in window){const io=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting)on(lyrs.indexOf(e.target));});},{rootMargin:'-40% 0px -45% 0px'});lyrs.forEach(l=>io.observe(l));} on(0);}

  /* readiness check */
  const quiz=$('#quiz'); if(quiz&&data.readiness){
    const Q=data.readiness.questions, R=data.readiness.readings, ans=new Array(Q.length).fill(null); const bar=$('.bar i',quiz), res=$('#result'), names=data.layerNames||{};
    const render=()=>{const done=ans.filter(a=>a!==null).length; bar.style.width=(done/Q.length*100)+'%';
      if(done===Q.length){let score=0;const per={};Q.forEach((q,k)=>{const good=ans[k]===q.good;if(good)score++;per[q.layer]=per[q.layer]||{ok:0,n:0};per[q.layer].n++;if(good)per[q.layer].ok++;});
        const rd=R.find(r=>score>=r.min&&score<=r.max); const gaps=Object.keys(per).filter(l=>per[l].ok<per[l].n).map(l=>names[l]||l);
        $('.score',res).innerHTML=score+'<small>/'+Q.length+'</small>'; $('.rt',res).textContent=rd.title; $('.rx',res).textContent=rd.text;
        $('.layers',res).innerHTML=Object.keys(per).map(l=>`<div class="${per[l].ok<per[l].n?'gap':'ok'}">${names[l]||l}</div>`).join('');
        const msg=`Hi Brian — I just took the Shield Point readiness check. Score ${score}/${Q.length}. Gaps: ${gaps.length?gaps.join(', '):'none flagged'}. I'd like to talk about a walkthrough.`;
        $('.sms',res).href='sms:'+data.sms+'?&body='+encodeURIComponent(msg); $('.mail',res).href='mailto:'+data.email+'?subject='+encodeURIComponent('Readiness check — '+score+'/'+Q.length)+'&body='+encodeURIComponent(msg);
        res.classList.add('show'); res.scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'});}};
    $$('.qcard',quiz).forEach((c,k)=>{$$('button',c).forEach(b=>b.addEventListener('click',()=>{ans[k]=b.dataset.v==='yes';$$('button',c).forEach(x=>x.setAttribute('aria-pressed',String(x===b)));render();
      const nx=$$('.qcard',quiz)[k+1];if(nx&&ans[k+1]===null)nx.scrollIntoView({behavior:reduce?'auto':'smooth',block:'center'});}));});
  }

  /* contact form — composes the message; sends by the visitor's own mail or text app. Nothing is stored. */
  const form=$('#cform'); if(form){form.addEventListener('submit',e=>{e.preventDefault();const f=new FormData(form);
    const body=`Name: ${f.get('name')}\nOrganization: ${f.get('org')}\nI am responsible for: ${f.get('kind')}\nPhone: ${f.get('phone')}\n\n${f.get('msg')}`;
    const subj='Shield Point — '+(f.get('kind')||'a conversation'); const sent=$('#sent');
    $('.mail',sent).href='mailto:'+data.email+'?subject='+encodeURIComponent(subj)+'&body='+encodeURIComponent(body);
    $('.sms',sent).href='sms:'+data.sms+'?&body='+encodeURIComponent(body.slice(0,600)); sent.classList.add('show'); sent.scrollIntoView({behavior:reduce?'auto':'smooth',block:'nearest'});});}

  /* open-now line (local time in Liberty Lake) */
  const now=$('[data-now]'); if(now&&data.tz){try{const h=+new Intl.DateTimeFormat('en-US',{hour:'numeric',hour12:false,timeZone:data.tz}).format(new Date());now.textContent=(h>=8&&h<18)?'Business hours in Liberty Lake right now — call or text.':'After hours in Liberty Lake — text or email and we will come back to you.';}catch(e){}}

  /* install strip (PWA) */
  let deferred=null; const strip=$('#install');
  addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e;if(strip)strip.classList.add('show');});
  if(strip){ $('.go',strip).addEventListener('click',async()=>{if(deferred){deferred.prompt();await deferred.userChoice;deferred=null;}strip.classList.remove('show');});
    $('.x',strip).addEventListener('click',()=>{strip.classList.remove('show');try{sessionStorage.setItem('sps-noinst','1');}catch(e){}});
    const ios=/iphone|ipad/i.test(navigator.userAgent)&&!navigator.standalone; let hide=false; try{hide=!!sessionStorage.getItem('sps-noinst');}catch(e){}
    if(ios&&!hide&&!window.__WM_SHOT){$('.t',strip).textContent='Add Shield Point to your home screen: tap Share, then “Add to Home Screen”.';$('.go',strip).style.display='none';strip.classList.add('show');} }
  if('serviceWorker' in navigator&&!window.__WM_SHOT){addEventListener('load',()=>navigator.serviceWorker.register(data.root+'sw.js').catch(()=>{}));}

  /* nav current */
  $$('nav.main a, #sheet a, .dock a').forEach(a=>{const p=new URL(a.href).pathname.replace(/\/$/,'');const c=location.pathname.replace(/\/$/,'');if(p===c||(p&&c.startsWith(p+'/')&&p!==data.rootPath))a.setAttribute('aria-current','page');});
})();
