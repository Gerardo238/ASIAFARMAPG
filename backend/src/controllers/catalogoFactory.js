// CRUD genérico para catálogos y directorios (proveedores, laboratorios,
// instituciones, ubicaciones...). Nada se borra: "anular" desactiva el
// registro y "restaurar" lo reactiva, y todo queda en la auditoría.
const { manejarError, exigirTexto, ErrorNegocio } = require('../utils/errores');
const { registrarAuditoria, instantanea } = require('../utils/auditoria');

const crearControladorCatalogo = ({ modelo, tabla, campos, include = [], orden = [['nombre', 'ASC']], etiqueta = 'registro', validar }) => {
    const pk = modelo.primaryKeyAttribute;

    const tomarCampos = (body) => {
        const datos = {};
        campos.forEach(c => {
            if (body[c] !== undefined) datos[c] = typeof body[c] === 'string' ? body[c].trim() || null : body[c];
        });
        return datos;
    };

    const buscar = async (id) => {
        const registro = await modelo.findByPk(id);
        if (!registro) throw new ErrorNegocio(`No se encontró el ${etiqueta}.`, 404);
        return registro;
    };

    return {
        // ?activos=1 devuelve solo los activos (para listas desplegables)
        listar: async (req, res) => {
            try {
                const where = req.query.activos ? { activo: true } : {};
                res.json(await modelo.findAll({ where, include, order: orden }));
            } catch (error) { manejarError(res, error, `Error al obtener ${tabla}`); }
        },

        obtener: async (req, res) => {
            try {
                const registro = await modelo.findByPk(req.params.id, { include });
                if (!registro) return res.status(404).json({ mensaje: `No se encontró el ${etiqueta}.` });
                res.json(registro);
            } catch (error) { manejarError(res, error, `Error al obtener el ${etiqueta}`); }
        },

        crear: async (req, res) => {
            try {
                const datos = tomarCampos(req.body);
                if (validar) await validar(datos);
                const registro = await modelo.create(datos);
                await registrarAuditoria({ req, tabla, id_registro: registro[pk], accion: 'crear', despues: registro });
                res.status(201).json({ mensaje: `${etiqueta[0].toUpperCase()}${etiqueta.slice(1)} creado exitosamente`, registro });
            } catch (error) { manejarError(res, error, `Error al crear el ${etiqueta}`); }
        },

        actualizar: async (req, res) => {
            try {
                const registro = await buscar(req.params.id);
                const antes = instantanea(registro);
                const datos = tomarCampos(req.body);
                if (validar) await validar({ ...antes, ...datos });
                await registro.update(datos);
                await registrarAuditoria({ req, tabla, id_registro: registro[pk], accion: 'editar', antes, despues: registro, motivo: req.body.motivo });
                res.json({ mensaje: `${etiqueta[0].toUpperCase()}${etiqueta.slice(1)} actualizado exitosamente`, registro });
            } catch (error) { manejarError(res, error, `Error al actualizar el ${etiqueta}`); }
        },

        anular: async (req, res) => {
            try {
                const motivo = exigirTexto(req.body?.motivo, 'Indica el motivo de la anulación.');
                const registro = await buscar(req.params.id);
                if (!registro.activo) throw new ErrorNegocio(`El ${etiqueta} ya está anulado.`);
                const antes = instantanea(registro);
                await registro.update({ activo: false });
                await registrarAuditoria({ req, tabla, id_registro: registro[pk], accion: 'anular', antes, despues: registro, motivo });
                res.json({ mensaje: `${etiqueta[0].toUpperCase()}${etiqueta.slice(1)} anulado. Puede restaurarse cuando se necesite.` });
            } catch (error) { manejarError(res, error, `Error al anular el ${etiqueta}`); }
        },

        restaurar: async (req, res) => {
            try {
                const registro = await buscar(req.params.id);
                if (registro.activo) throw new ErrorNegocio(`El ${etiqueta} ya está activo.`);
                const antes = instantanea(registro);
                await registro.update({ activo: true });
                await registrarAuditoria({ req, tabla, id_registro: registro[pk], accion: 'restaurar', antes, despues: registro, motivo: req.body?.motivo });
                res.json({ mensaje: `${etiqueta[0].toUpperCase()}${etiqueta.slice(1)} restaurado.` });
            } catch (error) { manejarError(res, error, `Error al restaurar el ${etiqueta}`); }
        }
    };
};

module.exports = { crearControladorCatalogo };
