import { Fragment, useEffect, useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react'
import { useAuth } from '../features/auth/AuthContext'
import { deleteChart, getEditorStorageMode, listCharts, saveChart } from '../features/editor/chartRepository'
import { createEmptyChart, DEFAULT_CELL_SIZE, DEFAULT_PAINT_COLOR, DEFAULT_TECHNIQUE, DEFAULT_TUNISIAN_STITCH, duplicateColumn, duplicateColumnInMap, duplicateRow, duplicateRowInMap, normalizeGridSizes, resizeCellMap, TECHNIQUE_OPTIONS, TUNISIAN_STITCH_OPTIONS, type CrochetChart, type CrochetTechnique, type TunisianStitch, GRID_COLUMNS, GRID_ROWS, resizePaintedCells } from '../features/editor/chartStorage'
import { rasterizeShapeToGrid, SHAPE_PRESETS } from '../features/editor/shapePresets'
import { stitchSymbols } from '../features/editor/stitchSymbols'
import { buildWrittenInstructions } from '../features/editor/writtenInstructions'
import { publicAsset } from '../lib/publicAsset'

type BrushMode = 'paint' | 'erase'
type TunisianTool = TunisianStitch | 'erase'
type ResizeTarget = { axis: 'row' | 'column'; index: number; startCoordinate: number; startSize: number } | null
type GridPosition = { row: number; column: number }
const STAMP_SIZE = 7
const ZOOM_STEP = 0.15
const ZOOM_MIN = 0.4
const ZOOM_MAX = 3

function formatTimestamp(timestamp: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp))
}

function buildChartName(name: string, savedCharts: CrochetChart[]) {
  const trimmedName = name.trim()
  if (trimmedName) return trimmedName
  return `Grafico ${savedCharts.length + 1}`
}

function downloadChartAsPng(name: string, paintedCells: number[], rows: number, columns: number, cellColors: Record<number, string>) {
  const cellSize = 28
  const padding = 28
  const axisSize = 32
  const width = axisSize + columns * cellSize + padding * 2
  const height = axisSize + rows * cellSize + padding * 2
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')
  if (!context) throw new Error('Nao foi possivel gerar a exportacao do grafico.')

  context.fillStyle = '#fcf8ee'
  context.fillRect(0, 0, width, height)

  context.fillStyle = '#243d3a'
  context.font = '12px "DM Mono", monospace'
  context.textAlign = 'center'
  context.textBaseline = 'middle'

  for (let column = 0; column < columns; column += 1) {
    const x = padding + axisSize + column * cellSize + cellSize / 2
    context.fillText(String(column + 1), x, padding + axisSize / 2)
  }

  for (let row = 0; row < rows; row += 1) {
    const y = padding + axisSize + row * cellSize + cellSize / 2
    context.fillText(String(row + 1), padding + axisSize / 2, y)
  }

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const cellIndex = row * columns + column
      const x = padding + axisSize + column * cellSize
      const y = padding + axisSize + row * cellSize
      context.fillStyle = paintedCells.includes(cellIndex) ? (cellColors[cellIndex] ?? '#101010') : '#ffffff'
      context.fillRect(x, y, cellSize, cellSize)
      context.strokeStyle = '#d7ccbc'
      context.strokeRect(x, y, cellSize, cellSize)
    }
  }

  const link = document.createElement('a')
  const fileName = `${name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'grafico'}.png`
  link.href = canvas.toDataURL('image/png')
  link.download = fileName
  link.click()
}

export function EditorPage() {
  const { user } = useAuth()
  const [savedCharts, setSavedCharts] = useState<CrochetChart[]>([])
  const [activeChartId, setActiveChartId] = useState<string | null>(null)
  const [chartName, setChartName] = useState('Meu grafico')
  const [paintedCells, setPaintedCells] = useState<number[]>([])
  const [rows, setRows] = useState(GRID_ROWS)
  const [columns, setColumns] = useState(GRID_COLUMNS)
  const [rowHeights, setRowHeights] = useState(() => Array(GRID_ROWS).fill(DEFAULT_CELL_SIZE))
  const [columnWidths, setColumnWidths] = useState(() => Array(GRID_COLUMNS).fill(DEFAULT_CELL_SIZE))
  const [notice, setNotice] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [brushMode, setBrushMode] = useState<BrushMode>('paint')
  const [isPointerDown, setIsPointerDown] = useState(false)
  const [resizeTarget, setResizeTarget] = useState<ResizeTarget>(null)
  const [showStitchLegend, setShowStitchLegend] = useState(false)
  const [technique, setTechnique] = useState<CrochetTechnique>(DEFAULT_TECHNIQUE)
  const [cellSymbols, setCellSymbols] = useState<Record<number, TunisianStitch>>({})
  const [tunisianTool, setTunisianTool] = useState<TunisianTool>(DEFAULT_TUNISIAN_STITCH)
  const [cellColors, setCellColors] = useState<Record<number, string>>({})
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null)
  const [showInstructions, setShowInstructions] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null)
  const [cursorPosition, setCursorPosition] = useState<GridPosition>({ row: 0, column: 0 })
  const [selectedStampId, setSelectedStampId] = useState<string | null>(null)
  const [stampMask, setStampMask] = useState<GridPosition[] | null>(null)
  const [stampPosition, setStampPosition] = useState<GridPosition | null>(null)
  const [zoom, setZoom] = useState(1)
  const gridShellRef = useRef<HTMLDivElement>(null)
  const gridFocusRef = useRef<HTMLDivElement>(null)
  const hasAutoFilledRef = useRef(false)

  useEffect(() => {
    return () => {
      if (profilePhotoUrl) URL.revokeObjectURL(profilePhotoUrl)
    }
  }, [profilePhotoUrl])

  // Intercepta o zoom nativo do navegador para escalar somente o grafico.
  useEffect(() => {
    const handleZoomShortcut = (event: globalThis.KeyboardEvent) => {
      if (!event.ctrlKey && !event.metaKey) return

      if (event.key === '+' || event.key === '=') {
        event.preventDefault()
        setZoom((current) => Math.min(ZOOM_MAX, Math.round((current + ZOOM_STEP) * 100) / 100))
        return
      }

      if (event.key === '-' || event.key === '_') {
        event.preventDefault()
        setZoom((current) => Math.max(ZOOM_MIN, Math.round((current - ZOOM_STEP) * 100) / 100))
        return
      }

      if (event.key === '0') {
        event.preventDefault()
        setZoom(1)
      }
    }

    window.addEventListener('keydown', handleZoomShortcut)
    return () => window.removeEventListener('keydown', handleZoomShortcut)
  }, [])

  useEffect(() => {
    if (!user) return

    listCharts(user)
      .then((charts) => {
        setLoadError('')
        setSavedCharts(charts)

        if (charts[0]) {
          setActiveChartId(charts[0].id)
          setChartName(charts[0].name)
          setPaintedCells(charts[0].paintedCells)
          setRows(charts[0].rows)
          setColumns(charts[0].columns)
          setRowHeights(normalizeGridSizes(charts[0].rowHeights, charts[0].rows))
          setColumnWidths(normalizeGridSizes(charts[0].columnWidths, charts[0].columns))
          setTechnique(charts[0].technique ?? DEFAULT_TECHNIQUE)
          setCellSymbols(charts[0].cellSymbols ?? {})
          setCellColors(charts[0].cellColors ?? {})
          return
        }

        const emptyChart = createEmptyChart('Meu primeiro grafico')
        setActiveChartId(emptyChart.id)
        setChartName(emptyChart.name)
        setPaintedCells(emptyChart.paintedCells)
        setRows(emptyChart.rows)
        setColumns(emptyChart.columns)
        setRowHeights(normalizeGridSizes(emptyChart.rowHeights, emptyChart.rows))
        setColumnWidths(normalizeGridSizes(emptyChart.columnWidths, emptyChart.columns))
        setTechnique(emptyChart.technique ?? DEFAULT_TECHNIQUE)
        setCellSymbols(emptyChart.cellSymbols ?? {})
        setCellColors(emptyChart.cellColors ?? {})
      })
      .catch((error) => {
        setLoadError(error instanceof Error ? error.message : 'Nao foi possivel carregar seus graficos.')
      })
  }, [user])

  const activeChart = useMemo(
    () => savedCharts.find((chart) => chart.id === activeChartId) ?? null,
    [activeChartId, savedCharts],
  )

  const gridCells = useMemo(
    () => Array.from({ length: rows * columns }, (_, index) => paintedCells.includes(index)),
    [columns, paintedCells, rows],
  )

  const applyBrushToCell = (cellIndex: number) => {
    setPaintedCells((currentCells) => {
      const isFilled = currentCells.includes(cellIndex)
      if (brushMode === 'paint') {
        return isFilled ? currentCells : [...currentCells, cellIndex].sort((left, right) => left - right)
      }

      return isFilled ? currentCells.filter((index) => index !== cellIndex) : currentCells
    })
    setCellColors((currentColors) => {
      if (brushMode === 'erase') {
        const nextColors = { ...currentColors }
        delete nextColors[cellIndex]
        return nextColors
      }

      return { ...currentColors, [cellIndex]: DEFAULT_PAINT_COLOR }
    })
  }

  const applyTunisianStitchToCell = (cellIndex: number) => {
    setCellSymbols((currentSymbols) => {
      const nextSymbols = { ...currentSymbols }
      if (tunisianTool === 'erase') delete nextSymbols[cellIndex]
      else nextSymbols[cellIndex] = tunisianTool
      return nextSymbols
    })
    setPaintedCells((currentCells) => {
      const isFilled = currentCells.includes(cellIndex)
      if (tunisianTool === 'erase') return isFilled ? currentCells.filter((index) => index !== cellIndex) : currentCells
      return isFilled ? currentCells : [...currentCells, cellIndex].sort((left, right) => left - right)
    })
  }

  const persistCharts = (nextCharts: CrochetChart[], nextActiveChartId: string, nextName: string, nextPaintedCells: number[], nextRows: number, nextColumns: number, nextTechnique: CrochetTechnique, nextCellSymbols: Record<number, TunisianStitch>, nextCellColors: Record<number, string>, message: string) => {
    setSavedCharts(nextCharts)
    setActiveChartId(nextActiveChartId)
    setChartName(nextName)
    setPaintedCells(nextPaintedCells)
    setRows(nextRows)
    setColumns(nextColumns)
    setTechnique(nextTechnique)
    setCellSymbols(nextCellSymbols)
    setCellColors(nextCellColors)
    setNotice(message)
  }

  const saveCurrentChart = async () => {
    if (!user) return

    const nextName = buildChartName(chartName, savedCharts)
    const nextTimestamp = new Date().toISOString()
    const nextChart = activeChart && savedCharts.some((chart) => chart.id === activeChart.id)
      ? { ...activeChart, name: nextName, updatedAt: nextTimestamp, paintedCells, rows, columns, rowHeights, columnWidths, technique, cellSymbols, cellColors }
      : {
          ...createEmptyChart(nextName, technique),
          id: activeChartId ?? createEmptyChart(nextName).id,
          name: nextName,
          paintedCells,
          rows,
          columns,
          rowHeights,
          columnWidths,
          technique,
          cellSymbols,
          cellColors,
          updatedAt: nextTimestamp,
        }

    try {
      setIsSaving(true)
      const nextCharts = await saveChart(user, nextChart)
      persistCharts(
        nextCharts,
        nextChart.id,
        nextName,
        paintedCells,
        rows,
        columns,
        technique,
        cellSymbols,
        cellColors,
        getEditorStorageMode() === 'supabase' ? 'Grafico salvo no banco do Supabase.' : 'Grafico salvo no historico local.',
      )
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Nao foi possivel salvar o grafico.')
    } finally {
      setIsSaving(false)
    }
  }

  const exportCurrentChart = () => {
    try {
      downloadChartAsPng(chartName, paintedCells, rows, columns, cellColors)
      setNotice('Grafico exportado em PNG.')
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Nao foi possivel exportar o grafico.')
    }
  }

  const startNewChart = () => {
    const emptyChart = createEmptyChart(`Grafico ${savedCharts.length + 1}`)
    setActiveChartId(emptyChart.id)
    setChartName(emptyChart.name)
    setPaintedCells([])
    setRows(emptyChart.rows)
    setColumns(emptyChart.columns)
    setRowHeights(normalizeGridSizes(emptyChart.rowHeights, emptyChart.rows))
    setColumnWidths(normalizeGridSizes(emptyChart.columnWidths, emptyChart.columns))
    setTechnique(emptyChart.technique ?? DEFAULT_TECHNIQUE)
    setCellSymbols({})
    setCellColors({})
    setSelectedShapeId(null)
    setCursorPosition({ row: 0, column: 0 })
    setSelectedStampId(null)
    setStampMask(null)
    setStampPosition(null)
    setBrushMode('paint')
    setNotice('Novo grafico pronto para edicao.')
  }

  const openSavedChart = (chart: CrochetChart) => {
    setActiveChartId(chart.id)
    setChartName(chart.name)
    setPaintedCells(chart.paintedCells)
    setRows(chart.rows)
    setColumns(chart.columns)
    setRowHeights(normalizeGridSizes(chart.rowHeights, chart.rows))
    setColumnWidths(normalizeGridSizes(chart.columnWidths, chart.columns))
    setTechnique(chart.technique ?? DEFAULT_TECHNIQUE)
    setCellSymbols(chart.cellSymbols ?? {})
    setCellColors(chart.cellColors ?? {})
    setSelectedShapeId(null)
    setCursorPosition({ row: 0, column: 0 })
    setSelectedStampId(null)
    setStampMask(null)
    setStampPosition(null)
    setNotice(`Editando ${chart.name}.`)
  }

  const updateDimensions = (nextRows: number, nextColumns: number) => {
    const validRows = Math.max(1, Math.min(80, nextRows))
    const validColumns = Math.max(1, Math.min(80, nextColumns))
    setPaintedCells((currentCells) => resizePaintedCells(currentCells, columns, validRows, validColumns))
    setCellSymbols((currentSymbols) => resizeCellMap(currentSymbols, columns, validRows, validColumns))
    setCellColors((currentColors) => resizeCellMap(currentColors, columns, validRows, validColumns))
    setRows(validRows)
    setColumns(validColumns)
    setRowHeights((currentSizes) => normalizeGridSizes(currentSizes, validRows))
    setColumnWidths((currentSizes) => normalizeGridSizes(currentSizes, validColumns))
  }

  // So preenche automaticamente um grafico ainda vazio, uma vez por grafico aberto, para nao sobrescrever desenhos existentes.
  useEffect(() => {
    hasAutoFilledRef.current = false
  }, [activeChartId])

  useEffect(() => {
    if (!activeTechniqueOption.gridReady) return
    if (paintedCells.length > 0) return
    if (hasAutoFilledRef.current) return

    const shell = gridShellRef.current
    if (!shell || shell.clientWidth === 0 || shell.clientHeight === 0) return

    const axisSize = 48
    const fittingColumns = Math.floor((shell.clientWidth - axisSize) / DEFAULT_CELL_SIZE)
    const fittingRows = Math.floor((shell.clientHeight - axisSize) / DEFAULT_CELL_SIZE)
    const nextColumns = Math.max(columns, Math.min(80, fittingColumns))
    const nextRows = Math.max(rows, Math.min(80, fittingRows))

    if (nextColumns > columns || nextRows > rows) {
      hasAutoFilledRef.current = true
      updateDimensions(nextRows, nextColumns)
    } else {
      hasAutoFilledRef.current = true
    }
  })

  const makeGridSquare = () => {
    const dimension = Math.max(rows, columns)
    updateDimensions(dimension, dimension)
    setRowHeights(Array(dimension).fill(DEFAULT_CELL_SIZE))
    setColumnWidths(Array(dimension).fill(DEFAULT_CELL_SIZE))
    setNotice(`Grade ajustada para ${dimension} por ${dimension}.`)
  }

  const duplicateSelectedRow = (selectedRow: number) => {
    if (rows >= 80) {
      setNotice('O limite de 80 linhas foi atingido.')
      return
    }

    const nextGrid = duplicateRow(paintedCells, rows, columns, selectedRow, 'after')
    setRows(nextGrid.rows)
    setPaintedCells(nextGrid.paintedCells)
    setCellSymbols((currentSymbols) => duplicateRowInMap(currentSymbols, columns, selectedRow, 'after'))
    setCellColors((currentColors) => duplicateRowInMap(currentColors, columns, selectedRow, 'after'))
    setRowHeights((currentSizes) => {
      const nextSizes = [...currentSizes]
      nextSizes.splice(selectedRow + 1, 0, currentSizes[selectedRow] ?? DEFAULT_CELL_SIZE)
      return nextSizes
    })
    setNotice(`Linha ${selectedRow + 1} duplicada abaixo.`)
  }

  const duplicateSelectedColumn = (selectedColumn: number) => {
    if (columns >= 80) {
      setNotice('O limite de 80 colunas foi atingido.')
      return
    }

    const nextGrid = duplicateColumn(paintedCells, rows, columns, selectedColumn, 'after')
    setColumns(nextGrid.columns)
    setPaintedCells(nextGrid.paintedCells)
    setCellSymbols((currentSymbols) => duplicateColumnInMap(currentSymbols, columns, selectedColumn, 'after'))
    setCellColors((currentColors) => duplicateColumnInMap(currentColors, columns, selectedColumn, 'after'))
    setColumnWidths((currentSizes) => {
      const nextSizes = [...currentSizes]
      nextSizes.splice(selectedColumn + 1, 0, currentSizes[selectedColumn] ?? DEFAULT_CELL_SIZE)
      return nextSizes
    })
    setNotice(`Coluna ${selectedColumn + 1} duplicada a direita.`)
  }

  const removeCurrentChart = async () => {
    if (!user || !activeChart) {
      setNotice('Salve um grafico antes de tentar remover.')
      return
    }

    if (!window.confirm(`Remover ${activeChart.name}?`)) return

    try {
      const nextCharts = await deleteChart(user, activeChart.id)
      const nextActiveChart = nextCharts[0] ?? createEmptyChart(`Grafico ${nextCharts.length + 1}`)
      persistCharts(
        nextCharts,
        nextActiveChart.id,
        nextActiveChart.name,
        nextActiveChart.paintedCells,
          nextActiveChart.rows,
          nextActiveChart.columns,
        nextActiveChart.technique ?? DEFAULT_TECHNIQUE,
        nextActiveChart.cellSymbols ?? {},
        nextActiveChart.cellColors ?? {},
        getEditorStorageMode() === 'supabase' ? 'Grafico removido do Supabase.' : 'Grafico removido do historico local.',
      )
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Nao foi possivel remover o grafico.')
    }
  }

  const activeTechniqueOption = TECHNIQUE_OPTIONS.find((option) => option.value === technique) ?? TECHNIQUE_OPTIONS[0]

  const handleTechniqueChange = (nextTechnique: CrochetTechnique) => {
    if (nextTechnique === technique) return

    const nextOption = TECHNIQUE_OPTIONS.find((option) => option.value === nextTechnique)
    setTechnique(nextTechnique)
    setNotice(`Tecnica alterada para ${nextOption?.label ?? nextTechnique}. ${nextOption?.description ?? ''}`.trim())
  }

  const applyShapePreset = async (presetId: string, targetColumns: number) => {
    const preset = SHAPE_PRESETS.find((option) => option.id === presetId)
    if (!preset) return

    try {
      setNotice(`Gerando grade a partir do formato "${preset.label}"...`)
      const targetRows = Math.max(1, Math.min(80, Math.round(targetColumns / preset.aspectRatio)))
      const nextPaintedCells = await rasterizeShapeToGrid(preset.src, targetColumns, targetRows)
      setRows(targetRows)
      setColumns(targetColumns)
      setPaintedCells(nextPaintedCells)
      setCellColors({})
      setCellSymbols({})
      setRowHeights(Array(targetRows).fill(DEFAULT_CELL_SIZE))
      setColumnWidths(Array(targetColumns).fill(DEFAULT_CELL_SIZE))
      setNotice(`Formato "${preset.label}" aplicado com ${targetColumns} colunas.`)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Nao foi possivel aplicar o formato.')
    }
  }

  const handleShapeChange = (nextShapeId: string) => {
    if (nextShapeId === (selectedShapeId ?? 'none')) return

    if (nextShapeId === 'none') {
      setSelectedShapeId(null)
      setNotice('Formato removido. A grade atual foi mantida.')
      return
    }

    setSelectedShapeId(nextShapeId)
    void applyShapePreset(nextShapeId, columns)
  }

  const handleColumnsFieldChange = (nextColumnsRaw: number) => {
    const nextColumns = Math.max(1, Math.min(80, nextColumnsRaw))
    if (selectedShapeId) {
      void applyShapePreset(selectedShapeId, nextColumns)
      return
    }

    updateDimensions(rows, nextColumns)
  }

  const handleProfilePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (profilePhotoUrl) URL.revokeObjectURL(profilePhotoUrl)
    setProfilePhotoUrl(URL.createObjectURL(file))
  }

  const cancelStamp = () => {
    setSelectedStampId(null)
    setStampMask(null)
    setStampPosition(null)
  }

  const handleSelectStamp = async (presetId: string) => {
    if (presetId === (selectedStampId ?? 'none')) {
      cancelStamp()
      return
    }

    const preset = SHAPE_PRESETS.find((option) => option.id === presetId)
    if (!preset) return

    try {
      const paintedOffsets = await rasterizeShapeToGrid(preset.src, STAMP_SIZE, STAMP_SIZE)
      const mask = paintedOffsets.map((index) => ({ row: Math.floor(index / STAMP_SIZE), column: index % STAMP_SIZE }))
      setSelectedStampId(presetId)
      setStampMask(mask)
      setStampPosition({
        row: Math.max(0, Math.min(rows - 1, Math.floor(rows / 2) - Math.floor(STAMP_SIZE / 2))),
        column: Math.max(0, Math.min(columns - 1, Math.floor(columns / 2) - Math.floor(STAMP_SIZE / 2))),
      })
      setNotice(`Carimbo "${preset.label}" selecionado. Use as setas para mover e Enter para aplicar na grade.`)
      gridFocusRef.current?.focus()
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Nao foi possivel carregar o carimbo.')
    }
  }

  const stampCells = useMemo(() => {
    const cells = new Set<number>()
    if (!selectedStampId || !stampMask || !stampPosition) return cells

    for (const offset of stampMask) {
      const cellRow = stampPosition.row + offset.row
      const cellColumn = stampPosition.column + offset.column
      if (cellRow >= 0 && cellRow < rows && cellColumn >= 0 && cellColumn < columns) cells.add(cellRow * columns + cellColumn)
    }

    return cells
  }, [columns, rows, selectedStampId, stampMask, stampPosition])

  const moveCursorOrStamp = (deltaRow: number, deltaColumn: number) => {
    if (selectedStampId) {
      setStampPosition((current) => {
        const base = current ?? { row: 0, column: 0 }
        return {
          row: Math.max(0, Math.min(rows - 1, base.row + deltaRow)),
          column: Math.max(0, Math.min(columns - 1, base.column + deltaColumn)),
        }
      })
      return
    }

    setCursorPosition((current) => ({
      row: Math.max(0, Math.min(rows - 1, current.row + deltaRow)),
      column: Math.max(0, Math.min(columns - 1, current.column + deltaColumn)),
    }))
  }

  const confirmSelection = () => {
    if (selectedStampId && stampCells.size > 0) {
      setPaintedCells((currentCells) => [...new Set([...currentCells, ...stampCells])].sort((left, right) => left - right))
      setCellColors((currentColors) => {
        const nextColors = { ...currentColors }
        stampCells.forEach((cellIndex) => { nextColors[cellIndex] = DEFAULT_PAINT_COLOR })
        return nextColors
      })
      setNotice('Carimbo aplicado na grade.')
      return
    }

    const cellIndex = cursorPosition.row * columns + cursorPosition.column
    if (technique === 'tunisian') applyTunisianStitchToCell(cellIndex)
    else applyBrushToCell(cellIndex)
  }

  const handleGridKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const keyActions: Record<string, () => void> = {
      ArrowUp: () => moveCursorOrStamp(-1, 0),
      ArrowDown: () => moveCursorOrStamp(1, 0),
      ArrowLeft: () => moveCursorOrStamp(0, -1),
      ArrowRight: () => moveCursorOrStamp(0, 1),
      Enter: confirmSelection,
      Escape: cancelStamp,
    }

    const action = keyActions[event.key]
    if (!action) return
    event.preventDefault()
    action()
  }

  const writtenInstructions = useMemo(
    () => buildWrittenInstructions(rows, columns, paintedCells, cellColors),
    [cellColors, columns, paintedCells, rows],
  )

  return (
    <section
      className="editor-page"
      aria-labelledby="editor-title"
      onPointerMove={(event) => {
        if (!resizeTarget) return
        const coordinate = resizeTarget.axis === 'column' ? event.clientX : event.clientY
        const nextSize = Math.max(18, Math.min(96, resizeTarget.startSize + (coordinate - resizeTarget.startCoordinate) / zoom))
        if (resizeTarget.axis === 'column') setColumnWidths((currentSizes) => currentSizes.map((size, index) => index === resizeTarget.index ? nextSize : size))
        else setRowHeights((currentSizes) => currentSizes.map((size, index) => index === resizeTarget.index ? nextSize : size))
      }}
      onPointerUp={() => { setIsPointerDown(false); setResizeTarget(null) }}
      onPointerLeave={() => { setIsPointerDown(false); setResizeTarget(null) }}
    >
      <aside className="editor-sidebar">
        <div className="editor-sidebar__header">
          {user && (
            <label className="editor-sidebar__profile-upload" title="Enviar foto de perfil">
              {profilePhotoUrl ? (
                <img className="editor-sidebar__profile" src={profilePhotoUrl} alt="Sua foto de perfil" />
              ) : (
                <span className="editor-sidebar__profile editor-sidebar__profile--placeholder" aria-hidden="true">+</span>
              )}
              <input type="file" accept="image/*" className="sr-only" onChange={handleProfilePhotoChange} />
            </label>
          )}
          <div>
            <p className="eyebrow">area da criadora</p>
            <h1 id="editor-title">Seus graficos</h1>
          </div>
        </div>
        <p className="editor-sidebar__copy">{getEditorStorageMode() === 'supabase' ? 'Cada usuario salva aqui o proprio historico no banco do Supabase.' : 'Cada usuario salva aqui o proprio historico. Nesta primeira fase, tudo fica guardado localmente no navegador.'}</p>
        <button className="button button--primary editor-sidebar__action" type="button" onClick={startNewChart}>Novo grafico</button>

        <div className="editor-sidebar__collapsible">
          <button className="editor-sidebar__collapsible-toggle" type="button" onClick={() => setShowHistory((current) => !current)} aria-expanded={showHistory}>
            Historico {showHistory ? '\u25b2' : '\u25bc'}
          </button>
          {showHistory && (
            <div className="editor-history" aria-label="Historico de graficos salvos">
              {loadError && <p className="editor-history__empty" role="alert">{loadError}</p>}
              {savedCharts.length === 0 ? (
                <p className="editor-history__empty">Ainda nao ha graficos salvos. Monte o primeiro desenho e clique em salvar.</p>
              ) : (
                savedCharts.map((chart) => (
                  <button
                    key={chart.id}
                    className={chart.id === activeChartId ? 'history-card history-card--active' : 'history-card'}
                    type="button"
                    onClick={() => openSavedChart(chart)}
                  >
                    <div className="history-card__preview" aria-hidden="true">
                      {Array.from({ length: 64 }, (_, previewIndex) => {
                        const sourceRow = Math.min(chart.rows - 1, Math.floor(previewIndex / 8) * Math.ceil(chart.rows / 8))
                        const sourceColumn = Math.min(chart.columns - 1, (previewIndex % 8) * Math.ceil(chart.columns / 8))
                        const sourceIndex = sourceRow * chart.columns + sourceColumn
                        const filled = chart.paintedCells.includes(sourceIndex)
                        return <span key={previewIndex} className={filled ? 'history-card__pixel history-card__pixel--filled' : 'history-card__pixel'} />
                      })}
                    </div>
                    <div className="history-card__meta">
                      <strong>{chart.name}</strong>
                      <span>{chart.paintedCells.length} pontos preenchidos</span>
                      <span>Atualizado em {formatTimestamp(chart.updatedAt)}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {activeTechniqueOption.gridReady && (
          <div className="editor-sidebar__tools">
            <div className="editor-toolbar__group" aria-label="Ferramentas de desenho">
              <span className="editor-toolbar__group-label">Ferramentas</span>
              <div className="editor-toolbar__group-controls">
                {technique === 'tunisian' ? (
                  <>
                    {TUNISIAN_STITCH_OPTIONS.map((option) => (
                      <button key={option.value} className={tunisianTool === option.value ? 'tool-button tool-button--active' : 'tool-button'} type="button" onClick={() => setTunisianTool(option.value)}>{option.label}</button>
                    ))}
                    <button className={tunisianTool === 'erase' ? 'tool-button tool-button--active' : 'tool-button'} type="button" onClick={() => setTunisianTool('erase')}>Apagar</button>
                  </>
                ) : (
                  <>
                    <button className={brushMode === 'paint' ? 'tool-button tool-button--active' : 'tool-button'} type="button" onClick={() => setBrushMode('paint')}>Pintar</button>
                    <button className={brushMode === 'erase' ? 'tool-button tool-button--active' : 'tool-button'} type="button" onClick={() => setBrushMode('erase')}>Apagar</button>
                  </>
                )}
              </div>
            </div>
            <div className="editor-toolbar__group" aria-label="Tamanho da grade">
              <span className="editor-toolbar__group-label">Grade</span>
              <div className="editor-toolbar__group-controls editor-toolbar__group-controls--dimensions">
                <label>Linhas <input type="number" min="1" max="80" value={rows} onChange={(event) => updateDimensions(Number(event.target.value), columns)} /></label>
                <label>{selectedShapeId ? 'Largura do padrao' : 'Colunas'} <input type="number" min="1" max="80" value={columns} onChange={(event) => handleColumnsFieldChange(Number(event.target.value))} /></label>
                <button className="tool-button" type="button" onClick={makeGridSquare}>Quadrado</button>
              </div>
            </div>
            <div className="editor-toolbar__group" aria-label="Formato pronto">
              <span className="editor-toolbar__group-label">Forma</span>
              <div className="editor-toolbar__group-controls">
                <select
                  className="editor-toolbar__technique"
                  value={selectedShapeId ?? 'none'}
                  onChange={(event) => handleShapeChange(event.target.value)}
                >
                  <option value="none">Nenhum (desenho livre)</option>
                  {SHAPE_PRESETS.map((preset) => (
                    <option key={preset.id} value={preset.id}>{preset.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="editor-toolbar__group" aria-label="Carimbos">
              <span className="editor-toolbar__group-label">Carimbos</span>
              <div className="stamp-picker">
                {SHAPE_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    className={selectedStampId === preset.id ? 'stamp-button stamp-button--active' : 'stamp-button'}
                    onClick={() => void handleSelectStamp(preset.id)}
                    title={preset.label}
                  >
                    <img src={publicAsset(preset.src)} alt={preset.label} width={28} height={28} />
                  </button>
                ))}
              </div>
              {selectedStampId && <p className="editor-toolbar__hint-small">Setas movem o carimbo. Enter aplica. Esc cancela.</p>}
            </div>
            <div className="editor-toolbar__group" aria-label="Acoes extras">
              <span className="editor-toolbar__group-label">Extras</span>
              <div className="editor-toolbar__group-controls">
                <button className="tool-button" type="button" onClick={() => { setPaintedCells([]); setCellColors({}); setNotice('Grade limpa. Salve para atualizar o historico.'); }}>Limpar</button>
                <button className="tool-button" type="button" onClick={exportCurrentChart}>Exportar PNG</button>
                <button className={showStitchLegend ? 'tool-button tool-button--active' : 'tool-button'} type="button" onClick={() => setShowStitchLegend((current) => !current)}>Legenda de pontos</button>
                <button className={showInstructions ? 'tool-button tool-button--active' : 'tool-button'} type="button" onClick={() => setShowInstructions((current) => !current)}>Instrucoes escritas</button>
              </div>
            </div>
          </div>
        )}
      </aside>
      <div className="editor-workspace">
        <div className="editor-toolbar">
          <div className="editor-toolbar__row editor-toolbar__row--primary">
            <div className="editor-toolbar__group editor-toolbar__group--grow">
              <label className="editor-toolbar__label" htmlFor="chart-name">Nome do grafico</label>
              <input id="chart-name" className="editor-toolbar__name" value={chartName} onChange={(event) => setChartName(event.target.value)} />
            </div>
            <div className="editor-toolbar__group">
              <label className="editor-toolbar__label" htmlFor="chart-technique">Tecnica</label>
              <select
                id="chart-technique"
                className="editor-toolbar__technique"
                value={technique}
                onChange={(event) => handleTechniqueChange(event.target.value as CrochetTechnique)}
              >
                {TECHNIQUE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div className="editor-toolbar__group editor-toolbar__group--actions">
              <button className="button button--secondary" type="button" onClick={() => void removeCurrentChart()}>Excluir</button>
              <button className="button button--primary" type="button" onClick={() => void saveCurrentChart()} disabled={isSaving}>{isSaving ? 'Salvando...' : 'Salvar'}</button>
            </div>
          </div>
        </div>

        {activeTechniqueOption.gridReady ? (
          <>
            <div className="editor-summary">
              <p><strong>{rows}</strong> linhas</p>
              <p><strong>{columns}</strong> colunas</p>
              <p><strong>{paintedCells.length}</strong> celulas pintadas</p>
              <p><strong>{Math.round(zoom * 100)}%</strong> de zoom</p>
            </div>
            <div className="chart-grid-shell" ref={gridShellRef}>
              <div
                className="chart-grid"
                ref={gridFocusRef}
                tabIndex={0}
                onKeyDown={handleGridKeyDown}
                style={{
                  gridTemplateColumns: `${3 * zoom}rem ${columnWidths.map((width) => `${width * zoom}px`).join(' ')}`,
                  gridTemplateRows: `${3 * zoom}rem ${rowHeights.map((height) => `${height * zoom}px`).join(' ')}`,
                  fontSize: `${zoom}rem`,
                }}
              >
                <span className="chart-grid__corner" aria-hidden="true" />
                {Array.from({ length: columns }, (_, column) => (
                  <button key={`column-${column + 1}`} type="button" className="chart-grid__axis" title="Duplo clique para duplicar esta coluna" onDoubleClick={() => duplicateSelectedColumn(column)}>
                    {column + 1}
                    <span className="chart-grid__resize-handle chart-grid__resize-handle--column" onPointerDown={(event) => { event.stopPropagation(); setResizeTarget({ axis: 'column', index: column, startCoordinate: event.clientX, startSize: columnWidths[column] }) }} />
                  </button>
                ))}
                {Array.from({ length: rows }, (_, row) => (
                  <Fragment key={`row-${row + 1}`}>
                    <button key={`row-label-${row + 1}`} type="button" className="chart-grid__axis chart-grid__axis--row" title="Duplo clique para duplicar esta linha" onDoubleClick={() => duplicateSelectedRow(row)}>
                      {row + 1}
                      <span className="chart-grid__resize-handle chart-grid__resize-handle--row" onPointerDown={(event) => { event.stopPropagation(); setResizeTarget({ axis: 'row', index: row, startCoordinate: event.clientY, startSize: rowHeights[row] }) }} />
                    </button>
                    {Array.from({ length: columns }, (_, column) => {
                      const cellIndex = row * columns + column
                      const painted = gridCells[cellIndex]
                      const stitchSymbol = cellSymbols[cellIndex]
                      const isTunisian = technique === 'tunisian'
                      const isCursorCell = !selectedStampId && cursorPosition.row === row && cursorPosition.column === column
                      const isStampPreviewCell = stampCells.has(cellIndex)

                      const cellClassNames = [
                        'chart-grid__cell',
                        isTunisian && stitchSymbol ? `chart-grid__cell--tunisian chart-grid__cell--tunisian-${stitchSymbol}` : '',
                        !isTunisian && painted ? 'chart-grid__cell--painted' : '',
                        isCursorCell ? 'chart-grid__cell--cursor' : '',
                        isStampPreviewCell ? 'chart-grid__cell--stamp-preview' : '',
                      ].filter(Boolean).join(' ')

                      return (
                        <button
                          key={`cell-${row + 1}-${column + 1}`}
                          type="button"
                          className={cellClassNames}
                          style={!isTunisian && painted ? { backgroundColor: cellColors[cellIndex] ?? DEFAULT_PAINT_COLOR } : undefined}
                          aria-label={`Linha ${row + 1}, coluna ${column + 1}${isTunisian ? (stitchSymbol ? `, ${stitchSymbol}` : ', vazia') : (painted ? ', preenchida' : ', vazia')}`}
                          onPointerDown={() => {
                            setIsPointerDown(true)
                            setCursorPosition({ row, column })
                            if (isTunisian) applyTunisianStitchToCell(cellIndex)
                            else applyBrushToCell(cellIndex)
                          }}
                          onPointerEnter={() => {
                            if (!isPointerDown) return
                            if (isTunisian) applyTunisianStitchToCell(cellIndex)
                            else applyBrushToCell(cellIndex)
                          }}
                        >
                          {isTunisian && stitchSymbol ? stitchSymbol : null}
                        </button>
                      )
                    })}
                  </Fragment>
                ))}
              </div>
            </div>
            <p className="editor-workspace__hint">Clique na grade e use as setas do teclado para navegar quadrado por quadrado; Enter marca a celula selecionada. Ctrl + e Ctrl - aplicam zoom apenas no grafico (Ctrl 0 volta ao normal). Duplo clique no numero de uma linha ou coluna duplica ela com o desenho. Salvar guarda o estado atual por usuario em {getEditorStorageMode() === 'supabase' ? 'um registro no Supabase' : 'localStorage'}.</p>
            {showStitchLegend && (
              <div className="stitch-legend" aria-label="Legenda de pontos de croche">
                {stitchSymbols.map((symbol) => (
                  <div className="stitch-legend__item" key={symbol.key}>
                    <img className="stitch-legend__icon" src={publicAsset(symbol.icon)} alt="" width={32} height={32} />
                    <div className="stitch-legend__meta">
                      <strong>{symbol.name}</strong>
                      <span>{symbol.abbreviationPtBr} / {symbol.abbreviationEn}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {showInstructions && (
              <div className="written-instructions" aria-label="Instrucoes escritas do grafico">
                <p className="written-instructions__title">Instrucoes escritas ({rows} carreiras)</p>
                <p className="written-instructions__hint">Trabalhado de baixo para cima. A carreira 1 e a ultima linha exibida na grade; a direcao alterna a cada carreira.</p>
                {writtenInstructions.legend && <p className="written-instructions__legend">{writtenInstructions.legend}</p>}
                <div className="written-instructions__body">
                  {writtenInstructions.lines.map((line, index) => (
                    <p key={index}>{line}</p>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="editor-technique-placeholder">
            <p className="eyebrow">editor em construcao</p>
            <h2>{activeTechniqueOption.label}</h2>
            <p>{activeTechniqueOption.description}</p>
            <button className="button button--secondary" type="button" onClick={() => handleTechniqueChange('filet')}>Voltar para Filet</button>
          </div>
        )}
        {notice && <p className="editor-workspace__notice" role="status">{notice}</p>}
      </div>
    </section>
  )
}
