import { getPedidos } from '@/actions/pedidos'
import { getProductos } from '@/actions/productos'
import { getFilamentosActivos } from '@/actions/inventario'
import { PedidosClient } from '@/components/pedidos/PedidosClient'

export const dynamic = 'force-dynamic'

export default async function PedidosPage() {
  const [pedidos, productos, filamentos] = await Promise.all([
    getPedidos(),
    getProductos(),
    getFilamentosActivos()
  ])

  return (
    <PedidosClient
      pedidosIniciales={pedidos as any}
      productos={productos as any}
      filamentos={filamentos as any}
    />
  )
}
