// Actualiza estados que dependen de la fecha: lotes vencidos y contratos
// cuyo plazo terminó. Corre al iniciar el servidor y luego cada hora; cada
// cambio queda en la auditoría como hecho por el sistema.
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const { Lote, Contrato } = require('../models/index');
const { registrarAuditoria, instantanea } = require('../utils/auditoria');
const { hoy } = require('../utils/fechas');

const actualizarVencimientos = async () => {
    const fechaHoy = hoy();
    await sequelize.transaction(async (transaction) => {
        const lotes = await Lote.findAll({
            where: {
                fecha_vencimiento: { [Op.lt]: fechaHoy },
                condicion: { [Op.in]: ['disponible', 'cuarentena', 'bloqueado'] }
            },
            transaction
        });
        for (const lote of lotes) {
            const antes = instantanea(lote);
            await lote.update({ condicion: 'vencido', motivo_condicion: 'Vencimiento automático por fecha' }, { transaction });
            await registrarAuditoria({ tabla: 'lotes', id_registro: lote.id_lote, accion: 'cambio_estado', antes, despues: lote, motivo: 'Vencimiento automático por fecha', transaction });
        }

        const contratos = await Contrato.findAll({
            where: { fecha_fin: { [Op.lt]: fechaHoy }, estado: 'vigente' },
            transaction
        });
        for (const contrato of contratos) {
            const antes = instantanea(contrato);
            await contrato.update({ estado: 'vencido' }, { transaction });
            await registrarAuditoria({ tabla: 'contratos', id_registro: contrato.id_contrato, accion: 'cambio_estado', antes, despues: contrato, motivo: 'Fin del plazo del contrato', transaction });
        }
    });
};

const programarVencimientos = () => {
    const ejecutar = () => actualizarVencimientos().catch(e => console.error('Error al actualizar vencimientos:', e.message));
    ejecutar();
    setInterval(ejecutar, 60 * 60 * 1000);
};

module.exports = { actualizarVencimientos, programarVencimientos };
