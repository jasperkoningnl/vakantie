import{Printer}from'lucide-react';import{printPage}from'../utils/print';
export default function PrintButton(){return <button onClick={printPage} className="button no-print"><Printer size={18}/>Print deze pagina</button>}
