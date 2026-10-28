#!/usr/bin/env python3
"""Shield Point Strategies — builds the static site from config.json + templates into out/.
   python3 build.py [--base https://domain/]   (base sets canonical/sitemap/og URLs)"""
import json, os, sys, shutil, hashlib, datetime, re
from jinja2 import Environment, FileSystemLoader, select_autoescape
HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, 'out')
if '--out' in sys.argv: OUT = os.path.abspath(sys.argv[sys.argv.index('--out') + 1])
ASSETS = os.path.join(HERE, 'assets') if os.path.isdir(os.path.join(HERE, 'assets', 'icons')) else None
base = '/'
if '--base' in sys.argv: base = sys.argv[sys.argv.index('--base') + 1].rstrip('/') + '/'
C = json.load(open(os.path.join(HERE, 'config.json')))
env = Environment(loader=FileSystemLoader(os.path.join(HERE, 'templates')), autoescape=select_autoescape(['html']))
NAV = [{'href': '', 'label': 'Home'}, {'href': 'services/', 'label': 'Services'}, {'href': 'approach/', 'label': 'The Layers'},
       {'href': 'readiness/', 'label': 'Readiness check'}, {'href': 'about/', 'label': 'About'}, {'href': 'contact/', 'label': 'Contact'}]
layer_names = {L['id']: L['name'] for L in C['layers']}
pages = [('', 'home.html', {}), ('services/', 'services.html', {}), ('approach/', 'approach.html', {}), ('readiness/', 'readiness.html', {}),
         ('about/', 'about.html', {}), ('contact/', 'contact.html', {})] + [('services/%s/' % s['slug'], 'service.html', {'s': s}) for s in C['services']]
os.makedirs(os.path.join(OUT, 'assets'), exist_ok=True)
for f in ('site.css', 'site.js'): shutil.copy(os.path.join(HERE, 'assets', f), os.path.join(OUT, 'assets', f))  # the pictures already live in out/assets
year = datetime.date.today().year; b = C['business']
def render(path, tpl, extra, page_name=None):
    depth = path.count('/'); root = '../' * depth
    ctx = dict(b=b, pr=C['principal_record'], h=C['hero'], layers=C['layers'], si=C['services_intro'], services=C['services'], sectors=C['sectors'],
               p=C['process'], r=C['readiness'], faqs=C['faqs'], c=C['contact'], nav=NAV, root=root, base=base, path=path, year=year,
               layer_names=layer_names, page=page_name or (path.strip('/').split('/')[0] or 'home'), noindex=False,
               page_data={'layers': C['layers'], 'readiness': C['readiness'], 'layerNames': layer_names, 'sms': b['sms_raw'], 'email': b['email'],
                          'tz': b['tz'], 'root': root, 'rootPath': ''})
    ctx.update(extra); html = env.get_template(tpl).render(**ctx)
    assert '{{' not in html and '{%' not in html, 'unrendered template in ' + path
    d = os.path.join(OUT, path); os.makedirs(d, exist_ok=True); open(os.path.join(d, 'index.html'), 'w').write(html)
for path, tpl, extra in pages: render(path, tpl, extra)
html404 = env.get_template('404.html').render(b=b, nav=NAV, root='/', base=base, path='404', year=year, page='404', noindex=True, page_data={'root': '/', 'rootPath': ''})
open(os.path.join(OUT, '404.html'), 'w').write(html404)
json.dump({'name': b['name'], 'short_name': b['short'], 'description': b['kind'] + '. ' + b['tagline'], 'start_url': '/', 'scope': '/', 'display': 'standalone',
           'background_color': '#050505', 'theme_color': '#050505', 'icons': [{'src': '/assets/icon-192.png', 'sizes': '192x192', 'type': 'image/png'},
           {'src': '/assets/icon-512.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'any maskable'}]}, open(os.path.join(OUT, 'manifest.webmanifest'), 'w'), indent=1)
files = ['/' + p for p, _, _ in pages] + ['/manifest.webmanifest', '/assets/site.css', '/assets/site.js', '/assets/icon-192.png', '/assets/icon-512.png', '/assets/logo-shield.png', '/assets/logo-lockup.png', '/assets/ae-mark.png']
h = hashlib.sha1(b''.join(open(os.path.join(OUT, f.lstrip('/'), 'index.html') if f.endswith('/') else os.path.join(OUT, f.lstrip('/')), 'rb').read() for f in files)).hexdigest()[:8]
open(os.path.join(OUT, 'sw.js'), 'w').write("""// Shield Point Strategies — keeps the site on the device so it opens offline. Network first, cache as the fallback.
const C='sps-%s',FILES=%s;
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(FILES)).catch(()=>{}));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))));self.clients.claim();});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;const u=new URL(e.request.url);if(u.origin!==location.origin)return;e.respondWith(fetch(e.request).then(r=>{if(r.ok){const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp));}return r;}).catch(()=>caches.match(e.request).then(m=>m||caches.match('/'))));});
""" % (h, json.dumps(files)))
open(os.path.join(OUT, 'robots.txt'), 'w').write('User-agent: *\nAllow: /\nSitemap: %ssitemap.xml\n' % base)
open(os.path.join(OUT, 'sitemap.xml'), 'w').write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + ''.join('<url><loc>%s%s</loc></url>\n' % (base, p) for p, _, _ in pages) + '</urlset>\n')
open(os.path.join(OUT, 'vercel.json'), 'w').write(json.dumps({'cleanUrls': True, 'trailingSlash': True, 'headers': [{'source': '/sw.js', 'headers': [{'key': 'Cache-Control', 'value': 'no-cache'}]}, {'source': '/(.*)', 'headers': [{'key': 'X-Content-Type-Options', 'value': 'nosniff'}]}]}, indent=1))
print('built', len(pages), 'pages →', OUT, 'cache', h)
