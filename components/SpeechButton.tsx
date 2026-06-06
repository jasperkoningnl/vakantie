'use client'

import type { CSSProperties } from 'react'

type SpeechButtonProps = {
  text: string
  lang?: string
  label?: string
  className?: string
  style?: CSSProperties
}

export function SpeechButton({ text, lang = 'fr-FR', label = 'Spreek uit', className, style }: SpeechButtonProps) {
  const speak = () => {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang
    window.speechSynthesis.speak(utterance)
  }

  return (
    <button onClick={speak} className={className} style={style} aria-label={label}>
      <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
        volume_up
      </span>
      {label !== 'Spreek uit' && label}
    </button>
  )
}
