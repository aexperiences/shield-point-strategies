/* Shield Point concept sites — shared kit script: dock state, reveals, install, offline, contact form. No libraries. */
(function(){
  var $=function(s,r){return (r||document).querySelector(s)}, $$=function(s,r){return [].slice.call((r||document).querySelectorAll(s))};
  var D=JSON.parse(($('#kit-data')||{textContent:'{}'}).textContent||'{}'); window.SPS=D;
  window.SPS.reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* the dock: light the room you are in */
  var here=location.pathname.replace(/\/+$/,'/');
  $$('.dock a').forEach(function(a){ var p=new URL(a.href,location.href).pathname.replace(/\/+$/,'/'); if(p===here) a.setAttribute('aria-current','page'); });
  /* reveal fallback where scroll-driven animation is not supported */
  if(!CSS.supports||!CSS.supports('animation-timeline:view()')){ if('IntersectionObserver' in window){ var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});},{rootMargin:'0px 0px -8% 0px'}); $$('.rv').forEach(function(e){io.observe(e);}); } else $$('.rv').forEach(function(e){e.classList.add('in');}); }
  /* contact form: writes the message, sends from the visitor's own mail or text app; nothing stored here */
  var f=$('#cform'); if(f){ f.addEventListener('submit',function(e){ e.preventDefault(); var d=new FormData(f);
    var body='Name: '+d.get('name')+'\nOrganization: '+d.get('org')+'\nI am responsible for: '+d.get('kind')+'\nPhone: '+d.get('phone')+'\n\n'+d.get('msg');
    var s=$('#sent'); $('.mail',s).href='mailto:'+D.email+'?subject='+encodeURIComponent('Shield Point — '+d.get('kind'))+'&body='+encodeURIComponent(body);
    $('.sms',s).href='sms:'+D.sms+'?&body='+encodeURIComponent(body.slice(0,600)); s.classList.add('show'); s.scrollIntoView({behavior:SPS.reduce?'auto':'smooth',block:'nearest'}); }); }
  var now=$('[data-now]'); if(now){ try{ var h=+new Intl.DateTimeFormat('en-US',{hour:'numeric',hour12:false,timeZone:D.tz}).format(new Date()); now.textContent=(h>=8&&h<18)?'Business hours in Liberty Lake right now — call or text.':'After hours in Liberty Lake — text or email and he will come back to you.'; }catch(e){} }
  /* install as an app */
  var dfr=null, st=$('#install');
  addEventListener('beforeinstallprompt',function(e){ e.preventDefault(); dfr=e; if(st&&!window.__WM_SHOT) st.classList.add('show'); });
  if(st){ $('.go',st).addEventListener('click',function(){ if(dfr){ dfr.prompt(); dfr=null; } st.classList.remove('show'); }); $('.x',st).addEventListener('click',function(){ st.classList.remove('show'); }); }
  if('serviceWorker' in navigator && !window.__WM_SHOT) addEventListener('load',function(){ navigator.serviceWorker.register(D.root+'sw.js').catch(function(){}); });
  /* small helpers the concepts share */
  window.SPS.speak=function(t,on){ if(on===false||!('speechSynthesis' in window)) return; try{ speechSynthesis.cancel(); var u=new SpeechSynthesisUtterance(t); u.rate=1.02; u.pitch=.95; var v=speechSynthesis.getVoices().filter(function(x){return /en-US/i.test(x.lang)&&/male|daniel|alex|aaron|fred|google us/i.test(x.name);})[0]; if(v) u.voice=v; speechSynthesis.speak(u); }catch(e){} };
  window.SPS.buzz=function(p){ try{ if(navigator.vibrate && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) navigator.vibrate(p||18); }catch(e){} };
  window.SPS.wake=async function(on){ try{ if(on&&'wakeLock' in navigator){ SPS._wl=await navigator.wakeLock.request('screen'); } else if(SPS._wl){ SPS._wl.release(); SPS._wl=null; } }catch(e){} };
  window.SPS.esc=function(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); };
  /* the opening: plays every time the home page opens, under two seconds, skippable */
  var op=$('#open'); if(op){ if(SPS.reduce||window.__WM_SHOT){ op.remove(); } else { var end=function(){ if(!op.isConnected) return; op.classList.add('done'); setTimeout(function(){ op.remove(); document.dispatchEvent(new Event('sps:opened')); },420); }; setTimeout(end, +(op.dataset.ms||1900)); var sk=$('.op-skip',op); if(sk) sk.addEventListener('click',end); } }
})();
