import{Outlet}from'react-router-dom';import BottomNav from './BottomNav';import Header from './Header';
export default function AppShell(){return <><Header/><main className="mx-auto max-w-4xl space-y-4 px-4 py-4 pb-safe"><Outlet/></main><BottomNav/></>}
