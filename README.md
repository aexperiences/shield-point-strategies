# SHIELD POINT STRATEGIES — the website (built Oct 28 2026, built on spec)

**Source of truth for every fact on the site: `config.json`.** Change a phone number, a service, a line of Brian's record there, run `python3 build.py --base https://<domain>/`, and every page is rebuilt into `out/`. Never edit `out/` by hand.

Facts that are easy to get wrong (see the CONFIRM notes in config.json):
- Email: info@shieldpoint.training is the address Brian gives out today; swap when he has a shieldpoint domain address.
- Services and their wording are drafted from the tagline (Preparedness · Planning · Protection) and Brian's public record. Brian confirms them before the site goes on his domain.
- No prices anywhere ("ask us"). No reviews, no client names, no made-up numbers. The only numbers are his record: 30 years, 20 as chief, CVSD since 2020.
- The legal entity line in the footer is left off until Brian says which entity the business operates under.

What is in it: Home (opening moment + the Layers plate) · Services + four service pages · The Layers (scroll walk) · Readiness check (ten questions → reading → text/email to Brian) · About · Contact (form composes an email or text; nothing is stored) · installs as an app, works offline · Night and Steel skins · phone first (390) and laptop (1440), both checked by the website machine's test.

Build (from the repo root): `python3 source/build.py --out . --base https://<domain>/` — writes every page into the repo root, which Vercel serves as-is. The logo pictures and icons live in `assets/`; the editable copy of the logo is `source/assets/logo-source.jpg`.

## Safe Places directory (Nov 3 2026)
`/directory/` — 8,558 schools, churches, clinics, non-profits, agencies and businesses in Eastern WA and North Idaho (Brian's target list, Vertical Scraper run `shieldpoint-ewa-nid-nov02.json` in aehub). Rebuild: `python3 source/directory/build.py` (reads the aehub run file; copy `directory/dir.css` and `dir.js` back if the folder is wiped).
**After any `source/build.py` run, re-add the directory URLs to `sitemap.xml`** (build.py rewrites it without them). The footer link lives in `source/templates/base.html`.

## Search and answer engines (Nov 4 2026)
- Every page carries one structured-data graph (business + Brian + website), built in `source/build.py` (`LD`), plus Open Graph and Twitter cards.
- `/privacy/` (template `privacy.html`) is in the footer and the sitemap. **After a `source/build.py` run, re-add `/privacy/` and the directory URLs to `sitemap.xml`.**
- `/llms.txt` is the plain guide for AI answer tools. `/4f42cabcab1de2c042d5db0b8194c2ae.txt` is the IndexNow key (Bing and others get new pages pinged).
- Titles stay under 65 characters (SEO Watch rule).

## Growth Engine town pages (Nov 6 2026)
`/safety/<town>/` pages are made by the hub's Shield Point Growth Engine (aehub `machines/growth-engine-shieldpoint/`), staged for Anthony's yes and written here by its `publish.mjs` only after it. **After any `source/build.py` run, re-add the `/safety/` URLs to `sitemap.xml` too.**
