import { getPedidos } from '@/actions/pedidos'
import { getProductos } from '@/actions/productos'
import { getClientes } from '@/actions/clientes'
import { PedidosClient } from '@/components/pedidos/PedidosClient'

export const dynamic = 'force-dynamic'

export default async function PedidosPage() {
  const [pedidos, productos, clientes] = await Promise.all([
    getPedidos(),
    getProductos(),
    getClientes()
  ])

  return (
    <PedidosClient
      pedidosIniciales={pedidos as any}
      productos={productos as any}
      filamentos={[]}
      clientesIniciales={clientes as any}
    />
  )
}

