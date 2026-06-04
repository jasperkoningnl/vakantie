import{HeartPulse}from'lucide-react';import{Link}from'react-router-dom';
export default function EmergencyButton(){return <Link to="/medisch" className="no-print inline-flex items-center gap-2 rounded-full bg-red-600 px-3 py-2 text-sm font-bold text-white shadow"><HeartPulse size={18}/>Medisch</Link>}
