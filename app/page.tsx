"use client"
import { useState } from "react"
import SceneDetector from "@/components/scene-detector"
import { translations, type Language } from "@/lib/translations"

export default function Home() {
  const [language, setLanguage] = useState<Language>("ja")
  const t = translations[language]

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2">{t.title}</h1>
            <p className="text-lg text-muted-foreground">{t.description}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setLanguage("ja")}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                language === "ja" ? "bg-foreground text-background" : "bg-muted text-foreground hover:bg-muted/80"
              }`}
            >
              日本語
            </button>
            <button
              onClick={() => setLanguage("en")}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                language === "en" ? "bg-foreground text-background" : "bg-muted text-foreground hover:bg-muted/80"
              }`}
            >
              English
            </button>
          </div>
        </div>

        <SceneDetector language={language} />
      </div>
    </main>
  )
}
