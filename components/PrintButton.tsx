'use client'

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-full px-3 py-1.5 text-xs font-bold flex items-center gap-1"
      style={{ background: '#F0E9DA', border: '1px solid #E4D9C8', color: '#6B5A3E' }}
    >
      <span className="material-symbols-outlined text-sm">print</span>
      Print
    </button>
  )
}
