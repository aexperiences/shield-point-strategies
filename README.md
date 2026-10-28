# SHIELD POINT STRATEGIES — the website (built Oct 28 2026, built on spec)

**Source of truth for every fact on the site: `config.json`.** Change a phone number, a service, a line of Brian's record there, run `python3 build.py --base https://<domain>/`, and every page is rebuilt into `out/`. Never edit `out/` by hand.

Facts that are easy to get wrong (see the CONFIRM notes in config.json):
- Email: spsasmus@gmail.com is the address Brian gives out today; swap when he has a shieldpoint domain address.
- Services and their wording are drafted from the tagline (Preparedness · Planning · Protection) and Brian's public record. Brian confirms them before the site goes on his domain.
- No prices anywhere ("ask us"). No reviews, no client names, no made-up numbers. The only numbers are his record: 30 years, 20 as chief, CVSD since 2020.
- The legal entity line in the footer is left off until Brian says which entity the business operates under.

What is in it: Home (opening moment + the Layers plate) · Services + four service pages · The Layers (scroll walk) · Readiness check (ten questions → reading → text/email to Brian) · About · Contact (form composes an email or text; nothing is stored) · installs as an app, works offline · Night and Steel skins · phone first (390) and laptop (1440), both checked by the website machine's test.

Build (from the repo root): `python3 source/build.py --out . --base https://<domain>/` — writes every page into the repo root, which Vercel serves as-is. The logo pictures and icons live in `assets/`; the editable copy of the logo is `source/assets/logo-source.jpg`.
