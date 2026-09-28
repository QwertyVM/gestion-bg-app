export type DatePreset = 'ESTE_MES' | 'MES_ANTERIOR' | 'ULTIMOS_30_DIAS' | 'ULTIMOS_3_MESES' | 'ESTE_ANIO' | 'ESTA_SEMANA' | 'SEMANA_ANTERIOR' | 'TODO' | 'PERSONALIZADO'

export interface DateRange {
  from: string | null // Formato YYYY-MM-DD
  to: string | null   // Formato YYYY-MM-DD
  preset: DatePreset
}

/**
 * Obtener la fecha local en formato YYYY-MM-DD
 */
export function formatToYMD(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Obtener el rango de fechas para un preset dado
 */
export function getPresetDateRange(preset: DatePreset, referenceDate: Date = new Date()): DateRange {
  const now = new Date(referenceDate)
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() // 0-11

  switch (preset) {
    case 'ESTA_SEMANA': {
      // Semana de Lunes a Domingo en curso
      const dayOfWeek = now.getDay() // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
      const monday = new Date(now)
      monday.setDate(now.getDate() + diffToMonday)
      const sunday = new Date(monday)
      sunday.setDate(monday.getDate() + 6)
      return {
        from: formatToYMD(monday),
        to: formatToYMD(sunday),
        preset: 'ESTA_SEMANA'
      }
    }
    case 'SEMANA_ANTERIOR': {
      // Semana de Lunes a Domingo previa cerrada
      const dayOfWeek = now.getDay()
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
      const monday = new Date(now)
      monday.setDate(now.getDate() + diffToMonday - 7)
      const sunday = new Date(monday)
      sunday.setDate(monday.getDate() + 6)
      return {
        from: formatToYMD(monday),
        to: formatToYMD(sunday),
        preset: 'SEMANA_ANTERIOR'
      }
    }
    case 'ESTE_MES': {
      const firstDay = new Date(currentYear, currentMonth, 1)
      const lastDay = new Date(currentYear, currentMonth + 1, 0)
      return {
        from: formatToYMD(firstDay),
        to: formatToYMD(lastDay),
        preset: 'ESTE_MES'
      }
    }
    case 'MES_ANTERIOR': {
      const firstDayPrev = new Date(currentYear, currentMonth - 1, 1)
      const lastDayPrev = new Date(currentYear, currentMonth, 0)
      return {
        from: formatToYMD(firstDayPrev),
        to: formatToYMD(lastDayPrev),
        preset: 'MES_ANTERIOR'
      }
    }
    case 'ULTIMOS_30_DIAS': {
      const past30 = new Date(now)
      past30.setDate(past30.getDate() - 30)
      return {
        from: formatToYMD(past30),
        to: formatToYMD(now),
        preset: 'ULTIMOS_30_DIAS'
      }
    }
    case 'ULTIMOS_3_MESES': {
      const past3Months = new Date(now)
      past3Months.setMonth(past3Months.getMonth() - 3)
      return {
        from: formatToYMD(past3Months),
        to: formatToYMD(now),
        preset: 'ULTIMOS_3_MESES'
      }
    }
    case 'ESTE_ANIO': {
      const firstDayYear = new Date(currentYear, 0, 1)
      const lastDayYear = new Date(currentYear, 11, 31)
      return {
        from: formatToYMD(firstDayYear),
        to: formatToYMD(lastDayYear),
        preset: 'ESTE_ANIO'
      }
    }
    case 'TODO':
    default:
      return {
        from: null,
        to: null,
        preset: 'TODO'
      }
  }
}

/**
 * Obtener el rango de fechas por defecto (por defecto: mes actual)
 */
export function getDefaultDateRange(preset: DatePreset = 'ESTE_MES'): DateRange {
  return getPresetDateRange(preset)
}

/**
 * Obtener el rango de fechas para un mes y año específicos
 */
export function getMonthYearDateRange(year: number, month: number): DateRange {
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)
  return {
    from: formatToYMD(firstDay),
    to: formatToYMD(lastDay),
    preset: 'PERSONALIZADO'
  }
}

/**
 * Comprobar si una fecha (string ISO o YYYY-MM-DD o Date) cae dentro de un rango
 */
export function isDateInRange(
  rawDate: string | Date | null | undefined, 
  from: string | null | undefined, 
  to: string | null | undefined
): boolean {
  if (!rawDate) return false
  if (!from && !to) return true

  let dateStr: string
  if (rawDate instanceof Date) {
    dateStr = formatToYMD(rawDate)
  } else {
    // Si viene como ISO string "2026-09-18T04:00:00.000Z", extraer "2026-09-18"
    dateStr = String(rawDate).split('T')[0]
  }

  if (from && dateStr < from) return false
  if (to && dateStr > to) return false
  return true
}

/**
 * Nombre en español del mes actual o referenciado
 */
export const MESES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

export function getNombreMesAnio(date: Date = new Date()): string {
  return `${MESES_ES[date.getMonth()]} ${date.getFullYear()}`
}

/**
 * Formateador de fecha para tooltips de evolución y gráficos
 */
export function formatFechaEvolucion(rawDate: string, conAnio = false) {
  if (!rawDate) return ''
  const parts = String(rawDate).split('-')
  if (parts.length === 3) {
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic']
    const day = d.getDate()
    const month = months[d.getMonth()]
    return conAnio ? `${day} ${month} ${d.getFullYear()}` : `${day} ${month}`
  }
  return rawDate
}

