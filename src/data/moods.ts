import type { Mood } from '../types';
export const moods:Mood[]=[
{id:'nearby',label:'Dichtbij en makkelijk',description:'Korte rit, overzichtelijk, weinig moeten.',matcher:p=>(p.driveTimeMinutes??999)<=45&&p.category!=='route_stop'},
{id:'water',label:'Meertje of zwemmen',description:'Water, afkoelen, picknickgevoel.',matcher:p=>p.waterNearby||p.category==='lake'},
{id:'woods',label:'Bos en schaduw',description:'Schaduw, buitenlucht en rustig bewegen.',matcher:p=>Boolean(p.shade)||p.category==='woods'},
{id:'castle-village',label:'Kasteel of mooi dorpje',description:'Iets moois zien zonder database-denken.',matcher:p=>['castle','village'].includes(p.category)},
{id:'animals-park',label:'Dieren of pretpark',description:'Veel beleven met Lena.',matcher:p=>['zoo','amusement_park'].includes(p.category)},
{id:'playground',label:'Speeltuin of park',description:'Energie eruit, simpele stop.',matcher:p=>['playground','park'].includes(p.category)},
{id:'food',label:'Lekker eten of patisserie',description:'Een dag bouwen rond eten, ijs of koffie.',matcher:p=>['restaurant','patisserie'].includes(p.category)},
{id:'rain',label:'Regenplan',description:'Droog, kort, cafés of binnen.',matcher:p=>Boolean(p.rainyDay||p.indoor||p.vegetarianFriendly)},
{id:'big',label:'Grote dagtrip',description:'Als iedereen energie heeft voor langer rijden.',matcher:p=>p.distanceGroup==='120min'}
];
export const quickChoices=['Dichtbij','Water','Bos/schaduw','Kasteel/dorp','Dieren/pretpark','Speeltuin/park','Lekker eten','Regenplan','Rustige dag','Grote trip'];
