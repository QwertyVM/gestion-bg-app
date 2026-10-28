import { NextRequest, NextResponse } from 'next/server'
import { getKpiExplanation } from '@/actions/kpi-explainer'
import { TipoNegocio } from '@/lib/business'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const kpiId = searchParams.get('kpiId')
    const from = searchParams.get('from') || undefined
    const to = searchParams.get('to') || undefined
    const negocio = (searchParams.get('negocio') as TipoNegocio) || undefined

    if (!kpiId) {
      return NextResponse.json(
        { success: false, error: 'Parámetro kpiId es requerido' },
        { status: 400 }
      )
    }

    const data = await getKpiExplanation(kpiId, from, to, negocio)

    return NextResponse.json({
      success: true,
      data
    })
  } catch (error: any) {
    console.error('Error en API /api/kpis/explicacion:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error al obtener la explicación del KPI'
      },
      { status: 500 }
    )
  }
}
