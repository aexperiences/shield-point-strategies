import json, re, html, os, shutil, hashlib
from collections import defaultdict, Counter
SITE='/home/claude/shield-point-strategies'
SRC='/home/claude/aehub/machines/vertical-scraper/runs/shieldpoint-ewa-nid-nov02.json'
OUT=SITE+'/directory'
lines=open(SITE+'/readiness/index.html').read().split('\n')
HEAD='\n'.join(lines[:45]); FOOT='\n'.join(lines[62:])
E=html.escape
def slug(s): return re.sub(r'[^a-z0-9]+','-',s.lower()).strip('-')
SECT={'Churches & places of worship':('churches','Churches & places of worship'),'Schools & districts':('schools','Schools & districts'),
 'Clinics & care facilities':('clinics','Clinics & care facilities'),'Non-profits':('non-profits','Non-profits'),
 'Businesses & offices':('businesses','Businesses & offices'),'Cities, districts & agencies':('agencies','Cities, districts & agencies'),
 'Events & venues':('venues','Events & venues')}
STN={'WA':'Washington','ID':'Idaho'}
def fixcity(c):
    c=(c or '').strip(); c=' '.join(w[:1].upper()+w[1:] for w in c.split()); c=re.sub(r'\bCoeur D Alene\b',"Coeur d'Alene",c,flags=re.I); return c
def phone(p): return p or ''
def web(w):
    if not w: return ''
    w=w.strip()
    if not w.startswith('http'): w='http://'+w
    return w
raw=json.load(open(SRC)); seen=set(); rows=[]
for r in raw:
    name=(r.get('account') or '').strip()
    if not name: continue
    k=(name.lower(),(r.get('address') or '').lower())
    if k in seen: continue
    seen.add(k)
    city=fixcity(r.get('city')); st=r.get('state')
    sec=SECT.get(r.get('sector'),('businesses','Businesses & offices'))
    rows.append({'id':hashlib.md5((name+'|'+(r.get('address') or '')).encode()).hexdigest()[:8],'n':name,'s':sec[0],'a':r.get('address') or '','c':city,'t':st,'z':r.get('zip') or '','p':phone(r.get('phone')),'w':web(r.get('website'))})
rows.sort(key=lambda x:(x['t'],x['c'],x['n'].lower()))
if os.path.exists(OUT): shutil.rmtree(OUT)
os.makedirs(OUT)
json.dump({'built':'2026-11-03','sectors':{v[0]:v[1] for v in SECT.values()},'rows':rows},open(OUT+'/data.json','w'),separators=(',',':'))
def page(depth,title,desc,canon,body):
    pre='../'*depth
    h=HEAD.replace('../',pre)
    h=re.sub(r'<title>.*?</title>','<title>'+E(title)+'</title>',h)
    h=re.sub(r'(<meta name="description" content=")[^"]*','\\g<1>'+E(desc),h)
    h=re.sub(r'(<link rel="canonical" href=")[^"]*','\\g<1>'+canon,h)
    h=re.sub(r'(<meta property="og:title" content=")[^"]*','\\g<1>'+E(title),h)
    h=re.sub(r'(<meta property="og:description" content=")[^"]*','\\g<1>'+E(desc),h)
    h=re.sub(r'<script type="application/json" id="page-data">.*?</script>','<script type="application/json" id="page-data">'+json.dumps({"email":"info@shieldpoint.training","root":pre,"rootPath":"","sms":"15099983732","tz":"America/Los_Angeles"})+'</script>',h,flags=re.S)
    h=h.replace('<body data-page="readiness">','<body data-page="directory">')
    h=h.replace('</head>','<link rel="stylesheet" href="'+pre+'directory/dir.css">\n</head>')
    full=h+'\n<main id="main">\n'+body+'\n</main>\n'+FOOT.replace('../',pre)
    return re.sub(r'<script type="application/json" id="page-data">.*?</script>','<script type="application/json" id="page-data">'+json.dumps({"email":"info@shieldpoint.training","root":pre,"rootPath":"","sms":"15099983732","tz":"America/Los_Angeles"})+'</script>',full,flags=re.S)
BADGE='<span class="sp-badge" title="Completed Shield Point training">Safety Trained</span>'
def card(r,pre):
    bits=[]
    if r['a'] or r['c']: bits.append('<span>'+E(', '.join(x for x in [r['a'],r['c']+' '+r['t']] if x.strip()))+'</span>')
    links=[]
    if r['p']: links.append('<a href="tel:'+re.sub(r'[^0-9+]','',r['p'])+'">'+E(r['p'])+'</a>')
    if r['w']: links.append('<a href="'+E(r['w'])+'" rel="nofollow noopener" target="_blank">Website</a>')
    return ('<li class="d-row" id="o-'+r['id']+'"><div class="d-n">'+E(r['n'])+'</div><div class="d-m">'+''.join(bits)+'</div><div class="d-l">'+' · '.join(links)+
            ' <a class="d-claim" href="'+pre+'contact/?topic=directory&amp;org='+E(r['n'])+'">Is this you?</a></div></li>')
CTA=lambda pre:('<aside class="d-cta"><div class="d-cta-t">Get your organization <b>Safety Trained</b></div><p>Organizations that complete Shield Point training get the Safety Trained badge on their listing and a featured spot at the top of their town\'s page. No organization has earned it yet; the first ones will lead every page they appear on.</p>'
 '<a class="btn red" href="'+pre+'contact/?topic=badge">Ask about the badge</a> <a class="btn" href="tel:+15099983732">Call (509) 998-3732</a></aside>')
# city pages
bycity=defaultdict(list)
for r in rows: bycity[(r['t'],r['c'])].append(r)
cities=sorted(bycity, key=lambda k:-len(bycity[k]))
secn={v[0]:v[1] for v in SECT.values()}
cityidx=[]
for (st,c) in cities:
    if not c: continue
    cs=slug(c+'-'+st); lst=bycity[(st,c)]; pre='../../'
    g=defaultdict(list)
    for r in lst: g[r['s']].append(r)
    body=('<section class="d-hero"><div class="wrap"><a class="d-back" href="../">&larr; All towns</a><div class="eyebrow">Safe Places directory</div><h1>'+E(c)+', '+STN[st]+'</h1>'
      '<p class="lede">'+str(len(lst))+' schools, churches, clinics, non-profits and other organizations in '+E(c)+' that keep people safe every day.</p></div></section>'
      '<section class="d-body"><div class="wrap">'+CTA(pre)+
      ''.join('<h2 class="d-h">'+E(secn[s])+' <small>'+str(len(g[s]))+'</small></h2><ul class="d-list">'+''.join(card(r,pre) for r in g[s])+'</ul>' for s in sorted(g,key=lambda s:-len(g[s])))+
      '<p class="d-src">Listings are gathered from public business listings and may be out of date. <a href="'+pre+'contact/?topic=directory">Add, correct or remove a listing</a>.</p></div></section>')
    os.makedirs(OUT+'/'+cs,exist_ok=True)
    open(OUT+'/'+cs+'/index.html','w').write(page(2,f'{c}, {st} — Safe Places directory · Shield Point',f'{len(lst)} schools, churches, clinics and organizations in {c}, {STN[st]}.', f'https://shieldpoint.training/directory/{cs}/',body))
    cityidx.append((st,c,cs,len(lst)))
# index
pre='../'
tl=''.join('<a class="d-town" href="'+cs+'/"><span>'+E(c)+'</span><small>'+str(n)+'</small></a>' for st in ['WA','ID'] for (s2,c,cs,n) in sorted([x for x in cityidx if x[0]==st],key=lambda x:x[1]) if s2==st)
towns={st:''.join('<a class="d-town" href="'+cs+'/"><span>'+E(c)+'</span><small>'+str(n)+'</small></a>' for (s2,c,cs,n) in sorted([x for x in cityidx if x[0]==st],key=lambda x:x[1])) for st in ['WA','ID']}
sc=Counter(r['s'] for r in rows)
body=('<section class="d-hero"><div class="wrap"><div class="eyebrow">Eastern Washington &amp; North Idaho</div><h1>Safe Places directory</h1>'
 '<p class="lede">'+f'{len(rows):,}'+' schools, churches, clinics, non-profits, agencies and businesses across '+str(len(cityidx))+' towns. Find one, or find out who near you is Safety Trained.</p>'
 '<div class="d-search"><input id="dq" type="search" placeholder="Search a name or town" aria-label="Search the directory" autocomplete="off">'
 '<select id="ds" aria-label="Kind"><option value="">Every kind</option>'+''.join('<option value="'+k+'">'+E(v)+' ('+f'{sc[k]:,}'+')</option>' for k,v in sorted(secn.items(),key=lambda kv:-sc[kv[0]]))+'</select>'
 '<select id="dt" aria-label="State"><option value="">Both states</option><option value="WA">Washington</option><option value="ID">Idaho</option></select></div>'
 '<div id="dr" class="d-results" aria-live="polite"></div></div></section>'
 '<section class="d-body"><div class="wrap">'+CTA(pre)+
 '<h2 class="d-h">Washington towns</h2><div class="d-towns">'+towns['WA']+'</div><h2 class="d-h">Idaho towns</h2><div class="d-towns">'+towns['ID']+'</div>'
 '<p class="d-src">Listings are gathered from public business listings and may be out of date. <a href="../contact/?topic=directory">Add, correct or remove a listing</a>.</p></div></section>'
 '<script src="dir.js" defer></script>')
open(OUT+'/index.html','w').write(page(1,'Safe Places directory — Eastern Washington & North Idaho · Shield Point','Every school, church, clinic, non-profit and agency in Eastern Washington and North Idaho, and which ones are Safety Trained.','https://shieldpoint.training/directory/',body))
print(len(rows), len(cityidx), sc)
