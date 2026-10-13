const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { Usuario } = require('../models/index');
const { manejarError, ErrorNegocio, exigirTexto } = require('../utils/errores');
const { registrarAuditoria, instantanea } = require('../utils/auditoria');

const ROLES = ['gerente', 'bodeguero', 'encargado_contratos', 'administrador'];

// Login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ mensaje: 'Ingresa tu correo y contraseña' });
        }

        const usuario = await Usuario.findOne({ where: { email, activo: true } });
        if (!usuario) {
            return res.status(401).json({ mensaje: 'Credenciales incorrectas' });
        }

        const passwordValido = await bcrypt.compare(password, usuario.password);
        if (!passwordValido) {
            return res.status(401).json({ mensaje: 'Credenciales incorrectas' });
        }

        const token = jwt.sign(
            { id: usuario.id_usuario, rol: usuario.rol },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({
            mensaje: 'Login exitoso',
            token,
            usuario: {
                id: usuario.id_usuario,
                nombre: usuario.nombre,
                apellido: usuario.apellido,
                email: usuario.email,
                rol: usuario.rol
            }
        });
    } catch (error) {
        manejarError(res, error, 'Error en el servidor');
    }
};

// Obtener todos los usuarios
const getUsuarios = async (req, res) => {
    try {
        const usuarios = await Usuario.findAll({
            attributes: { exclude: ['password'] },
            order: [['nombre', 'ASC']]
        });
        res.json(usuarios);
    } catch (error) {
        manejarError(res, error, 'Error al obtener usuarios');
    }
};

// Siempre debe quedar al menos un administrador activo
const verificarUltimoAdmin = async (usuario, cambios) => {
    const dejaDeSerAdmin = usuario.rol === 'administrador' && usuario.activo &&
        ((cambios.rol && cambios.rol !== 'administrador') || cambios.activo === false);
    if (!dejaDeSerAdmin) return;
    const otros = await Usuario.count({ where: { rol: 'administrador', activo: true, id_usuario: { [Op.ne]: usuario.id_usuario } } });
    if (otros === 0) throw new ErrorNegocio('Debe quedar al menos un administrador activo en el sistema.');
};

// Registrar nuevo usuario
const registro = async (req, res) => {
    try {
        const { nombre, apellido, email, password, rol } = req.body;
        exigirTexto(nombre, 'El nombre es obligatorio.');
        exigirTexto(apellido, 'El apellido es obligatorio.');
        exigirTexto(email, 'El correo es obligatorio.');
        if (!password || password.length < 6) throw new ErrorNegocio('La contraseña debe tener al menos 6 caracteres.');
        if (!ROLES.includes(rol)) throw new ErrorNegocio('Selecciona un rol válido.');

        const passwordHash = await bcrypt.hash(password, 10);
        const usuario = await Usuario.create({ nombre, apellido, email, password: passwordHash, rol, activo: true });
        await registrarAuditoria({ req, tabla: 'usuarios', id_registro: usuario.id_usuario, accion: 'crear', despues: usuario });
        res.status(201).json({ mensaje: 'Usuario creado exitosamente' });
    } catch (error) {
        manejarError(res, error, 'Error al crear usuario');
    }
};

// Actualizar usuario
const updateUsuario = async (req, res) => {
    try {
        const usuario = await Usuario.findByPk(req.params.id);
        if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado' });

        const { nombre, apellido, email, password, rol, activo } = req.body;
        const datos = { nombre, apellido, email, rol, activo };
        Object.keys(datos).forEach(k => datos[k] === undefined && delete datos[k]);
        if (datos.rol && !ROLES.includes(datos.rol)) throw new ErrorNegocio('Rol no válido.');
        if (datos.activo === false && usuario.id_usuario === req.usuario.id) throw new ErrorNegocio('No puedes desactivar tu propio usuario.');
        await verificarUltimoAdmin(usuario, datos);
        if (password) {
            if (password.length < 6) throw new ErrorNegocio('La contraseña debe tener al menos 6 caracteres.');
            datos.password = await bcrypt.hash(password, 10);
        }

        const antes = instantanea(usuario);
        await usuario.update(datos);
        await registrarAuditoria({
            req, tabla: 'usuarios', id_registro: usuario.id_usuario, accion: 'editar', antes, despues: usuario,
            motivo: password ? 'Incluye cambio de contraseña' : req.body.motivo
        });
        res.json({ mensaje: 'Usuario actualizado exitosamente' });
    } catch (error) {
        manejarError(res, error, 'Error al actualizar usuario');
    }
};

// Desactivar usuario (no se borra: sus registros en la auditoría deben seguir
// mostrando quién hizo cada cambio)
const anularUsuario = async (req, res) => {
    try {
        const motivo = exigirTexto(req.body?.motivo, 'Indica el motivo de la desactivación.');
        const usuario = await Usuario.findByPk(req.params.id);
        if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        if (usuario.id_usuario === req.usuario.id) throw new ErrorNegocio('No puedes desactivar tu propio usuario.');
        if (!usuario.activo) throw new ErrorNegocio('El usuario ya está inactivo.');
        await verificarUltimoAdmin(usuario, { activo: false });
        const antes = instantanea(usuario);
        await usuario.update({ activo: false });
        await registrarAuditoria({ req, tabla: 'usuarios', id_registro: usuario.id_usuario, accion: 'anular', antes, despues: usuario, motivo });
        res.json({ mensaje: 'Usuario desactivado' });
    } catch (error) {
        manejarError(res, error, 'Error al desactivar usuario');
    }
};

const restaurarUsuario = async (req, res) => {
    try {
        const usuario = await Usuario.findByPk(req.params.id);
        if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        if (usuario.activo) throw new ErrorNegocio('El usuario ya está activo.');
        const antes = instantanea(usuario);
        await usuario.update({ activo: true });
        await registrarAuditoria({ req, tabla: 'usuarios', id_registro: usuario.id_usuario, accion: 'restaurar', antes, despues: usuario, motivo: req.body?.motivo });
        res.json({ mensaje: 'Usuario reactivado' });
    } catch (error) {
        manejarError(res, error, 'Error al reactivar usuario');
    }
};

module.exports = { login, getUsuarios, registro, updateUsuario, anularUsuario, restaurarUsuario };
