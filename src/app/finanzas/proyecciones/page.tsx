import { getDatosPresupuestoTranquilidad } from '@/actions/presupuesto'
import { PresupuestoClient } from '@/components/finanzas/PresupuestoClient'

export const dynamic = 'force-dynamic'

export default async function ProyeccionesPage() {
  const datos = await getDatosPresupuestoTranquilidad()
  return <PresupuestoClient datos={datos} />
}
