import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
    LayoutDashboard, Pill, Package, Building2,
    FileText, Truck, LogOut, User, Moon, Sun,
    FileBarChart, Users, ArrowUpDown, GitBranch
} from 'lucide-react';

const Sidebar = () => {
    const { usuario, logout } = useAuth();
    const { darkMode, toggleDarkMode } = useTheme();

    const menuItems = [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['administrador', 'gerente', 'bodeguero', 'encargado_contratos'] },
        { path: '/usuarios', label: 'Usuarios', icon: Users, roles: ['administrador'] },
        { path: '/productos', label: 'Productos', icon: Pill, roles: ['administrador', 'bodeguero'] },
        { path: '/lotes', label: 'Lotes', icon: Package, roles: ['administrador', 'bodeguero'] },
        { path: '/movimientos', label: 'Movimientos', icon: ArrowUpDown, roles: ['administrador', 'bodeguero'] },
        { path: '/trazabilidad', label: 'Trazabilidad', icon: GitBranch, roles: ['administrador', 'bodeguero', 'gerente'] },
        { path: '/instituciones', label: 'Instituciones', icon: Building2, roles: ['administrador', 'encargado_contratos'] },
        { path: '/contratos', label: 'Contratos', icon: FileText, roles: ['administrador', 'encargado_contratos'] },
        { path: '/pedidos', label: 'Pedidos', icon: Truck, roles: ['administrador', 'bodeguero', 'encargado_contratos'] },
        { path: '/reportes', label: 'Reportes', icon: FileBarChart, roles: ['administrador', 'gerente', 'encargado_contratos'] },
    ];

    const itemsVisibles = menuItems.filter(item => item.roles.includes(usuario?.rol));

    return (
        <div className="text-white w-64 min-h-screen flex flex-col" style={{ backgroundColor: '#1F2D6E' }}>

            {/* LOGO */}
            <div className="p-4 flex flex-col items-center" style={{ borderBottom: '1px solid #2B3F8E' }}>
                <img
                    src="/logo-blanco.png"
                    alt="Logo ASIAFARMA"
                    className="w-36 h-36 object-contain mb-2"
                />
            </div>

            {/* USUARIO */}
            <div className="p-4 flex items-center gap-3" style={{ borderBottom: '1px solid #2B3F8E' }}>
                <div className="rounded-full p-2" style={{ backgroundColor: '#2B8EA6' }}>
                    <User size={18} className="text-white" />
                </div>
                <div>
                    <p className="text-white font-medium text-sm">{usuario?.nombre} {usuario?.apellido}</p>
                    <p className="text-xs capitalize" style={{ color: '#90CAD6' }}>{usuario?.rol}</p>
                </div>
            </div>

            {/* NAVEGACIÓN */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {itemsVisibles.map(item => {
                    const Icon = item.icon;
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-lg transition duration-200 ${isActive ? 'text-white font-medium' : 'text-blue-200 hover:text-white'}`
                            }
                            style={({ isActive }) => ({
                                backgroundColor: isActive ? '#2B8EA6' : 'transparent',
                            })}
                        >
                            <Icon size={18} />
                            <span>{item.label}</span>
                        </NavLink>
                    );
                })}
            </nav>

            {/* MODO OSCURO + CERRAR SESIÓN */}
            <div className="p-4 space-y-1" style={{ borderTop: '1px solid #2B3F8E' }}>
                <button
                    onClick={toggleDarkMode}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-lg transition duration-200"
                    style={{ color: '#90CAD6' }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#2B3F8E'; e.currentTarget.style.color = 'white'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#90CAD6'; }}
                >
                    {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                    <span>{darkMode ? 'Modo Claro' : 'Modo Oscuro'}</span>
                </button>

                <button
                    onClick={logout}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-lg transition duration-200"
                    style={{ color: '#90CAD6' }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#C4467A'; e.currentTarget.style.color = 'white'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#90CAD6'; }}
                >
                    <LogOut size={18} />
                    <span>Cerrar sesión</span>
                </button>
            </div>

        </div>
    );
};

export default Sidebar;
