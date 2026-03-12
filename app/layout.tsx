import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Bioregione',
  description: 'Open-source bioregional mapping and participatory democracy platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html>
      <body>{children}</body>
    </html>
  )
}
