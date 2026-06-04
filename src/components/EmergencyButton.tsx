import{HeartPulse}from'lucide-react';import{Link}from'react-router-dom';
export default function EmergencyButton(){return <Link to="/nood" className="inline-flex items-center gap-2 rounded-2xl bg-red-700 px-3 py-2 text-sm font-bold text-white shadow"><HeartPulse size={18}/> Nood</Link>}
