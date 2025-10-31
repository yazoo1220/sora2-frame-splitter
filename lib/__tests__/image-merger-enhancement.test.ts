import {
  calculateGridLayout,
  type Orientation,
  type GridLayoutType,
} from '../image-merger'

describe('calculateGridLayout with layoutType', () => {
  test('1×1レイアウトで1枚の画像を配置', () => {
    const layout = calculateGridLayout(1, 'portrait', '1x1')
    
    expect(layout.rows).toBe(1)
    expect(layout.cols).toBe(1)
    expect(layout.positions.length).toBe(1)
    expect(layout.positions[0]).toEqual({ row: 0, col: 0, x: 0, y: 0 })
  })

  test('2×2レイアウトで4枚の画像を配置', () => {
    const layout = calculateGridLayout(4, 'portrait', '2x2')
    
    expect(layout.rows).toBe(2)
    expect(layout.cols).toBe(2)
    expect(layout.positions.length).toBe(4)
    expect(layout.positions[0]).toEqual({ row: 0, col: 0, x: 0, y: 0 })
    expect(layout.positions[1]).toEqual({ row: 0, col: 1, x: 540, y: 0 })
    expect(layout.positions[2]).toEqual({ row: 1, col: 0, x: 0, y: 960 })
    expect(layout.positions[3]).toEqual({ row: 1, col: 1, x: 540, y: 960 })
  })

  test('3×3レイアウトで9枚の画像を配置', () => {
    const layout = calculateGridLayout(9, 'portrait', '3x3')
    
    expect(layout.rows).toBe(3)
    expect(layout.cols).toBe(3)
    expect(layout.positions.length).toBe(9)
    expect(layout.positions[0]).toEqual({ row: 0, col: 0, x: 0, y: 0 })
    expect(layout.positions[8]).toEqual({ row: 2, col: 2, x: 720, y: 1280 })
  })

  test('1×1レイアウトのセルサイズ計算（Portrait）', () => {
    const layout = calculateGridLayout(1, 'portrait', '1x1')
    
    expect(layout.cellWidth).toBe(1080)
    expect(layout.cellHeight).toBe(1920)
    expect(layout.outputWidth).toBe(1080)
    expect(layout.outputHeight).toBe(1920)
  })

  test('1×1レイアウトのセルサイズ計算（Landscape）', () => {
    const layout = calculateGridLayout(1, 'landscape', '1x1')
    
    expect(layout.cellWidth).toBe(1920)
    expect(layout.cellHeight).toBe(1080)
    expect(layout.outputWidth).toBe(1920)
    expect(layout.outputHeight).toBe(1080)
  })

  test('2×2レイアウトのセルサイズ計算（Portrait）', () => {
    const layout = calculateGridLayout(4, 'portrait', '2x2')
    
    expect(layout.cellWidth).toBe(540)
    expect(layout.cellHeight).toBe(960)
    expect(layout.outputWidth).toBe(1080)
    expect(layout.outputHeight).toBe(1920)
  })

  test('2×2レイアウトのセルサイズ計算（Landscape）', () => {
    const layout = calculateGridLayout(4, 'landscape', '2x2')
    
    expect(layout.cellWidth).toBe(960)
    expect(layout.cellHeight).toBe(540)
    expect(layout.outputWidth).toBe(1920)
    expect(layout.outputHeight).toBe(1080)
  })

  test('3×3レイアウトのセルサイズ計算（Portrait）', () => {
    const layout = calculateGridLayout(9, 'portrait', '3x3')
    
    expect(layout.cellWidth).toBe(360)
    expect(layout.cellHeight).toBe(640)
    expect(layout.outputWidth).toBe(1080)
    expect(layout.outputHeight).toBe(1920)
  })

  test('レイアウトに応じた最大画像数の制限', () => {
    // 1×1は最大1枚
    const layout1x1 = calculateGridLayout(1, 'portrait', '1x1')
    expect(layout1x1.positions.length).toBe(1)
    
    // 2×2は最大4枚
    const layout2x2 = calculateGridLayout(4, 'portrait', '2x2')
    expect(layout2x2.positions.length).toBe(4)
    
    // 3×3は最大9枚
    const layout3x3 = calculateGridLayout(9, 'portrait', '3x3')
    expect(layout3x3.positions.length).toBe(9)
  })

  test('レイアウト未指定時は3×3がデフォルト', () => {
    const layout = calculateGridLayout(9, 'portrait')
    
    expect(layout.rows).toBe(3)
    expect(layout.cols).toBe(3)
    expect(layout.cellWidth).toBe(360)
    expect(layout.cellHeight).toBe(640)
  })
})

