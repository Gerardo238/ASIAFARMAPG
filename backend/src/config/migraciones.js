// sync() crea las tablas nuevas pero no agrega columnas a las que ya existen.
// Aquí se agregan las columnas que el modelo ganó después de crear la base,
// para que una base ya cargada (asiafarma.sql) siga funcionando sin perder
// datos. Solo agrega lo que falta, así que se puede correr siempre.
const { DataTypes } = require('sequelize');
const sequelize = require('./database');

const COLUMNAS = {
    modalidades_compra: {
        monto_minimo: { type: DataTypes.DECIMAL(14, 2) },
        monto_maximo: { type: DataTypes.DECIMAL(14, 2) },
        dias_habiles_entrega: { type: DataTypes.INTEGER },
        contrato_abierto: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }
    },
    pedidos: {
        fecha_compromiso: { type: DataTypes.DATEONLY },
        documento_compromiso: { type: DataTypes.STRING(100) }
    }
};

// Datos que se cargan una sola vez, al agregar las columnas de la tabla
const AL_AGREGAR = {
    // Rango de monto, plazo de entrega y contrato abierto de las modalidades existentes
    modalidades_compra: async () => {
        const { MODALIDADES } = require('../seeders/catalogos');
        const { ModalidadCompra } = require('../models/index');
        for (const { nombre, monto_minimo, monto_maximo, dias_habiles_entrega, contrato_abierto, descripcion } of MODALIDADES) {
            const modalidad = await ModalidadCompra.findOne({ where: { nombre } });
            if (modalidad) await modalidad.update({ monto_minimo, monto_maximo, dias_habiles_entrega, contrato_abierto, descripcion: modalidad.descripcion || descripcion || null });
        }
    }
};

const aplicarMigraciones = async () => {
    const qi = sequelize.getQueryInterface();
    for (const [tabla, columnas] of Object.entries(COLUMNAS)) {
        const actuales = await qi.describeTable(tabla);
        let agregadas = 0;
        for (const [columna, definicion] of Object.entries(columnas)) {
            if (!actuales[columna]) { await qi.addColumn(tabla, columna, definicion); agregadas += 1; }
        }
        if (agregadas && AL_AGREGAR[tabla]) await AL_AGREGAR[tabla]();
    }
};

module.exports = { aplicarMigraciones };
