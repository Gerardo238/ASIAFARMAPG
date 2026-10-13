// Bitácora de auditoría: cada creación, cambio, anulación o restauración queda
// registrada con el usuario que la hizo, la fecha, el motivo y los datos de
// antes y después. Así, aunque haya varios administradores, siempre se sabe
// quién cambió qué.
const { Auditoria } = require('../models/index');

const CAMPOS_OCULTOS = ['password'];

// Copia independiente de los datos del registro. Ojo: en Sequelize,
// get({ plain: true }) de un modelo sin includes devuelve el MISMO objeto
// interno, que luego cambia con update(); por eso se clona.
const aPlano = (registro) => {
    if (!registro) return null;
    const datos = JSON.parse(JSON.stringify(typeof registro.get === 'function' ? registro.get({ plain: true }) : registro));
    CAMPOS_OCULTOS.forEach(c => delete datos[c]);
    return datos;
};

// Úsese para guardar el "antes" de un registro antes de modificarlo
const instantanea = aPlano;

const registrarAuditoria = ({ req, tabla, id_registro, accion, antes = null, despues = null, motivo = null, transaction }) =>
    Auditoria.create({
        tabla,
        id_registro: String(id_registro),
        accion,
        datos_antes: aPlano(antes),
        datos_despues: aPlano(despues),
        id_usuario: req?.usuario?.id ?? null,
        motivo: motivo || null,
        ip: req?.ip || null
    }, { transaction });

module.exports = { registrarAuditoria, aPlano, instantanea };
