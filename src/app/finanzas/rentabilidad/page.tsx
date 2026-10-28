import { Suspense } from 'react'
import { getRentabilidadSueldos } from '@/actions/rentabilidad'
import { RentabilidadSueldosView } from '@/components/finanzas/RentabilidadSueldosView'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Rentabilidad & Sueldos | Board Games Finanzas',
  description: 'Control de utilidad mensual, saldo acumulado y capacidad de asignación de sueldos para juegos de mesa.',
}

export default async function RentabilidadPage() {
  const data = await getRentabilidadSueldos('BG')

  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs font-mono text-muted-foreground">
          Cargando análisis de rentabilidad y capacidad de sueldos BG...
        </div>
      }
    >
      <RentabilidadSueldosView initialData={data} />
    </Suspense>
  )
}
