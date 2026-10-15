import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    LayoutGrid, Pill, Package, Building2, FileText, Truck, LogOut,
    FileBarChart, Users, ArrowUpDown, GitBranch, PackagePlus, ShieldCheck, Settings
} from 'lucide-react';
import { useColors } from '../../hooks/useColors';

const TODOS = ['administrador', 'gerente', 'bodeguero', 'encargado_contratos'];

// Grupos separados por una línea, como en la referencia
const GRUPOS = [
    [
        { path: '/panel', label: 'Panel de control', icon: LayoutGrid, roles: TODOS },
        { path: '/productos', label: 'Productos', icon: Pill, roles: TODOS },
        { path: '/ingresos', label: 'Ingresos de compra', icon: PackagePlus, roles: ['administrador', 'bodeguero', 'gerente'] },
        { path: '/lotes', label: 'Lotes', icon: Package, roles: ['administrador', 'bodeguero', 'gerente'] },
        { path: '/movimientos', label: 'Kárdex', icon: ArrowUpDown, roles: ['administrador', 'bodeguero', 'gerente'] },
        { path: '/trazabilidad', label: 'Trazabilidad', icon: GitBranch, roles: TODOS }
    ],
    [
        { path: '/instituciones', label: 'Instituciones', icon: Building2, roles: ['administrador', 'encargado_contratos', 'gerente'] },
        { path: '/contratos', label: 'Contratos', icon: FileText, roles: ['administrador', 'encargado_contratos', 'gerente'] },
        { path: '/pedidos', label: 'Pedidos', icon: Truck, roles: TODOS }
    ],
    [
        { path: '/informes', label: 'Informes', icon: FileBarChart, roles: TODOS },
        { path: '/auditoria', label: 'Auditoría', icon: ShieldCheck, roles: ['administrador', 'gerente'] }
    ],
    [
        { path: '/catalogos', label: 'Administración', icon: Settings, roles: ['administrador', 'bodeguero'] },
        { path: '/usuarios', label: 'Usuarios', icon: Users, roles: ['administrador'] }
    ]
];

const Sidebar = () => {
    const { usuario, logout } = useAuth();
    const c = useColors();
    const item = 'flex items-center gap-3 px-4 h-9 rounded-lg text-[13px] transition-colors';

    return (
        <aside className="w-[230px] h-screen sticky top-0 flex flex-col shrink-0" style={{ backgroundColor: c.menu }}>
            <div className="px-6 pt-7 pb-8 flex items-center gap-2.5">
                <img src="/logo.png" alt="" className="w-8 h-8 object-contain" />
                <span className="text-[19px] font-medium" style={{ color: c.textPrimary }}>Asiafarma</span>
            </div>

            <nav className="flex-1 overflow-y-auto">
                {GRUPOS.map((grupo, i) => {
                    const visibles = grupo.filter(x => x.roles.includes(usuario?.rol));
                    if (!visibles.length) return null;
                    return (
                        <div key={i} className="px-4 py-3" style={{ borderTop: i ? `1px solid ${c.cardBorder}` : 'none' }}>
                            {visibles.map(x => {
                                const Icon = x.icon;
                                return (
                                    <NavLink key={x.path} to={x.path} className={`${item} mb-1`}
                                        style={({ isActive }) => isActive
                                            ? { backgroundColor: c.menuActivo, color: c.menuActivoTexto, fontWeight: 500 }
                                            : { color: c.textPrimary }}>
                                        <Icon size={16} strokeWidth={1.6} />
                                        <span>{x.label}</span>
                                    </NavLink>
                                );
                            })}
                        </div>
                    );
                })}
                <div className="px-4 py-3" style={{ borderTop: `1px solid ${c.cardBorder}` }}>
                    <button onClick={logout} className={`${item} w-full af-boton hover:opacity-70`} style={{ color: c.textPrimary }}>
                        <LogOut size={16} strokeWidth={1.6} />Cerrar sesión
                    </button>
                </div>
            </nav>
        </aside>
    );
};

export default Sidebar;
