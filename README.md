# Bioregione

**An open-source bioregional mapping and participatory democracy platform.**

Bioregione reimagines how we see and relate to the places we live — organizing land, community, and decision-making by ecological boundaries rather than political ones. Watersheds, ecoregions, and living landscapes replace arbitrary administrative lines as the primary way of understanding place.

The first pilot is the **Alto Tevere** bioregion — the upper Tiber watershed around Perugia and Cenerente in Umbria, Italy.

---

## Vision

> "A bioregion is a geographical area defined not by administrative boundaries, but by distinct characteristics such as plant and animal species, ecological systems, soils and landforms, human settlements, and topographic features such as drainage basins."

Bioregione has two complementary layers:

1. **Reference Library** — A rich, educational map showing every lens through which a place can be understood: its watershed, ecoregion, protected areas, indigenous and historical names, species community, and how all of these change over time.

2. **Coordination Shorthand** — A simpler, usable set of bioregional names and boundaries optimized for community coordination, scoped to the question: *"How will this help us work together better and be more respectful of each other and this place?"*

---

## Tech Stack

| Layer | Tool |
|-------|------|
| Frontend | Next.js (App Router) + TypeScript |
| Styling | Tailwind CSS |
| Map | MapLibre GL JS |
| Database | Neon Postgres + PostGIS |
| Hosting | Vercel |
| Data | WWF TEOW · HydroSHEDS · WDPA · OpenStreetMap |

---

## Getting Started

### Prerequisites
- Node.js 20+
- A [Neon](https://neon.tech) Postgres database with PostGIS enabled
- A [Vercel](https://vercel.com) account (for deployment)

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/bioregione.git
cd bioregione
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

### 3. Enable PostGIS on your Neon database

In the Neon SQL editor, run:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
```

### 4. Set up the database schema

```bash
npm run db:migrate
```

### 5. Download and import geographic data

```bash
# Download open datasets (WWF TEOW, HydroSHEDS, WDPA)
npm run data:download

# Import into PostGIS
npm run data:import
```

### 6. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Data Sources & Attribution

All geographic data is open-source. Attribution is required:

| Dataset | Source | License |
|---------|--------|---------|
| Terrestrial Ecoregions of the World (TEOW) | [WWF](https://www.worldwildlife.org/publications/terrestrial-ecoregions-of-the-world) | © WWF — for non-commercial use with attribution |
| HydroSHEDS Watershed Basins | [USGS / WWF HydroSHEDS](https://www.hydrosheds.org) | CC BY 4.0 |
| World Database on Protected Areas (WDPA) | [UNEP-WCMC / IUCN](https://www.protectedplanet.net) | Mixed — see WDPA terms |
| Rivers & Lakes | [OpenStreetMap](https://openstreetmap.org) contributors | ODbL |
| Base Map Tiles | [CARTO](https://carto.com) | CC BY 3.0 |

---

## Project Structure

```
bioregione/
├── app/                    # Next.js App Router
│   ├── [locale]/           # i18n routing (en, it)
│   │   ├── page.tsx        # Home — bioregional portrait
│   │   ├── map/page.tsx    # Interactive map
│   │   └── region/[slug]/  # Individual region pages
│   └── api/
│       └── regions/        # GeoJSON API endpoints
├── components/
│   ├── map/                # MapLibre GL components
│   └── ui/                 # Shared UI components
├── lib/
│   ├── db.ts               # Neon/PostGIS client
│   └── regions.ts          # Region query helpers
├── data/
│   ├── raw/                # Downloaded source files (gitignored)
│   ├── processed/          # Clipped/simplified GeoJSON (committed)
│   └── seed/               # Initial seed data for Alto Tevere
├── scripts/
│   ├── download-data.sh    # Fetch open datasets
│   ├── import-data.ts      # Load into PostGIS
│   └── migrate.sql         # Database schema
└── public/
    └── fonts/              # Cinzel, Cormorant Garamond
```

---

## Contributing

This project is at an early stage. Contributions, corrections to bioregional data, and local knowledge are all welcome. Please open an issue before submitting a PR.

Questions worth discussing before contributing:
- How should contested or overlapping bioregional boundaries be handled?
- Whose naming traditions take precedence at each scale?
- What governance model should guide the "coordination shorthand" layer?

See `DECISIONS.md` for ongoing design decisions.

---

## Pilot: Alto Tevere

The first bioregion implemented is the upper Tiber watershed around Perugia, Umbria, Italy. This region is ecologically significant and currently faces an active crisis: **Lago Trasimeno** is experiencing its worst water level decline in 20 years (−163cm as of late 2025), requiring cross-border coordination between Umbria and Tuscany.

---

## License

Code: [GNU GPL v3](./LICENSE)
Data: See individual dataset licenses above
Design assets: CC BY 4.0
