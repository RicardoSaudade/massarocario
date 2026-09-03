import { publicAsset } from '../../lib/publicAsset'

export type ShapePreset = {
  id: string
  label: string
  src: string
  aspectRatio: number
}

// Silhuetas prontas para preencher a grade sem precisar buscar imagem na internet.
export const SHAPE_PRESETS: ShapePreset[] = [
  { id: 'star', label: 'Estrela', src: 'assets/patterns/star.svg', aspectRatio: 1 },
  { id: 'heart', label: 'Coracao', src: 'assets/patterns/heart.svg', aspectRatio: 1 },
  { id: 'flower', label: 'Flor', src: 'assets/patterns/flower.svg', aspectRatio: 1 },
  { id: 'circle', label: 'Circulo', src: 'assets/patterns/circle.svg', aspectRatio: 1 },
  { id: 'diamond', label: 'Losango', src: 'assets/patterns/diamond.svg', aspectRatio: 1 },
  { id: 'triangle', label: 'Triangulo', src: 'assets/patterns/triangle.svg', aspectRatio: 1 },
  { id: 'cross', label: 'Cruz', src: 'assets/patterns/cross.svg', aspectRatio: 1 },
  { id: 'moon', label: 'Lua', src: 'assets/patterns/moon.svg', aspectRatio: 1 },
  { id: 'leaf', label: 'Folha', src: 'assets/patterns/leaf.svg', aspectRatio: 1 },
  { id: 'butterfly', label: 'Borboleta', src: 'assets/patterns/butterfly.svg', aspectRatio: 1 },
  { id: 'paw', label: 'Patinha', src: 'assets/patterns/paw.svg', aspectRatio: 1 },
]

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Nao foi possivel carregar a imagem do formato.'))
    image.src = publicAsset(src)
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
