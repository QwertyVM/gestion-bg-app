import { getCategorias } from '@/actions/categorias'
import { CategoriasClient } from '@/components/categorias/CategoriasClient'

export const dynamic = 'force-dynamic'

export default async function CategoriasPage() {
  const categorias = await getCategorias()

  return <CategoriasClient categoriasIniciales={categorias} />
}
