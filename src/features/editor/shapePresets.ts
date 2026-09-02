export type ShapePreset = {
  id: string
  label: string
  src: string
  aspectRatio: number
}

// Silhuetas prontas para preencher a grade sem precisar buscar imagem na internet.
export const SHAPE_PRESETS: ShapePreset[] = [
  { id: 'star', label: 'Estrela', src: '/assets/patterns/star.svg', aspectRatio: 1 },
  { id: 'heart', label: 'Coracao', src: '/assets/patterns/heart.svg', aspectRatio: 1 },
  { id: 'flower', label: 'Flor', src: '/assets/patterns/flower.svg', aspectRatio: 1 },
]

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Nao foi possivel carregar a imagem do formato.'))
    image.src = src
  })
}

// Desenha o SVG num canvas do tamanho da grade escolhida e marca como pintada cada celula com pixel opaco.
export async function rasterizeShapeToGrid(src: string, columns: number, rows: number): Promise<number[]> {
  const image = await loadImage(src)
  const canvas = document.createElement('canvas')
  canvas.width = columns
  canvas.height = rows

  const context = canvas.getContext('2d')
  if (!context) throw new Error('Nao foi possivel processar a imagem do formato.')

  context.clearRect(0, 0, columns, rows)
  context.drawImage(image, 0, 0, columns, rows)

  const { data } = context.getImageData(0, 0, columns, rows)
  const paintedCells: number[] = []

  for (let index = 0; index < columns * rows; index += 1) {
    const alpha = data[index * 4 + 3]
    if (alpha > 128) paintedCells.push(index)
  }

  return paintedCells
}
