'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import type { FeatureCollection, Feature } from 'geojson'

// MapLibre is loaded dynamically to avoid SSR issues
type MapLibreMap = import('maplibre-gl').Map
type MapLibreGL = typeof import('maplibre-gl')

type LayerType = 'watershed' | 'ecoregion' | 'protected_area'

const ALTO_TEVERE_CENTER: [number, number] = [12.38, 43.1]
const ALTO_TEVERE_ZOOM = 8

const LAYER_COLORS: Record<LayerType, string> = {
  watershed: '#3d7a8a',      // water
  ecoregion: '#6b7c3a',      // olive
  protected_area: '#b5562a', // terracotta
}

const LAYER_COLORS_HOVER: Record<LayerType, string> = {
  watershed: '#5aa0b8',
  ecoregion: '#8fa84d',
  protected_area: '#d4703a',
}

interface RegionProperties {
  id: string
  slug: string
  layer: LayerType
  area_km2: number | null
  is_approximate: boolean
  crisis_data: { water_level_cm?: number; label?: string } | null
  primary_name_it: string | null
  primary_name_en: string | null
}

interface SidebarRegion {
  slug: string
  layer: LayerType
  name: string
  is_approximate: boolean
  crisis_data: RegionProperties['crisis_data']
  area_km2: number | null
}

const ALL_LAYERS: LayerType[] = ['watershed', 'ecoregion', 'protected_area']

export default function BioregionMap() {
  const locale = useLocale()
  const t = useTranslations('map')
  const tAttr = useTranslations('attribution')

  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const mapglRef = useRef<MapLibreGL | null>(null)

  const [loaded, setLoaded] = useState(false)
  const [southUp, setSouthUp] = useState(false)
  const [activeLayers, setActiveLayers] = useState<Set<LayerType>>(
    new Set(ALL_LAYERS)
  )
  const [selectedRegion, setSelectedRegion] = useState<SidebarRegion | null>(null)
  const [attributionOpen, setAttributionOpen] = useState(false)

  // Load regions and add/update source + layers
  const loadRegions = useCallback(
    async (map: MapLibreMap) => {
      const bounds = map.getBounds()
      const bbox = [
        bounds.getWest(),
        bounds.getSouth(),
        bounds.getEast(),
        bounds.getNorth(),
      ].join(',')

      const layers = Array.from(activeLayers).join(',')
      const url = `/api/regions/geojson?bbox=${bbox}&layers=${layers}&locale=${locale}`

      let data: FeatureCollection
      try {
        const res = await fetch(url)
        data = await res.json()
      } catch {
        return
      }

      const source = map.getSource('regions') as
        | import('maplibre-gl').GeoJSONSource
        | undefined

      if (source) {
        source.setData(data)
      } else {
        map.addSource('regions', {
          type: 'geojson',
          data,
          promoteId: 'id',
        })

        // Fill layer for each type
        for (const layer of ALL_LAYERS) {
          map.addLayer({
            id: `fill-${layer}`,
            type: 'fill',
            source: 'regions',
            filter: ['==', ['get', 'layer'], layer],
            paint: {
              'fill-color': LAYER_COLORS[layer],
              'fill-opacity': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                0.55,
                0.3,
              ],
            },
          })

          map.addLayer({
            id: `stroke-${layer}`,
            type: 'line',
            source: 'regions',
            filter: ['==', ['get', 'layer'], layer],
            paint: {
              'line-color': LAYER_COLORS_HOVER[layer],
              'line-width': 1.5,
              'line-opacity': 0.8,
              'line-dasharray': [
                'case',
                ['==', ['get', 'is_approximate'], true],
                ['literal', [4, 3]],
                ['literal', [1, 0]],
              ],
            },
          })
        }

        // Label overlay (on top)
        map.addLayer({
          id: 'labels',
          type: 'symbol',
          source: 'regions',
          layout: {
            'text-field': [
              'coalesce',
              ['get', locale === 'it' ? 'primary_name_it' : 'primary_name_en'],
              ['get', 'primary_name_it'],
              ['get', 'primary_name_en'],
            ],
            'text-size': 11,
            'text-font': ['Noto Sans Regular'],
            'text-max-width': 10,
          },
          paint: {
            'text-color': '#f2ead8',
            'text-halo-color': '#2a1f0e',
            'text-halo-width': 1.5,
          },
        })
      }

      // Update layer visibility
      for (const layer of ALL_LAYERS) {
        const visibility = activeLayers.has(layer) ? 'visible' : 'none'
        if (map.getLayer(`fill-${layer}`)) {
          map.setLayoutProperty(`fill-${layer}`, 'visibility', visibility)
          map.setLayoutProperty(`stroke-${layer}`, 'visibility', visibility)
        }
      }
    },
    [activeLayers, locale]
  )

  // Initialise MapLibre
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    let map: MapLibreMap

    import('maplibre-gl').then((maplibre) => {
      mapglRef.current = maplibre

      map = new maplibre.Map({
        container: mapContainerRef.current!,
        style: {
          version: 8,
          sources: {
            'carto-dark': {
              type: 'raster',
              tiles: [
                'https://a.basemaps.cartocdn.com/dark_matter_no_labels/{z}/{x}/{y}.png',
                'https://b.basemaps.cartocdn.com/dark_matter_no_labels/{z}/{x}/{y}.png',
                'https://c.basemaps.cartocdn.com/dark_matter_no_labels/{z}/{x}/{y}.png',
                'https://d.basemaps.cartocdn.com/dark_matter_no_labels/{z}/{x}/{y}.png',
              ],
              tileSize: 256,
              attribution: '© CARTO',
            },
            'carto-labels': {
              type: 'raster',
              tiles: [
                'https://a.basemaps.cartocdn.com/dark_matter_only_labels/{z}/{x}/{y}.png',
                'https://b.basemaps.cartocdn.com/dark_matter_only_labels/{z}/{x}/{y}.png',
                'https://c.basemaps.cartocdn.com/dark_matter_only_labels/{z}/{x}/{y}.png',
                'https://d.basemaps.cartocdn.com/dark_matter_only_labels/{z}/{x}/{y}.png',
              ],
              tileSize: 256,
            },
          },
          layers: [
            { id: 'carto-dark', type: 'raster', source: 'carto-dark' },
            { id: 'carto-labels', type: 'raster', source: 'carto-labels' },
          ],
          glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
        },
        center: ALTO_TEVERE_CENTER,
        zoom: ALTO_TEVERE_ZOOM,
        attributionControl: false,
      })

      mapRef.current = map

      map.on('load', async () => {
        await loadRegions(map)
        setLoaded(true)

        // Hover state
        let hoveredId: string | number | null = null

        for (const layer of ALL_LAYERS) {
          map.on('mousemove', `fill-${layer}`, (e) => {
            if (!e.features || e.features.length === 0) return
            map.getCanvas().style.cursor = 'pointer'
            const id = e.features[0].id
            if (hoveredId !== null && hoveredId !== id) {
              map.setFeatureState({ source: 'regions', id: hoveredId }, { hover: false })
            }
            hoveredId = id ?? null
            if (hoveredId !== null) {
              map.setFeatureState({ source: 'regions', id: hoveredId }, { hover: true })
            }
          })

          map.on('mouseleave', `fill-${layer}`, () => {
            map.getCanvas().style.cursor = ''
            if (hoveredId !== null) {
              map.setFeatureState({ source: 'regions', id: hoveredId }, { hover: false })
              hoveredId = null
            }
          })

          map.on('click', `fill-${layer}`, (e) => {
            if (!e.features || e.features.length === 0) return
            const feature = e.features[0] as unknown as Feature & { properties: RegionProperties }
            const props = feature.properties
            const name =
              (locale === 'it' ? props.primary_name_it : props.primary_name_en) ??
              props.primary_name_it ??
              props.primary_name_en ??
              props.slug

            setSelectedRegion({
              slug: props.slug,
              layer: props.layer,
              name,
              is_approximate: props.is_approximate,
              crisis_data: props.crisis_data,
              area_km2: props.area_km2,
            })
          })
        }
      })

      map.on('moveend', () => {
        if (mapRef.current) loadRegions(mapRef.current)
      })
    })

    return () => {
      map?.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Re-load when active layers or locale change (after initial load)
  useEffect(() => {
    if (loaded && mapRef.current) {
      loadRegions(mapRef.current)
    }
  }, [activeLayers, loaded, loadRegions])

  // South-up: rotate the map container 180°, counter-rotate controls
  const toggleSouthUp = () => {
    setSouthUp((prev) => !prev)
  }

  const toggleLayer = (layer: LayerType) => {
    setActiveLayers((prev) => {
      const next = new Set(prev)
      if (next.has(layer)) {
        next.delete(layer)
      } else {
        next.add(layer)
      }
      return next
    })
  }

  return (
    <div className="relative w-full h-full">
      {/* Map container — rotated for south-up */}
      <div
        ref={mapContainerRef}
        className="absolute inset-0 transition-transform duration-700"
        style={{ transform: southUp ? 'rotate(180deg)' : 'none' }}
      />

      {/* Loading overlay */}
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-ink/80 z-10">
          <span className="font-cormorant text-parchment text-lg tracking-widest">
            {t('loading')}
          </span>
        </div>
      )}

      {/* Controls — counter-rotated when south-up so they stay readable */}
      <div
        className="absolute inset-0 pointer-events-none z-20"
        style={{ transform: southUp ? 'rotate(180deg)' : 'none' }}
      >
        {/* Layer toggles — top left */}
        <div className="absolute top-4 left-4 pointer-events-auto">
          <div className="bg-ink/90 border border-gold/30 rounded px-3 py-2 space-y-2">
            <p className="font-cinzel text-gold text-xs tracking-widest uppercase mb-1">
              {t('layers')}
            </p>
            {ALL_LAYERS.map((layer) => (
              <label key={layer} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={activeLayers.has(layer)}
                  onChange={() => toggleLayer(layer)}
                  className="sr-only"
                />
                <span
                  className="w-3 h-3 rounded-sm border border-white/20 flex-shrink-0"
                  style={{
                    backgroundColor: activeLayers.has(layer)
                      ? LAYER_COLORS[layer]
                      : 'transparent',
                  }}
                />
                <span className="font-cormorant text-parchment text-sm">
                  {t(`layer_${layer === 'protected_area' ? 'protected' : layer}`)}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* South-up toggle — top right */}
        <div className="absolute top-4 right-4 pointer-events-auto">
          <button
            onClick={toggleSouthUp}
            className="bg-ink/90 border border-gold/30 rounded px-3 py-2 font-cinzel text-gold text-xs tracking-widest uppercase hover:border-gold/60 transition-colors"
          >
            {southUp ? t('north_up') : t('south_up')}
          </button>
        </div>

        {/* Attribution toggle — bottom right */}
        <div className="absolute bottom-4 right-4 pointer-events-auto">
          <button
            onClick={() => setAttributionOpen((o) => !o)}
            className="bg-ink/90 border border-gold/30 rounded px-3 py-2 font-cinzel text-gold/70 text-xs tracking-widest uppercase hover:text-gold transition-colors"
          >
            {t('attribution')}
          </button>
        </div>

        {/* Attribution panel */}
        {attributionOpen && (
          <div className="absolute bottom-14 right-4 pointer-events-auto w-72 bg-ink/95 border border-gold/30 rounded p-4">
            <p className="font-cinzel text-gold text-xs tracking-widest uppercase mb-3">
              {t('attribution')}
            </p>
            <ul className="space-y-2 text-xs font-cormorant text-parchment/80">
              <li>
                <span className="text-parchment">{tAttr('carto')}</span>
                {' — '}{tAttr('carto_license')}
              </li>
              <li>
                <span className="text-parchment">{tAttr('seed_data')}</span>
                {' — '}{tAttr('seed_license')}
              </li>
              <li>
                <span className="text-parchment">{tAttr('wwf')}</span>
                {' — '}{tAttr('wwf_license')}
              </li>
              <li>
                <span className="text-parchment">{tAttr('hydrosheds')}</span>
                {' — '}{tAttr('hydrosheds_license')}
              </li>
              <li>
                <span className="text-parchment">{tAttr('wdpa')}</span>
                {' — '}{tAttr('wdpa_license')}
              </li>
            </ul>
          </div>
        )}

        {/* No-DB notice */}
        {!process.env.DATABASE_URL && loaded && (
          <div className="absolute bottom-4 left-4 pointer-events-auto max-w-xs">
            <div className="bg-ink/90 border border-terracotta/40 rounded px-3 py-2 text-xs font-cormorant text-terracotta/80">
              Dati seme · Seed data only — database not connected
            </div>
          </div>
        )}
      </div>

      {/* Region sidebar — outside rotation so it stays upright */}
      {selectedRegion && (
        <div className="absolute top-0 right-0 h-full w-80 bg-ink/95 border-l border-gold/20 z-30 overflow-y-auto">
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span
                  className="text-xs font-cinzel tracking-widest uppercase mb-1 block"
                  style={{ color: LAYER_COLORS[selectedRegion.layer] }}
                >
                  {t(`layer_${selectedRegion.layer === 'protected_area' ? 'protected' : selectedRegion.layer}`)}
                </span>
                <h2 className="font-cinzel text-parchment text-lg leading-snug">
                  {selectedRegion.name}
                </h2>
              </div>
              <button
                onClick={() => setSelectedRegion(null)}
                className="text-parchment/40 hover:text-parchment ml-4 mt-1 text-lg leading-none"
                aria-label={t('close')}
              >
                ×
              </button>
            </div>

            {selectedRegion.is_approximate && (
              <p className="text-xs font-im-fell italic text-gold/60 mb-3">
                ⚠ {t('approximate')}
              </p>
            )}

            {selectedRegion.area_km2 && (
              <p className="text-sm font-cormorant text-parchment/60 mb-4">
                {selectedRegion.area_km2.toLocaleString(locale)} km²
              </p>
            )}

            {selectedRegion.crisis_data && (
              <div className="bg-terracotta/10 border border-terracotta/30 rounded p-3 mb-4">
                <p className="font-cinzel text-terracotta text-xs tracking-widest uppercase mb-1">
                  {t('crisis_badge')}
                </p>
                {selectedRegion.crisis_data.water_level_cm !== undefined && (
                  <p className="font-cormorant text-parchment text-2xl font-bold">
                    {selectedRegion.crisis_data.water_level_cm > 0 ? '+' : ''}
                    {selectedRegion.crisis_data.water_level_cm} cm
                  </p>
                )}
                {selectedRegion.crisis_data.label && (
                  <p className="font-cormorant text-parchment/70 text-sm mt-1">
                    {selectedRegion.crisis_data.label}
                  </p>
                )}
              </div>
            )}

            <p className="text-xs font-cormorant text-parchment/30 mt-6">
              {selectedRegion.slug}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
