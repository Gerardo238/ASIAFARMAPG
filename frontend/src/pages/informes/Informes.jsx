import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FileBarChart, Play, FileDown, Sheet, HelpCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../../services/api';
import { useLista, useCatalogo } from '../../hooks/useCatalogo';
import { useColors } from '../../hooks/useColors';
import { Pagina, Encabezado, Tarjeta, Tabla, Boton, Campo, Entrada, Selector, DatoFicha, Aviso } from '../../components/ui';
import { formatFecha, formatFechaHora, hoyISO, primerDiaMesISO } from '../../utils/fechas';
import { numero, moneda, mensajeError } from '../../utils/formato';

// Formatea una celda según el tipo de columna que declara el backend
const formatear = (valor, tipo) => {
    if (valor === null || valor === undefined || valor === '') return '';
    switch (tipo) {
        case 'moneda': return moneda(valor);
        case 'numero': return numero(valor);
        case 'fecha': return formatFecha(valor);
        case 'fechahora': return formatFechaHora(valor);
        case 'porcentaje': return `${valor}%`;
        default: return String(valor);
    }
};

const ETIQUETAS_PARAM = {
    desde: 'Desde', hasta: 'Hasta', dias: 'Días', id_institucion: 'Institución', id_producto: 'Producto',
    id_laboratorio: 'Laboratorio', id_proveedor: 'Proveedor', id_usuario: 'Usuario', numero_lote: 'No. de lote'
};

const cargarLogo = () => new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 300; canvas.height = 300;
        canvas.getContext('2d').drawImage(img, 0, 0, 300, 300);
        resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(null);
    img.src = '/logo-blanco.png';
});

const Informes = () => {
    const c = useColors();
    const { datos: catalogo } = useLista('/informes');
    const { datos: instituciones } = useLista('/instituciones');
    const { datos: productos } = useLista('/productos');
    const { datos: laboratorios } = useCatalogo('laboratorios');
    const { datos: proveedores } = useCatalogo('proveedores');
    const [usuarios, setUsuarios] = useState([]);
    // El informe elegido vive en la URL (?informe=clave), así el panel puede abrir uno directamente
    const [url, setUrl] = useSearchParams();
    const clave = url.get('informe');
    const [params, setParams] = useState({ desde: primerDiaMesISO(), hasta: hoyISO() });
    const [resultado, setResultado] = useState(null);
    const [error, setError] = useState('');
    const [generando, setGenerando] = useState(false);

    useEffect(() => { api.get('/auth/usuarios').then(r => setUsuarios(r.data)).catch(() => setUsuarios([])); }, []);

    const informe = catalogo.find(i => i.clave === clave);
    const grupos = [...new Set(catalogo.map(i => i.grupo))];

    const opcionesParam = {
        id_institucion: instituciones.map(i => ({ value: i.id_institucion, label: i.nombre })),
        id_producto: productos.map(p => ({ value: p.id_producto, label: `${p.nombre} ${p.concentracion || ''}` })),
        id_laboratorio: laboratorios.map(l => ({ value: l.id_laboratorio, label: l.nombre })),
        id_proveedor: proveedores.map(p => ({ value: p.id_proveedor, label: p.nombre })),
        id_usuario: usuarios.map(u => ({ value: u.id_usuario, label: `${u.nombre} ${u.apellido}` }))
    };

    const seleccionar = (k) => { setUrl({ informe: k }); setResultado(null); setError(''); };

    const generar = async () => {
        setGenerando(true); setError('');
        const consulta = Object.fromEntries((informe.parametros || []).filter(p => params[p]).map(p => [p, params[p]]));
        try { setResultado((await api.get(`/informes/${clave}`, { params: consulta })).data); }
        catch (err) { setError(mensajeError(err)); }
        finally { setGenerando(false); }
    };

    const exportarPDF = async () => {
        const horizontal = resultado.columnas.length > 6;
        const doc = new jsPDF({ orientation: horizontal ? 'landscape' : 'portrait' });
        const ancho = doc.internal.pageSize.getWidth();
        doc.setFillColor(31, 45, 110);
        doc.rect(0, 0, ancho, 30, 'F');
        const logo = await cargarLogo();
        if (logo) doc.addImage(logo, 'PNG', 8, 3, 24, 24);
        const x = logo ? 36 : 14;
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(16);
        doc.text('DROGUERÍA ASIAFARMA', x, 13);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(11);
        doc.text(resultado.titulo, x, 21);
        doc.setFontSize(9);
        doc.text(`Generado: ${formatFechaHora(resultado.generado)}`, ancho - 10, 21, { align: 'right' });
        let y = 38;
        doc.setTextColor(60, 60, 60);
        if (resultado.pregunta) { doc.setFont('helvetica', 'italic'); doc.text(resultado.pregunta, 14, y); doc.setFont('helvetica', 'normal'); y += 6; }
        if (resultado.rango) { doc.text(`Período: ${formatFecha(resultado.rango.desde)} al ${formatFecha(resultado.rango.hasta)}`, 14, y); y += 6; }
        if (resultado.resumen) {
            doc.text(Object.entries(resultado.resumen).map(([k, v]) => `${k}: ${typeof v === 'number' && k.toLowerCase().match(/monto|total|saldo|valor|vendido|comprado/) ? moneda(v) : v}`).join('    '), 14, y);
            y += 6;
        }
        autoTable(doc, {
            startY: y,
            head: [resultado.columnas.map(col => col.titulo)],
            body: resultado.filas.map(f => resultado.columnas.map(col => formatear(f[col.clave], col.tipo))),
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [31, 45, 110] },
            alternateRowStyles: { fillColor: [240, 244, 248] },
            columnStyles: Object.fromEntries(resultado.columnas.map((col, i) => [i, ['numero', 'moneda', 'porcentaje'].includes(col.tipo) ? { halign: 'right' } : {}]))
        });
        const paginas = doc.internal.getNumberOfPages();
        for (let i = 1; i <= paginas; i++) {
            doc.setPage(i); doc.setFontSize(8); doc.setTextColor(120);
            doc.text(`Droguería Asiafarma, S.A. — Página ${i} de ${paginas}`, ancho / 2, doc.internal.pageSize.getHeight() - 6, { align: 'center' });
        }
        doc.save(`${resultado.clave}-${hoyISO()}.pdf`);
    };

    const exportarCSV = () => {
        const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
        const lineas = [
            resultado.columnas.map(col => esc(col.titulo)).join(','),
            ...resultado.filas.map(f => resultado.columnas.map(col => esc(['numero', 'moneda', 'porcentaje'].includes(col.tipo) ? f[col.clave] : formatear(f[col.clave], col.tipo))).join(','))
        ];
        const blob = new Blob(['﻿' + lineas.join('\n')], { type: 'text/csv;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${resultado.clave}-${hoyISO()}.csv`;
        a.click();
        URL.revokeObjectURL(a.href);
    };

    return (
        <Pagina>
            <Encabezado icono={FileBarChart} titulo="Informes" subtitulo={`${catalogo.length} informes de contratos, pedidos, inventario, compras, trazabilidad y auditoría.`} />

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
                <div className="lg:col-span-1">
                    {grupos.map(g => (
                        <Tarjeta key={g} titulo={g}>
                            <div className="space-y-1">
                                {catalogo.filter(i => i.grupo === g).map(i => (
                                    <button key={i.clave} onClick={() => seleccionar(i.clave)}
                                        className="w-full text-left px-3 py-2 rounded-lg text-sm transition"
                                        style={clave === i.clave ? { backgroundColor: '#3D7EF6', color: '#FFFFFF' } : { color: c.textPrimary, backgroundColor: c.inputBg }}>
                                        <span className="block font-medium">{i.titulo}</span>
                                        {i.pregunta && <span className="block text-xs mt-0.5 opacity-75">{i.pregunta}</span>}
                                    </button>
                                ))}
                            </div>
                        </Tarjeta>
                    ))}
                </div>

                <div className="lg:col-span-3">
                    {!informe ? (
                        <Aviso>Elige en la lista la pregunta que necesitas responder; cada informe se puede exportar a PDF o Excel.</Aviso>
                    ) : (
                        <>
                            <Tarjeta titulo={informe.titulo}>
                                {informe.pregunta && (
                                    <p className="text-base font-medium mb-1 flex items-center gap-2" style={{ color: '#3D7EF6' }}><HelpCircle size={18} />{informe.pregunta}</p>
                                )}
                                <p className="text-sm mb-4" style={{ color: c.textSecondary }}>{informe.descripcion}</p>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                    {informe.parametros.map(p => (
                                        <Campo key={p} etiqueta={ETIQUETAS_PARAM[p]}>
                                            {['desde', 'hasta'].includes(p) && <Entrada type="date" value={params[p] || ''} onChange={e => setParams({ ...params, [p]: e.target.value })} />}
                                            {p === 'dias' && <Entrada type="number" min="1" placeholder="Valor del parámetro" value={params.dias || ''} onChange={e => setParams({ ...params, dias: e.target.value })} />}
                                            {p === 'numero_lote' && <Entrada value={params.numero_lote || ''} onChange={e => setParams({ ...params, numero_lote: e.target.value })} />}
                                            {opcionesParam[p] && <Selector vacio="Todos" value={params[p] || ''} onChange={e => setParams({ ...params, [p]: e.target.value })} opciones={opcionesParam[p]} />}
                                        </Campo>
                                    ))}
                                    <div className="flex gap-2">
                                        <Boton icono={Play} onClick={generar} disabled={generando}>{generando ? 'Generando...' : 'Generar'}</Boton>
                                    </div>
                                </div>
                                {error && <Aviso tono="rojo" className="mt-4">{error}</Aviso>}
                            </Tarjeta>

                            {resultado && (
                                <Tarjeta titulo={`${resultado.filas.length} registro(s)`}
                                    acciones={<>
                                        <Boton variante="acento" icono={FileDown} onClick={exportarPDF} disabled={!resultado.filas.length}>PDF</Boton>
                                        <Boton variante="secundario" icono={Sheet} onClick={exportarCSV} disabled={!resultado.filas.length}>Excel (CSV)</Boton>
                                    </>}>
                                    {(resultado.rango || resultado.resumen) && (
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                            {resultado.rango && <DatoFicha etiqueta="Período" valor={`${formatFecha(resultado.rango.desde)} – ${formatFecha(resultado.rango.hasta)}`} />}
                                            {resultado.resumen && Object.entries(resultado.resumen).map(([k, v]) => (
                                                <DatoFicha key={k} etiqueta={k} valor={typeof v === 'number' && k.toLowerCase().match(/monto|total|saldo|valor|vendido|comprado/) ? moneda(v) : numero(v)} />
                                            ))}
                                        </div>
                                    )}
                                    <Tabla
                                        filas={resultado.filas}
                                        vacio="El informe no tiene datos para estos filtros."
                                        columnas={resultado.columnas.map(col => ({
                                            clave: col.clave, titulo: col.titulo,
                                            alinear: ['numero', 'moneda', 'porcentaje'].includes(col.tipo) ? 'right' : 'left',
                                            render: f => formatear(f[col.clave], col.tipo) || '—'
                                        }))}
                                    />
                                </Tarjeta>
                            )}
                        </>
                    )}
                </div>
            </div>
        </Pagina>
    );
};

export default Informes;
