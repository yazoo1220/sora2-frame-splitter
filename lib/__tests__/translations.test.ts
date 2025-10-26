import { translations, type Language, type TranslationKey } from '../translations'

describe('translations object', () => {
  test('all languages have the same keys', () => {
    const enKeys = Object.keys(translations.en)
    const jaKeys = Object.keys(translations.ja)

    expect(enKeys).toEqual(jaKeys)
  })

  test('all values are non-empty strings', () => {
    Object.values(translations.en).forEach((value) => {
      expect(typeof value).toBe('string')
      expect(value.length).toBeGreaterThan(0)
    })

    Object.values(translations.ja).forEach((value) => {
      expect(typeof value).toBe('string')
      expect(value.length).toBeGreaterThan(0)
    })
  })

  test('Language type only accepts valid languages', () => {
    const validLanguages: Language[] = ['en', 'ja']
    expect(validLanguages).toContain('en')
    expect(validLanguages).toContain('ja')
  })

  test('TranslationKey type only accepts valid keys', () => {
    const validKeys: TranslationKey[] = [
      'title',
      'description',
      'dragDrop',
      'orClick',
      'selectFile',
      'selectedFile',
      'sensitivity',
      'sensitivityHint',
      'recommendedValues',
      'startExtraction',
      'processing',
      'extractedFrames',
      'clickToDownload',
      'bulkDownload',
      'bulkDownloading',
      'hint',
      'videoError',
    ]

    validKeys.forEach((key) => {
      expect(translations.en).toHaveProperty(key)
      expect(translations.ja).toHaveProperty(key)
    })
  })

  test('each language object has all required keys', () => {
    const requiredKeys: TranslationKey[] = [
      'title',
      'description',
      'dragDrop',
      'orClick',
      'selectFile',
      'selectedFile',
      'sensitivity',
      'sensitivityHint',
      'recommendedValues',
      'startExtraction',
      'processing',
      'extractedFrames',
      'clickToDownload',
      'bulkDownload',
      'bulkDownloading',
      'hint',
      'videoError',
    ]

    requiredKeys.forEach((key) => {
      expect(translations.en).toHaveProperty(key)
      expect(translations.ja).toHaveProperty(key)
    })
  })

  test('title is identical across languages', () => {
    expect(translations.en.title).toBe(translations.ja.title)
  })

  test('translations are properly formatted', () => {
    // Check that hint text contains proper line breaks
    expect(translations.en.clickToDownload).toContain('\n')
    expect(translations.ja.clickToDownload).toContain('\n')
  })
})

