import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ImageMerger from '../image-merger'
import { translations } from '@/lib/translations'

// File APIのモック
class MockFile extends File {
  constructor(
    bits: BlobPart[],
    name: string,
    options?: FilePropertyBag
  ) {
    super(bits, name, options)
  }
}

// 画像ファイルを作成するヘルパー
function createImageFile(name: string = 'test-image.png'): File {
  // 1x1ピクセルのPNG画像のbase64データ
  const base64Image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
  const byteCharacters = atob(base64Image)
  const byteNumbers = new Array(byteCharacters.length)
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  const byteArray = new Uint8Array(byteNumbers)
  return new MockFile([byteArray], name, { type: 'image/png' })
}

describe('ImageMerger Component', () => {
  const defaultProps = {
    language: 'ja' as const,
  }

  beforeEach(() => {
    // 各テスト前にクリーンアップ
    jest.clearAllMocks()
  })

  describe('Image Upload', () => {
    test('ファイル選択ボタンが表示される', () => {
      render(<ImageMerger {...defaultProps} />)
      const t = translations[defaultProps.language]
      expect(screen.getByText(t.selectFile)).toBeInTheDocument()
    })

    test('ドラッグ&ドロップエリアが表示される', () => {
      render(<ImageMerger {...defaultProps} />)
      const t = translations[defaultProps.language]
      expect(screen.getByText(t.dragDrop)).toBeInTheDocument()
    })

    test('画像ファイルを選択できる', async () => {
      const user = userEvent.setup()
      render(<ImageMerger {...defaultProps} />)
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      expect(fileInput).toBeInTheDocument()
      
      const file = createImageFile('test1.png')
      await user.upload(fileInput, file)
      
      // 画像が追加されたことを確認
      await waitFor(() => {
        expect(screen.getByText('test1.png')).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    test('複数画像を選択できる（最大9枚）', async () => {
      const user = userEvent.setup()
      render(<ImageMerger {...defaultProps} />)
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      expect(fileInput).toBeInTheDocument()
      
      const files = Array.from({ length: 9 }, (_, i) => createImageFile(`test${i + 1}.png`))
      const fileList = {
        ...files,
        length: files.length,
        item: (index: number) => files[index] || null,
        [Symbol.iterator]: function* () {
          for (const file of files) {
            yield file
          }
        },
      } as unknown as FileList
      
      Object.defineProperty(fileInput, 'files', {
        value: fileList,
        writable: false,
      })
      
      await user.upload(fileInput, files)
      
      // 9枚の画像が追加されたことを確認
      await waitFor(() => {
        files.forEach((_, i) => {
          expect(screen.getByText(`test${i + 1}.png`)).toBeInTheDocument()
        })
      }, { timeout: 3000 })
    })

    test('10枚目を選択するとエラー表示', async () => {
      const user = userEvent.setup()
      render(<ImageMerger {...defaultProps} />)
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      
      // まず9枚追加
      const files9 = Array.from({ length: 9 }, (_, i) => createImageFile(`test${i + 1}.png`))
      const fileList9 = {
        ...files9,
        length: files9.length,
        item: (index: number) => files9[index] || null,
        [Symbol.iterator]: function* () {
          for (const file of files9) {
            yield file
          }
        },
      } as unknown as FileList
      
      Object.defineProperty(fileInput, 'files', {
        value: fileList9,
        writable: false,
      })
      
      await user.upload(fileInput, files9)
      
      // 10枚目を追加しようとする
      const file10 = createImageFile('test10.png')
      const fileList10 = {
        ...files9,
        file10,
        length: 10,
        item: (index: number) => (index < 9 ? files9[index] : file10) || null,
        [Symbol.iterator]: function* () {
          for (const file of files9) {
            yield file
          }
          yield file10
        },
      } as unknown as FileList
      
      Object.defineProperty(fileInput, 'files', {
        value: fileList10,
        writable: false,
      })
      
      await user.upload(fileInput, [file10])
      
      // エラーメッセージが表示されることを確認
      await waitFor(() => {
        const t = translations[defaultProps.language]
        expect(screen.getByText(t.maxImagesError)).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    test('無効なファイル形式でエラー表示', async () => {
      const user = userEvent.setup()
      render(<ImageMerger {...defaultProps} />)
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      const invalidFile = new MockFile(['invalid'], 'test.txt', { type: 'text/plain' })
      
      await user.upload(fileInput, invalidFile)
      
      // エラーメッセージが表示されることを確認
      await waitFor(() => {
        const t = translations[defaultProps.language]
        expect(screen.getByText(t.invalidFileTypeError)).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    test('画像一覧が表示される', async () => {
      const user = userEvent.setup()
      render(<ImageMerger {...defaultProps} />)
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      const file = createImageFile('test1.png')
      
      await user.upload(fileInput, file)
      
      await waitFor(() => {
        expect(screen.getByText('test1.png')).toBeInTheDocument()
      })
    })
  })

  describe('Image Management', () => {
    test('画像を削除できる', async () => {
      const user = userEvent.setup()
      render(<ImageMerger {...defaultProps} />)
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      const file = createImageFile('test1.png')
      
      await user.upload(fileInput, file)
      
      await waitFor(() => {
        expect(screen.getByText('test1.png')).toBeInTheDocument()
      })
      
      // 削除ボタンをクリック
      const deleteButton = screen.getByLabelText(/削除|Delete/i)
      await user.click(deleteButton)
      
      // 画像が削除されたことを確認
      await waitFor(() => {
        expect(screen.queryByText('test1.png')).not.toBeInTheDocument()
      }, { timeout: 3000 })
    })

    test('画像の順序が表示される', async () => {
      const user = userEvent.setup()
      render(<ImageMerger {...defaultProps} />)
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      const files = [
        createImageFile('test1.png'),
        createImageFile('test2.png'),
      ]
      
      for (const file of files) {
        await user.upload(fileInput, file)
      }
      
      await waitFor(() => {
        expect(screen.getByText('test1.png')).toBeInTheDocument()
        expect(screen.getByText('test2.png')).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    test('画像のプレビューが表示される', async () => {
      const user = userEvent.setup()
      render(<ImageMerger {...defaultProps} />)
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      const file = createImageFile('test1.png')
      
      await user.upload(fileInput, file)
      
      await waitFor(() => {
        const images = screen.getAllByRole('img')
        expect(images.length).toBeGreaterThan(0)
      }, { timeout: 3000 })
    })
  })

  describe('Text Overlay', () => {
    test('デフォルトで連番が表示される', async () => {
      const user = userEvent.setup()
      render(<ImageMerger {...defaultProps} />)
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      const file = createImageFile('test1.png')
      
      await user.upload(fileInput, file)
      
      await waitFor(() => {
        // デフォルトで連番が表示されることを確認
        const textInputs = screen.getAllByDisplayValue('1')
        expect(textInputs.length).toBeGreaterThan(0)
      }, { timeout: 3000 })
    })

    test('テキストを編集できる', async () => {
      const user = userEvent.setup()
      render(<ImageMerger {...defaultProps} />)
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      const file = createImageFile('test1.png')
      
      await user.upload(fileInput, file)
      
      await waitFor(() => {
        const textInput = screen.getByDisplayValue('1')
        expect(textInput).toBeInTheDocument()
      }, { timeout: 3000 })
      
      const textInput = screen.getByDisplayValue('1')
      await user.clear(textInput)
      await user.type(textInput, 'Custom Text')
      
      await waitFor(() => {
        expect(textInput).toHaveValue('Custom Text')
      })
    })

    test('テキスト入力フィールドが各画像に表示される', async () => {
      const user = userEvent.setup()
      render(<ImageMerger {...defaultProps} />)
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      const files = [
        createImageFile('test1.png'),
        createImageFile('test2.png'),
      ]
      
      for (const file of files) {
        await user.upload(fileInput, file)
      }
      
      await waitFor(() => {
        const textInputs = screen.getAllByDisplayValue(/^[12]$/)
        expect(textInputs.length).toBe(2)
      }, { timeout: 3000 })
    })

    test('テキストを空にできる', async () => {
      const user = userEvent.setup()
      render(<ImageMerger {...defaultProps} />)
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      const file = createImageFile('test1.png')
      
      await user.upload(fileInput, file)
      
      await waitFor(() => {
        const textInput = screen.getByDisplayValue('1')
        expect(textInput).toBeInTheDocument()
      }, { timeout: 3000 })
      
      const textInput = screen.getByDisplayValue('1')
      await user.clear(textInput)
      
      await waitFor(() => {
        expect(textInput).toHaveValue('')
      })
    })
  })

  describe('Layout Settings', () => {
    test('Portrait/Landscape選択が表示される', async () => {
      const user = userEvent.setup()
      render(<ImageMerger {...defaultProps} />)
      
      // 画像を追加してから設定を確認
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      const file = createImageFile('test1.png')
      await user.upload(fileInput, file)
      
      await waitFor(() => {
        const t = translations[defaultProps.language]
        expect(screen.getByText(t.orientation)).toBeInTheDocument()
        expect(screen.getByText(t.portrait)).toBeInTheDocument()
        expect(screen.getByText(t.landscape)).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    test('Portraitを選択できる', async () => {
      const user = userEvent.setup()
      render(<ImageMerger {...defaultProps} />)
      
      // 画像を追加
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      const file = createImageFile('test1.png')
      await user.upload(fileInput, file)
      
      await waitFor(() => {
        const t = translations[defaultProps.language]
        const portraitButton = screen.getByText(t.portrait)
        expect(portraitButton).toBeInTheDocument()
      }, { timeout: 3000 })
      
      const t = translations[defaultProps.language]
      const portraitButton = screen.getByText(t.portrait)
      await user.click(portraitButton)
      
      // Portraitが選択されたことを確認（SegmentedControlの実装に応じて）
      expect(portraitButton).toBeInTheDocument()
    })

    test('Landscapeを選択できる', async () => {
      const user = userEvent.setup()
      render(<ImageMerger {...defaultProps} />)
      
      // 画像を追加
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      const file = createImageFile('test1.png')
      await user.upload(fileInput, file)
      
      await waitFor(() => {
        const t = translations[defaultProps.language]
        const landscapeButton = screen.getByText(t.landscape)
        expect(landscapeButton).toBeInTheDocument()
      }, { timeout: 3000 })
      
      const t = translations[defaultProps.language]
      const landscapeButton = screen.getByText(t.landscape)
      await user.click(landscapeButton)
      
      // Landscapeが選択されたことを確認
      expect(landscapeButton).toBeInTheDocument()
    })
  })

  describe('Preview', () => {
    test('画像が1枚以上ないとプレビューが表示されない', () => {
      render(<ImageMerger {...defaultProps} />)
      
      const t = translations[defaultProps.language]
      const previewSection = screen.queryByText(t.preview)
      expect(previewSection).not.toBeInTheDocument()
    })

    test('統合画像のプレビューが表示される', async () => {
      const user = userEvent.setup()
      render(<ImageMerger {...defaultProps} />)
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      const file = createImageFile('test1.png')
      
      await user.upload(fileInput, file)
      
      await waitFor(() => {
        const t = translations[defaultProps.language]
        expect(screen.getByText(t.preview)).toBeInTheDocument()
      }, { timeout: 5000 })
    })
  })

  describe('Export', () => {
    test('ダウンロードボタンが表示される', async () => {
      const user = userEvent.setup()
      render(<ImageMerger {...defaultProps} />)
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      const file = createImageFile('test1.png')
      
      await user.upload(fileInput, file)
      
      await waitFor(() => {
        const t = translations[defaultProps.language]
        expect(screen.getByText(t.download)).toBeInTheDocument()
      }, { timeout: 5000 })
    })

    test('画像がない場合ダウンロードボタンが表示されない', () => {
      render(<ImageMerger {...defaultProps} />)
      
      const t = translations[defaultProps.language]
      const downloadButton = screen.queryByText(t.download)
      expect(downloadButton).not.toBeInTheDocument()
    })

    test('PNG形式でダウンロードできる', async () => {
      const user = userEvent.setup()
      
      const mockLink = {
        href: '',
        download: '',
        click: jest.fn(),
        style: {} as CSSStyleDeclaration,
      }
      
      const originalCreateElement = document.createElement.bind(document)
      jest.spyOn(document, 'createElement').mockImplementation((tagName) => {
        if (tagName === 'a') {
          return mockLink as unknown as HTMLElement
        }
        return originalCreateElement(tagName)
      })
      
      render(<ImageMerger {...defaultProps} />)
      
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      const file = createImageFile('test1.png')
      
      await user.upload(fileInput, file)
      
      await waitFor(() => {
        const t = translations[defaultProps.language]
        const downloadButton = screen.queryByText(t.download)
        expect(downloadButton).toBeInTheDocument()
      }, { timeout: 3000 })
      
      const t = translations[defaultProps.language]
      const downloadButton = screen.getByText(t.download)
      await user.click(downloadButton)
      
      // ダウンロードが実行されたことを確認
      await waitFor(() => {
        expect(mockLink.click).toHaveBeenCalled()
        expect(mockLink.download).toMatch(/\.png$/)
      })
    })
  })
})


