'use client'

import dynamic from 'next/dynamic'

const BioregionMap = dynamic(() => import('./BioregionMap'), { ssr: false })

export default function BioregionMapWrapper() {
  return <BioregionMap />
}
