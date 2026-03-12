# Bioregione — Claude Code Kickoff Prompt

Copy and paste the following into Claude Code after connecting it to this repository.

---

## Prompt

I'm building **Bioregione** — an open-source bioregional mapping and participatory democracy platform. The concept: a beautiful, layered interactive map that organizes places by ecological boundaries (watersheds, ecoregions, protected areas) rather than political ones, with a future layer for community participation and decision-making scoped to bioregions.

The first pilot is the **Alto Tevere** bioregion — the upper Tiber watershed around Perugia and Cenerente in Umbria, Italy.

### Stack
- **Next.js** (App Router, TypeScript)
- **Tailwind CSS**
- **MapLibre GL JS** for the interactive map
- **Neon Postgres + PostGIS** for geographic data
- **Vercel** for hosting
- **next-intl** for i18n (Italian + English as co-primary languages)

### What already exists in this repo
- `README.md` — full project description
- `DECISIONS.md` — design decisions and open questions
- `.env.example` — environment variable template
- `scripts/migrate.sql` — complete PostGIS schema (regions, region_names, region_attributes, species tables)
- `scripts/download-data.sh` — instructions/script for downloading WWF TEOW, HydroSHEDS, WDPA
- `data/seed/alto-tevere.geojson` — 7 seed features for the pilot (watershed, ecoregions, protected areas) with multilingual names

### Please build the following, in order:

**1. Next.js project scaffold**
- `npm create next-app` with App Router, TypeScript, Tailwind
- Install: `maplibre-gl`, `@neon-tech/serverless`, `next-intl`, `@types/geojson`
- Set up `[locale]` routing for `it` and `en` with `next-intl`
- Default locale: `it`

**2. Database client**
- `lib/db.ts` — Neon serverless client using `DATABASE_URL` from env
- `lib/regions.ts` — typed query helpers:
  - `getRegionsByBbox(west, south, east, north, layers?)` → GeoJSON FeatureCollection
  - `getRegionBySlug(slug, locale)` → Region with names
  - `getRegionsContainingPoint(lng, lat)` → Region[] ordered smallest first

**3. API routes**
- `app/api/regions/geojson/route.ts` — GET with `?bbox=w,s,e,n&layers=watershed,ecoregion,protected_area&locale=it`
  Returns GeoJSON FeatureCollection with all active regions in bbox
- `app/api/regions/[slug]/route.ts` — GET single region with full names and attributes

**4. Data import script**
- `scripts/import-data.ts` — reads `data/seed/alto-tevere.geojson` and inserts into PostGIS
  - Uses `ST_GeomFromGeoJSON` for geometry
  - Inserts region_names from the `names` array in each feature
  - Inserts region_attributes from the `attributes` array if present
  - Run with: `npx tsx scripts/import-data.ts`

**5. Map page**
- `app/[locale]/map/page.tsx` — server component wrapper
- `components/map/BioregionMap.tsx` — client component using MapLibre GL JS
  - Base tile: `https://{a-d}.basemaps.cartocdn.com/dark_matter_no_labels/{z}/{x}/{y}.png`
  - Label overlay: `https://{a-d}.basemaps.cartocdn.com/dark_matter_only_labels/{z}/{x}/{y}.png`
  - Loads regions from `/api/regions/geojson?bbox=...&locale={locale}` on map move
  - Layer toggle panel (watershed / ecoregion / protected_area)
  - Click a polygon → shows region info in a sidebar panel
  - South-up toggle button (rotates map container 180deg, rotates compass to match)
  - Attribution panel showing all data sources

**6. Home page — Bioregional Portrait**
- `app/[locale]/page.tsx`
- A beautiful landing page introducing the Alto Tevere bioregion
- Sections: The Place, The Community of Life, The Present Emergency (Trasimeno crisis), Entry Points for Action
- Links to the map page
- Reference the existing `tevere-portrait.html` prototype in this repo for content and aesthetic direction

### Design system
The aesthetic is **illuminated manuscript meets ecological data visualization**:
- Colors: parchment `#f2ead8`, ink `#2a1f0e`, terracotta `#b5562a`, olive `#6b7c3a`, water `#3d7a8a`, gold `#c8962a`
- Fonts: Cinzel (headings/labels), Cormorant Garamond (body), IM Fell English (pullquotes/italic)
- Load fonts from Google Fonts
- Dark map with warm overlay tones — NOT a generic dashboard
- Mobile-first, responsive

### Important constraints
- All data displayed must show attribution (source name + license)
- Bioregional polygons that are approximate should be visually flagged as such
- The Trasimeno crisis should be prominently surfaced — it is the live, urgent hook
- Italian text should never be an afterthought — it is co-equal with English

### What to do first
Start by scaffolding the Next.js project, then set up the database client and API routes, then the import script, then the map component. Show me the structure before writing all the code so I can confirm the approach.
