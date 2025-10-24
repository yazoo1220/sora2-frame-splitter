"use client"
import SceneDetector from "@/components/scene-detector"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2">Scene Detector</h1>
          <p className="text-lg text-muted-foreground">
            動画から自動でシーン検出し、各ショットの先頭フレームを抽出します
          </p>
        </div>

        <SceneDetector />
      </div>
    </main>
  )
}
