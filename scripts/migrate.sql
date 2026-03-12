-- ─────────────────────────────────────────────────────────────────────────────
-- Bioregione · Database Schema
-- Run this in your Neon SQL editor after enabling PostGIS:
--   CREATE EXTENSION IF NOT EXISTS postgis;
--   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── EXTENSIONS ──────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── LAYER TYPES ─────────────────────────────────────────────────────────────
CREATE TYPE layer_type AS ENUM (
  'watershed',            -- Hydrological basin (HydroSHEDS)
  'ecoregion',            -- WWF TEOW ecoregion
  'bioregion',            -- Aggregated bioregion (One Earth Bioregions 2023)
  'protected_area',       -- Natura 2000, national/regional parks (WDPA)
  'indigenous_territory', -- Native Land Digital
  'foodshed',             -- Agricultural/food production region
  'custom'                -- Community-defined boundary
);

-- ─── REGIONS ─────────────────────────────────────────────────────────────────
CREATE TABLE regions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug          TEXT UNIQUE NOT NULL,

  layer         layer_type NOT NULL,
  geometry      GEOMETRY(GEOMETRY, 4326) NOT NULL,  -- WGS84; accepts Polygon or MultiPolygon

  -- Temporal versioning
  valid_from    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_to      TIMESTAMPTZ,                  -- NULL = currently active

  -- Source attribution (required for all layers)
  source_name   TEXT,                         -- e.g. 'WWF Terrestrial Ecoregions of the World'
  source_url    TEXT,
  source_license TEXT,                        -- e.g. 'CC BY 4.0'
  source_id     TEXT,                         -- Original ID in source dataset

  -- Numeric/derived attributes
  area_km2      NUMERIC,
  is_approximate BOOLEAN NOT NULL DEFAULT FALSE,  -- TRUE = boundary is estimated, not authoritative

  -- Live crisis / monitoring data (JSONB for flexibility)
  crisis_data   JSONB,

  -- Metadata
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Spatial index — essential for performance
CREATE INDEX regions_geometry_idx ON regions USING GIST (geometry);
CREATE INDEX regions_layer_idx    ON regions (layer);
CREATE INDEX regions_slug_idx     ON regions (slug);
CREATE INDEX regions_valid_idx    ON regions (valid_from, valid_to);

-- ─── REGION NAMES ────────────────────────────────────────────────────────────
-- Each region can have many names: different languages, naming traditions,
-- historical periods, indigenous names, scientific names, common names
CREATE TYPE name_type AS ENUM (
  'primary',       -- Main display name for this language
  'scientific',    -- Scientific/taxonomic name
  'indigenous',    -- Name from an indigenous/native tradition
  'historical',    -- No longer current but historically significant
  'local',         -- Informal local usage
  'administrative',-- Current administrative/political name for the same area
  'alternative'    -- Other valid names
);

CREATE TABLE region_names (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  region_id       UUID NOT NULL REFERENCES regions(id) ON DELETE CASCADE,

  name            TEXT NOT NULL,
  language_code   TEXT NOT NULL DEFAULT 'en',  -- BCP 47: 'en', 'it', 'la', etc.
  name_type       name_type NOT NULL DEFAULT 'primary',
  is_primary      BOOLEAN NOT NULL DEFAULT FALSE,

  -- Context and provenance
  notes           TEXT,             -- Usage guidelines, context, history
  source          TEXT,
  is_public       BOOLEAN NOT NULL DEFAULT TRUE,  -- FALSE = sacred/restricted, don't display

  -- Temporal
  valid_from      TIMESTAMPTZ,
  valid_to        TIMESTAMPTZ,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One name per language per name_type per region
  UNIQUE (region_id, language_code, name_type)
);

CREATE INDEX region_names_region_idx   ON region_names (region_id);
CREATE INDEX region_names_language_idx ON region_names (language_code);
CREATE INDEX region_names_type_idx     ON region_names (name_type);

-- ─── REGION ATTRIBUTES ───────────────────────────────────────────────────────
-- Flexible key-value store for additional ecological data per region
CREATE TABLE region_attributes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  region_id   UUID NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
  key         TEXT NOT NULL,
  value       TEXT NOT NULL,
  unit        TEXT,          -- e.g. 'cm', 'km²', 'count'
  recorded_at TIMESTAMPTZ,   -- When this measurement was taken
  source      TEXT,
  notes       TEXT,

  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (region_id, key)
);

CREATE INDEX region_attributes_region_idx ON region_attributes (region_id);
CREATE INDEX region_attributes_key_idx    ON region_attributes (key);

-- ─── SPECIES ─────────────────────────────────────────────────────────────────
CREATE TYPE conservation_status AS ENUM (
  'extinct', 'extinct_wild', 'critically_endangered',
  'endangered', 'vulnerable', 'near_threatened',
  'least_concern', 'data_deficient', 'not_evaluated'
);

CREATE TABLE species (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scientific_name     TEXT NOT NULL,
  common_name_en      TEXT,
  common_name_it      TEXT,
  conservation_status conservation_status,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE region_species (
  region_id  UUID NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
  species_id UUID NOT NULL REFERENCES species(id) ON DELETE CASCADE,
  role       TEXT,   -- e.g. 'flagship', 'endemic', 'keystone', 'invasive'
  notes      TEXT,
  PRIMARY KEY (region_id, species_id)
);

-- ─── VIEWS ───────────────────────────────────────────────────────────────────

-- Current active regions with primary Italian and English names
CREATE VIEW current_regions_it AS
SELECT
  r.id,
  r.slug,
  r.layer,
  r.area_km2,
  r.is_approximate,
  r.crisis_data,
  r.source_name,
  r.source_license,
  n_it.name  AS name_it,
  n_en.name  AS name_en,
  ST_AsGeoJSON(r.geometry)::json AS geometry
FROM regions r
LEFT JOIN region_names n_it
  ON n_it.region_id = r.id AND n_it.language_code = 'it'
  AND n_it.name_type = 'primary' AND n_it.is_public = TRUE
LEFT JOIN region_names n_en
  ON n_en.region_id = r.id AND n_en.language_code = 'en'
  AND n_en.name_type = 'primary' AND n_en.is_public = TRUE
WHERE r.valid_to IS NULL;

-- ─── FUNCTIONS ───────────────────────────────────────────────────────────────

-- Point-in-polygon: which bioregions contain a given point?
-- Usage: SELECT * FROM regions_containing_point(12.38, 43.15, 'watershed');
CREATE OR REPLACE FUNCTION regions_containing_point(
  lng NUMERIC, lat NUMERIC, layer_filter layer_type DEFAULT NULL
)
RETURNS SETOF regions AS $$
  SELECT r.* FROM regions r
  WHERE ST_Contains(r.geometry, ST_SetSRID(ST_MakePoint(lng, lat), 4326))
    AND r.valid_to IS NULL
    AND (layer_filter IS NULL OR r.layer = layer_filter)
  ORDER BY ST_Area(r.geometry) ASC;
$$ LANGUAGE sql STABLE;

-- ─── TRIGGERS ────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER regions_updated_at
  BEFORE UPDATE ON regions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER region_names_updated_at
  BEFORE UPDATE ON region_names
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER region_attributes_updated_at
  BEFORE UPDATE ON region_attributes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
