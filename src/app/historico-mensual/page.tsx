import { getInversiones } from '@/actions/inversiones'
import { getVentas } from '@/actions/ventas'
import { getIngresos } from '@/actions/ingresos'
import { HistoricoMensualClient } from '@/components/historico-mensual/HistoricoMensualClient'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Histórico Mensual & Auditoría Contable | NOVA 3D',
  description: 'Módulo independiente de registro, evolución y auditoría contable de todos los meses.'
}

export default async function HistoricoMensualPage() {
  const [egresos, ventas, ingresosDirectos] = await Promise.all([
    getInversiones(),
    getVentas(),
    getIngresos(),
  ])

  return (
    <HistoricoMensualClient 
      egresos={egresos as any} 
      ventas={ventas as any} 
      ingresosDirectos={ingresosDirectos as any} 
    />
  )
}
