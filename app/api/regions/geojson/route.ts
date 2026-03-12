import { NextRequest, NextResponse } from 'next/server'
import type { LayerType } from '@/lib/regions'

export const runtime = 'edge'

// Seed data fallback — used when DATABASE_URL is not configured
async function getSeedData() {
  const { default: seedData } = await import('@/data/seed/alto-tevere.json')
  return seedData
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const bboxParam = searchParams.get('bbox')
  const layersParam = searchParams.get('layers')
  const locale = searchParams.get('locale') ?? 'it'

  if (!process.env.DATABASE_URL) {
    // No DB — serve seed data directly
    const seed = await getSeedData()
    return NextResponse.json(seed, {
      headers: { 'Cache-Control': 'public, max-age=60' },
    })
  }

  // Parse bbox
  if (!bboxParam) {
    return NextResponse.json(
      { error: 'bbox parameter required: ?bbox=west,south,east,north' },
      { status: 400 }
    )
  }

  const parts = bboxParam.split(',').map(Number)
  if (parts.length !== 4 || parts.some(isNaN)) {
    return NextResponse.json(
      { error: 'bbox must be four numbers: west,south,east,north' },
      { status: 400 }
    )
  }
  const [west, south, east, north] = parts

  const layers = layersParam
    ? (layersParam.split(',') as LayerType[])
    : undefined

  try {
    const { getRegionsByBbox } = await import('@/lib/regions')
    const featureCollection = await getRegionsByBbox(
      west,
      south,
      east,
      north,
      layers
    )
    return NextResponse.json(featureCollection, {
      headers: { 'Cache-Control': 'public, max-age=30' },
    })
  } catch (err) {
    console.error('regions/geojson error:', err)
    return NextResponse.json(
      { error: 'Failed to fetch regions' },
      { status: 500 }
    )
  }

  void locale // available for future locale-aware name selection
}
