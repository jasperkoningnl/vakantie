'use client'
import 'leaflet/dist/leaflet.css'
import { useEffect, useRef } from 'react'
import type { Map as LeafletMap } from 'leaflet'
import { addReliableTileLayer, invalidateMapSizeSoon } from '@/components/leafletTiles'

const HOME_COORDS: [number, number] = [44.398, 1.119]

export interface MapStop {
  name: string
  coords?: [number, number]
  isMainDest?: boolean
  isTip?: boolean
}

interface Props {
  stops: MapStop[]
}

export default function DagRouteMap({ stops }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<LeafletMap | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    import('leaflet').then(L => {
      if (!containerRef.current || mapRef.current) return

      const map = L.map(containerRef.current, { zoomControl: true, attributionControl: true })
      mapRef.current = map

      addReliableTileLayer(L, map)
      invalidateMapSizeSoon(map)

      const stopsWithCoords = stops.filter(s => s.coords)
      const routePoints: [number, number][] = [
        HOME_COORDS,
        ...stopsWithCoords.map(s => s.coords as [number, number]),
        HOME_COORDS,
      ]

      if (stopsWithCoords.length > 0) {
        L.polyline(routePoints, {
          color: '#9B6845',
          weight: 2.5,
          opacity: 0.7,
          dashArray: '8 5',
        }).addTo(map)
      }

      const homeIcon = L.divIcon({
        className: '',
        html: `<div style="width:30px;height:30px;border-radius:50%;background:#2C2316;border:2.5px solid white;box-shadow:0 2px 8px rgba(44,35,22,0.35);display:flex;align-items:center;justify-content:center;font-size:13px;">🏠</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      })
      L.marker(HOME_COORDS, { icon: homeIcon, zIndexOffset: 1000 })
        .addTo(map)
        .bindPopup('<div style="font-weight:700;font-size:13px;">Les Escaliers</div>')

      stopsWithCoords.forEach((stop, i) => {
        const bg = stop.isMainDest ? '#9B6845' : stop.isTip ? '#A8937A' : '#4D96FF'
        const icon = L.divIcon({
          className: '',
          html: `<div style="width:26px;height:26px;border-radius:50%;background:${bg};border:2.5px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;color:white;font-size:11px;font-weight:700;">${i + 1}</div>`,
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        })
        L.marker(stop.coords as [number, number], { icon })
          .addTo(map)
          .bindPopup(`<div style="font-weight:600;font-size:12px;font-family:sans-serif;">${stop.name}</div>`)
      })

      const allPoints: [number, number][] = [HOME_COORDS, ...stopsWithCoords.map(s => s.coords as [number, number])]
      if (allPoints.length > 1) {
        map.fitBounds(L.latLngBounds(allPoints), { padding: [30, 30] })
      } else {
        map.setView(HOME_COORDS, 10)
      }
    })

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [])

  return <div ref={containerRef} className="w-full h-full" />
}
