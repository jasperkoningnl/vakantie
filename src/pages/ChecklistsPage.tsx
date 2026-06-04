import Checklist from '../components/Checklist';import{checklistGroups}from'../data/checklists';
export default function ChecklistsPage(){return <><section className="card"><h2 className="text-2xl font-bold">Checklists</h2><p className="mt-2 text-stone-700">Afvinken wordt lokaal op dit apparaat opgeslagen met LocalStorage.</p></section><Checklist groups={checklistGroups}/></>}
