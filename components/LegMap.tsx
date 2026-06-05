'use client'
import 'leaflet/dist/leaflet.css'
import { useEffect, useRef } from 'react'
import type { Map as LeafletMap } from 'leaflet'

interface LegMapProps {
  route: [number, number][]
  markers: { coords: [number, number]; label: string; color?: string }[]
  color?: string
  dashed?: boolean
}

export default function LegMap({ route, markers, color = '#4D96FF', dashed = false }: LegMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<LeafletMap | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    import('leaflet').then(L => {
      if (!containerRef.current || mapRef.current) return

      const map = L.map(containerRef.current, { zoomControl: false, attributionControl: false })
      mapRef.current = map

      L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        maxZoom: 17,
      }).addTo(map)

      const polyline = L.polyline(route, {
        color,
        weight: 3,
        opacity: 0.9,
        dashArray: dashed ? '8 6' : undefined,
      }).addTo(map)

      markers.forEach(m => {
        const icon = L.divIcon({
          className: '',
          html: `<div style="background:${m.color ?? color};color:white;padding:3px 7px;border-radius:6px;font-size:10px;font-weight:700;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.2);">${m.label}</div>`,
          iconAnchor: [0, 0],
        })
        L.marker(m.coords, { icon }).addTo(map)
      })

      map.fitBounds(polyline.getBounds(), { padding: [20, 20] })
    })

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [])

  return <div ref={containerRef} className="w-full h-full" />
}
