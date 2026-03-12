#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Bioregione · Data Download Script
#
# Downloads open geographic datasets needed for the platform.
# Run once after cloning: npm run data:download
#
# All data is saved to data/raw/ (gitignored due to file size and licenses).
# Processed/clipped versions are committed in data/processed/.
# ─────────────────────────────────────────────────────────────────────────────

set -e

RAW="data/raw"
mkdir -p "$RAW"

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  Bioregione · Downloading Open Geographic Datasets"
echo "═══════════════════════════════════════════════════════"
echo ""

# ─── 1. WWF TEOW — Terrestrial Ecoregions of the World ───────────────────────
# License: © WWF — free for non-commercial use with attribution
# Citation: Olson et al. (2001) Terrestrial Ecoregions of the World
echo "1/4  WWF Terrestrial Ecoregions of the World (TEOW)..."

if [ ! -f "$RAW/wwf_teow.zip" ]; then
  curl -L --progress-bar \
    "https://files.worldwildlife.org/wwfcmsprod/files/Publication/file/6kcchn7e3u_official_teow.zip" \
    -o "$RAW/wwf_teow.zip"
  echo "     Extracting..."
  cd "$RAW" && unzip -q wwf_teow.zip -d wwf_teow && cd ../..
  echo "     ✓ WWF TEOW saved to $RAW/wwf_teow/"
else
  echo "     ✓ Already downloaded"
fi

# Attribution note
cat > "$RAW/wwf_teow_attribution.txt" << 'EOF'
WWF Terrestrial Ecoregions of the World (TEOW)
Source: World Wildlife Fund
URL: https://www.worldwildlife.org/publications/terrestrial-ecoregions-of-the-world
Citation: Olson, D.M., Dinerstein, E., Wikramanayake, E.D., Burgess, N.D., Powell, G.V.N.,
          Underwood, E.C., D'Amico, J.A., Itoua, I., Strand, H.E., Morrison, J.C., Loucks,
          C.J., Allnutt, T.F., Ricketts, T.H., Kura, Y., Lamoreux, J.F., Wettengel, W.W.,
          Hedao, P., Kassem, K.R. (2001). Terrestrial Ecoregions of the World: A New Map of
          Life on Earth. BioScience 51(11):933-938.
License: © WWF — free to use for non-commercial purposes with attribution
EOF

echo ""

# ─── 2. HydroSHEDS — Watershed Basins ────────────────────────────────────────
# License: CC BY 4.0
# We download Level 5 basins for Europe (includes Italy/Tevere watershed)
echo "2/4  HydroSHEDS Watershed Basins (Level 5, Europe)..."

if [ ! -f "$RAW/hybas_eu_lev05_v1c.zip" ]; then
  # HydroSHEDS requires registration for bulk download
  # Direct download link (registration at hydrosheds.org gives access)
  echo ""
  echo "     ⚠  HydroSHEDS requires free registration at:"
  echo "        https://www.hydrosheds.org/products/hydrobasins"
  echo ""
  echo "     After registering, download:"
  echo "        HydroBASINS Level 5 — Europe & Middle East (hybas_eu_lev05_v1c.zip)"
  echo "     Save to: $RAW/hybas_eu_lev05_v1c.zip"
  echo ""
  echo "     Then re-run this script."
  echo ""
  echo "     Attribution: Lehner, B., Grill G. (2013). Global river hydrography and"
  echo "     network routing: baseline data and new approaches to study the world's"
  echo "     large river systems. Hydrological Processes, 27(15): 2171–2186."
  echo "     License: CC BY 4.0"
else
  echo "     Extracting..."
  cd "$RAW" && unzip -q hybas_eu_lev05_v1c.zip -d hydrobasins_eu && cd ../..
  echo "     ✓ HydroSHEDS saved to $RAW/hydrobasins_eu/"
fi

echo ""

# ─── 3. WDPA — World Database on Protected Areas ─────────────────────────────
# License: See https://www.protectedplanet.net/en/legal
echo "3/4  WDPA — World Database on Protected Areas (Italy)..."

if [ ! -f "$RAW/wdpa_italy.zip" ]; then
  echo ""
  echo "     ⚠  WDPA requires free registration at:"
  echo "        https://www.protectedplanet.net/en/thematic-areas/wdpa"
  echo ""
  echo "     After registering, download Italy (ISO: ITA) as GeoJSON or Shapefile."
  echo "     Save to: $RAW/wdpa_italy.zip"
  echo ""
  echo "     Then re-run this script."
  echo ""
  echo "     Attribution: UNEP-WCMC and IUCN ($(date +%Y)), Protected Planet:"
  echo "     The World Database on Protected Areas (WDPA)"
  echo "     https://www.protectedplanet.net"
else
  echo "     Extracting..."
  cd "$RAW" && unzip -q wdpa_italy.zip -d wdpa_italy && cd ../..
  echo "     ✓ WDPA Italy saved to $RAW/wdpa_italy/"
fi

echo ""

# ─── 4. One Earth Bioregions 2023 ────────────────────────────────────────────
echo "4/4  One Earth Bioregions 2023..."

if [ ! -f "$RAW/one_earth_bioregions_2023.geojson" ]; then
  # Available from One Earth's GitHub
  curl -L --progress-bar \
    "https://github.com/OneEarth/bioregions/releases/download/v2023/bioregions_2023.geojson" \
    -o "$RAW/one_earth_bioregions_2023.geojson" 2>/dev/null || {
      echo "     ⚠  Could not auto-download. Get from:"
      echo "        https://www.oneearth.org/bioregions-2023/"
      echo "     Save GeoJSON to: $RAW/one_earth_bioregions_2023.geojson"
    }
else
  echo "     ✓ Already downloaded"
fi

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  Next step: npm run data:import"
echo "  This will clip to the Alto Tevere region and import"
echo "  into your PostGIS database."
echo "═══════════════════════════════════════════════════════"
echo ""
