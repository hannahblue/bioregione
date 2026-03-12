# Notes

Running list of things to remember, track, or follow up on.

---

## Project Setup Decisions (confirmed 2026-03-12)

- **License**: GNU GPL v3 (LICENSE file is already correct; README/DECISIONS.md references to MIT are wrong — needs fixing)
- **Data**: Build against seed data (`data/seed/alto-tevere.geojson`) only for now; broader datasets (HydroSHEDS, WDPA, WWF TEOW) are future enrichment once registration is sorted
- **Locale default**: Browser-detected (Italian and English co-primary)
- **South-up map toggle**: Include in initial build, not deferred
- **Database**: User will provide `DATABASE_URL` in `.env`; app should degrade gracefully to seed GeoJSON when DB is unavailable (good resilience pattern, confirm with user)

---

## TODOs / Follow-ups

- [ ] Fix license reference inconsistency in README.md and DECISIONS.md (GPL v3, not MIT)
- [ ] User needs to register for HydroSHEDS and WDPA data access — remind them when we get to data enrichment phase
- [ ] Confirm `.env.example` should be committed (no secrets, just shape) — standard practice
- [ ] Confirm whether `data/raw/` gitignore is already in `.gitignore` or needs adding
- [ ] The `import-data.ts` script referenced in package.json doesn't exist yet — needs creating
- [ ] Consider whether Vercel env vars need documenting for deployment

---

## Build Kickoff Checklist

Things the `CLAUDE_CODE_PROMPT.md` calls for, roughly ordered:

1. Next.js scaffold (App Router, TypeScript, Tailwind)
2. Install dependencies (MapLibre GL JS, next-intl, pg/postgres client, etc.)
3. Database client setup (Neon/postgres)
4. API routes: `/api/regions`, `/api/regions/[slug]`, `/api/regions/point`
5. Data import script (`scripts/import-data.ts`)
6. Map component (MapLibre, south-up toggle, layer switching)
7. Home page (map + sidebar, Trasimeno crisis surfaced)
8. i18n setup (next-intl, browser-detected, IT + EN)
9. Design system (parchment/ink/terracotta palette, Cinzel + Cormorant Garamond)
10. Attribution panel (per data layer, always visible)
