-- ─────────────────────────────────────────────────────────────────────────────
-- Bioregione · Database Schema
-- Run this in your Neon SQL editor after enabling PostGIS:
--   CREATE EXTENSION IF NOT EXISTS postgis;
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── EXTENSIONS ──────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── LAYER TYPES ─────────────────────────────────────────────────────────────
-- The category of bioregional boundary
CREATE TYPE layer_type AS ENUM (
  'watershed',        -- Hydrological basin (HydroSHEDS)
  'ecoregion',        -- WWF TEOW ecoregion
  'bioregion',        -- Aggregated bioregion (One Earth Bioregions 2023)
  'protected_area',   -- Natura 2000, national/regional parks (WDPA)
  'indigenous_territory', -- Native Land Digital
  'foodshed',         -- Agricultural/food production region
  'custom'            -- Community-defined boundary
);

-- ─── REGIONS ─────────────────────────────────────────────────────────────────
-- The core table: every bioregional polygon lives here
CREATE TABLE regions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug          TEXT UNIQUE NOT NULL,         -- URL-safe identifier e.g. 'alto-tevere'
  layer         layer_type NOT NULL,
  geom          GEOMETRY(MULTIPOLYGON, 4326) NOT NULL,  -- WGS84
  
  -- Temporal versioning: allows tracking how regions change over time
  valid_from    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_to      TIMESTAMPTZ,                 -- NULL = currently active
  
  -- Source attribution (required for all layers)
  source_name   TEXT NOT NULL,               -- e.g. 'WWF Terrestrial Ecoregions of the World'
  source_url    TEXT,
  source_license TEXT,                       -- e.g. 'CC BY 4.0'
  source_id     TEXT,                        -- Original ID in source dataset e.g. WWF ECO_ID
  
  -- Optional numeric attributes
  area_km2      NUMERIC,
  
  -- Metadata
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Spatial index — essential for performance
CREATE INDEX regions_geom_idx ON regions USING GIST (geom);
CREATE INDEX regions_layer_idx ON regions (layer);
CREATE INDEX regions_slug_idx ON regions (slug);
CREATE INDEX regions_valid_idx ON regions (valid_from, valid_to);

-- ─── REGION NAMES ────────────────────────────────────────────────────────────
-- Each region can have many names: different languages, naming traditions,
-- historical periods, indigenous names, scientific names, common names
CREATE TYPE name_type AS ENUM (
  'primary',          -- The main display name for this language
  'scientific',       -- Scientific/taxonomic name
  'indigenous',       -- Name from an indigenous/native tradition
  'historical',       -- No longer current but historically significant
  'local',            -- Informal local usage
  'administrative',   -- Current administrative/political name for the same area
  'alternative'       -- Other valid names
);

CREATE TABLE region_names (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  region_id     UUID NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
  
  name          TEXT NOT NULL,
  locale        TEXT NOT NULL DEFAULT 'en',  -- BCP 47 language tag: 'en', 'it', 'la' etc.
  name_type     name_type NOT NULL DEFAULT 'primary',
  
  -- Context and provenance
  notes         TEXT,                        -- Usage guidelines, context, history
  source        TEXT,                        -- Where this name comes from
  is_public     BOOLEAN NOT NULL DEFAULT TRUE,  -- FALSE = sacred/restricted, don't display
  
  -- Temporal
  valid_from    TIMESTAMPTZ,                 -- When this name started being used
  valid_to      TIMESTAMPTZ,                 -- NULL = still in use
  
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX region_names_region_idx ON region_names (region_id);
CREATE INDEX region_names_locale_idx ON region_names (locale);
CREATE INDEX region_names_type_idx ON region_names (name_type);

-- ─── REGION ATTRIBUTES ───────────────────────────────────────────────────────
-- Flexible key-value store for additional ecological data per region
-- e.g. dominant_species, conservation_status, water_level, endemic_species_count
CREATE TABLE region_attributes (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  region_id     UUID NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
  key           TEXT NOT NULL,
  value         TEXT NOT NULL,
  unit          TEXT,                        -- e.g. 'cm', 'km²', 'count'
  recorded_at   TIMESTAMPTZ,                 -- When this measurement was taken
  source        TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX region_attributes_region_idx ON region_attributes (region_id);
CREATE INDEX region_attributes_key_idx ON region_attributes (key);

-- ─── SPECIES ─────────────────────────────────────────────────────────────────
-- Notable species associated with a bioregion
CREATE TYPE conservation_status AS ENUM (
  'extinct', 'extinct_wild', 'critically_endangered',
  'endangered', 'vulnerable', 'near_threatened',
  'least_concern', 'data_deficient', 'not_evaluated'
);

CREATE TABLE species (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scientific_name TEXT NOT NULL,
  common_name_en  TEXT,
  common_name_it  TEXT,
  conservation_status conservation_status,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE region_species (
  region_id   UUID NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
  species_id  UUID NOT NULL REFERENCES species(id) ON DELETE CASCADE,
  role        TEXT,  -- e.g. 'flagship', 'endemic', 'keystone', 'invasive'
  notes       TEXT,
  PRIMARY KEY (region_id, species_id)
);

-- ─── HELPFUL VIEWS ───────────────────────────────────────────────────────────

-- Current active regions with their primary Italian name
CREATE VIEW current_regions_it AS
SELECT
  r.id,
  r.slug,
  r.layer,
  r.area_km2,
  r.source_name,
  r.source_license,
  n.name AS name_it,
  n_en.name AS name_en,
  ST_AsGeoJSON(r.geom)::json AS geometry
FROM regions r
LEFT JOIN region_names n 
  ON n.region_id = r.id AND n.locale = 'it' AND n.name_type = 'primary' AND n.is_public = TRUE
LEFT JOIN region_names n_en
  ON n_en.region_id = r.id AND n_en.locale = 'en' AND n_en.name_type = 'primary' AND n_en.is_public = TRUE
WHERE r.valid_to IS NULL;

-- Point-in-polygon: which bioregion contains a given point?
-- Usage: SELECT * FROM regions_containing_point(12.38, 43.15, 'watershed');
CREATE OR REPLACE FUNCTION regions_containing_point(
  lng NUMERIC, lat NUMERIC, layer_filter layer_type DEFAULT NULL
)
RETURNS SETOF regions AS $$
  SELECT r.* FROM regions r
  WHERE ST_Contains(r.geom, ST_SetSRID(ST_MakePoint(lng, lat), 4326))
    AND r.valid_to IS NULL
    AND (layer_filter IS NULL OR r.layer = layer_filter)
  ORDER BY ST_Area(r.geom) ASC;  -- smallest first (most specific)
$$ LANGUAGE sql STABLE;

-- ─── UPDATED_AT TRIGGER ──────────────────────────────────────────────────────
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
