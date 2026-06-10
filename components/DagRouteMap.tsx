'use client'
import 'leaflet/dist/leaflet.css'
import { useEffect, useRef } from 'react'
import type { Map as LeafletMap, LayerGroup } from 'leaflet'
import { addReliableTileLayer, invalidateMapSizeSoon } from '@/components/leafletTiles'

type LeafletModule = typeof import('leaflet')

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

function drawStops(L: LeafletModule, map: LeafletMap, stops: MapStop[]): LayerGroup {
  const group = L.layerGroup().addTo(map)

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
    }).addTo(group)
  }

  stopsWithCoords.forEach((stop, i) => {
    const bg = stop.isMainDest ? '#9B6845' : stop.isTip ? '#A8937A' : '#4D96FF'
    const icon = L.divIcon({
      className: '',
      html: `<div style="width:26px;height:26px;border-radius:50%;background:${bg};border:2.5px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;color:white;font-size:11px;font-weight:700;">${i + 1}</div>`,
      iconSize: [26, 26],
      iconAnchor: [13, 13],
    })
    L.marker(stop.coords as [number, number], { icon })
      .addTo(group)
      .bindPopup(`<div style="font-weight:600;font-size:12px;font-family:sans-serif;">${stop.name}</div>`)
  })

  const allPoints: [number, number][] = [HOME_COORDS, ...stopsWithCoords.map(s => s.coords as [number, number])]
  if (allPoints.length > 1) {
    map.fitBounds(L.latLngBounds(allPoints), { padding: [30, 30] })
  } else {
    map.setView(HOME_COORDS, 10)
  }

  return group
}

export default function DagRouteMap({ stops }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const leafletRef = useRef<LeafletModule | null>(null)
  const stopsLayerRef = useRef<LayerGroup | null>(null)
  const stopsRef = useRef(stops)

  useEffect(() => {
    stopsRef.current = stops
  })

  useEffect(() => {
    if (!containerRef.current) return

    import('leaflet').then(L => {
      if (!containerRef.current || mapRef.current) return

      const map = L.map(containerRef.current, { zoomControl: true, attributionControl: true })
      mapRef.current = map
      leafletRef.current = L

      addReliableTileLayer(L, map)

      stopsLayerRef.current = drawStops(L, map, stopsRef.current)
      // Opnieuw fitten zodra de container zijn definitieve maat heeft,
      // anders rekent Leaflet de zoom uit op een nog niet uitgelijnde container.
      invalidateMapSizeSoon(map, () => {
        stopsLayerRef.current?.remove()
        stopsLayerRef.current = drawStops(L, map, stopsRef.current)
      })
    })

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
      leafletRef.current = null
      stopsLayerRef.current = null
    }
  }, [])

  // Herteken route en markers wanneer de stops wijzigen (bestemming, volgorde).
  useEffect(() => {
    const L = leafletRef.current
    const map = mapRef.current
    if (!L || !map) return

    stopsLayerRef.current?.remove()
    stopsLayerRef.current = drawStops(L, map, stops)
  }, [stops])

  return <div ref={containerRef} className="w-full h-full" />
}
