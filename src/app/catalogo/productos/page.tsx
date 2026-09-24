import { getProductos } from '@/actions/productos'
import { getCategorias } from '@/actions/categorias'
import { CatalogoClient } from '@/components/catalogo/CatalogoClient'

export const dynamic = 'force-dynamic'

export default async function CatalogoProductosPage() {
  const [productos, categorias] = await Promise.all([
    getProductos(),
    getCategorias(),
  ])

  return <CatalogoClient productos={productos} categoriasIniciales={categorias} />
}
