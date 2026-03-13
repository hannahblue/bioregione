import { neon } from '@neondatabase/serverless'
import type { FeatureCollection, Feature, Geometry } from 'geojson'

function getClient() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set')
  }
  return neon(process.env.DATABASE_URL)
}

export type LayerType =
  | 'watershed'
  | 'ecoregion'
  | 'bioregion'
  | 'protected_area'
  | 'indigenous_territory'
  | 'foodshed'
  | 'custom'

export interface RegionName {
  language_code: string
  name: string
  name_type: string
  is_primary: boolean
}

export interface RegionSummary {
  id: string
  slug: string
  layer: LayerType
  area_km2: number | null
  is_approximate: boolean
  primary_name_it: string | null
  primary_name_en: string | null
  crisis_data: Record<string, unknown> | null
}

export interface RegionDetail extends RegionSummary {
  names: RegionName[]
  attributes: Record<string, string>
}

type BboxRow = {
  id: string
  slug: string
  layer: LayerType
  area_km2: number | null
  is_approximate: boolean
  primary_name_it: string | null
  primary_name_en: string | null
  crisis_data: Record<string, unknown> | null
  geojson: string
}

type SlugRow = {
  id: string
  slug: string
  layer: LayerType
  area_km2: number | null
  is_approximate: boolean
  crisis_data: Record<string, unknown> | null
  name: string
  language_code: string
  name_type: string
  is_primary: boolean
  attr_key: string | null
  attr_value: string | null
}

type PointRow = {
  id: string
  slug: string
  layer: LayerType
  area_km2: number | null
  is_approximate: boolean
  primary_name_it: string | null
  primary_name_en: string | null
  crisis_data: Record<string, unknown> | null
}

export async function getRegionsByBbox(
  west: number,
  south: number,
  east: number,
  north: number,
  layers?: LayerType[]
): Promise<FeatureCollection> {
  const sql = getClient()
  const hasLayers = layers && layers.length > 0

  // Use parameterized function-call form — the tagged template has a 3-param TypeScript limit
  const baseQuery = `
    WITH bbox AS (SELECT ST_MakeEnvelope($1, $2, $3, $4, 4326) AS env)
    SELECT
      r.id, r.slug, r.layer, r.area_km2, r.is_approximate, r.crisis_data,
      MAX(CASE WHEN rn.language_code = 'it' AND rn.is_primary THEN rn.name END) AS primary_name_it,
      MAX(CASE WHEN rn.language_code = 'en' AND rn.is_primary THEN rn.name END) AS primary_name_en,
      ST_AsGeoJSON(ST_Intersection(r.geometry, bbox.env))::text AS geojson
    FROM regions r
    JOIN bbox ON r.geometry && bbox.env
    LEFT JOIN region_names rn ON rn.region_id = r.id
    WHERE (r.valid_to IS NULL OR r.valid_to > NOW())
      ${hasLayers ? 'AND r.layer = ANY($5)' : ''}
    GROUP BY r.id, bbox.env
    ORDER BY r.area_km2 ASC NULLS LAST
  `

  const params: unknown[] = [west, south, east, north]
  if (hasLayers) params.push(layers)

  const rows = (await sql(baseQuery, params)) as BboxRow[]

  const features: Feature[] = rows.map((row) => ({
    type: 'Feature',
    geometry: JSON.parse(row.geojson) as Geometry,
    properties: {
      id: row.id,
      slug: row.slug,
      layer: row.layer,
      area_km2: row.area_km2,
      is_approximate: row.is_approximate,
      crisis_data: row.crisis_data,
      primary_name_it: row.primary_name_it,
      primary_name_en: row.primary_name_en,
    },
  }))

  return { type: 'FeatureCollection', features }
}

export async function getRegionBySlug(
  slug: string,
  locale: string = 'it'
): Promise<RegionDetail | null> {
  const sql = getClient()

  const rows = (await sql(
    `SELECT
      r.id, r.slug, r.layer, r.area_km2, r.is_approximate, r.crisis_data,
      rn.name, rn.language_code, rn.name_type, rn.is_primary,
      ra.key AS attr_key, ra.value AS attr_value
    FROM regions r
    LEFT JOIN region_names rn ON rn.region_id = r.id
    LEFT JOIN region_attributes ra ON ra.region_id = r.id
    WHERE r.slug = $1
      AND (r.valid_to IS NULL OR r.valid_to > NOW())`,
    [slug]
  )) as SlugRow[]

  if (rows.length === 0) return null

  const base = rows[0]
  const names: RegionName[] = rows
    .filter((r) => r.name != null)
    .map((r) => ({
      language_code: r.language_code,
      name: r.name,
      name_type: r.name_type,
      is_primary: r.is_primary,
    }))
    .filter(
      (n, i, arr) =>
        arr.findIndex(
          (x) => x.language_code === n.language_code && x.name === n.name
        ) === i
    )

  const attributes: Record<string, string> = {}
  rows.forEach((r) => {
    if (r.attr_key) attributes[r.attr_key] = r.attr_value ?? ''
  })

  void locale

  return {
    id: base.id,
    slug: base.slug,
    layer: base.layer,
    area_km2: base.area_km2,
    is_approximate: base.is_approximate,
    crisis_data: base.crisis_data,
    primary_name_it:
      names.find((n) => n.language_code === 'it' && n.is_primary)?.name ?? null,
    primary_name_en:
      names.find((n) => n.language_code === 'en' && n.is_primary)?.name ?? null,
    names,
    attributes,
  }
}

export async function getRegionsContainingPoint(
  lng: number,
  lat: number
): Promise<RegionSummary[]> {
  const sql = getClient()

  const rows = (await sql(
    `SELECT
      r.id, r.slug, r.layer, r.area_km2, r.is_approximate, r.crisis_data,
      MAX(CASE WHEN rn.language_code = 'it' AND rn.is_primary THEN rn.name END) AS primary_name_it,
      MAX(CASE WHEN rn.language_code = 'en' AND rn.is_primary THEN rn.name END) AS primary_name_en
    FROM regions r
    LEFT JOIN region_names rn ON rn.region_id = r.id
    WHERE ST_Contains(r.geometry, ST_SetSRID(ST_MakePoint($1, $2), 4326))
      AND (r.valid_to IS NULL OR r.valid_to > NOW())
    GROUP BY r.id
    ORDER BY r.area_km2 ASC NULLS LAST`,
    [lng, lat]
  )) as PointRow[]

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    layer: row.layer,
    area_km2: row.area_km2,
    is_approximate: row.is_approximate,
    crisis_data: row.crisis_data,
    primary_name_it: row.primary_name_it,
    primary_name_en: row.primary_name_en,
  }))
}
