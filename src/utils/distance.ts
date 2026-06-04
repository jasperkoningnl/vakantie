import type { Coordinates } from '../types';
export const distanceKm=(a:Coordinates,b:Coordinates)=>{const r=6371;const dLat=(b.lat-a.lat)*Math.PI/180;const dLng=(b.lng-a.lng)*Math.PI/180;const s=Math.sin(dLat/2)**2+Math.cos(a.lat*Math.PI/180)*Math.cos(b.lat*Math.PI/180)*Math.sin(dLng/2)**2;return Math.round(2*r*Math.asin(Math.sqrt(s)))};
