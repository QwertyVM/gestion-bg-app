import { Metadata } from 'next'
import { getClientes } from '@/actions/clientes'
import { ClientesClient } from '@/components/clientes/ClientesClient'
import { getActiveNegocioServer } from '@/lib/business-server'

export const metadata: Metadata = {
  title: 'Directorio de Clientes | NOVA Studio',
  description: 'Gestión y CRM de clientes, historial de pedidos, LTV y contacto directo.',
}

export const dynamic = 'force-dynamic'

export default async function ClientesPage() {
  const negocio = await getActiveNegocioServer()
  const clientes = await getClientes(negocio)

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-5">
      <ClientesClient initialClientes={clientes} />
    </div>
  )
}
