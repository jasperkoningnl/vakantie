'use client'
import 'leaflet/dist/leaflet.css'
import { useEffect, useRef } from 'react'
import type { Map as LeafletMap, Marker } from 'leaflet'
import { Uitje } from '@/lib/uitjes'

const CATEGORY_COLORS: Record<string, string> = {
  entertainment: '#FF6B6B',
  culture: '#4D96FF',
  food: '#FFD93D',
  shop: '#22c55e',
}

const LES_ESCALIERS: [number, number] = [44.521, 1.150]

// Distance rings in km (approximate, 1 degree lat ≈ 111 km)
const RING_MINUTES = [
  { minutes: 30,  km: 35,  color: '#4D96FF', label: '30 min' },
  { minutes: 60,  km: 70,  color: '#22c55e', label: '1 uur' },
  { minutes: 120, km: 140, color: '#FF6B6B', label: '2 uur' },
]

interface Props {
  uitjes: Uitje[]
  selected: string | null
  onSelect: (id: string) => void
  basketIds: string[]
  onBasket: (id: string) => void
}

export default function UitjesMap({ uitjes, selected, onSelect, basketIds, onBasket }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const markersRef = useRef<Record<string, Marker>>({})

  useEffect(() => {
    if (!containerRef.current) return

    let map: LeafletMap

    import('leaflet').then(L => {
      if (!containerRef.current || mapRef.current) return

      map = L.map(containerRef.current, { zoomControl: true }).setView([44.5, 1.2], 10)
      mapRef.current = map

      L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenTopoMap contributors',
        maxZoom: 17,
      }).addTo(map)

      // Distance rings around Les Escaliers
      RING_MINUTES.forEach(ring => {
        L.circle(LES_ESCALIERS, {
          radius: ring.km * 1000,
          color: ring.color,
          fillColor: ring.color,
          fillOpacity: 0.04,
          weight: 1.5,
          dashArray: '6 4',
          opacity: 0.5,
        })
          .addTo(map)
          .bindTooltip(ring.label, { permanent: false, direction: 'top', className: 'leaflet-distance-tooltip' })
      })

      // Les Escaliers home marker
      const homeIcon = L.divIcon({
        className: '',
        html: `<div style="width:40px;height:40px;border-radius:50%;background:#2C2316;border:3px solid white;box-shadow:0 3px 12px rgba(44,35,22,0.45);cursor:default;display:flex;align-items:center;justify-content:center;">
          <span style="font-size:18px;">🏠</span>
        </div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      })
      L.marker(LES_ESCALIERS, { icon: homeIcon, zIndexOffset: 1000 })
        .addTo(map)
        .bindPopup(`
          <div style="font-family:sans-serif;min-width:160px;">
            <p style="font-weight:700;margin:0 0 2px;">Les Escaliers</p>
            <p style="font-size:11px;color:#64748B;margin:0;">Thuisbasis</p>
          </div>
        `)

      // Activity markers
      uitjes.forEach(u => {
        const color = CATEGORY_COLORS[u.type] || '#FF6B6B'
        const icon = L.divIcon({
          className: '',
          html: `<div style="width:32px;height:32px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.25);cursor:pointer;"></div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        })
        const marker = L.marker(u.coords, { icon }).addTo(map)
        marker.on('click', () => onSelect(u.id))
        markersRef.current[u.id] = marker
      })
    })

    const handleBasketAdd = (e: Event) => {
      onBasket((e as CustomEvent).detail)
    }
    document.addEventListener('basket-add', handleBasketAdd)

    return () => {
      document.removeEventListener('basket-add', handleBasketAdd)
      mapRef.current?.remove()
      mapRef.current = null
      markersRef.current = {}
    }
  }, [])

  useEffect(() => {
    if (!mapRef.current || !selected) return
    const uitje = uitjes.find(u => u.id === selected)
    if (!uitje) return

    import('leaflet').then(L => {
      if (!mapRef.current) return
      mapRef.current.setView(uitje.coords, 13)
      const inBasket = basketIds.includes(uitje.id)
      const addBtn = inBasket
        ? `<span style="font-size:11px;color:#FF6B6B;font-weight:600;">✓ In plan</span>`
        : `<button onclick="document.dispatchEvent(new CustomEvent('basket-add',{detail:'${uitje.id}'}));this.textContent='✓ Toegevoegd';" style="font-size:11px;color:#FF6B6B;font-weight:600;background:none;border:none;cursor:pointer;padding:0;">+ Voeg toe</button>`

      L.popup({ closeButton: true })
        .setLatLng(uitje.coords)
        .setContent(`
          <div style="font-family:sans-serif;min-width:180px;">
            <p style="font-weight:700;margin:0 0 4px;">${uitje.name}</p>
            <p style="font-size:12px;color:#64748B;margin:0 0 8px;">${uitje.drive} · ${uitje.desc}</p>
            <div style="display:flex;gap:8px;align-items:center;">
              <a href="${uitje.gmaps}" target="_blank" style="font-size:11px;color:#4D96FF;font-weight:600;">Maps</a>
              ${addBtn}
            </div>
          </div>
        `)
        .openOn(mapRef.current)
    })
  }, [selected])

  return <div ref={containerRef} className="w-full h-full" />
}
