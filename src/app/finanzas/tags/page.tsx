import { getTagsInsumos } from '@/actions/tagsInsumos'
import { TagsInsumosClient } from '@/components/finanzas/TagsInsumosClient'

export const dynamic = 'force-dynamic'

export default async function TagsInsumosPage() {
  const tags = await getTagsInsumos()
  return <TagsInsumosClient tags={tags} />
}
