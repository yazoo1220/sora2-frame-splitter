import { calculateFrameDifference, createTestImageData } from '../frame-difference'

describe('calculateFrameDifference', () => {
  test('returns 0 for identical images', () => {
    const imageData1 = createTestImageData(10, 10, [255, 255, 255])
    const imageData2 = createTestImageData(10, 10, [255, 255, 255])
    const diff = calculateFrameDifference(imageData1, imageData2)
    expect(diff).toBe(0)
  })

  test('returns a positive value for different images', () => {
    const imageData1 = createTestImageData(10, 10, [255, 0, 0]) // Red
    const imageData2 = createTestImageData(10, 10, [0, 0, 255]) // Blue
    const diff = calculateFrameDifference(imageData1, imageData2)
    expect(diff).toBeGreaterThan(0)
  })

  test('returns 0 for images with same values', () => {
    const imageData1 = createTestImageData(10, 10, [100, 150, 200])
    const imageData2 = createTestImageData(10, 10, [100, 150, 200])
    const diff = calculateFrameDifference(imageData1, imageData2)
    expect(diff).toBe(0)
  })

  test('calculates partial difference correctly', () => {
    const imageData1 = createTestImageData(10, 10, [200, 200, 200])
    const imageData2 = createTestImageData(10, 10, [100, 100, 100])
    const diff = calculateFrameDifference(imageData1, imageData2)
    expect(diff).toBeGreaterThan(0)
    expect(diff).toBeLessThan(1)
  })

  test('handles small difference', () => {
    const imageData1 = createTestImageData(10, 10, [255, 255, 255])
    const imageData2 = createTestImageData(10, 10, [250, 250, 250])
    const diff = calculateFrameDifference(imageData1, imageData2)
    expect(diff).toBeGreaterThan(0)
    expect(diff).toBeLessThan(0.1)
  })

  test('handles large images without errors', () => {
    const imageData1 = createTestImageData(1920, 1080, [255, 255, 255])
    const imageData2 = createTestImageData(1920, 1080, [0, 0, 0])
    const diff = calculateFrameDifference(imageData1, imageData2)
    expect(diff).toBeGreaterThan(0)
    expect(diff).toBeLessThanOrEqual(1)
  })

  test('returns consistent results for same inputs', () => {
    const imageData1 = createTestImageData(10, 10, [100, 100, 100])
    const imageData2 = createTestImageData(10, 10, [200, 200, 200])
    const diff1 = calculateFrameDifference(imageData1, imageData2)
    const diff2 = calculateFrameDifference(imageData1, imageData2)
    expect(diff1).toBe(diff2)
  })

  test('handles edge case with minimal image', () => {
    const imageData1 = createTestImageData(1, 1, [255, 255, 255])
    const imageData2 = createTestImageData(1, 1, [0, 0, 0])
    const diff = calculateFrameDifference(imageData1, imageData2)
    expect(diff).toBeGreaterThan(0)
  })
})

describe('createTestImageData', () => {
  test('creates ImageData with correct dimensions', () => {
    const imageData = createTestImageData(10, 20, [255, 255, 255])
    expect(imageData.width).toBe(10)
    expect(imageData.height).toBe(20)
  })

  test('creates ImageData with correct color values', () => {
    const imageData = createTestImageData(2, 2, [100, 150, 200])
    expect(imageData.data[0]).toBe(100) // R
    expect(imageData.data[1]).toBe(150) // G
    expect(imageData.data[2]).toBe(200) // B
    expect(imageData.data[3]).toBe(255) // A
  })

  test('creates ImageData with correct data length', () => {
    const width = 10
    const height = 10
    const imageData = createTestImageData(width, height, [255, 255, 255])
    expect(imageData.data.length).toBe(width * height * 4)
  })
})

