import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

const nextConfig: NextConfig = {
  // MapLibre GL needs this for the worker
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'maplibre-gl': 'maplibre-gl',
    }
    return config
  },
}

export default withNextIntl(nextConfig)
