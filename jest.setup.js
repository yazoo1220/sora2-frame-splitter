// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock ImageData for Node.js environment
global.ImageData = class ImageData {
  constructor(data, width, height) {
    this.data = data
    this.width = width
    this.height = height
  }
}

// Mock ResizeObserver for Node.js environment
global.ResizeObserver = class ResizeObserver {
  constructor(cb) {
    this.cb = cb
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}

