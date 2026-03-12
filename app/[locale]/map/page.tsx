import { useTranslations } from 'next-intl'
import Link from 'next/link'
import BioregionMapWrapper from '@/components/map/BioregionMapWrapper'

export default function MapPage() {
  const t = useTranslations('map')
  const tNav = useTranslations('nav')

  return (
    <div className="flex flex-col h-screen bg-ink">
      {/* Minimal header */}
      <header className="flex-none flex items-center justify-between px-4 py-2 border-b border-gold/20">
        <Link
          href="/"
          className="font-cinzel text-gold text-sm tracking-widest uppercase hover:text-parchment transition-colors"
        >
          Bioregione
        </Link>
        <h1 className="font-cinzel text-parchment/60 text-xs tracking-widest uppercase">
          {t('title')}
        </h1>
        <Link
          href="/"
          className="font-cormorant text-parchment/50 text-sm hover:text-parchment transition-colors"
        >
          ← {tNav('home')}
        </Link>
      </header>

      {/* Full-screen map */}
      <main className="flex-1 relative overflow-hidden">
        <BioregionMapWrapper />
      </main>
    </div>
  )
}
