import { getTallerData } from '@/actions/taller'
import { TallerClient } from '@/components/taller/TallerClient'
import { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Taller de Producción 3D | NOVA',
  description: 'Cola de impresión, agrupación de piezas por modelo y color de filamento, y priorización de fabricación.'
}

export default async function TallerPage() {
  const data = await getTallerData()

  return <TallerClient data={data} />
}
