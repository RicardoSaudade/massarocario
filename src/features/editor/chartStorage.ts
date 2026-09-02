export const GRID_ROWS = 24
export const GRID_COLUMNS = 24
export const DEFAULT_CELL_SIZE = 32

export type CrochetTechnique = 'filet' | 'pixel-graphgan' | 'corner-to-corner' | 'tunisian' | 'mosaic' | 'amigurumi' | 'irish-motif'

export type TechniqueOption = {
  value: CrochetTechnique
  label: string
  gridReady: boolean
  description: string
}

// Mesmo catalogo do servidor MCP (massarocario-mcp/knowledge/techniques-overview.md), resumido para a UI.
export const TECHNIQUE_OPTIONS: TechniqueOption[] = [
  { value: 'filet', label: 'Filet', gridReady: true, description: 'Grade de blocos e espacos. Modelo padrao deste editor.' },
  { value: 'pixel-graphgan', label: 'Pixel / Graphgan', gridReady: true, description: 'Grade colorida ponto a ponto, com paleta de cores.' },
  { value: 'corner-to-corner', label: 'Corner-to-corner (C2C)', gridReady: true, description: 'Grade por blocos diagonais. Leitura diagonal chega em breve.' },
  { value: 'tunisian', label: 'Tunisiano', gridReady: true, description: 'Grade com passada dupla. Simbolo por celula chega em breve.' },
  { value: 'mosaic', label: 'Mosaico', gridReady: true, description: 'Grade de 2 cores. Conversao de 2 carreiras por linha chega em breve.' },
  { value: 'amigurumi', label: 'Amigurumi', gridReady: false, description: 'Trabalho em espiral, sem grade retangular. Editor proprio ainda nao disponivel.' },
  { value: 'irish-motif', label: 'Croche irlandes / Motivos', gridReady: false, description: 'Motivos radiais, sem grade retangular. Editor proprio ainda nao disponivel.' },
]

export const DEFAULT_TECHNIQUE: CrochetTechnique = 'filet'

export type TunisianStitch = 'Tss' | 'Tks' | 'Tps'

export const TUNISIAN_STITCH_OPTIONS: { value: TunisianStitch; label: string }[] = [
  { value: 'Tss', label: 'Tss - simples' },
  { value: 'Tks', label: 'Tks - knit' },
  { value: 'Tps', label: 'Tps - purl' },
]

export const DEFAULT_TUNISIAN_STITCH: TunisianStitch = 'Tss'

export const PALETTE_COLORS: { value: string; label: string }[] = [
  { value: '#101010', label: 'Preto' },
  { value: '#f5ead9', label: 'Cru' },
  { value: '#c0392b', label: 'Vermelho' },
  { value: '#e67e22', label: 'Laranja' },
  { value: '#f1c40f', label: 'Amarelo' },
  { value: '#27ae60', label: 'Verde' },
  { value: '#2980b9', label: 'Azul' },
  { value: '#8e44ad', label: 'Roxo' },
  { value: '#e84393', label: 'Rosa' },
  { value: '#6d4c33', label: 'Marrom' },
]

export const DEFAULT_PAINT_COLOR = PALETTE_COLORS[0].value

export function getColorLabel(color: string) {
  return PALETTE_COLORS.find((option) => option.value === color)?.label ?? color
}

export type CrochetChart = {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  rows: number
  columns: number
  paintedCells: number[]
  rowHeights?: number[]
  columnWidths?: number[]
  technique?: CrochetTechnique
  cellSymbols?: Record<number, TunisianStitch>
  cellColors?: Record<number, string>
}

const storagePrefix = 'massarocario-charts:'

export function createEmptyChart(name = 'Novo grafico', technique: CrochetTechnique = DEFAULT_TECHNIQUE): CrochetChart {
  const now = new Date().toISOString()

  return {
    id: globalThis.crypto?.randomUUID?.() ?? String(Date.now()),
    name,
    createdAt: now,
    updatedAt: now,
    rows: GRID_ROWS,
    columns: GRID_COLUMNS,
    paintedCells: [],
    rowHeights: Array(GRID_ROWS).fill(DEFAULT_CELL_SIZE),
    columnWidths: Array(GRID_COLUMNS).fill(DEFAULT_CELL_SIZE),
    technique,
  }
}

export function normalizeGridSizes(sizes: number[] | undefined, length: number) {
  return Array.from({ length }, (_, index) => Math.max(18, Math.min(96, sizes?.[index] ?? DEFAULT_CELL_SIZE)))
}

export function getChartStorageKey(email: string) {
  return `${storagePrefix}${email.toLowerCase()}`
}

export function resizePaintedCells(paintedCells: number[], previousColumns: number, rows: number, columns: number) {
  return paintedCells.flatMap((cellIndex) => {
    const row = Math.floor(cellIndex / previousColumns)
    const column = cellIndex % previousColumns
    if (row >= rows || column >= columns) return []
    return [row * columns + column]
  })
}

export function duplicateRow(paintedCells: number[], rows: number, columns: number, selectedRow: number, placement: 'before' | 'after') {
  const insertedRow = placement === 'before' ? selectedRow : selectedRow + 1
  const copiedCells = new Set<number>()

  for (const cellIndex of paintedCells) {
    const row = Math.floor(cellIndex / columns)
    const column = cellIndex % columns
    const destinationRow = row >= insertedRow ? row + 1 : row
    copiedCells.add(destinationRow * columns + column)

    if (row === selectedRow) copiedCells.add(insertedRow * columns + column)
  }

  return { rows: rows + 1, paintedCells: [...copiedCells].sort((left, right) => left - right) }
}

export function duplicateColumn(paintedCells: number[], rows: number, columns: number, selectedColumn: number, placement: 'before' | 'after') {
  const insertedColumn = placement === 'before' ? selectedColumn : selectedColumn + 1
  const copiedCells = new Set<number>()

  for (const cellIndex of paintedCells) {
    const row = Math.floor(cellIndex / columns)
    const column = cellIndex % columns
    const destinationColumn = column >= insertedColumn ? column + 1 : column
    copiedCells.add(row * (columns + 1) + destinationColumn)

    if (column === selectedColumn) copiedCells.add(row * (columns + 1) + insertedColumn)
  }

  return { columns: columns + 1, paintedCells: [...copiedCells].sort((left, right) => left - right) }
}

export function insertBlankRow(paintedCells: number[], columns: number, selectedRow: number, placement: 'before' | 'after') {
  const insertedRow = placement === 'before' ? selectedRow : selectedRow + 1
  const shiftedCells = paintedCells.map((cellIndex) => {
    const row = Math.floor(cellIndex / columns)
    const column = cellIndex % columns
    return (row >= insertedRow ? row + 1 : row) * columns + column
  })

  return { paintedCells: shiftedCells.sort((left, right) => left - right) }
}

export function insertBlankColumn(paintedCells: number[], columns: number, selectedColumn: number, placement: 'before' | 'after') {
  const insertedColumn = placement === 'before' ? selectedColumn : selectedColumn + 1
  const shiftedCells = paintedCells.map((cellIndex) => {
    const row = Math.floor(cellIndex / columns)
    const column = cellIndex % columns
    const destinationColumn = column >= insertedColumn ? column + 1 : column
    return row * (columns + 1) + destinationColumn
  })

  return { paintedCells: shiftedCells.sort((left, right) => left - right) }
}

export function removeRow(paintedCells: number[], rows: number, columns: number, selectedRow: number) {
  const nextRows = rows - 1
  const shiftedCells = paintedCells.flatMap((cellIndex) => {
    const row = Math.floor(cellIndex / columns)
    const column = cellIndex % columns
    if (row === selectedRow) return []
    return [(row > selectedRow ? row - 1 : row) * columns + column]
  })

  return { rows: nextRows, paintedCells: shiftedCells.sort((left, right) => left - right) }
}

export function removeColumn(paintedCells: number[], rows: number, columns: number, selectedColumn: number) {
  const nextColumns = columns - 1
  const shiftedCells = paintedCells.flatMap((cellIndex) => {
    const row = Math.floor(cellIndex / columns)
    const column = cellIndex % columns
    if (column === selectedColumn) return []
    return [row * nextColumns + (column > selectedColumn ? column - 1 : column)]
  })

  return { columns: nextColumns, paintedCells: shiftedCells.sort((left, right) => left - right) }
}

// Transformacoes equivalentes as acima, mas para mapas celula -> simbolo (usado no Tunisiano).
function mapEntries<T>(cellMap: Record<number, T>, columns: number) {
  return Object.entries(cellMap).map(([key, value]) => {
    const index = Number(key)
    return { row: Math.floor(index / columns), column: index % columns, value }
  })
}

function buildCellMap<T>(entries: { row: number; column: number; value: T }[], columns: number): Record<number, T> {
  const map: Record<number, T> = {}
  for (const entry of entries) map[entry.row * columns + entry.column] = entry.value
  return map
}

export function resizeCellMap<T>(cellMap: Record<number, T>, previousColumns: number, rows: number, columns: number): Record<number, T> {
  const entries = mapEntries(cellMap, previousColumns).filter((entry) => entry.row < rows && entry.column < columns)
  return buildCellMap(entries, columns)
}

export function duplicateRowInMap<T>(cellMap: Record<number, T>, columns: number, selectedRow: number, placement: 'before' | 'after'): Record<number, T> {
  const insertedRow = placement === 'before' ? selectedRow : selectedRow + 1
  const entries = mapEntries(cellMap, columns).flatMap((entry) => {
    const shiftedRow = entry.row >= insertedRow ? entry.row + 1 : entry.row
    const results = [{ ...entry, row: shiftedRow }]
    if (entry.row === selectedRow) results.push({ ...entry, row: insertedRow })
    return results
  })
  return buildCellMap(entries, columns)
}

export function duplicateColumnInMap<T>(cellMap: Record<number, T>, columns: number, selectedColumn: number, placement: 'before' | 'after'): Record<number, T> {
  const insertedColumn = placement === 'before' ? selectedColumn : selectedColumn + 1
  const entries = mapEntries(cellMap, columns).flatMap((entry) => {
    const shiftedColumn = entry.column >= insertedColumn ? entry.column + 1 : entry.column
    const results = [{ ...entry, column: shiftedColumn }]
    if (entry.column === selectedColumn) results.push({ ...entry, column: insertedColumn })
    return results
  })
  return buildCellMap(entries, columns + 1)
}

export function insertBlankRowInMap<T>(cellMap: Record<number, T>, columns: number, selectedRow: number, placement: 'before' | 'after'): Record<number, T> {
  const insertedRow = placement === 'before' ? selectedRow : selectedRow + 1
  const entries = mapEntries(cellMap, columns).map((entry) => ({ ...entry, row: entry.row >= insertedRow ? entry.row + 1 : entry.row }))
  return buildCellMap(entries, columns)
}

export function insertBlankColumnInMap<T>(cellMap: Record<number, T>, columns: number, selectedColumn: number, placement: 'before' | 'after'): Record<number, T> {
  const insertedColumn = placement === 'before' ? selectedColumn : selectedColumn + 1
  const entries = mapEntries(cellMap, columns).map((entry) => ({ ...entry, column: entry.column >= insertedColumn ? entry.column + 1 : entry.column }))
  return buildCellMap(entries, columns + 1)
}

export function removeRowFromMap<T>(cellMap: Record<number, T>, columns: number, selectedRow: number): Record<number, T> {
  const entries = mapEntries(cellMap, columns).flatMap((entry) => entry.row === selectedRow ? [] : [{ ...entry, row: entry.row > selectedRow ? entry.row - 1 : entry.row }])
  return buildCellMap(entries, columns)
}

export function removeColumnFromMap<T>(cellMap: Record<number, T>, columns: number, selectedColumn: number): Record<number, T> {
  const nextColumns = columns - 1
  const entries = mapEntries(cellMap, columns).flatMap((entry) => entry.column === selectedColumn ? [] : [{ ...entry, column: entry.column > selectedColumn ? entry.column - 1 : entry.column }])
  return buildCellMap(entries, nextColumns)
}
