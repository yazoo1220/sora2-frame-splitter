export type Orientation = 'portrait' | 'landscape'
export type GridLayoutType = '1x1' | '2x2' | '3x3'
export type TextPosition = 'over' | 'under'

export interface ImageWithText {
  img: HTMLImageElement
  text: string
  textPosition?: TextPosition
}

export interface ResizeResult {
  width: number
  height: number
  offsetX: number
  offsetY: number
}

export interface GridPosition {
  row: number
  col: number
  x: number
  y: number
}

export interface GridLayout {
  rows: number
  cols: number
  cellWidth: number
  cellHeight: number
  outputWidth: number
  outputHeight: number
  positions: GridPosition[]
}

/**
 * 画像を指定サイズにリサイズ（アスペクト比維持）
 */
export function resizeImageToFit(
  img: HTMLImageElement,
  targetWidth: number,
  targetHeight: number
): ResizeResult {
  const imgAspect = img.width / img.height
  const targetAspect = targetWidth / targetHeight

  let width: number
  let height: number
  let offsetX: number
  let offsetY: number

  if (imgAspect > targetAspect) {
    // 画像が横長：幅に合わせる
    width = targetWidth
    height = targetWidth / imgAspect
    offsetX = 0
    offsetY = (targetHeight - height) / 2
  } else {
    // 画像が縦長：高さに合わせる
    width = targetHeight * imgAspect
    height = targetHeight
    offsetX = (targetWidth - width) / 2
    offsetY = 0
  }

  return { width, height, offsetX, offsetY }
}

/**
 * グリッドレイアウトを計算
 */
export function calculateGridLayout(
  imageCount: number,
  orientation: Orientation,
  layoutType: GridLayoutType = '3x3'
): GridLayout {
  // レイアウトタイプに応じたグリッドサイズを決定
  let MAX_COLS: number
  let MAX_ROWS: number
  
  switch (layoutType) {
    case '1x1':
      MAX_COLS = 1
      MAX_ROWS = 1
      break
    case '2x2':
      MAX_COLS = 2
      MAX_ROWS = 2
      break
    case '3x3':
      MAX_COLS = 3
      MAX_ROWS = 3
      break
    default:
      MAX_COLS = 3
      MAX_ROWS = 3
  }

  const outputWidth = orientation === 'portrait' ? 1080 : 1920
  const outputHeight = orientation === 'portrait' ? 1920 : 1080

  const cellWidth = outputWidth / MAX_COLS
  const cellHeight = outputHeight / MAX_ROWS

  const rows = Math.ceil(imageCount / MAX_COLS)
  const cols = Math.min(imageCount, MAX_COLS)

  const positions: GridPosition[] = []
  for (let i = 0; i < imageCount; i++) {
    const row = Math.floor(i / MAX_COLS)
    const col = i % MAX_COLS
    positions.push({
      row,
      col,
      x: col * cellWidth,
      y: row * cellHeight,
    })
  }

  return {
    rows: MAX_ROWS,
    cols: MAX_COLS,
    cellWidth,
    cellHeight,
    outputWidth,
    outputHeight,
    positions,
  }
}

/**
 * 画像を余白付きで描画
 */
export function drawImageWithPadding(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  cellWidth: number,
  cellHeight: number,
  textPosition: TextPosition = 'over'
): void {
  // 背景を白で塗りつぶし
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(x, y, cellWidth, cellHeight)

  // 画像がロード済みかつ有効か確認
  if (!img.complete) {
    return
  }

  // 画像がエラー状態（broken state）でないか確認
  if (img.naturalWidth === 0 || img.naturalHeight === 0) {
    return
  }

  // テキスト位置に応じて画像描画領域を調整
  let imageAreaHeight = cellHeight
  let imageAreaY = y
  
  if (textPosition === 'under') {
    // テキストが下の場合、画像はセルの85%を使用
    imageAreaHeight = cellHeight * 0.85
    imageAreaY = y
  }

  // 画像をリサイズして中央配置
  const resize = resizeImageToFit(img, cellWidth, imageAreaHeight)

  try {
    ctx.drawImage(
      img,
      x + resize.offsetX,
      imageAreaY + resize.offsetY,
      resize.width,
      resize.height
    )
  } catch (error) {
    // 画像がエラー状態の場合はスキップ
    console.warn('Failed to draw image:', error)
  }
}

/**
 * テキストオーバーレイを描画
 */
export function drawTextOverlay(
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  y: number,
  fontSize: number,
  position: TextPosition = 'over'
): void {
  if (!text) {
    return
  }

  ctx.save()

  // フォント設定（位置が下の場合は少し小さめ）
  const adjustedFontSize = position === 'under' ? fontSize * 0.8 : fontSize
  ctx.font = `bold ${adjustedFontSize}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = position === 'under' ? 'bottom' : 'top'

  // 影の設定
  ctx.shadowOffsetX = 2
  ctx.shadowOffsetY = 2
  ctx.shadowBlur = 4
  ctx.shadowColor = '#000000'

  // テキストを描画（影付き）
  ctx.strokeStyle = '#000000'
  ctx.lineWidth = 3
  ctx.strokeText(text, centerX, y)

  ctx.fillStyle = '#FFFFFF'
  ctx.fillText(text, centerX, y)

  ctx.restore()
}

/**
 * 複数画像を1つのCanvasに統合
 */
export async function mergeImages(
  images: ImageWithText[],
  orientation: Orientation,
  layoutType: GridLayoutType = '3x3'
): Promise<HTMLCanvasElement> {
  if (images.length === 0) {
    throw new Error('At least one image is required')
  }

  // 画像のロードを待つ
  await Promise.all(
    images.map(
      (item) =>
        new Promise<void>((resolve) => {
          // 既にロード済みで有効な画像の場合
          if (item.img.complete && item.img.naturalWidth > 0 && item.img.naturalHeight > 0) {
            resolve()
            return
          }

          // タイムアウトを設定（10秒）
          const timeout = setTimeout(() => {
            console.warn('Image load timeout')
            resolve() // タイムアウトでも続行
          }, 10000)

          const cleanup = () => {
            clearTimeout(timeout)
            item.img.onload = null
            item.img.onerror = null
          }

          item.img.onload = () => {
            cleanup()
            resolve()
          }
          item.img.onerror = () => {
            cleanup()
            console.warn('Image load error')
            resolve() // エラーでも続行（broken stateの画像は描画時にスキップされる）
          }
        })
    )
  )

  const layout = calculateGridLayout(images.length, orientation, layoutType)

  // Canvas作成
  const canvas = document.createElement('canvas')
  canvas.width = layout.outputWidth
  canvas.height = layout.outputHeight

  const ctx = canvas.getContext('2d')!
  if (!ctx) {
    throw new Error('Failed to get 2d context')
  }

  // 背景を白で塗りつぶし
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // 各画像を描画
  for (let i = 0; i < images.length; i++) {
    const position = layout.positions[i]
    const imageData = images[i]
    const textPosition = imageData.textPosition || 'over'

    // 画像を描画
    drawImageWithPadding(
      ctx,
      imageData.img,
      position.x,
      position.y,
      layout.cellWidth,
      layout.cellHeight,
      textPosition
    )

    // テキストオーバーレイを描画
    const fontSize =
      orientation === 'portrait'
        ? Math.floor(layout.cellHeight * 0.1)
        : Math.floor(layout.cellWidth * 0.1)
    const textX = position.x + layout.cellWidth / 2
    
    let textY: number
    if (textPosition === 'under') {
      // テキストが下の場合、セルの下部に配置
      textY = position.y + layout.cellHeight * 0.95
    } else {
      // テキストが上の場合、セルの上部に配置
      textY = position.y + layout.cellHeight * 0.1
    }

    drawTextOverlay(ctx, imageData.text, textX, textY, fontSize, textPosition)
  }

  return canvas
}


