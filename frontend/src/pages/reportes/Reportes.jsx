import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useColors } from '../../hooks/useColors';
import { FileText, Download, Calendar } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ---------- Fechas ----------
// Las fechas sin hora (ej. "2026-01-01") se leen como fecha local para que
// no se muestren un día antes por la zona horaria de Guatemala.
const SOLO_FECHA = /^(\d{4})-(\d{2})-(\d{2})(T00:00:00(\.000)?Z)?$/;

const parseFecha = (valor) => {
    if (!valor) return null;
    const m = typeof valor === 'string' ? valor.match(SOLO_FECHA) : null;
    if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return new Date(valor);
};

const formatFecha = (valor) => {
    const fecha = parseFecha(valor);
    if (!fecha || isNaN(fecha)) return '—';
    return fecha.toLocaleDateString('es-GT', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const diasRestantes = (valor) => {
    const fecha = parseFecha(valor);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return Math.round((fecha - hoy) / (1000 * 60 * 60 * 24));
};

// ---------- Logo para el PDF ----------
// Carga el logo blanco desde /public y lo reduce para que el PDF no pese mucho.
const cargarLogo = () => new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
        const tam = 300;
        const canvas = document.createElement('canvas');
        canvas.width = tam;
        canvas.height = tam;
        canvas.getContext('2d').drawImage(img, 0, 0, tam, tam);
        resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(null);
    img.src = '/logo-blanco.png';
});

const Reportes = () => {
    const c = useColors();
    const [mes, setMes] = useState(new Date().getMonth() + 1);
    const [anio, setAnio] = useState(new Date().getFullYear());
    const [generando, setGenerando] = useState(false);
    const [resumen, setResumen] = useState(null);
    const meses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const cargarResumen = async () => {
        try {
            const [pedidos, contratos, lotes, productos] = await Promise.all([
                api.get('/pedidos'),
                api.get('/contratos'),
                api.get('/lotes'),
                api.get('/productos')
            ]);
            const pedidosMes = pedidos.data.filter(p => {
                const fecha = parseFecha(p.fecha_programada);
                return fecha.getMonth() + 1 === parseInt(mes) && fecha.getFullYear() === parseInt(anio);
            });
            const entregados = pedidosMes.filter(p => p.estado === 'entregado');
            const pendientes = pedidosMes.filter(p => p.estado === 'pendiente');
            const retrasados = pedidosMes.filter(p => p.estado === 'retrasado');
            setResumen({
                pedidosMes,
                entregados,
                pendientes,
                retrasados,
                totalContratos: contratos.data.length,
                contratosActivos: contratos.data.filter(c => c.estado === 'activo').length,
                totalLotes: lotes.data.length,
                lotesVencer: lotes.data.filter(l => {
                    const dias = diasRestantes(l.fecha_vencimiento);
                    return dias <= 90;
                }).length,
                totalProductos: productos.data.length
            });
        } catch (error) {
            console.error('Error al cargar resumen:', error);
        }
    };
    useEffect(() => { cargarResumen(); }, [mes, anio]);
    const generarPDF = async () => {
        setGenerando(true);
        try {
            const [pedidos, contratos, lotes] = await Promise.all([
                api.get('/pedidos'),
                api.get('/contratos'),
                api.get('/lotes')
            ]);
            const pedidosMes = pedidos.data.filter(p => {
                const fecha = parseFecha(p.fecha_programada);
                return fecha.getMonth() + 1 === parseInt(mes) && fecha.getFullYear() === parseInt(anio);
            });
            const doc = new jsPDF();
            const azul = [31, 45, 110];
            const teal = [43, 142, 166];
            const rosa = [196, 70, 122];
            // Encabezado
            doc.setFillColor(...azul);
            doc.rect(0, 0, 210, 35, 'F');
            const logo = await cargarLogo();
            const textoX = logo ? 42 : 14;
            if (logo) doc.addImage(logo, 'PNG', 10, 4, 27, 27);
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(20);
            doc.setFont('helvetica', 'bold');
            doc.text('DROGUERÍA ASIAFARMA', textoX, 16);
            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            doc.text(`Reporte Mensual — ${meses[mes - 1]} ${anio}`, textoX, 25);
            doc.setFontSize(10);
            doc.text(`Generado el: ${formatFecha(new Date())}`, 196, 25, { align: 'right' });
            // Resumen ejecutivo
            doc.setTextColor(...azul);
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Resumen Ejecutivo', 14, 50);
            doc.setFillColor(...teal);
            doc.rect(14, 55, 40, 20, 'F');
            doc.setFillColor(...azul);
            doc.rect(60, 55, 40, 20, 'F');
            doc.setFillColor(...rosa);
            doc.rect(106, 55, 40, 20, 'F');
            doc.setFillColor(180, 92, 74);
            doc.rect(152, 55, 40, 20, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text(String(pedidosMes.length), 34, 65, { align: 'center' });
            doc.text(String(pedidosMes.filter(p => p.estado === 'entregado').length), 80, 65, { align: 'center' });
            doc.text(String(pedidosMes.filter(p => p.estado === 'pendiente').length), 126, 65, { align: 'center' });
            doc.text(String(contratos.data.filter(c => c.estado === 'activo').length), 172, 65, { align: 'center' });
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.text('Total Pedidos', 34, 71, { align: 'center' });
            doc.text('Entregados', 80, 71, { align: 'center' });
            doc.text('Pendientes', 126, 71, { align: 'center' });
            doc.text('Contratos Activos', 172, 71, { align: 'center' });
            // Tabla de pedidos del mes
            doc.setTextColor(...azul);
            doc.setFontSize(13);
            doc.setFont('helvetica', 'bold');
            doc.text(`Detalle de Pedidos — ${meses[mes - 1]} ${anio}`, 14, 90);
            if (pedidosMes.length === 0) {
                doc.setTextColor(150, 150, 150);
                doc.setFontSize(11);
                doc.setFont('helvetica', 'normal');
                doc.text('No hay pedidos registrados para este mes.', 14, 100);
            } else {
                autoTable(doc, {
                    startY: 95,
                    head: [['N° Pedido', 'Contrato', 'Institución', 'F. Programada', 'F. Real Entrega', 'Estado']],
                    body: pedidosMes.map(p => [
                        p.numero_pedido,
                        p.Contrato?.numero_contrato || '—',
                        p.Contrato?.Institucion?.nombre || '—',
                        formatFecha(p.fecha_programada),
                        formatFecha(p.fecha_real_entrega),
                        p.estado.toUpperCase()
                    ]),
                    headStyles: { fillColor: azul, textColor: 255, fontStyle: 'bold', fontSize: 9 },
                    bodyStyles: { fontSize: 9, textColor: [50, 50, 50] },
                    alternateRowStyles: { fillColor: [240, 244, 248] },
                    styles: { cellPadding: 3 }
                });
            }
            // Tabla de lotes próximos a vencer
            const lotesAlerta = lotes.data.filter(l => {
                const dias = diasRestantes(l.fecha_vencimiento);
                return dias <= 90;
            });
            const finalY = doc.lastAutoTable?.finalY || 110;
            doc.setTextColor(...azul);
            doc.setFontSize(13);
            doc.setFont('helvetica', 'bold');
            doc.text('Lotes Próximos a Vencer (90 días)', 14, finalY + 15);
            if (lotesAlerta.length === 0) {
                doc.setTextColor(150, 150, 150);
                doc.setFontSize(11);
                doc.setFont('helvetica', 'normal');
                doc.text('No hay lotes próximos a vencer.', 14, finalY + 25);
            } else {
                autoTable(doc, {
                    startY: finalY + 20,
                    head: [['Número Lote', 'Producto', 'F. Vencimiento', 'Cant. Disponible', 'Días Restantes', 'Estado']],
                    body: lotesAlerta.map(l => {
                        const dias = diasRestantes(l.fecha_vencimiento);
                        return [
                            l.numero_lote,
                            l.Producto?.nombre || '—',
                            formatFecha(l.fecha_vencimiento),
                            l.cantidad_disponible,
                            `${dias} días`,
                            dias <= 30 ? 'CRÍTICO' : 'ALERTA'
                        ];
                    }),
                    headStyles: { fillColor: rosa, textColor: 255, fontStyle: 'bold', fontSize: 9 },
                    bodyStyles: { fontSize: 9, textColor: [50, 50, 50] },
                    alternateRowStyles: { fillColor: [255, 240, 245] },
                    styles: { cellPadding: 3 }
                });
            }
            // Tabla de contratos activos
            const contratosActivos = contratos.data.filter(c => c.estado === 'activo');
            const finalY2 = doc.lastAutoTable?.finalY || finalY + 30;
            if (finalY2 > 220) doc.addPage();
            doc.setTextColor(...azul);
            doc.setFontSize(13);
            doc.setFont('helvetica', 'bold');
            doc.text('Contratos Activos', 14, (finalY2 > 220 ? 20 : finalY2 + 15));
            autoTable(doc, {
                startY: (finalY2 > 220 ? 25 : finalY2 + 20),
                head: [['N° Contrato', 'Institución', 'F. Inicio', 'F. Fin', 'Monto Total', 'Estado']],
                body: contratosActivos.map(c => [
                    c.numero_contrato,
                    c.Institucion?.nombre || '—',
                    formatFecha(c.fecha_inicio),
                    formatFecha(c.fecha_fin),
                    `Q ${parseFloat(c.monto_total).toFixed(2)}`,
                    c.estado.toUpperCase()
                ]),
                headStyles: { fillColor: teal, textColor: 255, fontStyle: 'bold', fontSize: 9 },
                bodyStyles: { fontSize: 9, textColor: [50, 50, 50] },
                alternateRowStyles: { fillColor: [240, 248, 252] },
                styles: { cellPadding: 3 }
            });
            // Pie de página
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFillColor(...azul);
                doc.rect(0, 285, 210, 12, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(8);
                doc.text('Droguería Asiafarma, S.A. — Sistema de Gestión Farmacéutica', 14, 292);
                doc.text(`Página ${i} de ${pageCount}`, 196, 292, { align: 'right' });
            }
            doc.save(`Reporte_ASIAFARMA_${meses[mes - 1]}_${anio}.pdf`);
        } catch (error) {
            console.error('Error al generar PDF:', error);
        } finally {
            setGenerando(false);
        }
    };
    const inputStyle = { backgroundColor: c.inputBg, color: c.inputText, border: `1px solid ${c.inputBorder}`, borderRadius: '8px', padding: '8px 12px', outline: 'none' };
    return (
        <div className="p-8 min-h-screen" style={{ backgroundColor: c.bg }}>
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl" style={{ backgroundColor: '#1F2D6E18' }}>
                        <FileText size={24} style={{ color: '#1F2D6E' }} />
                    </div>
                    <h1 className="text-3xl font-bold" style={{ color: c.textPrimary }}>Reportes</h1>
                </div>
            </div>
            {/* Selector de mes y año */}
            <div className="rounded-xl shadow-sm p-6 mb-6" style={{ backgroundColor: c.card, border: `1px solid ${c.cardBorder}` }}>
                <div className="flex items-center gap-3 mb-4">
                    <Calendar size={20} style={{ color: '#1F2D6E' }} />
                    <h2 className="text-lg font-bold" style={{ color: c.textPrimary }}>Seleccionar Período</h2>
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                    <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: c.textSecondary }}>Mes</label>
                        <select value={mes} onChange={e => setMes(e.target.value)} style={{ ...inputStyle, width: '160px' }}>
                            {meses.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: c.textSecondary }}>Año</label>
                        <select value={anio} onChange={e => setAnio(e.target.value)} style={{ ...inputStyle, width: '120px' }}>
                            {[2024, 2025, 2026, 2027].map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                    </div>
                    <div className="mt-5">
                        <button onClick={generarPDF} disabled={generando}
                            className="flex items-center gap-2 px-6 py-2 rounded-lg text-white font-medium transition disabled:opacity-50"
                            style={{ backgroundColor: '#1F2D6E' }}>
                            <Download size={18} />
                            {generando ? 'Generando...' : `Descargar PDF — ${meses[mes - 1]} ${anio}`}
                        </button>
                    </div>
                </div>
            </div>
            {/* Resumen del mes */}
            {resumen && (
                <>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        {[
                            { label: 'Total Pedidos del Mes', value: resumen.pedidosMes.length, color: '#1F2D6E' },
                            { label: 'Pedidos Entregados', value: resumen.entregados.length, color: '#2B8EA6' },
                            { label: 'Pedidos Pendientes', value: resumen.pendientes.length, color: '#C4467A' },
                            { label: 'Lotes por Vencer', value: resumen.lotesVencer, color: '#B85C4A' },
                        ].map((stat) => (
                            <div key={stat.label} className="rounded-xl p-5 shadow-sm" style={{ backgroundColor: c.card, border: `1px solid ${c.cardBorder}` }}>
                                <p className="text-3xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
                                <p className="text-sm mt-1" style={{ color: c.textSecondary }}>{stat.label}</p>
                            </div>
                        ))}
                    </div>
                    {/* Tabla preview de pedidos del mes */}
                    <div className="rounded-xl shadow-sm p-6 mb-6" style={{ backgroundColor: c.card, border: `1px solid ${c.cardBorder}` }}>
                        <h2 className="text-lg font-bold mb-4" style={{ color: c.textPrimary }}>
                            Pedidos de {meses[mes - 1]} {anio}
                        </h2>
                        {resumen.pedidosMes.length === 0 ? (
                            <p className="text-center py-8" style={{ color: c.textSecondary }}>No hay pedidos para este período.</p>
                        ) : (
                            <table className="w-full">
                                <thead>
                                    <tr style={{ backgroundColor: '#1F2D6E' }}>
                                        {['N° Pedido', 'Contrato', 'Institución', 'F. Programada', 'F. Entrega Real', 'Estado'].map(h => (
                                            <th key={h} className="px-4 py-3 text-left text-sm font-medium text-white">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {resumen.pedidosMes.map(p => {
                                        const colores = {
                                            pendiente: { bg: '#FEF3C7', text: '#92400E' },
                                            en_proceso: { bg: '#DBEAFE', text: '#1E40AF' },
                                            entregado: { bg: '#D1FAE5', text: '#065F46' },
                                            retrasado: { bg: '#FEE2E2', text: '#991B1B' }
                                        };
                                        const est = colores[p.estado] || { bg: '#F3F4F6', text: '#374151' };
                                        return (
                                            <tr key={p.id_pedido} style={{ backgroundColor: c.tableRow, borderBottom: `1px solid ${c.tableBorder}` }}>
                                                <td className="px-4 py-3 text-sm font-medium" style={{ color: '#2B8EA6' }}>{p.numero_pedido}</td>
                                                <td className="px-4 py-3 text-sm" style={{ color: c.textPrimary }}>{p.Contrato?.numero_contrato}</td>
                                                <td className="px-4 py-3 text-sm" style={{ color: c.textSecondary }}>{p.Contrato?.Institucion?.nombre || '—'}</td>
                                                <td className="px-4 py-3 text-sm" style={{ color: c.textSecondary }}>{formatFecha(p.fecha_programada)}</td>
                                                <td className="px-4 py-3 text-sm" style={{ color: c.textSecondary }}>
                                                    {formatFecha(p.fecha_real_entrega)}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="px-3 py-1 rounded-full text-xs font-medium capitalize"
                                                        style={{ backgroundColor: est.bg, color: est.text }}>
                                                        {p.estado}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};
export default Reportes;
