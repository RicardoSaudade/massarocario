import { getColorLabel } from './chartStorage'

export type WrittenInstructions = {
  legend: string
  lines: string[]
}

// Mesma convencao documentada em massarocario-mcp/knowledge/massarocario-model.md:
// a ultima linha exibida vira a carreira 1, e a direcao alterna a cada carreira.
export function buildWrittenInstructions(rows: number, columns: number, paintedCells: number[], cellColors: Record<number, string>): WrittenInstructions {
  const painted = new Set(paintedCells)
  const usedColors = [...new Set(Object.values(cellColors))]
  const codeByColor = new Map(usedColors.map((color, index) => [color, usedColors.length > 1 ? `C${index + 1}` : 'X']))

  const legend = usedColors.length > 1
    ? usedColors.map((color) => `${codeByColor.get(color)} = ${getColorLabel(color)}`).join('  |  ')
    : ''

  const lines: string[] = []

  for (let carreira = 1; carreira <= rows; carreira += 1) {
    const displayedRow = rows - carreira
    const isRightToLeft = carreira % 2 === 1
    const columnOrder = isRightToLeft
      ? Array.from({ length: columns }, (_, index) => columns - 1 - index)
      : Array.from({ length: columns }, (_, index) => index)

    const cells = columnOrder.map((column) => {
      const cellIndex = displayedRow * columns + column
      if (!painted.has(cellIndex)) return '-'
      const color = cellColors[cellIndex]
      return color ? (codeByColor.get(color) ?? 'X') : 'X'
    })

    const direction = isRightToLeft ? 'direita -> esquerda' : 'esquerda -> direita'
    lines.push(`Carreira ${carreira} (${direction}): ${cells.join(' ')}`)
  }

  return { legend, lines }
}
