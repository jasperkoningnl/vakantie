'use client'
import 'leaflet/dist/leaflet.css'
import { useEffect, useRef } from 'react'
import type { Map as LeafletMap } from 'leaflet'

const HEEN_ROUTE: [number, number][] = [
  [52.155, 5.387],
  [51.22, 4.40],
  [49.259, 4.031],
  [48.856, 2.352],
  [47.798, 3.567],
  [47.077, 2.983],
  [46.562, 2.008],
  [45.148, 1.532],
  [44.3982, 1.1189],
]

const TERUG_ROUTE: [number, number][] = [
  [44.3982, 1.1189],
  [45.833, 1.261],
  [46.557, 1.980],
  [47.906, 1.904],
  [48.457, 1.490],
  [51.22, 4.40],
  [52.155, 5.387],
]

const MARKERS: { coords: [number, number]; label: string; color: string }[] = [
  { coords: [52.155, 5.387], label: 'Amersfoort', color: '#1E293B' },
  { coords: [47.861, 3.562], label: 'Atelier des Sens', color: '#4D96FF' },
  { coords: [44.3982, 1.1189], label: 'Les Escaliers', color: '#FF6B6B' },
  { coords: [48.447, 1.489], label: 'Chartres', color: '#4D96FF' },
]

export default function RouteMap() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<LeafletMap | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    import('leaflet').then(L => {
      if (!containerRef.current || mapRef.current) return

      const map = L.map(containerRef.current, { zoomControl: true }).setView([47.5, 2.5], 5)
      mapRef.current = map

      L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenTopoMap contributors',
        maxZoom: 17,
      }).addTo(map)

      L.polyline(HEEN_ROUTE, { color: '#4D96FF', weight: 3, opacity: 0.85 }).addTo(map)
      L.polyline(TERUG_ROUTE, { color: '#FF6B6B', weight: 3, opacity: 0.85, dashArray: '8 6' }).addTo(map)

      MARKERS.forEach(m => {
        const icon = L.divIcon({
          className: '',
          html: `<div style="background:${m.color};color:white;padding:3px 7px;border-radius:6px;font-size:10px;font-weight:700;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.2);">${m.label}</div>`,
          iconAnchor: [0, 0],
        })
        L.marker(m.coords, { icon }).addTo(map)
      })
    })

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [])

  return <div ref={containerRef} className="w-full h-full" />
}
