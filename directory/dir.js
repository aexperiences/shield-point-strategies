(function(){
var q=document.getElementById('dq'),s=document.getElementById('ds'),t=document.getElementById('dt'),out=document.getElementById('dr');
if(!q)return;var D=null,busy=false,SN={};
function slug(x){return x.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}
function esc(x){return String(x).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function load(){if(D||busy)return Promise.resolve();busy=true;out.innerHTML='<div class="d-more">Loading the directory…</div>';
 return fetch('data.json').then(function(r){return r.json()}).then(function(j){D=j.rows;SN=j.sectors;busy=false})
 .catch(function(){busy=false;out.innerHTML='<div class="d-more">Could not load the directory. Pick a town below instead.</div>'})}
function run(){var w=q.value.trim().toLowerCase(),k=s.value,st=t.value;
 if(!w&&!k&&!st){out.innerHTML='';return}
 load().then(function(){if(!D)return;var words=w.split(/\s+/).filter(Boolean),hits=[];
  for(var i=0;i<D.length;i++){var r=D[i];if(k&&r.s!==k)continue;if(st&&r.t!==st)continue;
   var hay=(r.n+' '+r.c+' '+r.a+' '+r.z).toLowerCase(),ok=true;for(var j=0;j<words.length;j++)if(hay.indexOf(words[j])<0){ok=false;break}
   if(ok)hits.push(r)}
  var h='<ul class="d-list">'+hits.slice(0,60).map(function(r){var u=slug(r.c+'-'+r.t)+'/#o-'+r.id;
   return '<li class="d-row"><a class="d-n" href="'+u+'">'+esc(r.n)+'</a><div class="d-m">'+esc((SN[r.s]||'')+' · '+r.c+', '+r.t)+'</div></li>'}).join('')+'</ul>';
  out.innerHTML=(hits.length?h:'')+'<div class="d-more">'+(hits.length?(hits.length>60?'Showing 60 of '+hits.length.toLocaleString()+'. Type more to narrow it.':hits.length+' found.'):'Nothing found. Try fewer words.')+'</div>'})}
var tm;function soon(){clearTimeout(tm);tm=setTimeout(run,180)}
q.addEventListener('input',soon);s.addEventListener('change',run);t.addEventListener('change',run);q.addEventListener('focus',load,{once:true});
})();
