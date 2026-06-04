'use client'
import { useEffect, useRef } from 'react'
import { Uitje } from '@/lib/uitjes'

const CATEGORY_COLORS: Record<string, string> = {
  entertainment: '#FF6B6B',
  culture: '#4D96FF',
  food: '#FFD93D',
  shop: '#22c55e',
}

interface Props {
  uitjes: Uitje[]
  selected: string | null
  onSelect: (id: string) => void
  basketIds: string[]
  onBasket: (id: string) => void
}

export default function UitjesMap({ uitjes, selected, onSelect, basketIds, onBasket }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<unknown>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    import('leaflet').then(L => {
      const map = L.map(mapRef.current!, { zoomControl: true }).setView([44.5, 1.2], 10)
      mapInstanceRef.current = map

      L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenTopoMap contributors',
        maxZoom: 17,
      }).addTo(map)

      uitjes.forEach(u => {
        const color = CATEGORY_COLORS[u.type] || '#FF6B6B'
        const icon = L.divIcon({
          className: '',
          html: `<div style="width:32px;height:32px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;cursor:pointer;"></div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        })

        const marker = L.marker(u.coords, { icon }).addTo(map)
        marker.on('click', () => onSelect(u.id))

        if (u.id === selected) {
          const popup = L.popup({ closeButton: false })
            .setLatLng(u.coords)
            .setContent(`
              <div style="font-family:sans-serif;min-width:180px;">
                <p style="font-weight:700;margin:0 0 4px;">${u.name}</p>
                <p style="font-size:12px;color:#64748B;margin:0 0 8px;">${u.drive} · ${u.desc}</p>
                <div style="display:flex;gap:6px;">
                  <a href="${u.gmaps}" target="_blank" style="font-size:11px;color:#4D96FF;font-weight:600;">Maps</a>
                  ${basketIds.includes(u.id) ? `<span style="font-size:11px;color:#FF6B6B;font-weight:600;">✓ In plan</span>` : `<button onclick="document.dispatchEvent(new CustomEvent('basket-add',{detail:'${u.id}'}));this.textContent='✓ Toegevoegd';" style="font-size:11px;color:#FF6B6B;font-weight:600;background:none;border:none;cursor:pointer;padding:0;">+ Voeg toe</button>`}
                </div>
              </div>
            `)
          popup.openOn(map)
        }
      })

      document.addEventListener('basket-add', ((e: CustomEvent) => {
        onBasket(e.detail)
      }) as EventListener)

      return () => {
        document.removeEventListener('basket-add', (() => {}) as EventListener)
        map.remove()
        mapInstanceRef.current = null
      }
    })
  }, [])

  useEffect(() => {
    if (!mapInstanceRef.current) return
    import('leaflet').then(L => {
      const map = mapInstanceRef.current as L.Map
      if (selected) {
        const uitje = uitjes.find(u => u.id === selected)
        if (uitje) {
          map.setView(uitje.coords, 12)
          const popup = L.popup({ closeButton: true })
            .setLatLng(uitje.coords)
            .setContent(`
              <div style="font-family:sans-serif;min-width:180px;">
                <p style="font-weight:700;margin:0 0 4px;">${uitje.name}</p>
                <p style="font-size:12px;color:#64748B;margin:0 0 8px;">${uitje.drive} · ${uitje.desc}</p>
                <a href="${uitje.gmaps}" target="_blank" style="font-size:11px;color:#4D96FF;font-weight:600;">Maps openen →</a>
              </div>
            `)
          popup.openOn(map)
        }
      }
    })
  }, [selected])

  return <div ref={mapRef} className="w-full h-full rounded-2xl overflow-hidden" />
}
