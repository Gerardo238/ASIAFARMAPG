import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, LogIn, Eye, EyeOff, User } from 'lucide-react';

const EMAIL_GUARDADO = 'asiafarma_email';

const leerEmailGuardado = () => {
    try {
        return localStorage.getItem(EMAIL_GUARDADO) || '';
    } catch {
        return '';
    }
};

const Login = () => {
    const [email, setEmail] = useState(leerEmailGuardado);
    const [password, setPassword] = useState('');
    const [verPassword, setVerPassword] = useState(false);
    const [recordarme, setRecordarme] = useState(() => leerEmailGuardado() !== '');
    const [error, setError] = useState('');
    const [aviso, setAviso] = useState('');
    const [cargando, setCargando] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setCargando(true);
        setError('');
        setAviso('');
        try {
            await login(email, password);
            try {
                if (recordarme) localStorage.setItem(EMAIL_GUARDADO, email);
                else localStorage.removeItem(EMAIL_GUARDADO);
            } catch {
                // Si el navegador bloquea el almacenamiento, el login sigue funcionando
            }
            navigate('/panel');
        } catch {
            setError('Credenciales incorrectas. Intente nuevamente.');
        } finally {
            setCargando(false);
        }
    };

    const olvidePassword = (e) => {
        e.preventDefault();
        setError('');
        setAviso('Contacta al administrador del sistema para restablecer tu contraseña.');
    };

    const estiloCampo = {
        backgroundColor: '#F4F6FA',
        border: '1px solid #E2E8F0',
    };

    const enfocar = (e) => { e.currentTarget.style.borderColor = '#2B8EA6'; };
    const desenfocar = (e) => { e.currentTarget.style.borderColor = '#E2E8F0'; };

    return (
        <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: '#EEF2F8' }}>

            {/* Fondo: foto de medicamentos (public/fondo-login.jpg) */}
            <div
                className="absolute inset-0"
                style={{
                    backgroundImage: 'url(/fondo-login.jpg)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'right center',
                }}
            />

            {/* Panel azul con borde curvo (solo en pantallas grandes) */}
            <svg
                className="hidden lg:block absolute left-0 top-0 h-full"
                style={{ width: '48%' }}
                viewBox="0 0 800 1000"
                preserveAspectRatio="none"
                aria-hidden="true"
            >
                <defs>
                    <linearGradient id="panelAzul" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#0B2A6E" />
                        <stop offset="100%" stopColor="#0A2360" />
                    </linearGradient>
                </defs>
                <path d="M0 0 H760 C690 300 660 620 800 1000 H0 Z" fill="url(#panelAzul)" />
                <path d="M0 560 C220 640 420 820 560 1000 H0 Z" fill="#0E3C8C" opacity="0.7" />
                <path d="M0 720 C160 780 320 880 420 1000 H0 Z" fill="#1573B5" opacity="0.8" />
            </svg>

            <div className="relative z-10 min-h-screen flex">

                {/* Logo grande del lado izquierdo */}
                <div className="hidden lg:flex items-center justify-center" style={{ width: '44%' }}>
                    <img
                        src="/logo-blanco.png"
                        alt="Logo Droguería Asiafarma"
                        className="w-96 h-96 object-contain"
                        style={{ filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.3))' }}
                    />
                </div>

                {/* Tarjeta de inicio de sesión */}
                <div className="flex-1 flex items-center justify-center p-6">
                    <div
                        className="w-full max-w-md bg-white rounded-3xl px-10 py-10"
                        style={{ boxShadow: '0 25px 60px rgba(15, 42, 107, 0.18)' }}
                    >

                        {/* Encabezado */}
                        <div className="flex flex-col items-center mb-8">
                            <div
                                className="w-24 h-24 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: '#0B2A6E', boxShadow: '0 10px 25px rgba(11, 42, 110, 0.3)' }}
                            >
                                <User size={48} strokeWidth={1.5} className="text-white" />
                            </div>
                            <div className="w-10 h-0.5 rounded-full my-4" style={{ backgroundColor: '#2B8EA6' }} />
                            <p className="text-lg" style={{ color: '#1F2D6E' }}>Ingresa a tu cuenta</p>
                        </div>

                        <form onSubmit={handleSubmit}>

                            {/* Correo */}
                            <div
                                className="flex items-center gap-3 rounded-2xl px-4 py-3 mb-4 transition"
                                style={estiloCampo}
                                onFocus={enfocar}
                                onBlur={desenfocar}
                            >
                                <Mail size={20} style={{ color: '#1F2D6E' }} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Correo electrónico"
                                    className="flex-1 bg-transparent outline-none text-gray-800 placeholder-gray-400"
                                    style={{ fontSize: '15px' }}
                                    autoComplete="email"
                                    required
                                />
                            </div>

                            {/* Contraseña */}
                            <div
                                className="flex items-center gap-3 rounded-2xl px-4 py-3 mb-4 transition"
                                style={estiloCampo}
                                onFocus={enfocar}
                                onBlur={desenfocar}
                            >
                                <Lock size={20} style={{ color: '#1F2D6E' }} />
                                <input
                                    type={verPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Contraseña"
                                    className="flex-1 bg-transparent outline-none text-gray-800 placeholder-gray-400"
                                    style={{ fontSize: '15px' }}
                                    autoComplete="current-password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setVerPassword(!verPassword)}
                                    className="p-1 rounded-lg"
                                    style={{ color: '#1F2D6E' }}
                                    aria-label={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                >
                                    {verPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>

                            {/* Recordarme + Olvidé mi contraseña */}
                            <div className="flex items-center justify-between mb-6 text-sm">
                                <label className="flex items-center gap-2 cursor-pointer select-none" style={{ color: '#1F2D6E' }}>
                                    <input
                                        type="checkbox"
                                        checked={recordarme}
                                        onChange={(e) => setRecordarme(e.target.checked)}
                                        className="w-4 h-4 rounded"
                                        style={{ accentColor: '#2B8EA6' }}
                                    />
                                    <span className="font-medium">Recordarme</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={olvidePassword}
                                    className="hover:underline"
                                    style={{ color: '#1597B8' }}
                                >
                                    ¿Olvidaste tu contraseña?
                                </button>
                            </div>

                            {/* Mensajes */}
                            {error && (
                                <div
                                    className="rounded-2xl px-4 py-3 mb-4 text-sm text-center"
                                    style={{ backgroundColor: '#FEE2E2', color: '#B91C1C' }}
                                >
                                    {error}
                                </div>
                            )}
                            {aviso && (
                                <div
                                    className="rounded-2xl px-4 py-3 mb-4 text-sm text-center"
                                    style={{ backgroundColor: '#E0F2F7', color: '#1F5F70' }}
                                >
                                    {aviso}
                                </div>
                            )}

                            {/* Botón */}
                            <button
                                type="submit"
                                disabled={cargando}
                                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-white transition duration-200 disabled:opacity-50"
                                style={{
                                    background: 'linear-gradient(90deg, #0B2A6E 0%, #1597B8 100%)',
                                    boxShadow: '0 8px 25px rgba(21, 151, 184, 0.3)',
                                    fontSize: '17px',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.1)'; }}
                                onMouseLeave={e => { e.currentTarget.style.filter = 'none'; }}
                            >
                                <LogIn size={20} />
                                {cargando ? 'Ingresando...' : 'Ingresar'}
                            </button>
                        </form>

                        {/* Pie */}
                        <div className="mt-8 pt-6 text-center text-xs text-gray-500" style={{ borderTop: '1px solid #E5E7EB' }}>
                            © {new Date().getFullYear()} Droguería Asiafarma — Todos los derechos reservados
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
