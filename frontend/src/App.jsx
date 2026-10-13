import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/layout/Layout';
import Login from './pages/auth/Login';
import Panel from './pages/panel/Panel';
import Productos from './pages/productos/Productos';
import ProductoDetalle from './pages/productos/ProductoDetalle';
import Ingresos from './pages/ingresos/Ingresos';
import Lotes from './pages/lotes/Lotes';
import Movimientos from './pages/movimientos/Movimientos';
import Trazabilidad from './pages/trazabilidad/Trazabilidad';
import TrazabilidadLote from './pages/trazabilidad/TrazabilidadLote';
import Instituciones from './pages/instituciones/Instituciones';
import InstitucionDetalle from './pages/instituciones/InstitucionDetalle';
import Contratos from './pages/contratos/Contratos';
import ContratoDetalle from './pages/contratos/ContratoDetalle';
import Pedidos from './pages/pedidos/Pedidos';
import PedidoDetalle from './pages/pedidos/PedidoDetalle';
import Informes from './pages/informes/Informes';
import Auditoria from './pages/auditoria/Auditoria';
import Catalogos from './pages/catalogos/Catalogos';
import Usuarios from './pages/usuarios/Usuarios';

const RutaProtegida = ({ children }) => {
  const { usuario, cargando } = useAuth();
  if (cargando) return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  return usuario ? children : <Navigate to="/login" />;
};

const AppRoutes = () => {
  const { usuario } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={usuario ? <Navigate to="/panel" /> : <Login />} />
      <Route path="/" element={<RutaProtegida><Layout /></RutaProtegida>}>
        <Route index element={<Navigate to="/panel" />} />
        <Route path="panel" element={<Panel />} />
        <Route path="dashboard" element={<Navigate to="/panel" />} />
        <Route path="productos" element={<Productos />} />
        <Route path="productos/:id" element={<ProductoDetalle />} />
        <Route path="ingresos" element={<Ingresos />} />
        <Route path="lotes" element={<Lotes />} />
        <Route path="movimientos" element={<Movimientos />} />
        <Route path="trazabilidad" element={<Trazabilidad />} />
        <Route path="trazabilidad/lote/:id" element={<TrazabilidadLote />} />
        <Route path="instituciones" element={<Instituciones />} />
        <Route path="instituciones/:id" element={<InstitucionDetalle />} />
        <Route path="contratos" element={<Contratos />} />
        <Route path="contratos/:id" element={<ContratoDetalle />} />
        <Route path="pedidos" element={<Pedidos />} />
        <Route path="pedidos/:id" element={<PedidoDetalle />} />
        <Route path="informes" element={<Informes />} />
        <Route path="reportes" element={<Navigate to="/informes" />} />
        <Route path="auditoria" element={<Auditoria />} />
        <Route path="catalogos" element={<Catalogos />} />
        <Route path="usuarios" element={<Usuarios />} />
      </Route>
      <Route path="*" element={<Navigate to="/panel" />} />
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
