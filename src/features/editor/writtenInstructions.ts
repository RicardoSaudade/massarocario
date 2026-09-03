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

    // Agrupa celulas iguais consecutivas para virar "N espacos, N blocos, ...".
    const runs: { token: string; count: number }[] = []
    for (const token of cells) {
      const lastRun = runs[runs.length - 1]
      if (lastRun && lastRun.token === token) lastRun.count += 1
      else runs.push({ token, count: 1 })
    }

    const description = runs
      .map(({ token, count }) => {
        if (token === '-') return `${count} ${count === 1 ? 'espaco' : 'espacos'}`
        const noun = count === 1 ? 'bloco' : 'blocos'
        return usedColors.length > 1 ? `${count} ${noun} ${token}` : `${count} ${noun}`
      })
      .join(', ')

    const direction = isRightToLeft ? '\u2192' : '\u2190'
    lines.push(`${carreira}. Carreira ${carreira} (${direction}): ${description}`)
  }

  return { legend, lines }
}
