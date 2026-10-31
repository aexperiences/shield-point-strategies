#!/usr/bin/env python3
"""Shield Point Strategies — the three concept sites (The Walkthrough, The First Ninety, The Tabletop).
Facts come from ../config.json (the one truth); feature content from concepts.json.
   python3 source/concepts/build_concepts.py --out . --base https://shield-point-strategies.vercel.app/"""
import json, os, sys, shutil, hashlib, datetime
from jinja2 import Environment, FileSystemLoader, select_autoescape
HERE = os.path.dirname(os.path.abspath(__file__)); SRC = os.path.dirname(HERE)
OUT = os.path.abspath(sys.argv[sys.argv.index('--out') + 1]) if '--out' in sys.argv else os.path.join(SRC, 'out')
base = (sys.argv[sys.argv.index('--base') + 1].rstrip('/') + '/') if '--base' in sys.argv else '/'
C = json.load(open(os.path.join(SRC, 'config.json'))); X = json.load(open(os.path.join(HERE, 'concepts.json')))
env = Environment(loader=FileSystemLoader(os.path.join(HERE, 'templates')), autoescape=select_autoescape(['html']))
b = C['business']; year = datetime.date.today().year
ICON = {
 'pin': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s7-7 7-12a7 7 0 0 0-14 0c0 5 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></svg>',
 'clock': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 2h6"/></svg>',
 'cards': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="6" width="12" height="16" rx="2"/><path d="M8 3h11a2 2 0 0 1 2 2v13"/></svg>',
}
CONCEPTS = [
 {'slug': 'walkthrough', 'name': 'The Walkthrough', 'theme': '#040506', 'home': 'walkthrough_home.html', 'extra': [],
  'blurb': 'Spin a 3D building with your finger and see every weak spot a police chief of twenty years looks for — then book the real walk.',
  'fonts': 'https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@400;500;600&display=swap',
  'core_href': 'contact/', 'core_label': 'Book it', 'core_cta': 'Book the walkthrough', 'core_icon': ICON['pin'], 'js': ['walkthrough.js']},
 {'slug': 'first-ninety', 'name': 'The First Ninety', 'theme': '#000000', 'home': 'ninety_home.html', 'extra': [('drill/', 'ninety_drill.html')],
  'blurb': 'A live ninety-second drill on your phone: it speaks the call, buzzes every step, and hands you your role card.',
  'fonts': 'https://fonts.googleapis.com/css2?family=Anton&family=Inter+Tight:wght@400;500;600&family=JetBrains+Mono:wght@500;600&display=swap',
  'core_href': 'drill/', 'core_label': 'Drill', 'core_cta': 'Run the drill', 'core_icon': ICON['clock'], 'js': ['ninety.js']},
 {'slug': 'tabletop', 'name': 'The Tabletop', 'theme': '#0a0a0b', 'home': 'tabletop_home.html', 'extra': [('table/', 'tabletop_table.html')],
  'blurb': 'Run a tabletop exercise in your browser: deal the cards, talk it out, keep the after-action report.',
  'fonts': 'https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Newsreader:opsz,wght@6..72,400;6..72,500&family=Space+Mono:wght@400;700&family=Inter:wght@400;500;600&display=swap',
  'core_href': 'table/', 'core_label': 'Deal', 'core_cta': 'Deal a scenario', 'core_icon': ICON['cards'], 'js': ['tabletop.js']},
]
os.makedirs(os.path.join(OUT, 'assets'), exist_ok=True)
for f in ('kit.css', 'kit.js'): shutil.copy(os.path.join(HERE, 'assets', f), os.path.join(OUT, 'assets', f))
for cx in CONCEPTS:
    cdir = os.path.join(OUT, cx['slug']); os.makedirs(cdir, exist_ok=True)
    shutil.copy(os.path.join(HERE, cx['slug'], cx['slug'] + '.css'), os.path.join(cdir, cx['slug'] + '.css'))
    for j in cx['js']: shutil.copy(os.path.join(HERE, cx['slug'], j), os.path.join(cdir, j))
    pages = [('', cx['home']), ('services/', 'services.html'), ('about/', 'about.html'), ('contact/', 'contact.html')] + cx['extra']
    for sub, tpl in pages:
        depth = (cx['slug'] + '/' + sub).count('/'); root = '../' * depth; croot = '../' * sub.count('/')
        ctx = dict(b=b, pr=C['principal_record'], layers=C['layers'], si=C['services_intro'], services=C['services'], sectors=C['sectors'],
                   p=C['process'], faqs=C['faqs'], c=C['contact'], cx=cx, root=root, croot=croot or './', base=base, path=cx['slug'] + '/' + sub, year=year,
                   page=sub.strip('/') or 'home', wt=X['walkthrough'], ninety=X['ninety'], tt=X['tabletop'],
                   kit={'email': b['email'], 'sms': b['sms_raw'], 'tz': b['tz'], 'root': root, 'phone': b['phone'], 'tagline': b['tagline']})
        html = env.get_template(tpl).render(**ctx)
        assert '{{' not in html and '{%' not in html, 'unrendered template in ' + cx['slug'] + '/' + sub
        d = os.path.join(cdir, sub); os.makedirs(d, exist_ok=True); open(os.path.join(d, 'index.html'), 'w').write(html)
    json.dump({'name': b['name'] + ' — ' + cx['name'], 'short_name': 'Shield Point', 'description': cx['blurb'], 'start_url': '/' + cx['slug'] + '/', 'scope': '/' + cx['slug'] + '/',
               'display': 'standalone', 'background_color': cx['theme'], 'theme_color': cx['theme'],
               'icons': [{'src': '/assets/icon-192.png', 'sizes': '192x192', 'type': 'image/png'}, {'src': '/assets/icon-512.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'any maskable'}]},
              open(os.path.join(cdir, 'manifest.webmanifest'), 'w'), indent=1)
    files = ['/' + cx['slug'] + '/' + s for s, _ in pages] + ['/' + cx['slug'] + '/' + cx['slug'] + '.css'] + ['/' + cx['slug'] + '/' + j for j in cx['js']] + \
            ['/assets/kit.css', '/assets/kit.js', '/assets/logo-shield.png', '/assets/logo-lockup.png', '/assets/icon-192.png', '/assets/ae-mark.png']
    h = hashlib.sha1(''.join(open(os.path.join(OUT, f.lstrip('/'), 'index.html') if f.endswith('/') else os.path.join(OUT, f.lstrip('/')), errors='ignore').read() for f in files).encode()).hexdigest()[:8]
    open(os.path.join(cdir, 'sw.js'), 'w').write(("// Shield Point — %s: opens offline. Network first, cache as the fallback.\nconst C='sps-%s-%s',FILES=%s;\n" % (cx['name'], cx['slug'], h, json.dumps(files))) +
      "self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(FILES)).catch(()=>{}));self.skipWaiting();});\n"
      "self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x.startsWith('sps-" + cx['slug'] + "')&&x!==C).map(x=>caches.delete(x)))));self.clients.claim();});\n"
      "self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;const u=new URL(e.request.url);if(u.origin!==location.origin)return;e.respondWith(fetch(e.request).then(r=>{if(r.ok){const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp));}return r;}).catch(()=>caches.match(e.request).then(m=>m||caches.match('/" + cx['slug'] + "/'))));});\n")
    print('built', cx['slug'], len(pages), 'pages, cache', h)

# the concept pages join the sitemap the main build wrote
sm = os.path.join(OUT, 'sitemap.xml')
if os.path.exists(sm):
    x = open(sm).read(); extra = ''
    for cx in CONCEPTS:
        for sub in [''] + ['services/', 'about/', 'contact/'] + [e[0] for e in cx['extra']]:
            u = base + cx['slug'] + '/' + sub
            if u not in x: extra += '<url><loc>%s</loc></url>\n' % u
    open(sm, 'w').write(x.replace('</urlset>', extra + '</urlset>'))
