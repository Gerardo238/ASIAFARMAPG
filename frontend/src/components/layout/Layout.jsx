import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useTheme } from '../../context/ThemeContext';

const Layout = () => {
    const { darkMode } = useTheme();

    return (
        <div className="flex min-h-screen" style={{ backgroundColor: darkMode ? '#0F172A' : '#F0F4F8' }}>
            <Sidebar />
            <main className="flex-1 overflow-auto">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;