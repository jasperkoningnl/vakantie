import{Siren}from'lucide-react';import{Link}from'react-router-dom';
export default function EmergencyButton(){return <Link to="/medisch" className="no-print inline-flex items-center gap-2 rounded-xl bg-red-700 px-4 py-3 text-sm font-black text-white shadow-lg shadow-red-900/10 transition hover:bg-red-800"><Siren size={18}/>Emergency</Link>}
