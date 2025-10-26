/**
 * Calculate the difference between two image frames
 * @param imageData1 First image data
 * @param imageData2 Second image data
 * @returns Difference value between 0 and 1
 */
export function calculateFrameDifference(imageData1: ImageData, imageData2: ImageData): number {
  const data1 = imageData1.data
  const data2 = imageData2.data
  let diff = 0
  const sampleRate = 4

  for (let i = 0; i < data1.length; i += sampleRate * 4) {
    const r1 = data1[i]
    const g1 = data1[i + 1]
    const b1 = data1[i + 2]

    const r2 = data2[i]
    const g2 = data2[i + 1]
    const b2 = data2[i + 2]

    const pixelDiff = (Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2)) / 765
    diff += pixelDiff
  }

  return diff / (data1.length / (sampleRate * 4))
}

/**
 * Create a test ImageData with specified RGB values
 */
export function createTestImageData(width: number, height: number, color: [number, number, number]): ImageData {
  const data = new Uint8ClampedArray(width * height * 4)
  for (let i = 0; i < data.length; i += 4) {
    data[i] = color[0]     // R
    data[i + 1] = color[1] // G
    data[i + 2] = color[2] // B
    data[i + 3] = 255      // A
  }
  return new ImageData(data, width, height)
}

