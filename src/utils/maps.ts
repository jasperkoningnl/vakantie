import type { DayPlan, DayStop, Place } from '../types';
import { placeById } from '../data/places';
const placeLabel=(stop:DayStop)=>{const p=placeById(stop.placeId);return p?.address??p?.name??stop.customTitle??'Stop'};
export function stopMapsUrl(stop:DayStop){return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(placeLabel(stop))}`}
export function dayPlanRouteUrl(plan:DayPlan,origin:Place){const stops=plan.stops.filter(s=>s.placeId||s.customTitle);const labels=stops.map(placeLabel);const destination=labels.at(-1)??origin.address??origin.name;const waypoints=labels.slice(0,-1);const params=new URLSearchParams({api:'1',origin:origin.address??origin.name,destination});if(waypoints.length)params.set('waypoints',waypoints.join('|'));return `https://www.google.com/maps/dir/?api=1&${params.toString()}`}
