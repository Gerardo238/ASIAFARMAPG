import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
    LayoutDashboard, Pill, Package, Building2, FileText, Truck, LogOut, User, Moon, Sun,
    FileBarChart, Users, ArrowUpDown, GitBranch, PackagePlus, ShieldCheck, ListChecks
} from 'lucide-react';
import { ROLES } from '../../utils/catalogos';

const TODOS = ['administrador', 'gerente', 'bodeguero', 'encargado_contratos'];

const SECCIONES = [
    {
        titulo: null,
        items: [{ path: '/panel', label: 'Panel de control', icon: LayoutDashboard, roles: TODOS }]
    },
    {
        titulo: 'Inventario',
        items: [
            { path: '/productos', label: 'Productos', icon: Pill, roles: TODOS },
            { path: '/ingresos', label: 'Ingresos de compra', icon: PackagePlus, roles: ['administrador', 'bodeguero', 'gerente'] },
            { path: '/lotes', label: 'Lotes', icon: Package, roles: ['administrador', 'bodeguero', 'gerente'] },
            { path: '/movimientos', label: 'Kárdex', icon: ArrowUpDown, roles: ['administrador', 'bodeguero', 'gerente'] },
            { path: '/trazabilidad', label: 'Trazabilidad', icon: GitBranch, roles: TODOS }
        ]
    },
    {
        titulo: 'Ventas',
        items: [
            { path: '/instituciones', label: 'Instituciones', icon: Building2, roles: ['administrador', 'encargado_contratos', 'gerente'] },
            { path: '/contratos', label: 'Contratos', icon: FileText, roles: ['administrador', 'encargado_contratos', 'gerente'] },
            { path: '/pedidos', label: 'Pedidos', icon: Truck, roles: TODOS }
        ]
    },
    {
        titulo: 'Control',
        items: [
            { path: '/informes', label: 'Informes', icon: FileBarChart, roles: TODOS },
            { path: '/auditoria', label: 'Auditoría', icon: ShieldCheck, roles: ['administrador', 'gerente'] },
            { path: '/catalogos', label: 'Catálogos', icon: ListChecks, roles: ['administrador', 'bodeguero'] },
            { path: '/usuarios', label: 'Usuarios', icon: Users, roles: ['administrador'] }
        ]
    }
];

const Sidebar = () => {
    const { usuario, logout } = useAuth();
    const { darkMode, toggleDarkMode } = useTheme();

    return (
        <div className="text-white w-64 min-h-screen flex flex-col shrink-0" style={{ backgroundColor: '#1F2D6E' }}>

            {/* LOGO */}
            <div className="p-4 flex flex-col items-center" style={{ borderBottom: '1px solid #2B3F8E' }}>
                <img
                    src="/logo-blanco.png"
                    alt="Logo ASIAFARMA"
                    className="w-28 h-28 object-contain"
                />
            </div>

            {/* USUARIO */}
            <div className="p-4 flex items-center gap-3" style={{ borderBottom: '1px solid #2B3F8E' }}>
                <div className="rounded-full p-2" style={{ backgroundColor: '#2B8EA6' }}>
                    <User size={18} className="text-white" />
                </div>
                <div>
                    <p className="text-white font-medium text-sm">{usuario?.nombre} {usuario?.apellido}</p>
                    <p className="text-xs" style={{ color: '#90CAD6' }}>{ROLES[usuario?.rol] || usuario?.rol}</p>
                </div>
            </div>

            {/* NAVEGACIÓN */}
            <nav className="flex-1 p-3 overflow-y-auto">
                {SECCIONES.map((seccion, i) => {
                    const items = seccion.items.filter(item => item.roles.includes(usuario?.rol));
                    if (items.length === 0) return null;
                    return (
                        <div key={i} className="mb-2">
                            {seccion.titulo && (
                                <p className="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: '#90CAD6' }}>
                                    {seccion.titulo}
                                </p>
                            )}
                            {items.map(item => {
                                const Icon = item.icon;
                                return (
                                    <NavLink
                                        key={item.path}
                                        to={item.path}
                                        className={({ isActive }) =>
                                            `flex items-center gap-3 px-4 py-2.5 rounded-lg transition duration-200 text-sm ${isActive ? 'text-white font-medium' : 'text-blue-200 hover:text-white'}`
                                        }
                                        style={({ isActive }) => ({ backgroundColor: isActive ? '#2B8EA6' : 'transparent' })}
                                    >
                                        <Icon size={18} />
                                        <span>{item.label}</span>
                                    </NavLink>
                                );
                            })}
                        </div>
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
