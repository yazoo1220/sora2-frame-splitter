import { test, expect } from '@playwright/test'

test.describe('Image Merger E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('画像統合タブが表示される', async ({ page }) => {
    // 画像統合タブをクリック
    await page.getByText('画像統合').or(page.getByText('Image Merger')).click()
    
    // 画像統合のUIが表示されることを確認
    await expect(page.getByText(/画像ファイルをドラッグ&ドロップ|Drag & drop image files/i)).toBeVisible()
  })

  test('画像ファイルをアップロードできる', async ({ page }) => {
    // 画像統合タブに切り替え
    await page.getByText('画像統合').or(page.getByText('Image Merger')).click()
    
    // ファイル入力を作成（Playwrightの方法）
    const fileInput = page.locator('input[type="file"]')
    
    // テスト用の画像ファイルを作成（1x1 PNG）
    const testImage = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    )
    
    await fileInput.setInputFiles({
      name: 'test.png',
      mimeType: 'image/png',
      buffer: testImage,
    })
    
    // 画像が追加されたことを確認
    await expect(page.getByText('test.png')).toBeVisible({ timeout: 5000 })
  })

  test('複数画像をアップロードできる', async ({ page }) => {
    await page.getByText('画像統合').or(page.getByText('Image Merger')).click()
    
    const fileInput = page.locator('input[type="file"]')
    const testImage = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    )
    
    // 複数ファイルをアップロード
    await fileInput.setInputFiles([
      { name: 'test1.png', mimeType: 'image/png', buffer: testImage },
      { name: 'test2.png', mimeType: 'image/png', buffer: testImage },
    ])
    
    await expect(page.getByText('test1.png')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('test2.png')).toBeVisible({ timeout: 5000 })
  })

  test('画像を削除できる', async ({ page }) => {
    await page.getByText('画像統合').or(page.getByText('Image Merger')).click()
    
    const fileInput = page.locator('input[type="file"]')
    const testImage = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    )
    
    await fileInput.setInputFiles({
      name: 'test.png',
      mimeType: 'image/png',
      buffer: testImage,
    })
    
    await expect(page.getByText('test.png')).toBeVisible({ timeout: 5000 })
    
    // 削除ボタンをクリック
    const deleteButton = page.locator('button[aria-label*="削除"], button[aria-label*="Delete"]').first()
    await deleteButton.click()
    
    // 画像が削除されたことを確認
    await expect(page.getByText('test.png')).not.toBeVisible({ timeout: 3000 })
  })

  test('テキストを編集できる', async ({ page }) => {
    await page.getByText('画像統合').or(page.getByText('Image Merger')).click()
    
    const fileInput = page.locator('input[type="file"]')
    const testImage = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    )
    
    await fileInput.setInputFiles({
      name: 'test.png',
      mimeType: 'image/png',
      buffer: testImage,
    })
    
    await expect(page.getByText('test.png')).toBeVisible({ timeout: 5000 })
    
    // テキスト入力フィールドを編集
    const textInput = page.locator('input[type="text"]').first()
    await textInput.fill('Custom Text')
    
    await expect(textInput).toHaveValue('Custom Text')
  })

  test('Portrait/Landscapeを選択できる', async ({ page }) => {
    await page.getByText('画像統合').or(page.getByText('Image Merger')).click()
    
    const fileInput = page.locator('input[type="file"]')
    const testImage = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    )
    
    await fileInput.setInputFiles({
      name: 'test.png',
      mimeType: 'image/png',
      buffer: testImage,
    })
    
    await expect(page.getByText('test.png')).toBeVisible({ timeout: 5000 })
    
    // Landscapeを選択
    await page.getByText('横').or(page.getByText('Landscape')).click()
    
    // Portrait/Landscape選択が表示されることを確認
    await expect(page.getByText('縦').or(page.getByText('Portrait'))).toBeVisible()
    await expect(page.getByText('横').or(page.getByText('Landscape'))).toBeVisible()
  })

  test('統合画像をダウンロードできる', async ({ page }) => {
    await page.getByText('画像統合').or(page.getByText('Image Merger')).click()
    
    const fileInput = page.locator('input[type="file"]')
    const testImage = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    )
    
    await fileInput.setInputFiles({
      name: 'test.png',
      mimeType: 'image/png',
      buffer: testImage,
    })
    
    await expect(page.getByText('test.png')).toBeVisible({ timeout: 5000 })
    
    // プレビューが表示されるまで待つ
    await expect(page.getByText(/プレビュー|Preview/i)).toBeVisible({ timeout: 10000 })
    
    // ダウンロードボタンをクリック
    const downloadPromise = page.waitForEvent('download', { timeout: 10000 })
    await page.getByText(/ダウンロード|Download/i).click()
    
    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/\.png$/)
  })

  test('画像が9枚を超える場合エラー表示', async ({ page }) => {
    await page.getByText('画像統合').or(page.getByText('Image Merger')).click()
    
    const fileInput = page.locator('input[type="file"]')
    const testImage = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    )
    
    // 10枚の画像をアップロード
    const files = Array.from({ length: 10 }, (_, i) => ({
      name: `test${i + 1}.png`,
      mimeType: 'image/png',
      buffer: testImage,
    }))
    
    await fileInput.setInputFiles(files)
    
    // エラーメッセージが表示されることを確認
    await expect(
      page.getByText(/最大9枚まで|Maximum 9 images/i)
    ).toBeVisible({ timeout: 3000 })
  })

  test('言語切り替えが動作する', async ({ page }) => {
    await page.getByText('画像統合').or(page.getByText('Image Merger')).click()
    
    // 日本語表示を確認
    await expect(page.getByText(/画像ファイルをドラッグ&ドロップ/i)).toBeVisible()
    
    // 英語に切り替え
    await page.getByText('English').click()
    await expect(page.getByText(/Drag & drop image files/i)).toBeVisible()
    
    // 日本語に戻す
    await page.getByText('日本語').click()
    await expect(page.getByText(/画像ファイルをドラッグ&ドロップ/i)).toBeVisible()
  })
})

