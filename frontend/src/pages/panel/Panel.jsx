import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import {
    Truck, Wallet, Clock, Warehouse, CalendarDays, Search, ScanLine, PackageCheck, Box, Send, CheckCircle2,
    CalendarClock, FileText, PackageX, ChevronRight, Timer, Award, RefreshCw
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useColors, MARCA } from '../../hooks/useColors';
import { useLista } from '../../hooks/useCatalogo';
import { Pagina, Encabezado, Pildora, Tarjeta, Indicador, Tabla, Anillo } from '../../components/ui';
import { useTonos } from '../../hooks/useTonos';
import { ESTADOS_PEDIDO } from '../../utils/catalogos';
import { formatFecha, formatFechaHora, tiempoRestante } from '../../utils/fechas';
import { numero, moneda } from '../../utils/formato';

// Lo que cada rol tiene que atender hoy. Cada fila abre la lista ya filtrada.
const TAREAS = [
    { clave: 'por_preparar', titulo: 'Pedidos por preparar', icono: PackageCheck, ruta: '/pedidos?estado=pendiente', roles: ['bodeguero', 'administrador'] },
    { clave: 'por_empacar', titulo: 'Pedidos por empacar', icono: Box, ruta: '/pedidos?estado=en_preparacion', roles: ['bodeguero', 'administrador'] },
    { clave: 'por_enviar', titulo: 'Listos para salir', icono: Send, ruta: '/pedidos?estado=empacado', roles: ['bodeguero', 'administrador'] },
    { clave: 'por_confirmar_entrega', titulo: 'Entregas por confirmar', icono: CheckCircle2, ruta: '/pedidos?estado=en_transporte', roles: ['encargado_contratos', 'bodeguero', 'administrador'] },
    { clave: 'entregas_proximas', titulo: 'Entregas próximas sin despachar', icono: CalendarClock, ruta: '/pedidos?proximos=1', roles: ['encargado_contratos', 'bodeguero', 'administrador', 'gerente'], alerta: true },
    { clave: 'pedidos_retrasados', titulo: 'Pedidos retrasados', icono: Clock, ruta: '/pedidos?retrasados=1', roles: ['encargado_contratos', 'administrador', 'gerente'], alerta: true },
    { clave: 'contratos_por_vencer', titulo: 'Contratos por vencer con saldo', icono: FileText, ruta: '/contratos', roles: ['encargado_contratos', 'administrador', 'gerente'], alerta: true },
    { clave: 'lotes_sin_destino', titulo: 'Lotes por vencer sin destino', icono: PackageX, ruta: '/informes?informe=lotes-sin-destino', roles: ['bodeguero', 'administrador', 'gerente'], alerta: true }
];

const PREGUNTAS = [
    { texto: '¿Qué lotes tengo, cuánto me queda y cuándo vencen?', ruta: '/lotes' },
    { texto: 'Si se retira un lote, ¿a quién se entregó?', ruta: '/trazabilidad' },
    { texto: '¿Cómo voy con cada contrato?', ruta: '/contratos' },
    { texto: '¿Quién cambió un dato y cuánto valía antes?', ruta: '/auditoria', roles: ['administrador', 'gerente'] }
];

// Tonos de la dona de pedidos (amarillos, como la dona "Users" de la referencia)
const ETAPAS_EN_CURSO = [
    { estado: 'pendiente', tarea: 'por_preparar', color: '#FFF1C7' },
    { estado: 'en_preparacion', tarea: 'por_empacar', color: '#FFDD7A' },
    { estado: 'empacado', tarea: 'por_enviar', color: '#FFC727' },
    { estado: 'en_transporte', tarea: 'por_confirmar_entrega', color: '#E8A800' }
];

const TONO_PEDIDO = { pendiente: 'amarillo', en_preparacion: 'azul', empacado: 'morado', en_transporte: 'azul', entregado: 'verde', anulado: 'gris' };
const VERBOS = {
    crear: 'registró', editar: 'modificó', anular: 'anuló', restaurar: 'restauró', ajuste_inventario: 'ajustó el inventario de',
    adjuntar: 'adjuntó un documento a', cambio_estado: 'cambió el estado de'
};

const qCorto = (v) => (v >= 1000 ? `Q${numero(Math.round(v / 100) / 10)}k` : `Q${numero(v)}`);
const variacion = (actual, anterior) => (anterior ? Math.round(((actual - anterior) / anterior) * 1000) / 10 : null);
const hace = (fecha) => {
    const min = Math.round((Date.now() - new Date(fecha)) / 60000);
    if (min < 60) return `hace ${Math.max(1, min)} min`;
    if (min < 1440) return `hace ${Math.round(min / 60)} h`;
    const d = Math.round(min / 1440);
    return d < 31 ? `hace ${d} d` : formatFecha(fecha);
};

const Panel = () => {
    const c = useColors();
    const tonos = useTonos();
    const { usuario } = useAuth();
    const navigate = useNavigate();
    const [panel, setPanel] = useState(null);
    const [busqueda, setBusqueda] = useState('');
    const [lotesEncontrados, setLotesEncontrados] = useState([]);
    const { datos: productos } = useLista('/productos', { activos: true });

    const cargar = () => api.get('/panel').then(r => setPanel(r.data));
    useEffect(() => { cargar(); }, []);

    // Búsqueda de productos y lotes (también con lector de código de barras)
    const texto = busqueda.trim();
    useEffect(() => {
        if (texto.length < 2) return;
        const t = setTimeout(() => {
            api.get('/lotes', { params: { buscar: texto, con_existencia: 1 } }).then(r => setLotesEncontrados(r.data.slice(0, 5))).catch(() => setLotesEncontrados([]));
        }, 250);
        return () => clearTimeout(t);
    }, [texto]);
    const encontrados = texto ? productos.filter(p => `${p.nombre} ${p.codigo}`.toLowerCase().includes(texto.toLowerCase())).slice(0, 4) : [];
    const lotesVisibles = texto.length >= 2 ? lotesEncontrados : [];
    const alPresionarEnter = (e) => {
        if (e.key !== 'Enter') return;
        const exacto = lotesVisibles.find(l => l.numero_lote.toLowerCase() === texto.toLowerCase());
        if (exacto) navigate(`/trazabilidad/lote/${exacto.id_lote}`);
        else if (encontrados.length === 1) navigate(`/productos/${encontrados[0].id_producto}`);
        else if (texto) navigate(`/trazabilidad?numero_lote=${encodeURIComponent(texto)}`);
    };

    const ind = panel?.indicadores || {};
    const conteos = { ...(panel?.tareas || {}), ...ind };
    const tareas = TAREAS.filter(t => t.roles.includes(usuario?.rol));
    const cump = panel?.cumplimiento;
    const al = panel?.alertas;
    const g = panel?.graficas;
    const meses = panel?.actividad || [];
    const [anterior, actual] = [meses[meses.length - 2], meses[meses.length - 1]];
    const valorBodega = g ? g.valor_inventario.apto + g.valor_inventario.vida_corta + g.valor_inventario.retenido : 0;
    const enCurso = ETAPAS_EN_CURSO.map(e => ({ ...e, valor: panel?.tareas?.[e.tarea] || 0 }));
    const totalEnCurso = enCurso.reduce((s, e) => s + e.valor, 0);
    const inventario = g ? [
        { nombre: 'Apto', valor: g.valor_inventario.apto, color: MARCA.azul },
        { nombre: 'Vida corta', valor: g.valor_inventario.vida_corta, color: '#8DB4FA' },
        { nombre: 'Retenido', valor: g.valor_inventario.retenido, color: '#C9DBFD' },
        { nombre: 'Vencido', valor: g.valor_inventario.vencido, color: MARCA.rojo }
    ] : [];
    const totalInventario = inventario.reduce((s, x) => s + x.valor, 0);
    const pct = (v, t) => (t ? Math.round((v / t) * 100) : 0);
    const ejes = { tick: { fontSize: 10.5, fill: c.textSecondary }, axisLine: false, tickLine: false };
    const tooltip = { borderRadius: 10, border: 'none', backgroundColor: c.card, color: c.textPrimary, fontSize: 12, boxShadow: '0 6px 24px rgba(0,0,0,0.12)' };
    const colorSemaforo = { rojo: MARCA.rojo, amarillo: MARCA.amarillo, verde: MARCA.azul };
    const sinMargen = 'mb-0!';

    return (
        <Pagina>
            <Encabezado titulo="Panel de control">
                <Pildora icono={CalendarDays}>{formatFecha(new Date().toISOString())}</Pildora>
                <div className="relative w-[300px] max-w-full">
                    <div className="flex items-center gap-2 h-8 px-3 rounded-lg" style={{ backgroundColor: c.darkMode ? '#2A2A35' : '#EEEEF0' }}>
                        <Search size={14} style={{ color: c.textSecondary }} />
                        <input type="text" placeholder="Buscar producto o lote" value={busqueda}
                            onChange={e => setBusqueda(e.target.value)} onKeyDown={alPresionarEnter}
                            className="bg-transparent outline-none text-[12px] w-full" style={{ color: c.textPrimary }} />
                        <ScanLine size={14} style={{ color: c.textSecondary }} title="Funciona con lector de código de barras" />
                    </div>
                    {(encontrados.length > 0 || lotesVisibles.length > 0) && (
                        <div className="absolute top-10 left-0 w-full rounded-xl z-40 overflow-hidden shadow-xl py-1" style={{ backgroundColor: c.card }}>
                            {encontrados.map(p => (
                                <button key={`p${p.id_producto}`} className="w-full text-left px-4 py-2 hover:brightness-95" style={{ backgroundColor: c.card }} onClick={() => navigate(`/productos/${p.id_producto}`)}>
                                    <p className="text-[13px] font-medium" style={{ color: c.textPrimary }}>{p.nombre} {p.concentracion}</p>
                                    <p className="text-[11px]" style={{ color: c.textSecondary }}>Producto · existencia {numero(p.existencia)}</p>
                                </button>
                            ))}
                            {lotesVisibles.map(l => (
                                <button key={`l${l.id_lote}`} className="w-full text-left px-4 py-2 hover:brightness-95" style={{ backgroundColor: c.card }} onClick={() => navigate(`/trazabilidad/lote/${l.id_lote}`)}>
                                    <p className="text-[13px] font-medium" style={{ color: c.textPrimary }}>Lote {l.numero_lote} · {l.Producto?.nombre}</p>
                                    <p className="text-[11px]" style={{ color: c.textSecondary }}>{l.Laboratorio?.nombre} · {numero(l.cantidad_disponible)} unid. · vence {formatFecha(l.fecha_vencimiento)}</p>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </Encabezado>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                {/* Fila 1: cuatro cifras + dos donas */}
                <div className="xl:col-span-2 grid grid-cols-2 gap-5">
                    <Indicador etiqueta="Pedidos en curso" icono={Truck} valor={ind.pedidos_en_curso ?? '…'} onClick={() => navigate('/pedidos')}
                        tendencia={actual ? variacion(actual.pedidos, anterior?.pedidos) : undefined} textoTendencia="pedidos nuevos vs. mes pasado" />
                    <Indicador etiqueta="Entregado este mes" icono={Wallet} valor={actual ? qCorto(actual.monto_entregado) : '…'} onClick={() => navigate('/informes?informe=pedidos-entregados')}
                        tendencia={actual ? variacion(actual.monto_entregado, anterior?.monto_entregado) : undefined} textoTendencia="vs. mes pasado" />
                    <Indicador etiqueta="Pedidos retrasados" icono={Clock} valor={ind.pedidos_retrasados ?? '…'} alerta={ind.pedidos_retrasados > 0} onClick={() => navigate('/pedidos?retrasados=1')}
                        detalle={`${ind.entregas_proximas ?? 0} más se entregan en ${panel?.parametros.dias_alerta_pedido ?? 5} días o menos`} />
                    <Indicador etiqueta="Valor en bodega" icono={Warehouse} valor={g ? qCorto(valorBodega) : '…'} onClick={() => navigate('/informes?informe=existencias-lote')}
                        detalle={`${ind.lotes_con_existencia ?? 0} lotes disponibles · ${ind.lotes_en_alerta ?? 0} en alerta`} />
                </div>

                <Tarjeta titulo="Pedidos en curso" className={sinMargen}>
                    <p className="text-[28px] font-medium leading-none -mt-1" style={{ color: c.textPrimary }}>{totalEnCurso}</p>
                    <p className="text-[10.5px] mt-1" style={{ color: c.textSecondary }}>por etapa del despacho</p>
                    <div className="flex items-end justify-between gap-2 mt-3">
                        <div className="space-y-1 pb-1">
                            {enCurso.map(e => (
                                <button key={e.estado} onClick={() => navigate(`/pedidos?estado=${e.estado}`)} className="flex items-center gap-1.5 text-[10.5px] hover:underline" style={{ color: c.textPrimary }}>
                                    <span className="w-2.5 h-1.5 rounded-full" style={{ backgroundColor: e.color }} />
                                    <b className="font-semibold">{e.valor}</b> {ESTADOS_PEDIDO[e.estado].label}
                                </button>
                            ))}
                        </div>
                        <Dona datos={totalEnCurso ? enCurso : [{ valor: 1, color: c.riel }]} />
                    </div>
                </Tarjeta>

                <Tarjeta titulo="Valor del inventario" className={sinMargen}>
                    <p className="text-[28px] font-medium leading-none -mt-1" style={{ color: c.textPrimary }}>{qCorto(totalInventario)}</p>
                    <p className="text-[10.5px] mt-1" style={{ color: c.textSecondary }}>a costo de compra</p>
                    <div className="flex items-end justify-between gap-2 mt-3">
                        <div className="space-y-1 pb-1">
                            {inventario.map(x => (
                                <p key={x.nombre} className="flex items-center gap-1.5 text-[10.5px]" style={{ color: c.textPrimary }}>
                                    <span className="w-2.5 h-1.5 rounded-full" style={{ backgroundColor: x.color }} />
                                    <b className="font-semibold">{pct(x.valor, totalInventario)}%</b> {x.nombre}
                                </p>
                            ))}
                        </div>
                        <Dona datos={totalInventario ? inventario : [{ valor: 1, color: c.riel }]} />
                    </div>
                </Tarjeta>

                {/* Fila 2: barras de entregas + dos anillos */}
                <Tarjeta titulo="Entregas por mes" className={`xl:col-span-2 xl:row-span-2 ${sinMargen}`}
                    acciones={<span className="text-[12px] font-medium" style={{ color: c.textPrimary }}>Últimos 9 meses</span>}>
                    <ResponsiveContainer width="100%" height={210}>
                        <BarChart data={meses} barSize={9} margin={{ top: 6, right: 0, left: -24, bottom: 0 }}>
                            <XAxis dataKey="mes" {...ejes} tickFormatter={m => m.toUpperCase()} />
                            <YAxis allowDecimals={false} {...ejes} />
                            <Tooltip cursor={false} contentStyle={tooltip} formatter={(v, n) => [v, n === 'a_tiempo' ? 'A tiempo' : 'Con retraso']} />
                            <Bar dataKey="a_tiempo" stackId="e" fill={MARCA.azul} background={{ fill: c.riel, radius: 10 }} radius={[0, 0, 10, 10]} />
                            <Bar dataKey="con_retraso" stackId="e" fill={MARCA.rojo} radius={[10, 10, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                    <div className="flex gap-4 mt-2 text-[10.5px]" style={{ color: c.textSecondary }}>
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-1.5 rounded-full" style={{ backgroundColor: MARCA.azul }} />A tiempo</span>
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-1.5 rounded-full" style={{ backgroundColor: MARCA.rojo }} />Con retraso</span>
                    </div>
                    <p className="text-[15px] font-semibold mt-6 mb-2" style={{ color: c.textPrimary }}>Monto entregado</p>
                    <ResponsiveContainer width="100%" height={150}>
                        <LineChart data={meses} margin={{ top: 6, right: 6, left: -12, bottom: 0 }}>
                            <XAxis dataKey="mes" {...ejes} tickFormatter={m => m.toUpperCase()} />
                            <YAxis {...ejes} tickFormatter={qCorto} />
                            <Tooltip contentStyle={tooltip} formatter={v => [moneda(v), 'Entregado']} />
                            <Line type="monotone" dataKey="monto_entregado" stroke={MARCA.morado} strokeWidth={2.5} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </Tarjeta>

                <TarjetaAnillo icono={Timer} titulo="Entregas a tiempo" valor={cump?.tasa_a_tiempo != null ? `${cump.tasa_a_tiempo}%` : '—'}
                    pie={cump ? `${cump.a_tiempo} de ${cump.entregados} · últimos 12 meses` : ''} porcentaje={cump?.tasa_a_tiempo} color={MARCA.morado}
                    texto={cump ? `${numero(cump.retraso_promedio)}d` : ''} nota="retraso prom." onClick={() => navigate('/informes?informe=cumplimiento-entregas')} />
                <TarjetaAnillo icono={Award} titulo="Contratos cumplidos" valor={cump?.tasa_contratos_cumplidos != null ? `${cump.tasa_contratos_cumplidos}%` : '—'}
                    pie={cump ? `${cump.contratos_cumplidos} de ${cump.contratos_cerrados} cerrados, sin atrasos` : ''} porcentaje={cump?.tasa_contratos_cumplidos} color={MARCA.verde}
                    onClick={() => navigate('/informes?informe=cumplimiento-modalidad')} />

                <Tarjeta titulo="Pedidos recientes" className={`xl:col-span-2 ${sinMargen}`} sinPadding
                    acciones={<button onClick={cargar} className="af-boton p-1" aria-label="Actualizar" title="Actualizar"><RefreshCw size={15} style={{ color: c.textSecondary }} /></button>}>
                    <Tabla
                        claveFila="id_pedido"
                        filas={panel?.pedidos_recientes || []}
                        tonoFila={p => (p.dias_retraso > 0 && p.estado !== 'entregado' ? 'rojo' : TONO_PEDIDO[p.estado])}
                        alHacerClic={p => navigate(`/pedidos/${p.id_pedido}`)}
                        vacio="No hay pedidos registrados."
                        columnas={[
                            { clave: 'numero_pedido', titulo: 'Pedido', render: p => <span className="font-medium">{p.numero_pedido}</span> },
                            { clave: 'institucion', titulo: 'Institución', render: p => <span className="block max-w-[170px] truncate">{p.institucion}</span> },
                            { clave: 'fecha_programada', titulo: 'Programada', render: p => formatFecha(p.fecha_programada) },
                            { clave: 'estado', titulo: 'Estado', render: p => p.dias_retraso > 0 && p.estado !== 'entregado' ? `${p.estado_texto} · ${p.dias_retraso} d tarde` : p.estado_texto }
                        ]}
                    />
                </Tarjeta>

                {/* Fila 3: pendientes del rol y alertas */}
                {tareas.length > 0 && (
                    <Tarjeta titulo="Lo que tienes pendiente" className={`xl:col-span-2 ${sinMargen}`}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {tareas.map(t => {
                                const valor = conteos[t.clave] ?? 0;
                                const urgente = t.alerta && valor > 0;
                                const Icono = t.icono;
                                return (
                                    <button key={t.clave} onClick={() => navigate(t.ruta)} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:brightness-95"
                                        style={{ backgroundColor: urgente ? tonos.rojo.fila : c.suave }}>
                                        <Icono size={17} strokeWidth={1.6} style={{ color: urgente ? tonos.rojo.text : c.textPrimary }} />
                                        <span className="flex-1 text-[12.5px]" style={{ color: c.textPrimary }}>{t.titulo}</span>
                                        <span className="text-[16px] font-semibold" style={{ color: urgente ? tonos.rojo.text : valor ? c.textPrimary : c.textSecondary }}>{panel ? valor : '…'}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </Tarjeta>
                )}

                <Tarjeta titulo="Alertas" className={`${tareas.length ? 'xl:col-span-2' : 'xl:col-span-4'} ${sinMargen}`}>
                    <div className="space-y-1.5 max-h-[230px] overflow-y-auto pr-1">
                        {(al?.oficios || []).map(o => <FilaAlerta key={`o${o.id_institucion}`} tono="rojo" titulo={o.institucion} detalle={o.oficios >= (panel.parametros.limite_oficios || 3) ? 'Oficios de advertencia: puede dejar de comprarnos' : 'Un oficio más y puede dejar de comprarnos'} valor={`${o.oficios} oficios`} onClick={() => navigate('/informes?informe=oficios-advertencia')} />)}
                        {(al?.retrasados || []).map(p => <FilaAlerta key={`r${p.id_pedido}`} tono="rojo" titulo={`${p.numero_pedido} · ${p.institucion}`} detalle="Pedido retrasado" valor={`${p.dias_retraso} d háb. tarde`} onClick={() => navigate(`/pedidos/${p.id_pedido}`)} />)}
                        {(al?.entregas_proximas || []).map(p => <FilaAlerta key={`e${p.id_pedido}`} tono="amarillo" titulo={`${p.numero_pedido} · ${p.institucion}`} detalle={`Sigue en bodega · ${p.estado_texto}`} valor={p.dias_para_entrega === 0 ? 'hoy' : `en ${p.dias_para_entrega} d`} onClick={() => navigate(`/pedidos/${p.id_pedido}`)} />)}
                        {(al?.contratos || []).map(a => <FilaAlerta key={`c${a.id_contrato}`} tono="rojo" titulo={`Contrato ${a.numero_contrato}`} detalle={`${a.institucion} · ${a.porcentaje_avance}% entregado · pedir a más tardar el ${formatFecha(a.ultimo_dia_pedido)}`} valor={`vence en ${a.dias_para_fin} d`} onClick={() => navigate(`/contratos/${a.id_contrato}`)} />)}
                        {(al?.tramites || []).map(t => <FilaAlerta key={`t${t.id_tramite}`} tono={t.tipo === 'prorroga' ? 'amarillo' : 'morado'} titulo={`Contrato ${t.numero_contrato} · ${t.institucion}`}
                            detalle={t.tipo === 'prorroga' ? `Prórroga ${t.numero_documento} sin resolver` : `Nota técnica ${t.estado === 'aprobada' ? 'vigente' : 'en trámite'}: ${t.producto}`}
                            valor={t.tipo === 'prorroga' ? `contrato vence en ${t.dias_para_fin_contrato} d` : `hasta el ${formatFecha(t.fecha_hasta)}`} onClick={() => navigate(`/contratos/${t.id_contrato}`)} />)}
                        {(al?.sin_destino || []).map(l => <FilaAlerta key={`s${l.id_lote}`} tono="amarillo" titulo={`Lote ${l.numero_lote} · ${l.producto}`} detalle={l.razon} valor={tiempoRestante(l.dias)} onClick={() => navigate(`/trazabilidad/lote/${l.id_lote}`)} />)}
                        {(al?.bajo_minimo || []).map(p => <FilaAlerta key={`p${p.id_producto}`} tono="amarillo" titulo={p.nombre} detalle={`Bajo el mínimo (${numero(p.stock_minimo)})`} valor={`${numero(p.existencia)} unid.`} onClick={() => navigate(`/productos/${p.id_producto}`)} />)}
                        {(al?.lotes || []).map(l => <FilaAlerta key={`l${l.id_lote}`} tono={l.condicion === 'disponible' ? 'gris' : 'morado'} titulo={`Lote ${l.numero_lote} · ${l.producto}`} detalle={l.condicion === 'disponible' ? l.laboratorio : `${l.laboratorio} · ${l.condicion}`} valor={tiempoRestante(l.semaforo.dias)} onClick={() => navigate(`/trazabilidad/lote/${l.id_lote}`)} />)}
                        {al && !al.retrasados.length && !al.entregas_proximas.length && !al.contratos.length && !al.sin_destino.length && !al.bajo_minimo.length && !al.lotes.length && !al.tramites?.length && !al.oficios?.length && (
                            <p className="text-[13px] text-center py-8" style={{ color: c.textSecondary }}>Sin alertas. Todo en orden.</p>
                        )}
                    </div>
                </Tarjeta>

                {/* Fila 4: vencimientos y contratos */}
                <Tarjeta titulo="Lo que vence en los próximos 12 meses" className={`xl:col-span-2 ${sinMargen}`}
                    acciones={<span className="text-[12px] font-medium" style={{ color: c.textPrimary }}>Valor a costo</span>}>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={g?.vencimientos || []} barSize={9} margin={{ top: 6, right: 0, left: -10, bottom: 0 }}>
                            <XAxis dataKey="mes" {...ejes} interval={0} tickFormatter={m => m.split(' ')[0].toUpperCase()} />
                            <YAxis {...ejes} tickFormatter={qCorto} />
                            <Tooltip cursor={false} contentStyle={tooltip} formatter={(v, n, p) => [`${moneda(v)} · ${numero(p.payload.unidades)} unid. (${p.payload.lotes} lote/s)`, p.payload.mes]} />
                            <Bar dataKey="valor" background={{ fill: c.riel, radius: 10 }} radius={10}>
                                {(g?.vencimientos || []).map((v, i) => <Cell key={i} fill={colorSemaforo[v.color]} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                    <div className="flex gap-4 mt-2 text-[10.5px]" style={{ color: c.textSecondary }}>
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-1.5 rounded-full" style={{ backgroundColor: MARCA.rojo }} />Crítico</span>
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-1.5 rounded-full" style={{ backgroundColor: MARCA.amarillo }} />Alerta</span>
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-1.5 rounded-full" style={{ backgroundColor: MARCA.azul }} />Normal</span>
                    </div>
                </Tarjeta>

                <Tarjeta titulo="Avance de contratos vigentes" nota="La barra es lo entregado; la marca, cuánto del plazo ya pasó." className={`xl:col-span-2 ${sinMargen}`}>
                    <div className="space-y-3.5">
                        {(g?.avance_contratos || []).slice(0, 5).map(x => (
                            <button key={x.id_contrato} onClick={() => navigate(`/contratos/${x.id_contrato}`)} className="w-full text-left group">
                                <div className="flex justify-between gap-2 text-[12.5px] mb-1.5">
                                    <span className="truncate" style={{ color: c.textPrimary }}><b className="font-semibold group-hover:underline">{x.numero_contrato}</b> · {x.institucion}</span>
                                    <span className="shrink-0" style={{ color: x.atrasado ? MARCA.rojo : c.textSecondary }}>{x.avance}% · {x.dias_para_fin} d</span>
                                </div>
                                <div className="relative h-[7px] rounded-full" style={{ backgroundColor: c.riel }}>
                                    <div className="h-full rounded-full" style={{ width: `${Math.min(100, x.avance)}%`, backgroundColor: x.avance >= 100 ? MARCA.verde : x.atrasado ? MARCA.rojo : MARCA.azul }} />
                                    <div className="absolute -top-[3px] w-[3px] h-[13px] rounded-full" style={{ left: `calc(${x.tiempo}% - 1px)`, backgroundColor: c.textPrimary }} />
                                </div>
                            </button>
                        ))}
                        {g && !g.avance_contratos.length && <p className="text-[13px] py-6 text-center" style={{ color: c.textSecondary }}>No hay contratos vigentes.</p>}
                    </div>
                </Tarjeta>

                {/* Fila 5: puntualidad, bitácora y preguntas */}
                <Tarjeta titulo="Puntualidad por institución" nota="Últimos 12 meses" className={`xl:col-span-2 ${sinMargen}`}>
                    <div className="space-y-3">
                        {(g?.cumplimiento_instituciones || []).map(x => (
                            <div key={x.institucion} className="flex items-center gap-3">
                                <Anillo porcentaje={x.porcentaje} color={x.porcentaje >= 80 ? MARCA.verde : x.porcentaje >= 50 ? MARCA.amarillo : MARCA.rojo} tamano={40} />
                                <div className="min-w-0">
                                    <p className="text-[13px] font-medium truncate" style={{ color: c.textPrimary }}>{x.institucion}</p>
                                    <p className="text-[11px]" style={{ color: c.textSecondary }}>{x.a_tiempo} a tiempo · {x.con_retraso} con retraso</p>
                                </div>
                            </div>
                        ))}
                        {g && !g.cumplimiento_instituciones.length && <p className="text-[13px] py-6 text-center" style={{ color: c.textSecondary }}>Todavía no hay entregas.</p>}
                    </div>
                </Tarjeta>

                {panel?.bitacora ? (
                    <Tarjeta titulo="Movimiento reciente" className={`xl:col-span-2 ${sinMargen}`}
                        acciones={<button className="text-[12px] font-medium" style={{ color: MARCA.azul }} onClick={() => navigate('/auditoria')}>Ver bitácora</button>}>
                        <ol className="space-y-3">
                            {panel.bitacora.map(b => (
                                <li key={b.id} className="flex gap-3">
                                    <span className="mt-1.5 w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: b.accion === 'anular' ? MARCA.rojo : b.accion === 'crear' ? MARCA.verde : MARCA.azul }} />
                                    <div className="min-w-0">
                                        <p className="text-[12.5px]" style={{ color: c.textPrimary }}>
                                            <b className="font-semibold">{b.usuario}</b> {VERBOS[b.accion] || b.accion} {b.que} <b className="font-semibold">{b.nombre}</b>
                                            {b.estado && <> → {ESTADOS_PEDIDO[b.estado]?.label || b.estado}</>}
                                        </p>
                                        <p className="text-[11px] truncate" style={{ color: c.textSecondary }} title={formatFechaHora(b.fecha)}>{hace(b.fecha)}{b.motivo ? ` · ${b.motivo}` : ''}</p>
                                    </div>
                                </li>
                            ))}
                        </ol>
                    </Tarjeta>
                ) : (
                    <Preguntas className={`xl:col-span-2 ${sinMargen}`} usuario={usuario} navigate={navigate} />
                )}
                {panel?.bitacora && <Preguntas className={`xl:col-span-4 ${sinMargen}`} usuario={usuario} navigate={navigate} />}
            </div>
        </Pagina>
    );
};

// Dona gruesa, como en la referencia
const Dona = ({ datos }) => (
    <div className="w-[104px] h-[104px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie data={datos} dataKey="valor" innerRadius={30} outerRadius={50} startAngle={90} endAngle={-270} stroke="none" isAnimationActive={false}>
                    {datos.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
            </PieChart>
        </ResponsiveContainer>
    </div>
);

// Tarjeta con ícono, anillo de progreso y cifra (como "Paid Invoices" de la referencia)
const TarjetaAnillo = ({ icono: Icono, titulo, valor, pie, porcentaje, color, texto, nota, onClick }) => {
    const c = useColors();
    return (
        <div onClick={onClick} className="rounded-xl px-6 py-5 cursor-pointer hover:brightness-[0.98] flex flex-col" style={{ backgroundColor: c.card }}>
            <div className="flex items-start justify-between">
                <Icono size={30} strokeWidth={1.2} style={{ color: c.textPrimary }} />
                <div className="flex flex-col items-center">
                    <Anillo porcentaje={porcentaje} color={color} texto={texto || undefined} />
                    {nota && <span className="text-[9.5px] mt-0.5" style={{ color: c.textSecondary }}>{nota}</span>}
                </div>
            </div>
            <p className="text-[13px] mt-4" style={{ color: c.textSecondary }}>{titulo}</p>
            <p className="text-[26px] font-medium leading-tight" style={{ color: c.textPrimary }}>{valor}</p>
            <p className="text-[10.5px] mt-1" style={{ color: c.textSecondary }}>{pie}</p>
        </div>
    );
};

const FilaAlerta = ({ tono, titulo, detalle, valor, onClick }) => {
    const c = useColors();
    const t = useTonos()[tono];
    return (
        <button onClick={onClick} className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-left hover:brightness-95" style={{ backgroundColor: t.fila }}>
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: t.fuerte }} />
            <span className="flex-1 min-w-0">
                <span className="block text-[12.5px] font-medium truncate" style={{ color: c.textPrimary }}>{titulo}</span>
                <span className="block text-[11px] truncate" style={{ color: c.darkMode ? '#E4E4EA' : c.textSecondary }}>{detalle}</span>
            </span>
            <span className="text-[11.5px] font-semibold shrink-0" style={{ color: c.darkMode ? '#FFFFFF' : t.text }}>{valor}</span>
        </button>
    );
};

const Preguntas = ({ className, usuario, navigate }) => {
    const c = useColors();
    return (
        <Tarjeta titulo="Respuestas en un minuto" nota="Las cuatro preguntas que el sistema contesta siempre" className={className}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {PREGUNTAS.filter(p => !p.roles || p.roles.includes(usuario?.rol)).map((p, i) => (
                    <button key={p.ruta} onClick={() => navigate(p.ruta)} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:brightness-95" style={{ backgroundColor: c.suave }}>
                        <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold text-white shrink-0" style={{ backgroundColor: MARCA.azul }}>{i + 1}</span>
                        <span className="flex-1 text-[12.5px]" style={{ color: c.textPrimary }}>{p.texto}</span>
                        <ChevronRight size={15} style={{ color: c.textSecondary }} />
                    </button>
                ))}
            </div>
        </Tarjeta>
    );
};

export default Panel;
