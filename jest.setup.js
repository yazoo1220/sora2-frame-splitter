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

// Enable Canvas API for Jest tests using node-canvas
const { createCanvas, Image } = require('canvas')

// Override document.createElement to use node-canvas for canvas elements
const originalCreateElement = global.document?.createElement
if (originalCreateElement) {
  global.document.createElement = function(tagName) {
    if (tagName === 'canvas') {
      return createCanvas(1, 1)
    }
    return originalCreateElement.call(this, tagName)
  }
}

// Make Image available globally
global.Image = Image

// Mock URL.createObjectURL and URL.revokeObjectURL for Jest
if (typeof global.URL === 'undefined' || !global.URL.createObjectURL) {
  const objectURLs = new Map()
  let objectURLCounter = 0
  
  global.URL.createObjectURL = function(blob) {
    const url = `blob:mock-url-${objectURLCounter++}`
    objectURLs.set(url, blob)
    return url
  }
  
  global.URL.revokeObjectURL = function(url) {
    objectURLs.delete(url)
  }
}

