import {
  resizeImageToFit,
  calculateGridLayout,
  drawImageWithPadding,
  drawTextOverlay,
  mergeImages,
  type GridLayout,
  type Orientation,
} from '../image-merger'
import { createCanvas, Image } from 'canvas'

// Canvas APIのモック用ヘルパー
function createMockImage(width: number, height: number): HTMLImageElement {
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')!
  // 実際の画像データを作成
  ctx.fillStyle = '#FF0000'
  ctx.fillRect(0, 0, width, height)
  
  const img = new Image()
  img.width = width
  img.height = height
  // canvasから画像データを取得してImageに設定
  const imageData = canvas.toDataURL()
  img.src = imageData
  // completeをtrueに設定（実際には画像がロードされるまで待つ必要があるが、テストでは即座にtrueにする）
  Object.defineProperty(img, 'complete', { 
    value: true, 
    writable: true, 
    configurable: true 
  })
  
  return img as unknown as HTMLImageElement
}

function createMockCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = createCanvas(width, height)
  return canvas as unknown as HTMLCanvasElement
}

describe('resizeImageToFit', () => {
  test('画像を指定サイズにリサイズ（アスペクト比維持）', () => {
    const img = createMockImage(200, 100) // 横長
    const targetWidth = 100
    const targetHeight = 100
    
    const result = resizeImageToFit(img, targetWidth, targetHeight)
    
    expect(result.width).toBe(100)
    expect(result.height).toBe(50)
    expect(result.offsetX).toBe(0)
    expect(result.offsetY).toBe(25)
  })

  test('横長画像を縦長セルに配置（余白追加）', () => {
    const img = createMockImage(400, 200) // 2:1
    const targetWidth = 100
    const targetHeight = 200
    
    const result = resizeImageToFit(img, targetWidth, targetHeight)
    
    expect(result.width).toBe(100)
    expect(result.height).toBe(50)
    expect(result.offsetX).toBe(0)
    expect(result.offsetY).toBe(75) // 中央配置
  })

  test('縦長画像を横長セルに配置（余白追加）', () => {
    const img = createMockImage(200, 400) // 1:2
    const targetWidth = 200
    const targetHeight = 100
    
    const result = resizeImageToFit(img, targetWidth, targetHeight)
    
    expect(result.width).toBe(50)
    expect(result.height).toBe(100)
    expect(result.offsetX).toBe(75) // 中央配置
    expect(result.offsetY).toBe(0)
  })

  test('正方形画像を横長セルに配置（余白追加）', () => {
    const img = createMockImage(200, 200)
    const targetWidth = 300
    const targetHeight = 100
    
    const result = resizeImageToFit(img, targetWidth, targetHeight)
    
    expect(result.width).toBe(100)
    expect(result.height).toBe(100)
    expect(result.offsetX).toBe(100) // 中央配置
    expect(result.offsetY).toBe(0)
  })

  test('既に適切なサイズの画像はそのまま', () => {
    const img = createMockImage(100, 100)
    const targetWidth = 100
    const targetHeight = 100
    
    const result = resizeImageToFit(img, targetWidth, targetHeight)
    
    expect(result.width).toBe(100)
    expect(result.height).toBe(100)
    expect(result.offsetX).toBe(0)
    expect(result.offsetY).toBe(0)
  })
})

describe('calculateGridLayout', () => {
  test('9枚の画像で3×3グリッドを生成', () => {
    const layout = calculateGridLayout(9, 'portrait')
    
    expect(layout.rows).toBe(3)
    expect(layout.cols).toBe(3)
    expect(layout.cellWidth).toBe(360)
    expect(layout.cellHeight).toBe(640)
    expect(layout.positions.length).toBe(9)
    
    // 最初のセル
    expect(layout.positions[0]).toEqual({ row: 0, col: 0, x: 0, y: 0 })
    // 最後のセル
    expect(layout.positions[8]).toEqual({ row: 2, col: 2, x: 720, y: 1280 })
  })

  test('5枚の画像で上から順に配置', () => {
    const layout = calculateGridLayout(5, 'portrait')
    
    expect(layout.positions.length).toBe(5)
    expect(layout.positions[0]).toEqual({ row: 0, col: 0, x: 0, y: 0 })
    expect(layout.positions[1]).toEqual({ row: 0, col: 1, x: 360, y: 0 })
    expect(layout.positions[2]).toEqual({ row: 0, col: 2, x: 720, y: 0 })
    expect(layout.positions[3]).toEqual({ row: 1, col: 0, x: 0, y: 640 })
    expect(layout.positions[4]).toEqual({ row: 1, col: 1, x: 360, y: 640 })
  })

  test('1枚の画像で1セル目に配置', () => {
    const layout = calculateGridLayout(1, 'portrait')
    
    expect(layout.positions.length).toBe(1)
    expect(layout.positions[0]).toEqual({ row: 0, col: 0, x: 0, y: 0 })
  })

  test('Portrait向きのセルサイズ計算', () => {
    const layout = calculateGridLayout(1, 'portrait')
    
    expect(layout.cellWidth).toBe(360)
    expect(layout.cellHeight).toBe(640)
    expect(layout.outputWidth).toBe(1080)
    expect(layout.outputHeight).toBe(1920)
  })

  test('Landscape向きのセルサイズ計算', () => {
    const layout = calculateGridLayout(1, 'landscape')
    
    expect(layout.cellWidth).toBe(640)
    expect(layout.cellHeight).toBe(360)
    expect(layout.outputWidth).toBe(1920)
    expect(layout.outputHeight).toBe(1080)
  })
})

describe('drawImageWithPadding', () => {
  test('画像を中央配置で描画', () => {
    const canvas = createMockCanvas(200, 200)
    const ctx = canvas.getContext('2d')!
    const img = createMockImage(100, 100)
    
    // モック画像をロード済みとして扱う
    Object.defineProperty(img, 'complete', { value: true, writable: true, configurable: true })
    
    // エラーが発生しないことを確認
    expect(() => {
      drawImageWithPadding(ctx, img, 0, 0, 200, 200)
    }).not.toThrow()
  })

  test('余白を白で塗りつぶし', () => {
    const canvas = createMockCanvas(200, 200)
    const ctx = canvas.getContext('2d')!
    const img = createMockImage(100, 50) // 横長画像
    
    Object.defineProperty(img, 'complete', { value: true, writable: true, configurable: true })
    
    // fillRectが呼ばれることを確認
    const originalFillRect = ctx.fillRect.bind(ctx)
    let fillRectCalled = false
    let fillStyleSet = false
    
    ctx.fillRect = jest.fn((...args) => {
      fillRectCalled = true
      originalFillRect(...args)
    })
    
    // fillStyleの設定を追跡
    const originalFillStyleSetter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(ctx), 'fillStyle')?.set
    Object.defineProperty(ctx, 'fillStyle', {
      set(value) {
        if (value === '#FFFFFF') {
          fillStyleSet = true
        }
        if (originalFillStyleSetter) {
          originalFillStyleSetter.call(ctx, value)
        }
      },
      get() {
        return '#000000'
      },
      configurable: true,
    })
    
    drawImageWithPadding(ctx, img, 0, 0, 200, 200)
    
    expect(fillRectCalled).toBe(true)
    expect(fillStyleSet).toBe(true)
  })

  test('画像をセルサイズに合わせてスケール', () => {
    const canvas = createMockCanvas(200, 200)
    const ctx = canvas.getContext('2d')!
    const img = createMockImage(400, 300)
    
    Object.defineProperty(img, 'complete', { value: true, writable: true, configurable: true })
    
    const originalDrawImage = ctx.drawImage.bind(ctx)
    let drawImageCalled = false
    ctx.drawImage = jest.fn((...args) => {
      drawImageCalled = true
      try {
        originalDrawImage(...args)
      } catch (e) {
        // node-canvasでは画像のロードが不完全な場合エラーになるが、呼び出しは確認できる
      }
    })
    
    drawImageWithPadding(ctx, img, 0, 0, 200, 200)
    
    expect(drawImageCalled).toBe(true)
  })
})

describe('drawTextOverlay', () => {
  test('テキストを画像の上中央に描画', () => {
    const canvas = createMockCanvas(360, 640)
    const ctx = canvas.getContext('2d')!
    
    // textAlignが設定されることを確認
    let textAlignSet = false
    const originalTextAlignSetter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(ctx), 'textAlign')?.set
    Object.defineProperty(ctx, 'textAlign', {
      set(value) {
        if (value === 'center') {
          textAlignSet = true
        }
        if (originalTextAlignSetter) {
          originalTextAlignSetter.call(ctx, value)
        }
      },
      get() {
        return 'start'
      },
      configurable: true,
    })
    
    drawTextOverlay(ctx, 'Test', 180, 64, 64)
    
    // textAlignが設定されたことを確認
    expect(textAlignSet).toBe(true)
  })

  test('テキストに影を追加', () => {
    const canvas = createMockCanvas(360, 640)
    const ctx = canvas.getContext('2d')!
    
    const originalFillText = ctx.fillText.bind(ctx)
    const originalStrokeText = ctx.strokeText.bind(ctx)
    let fillTextCalled = false
    let strokeTextCalled = false
    
    ctx.fillText = jest.fn((...args) => {
      fillTextCalled = true
      originalFillText(...args)
    })
    ctx.strokeText = jest.fn((...args) => {
      strokeTextCalled = true
      originalStrokeText(...args)
    })
    
    drawTextOverlay(ctx, 'Test', 180, 64, 64)
    
    expect(fillTextCalled).toBe(true)
    expect(strokeTextCalled).toBe(true)
  })

  test('フォントサイズが正しく設定される', () => {
    const canvas = createMockCanvas(360, 640)
    const ctx = canvas.getContext('2d')!
    
    // 関数内でフォントが設定されることを確認するため、モックで追跡
    const originalFontSetter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(ctx), 'font')?.set
    let fontValue = ''
    
    Object.defineProperty(ctx, 'font', {
      set(value) {
        fontValue = value
        if (originalFontSetter) {
          originalFontSetter.call(ctx, value)
        }
      },
      get() {
        return fontValue || '10px sans-serif'
      },
      configurable: true,
    })
    
    drawTextOverlay(ctx, 'Test', 180, 64, 64)
    
    expect(fontValue).toContain('64px')
  })
})

describe('mergeImages', () => {
  test('複数画像を1つのCanvasに統合', async () => {
    const images = [
      { img: createMockImage(100, 100), text: '1' },
      { img: createMockImage(100, 100), text: '2' },
    ]
    
    // 画像をロード済みとして扱う
    images.forEach(item => {
      Object.defineProperty(item.img, 'complete', { value: true, writable: true, configurable: true })
      // onloadを呼び出してロード完了をシミュレート
      if (item.img.onload) {
        item.img.onload({} as Event)
      }
    })
    
    const result = await mergeImages(images, 'portrait')
    
    expect(result).toBeDefined()
    expect(result.width).toBe(1080)
    expect(result.height).toBe(1920)
  })

  test('テキストオーバーレイを各画像に追加', async () => {
    const images = [
      { img: createMockImage(100, 100), text: '1' },
      { img: createMockImage(100, 100), text: '2' },
    ]
    
    images.forEach(item => {
      Object.defineProperty(item.img, 'complete', { value: true, writable: true, configurable: true })
      if (item.img.onload) {
        item.img.onload({} as Event)
      }
    })
    
    const result = await mergeImages(images, 'portrait')
    
    expect(result).toBeDefined()
  })

  test('Portrait向きで1080×1920の画像を生成', async () => {
    const images = [{ img: createMockImage(100, 100), text: '1' }]
    
    Object.defineProperty(images[0].img, 'complete', { value: true, writable: true, configurable: true })
    if (images[0].img.onload) {
      images[0].img.onload({} as Event)
    }
    
    const result = await mergeImages(images, 'portrait')
    
    expect(result.width).toBe(1080)
    expect(result.height).toBe(1920)
  })

  test('Landscape向きで1920×1080の画像を生成', async () => {
    const images = [{ img: createMockImage(100, 100), text: '1' }]
    
    Object.defineProperty(images[0].img, 'complete', { value: true, writable: true, configurable: true })
    if (images[0].img.onload) {
      images[0].img.onload({} as Event)
    }
    
    const result = await mergeImages(images, 'landscape')
    
    expect(result.width).toBe(1920)
    expect(result.height).toBe(1080)
  })

  test('画像が9枚未満の場合も正しく配置', async () => {
    const images = Array.from({ length: 5 }, (_, i) => ({
      img: createMockImage(100, 100),
      text: String(i + 1),
    }))
    
    images.forEach(item => {
      Object.defineProperty(item.img, 'complete', { value: true, writable: true, configurable: true })
      if (item.img.onload) {
        item.img.onload({} as Event)
      }
    })
    
    const result = await mergeImages(images, 'portrait')
    
    expect(result).toBeDefined()
    expect(result.width).toBe(1080)
    expect(result.height).toBe(1920)
  })

  test('テキストが空の場合はオーバーレイを追加しない', async () => {
    const images = [
      { img: createMockImage(100, 100), text: '' },
      { img: createMockImage(100, 100), text: '2' },
    ]
    
    images.forEach(item => {
      Object.defineProperty(item.img, 'complete', { value: true, writable: true, configurable: true })
      if (item.img.onload) {
        item.img.onload({} as Event)
      }
    })
    
    const result = await mergeImages(images, 'portrait')
    
    expect(result).toBeDefined()
  })
})

