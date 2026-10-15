import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLista } from '../../hooks/useCatalogo';
import { Pagina, Encabezado, Tabla, Boton, Selector, Insignia, BarraAvance } from '../../components/ui';
import { useAvisos } from '../../hooks/useDialogos';
import { InsigniaContrato } from '../../components/insignias';
import { ESTADOS_CONTRATO } from '../../utils/catalogos';
import { formatFecha } from '../../utils/fechas';
import { moneda } from '../../utils/formato';
import { puede } from '../../utils/permisos';
import FormContrato from './FormContrato';

const Contratos = () => {
    const { usuario } = useAuth();
    const navigate = useNavigate();
    const [estado, setEstado] = useState('');
    const { datos: contratos, recargar, cargando } = useLista(`/contratos${estado ? `?estado=${estado}` : ''}`);
    const [nuevo, setNuevo] = useState(false);
    const [aviso, mostrar] = useAvisos();

    return (
        <Pagina>
            {aviso}
            <Encabezado icono={FileText} titulo="Contratos" color="#A35CF1" subtitulo="Contratos adjudicados en GUATECOMPRAS, con el avance de entrega de cada renglón.">
                <div className="w-48"><Selector vacio="Todos los estados" value={estado} onChange={e => setEstado(e.target.value)} opciones={Object.entries(ESTADOS_CONTRATO).map(([value, x]) => ({ value, label: x.label }))} /></div>
                {puede(usuario, 'contratos.escribir') && <Boton icono={Plus} onClick={() => setNuevo(true)}>Nuevo contrato</Boton>}
            </Encabezado>

            <Tabla
                claveFila="id_contrato"
                filas={contratos}
                cargando={cargando}
                alHacerClic={c => navigate(`/contratos/${c.id_contrato}`)}
                vacio="No hay contratos."
                columnas={[
                    { clave: 'numero_contrato', titulo: 'Contrato', render: c => <span className="font-medium whitespace-nowrap" style={{ color: '#3D7EF6' }}>{c.numero_contrato}</span> },
                    { clave: 'nog', titulo: 'NOG' },
                    { clave: 'inst', titulo: 'Institución', render: c => c.Institucion?.nombre },
                    { clave: 'modalidad', titulo: 'Modalidad', render: c => c.ModalidadCompra?.nombre },
                    {
                        clave: 'vigencia', titulo: 'Vigencia', render: c => (
                            <div>
                                <div>{formatFecha(c.fecha_inicio)} – {formatFecha(c.fecha_fin)}</div>
                                {c.estado === 'vigente' && c.dias_para_fin <= 30 && c.tiene_saldo && <Insignia tono="rojo">Vence en {c.dias_para_fin} d con saldo</Insignia>}
                            </div>
                        )
                    },
                    { clave: 'renglones', titulo: 'Renglones', alinear: 'right', render: c => c.renglones.length },
                    { clave: 'monto', titulo: 'Monto', alinear: 'right', render: c => moneda(c.monto_total) },
                    { clave: 'avance', titulo: 'Avance', render: c => <BarraAvance porcentaje={c.porcentaje_avance} /> },
                    { clave: 'estado', titulo: 'Estado', render: c => <InsigniaContrato valor={c.estado} /> }
                ]}
            />

            {nuevo && <FormContrato contrato={null} alCerrar={() => setNuevo(false)} alGuardar={() => { setNuevo(false); mostrar('Contrato creado'); recargar(); }} />}
        </Pagina>
    );
};

export default Contratos;
