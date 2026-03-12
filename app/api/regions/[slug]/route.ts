import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const locale = request.nextUrl.searchParams.get('locale') ?? 'it'

  if (!process.env.DATABASE_URL) {
    // No DB — look up from seed data
    const { default: seedData } = await import('@/data/seed/alto-tevere.json')
    const feature = seedData.features.find(
      (f: { properties: { slug?: string } }) => f.properties?.slug === slug
    )
    if (!feature) {
      return NextResponse.json({ error: 'Region not found' }, { status: 404 })
    }
    return NextResponse.json(feature)
  }

  try {
    const { getRegionBySlug } = await import('@/lib/regions')
    const region = await getRegionBySlug(slug, locale)
    if (!region) {
      return NextResponse.json({ error: 'Region not found' }, { status: 404 })
    }
    return NextResponse.json(region, {
      headers: { 'Cache-Control': 'public, max-age=300' },
    })
  } catch (err) {
    console.error(`regions/${slug} error:`, err)
    return NextResponse.json(
      { error: 'Failed to fetch region' },
      { status: 500 }
    )
  }
}
