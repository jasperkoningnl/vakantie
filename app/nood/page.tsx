const EMERGENCY = [
  { emoji: '🚑', number: '112', label: 'Europees alarmnummer', color: '#C0392B', bg: '#FDECEA' },
  { emoji: '🏥', number: '15', label: 'SAMU medische spoed', color: '#1A6FA8', bg: '#E8F4FC' },
  { emoji: '🔥', number: '18', label: 'Pompiers brandweer', color: '#B45309', bg: '#FEF3C7' },
]

export default function NoodPage() {
  return (
    <div className="px-4 pt-6 pb-16 max-w-md mx-auto">
      <div className="mb-5">
        <div
          className="text-xl font-semibold mb-0.5"
          style={{ fontFamily: 'var(--font-hand)', color: 'oklch(57% 0.14 40)' }}
        >
          Notre Voyage
        </div>
        <h1
          className="text-3xl font-medium leading-tight"
          style={{ fontFamily: 'var(--font-journal)', fontStyle: 'italic', color: '#2C2316' }}
        >
          Noodmodus
        </h1>
      </div>

      <section
        className="rounded-2xl p-4 mb-4"
        style={{ background: '#FAF7F0', border: '1px solid #E4D9C8' }}
      >
        <p className="text-sm text-on-surface-variant">
          Deze openbare noodmodus bevat alleen minimale telefoonnummers en geen medische context of persoonsgegevens.
        </p>
      </section>

      <div className="flex flex-col gap-3">
        {EMERGENCY.map(item => (
          <a
            key={item.number}
            href={`tel:${item.number}`}
            className="rounded-2xl p-5 flex items-center gap-4 shadow-blue"
            style={{ background: item.bg, border: `1.5px solid ${item.color}20` }}
          >
            <span className="text-3xl">{item.emoji}</span>
            <span className="flex-1">
              <span className="block text-3xl font-black" style={{ color: item.color }}>{item.number}</span>
              <span className="block text-sm text-on-surface-variant">{item.label}</span>
            </span>
          </a>
        ))}
      </div>

      <a href="/medisch" className="text-sm font-semibold mt-6 inline-block" style={{ color: 'oklch(57% 0.14 40)' }}>
        Naar privé medische pagina →
      </a>
    </div>
  )
}
