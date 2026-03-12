import { useTranslations } from 'next-intl'
import Link from 'next/link'

export default function HomePage() {
  const t = useTranslations('home')
  const tNav = useTranslations('nav')

  return (
    <div className="min-h-screen bg-parchment text-ink">
      {/* Navigation */}
      <nav className="border-b border-ink/10 px-6 py-4 flex items-center justify-between">
        <span className="font-cinzel text-ink text-base tracking-widest uppercase">
          Bioregione
        </span>
        <div className="flex gap-6 items-center">
          <Link
            href="/map"
            className="font-cormorant text-ink/60 hover:text-ink transition-colors text-base"
          >
            {tNav('map')}
          </Link>
          <Link
            href="/about"
            className="font-cormorant text-ink/60 hover:text-ink transition-colors text-base"
          >
            {tNav('about')}
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <header className="max-w-3xl mx-auto px-6 pt-16 pb-12 text-center">
        <p className="font-cinzel text-terracotta text-xs tracking-[0.3em] uppercase mb-4">
          {t('subtitle')}
        </p>
        <h1 className="font-cinzel text-ink text-5xl md:text-6xl leading-tight mb-6">
          {t('title')}
        </h1>
        <p className="font-im-fell italic text-ink/60 text-xl md:text-2xl leading-relaxed">
          {t('tagline')}
        </p>
        <div className="mt-10">
          <Link
            href="/map"
            className="inline-block font-cinzel tracking-widest uppercase text-sm bg-ink text-parchment px-8 py-3 rounded hover:bg-ink/80 transition-colors"
          >
            {t('explore_map')}
          </Link>
        </div>
      </header>

      {/* Ornamental divider */}
      <div className="flex items-center max-w-3xl mx-auto px-6 my-4">
        <div className="flex-1 h-px bg-ink/15" />
        <span className="mx-4 text-gold text-lg">✦</span>
        <div className="flex-1 h-px bg-ink/15" />
      </div>

      {/* Emergency banner — Trasimeno */}
      <section className="max-w-3xl mx-auto px-6 py-8">
        <div className="border border-terracotta/40 bg-terracotta/5 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <span className="inline-block font-cinzel text-xs tracking-widest uppercase text-terracotta border border-terracotta/40 rounded px-2 py-1">
                {t('section_emergency_label')}
              </span>
            </div>
            <div className="flex-1">
              <h2 className="font-cinzel text-ink text-xl mb-3">
                {t('section_emergency')}
              </h2>
              <p className="font-cormorant text-ink/70 text-lg leading-relaxed mb-4">
                {t('section_emergency_body')}
              </p>
              <p className="font-cinzel text-terracotta text-2xl font-bold tracking-wide mb-4">
                {t('section_emergency_level')}
              </p>
              <Link
                href="/map"
                className="font-cormorant text-terracotta hover:text-terracotta/70 transition-colors text-base underline underline-offset-2"
              >
                {t('section_emergency_cta')} →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="flex items-center max-w-3xl mx-auto px-6 my-4">
        <div className="flex-1 h-px bg-ink/15" />
        <span className="mx-4 text-gold text-lg">✦</span>
        <div className="flex-1 h-px bg-ink/15" />
      </div>

      {/* The Place */}
      <section className="max-w-3xl mx-auto px-6 py-8">
        <h2 className="font-cinzel text-ink text-2xl mb-5">{t('section_place')}</h2>
        <p className="font-cormorant text-ink/75 text-xl leading-relaxed">
          {t('section_place_body')}
        </p>
      </section>

      {/* Community of Life */}
      <section className="max-w-3xl mx-auto px-6 py-8">
        <h2 className="font-cinzel text-ink text-2xl mb-5">{t('section_life')}</h2>
        <p className="font-cormorant text-ink/75 text-xl leading-relaxed">
          {t('section_life_body')}
        </p>
      </section>

      <div className="flex items-center max-w-3xl mx-auto px-6 my-4">
        <div className="flex-1 h-px bg-ink/15" />
        <span className="mx-4 text-gold text-lg">✦</span>
        <div className="flex-1 h-px bg-ink/15" />
      </div>

      {/* Entry points */}
      <section className="max-w-3xl mx-auto px-6 py-8">
        <h2 className="font-cinzel text-ink text-2xl mb-6">{t('section_action')}</h2>
        <div className="grid md:grid-cols-1 gap-4">
          <Link
            href="/map"
            className="group border border-ink/15 rounded-lg p-5 hover:border-water/40 hover:bg-water/5 transition-all"
          >
            <h3 className="font-cinzel text-ink text-base mb-2 group-hover:text-water transition-colors">
              {t('section_action_map')} →
            </h3>
            <p className="font-cormorant text-ink/60 text-base">
              {t('section_action_map_desc')}
            </p>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-ink/10 mt-16 px-6 py-8 text-center">
        <p className="font-cormorant text-ink/40 text-sm">
          Bioregione · GPL-3.0 ·{' '}
          <a
            href="https://github.com/hannahblue/bioregione"
            className="hover:text-ink/70 transition-colors underline underline-offset-2"
          >
            GitHub
          </a>
        </p>
      </footer>
    </div>
  )
}
