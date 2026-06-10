import type { Map as LeafletMap, TileLayer } from 'leaflet'

type LeafletModule = typeof import('leaflet')

// Carto als primaire bron: app-vriendelijke CDN zonder Referer-eis.
// OSM dwingt zijn tile-policy (verplichte Referer) inmiddels hard af en
// levert anders grijze "Access blocked"-tiles; daarom alleen als fallback.
const PRIMARY_TILE_LAYER = {
  url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
  attribution: '© OpenStreetMap contributors © CARTO',
  maxZoom: 19,
}

const FALLBACK_TILE_LAYER = {
  url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '© OpenStreetMap contributors',
  maxZoom: 19,
}

export function addReliableTileLayer(L: LeafletModule, map: LeafletMap): TileLayer {
  let switchedToFallback = false
  // Bewust geen crossOrigin: CORS-tiles falen volledig achter wifi-proxies
  // (camping/hotel) die de CORS-headers strippen; gewone <img>-loads niet.
  // Expliciete referrerPolicy zodat tile-servers ook in PWA-modus een
  // Referer-header ontvangen (OSM vereist die).
  const primaryLayer = L.tileLayer(PRIMARY_TILE_LAYER.url, {
    attribution: PRIMARY_TILE_LAYER.attribution,
    maxZoom: PRIMARY_TILE_LAYER.maxZoom,
    referrerPolicy: 'strict-origin-when-cross-origin',
  }).addTo(map)

  primaryLayer.on('tileerror', () => {
    if (switchedToFallback) return
    switchedToFallback = true
    primaryLayer.removeFrom(map)
    L.tileLayer(FALLBACK_TILE_LAYER.url, {
      attribution: FALLBACK_TILE_LAYER.attribution,
      maxZoom: FALLBACK_TILE_LAYER.maxZoom,
      referrerPolicy: 'strict-origin-when-cross-origin',
    }).addTo(map)
  })

  return primaryLayer
}

export function invalidateMapSizeSoon(map: LeafletMap, onReady?: () => void) {
  window.requestAnimationFrame(() => {
    map.invalidateSize()
    window.setTimeout(() => {
      map.invalidateSize()
      onReady?.()
    }, 150)
  })
}
