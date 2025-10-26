"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { SegmentedControl } from "@/components/ui/segmented-control"
import { Upload, Play, Loader2, Download } from "lucide-react"
import { translations, type Language } from "@/lib/translations"
import { calculateFrameDifference } from "@/lib/frame-difference"
import JSZip from "jszip"

interface ExtractedFrame {
  timestamp: number
  canvas: HTMLCanvasElement
  index: number
  startTime: number
  endTime: number
}

interface SceneDetectorProps {
  language: Language
}

type OutputFormat = "images" | "video"

export default function SceneDetector({ language }: SceneDetectorProps) {
  const t = translations[language]
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [threshold, setThreshold] = useState(0.2)
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("images")
  const [isProcessing, setIsProcessing] = useState(false)
  const [frames, setFrames] = useState<ExtractedFrame[]>([])
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isBulkDownloading, setIsBulkDownloading] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (videoFile && videoRef.current) {
      const url = URL.createObjectURL(videoFile)
      videoRef.current.src = url
      console.log("[v0] Video src set:", url)
      return () => {
        URL.revokeObjectURL(url)
      }
    }
  }, [videoFile])

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    console.log("[v0] File selected:", file?.name, file?.type)
    if (file && file.type.startsWith("video/")) {
      setVideoFile(file)
      setFrames([])
      setError(null)
    } else {
      setError(t.videoError)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.currentTarget.classList.add("border-primary", "bg-primary/5")
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove("border-primary", "bg-primary/5")
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.currentTarget.classList.remove("border-primary", "bg-primary/5")

    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith("video/")) {
      setVideoFile(file)
      setFrames([])
      setError(null)
    }
  }

  const extractFrames = async () => {
    if (!videoRef.current || !canvasRef.current) {
      console.log("[v0] Video or canvas ref not available")
      return
    }

    console.log("[v0] Starting frame extraction")
    setIsProcessing(true)
    setProgress(0)
    setFrames([])
    setError(null)

    try {
      const video = videoRef.current
      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")

      if (!ctx) throw new Error("Canvas context not available")

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          video.removeEventListener("loadedmetadata", handleLoadedMetadata)
          video.removeEventListener("error", handleError)
          reject(new Error("Video metadata loading timeout"))
        }, 10000)

        const handleLoadedMetadata = () => {
          clearTimeout(timeout)
          video.removeEventListener("loadedmetadata", handleLoadedMetadata)
          video.removeEventListener("error", handleError)
          console.log("[v0] Video metadata loaded, duration:", video.duration)
          resolve()
        }
        const handleError = () => {
          clearTimeout(timeout)
          video.removeEventListener("loadedmetadata", handleLoadedMetadata)
          video.removeEventListener("error", handleError)
          reject(new Error("Failed to load video"))
        }

        if (video.readyState >= 1) {
          console.log("[v0] Video metadata already loaded")
          clearTimeout(timeout)
          resolve()
        } else {
          video.addEventListener("loadedmetadata", handleLoadedMetadata)
          video.addEventListener("error", handleError)
        }
      })

      const duration = video.duration
      const fps = 10
      const frameInterval = 1 / fps
      const extractedFrames: ExtractedFrame[] = []
      let previousImageData: ImageData | null = null
      let frameIndex = 0

      // Extract first frame
      video.currentTime = 0
      await new Promise((resolve) => {
        const timeout = setTimeout(() => {
          video.removeEventListener("seeked", handleSeeked)
          resolve(null)
        }, 3000)

        const handleSeeked = () => {
          clearTimeout(timeout)
          video.removeEventListener("seeked", handleSeeked)
          resolve(null)
        }
        video.addEventListener("seeked", handleSeeked)
      })

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      ctx.drawImage(video, 0, 0)

      const firstCanvas = document.createElement("canvas")
      firstCanvas.width = canvas.width
      firstCanvas.height = canvas.height
      const firstCtx = firstCanvas.getContext("2d")
      if (firstCtx) {
        firstCtx.drawImage(canvas, 0, 0)
      }

      extractedFrames.push({
        timestamp: 0,
        canvas: firstCanvas,
        index: frameIndex,
        startTime: 0,
        endTime: frameInterval,
      })
      frameIndex++

      previousImageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

      // Process video frames
      let currentTime = frameInterval
      while (currentTime < duration) {
        video.currentTime = currentTime

        await new Promise((resolve) => {
          const timeout = setTimeout(() => {
            video.removeEventListener("seeked", handleSeeked)
            resolve(null)
          }, 3000)

          const handleSeeked = () => {
            clearTimeout(timeout)
            video.removeEventListener("seeked", handleSeeked)
            resolve(null)
          }
          video.addEventListener("seeked", handleSeeked)
        })

        ctx.drawImage(video, 0, 0)
        const currentImageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

        const diff = calculateFrameDifference(previousImageData, currentImageData)

        if (diff > threshold) {
          const sceneCanvas = document.createElement("canvas")
          sceneCanvas.width = canvas.width
          sceneCanvas.height = canvas.height
          const sceneCtx = sceneCanvas.getContext("2d")
          if (sceneCtx) {
            sceneCtx.drawImage(canvas, 0, 0)
          }

          const previousFrameEndTime = extractedFrames.length > 0 ? extractedFrames[extractedFrames.length - 1].endTime : 0
          
          extractedFrames.push({
            timestamp: currentTime,
            canvas: sceneCanvas,
            index: frameIndex,
            startTime: previousFrameEndTime,
            endTime: currentTime + frameInterval,
          })
          frameIndex++
        }

        previousImageData = currentImageData
        currentTime += frameInterval
        setProgress(Math.round((currentTime / duration) * 100))
      }

      // Update the last frame's end time to the video duration
      if (extractedFrames.length > 0) {
        extractedFrames[extractedFrames.length - 1].endTime = duration
      }

      console.log("[v0] Frame extraction complete, frames:", extractedFrames.length)
      setFrames(extractedFrames)
      setProgress(100)
    } catch (error) {
      console.error("[v0] Frame extraction failed:", error)
      setError(`エラー: ${error instanceof Error ? error.message : "不明なエラーが発生しました"}`)
    } finally {
      setIsProcessing(false)
    }
  }


  const downloadFrame = async (frame: ExtractedFrame) => {
    if (outputFormat === "images") {
      frame.canvas.toBlob((blob) => {
        if (!blob) return
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = `frame_${String(frame.index).padStart(4, "0")}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }, "image/png")
    } else {
      await downloadVideoClip(frame)
    }
  }

  const getSupportedMimeType = (): string => {
    const types = [
      "video/mp4;codecs=h264",
      "video/webm;codecs=vp9",
      "video/webm;codecs=vp8",
      "video/webm",
    ]

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type
      }
    }

    return "video/webm"
  }

  const getFileExtension = (mimeType: string): string => {
    if (mimeType.includes("mp4")) return "mp4"
    return "webm"
  }

  const downloadVideoClip = async (frame: ExtractedFrame) => {
    if (!videoRef.current || !videoFile) return

    const video = videoRef.current
    const { startTime, endTime } = frame

    try {
      // Note: Browser-based video editing is limited
      // This implementation captures the video element's playback
      const videoUrl = URL.createObjectURL(videoFile)
      const tempVideo = document.createElement("video")
      tempVideo.src = videoUrl
      tempVideo.muted = true
      tempVideo.crossOrigin = "anonymous"

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Video loading timeout"))
        }, 10000)

        tempVideo.onloadedmetadata = () => {
          clearTimeout(timeout)
          resolve()
        }
        tempVideo.onerror = () => {
          clearTimeout(timeout)
          reject(new Error("Video loading failed"))
        }
      })

      // Check if captureStream is supported
      if (!tempVideo.captureStream) {
        throw new Error("Video captureStream not supported in this browser")
      }

      // Get supported MIME type
      const mimeType = getSupportedMimeType()
      const fileExtension = getFileExtension(mimeType)

      // Create MediaRecorder to capture the clip
      const stream = tempVideo.captureStream(30)
      const chunks: Blob[] = []
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
      })

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = `clip_${String(frame.index).padStart(4, "0")}.${fileExtension}`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        URL.revokeObjectURL(videoUrl)
      }

      // Start recording at the specified time
      tempVideo.currentTime = startTime
      await new Promise((resolve) => {
        tempVideo.onseeked = resolve
      })

      mediaRecorder.start()
      tempVideo.play()

      // Stop recording at the end time
      setTimeout(() => {
        mediaRecorder.stop()
        tempVideo.pause()
      }, (endTime - startTime) * 1000)
    } catch (error) {
      console.error("Failed to create video clip:", error)
      setError(
        language === "ja"
          ? "動画クリップの作成に失敗しました。ブラウザがサポートしていない可能性があります。"
          : "Failed to create video clip. Your browser may not support this feature."
      )
    }
  }

  const downloadAllFrames = async () => {
    if (frames.length === 0) return

    setIsBulkDownloading(true)

    try {
      if (outputFormat === "images") {
        const zip = new JSZip()

        // Add all frames to ZIP
        for (const frame of frames) {
          const blob = await new Promise<Blob>((resolve) => {
            frame.canvas.toBlob((blob) => {
              resolve(blob || new Blob())
            }, "image/png")
          })
          zip.file(`frame_${String(frame.index).padStart(4, "0")}.png`, blob)
        }

        // Generate ZIP file
        const zipBlob = await zip.generateAsync({ type: "blob" })
        const url = URL.createObjectURL(zipBlob)
        const link = document.createElement("a")
        link.href = url
        link.download = "extracted_frames.zip"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      } else {
        // Download video clips one by one
        for (const frame of frames) {
          await downloadVideoClip(frame)
          // Small delay between downloads
          await new Promise((resolve) => setTimeout(resolve, 500))
        }
      }
    } catch (error) {
      console.error("Failed to download:", error)
      setError(language === "ja" ? "ダウンロードに失敗しました" : "Failed to download")
    } finally {
      setIsBulkDownloading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Video Upload */}
      <Card className="p-8 border-2 border-dashed border-border hover:border-primary/50 transition-colors">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className="block cursor-pointer"
        >
          <div className="flex flex-col items-center justify-center gap-4">
            <Upload className="w-12 h-12 text-muted-foreground" />
            <div className="text-center">
              <p className="text-lg font-semibold text-foreground">{t.dragDrop}</p>
              <p className="text-sm text-muted-foreground mt-1">{t.orClick}</p>
            </div>
            <Button variant="outline" className="mt-2 bg-transparent" onClick={() => fileInputRef.current?.click()}>
              {t.selectFile}
            </Button>
            <input ref={fileInputRef} type="file" accept="video/*" onChange={handleVideoSelect} className="hidden" />
          </div>
        </div>
      </Card>

      {/* Error Message */}
      {error && (
        <Card className="p-4 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
          <p className="text-sm text-red-900 dark:text-red-100">{error}</p>
        </Card>
      )}

      {/* Video Preview */}
      {videoFile && (
        <Card className="p-4">
          <p className="text-sm font-semibold text-foreground mb-2">
            {t.selectedFile} {videoFile.name}
          </p>
          <video ref={videoRef} className="w-full max-h-64 bg-black rounded-lg" controls />
        </Card>
      )}

      {/* Threshold Slider */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-foreground block mb-2">
              {t.sensitivity} {threshold.toFixed(2)}
            </label>
            <p className="text-xs text-muted-foreground mb-4">{t.sensitivityHint}</p>
            <Slider
              value={[threshold]}
              onValueChange={(value) => setThreshold(value[0])}
              min={0.05}
              max={0.5}
              step={0.05}
              disabled={isProcessing}
              className="w-full"
            />
          </div>
          <div className="flex gap-2 text-xs text-muted-foreground">
            <span>{t.recommendedValues}</span>
          </div>
        </div>
      </Card>

      {/* Output Format Selection */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-foreground block mb-3">
              {t.outputFormat}
            </label>
            <SegmentedControl
              value={outputFormat}
              onValueChange={(value) => setOutputFormat(value as OutputFormat)}
              options={[
                { value: "images", label: t.outputFormatImages },
                { value: "video", label: t.outputFormatVideo },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Extract Button */}
      <Button onClick={extractFrames} disabled={!videoFile || isProcessing} size="lg" className="w-full">
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {t.processing} {progress}%
          </>
        ) : (
          <>
            <Play className="w-4 h-4 mr-2" />
            {t.startExtraction}
          </>
        )}
      </Button>

      {/* Frames Preview */}
      {frames.length > 0 && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-foreground">
                {t.extractedFrames} ({frames.length})
              </h3>
              <Button 
                onClick={downloadAllFrames} 
                disabled={isBulkDownloading}
                variant="outline"
                size="sm"
              >
                {isBulkDownloading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t.bulkDownloading}
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    {t.bulkDownload}
                  </>
                )}
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {frames.map((frame) => (
                <div
                  key={frame.index}
                  className="relative group overflow-hidden rounded-lg bg-muted aspect-video cursor-pointer"
                  onClick={() => downloadFrame(frame)}
                >
                  <canvas
                    ref={(canvas) => {
                      if (canvas && frame.canvas) {
                        const ctx = canvas.getContext("2d")
                        if (ctx) {
                          canvas.width = frame.canvas.width
                          canvas.height = frame.canvas.height
                          ctx.drawImage(frame.canvas, 0, 0)
                        }
                      }
                    }}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    <div className="text-white text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity text-center whitespace-pre-line">
                      {t.clickToDownload}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Info */}
      <Card className="p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-900 dark:text-blue-100">
          <strong>💡 {language === "ja" ? "ヒント" : "Tip"}:</strong> {t.hint}
        </p>
      </Card>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
