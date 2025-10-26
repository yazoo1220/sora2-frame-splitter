import { test, expect } from '@playwright/test'

test.describe('Sora2 Frame Splitter', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('ページが正しく表示される', async ({ page }) => {
    // タイトルが表示されることを確認
    await expect(page.locator('h1')).toContainText('Sora2 Frame Splitter')
    
    // ファイル選択ボタンが表示されることを確認
    await expect(page.getByText(/Drag & drop video file|動画ファイルをドラッグ&ドロップ/i)).toBeVisible()
  })

  test('言語切り替えが動作する', async ({ page }) => {
    // 日本語表示を確認
    await expect(page.getByText(/抽出スタート/i)).toBeVisible()
    
    // 英語に切り替え
    await page.getByText('English').click()
    await expect(page.getByText(/Start Extraction/i)).toBeVisible()
    
    // 日本語に戻す
    await page.getByText('日本語').click()
    await expect(page.getByText(/抽出スタート/i)).toBeVisible()
  })

  test('ファイルアップロードのドラッグ&ドロップが動作する', async ({ page }) => {
    // ドラッグ&ドロップエリアを確認
    const dropZone = page.locator('text=Drag & drop video file').or(page.locator('text=動画ファイルをドラッグ&ドロップ'))
    await expect(dropZone).toBeVisible()
  })

  test('感度スライダーが表示される', async ({ page }) => {
    // スライダーが表示されることを確認
    const slider = page.locator('input[type="range"]')
    await expect(slider).toBeVisible()
    
    // 初期値が0.2であることを確認
    const value = await slider.inputValue()
    expect(parseFloat(value)).toBe(0.2)
  })

  test('抽出ボタンが無効化されている', async ({ page }) => {
    // 動画なしでは抽出ボタンが無効化されていることを確認
    const extractButton = page.getByText(/Start Extraction|抽出スタート/i)
    await expect(extractButton).toBeDisabled()
  })

  test('レイアウトがレスポンシブに対応している', async ({ page }) => {
    // デスクトップサイズ
    await page.setViewportSize({ width: 1280, height: 720 })
    await expect(page.locator('h1')).toBeVisible()
    
    // タブレットサイズ
    await page.setViewportSize({ width: 768, height: 1024 })
    await expect(page.locator('h1')).toBeVisible()
    
    // モバイルサイズ
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page.locator('h1')).toBeVisible()
  })
})

test.describe('エラーハンドリング', () => {
  test('不正なファイル形式のエラー表示', async ({ page }) => {
    await page.goto('/')
    
    // テキストファイルをアップロードしようとする
    const fileInput = page.locator('input[type="file"]')
    
    // モックファイルを作成してアップロード
    const file = {
      name: 'test.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('test content'),
    }
    
    await fileInput.setInputFiles({
      name: file.name,
      mimeType: file.mimeType,
      buffer: file.buffer,
    })
    
    // エラーメッセージが表示されることを確認
    await expect(page.getByText(/Please select a video file|動画ファイルを選択してください/i)).toBeVisible()
  })
})

