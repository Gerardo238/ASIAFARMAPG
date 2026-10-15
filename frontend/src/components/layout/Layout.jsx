import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useColors } from '../../hooks/useColors';

const Layout = () => {
    const c = useColors();

    return (
        <div className="flex min-h-screen" style={{
            backgroundColor: c.bg,
            '--af-foco': c.acento,
            '--af-foco-suave': c.darkMode ? 'rgba(95,180,208,0.22)' : 'rgba(31,127,158,0.18)',
            colorScheme: c.darkMode ? 'dark' : 'light'
        }}>
            <Sidebar />
            <main className="flex-1 min-w-0">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
