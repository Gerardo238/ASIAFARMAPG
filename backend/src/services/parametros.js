const { Parametro } = require('../models/index');

const POR_DEFECTO = {
    VIGENCIA_MINIMA_INGRESO_MESES: 12,
    VIGENCIA_MINIMA_DESPACHO_MESES: 12,
    DIAS_SEMAFORO_ROJO: 90,
    DIAS_SEMAFORO_AMARILLO: 180,
    DIAS_ALERTA_CONTRATO: 30,
    DIAS_ALERTA_PEDIDO: 5
};

const obtenerParametro = async (clave) => {
    const p = await Parametro.findByPk(clave);
    const valor = Number(p?.valor);
    return Number.isFinite(valor) ? valor : POR_DEFECTO[clave];
};

const obtenerParametros = async () => {
    const lista = await Parametro.findAll();
    const resultado = { ...POR_DEFECTO };
    lista.forEach(p => {
        const valor = Number(p.valor);
        if (Number.isFinite(valor)) resultado[p.clave] = valor;
    });
    return resultado;
};

module.exports = { obtenerParametro, obtenerParametros };
