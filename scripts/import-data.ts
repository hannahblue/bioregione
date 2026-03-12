/**
 * Import seed data (and optionally processed GeoJSON) into PostGIS.
 *
 * Usage:
 *   npx tsx scripts/import-data.ts                  # imports seed data only
 *   npx tsx scripts/import-data.ts --processed       # also imports data/processed/*.geojson
 *
 * Requires DATABASE_URL in environment (or .env.local).
 */

import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { neon } from '@neondatabase/serverless'

// Load .env.local if present
try {
  const env = readFileSync(join(process.cwd(), '.env.local'), 'utf-8')
  for (const line of env.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '')
    if (!process.env[key]) process.env[key] = val
  }
} catch {
  // .env.local not present — rely on environment
}

if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL is not set.')
  console.error('Copy .env.example to .env.local and add your Neon connection string.')
  process.exit(1)
}

const sql = neon(process.env.DATABASE_URL)

interface NameEntry {
  locale: string
  type: string
  name: string
  notes?: string
}

interface AttributeEntry {
  key: string
  value: string
  unit?: string
  source?: string
  notes?: string
}

interface FeatureProperties {
  slug: string
  layer: string
  source_name?: string
  source_url?: string
  source_license?: string
  area_km2?: number
  is_approximate?: boolean
  crisis_data?: Record<string, unknown>
  names?: NameEntry[]
  attributes?: AttributeEntry[]
}

interface GeoJSONFeature {
  type: 'Feature'
  properties: FeatureProperties
  geometry: unknown
}

interface GeoJSONCollection {
  type: 'FeatureCollection'
  features: GeoJSONFeature[]
}

async function importFeature(feature: GeoJSONFeature): Promise<void> {
  const p = feature.properties
  const geomJson = JSON.stringify(feature.geometry)

  console.log(`  Importing: ${p.slug} (${p.layer})`)

  // Upsert region
  const [region] = await sql`
    INSERT INTO regions (
      slug,
      layer,
      geometry,
      area_km2,
      is_approximate,
      crisis_data,
      source_name,
      source_url,
      source_license,
      valid_from
    )
    VALUES (
      ${p.slug},
      ${p.layer},
      ST_SetSRID(ST_GeomFromGeoJSON(${geomJson}), 4326),
      ${p.area_km2 ?? null},
      ${p.is_approximate ?? false},
      ${p.crisis_data ? JSON.stringify(p.crisis_data) : null},
      ${p.source_name ?? null},
      ${p.source_url ?? null},
      ${p.source_license ?? null},
      NOW()
    )
    ON CONFLICT (slug)
    DO UPDATE SET
      layer        = EXCLUDED.layer,
      geometry     = EXCLUDED.geometry,
      area_km2     = EXCLUDED.area_km2,
      is_approximate = EXCLUDED.is_approximate,
      crisis_data  = EXCLUDED.crisis_data,
      source_name  = EXCLUDED.source_name,
      source_url   = EXCLUDED.source_url,
      source_license = EXCLUDED.source_license,
      updated_at   = NOW()
    RETURNING id
  `

  const regionId = region.id

  // Upsert names
  if (p.names && p.names.length > 0) {
    for (const nameEntry of p.names) {
      await sql`
        INSERT INTO region_names (region_id, language_code, name, name_type, is_primary, notes)
        VALUES (
          ${regionId},
          ${nameEntry.locale},
          ${nameEntry.name},
          ${nameEntry.type},
          ${nameEntry.type === 'primary'},
          ${nameEntry.notes ?? null}
        )
        ON CONFLICT (region_id, language_code, name_type)
        DO UPDATE SET
          name       = EXCLUDED.name,
          is_primary = EXCLUDED.is_primary,
          notes      = EXCLUDED.notes,
          updated_at = NOW()
      `
    }
  }

  // Upsert attributes
  if (p.attributes && p.attributes.length > 0) {
    for (const attr of p.attributes) {
      await sql`
        INSERT INTO region_attributes (region_id, key, value, unit, source, notes)
        VALUES (
          ${regionId},
          ${attr.key},
          ${attr.value},
          ${attr.unit ?? null},
          ${attr.source ?? null},
          ${attr.notes ?? null}
        )
        ON CONFLICT (region_id, key)
        DO UPDATE SET
          value      = EXCLUDED.value,
          unit       = EXCLUDED.unit,
          source     = EXCLUDED.source,
          notes      = EXCLUDED.notes,
          updated_at = NOW()
      `
    }
  }
}

async function importFile(filePath: string): Promise<void> {
  console.log(`\nReading: ${filePath}`)
  const raw = readFileSync(filePath, 'utf-8')
  const collection: GeoJSONCollection = JSON.parse(raw)

  if (collection.type !== 'FeatureCollection') {
    console.warn(`  Skipping — not a FeatureCollection`)
    return
  }

  console.log(`  Found ${collection.features.length} features`)
  for (const feature of collection.features) {
    await importFeature(feature)
  }
}

async function main() {
  const includeProcessed = process.argv.includes('--processed')

  console.log('Bioregione — data import')
  console.log('========================')

  // Always import seed data
  const seedPath = join(process.cwd(), 'data', 'seed', 'alto-tevere.geojson')
  await importFile(seedPath)

  // Optionally import processed files
  if (includeProcessed) {
    const processedDir = join(process.cwd(), 'data', 'processed')
    let files: string[] = []
    try {
      files = readdirSync(processedDir).filter((f) => f.endsWith('.geojson'))
    } catch {
      console.log('\nNo data/processed/ directory found — skipping.')
    }
    for (const file of files) {
      await importFile(join(processedDir, file))
    }
  }

  console.log('\nImport complete.')
}

main().catch((err) => {
  console.error('\nImport failed:', err)
  process.exit(1)
})
