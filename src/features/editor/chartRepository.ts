import { supabase, isSupabaseConfigured } from '../../lib/supabase'
import type { AuthUser } from '../auth/authTypes'
import { DEFAULT_TECHNIQUE, getChartStorageKey, type CrochetChart, type CrochetTechnique, type TunisianStitch } from './chartStorage'

type ChartRow = {
  id: string
  user_id: string
  name: string
  rows: number
  columns: number
  painted_cells: number[]
  row_heights: number[] | null
  column_widths: number[] | null
  technique: string | null
  cell_symbols: Record<string, string> | null
  cell_colors: Record<string, string> | null
  created_at: string
  updated_at: string
}

function getLocalCharts(user: AuthUser) {
  const storedCharts = localStorage.getItem(getChartStorageKey(user.email))
  if (!storedCharts) return [] as CrochetChart[]

  try {
    return JSON.parse(storedCharts) as CrochetChart[]
  } catch {
    return []
  }
}

function saveLocalCharts(user: AuthUser, charts: CrochetChart[]) {
  localStorage.setItem(getChartStorageKey(user.email), JSON.stringify(charts))
}

function mapRowToChart(row: ChartRow): CrochetChart {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    rows: row.rows,
    columns: row.columns,
    paintedCells: row.painted_cells ?? [],
    rowHeights: row.row_heights ?? undefined,
    columnWidths: row.column_widths ?? undefined,
    technique: (row.technique as CrochetTechnique | null) ?? DEFAULT_TECHNIQUE,
    cellSymbols: row.cell_symbols
      ? Object.fromEntries(Object.entries(row.cell_symbols).map(([key, value]) => [Number(key), value as TunisianStitch]))
      : undefined,
    cellColors: row.cell_colors
      ? Object.fromEntries(Object.entries(row.cell_colors).map(([key, value]) => [Number(key), value]))
      : undefined,
  }
}

export async function listCharts(user: AuthUser) {
  if (!isSupabaseConfigured || !supabase) return getLocalCharts(user)

  const { data, error } = await supabase
    .from('charts')
    .select('id, user_id, name, rows, columns, painted_cells, row_heights, column_widths, technique, cell_symbols, cell_colors, created_at, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) throw new Error(error.message)

  return (data ?? []).map((row) => mapRowToChart(row as ChartRow))
}

export async function saveChart(user: AuthUser, chart: CrochetChart) {
  if (!isSupabaseConfigured || !supabase) {
    const currentCharts = getLocalCharts(user)
    const nextCharts = currentCharts.some((currentChart) => currentChart.id === chart.id)
      ? currentCharts.map((currentChart) => currentChart.id === chart.id ? chart : currentChart)
      : [chart, ...currentCharts]

    const orderedCharts = nextCharts.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    saveLocalCharts(user, orderedCharts)
    return orderedCharts
  }

  const { error } = await supabase.from('charts').upsert({
    id: chart.id,
    user_id: user.id,
    name: chart.name,
    rows: chart.rows,
    columns: chart.columns,
    painted_cells: chart.paintedCells,
    row_heights: chart.rowHeights,
    column_widths: chart.columnWidths,
    technique: chart.technique ?? DEFAULT_TECHNIQUE,
    cell_symbols: chart.cellSymbols ?? {},
    cell_colors: chart.cellColors ?? {},
  })

  if (error) throw new Error(error.message)

  return listCharts(user)
}

export async function deleteChart(user: AuthUser, chartId: string) {
  if (!isSupabaseConfigured || !supabase) {
    const currentCharts = getLocalCharts(user)
    const nextCharts = currentCharts.filter((chart) => chart.id !== chartId)
    saveLocalCharts(user, nextCharts)
    return nextCharts
  }

  const { error } = await supabase
    .from('charts')
    .delete()
    .eq('id', chartId)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)

  return listCharts(user)
}

export function getEditorStorageMode() {
  return isSupabaseConfigured ? 'supabase' : 'local'
}