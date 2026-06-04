import{Outlet}from'react-router-dom';import BottomNav from './BottomNav';import Header from './Header';
export default function AppShell(){return <><Header/><main className="desktop-shell mx-auto space-y-5 px-4 py-5 pb-safe md:px-8"><Outlet/></main><BottomNav/></>}
