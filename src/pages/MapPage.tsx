import MapView from '../components/MapView';import{places}from'../data/places';
export default function MapPage(){return <><section className="card"><h2 className="text-2xl font-bold">Plekken</h2><p className="mt-2 text-stone-700">Gedeelde dataset voor uitstapjes, eten, boodschappen, brandstof en medische stops. De kaart is een tool binnen de planning.</p></section><MapView places={places}/></>}
