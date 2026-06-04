import MapView from '../components/MapView';import{places}from'../data/places';
export default function MapPage(){return <><section className="card"><h2 className="text-2xl font-bold">Kaart en plekken</h2><p className="mt-2 text-stone-700">Filter op verblijf, uitstapjes, praktisch of medisch. De kaart gebruikt OpenStreetMap.</p></section><MapView places={places}/></>}
