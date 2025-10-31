"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { Upload, X, Download, Image as ImageIcon } from "lucide-react"
import { translations, type Language } from "@/lib/translations"
import { mergeImages, type Orientation, type ImageWithText, type GridLayoutType, type TextPosition } from "@/lib/image-merger"

interface ImageItem {
  id: string
  file: File
  preview: string
  text: string
  textPosition: TextPosition
}

interface ImageMergerProps {
  language: Language
}

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']

const getMaxImages = (layoutType: GridLayoutType): number => {
  switch (layoutType) {
    case '1x1': return 1
    case '2x2': return 4
    case '3x3': return 9
    default: return 9
  }
}

export default function ImageMerger({ language }: ImageMergerProps) {
  const t = translations[language]
  const [images, setImages] = useState<ImageItem[]>([])
  const [orientation, setOrientation] = useState<Orientation>('portrait')
  const [layoutType, setLayoutType] = useState<GridLayoutType>('3x3')
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [previewCanvas, setPreviewCanvas] = useState<HTMLCanvasElement | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map())

  // 画像を追加
  const addImages = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files)
    const imageFiles = fileArray.filter(file => ACCEPTED_TYPES.includes(file.type))
    
    if (imageFiles.length === 0) {
      setError(t.invalidFileTypeError)
      return
    }

    const maxImages = getMaxImages(layoutType)
    if (images.length + imageFiles.length > maxImages) {
      if (layoutType === '1x1') {
        setError(t.maxImagesError1x1)
      } else if (layoutType === '2x2') {
        setError(t.maxImagesError2x2)
      } else {
        setError(t.maxImagesError)
      }
      return
    }

    setError(null)

    const newImages: ImageItem[] = imageFiles.map((file, index) => {
      const id = `${Date.now()}-${index}`
      const preview = URL.createObjectURL(file)
      return {
        id,
        file,
        preview,
        text: String(images.length + index + 1),
        textPosition: 'over' as TextPosition,
      }
    })

    setImages(prev => [...prev, ...newImages])
  }, [images.length, layoutType, t])

  // 画像を削除
  const removeImage = useCallback((id: string) => {
    setImages(prev => {
      const image = prev.find(img => img.id === id)
      if (image) {
        URL.revokeObjectURL(image.preview)
        // キャッシュからも削除
        imageCacheRef.current.delete(id)
      }
      const newImages = prev.filter(img => img.id !== id)
      // テキストを連番に更新
      return newImages.map((img, index) => ({
        ...img,
        text: String(index + 1),
      }))
    })
  }, [])

  // テキストを更新
  const updateText = useCallback((id: string, text: string) => {
    setImages(prev => prev.map(img => 
      img.id === id ? { ...img, text } : img
    ))
  }, [])

  // テキスト位置を更新
  const updateTextPosition = useCallback((id: string, textPosition: TextPosition) => {
    setImages(prev => prev.map(img => 
      img.id === id ? { ...img, textPosition } : img
    ))
  }, [])

  // 画像を並び替え
  const reorderImages = useCallback((fromIndex: number, toIndex: number) => {
    setImages(prev => {
      const newImages = [...prev]
      const [removed] = newImages.splice(fromIndex, 1)
      newImages.splice(toIndex, 0, removed)
      // テキストを連番に更新
      return newImages.map((img, index) => ({
        ...img,
        text: String(index + 1),
      }))
    })
  }, [])

  // 画像並び替え用ドラッグ&ドロップハンドラ
  const handleImageDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleImageDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleImageDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.stopPropagation()
    if (draggedIndex === null || draggedIndex === index) {
      setDraggedIndex(null)
      return
    }
    
    reorderImages(draggedIndex, index)
    setDraggedIndex(null)
  }

  const handleImageDragEnd = () => {
    setDraggedIndex(null)
  }

  // レイアウト変更時に画像数を調整
  useEffect(() => {
    const maxImages = getMaxImages(layoutType)
    if (images.length > maxImages) {
      setImages(prev => prev.slice(0, maxImages).map((img, index) => ({
        ...img,
        text: String(index + 1),
      })))
    }
  }, [layoutType])

  // プレビュー生成に必要な情報をメモ化
  const previewKey = useMemo(() => {
    return images.map(img => `${img.id}:${img.text}:${img.textPosition}`).join(',') + `:${orientation}:${layoutType}`
  }, [images, orientation, layoutType])

  // プレビューを生成
  useEffect(() => {
    if (images.length === 0) {
      setPreviewCanvas(null)
      return
    }

    const generatePreview = async () => {
      setIsProcessing(true)
      setError(null) // エラーをクリア
      try {
        // 画像をロード（キャッシュから再利用）
        const imageLoadResults = await Promise.allSettled(
          images.map(async (item) => {
            // キャッシュを確認
            const cachedImg = imageCacheRef.current.get(item.id)
            if (cachedImg && cachedImg.complete && cachedImg.naturalWidth > 0 && cachedImg.naturalHeight > 0) {
              // キャッシュから取得（テキストと位置は最新のものを使用）
              return { img: cachedImg, text: item.text, textPosition: item.textPosition }
            }

            // キャッシュがない場合は新規ロード
            return new Promise<ImageWithText>((resolve, reject) => {
              const img = new Image()
              
              // タイムアウトを設定（10秒）
              const timeout = setTimeout(() => {
                reject(new Error(`Image load timeout: ${item.file.name}`))
              }, 10000)

              const cleanup = () => {
                clearTimeout(timeout)
                img.onload = null
                img.onerror = null
              }

              img.onload = () => {
                cleanup()
                // 画像が有効か確認
                if (img.naturalWidth > 0 && img.naturalHeight > 0) {
                  // キャッシュに保存
                  imageCacheRef.current.set(item.id, img)
                  resolve({ img, text: item.text, textPosition: item.textPosition })
                } else {
                  reject(new Error(`Invalid image: ${item.file.name}`))
                }
              }
              
              img.onerror = () => {
                cleanup()
                reject(new Error(`Failed to load image: ${item.file.name}`))
              }
              
              // CORSの問題を回避するため、crossOriginを設定しない
              img.src = item.preview
            })
          })
        )

        // 成功した画像のみを抽出
        const imageElements: ImageWithText[] = []
        const errors: string[] = []
        
        imageLoadResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            imageElements.push(result.value)
          } else {
            errors.push(`Failed to load ${images[index].file.name}: ${result.reason?.message || 'Unknown error'}`)
          }
        })

        // エラーがある場合は警告を表示
        if (errors.length > 0) {
          console.warn('Some images failed to load:', errors)
          if (imageElements.length === 0) {
            setError('すべての画像の読み込みに失敗しました')
            setIsProcessing(false)
            return
          }
          // 一部の画像が失敗した場合でも続行（エラーは表示しない）
          console.warn(`${errors.length}枚の画像の読み込みに失敗しました（${imageElements.length}枚で続行します）`)
        }

        if (imageElements.length === 0) {
          setError('有効な画像がありません')
          setIsProcessing(false)
          return
        }

        // 統合画像を生成
        const canvas = await mergeImages(imageElements, orientation, layoutType)
        setPreviewCanvas(canvas)
      } catch (err) {
        console.error('Failed to generate preview:', err)
        const errorMessage = err instanceof Error ? err.message : 'Failed to generate preview'
        setError(errorMessage)
      } finally {
        setIsProcessing(false)
      }
    }

    generatePreview()
  }, [previewKey])

  // クリーンアップ
  useEffect(() => {
    return () => {
      // コンポーネントのアンマウント時にのみクリーンアップ
      images.forEach(img => {
        URL.revokeObjectURL(img.preview)
      })
      imageCacheRef.current.clear()
    }
  }, [])

  // ファイル選択ハンドラ
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      addImages(files)
    }
    // 同じファイルを再度選択できるようにリセット
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // ファイルアップロード用ドラッグ&ドロップハンドラ
  const handleFileDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.currentTarget.classList.add("border-primary", "bg-primary/5")
  }

  const handleFileDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove("border-primary", "bg-primary/5")
  }

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.currentTarget.classList.remove("border-primary", "bg-primary/5")
    
    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      addImages(files)
    }
  }

  // ダウンロード
  const handleDownload = () => {
    if (!previewCanvas) return

    const link = document.createElement('a')
    const date = new Date()
    const dateStr = date.toISOString().replace(/[:.]/g, '-').slice(0, -5)
    link.download = `merged-image-${dateStr}.png`
    link.href = previewCanvas.toDataURL('image/png')
    link.click()
  }

  return (
    <div className="space-y-6">
      {/* Image Upload */}
      <Card className="p-8 border-2 border-dashed border-border hover:border-primary/50 transition-colors">
        <div
          onDragOver={handleFileDragOver}
          onDragLeave={handleFileDragLeave}
          onDrop={handleFileDrop}
          className="block cursor-pointer"
        >
          <div className="flex flex-col items-center justify-center gap-4">
            <Upload className="w-12 h-12 text-muted-foreground" />
            <div className="text-center">
              <p className="text-lg font-semibold text-foreground">{t.dragDropImages}</p>
              <p className="text-sm text-muted-foreground mt-1">{t.orClick}</p>
            </div>
            <Button 
              variant="outline" 
              className="mt-2 bg-transparent" 
              onClick={() => fileInputRef.current?.click()}
              disabled={images.length >= getMaxImages(layoutType)}
            >
              {t.selectImages}
            </Button>
            <input 
              ref={fileInputRef} 
              type="file" 
              accept="image/png,image/jpeg,image/jpg,image/webp" 
              multiple
              onChange={handleFileSelect} 
              className="hidden" 
            />
            <p className="text-xs text-muted-foreground">
              {images.length} / {getMaxImages(layoutType)} {t.selectImages}
            </p>
          </div>
        </div>
      </Card>

      {/* Error Message */}
      {error && (
        <Card className="p-4 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
          <p className="text-sm text-red-900 dark:text-red-100">{error}</p>
        </Card>
      )}

      {/* Image List */}
      {images.length > 0 && (
        <Card className="p-4">
          <h3 className="text-lg font-semibold text-foreground mb-4">画像一覧</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map((image, index) => (
              <Card 
                key={image.id} 
                className={`p-4 relative cursor-move transition-opacity ${
                  draggedIndex === index ? 'opacity-50' : ''
                }`}
                draggable
                onDragStart={() => handleImageDragStart(index)}
                onDragOver={(e) => handleImageDragOver(e, index)}
                onDrop={(e) => handleImageDrop(e, index)}
                onDragEnd={handleImageDragEnd}
              >
                <div className="relative">
                  <img 
                    src={image.preview} 
                    alt={image.file.name}
                    className="w-full h-32 object-cover rounded-lg mb-2"
                  />
                  <button
                    onClick={() => removeImage(image.id)}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors z-10"
                    aria-label={t.delete}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mb-2 truncate">{image.file.name}</p>
                <input
                  type="text"
                  value={image.text}
                  onChange={(e) => updateText(image.id, e.target.value)}
                  className="w-full px-2 py-1 text-sm border rounded bg-background text-foreground mb-2"
                  placeholder={`${index + 1}`}
                />
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">{t.textPosition}:</label>
                  <SegmentedControl
                    value={image.textPosition}
                    onValueChange={(value) => updateTextPosition(image.id, value as TextPosition)}
                    options={[
                      { value: 'over', label: t.textPositionOver },
                      { value: 'under', label: t.textPositionUnder },
                    ]}
                    className="w-full"
                  />
                </div>
              </Card>
            ))}
          </div>
        </Card>
      )}

      {/* Layout Settings */}
      {images.length > 0 && (
        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-foreground block mb-2">
                {t.layout}
              </label>
              <SegmentedControl
                value={layoutType}
                onValueChange={(value) => setLayoutType(value as GridLayoutType)}
                options={[
                  { value: '1x1', label: t.layout1x1 },
                  { value: '2x2', label: t.layout2x2 },
                  { value: '3x3', label: t.layout3x3 },
                ]}
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground block mb-2">
                {t.orientation}
              </label>
              <SegmentedControl
                value={orientation}
                onValueChange={(value) => setOrientation(value as Orientation)}
                options={[
                  { value: 'portrait', label: t.portrait },
                  { value: 'landscape', label: t.landscape },
                ]}
              />
            </div>
          </div>
        </Card>
      )}

      {/* Preview */}
      {previewCanvas && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">{t.preview}</h3>
          <div className="flex justify-center mb-4">
            <img 
              src={previewCanvas.toDataURL('image/png')} 
              alt="Preview"
              className="max-w-full h-auto rounded-lg border"
            />
          </div>
          <div className="flex justify-center">
            <Button 
              onClick={handleDownload}
              disabled={isProcessing}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              {t.download}
            </Button>
          </div>
        </Card>
      )}

      {isProcessing && (
        <Card className="p-4">
          <p className="text-sm text-muted-foreground text-center">{t.processing}</p>
        </Card>
      )}
    </div>
  )
}


