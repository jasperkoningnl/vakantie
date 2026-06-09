import type { Map as LeafletMap, TileLayer } from 'leaflet'

type LeafletModule = typeof import('leaflet')

const PRIMARY_TILE_LAYER = {
  url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '© OpenStreetMap contributors',
  maxZoom: 19,
}

const FALLBACK_TILE_LAYER = {
  url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
  attribution: '© OpenStreetMap contributors © CARTO',
  maxZoom: 19,
}

export function addReliableTileLayer(L: LeafletModule, map: LeafletMap): TileLayer {
  let switchedToFallback = false
  const primaryLayer = L.tileLayer(PRIMARY_TILE_LAYER.url, {
    attribution: PRIMARY_TILE_LAYER.attribution,
    maxZoom: PRIMARY_TILE_LAYER.maxZoom,
    crossOrigin: true,
  }).addTo(map)

  primaryLayer.on('tileerror', () => {
    if (switchedToFallback) return
    switchedToFallback = true
    primaryLayer.removeFrom(map)
    L.tileLayer(FALLBACK_TILE_LAYER.url, {
      attribution: FALLBACK_TILE_LAYER.attribution,
      maxZoom: FALLBACK_TILE_LAYER.maxZoom,
      crossOrigin: true,
    }).addTo(map)
  })

  return primaryLayer
}

export function invalidateMapSizeSoon(map: LeafletMap) {
  window.requestAnimationFrame(() => {
    map.invalidateSize()
    window.setTimeout(() => map.invalidateSize(), 150)
  })
}
