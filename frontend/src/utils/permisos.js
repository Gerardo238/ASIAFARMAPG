// Qué puede hacer cada rol. Debe coincidir con las rutas del backend, que
// siempre vuelve a validar; aquí solo se ocultan botones que no aplican.
const PERMISOS = {
    'productos.escribir': ['administrador', 'bodeguero'],
    'productos.anular': ['administrador'],
    'ingresos.crear': ['administrador', 'bodeguero'],
    'ingresos.anular': ['administrador'],
    'lotes.editar': ['administrador', 'bodeguero'],
    'lotes.fechas': ['administrador'],
    'lotes.anular': ['administrador'],
    'movimientos.ajuste': ['administrador', 'bodeguero'],
    'instituciones.escribir': ['administrador', 'encargado_contratos'],
    'instituciones.anular': ['administrador'],
    'contratos.escribir': ['administrador', 'encargado_contratos'],
    'contratos.estado': ['administrador'],
    'pedidos.crear': ['administrador', 'encargado_contratos'],
    'pedidos.despachar': ['administrador', 'bodeguero'],
    'pedidos.entregar': ['administrador', 'bodeguero', 'encargado_contratos'],
    'pedidos.ajustar': ['administrador', 'encargado_contratos'],
    'pedidos.anular': ['administrador'],
    'pedidos.compromiso': ['administrador', 'encargado_contratos'],
    'pedidos.devolucion': ['administrador', 'bodeguero', 'encargado_contratos'],
    'pedidos.anular_devolucion': ['administrador'],
    'tramites.escribir': ['administrador', 'encargado_contratos'],
    'tramites.anular': ['administrador'],
    'catalogos.escribir': ['administrador'],
    'proveedores.escribir': ['administrador', 'bodeguero'],
    'catalogos.anular': ['administrador'],
    'usuarios.escribir': ['administrador'],
    'adjuntos.subir': ['administrador', 'bodeguero'],
    'adjuntos.contratos': ['administrador', 'encargado_contratos'],
    'adjuntos.pedidos': ['administrador', 'bodeguero', 'encargado_contratos'],
    'adjuntos.anular': ['administrador']
};

export const puede = (usuario, accion) => !!usuario && (PERMISOS[accion] || []).includes(usuario.rol);
