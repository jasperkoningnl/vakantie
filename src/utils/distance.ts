import type { Coordinates } from '../types';
export const distanceKm=(a:Coordinates,b:Coordinates)=>{const toRad=(v:number)=>v*Math.PI/180;const r=6371;const dLat=toRad(b[0]-a[0]);const dLng=toRad(b[1]-a[1]);const lat1=toRad(a[0]);const lat2=toRad(b[0]);const x=Math.sin(dLat/2)**2+Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLng/2)**2;return 2*r*Math.asin(Math.sqrt(x))};
