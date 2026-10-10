import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/layout/Layout';
import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import Productos from './pages/productos/Productos';
import Lotes from './pages/lotes/Lotes';
import Instituciones from './pages/instituciones/Instituciones';
import Contratos from './pages/contratos/Contratos';
import Pedidos from './pages/pedidos/Pedidos';
import Reportes from './pages/reportes/Reportes';
import Usuarios from './pages/usuarios/Usuarios';
import Movimientos from './pages/movimientos/Movimientos';
import Trazabilidad from './pages/trazabilidad/Trazabilidad';

const RutaProtegida = ({ children }) => {
  const { usuario, cargando } = useAuth();
  if (cargando) return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  return usuario ? children : <Navigate to="/login" />;
};

const AppRoutes = () => {
  const { usuario } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={usuario ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/" element={<RutaProtegida><Layout /></RutaProtegida>}>
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="usuarios" element={<Usuarios />} />
        <Route path="productos" element={<Productos />} />
        <Route path="lotes" element={<Lotes />} />
        <Route path="movimientos" element={<Movimientos />} />
        <Route path="trazabilidad" element={<Trazabilidad />} />
        <Route path="instituciones" element={<Instituciones />} />
        <Route path="contratos" element={<Contratos />} />
        <Route path="pedidos" element={<Pedidos />} />
        <Route path="reportes" element={<Reportes />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;