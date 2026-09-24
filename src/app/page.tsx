import { getDashboardData } from '@/actions/dashboard'
import { DashboardClient } from '@/components/dashboard/DashboardClient'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const data = await getDashboardData()

  return <DashboardClient {...data} />
}
