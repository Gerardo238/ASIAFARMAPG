-- ============================================================================
-- ASIAFARMA: base de datos completa (estructura + datos + documentos adjuntos)
-- Exportada el 16/10/2026 19:08.
--
-- Se carga con instalar-base-datos.bat (en la misma carpeta). Primero borra las
-- tablas de ASIAFARMA que ya existan y despues crea todo de nuevo.
-- ============================================================================
--
-- PostgreSQL database dump
--

-- Dumped from database version 16rc1
-- Dumped by pg_dump version 16rc1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.seguimiento_pedidos DROP CONSTRAINT IF EXISTS seguimiento_pedidos_id_usuario_fkey;
ALTER TABLE IF EXISTS ONLY public.seguimiento_pedidos DROP CONSTRAINT IF EXISTS seguimiento_pedidos_id_pedido_fkey;
ALTER TABLE IF EXISTS ONLY public.productos DROP CONSTRAINT IF EXISTS productos_id_unidad_medida_fkey;
ALTER TABLE IF EXISTS ONLY public.productos DROP CONSTRAINT IF EXISTS productos_id_forma_farmaceutica_fkey;
ALTER TABLE IF EXISTS ONLY public.pedidos DROP CONSTRAINT IF EXISTS pedidos_id_usuario_fkey;
ALTER TABLE IF EXISTS ONLY public.pedidos DROP CONSTRAINT IF EXISTS pedidos_id_contrato_fkey;
ALTER TABLE IF EXISTS ONLY public.movimientos DROP CONSTRAINT IF EXISTS movimientos_id_usuario_fkey;
ALTER TABLE IF EXISTS ONLY public.movimientos DROP CONSTRAINT IF EXISTS movimientos_id_pedido_fkey;
ALTER TABLE IF EXISTS ONLY public.movimientos DROP CONSTRAINT IF EXISTS movimientos_id_motivo_fkey;
ALTER TABLE IF EXISTS ONLY public.movimientos DROP CONSTRAINT IF EXISTS movimientos_id_lote_fkey;
ALTER TABLE IF EXISTS ONLY public.movimientos DROP CONSTRAINT IF EXISTS movimientos_id_ingreso_fkey;
ALTER TABLE IF EXISTS ONLY public.lotes DROP CONSTRAINT IF EXISTS lotes_id_ubicacion_fkey;
ALTER TABLE IF EXISTS ONLY public.lotes DROP CONSTRAINT IF EXISTS lotes_id_producto_fkey;
ALTER TABLE IF EXISTS ONLY public.lotes DROP CONSTRAINT IF EXISTS lotes_id_laboratorio_fkey;
ALTER TABLE IF EXISTS ONLY public.lotes DROP CONSTRAINT IF EXISTS lotes_id_ingreso_fkey;
ALTER TABLE IF EXISTS ONLY public.instituciones DROP CONSTRAINT IF EXISTS instituciones_id_tipo_institucion_fkey;
ALTER TABLE IF EXISTS ONLY public.ingresos DROP CONSTRAINT IF EXISTS ingresos_id_usuario_fkey;
ALTER TABLE IF EXISTS ONLY public.ingresos DROP CONSTRAINT IF EXISTS ingresos_id_proveedor_fkey;
ALTER TABLE IF EXISTS ONLY public.detalle_pedidos DROP CONSTRAINT IF EXISTS detalle_pedidos_id_producto_fkey;
ALTER TABLE IF EXISTS ONLY public.detalle_pedidos DROP CONSTRAINT IF EXISTS detalle_pedidos_id_pedido_fkey;
ALTER TABLE IF EXISTS ONLY public.detalle_pedidos DROP CONSTRAINT IF EXISTS detalle_pedidos_id_detalle_contrato_fkey;
ALTER TABLE IF EXISTS ONLY public.detalle_contratos DROP CONSTRAINT IF EXISTS detalle_contratos_id_producto_fkey;
ALTER TABLE IF EXISTS ONLY public.detalle_contratos DROP CONSTRAINT IF EXISTS detalle_contratos_id_contrato_fkey;
ALTER TABLE IF EXISTS ONLY public.contratos DROP CONSTRAINT IF EXISTS contratos_id_usuario_fkey;
ALTER TABLE IF EXISTS ONLY public.contratos DROP CONSTRAINT IF EXISTS contratos_id_modalidad_fkey;
ALTER TABLE IF EXISTS ONLY public.contratos DROP CONSTRAINT IF EXISTS contratos_id_institucion_fkey;
ALTER TABLE IF EXISTS ONLY public.auditoria DROP CONSTRAINT IF EXISTS auditoria_id_usuario_fkey;
ALTER TABLE IF EXISTS ONLY public.asignaciones_lote DROP CONSTRAINT IF EXISTS asignaciones_lote_id_lote_fkey;
ALTER TABLE IF EXISTS ONLY public.asignaciones_lote DROP CONSTRAINT IF EXISTS asignaciones_lote_id_detalle_pedido_fkey;
ALTER TABLE IF EXISTS ONLY public.adjuntos DROP CONSTRAINT IF EXISTS adjuntos_id_usuario_fkey;
DROP INDEX IF EXISTS public.lotes_numero_lote;
DROP INDEX IF EXISTS public.lotes_id_producto_fecha_vencimiento;
DROP INDEX IF EXISTS public.ingresos_id_proveedor_serie_factura_numero_factura;
DROP INDEX IF EXISTS public.detalle_contratos_id_contrato_id_producto;
DROP INDEX IF EXISTS public.auditoria_tabla_id_registro;
DROP INDEX IF EXISTS public.auditoria_fecha;
DROP INDEX IF EXISTS public.adjuntos_entidad_id_registro;
ALTER TABLE IF EXISTS ONLY public.usuarios DROP CONSTRAINT IF EXISTS usuarios_pkey;
ALTER TABLE IF EXISTS ONLY public.usuarios DROP CONSTRAINT IF EXISTS usuarios_email_key;
ALTER TABLE IF EXISTS ONLY public.unidades_medida DROP CONSTRAINT IF EXISTS unidades_medida_pkey;
ALTER TABLE IF EXISTS ONLY public.unidades_medida DROP CONSTRAINT IF EXISTS unidades_medida_nombre_key;
ALTER TABLE IF EXISTS ONLY public.ubicaciones DROP CONSTRAINT IF EXISTS ubicaciones_pkey;
ALTER TABLE IF EXISTS ONLY public.ubicaciones DROP CONSTRAINT IF EXISTS ubicaciones_nombre_key;
ALTER TABLE IF EXISTS ONLY public.tipos_institucion DROP CONSTRAINT IF EXISTS tipos_institucion_pkey;
ALTER TABLE IF EXISTS ONLY public.tipos_institucion DROP CONSTRAINT IF EXISTS tipos_institucion_nombre_key;
ALTER TABLE IF EXISTS ONLY public.seguimiento_pedidos DROP CONSTRAINT IF EXISTS seguimiento_pedidos_pkey;
ALTER TABLE IF EXISTS ONLY public.proveedores DROP CONSTRAINT IF EXISTS proveedores_pkey;
ALTER TABLE IF EXISTS ONLY public.proveedores DROP CONSTRAINT IF EXISTS proveedores_nit_key;
ALTER TABLE IF EXISTS ONLY public.productos DROP CONSTRAINT IF EXISTS productos_pkey;
ALTER TABLE IF EXISTS ONLY public.productos DROP CONSTRAINT IF EXISTS productos_codigo_key;
ALTER TABLE IF EXISTS ONLY public.pedidos DROP CONSTRAINT IF EXISTS pedidos_pkey;
ALTER TABLE IF EXISTS ONLY public.pedidos DROP CONSTRAINT IF EXISTS pedidos_numero_pedido_key;
ALTER TABLE IF EXISTS ONLY public.parametros DROP CONSTRAINT IF EXISTS parametros_pkey;
ALTER TABLE IF EXISTS ONLY public.movimientos DROP CONSTRAINT IF EXISTS movimientos_pkey;
ALTER TABLE IF EXISTS ONLY public.motivos_movimiento DROP CONSTRAINT IF EXISTS motivos_movimiento_pkey;
ALTER TABLE IF EXISTS ONLY public.motivos_movimiento DROP CONSTRAINT IF EXISTS motivos_movimiento_nombre_key;
ALTER TABLE IF EXISTS ONLY public.motivos_movimiento DROP CONSTRAINT IF EXISTS motivos_movimiento_codigo_key;
ALTER TABLE IF EXISTS ONLY public.modalidades_compra DROP CONSTRAINT IF EXISTS modalidades_compra_pkey;
ALTER TABLE IF EXISTS ONLY public.modalidades_compra DROP CONSTRAINT IF EXISTS modalidades_compra_nombre_key;
ALTER TABLE IF EXISTS ONLY public.lotes DROP CONSTRAINT IF EXISTS lotes_pkey;
ALTER TABLE IF EXISTS ONLY public.laboratorios DROP CONSTRAINT IF EXISTS laboratorios_pkey;
ALTER TABLE IF EXISTS ONLY public.laboratorios DROP CONSTRAINT IF EXISTS laboratorios_nombre_key;
ALTER TABLE IF EXISTS ONLY public.instituciones DROP CONSTRAINT IF EXISTS instituciones_pkey;
ALTER TABLE IF EXISTS ONLY public.instituciones DROP CONSTRAINT IF EXISTS instituciones_nit_key;
ALTER TABLE IF EXISTS ONLY public.ingresos DROP CONSTRAINT IF EXISTS ingresos_pkey;
ALTER TABLE IF EXISTS ONLY public.formas_farmaceuticas DROP CONSTRAINT IF EXISTS formas_farmaceuticas_pkey;
ALTER TABLE IF EXISTS ONLY public.formas_farmaceuticas DROP CONSTRAINT IF EXISTS formas_farmaceuticas_nombre_key;
ALTER TABLE IF EXISTS ONLY public.detalle_pedidos DROP CONSTRAINT IF EXISTS detalle_pedidos_pkey;
ALTER TABLE IF EXISTS ONLY public.detalle_contratos DROP CONSTRAINT IF EXISTS detalle_contratos_pkey;
ALTER TABLE IF EXISTS ONLY public.contratos DROP CONSTRAINT IF EXISTS contratos_pkey;
ALTER TABLE IF EXISTS ONLY public.contratos DROP CONSTRAINT IF EXISTS contratos_numero_contrato_key;
ALTER TABLE IF EXISTS ONLY public.auditoria DROP CONSTRAINT IF EXISTS auditoria_pkey;
ALTER TABLE IF EXISTS ONLY public.asignaciones_lote DROP CONSTRAINT IF EXISTS asignaciones_lote_pkey;
ALTER TABLE IF EXISTS ONLY public.adjuntos DROP CONSTRAINT IF EXISTS adjuntos_pkey;
ALTER TABLE IF EXISTS public.usuarios ALTER COLUMN id_usuario DROP DEFAULT;
ALTER TABLE IF EXISTS public.unidades_medida ALTER COLUMN id_unidad_medida DROP DEFAULT;
ALTER TABLE IF EXISTS public.ubicaciones ALTER COLUMN id_ubicacion DROP DEFAULT;
ALTER TABLE IF EXISTS public.tipos_institucion ALTER COLUMN id_tipo_institucion DROP DEFAULT;
ALTER TABLE IF EXISTS public.seguimiento_pedidos ALTER COLUMN id_seguimiento DROP DEFAULT;
ALTER TABLE IF EXISTS public.proveedores ALTER COLUMN id_proveedor DROP DEFAULT;
ALTER TABLE IF EXISTS public.productos ALTER COLUMN id_producto DROP DEFAULT;
ALTER TABLE IF EXISTS public.pedidos ALTER COLUMN id_pedido DROP DEFAULT;
ALTER TABLE IF EXISTS public.movimientos ALTER COLUMN id_movimiento DROP DEFAULT;
ALTER TABLE IF EXISTS public.motivos_movimiento ALTER COLUMN id_motivo DROP DEFAULT;
ALTER TABLE IF EXISTS public.modalidades_compra ALTER COLUMN id_modalidad DROP DEFAULT;
ALTER TABLE IF EXISTS public.lotes ALTER COLUMN id_lote DROP DEFAULT;
ALTER TABLE IF EXISTS public.laboratorios ALTER COLUMN id_laboratorio DROP DEFAULT;
ALTER TABLE IF EXISTS public.instituciones ALTER COLUMN id_institucion DROP DEFAULT;
ALTER TABLE IF EXISTS public.ingresos ALTER COLUMN id_ingreso DROP DEFAULT;
ALTER TABLE IF EXISTS public.formas_farmaceuticas ALTER COLUMN id_forma_farmaceutica DROP DEFAULT;
ALTER TABLE IF EXISTS public.detalle_pedidos ALTER COLUMN id_detalle_pedido DROP DEFAULT;
ALTER TABLE IF EXISTS public.detalle_contratos ALTER COLUMN id_detalle_contrato DROP DEFAULT;
ALTER TABLE IF EXISTS public.contratos ALTER COLUMN id_contrato DROP DEFAULT;
ALTER TABLE IF EXISTS public.auditoria ALTER COLUMN id_auditoria DROP DEFAULT;
ALTER TABLE IF EXISTS public.asignaciones_lote ALTER COLUMN id_asignacion DROP DEFAULT;
ALTER TABLE IF EXISTS public.adjuntos ALTER COLUMN id_adjunto DROP DEFAULT;
DROP SEQUENCE IF EXISTS public.usuarios_id_usuario_seq;
DROP TABLE IF EXISTS public.usuarios;
DROP SEQUENCE IF EXISTS public.unidades_medida_id_unidad_medida_seq;
DROP TABLE IF EXISTS public.unidades_medida;
DROP SEQUENCE IF EXISTS public.ubicaciones_id_ubicacion_seq;
DROP TABLE IF EXISTS public.ubicaciones;
DROP SEQUENCE IF EXISTS public.tipos_institucion_id_tipo_institucion_seq;
DROP TABLE IF EXISTS public.tipos_institucion;
DROP SEQUENCE IF EXISTS public.seguimiento_pedidos_id_seguimiento_seq;
DROP TABLE IF EXISTS public.seguimiento_pedidos;
DROP SEQUENCE IF EXISTS public.proveedores_id_proveedor_seq;
DROP TABLE IF EXISTS public.proveedores;
DROP SEQUENCE IF EXISTS public.productos_id_producto_seq;
DROP TABLE IF EXISTS public.productos;
DROP SEQUENCE IF EXISTS public.pedidos_id_pedido_seq;
DROP TABLE IF EXISTS public.pedidos;
DROP TABLE IF EXISTS public.parametros;
DROP SEQUENCE IF EXISTS public.movimientos_id_movimiento_seq;
DROP TABLE IF EXISTS public.movimientos;
DROP SEQUENCE IF EXISTS public.motivos_movimiento_id_motivo_seq;
DROP TABLE IF EXISTS public.motivos_movimiento;
DROP SEQUENCE IF EXISTS public.modalidades_compra_id_modalidad_seq;
DROP TABLE IF EXISTS public.modalidades_compra;
DROP SEQUENCE IF EXISTS public.lotes_id_lote_seq;
DROP TABLE IF EXISTS public.lotes;
DROP SEQUENCE IF EXISTS public.laboratorios_id_laboratorio_seq;
DROP TABLE IF EXISTS public.laboratorios;
DROP SEQUENCE IF EXISTS public.instituciones_id_institucion_seq;
DROP TABLE IF EXISTS public.instituciones;
DROP SEQUENCE IF EXISTS public.ingresos_id_ingreso_seq;
DROP TABLE IF EXISTS public.ingresos;
DROP SEQUENCE IF EXISTS public.formas_farmaceuticas_id_forma_farmaceutica_seq;
DROP TABLE IF EXISTS public.formas_farmaceuticas;
DROP SEQUENCE IF EXISTS public.detalle_pedidos_id_detalle_pedido_seq;
DROP TABLE IF EXISTS public.detalle_pedidos;
DROP SEQUENCE IF EXISTS public.detalle_contratos_id_detalle_contrato_seq;
DROP TABLE IF EXISTS public.detalle_contratos;
DROP SEQUENCE IF EXISTS public.contratos_id_contrato_seq;
DROP TABLE IF EXISTS public.contratos;
DROP SEQUENCE IF EXISTS public.auditoria_id_auditoria_seq;
DROP TABLE IF EXISTS public.auditoria;
DROP SEQUENCE IF EXISTS public.asignaciones_lote_id_asignacion_seq;
DROP TABLE IF EXISTS public.asignaciones_lote;
DROP SEQUENCE IF EXISTS public.adjuntos_id_adjunto_seq;
DROP TABLE IF EXISTS public.adjuntos;
DROP TYPE IF EXISTS public.enum_usuarios_rol;
DROP TYPE IF EXISTS public.enum_pedidos_estado;
DROP TYPE IF EXISTS public.enum_movimientos_tipo_movimiento;
DROP TYPE IF EXISTS public.enum_motivos_movimiento_tipo;
DROP TYPE IF EXISTS public.enum_lotes_condicion;
DROP TYPE IF EXISTS public.enum_ingresos_estado;
DROP TYPE IF EXISTS public.enum_contratos_estado;
--
-- Name: enum_contratos_estado; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_contratos_estado AS ENUM (
    'vigente',
    'completado',
    'vencido',
    'cancelado',
    'anulado'
);


--
-- Name: enum_ingresos_estado; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_ingresos_estado AS ENUM (
    'registrado',
    'anulado'
);


--
-- Name: enum_lotes_condicion; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_lotes_condicion AS ENUM (
    'disponible',
    'cuarentena',
    'bloqueado',
    'agotado',
    'vencido',
    'anulado'
);


--
-- Name: enum_motivos_movimiento_tipo; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_motivos_movimiento_tipo AS ENUM (
    'entrada',
    'salida'
);


--
-- Name: enum_movimientos_tipo_movimiento; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_movimientos_tipo_movimiento AS ENUM (
    'entrada',
    'salida'
);


--
-- Name: enum_pedidos_estado; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_pedidos_estado AS ENUM (
    'pendiente',
    'en_preparacion',
    'empacado',
    'en_transporte',
    'entregado',
    'anulado'
);


--
-- Name: enum_usuarios_rol; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_usuarios_rol AS ENUM (
    'gerente',
    'bodeguero',
    'encargado_contratos',
    'administrador'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: adjuntos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.adjuntos (
    id_adjunto integer NOT NULL,
    entidad character varying(30) NOT NULL,
    id_registro integer NOT NULL,
    nombre_archivo character varying(200) NOT NULL,
    tipo_mime character varying(100) NOT NULL,
    tamano integer NOT NULL,
    datos bytea NOT NULL,
    descripcion character varying(200),
    id_usuario integer,
    activo boolean DEFAULT true,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: adjuntos_id_adjunto_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.adjuntos_id_adjunto_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: adjuntos_id_adjunto_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.adjuntos_id_adjunto_seq OWNED BY public.adjuntos.id_adjunto;


--
-- Name: asignaciones_lote; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.asignaciones_lote (
    id_asignacion integer NOT NULL,
    id_detalle_pedido integer NOT NULL,
    id_lote integer NOT NULL,
    cantidad numeric(12,2) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: asignaciones_lote_id_asignacion_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.asignaciones_lote_id_asignacion_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: asignaciones_lote_id_asignacion_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.asignaciones_lote_id_asignacion_seq OWNED BY public.asignaciones_lote.id_asignacion;


--
-- Name: auditoria; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.auditoria (
    id_auditoria integer NOT NULL,
    tabla character varying(50) NOT NULL,
    id_registro character varying(50) NOT NULL,
    accion character varying(30) NOT NULL,
    datos_antes jsonb,
    datos_despues jsonb,
    id_usuario integer,
    motivo text,
    ip character varying(60),
    fecha timestamp with time zone NOT NULL
);


--
-- Name: auditoria_id_auditoria_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.auditoria_id_auditoria_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: auditoria_id_auditoria_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.auditoria_id_auditoria_seq OWNED BY public.auditoria.id_auditoria;


--
-- Name: contratos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contratos (
    id_contrato integer NOT NULL,
    id_institucion integer NOT NULL,
    id_usuario integer NOT NULL,
    numero_contrato character varying(50) NOT NULL,
    nog character varying(20) NOT NULL,
    id_modalidad integer NOT NULL,
    fecha_inicio date NOT NULL,
    fecha_fin date NOT NULL,
    vigencia_minima_meses integer,
    monto_total numeric(12,2) DEFAULT 0,
    estado public.enum_contratos_estado DEFAULT 'vigente'::public.enum_contratos_estado,
    observaciones text,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: contratos_id_contrato_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.contratos_id_contrato_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: contratos_id_contrato_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.contratos_id_contrato_seq OWNED BY public.contratos.id_contrato;


--
-- Name: detalle_contratos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.detalle_contratos (
    id_detalle_contrato integer NOT NULL,
    id_contrato integer NOT NULL,
    numero_renglon integer NOT NULL,
    id_producto integer NOT NULL,
    cantidad_contratada numeric(12,2) NOT NULL,
    precio_unitario numeric(12,2) NOT NULL,
    subtotal numeric(12,2) NOT NULL,
    activo boolean DEFAULT true,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: detalle_contratos_id_detalle_contrato_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.detalle_contratos_id_detalle_contrato_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: detalle_contratos_id_detalle_contrato_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.detalle_contratos_id_detalle_contrato_seq OWNED BY public.detalle_contratos.id_detalle_contrato;


--
-- Name: detalle_pedidos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.detalle_pedidos (
    id_detalle_pedido integer NOT NULL,
    id_pedido integer NOT NULL,
    id_detalle_contrato integer NOT NULL,
    id_producto integer NOT NULL,
    cantidad numeric(12,2) NOT NULL,
    precio_unitario numeric(12,2) NOT NULL,
    subtotal numeric(12,2) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: detalle_pedidos_id_detalle_pedido_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.detalle_pedidos_id_detalle_pedido_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: detalle_pedidos_id_detalle_pedido_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.detalle_pedidos_id_detalle_pedido_seq OWNED BY public.detalle_pedidos.id_detalle_pedido;


--
-- Name: formas_farmaceuticas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.formas_farmaceuticas (
    id_forma_farmaceutica integer NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion character varying(255),
    activo boolean DEFAULT true,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: formas_farmaceuticas_id_forma_farmaceutica_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.formas_farmaceuticas_id_forma_farmaceutica_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: formas_farmaceuticas_id_forma_farmaceutica_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.formas_farmaceuticas_id_forma_farmaceutica_seq OWNED BY public.formas_farmaceuticas.id_forma_farmaceutica;


--
-- Name: ingresos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ingresos (
    id_ingreso integer NOT NULL,
    id_proveedor integer NOT NULL,
    serie_factura character varying(30) NOT NULL,
    numero_factura character varying(50) NOT NULL,
    fecha_factura date NOT NULL,
    fecha_recepcion date NOT NULL,
    id_usuario integer NOT NULL,
    monto_total numeric(12,2) DEFAULT 0,
    estado public.enum_ingresos_estado DEFAULT 'registrado'::public.enum_ingresos_estado,
    observaciones text,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: ingresos_id_ingreso_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ingresos_id_ingreso_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ingresos_id_ingreso_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ingresos_id_ingreso_seq OWNED BY public.ingresos.id_ingreso;


--
-- Name: instituciones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.instituciones (
    id_institucion integer NOT NULL,
    nombre character varying(150) NOT NULL,
    id_tipo_institucion integer NOT NULL,
    nit character varying(20),
    unidad_ejecutora character varying(150),
    departamento character varying(60),
    direccion character varying(200),
    telefono character varying(20),
    email character varying(100),
    contacto character varying(100),
    activo boolean DEFAULT true,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: instituciones_id_institucion_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.instituciones_id_institucion_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: instituciones_id_institucion_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.instituciones_id_institucion_seq OWNED BY public.instituciones.id_institucion;


--
-- Name: laboratorios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.laboratorios (
    id_laboratorio integer NOT NULL,
    nombre character varying(150) NOT NULL,
    pais character varying(80),
    activo boolean DEFAULT true,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: laboratorios_id_laboratorio_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.laboratorios_id_laboratorio_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: laboratorios_id_laboratorio_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.laboratorios_id_laboratorio_seq OWNED BY public.laboratorios.id_laboratorio;


--
-- Name: lotes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lotes (
    id_lote integer NOT NULL,
    id_ingreso integer NOT NULL,
    id_producto integer NOT NULL,
    id_laboratorio integer NOT NULL,
    numero_lote character varying(50) NOT NULL,
    fecha_fabricacion date NOT NULL,
    fecha_vencimiento date NOT NULL,
    cantidad_recibida numeric(12,2) NOT NULL,
    cantidad_disponible numeric(12,2) DEFAULT 0 NOT NULL,
    costo_unitario numeric(12,2) DEFAULT 0,
    id_ubicacion integer NOT NULL,
    condicion public.enum_lotes_condicion DEFAULT 'disponible'::public.enum_lotes_condicion,
    motivo_condicion text,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: lotes_id_lote_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.lotes_id_lote_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: lotes_id_lote_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.lotes_id_lote_seq OWNED BY public.lotes.id_lote;


--
-- Name: modalidades_compra; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.modalidades_compra (
    id_modalidad integer NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion character varying(255),
    activo boolean DEFAULT true,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: modalidades_compra_id_modalidad_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.modalidades_compra_id_modalidad_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: modalidades_compra_id_modalidad_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.modalidades_compra_id_modalidad_seq OWNED BY public.modalidades_compra.id_modalidad;


--
-- Name: motivos_movimiento; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.motivos_movimiento (
    id_motivo integer NOT NULL,
    codigo character varying(40),
    nombre character varying(100) NOT NULL,
    tipo public.enum_motivos_movimiento_tipo NOT NULL,
    sistema boolean DEFAULT false,
    activo boolean DEFAULT true,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: motivos_movimiento_id_motivo_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.motivos_movimiento_id_motivo_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: motivos_movimiento_id_motivo_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.motivos_movimiento_id_motivo_seq OWNED BY public.motivos_movimiento.id_motivo;


--
-- Name: movimientos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.movimientos (
    id_movimiento integer NOT NULL,
    id_lote integer NOT NULL,
    id_usuario integer,
    tipo_movimiento public.enum_movimientos_tipo_movimiento NOT NULL,
    id_motivo integer NOT NULL,
    cantidad numeric(12,2) NOT NULL,
    saldo numeric(12,2) NOT NULL,
    fecha_movimiento timestamp with time zone NOT NULL,
    id_ingreso integer,
    id_pedido integer,
    observacion text,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: movimientos_id_movimiento_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.movimientos_id_movimiento_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: movimientos_id_movimiento_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.movimientos_id_movimiento_seq OWNED BY public.movimientos.id_movimiento;


--
-- Name: parametros; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.parametros (
    clave character varying(60) NOT NULL,
    valor character varying(100) NOT NULL,
    descripcion character varying(255),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: pedidos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pedidos (
    id_pedido integer NOT NULL,
    id_contrato integer NOT NULL,
    id_usuario integer NOT NULL,
    numero_pedido character varying(50) NOT NULL,
    fecha_pedido date NOT NULL,
    fecha_programada date NOT NULL,
    fecha_real_entrega date,
    estado public.enum_pedidos_estado DEFAULT 'pendiente'::public.enum_pedidos_estado,
    monto_total numeric(12,2) DEFAULT 0,
    observaciones text,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: pedidos_id_pedido_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pedidos_id_pedido_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pedidos_id_pedido_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pedidos_id_pedido_seq OWNED BY public.pedidos.id_pedido;


--
-- Name: productos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.productos (
    id_producto integer NOT NULL,
    codigo character varying(50) NOT NULL,
    nombre character varying(150) NOT NULL,
    descripcion text,
    id_forma_farmaceutica integer NOT NULL,
    concentracion character varying(100),
    id_unidad_medida integer NOT NULL,
    stock_minimo integer DEFAULT 0,
    activo boolean DEFAULT true,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: productos_id_producto_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.productos_id_producto_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: productos_id_producto_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.productos_id_producto_seq OWNED BY public.productos.id_producto;


--
-- Name: proveedores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.proveedores (
    id_proveedor integer NOT NULL,
    nombre character varying(150) NOT NULL,
    nit character varying(20) NOT NULL,
    direccion character varying(200),
    telefono character varying(20),
    email character varying(100),
    contacto character varying(100),
    activo boolean DEFAULT true,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: proveedores_id_proveedor_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.proveedores_id_proveedor_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: proveedores_id_proveedor_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.proveedores_id_proveedor_seq OWNED BY public.proveedores.id_proveedor;


--
-- Name: seguimiento_pedidos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.seguimiento_pedidos (
    id_seguimiento integer NOT NULL,
    id_pedido integer NOT NULL,
    estado character varying(30) NOT NULL,
    id_usuario integer,
    observacion text,
    fecha timestamp with time zone NOT NULL
);


--
-- Name: seguimiento_pedidos_id_seguimiento_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.seguimiento_pedidos_id_seguimiento_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: seguimiento_pedidos_id_seguimiento_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.seguimiento_pedidos_id_seguimiento_seq OWNED BY public.seguimiento_pedidos.id_seguimiento;


--
-- Name: tipos_institucion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tipos_institucion (
    id_tipo_institucion integer NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion character varying(255),
    activo boolean DEFAULT true,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: tipos_institucion_id_tipo_institucion_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tipos_institucion_id_tipo_institucion_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tipos_institucion_id_tipo_institucion_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tipos_institucion_id_tipo_institucion_seq OWNED BY public.tipos_institucion.id_tipo_institucion;


--
-- Name: ubicaciones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ubicaciones (
    id_ubicacion integer NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion character varying(255),
    activo boolean DEFAULT true,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: ubicaciones_id_ubicacion_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ubicaciones_id_ubicacion_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ubicaciones_id_ubicacion_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ubicaciones_id_ubicacion_seq OWNED BY public.ubicaciones.id_ubicacion;


--
-- Name: unidades_medida; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.unidades_medida (
    id_unidad_medida integer NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion character varying(255),
    activo boolean DEFAULT true,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: unidades_medida_id_unidad_medida_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.unidades_medida_id_unidad_medida_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: unidades_medida_id_unidad_medida_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.unidades_medida_id_unidad_medida_seq OWNED BY public.unidades_medida.id_unidad_medida;


--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usuarios (
    id_usuario integer NOT NULL,
    nombre character varying(100) NOT NULL,
    apellido character varying(100) NOT NULL,
    email character varying(100) NOT NULL,
    password character varying(255) NOT NULL,
    rol public.enum_usuarios_rol NOT NULL,
    activo boolean DEFAULT true,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: usuarios_id_usuario_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.usuarios_id_usuario_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: usuarios_id_usuario_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.usuarios_id_usuario_seq OWNED BY public.usuarios.id_usuario;


--
-- Name: adjuntos id_adjunto; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.adjuntos ALTER COLUMN id_adjunto SET DEFAULT nextval('public.adjuntos_id_adjunto_seq'::regclass);


--
-- Name: asignaciones_lote id_asignacion; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asignaciones_lote ALTER COLUMN id_asignacion SET DEFAULT nextval('public.asignaciones_lote_id_asignacion_seq'::regclass);


--
-- Name: auditoria id_auditoria; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auditoria ALTER COLUMN id_auditoria SET DEFAULT nextval('public.auditoria_id_auditoria_seq'::regclass);


--
-- Name: contratos id_contrato; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contratos ALTER COLUMN id_contrato SET DEFAULT nextval('public.contratos_id_contrato_seq'::regclass);


--
-- Name: detalle_contratos id_detalle_contrato; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detalle_contratos ALTER COLUMN id_detalle_contrato SET DEFAULT nextval('public.detalle_contratos_id_detalle_contrato_seq'::regclass);


--
-- Name: detalle_pedidos id_detalle_pedido; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detalle_pedidos ALTER COLUMN id_detalle_pedido SET DEFAULT nextval('public.detalle_pedidos_id_detalle_pedido_seq'::regclass);


--
-- Name: formas_farmaceuticas id_forma_farmaceutica; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.formas_farmaceuticas ALTER COLUMN id_forma_farmaceutica SET DEFAULT nextval('public.formas_farmaceuticas_id_forma_farmaceutica_seq'::regclass);


--
-- Name: ingresos id_ingreso; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ingresos ALTER COLUMN id_ingreso SET DEFAULT nextval('public.ingresos_id_ingreso_seq'::regclass);


--
-- Name: instituciones id_institucion; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instituciones ALTER COLUMN id_institucion SET DEFAULT nextval('public.instituciones_id_institucion_seq'::regclass);


--
-- Name: laboratorios id_laboratorio; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.laboratorios ALTER COLUMN id_laboratorio SET DEFAULT nextval('public.laboratorios_id_laboratorio_seq'::regclass);


--
-- Name: lotes id_lote; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lotes ALTER COLUMN id_lote SET DEFAULT nextval('public.lotes_id_lote_seq'::regclass);


--
-- Name: modalidades_compra id_modalidad; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modalidades_compra ALTER COLUMN id_modalidad SET DEFAULT nextval('public.modalidades_compra_id_modalidad_seq'::regclass);


--
-- Name: motivos_movimiento id_motivo; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.motivos_movimiento ALTER COLUMN id_motivo SET DEFAULT nextval('public.motivos_movimiento_id_motivo_seq'::regclass);


--
-- Name: movimientos id_movimiento; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimientos ALTER COLUMN id_movimiento SET DEFAULT nextval('public.movimientos_id_movimiento_seq'::regclass);


--
-- Name: pedidos id_pedido; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pedidos ALTER COLUMN id_pedido SET DEFAULT nextval('public.pedidos_id_pedido_seq'::regclass);


--
-- Name: productos id_producto; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.productos ALTER COLUMN id_producto SET DEFAULT nextval('public.productos_id_producto_seq'::regclass);


--
-- Name: proveedores id_proveedor; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proveedores ALTER COLUMN id_proveedor SET DEFAULT nextval('public.proveedores_id_proveedor_seq'::regclass);


--
-- Name: seguimiento_pedidos id_seguimiento; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seguimiento_pedidos ALTER COLUMN id_seguimiento SET DEFAULT nextval('public.seguimiento_pedidos_id_seguimiento_seq'::regclass);


--
-- Name: tipos_institucion id_tipo_institucion; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipos_institucion ALTER COLUMN id_tipo_institucion SET DEFAULT nextval('public.tipos_institucion_id_tipo_institucion_seq'::regclass);


--
-- Name: ubicaciones id_ubicacion; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ubicaciones ALTER COLUMN id_ubicacion SET DEFAULT nextval('public.ubicaciones_id_ubicacion_seq'::regclass);


--
-- Name: unidades_medida id_unidad_medida; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unidades_medida ALTER COLUMN id_unidad_medida SET DEFAULT nextval('public.unidades_medida_id_unidad_medida_seq'::regclass);


--
-- Name: usuarios id_usuario; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios ALTER COLUMN id_usuario SET DEFAULT nextval('public.usuarios_id_usuario_seq'::regclass);


--
-- Data for Name: adjuntos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.adjuntos (id_adjunto, entidad, id_registro, nombre_archivo, tipo_mime, tamano, datos, descripcion, id_usuario, activo, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: asignaciones_lote; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.asignaciones_lote (id_asignacion, id_detalle_pedido, id_lote, cantidad, "createdAt", "updatedAt") FROM stdin;
1	2	10	1500.00	2026-10-14 19:28:52.474-06	2026-10-14 19:28:52.474-06
2	3	7	1000.00	2026-10-14 19:28:52.481-06	2026-10-14 19:28:52.481-06
3	4	9	300.00	2026-10-14 19:28:52.487-06	2026-10-14 19:28:52.487-06
4	5	12	3000.00	2026-10-14 19:28:52.514-06	2026-10-14 19:28:52.514-06
5	6	8	400.00	2026-10-14 19:28:52.52-06	2026-10-14 19:28:52.52-06
6	7	11	500.00	2026-10-14 19:28:52.54-06	2026-10-14 19:28:52.54-06
7	8	12	4000.00	2026-10-14 19:28:52.545-06	2026-10-14 19:28:52.545-06
8	9	8	500.00	2026-10-14 19:28:52.548-06	2026-10-14 19:28:52.548-06
9	10	11	400.00	2026-10-14 19:28:52.569-06	2026-10-14 19:28:52.569-06
10	11	8	300.00	2026-10-14 19:28:52.575-06	2026-10-14 19:28:52.575-06
11	12	10	1000.00	2026-10-14 19:28:52.599-06	2026-10-14 19:28:52.599-06
12	13	15	800.00	2026-10-14 19:28:52.602-06	2026-10-14 19:28:52.602-06
13	14	12	3000.00	2026-10-14 19:28:52.612-06	2026-10-14 19:28:52.612-06
14	15	8	400.00	2026-10-14 19:28:52.617-06	2026-10-14 19:28:52.617-06
15	16	11	400.00	2026-10-14 19:28:52.627-06	2026-10-14 19:28:52.627-06
16	17	14	1000.00	2026-10-14 19:28:52.632-06	2026-10-14 19:28:52.632-06
17	18	8	600.00	2026-10-14 19:28:52.638-06	2026-10-14 19:28:52.638-06
18	19	11	300.00	2026-10-14 19:28:52.694-06	2026-10-14 19:28:52.694-06
19	20	14	500.00	2026-10-14 19:28:52.698-06	2026-10-14 19:28:52.698-06
20	21	11	300.00	2026-10-14 19:28:52.705-06	2026-10-14 19:28:52.705-06
21	22	16	200.00	2026-10-14 19:28:52.709-06	2026-10-14 19:28:52.709-06
22	25	13	200.00	2026-10-14 20:06:08.842-06	2026-10-14 20:06:08.842-06
\.


--
-- Data for Name: auditoria; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.auditoria (id_auditoria, tabla, id_registro, accion, datos_antes, datos_despues, id_usuario, motivo, ip, fecha) FROM stdin;
1	laboratorios	1	crear	\N	{"pais": "Alemania", "activo": true, "nombre": "Bayer", "createdAt": "2026-10-13T05:19:52.632Z", "updatedAt": "2026-10-13T05:19:52.632Z", "id_laboratorio": 1}	1	\N	::1	2026-10-12 23:19:52.654-06
2	laboratorios	2	crear	\N	{"pais": "Colombia", "activo": true, "nombre": "MK (Tecnoquímicas)", "createdAt": "2026-10-13T05:19:52.685Z", "updatedAt": "2026-10-13T05:19:52.685Z", "id_laboratorio": 2}	1	\N	::1	2026-10-12 23:19:52.69-06
3	laboratorios	3	crear	\N	{"pais": "México", "activo": true, "nombre": "Laboratorios PiSA", "createdAt": "2026-10-13T05:19:52.701Z", "updatedAt": "2026-10-13T05:19:52.701Z", "id_laboratorio": 3}	1	\N	::1	2026-10-12 23:19:52.708-06
4	proveedores	1	crear	\N	{"nit": "1234567-8", "email": null, "activo": true, "nombre": "Distribuidora Farmacéutica Centroamericana, S.A.", "contacto": null, "telefono": "2222-0000", "createdAt": "2026-10-13T05:19:52.728Z", "direccion": null, "updatedAt": "2026-10-13T05:19:52.728Z", "id_proveedor": 1}	1	\N	::1	2026-10-12 23:19:52.733-06
5	proveedores	2	crear	\N	{"nit": "7654321-0", "email": null, "activo": true, "nombre": "Droguería Nacional, S.A.", "contacto": null, "telefono": "2222-0000", "createdAt": "2026-10-13T05:19:52.744Z", "direccion": null, "updatedAt": "2026-10-13T05:19:52.744Z", "id_proveedor": 2}	1	\N	::1	2026-10-12 23:19:52.749-06
6	productos	1	crear	\N	{"activo": true, "codigo": "MED-001", "nombre": "Lidocaína", "createdAt": "2026-10-13T05:19:52.768Z", "updatedAt": "2026-10-13T05:19:52.768Z", "descripcion": null, "id_producto": 1, "stock_minimo": 200, "concentracion": "2%", "id_unidad_medida": 5, "id_forma_farmaceutica": 3}	1	\N	::1	2026-10-12 23:19:52.776-06
7	productos	2	crear	\N	{"activo": true, "codigo": "MED-002", "nombre": "Amoxicilina", "createdAt": "2026-10-13T05:19:52.789Z", "updatedAt": "2026-10-13T05:19:52.789Z", "descripcion": null, "id_producto": 2, "stock_minimo": 1000, "concentracion": "500 mg", "id_unidad_medida": 3, "id_forma_farmaceutica": 2}	1	\N	::1	2026-10-12 23:19:52.791-06
8	productos	3	crear	\N	{"activo": true, "codigo": "MED-003", "nombre": "Acetaminofén", "createdAt": "2026-10-13T05:19:52.815Z", "updatedAt": "2026-10-13T05:19:52.815Z", "descripcion": null, "id_producto": 3, "stock_minimo": 2000, "concentracion": "500 mg", "id_unidad_medida": 2, "id_forma_farmaceutica": 1}	1	\N	::1	2026-10-12 23:19:52.82-06
9	productos	4	crear	\N	{"activo": true, "codigo": "MQ-001", "nombre": "Gasa estéril", "createdAt": "2026-10-13T05:19:52.837Z", "updatedAt": "2026-10-13T05:19:52.837Z", "descripcion": null, "id_producto": 4, "stock_minimo": 500, "concentracion": "10 x 10 cm", "id_unidad_medida": 1, "id_forma_farmaceutica": 14}	1	\N	::1	2026-10-12 23:19:52.84-06
10	lotes	1	crear	\N	{"id_lote": 1, "condicion": "disponible", "createdAt": "2026-10-13T05:19:52.879Z", "updatedAt": "2026-10-13T05:19:52.890Z", "id_ingreso": 1, "id_producto": 1, "numero_lote": "BY24-001", "id_ubicacion": 1, "costo_unitario": "8.50", "id_laboratorio": 1, "motivo_condicion": null, "cantidad_recibida": "200.00", "fecha_fabricacion": "2026-07-12", "fecha_vencimiento": "2027-12-12", "cantidad_disponible": 200}	1	\N	::1	2026-10-12 23:19:52.897-06
11	lotes	2	crear	\N	{"id_lote": 2, "condicion": "disponible", "createdAt": "2026-10-13T05:19:52.899Z", "updatedAt": "2026-10-13T05:19:52.901Z", "id_ingreso": 1, "id_producto": 2, "numero_lote": "PS-7781", "id_ubicacion": 1, "costo_unitario": "0.35", "id_laboratorio": 3, "motivo_condicion": null, "cantidad_recibida": "5000.00", "fecha_fabricacion": "2026-07-12", "fecha_vencimiento": "2028-10-12", "cantidad_disponible": 5000}	1	\N	::1	2026-10-12 23:19:52.904-06
12	ingresos	1	crear	\N	{"estado": "registrado", "createdAt": "2026-10-13T05:19:52.872Z", "updatedAt": "2026-10-13T05:19:52.872Z", "id_ingreso": 1, "id_usuario": 1, "monto_total": "3450.00", "id_proveedor": 1, "fecha_factura": "2026-09-22", "observaciones": null, "serie_factura": "A", "numero_factura": "1001", "fecha_recepcion": "2026-09-23"}	1	\N	::1	2026-10-12 23:19:52.906-06
13	lotes	3	crear	\N	{"id_lote": 3, "condicion": "disponible", "createdAt": "2026-10-13T05:19:52.924Z", "updatedAt": "2026-10-13T05:19:52.926Z", "id_ingreso": 2, "id_producto": 1, "numero_lote": "MK-L2290", "id_ubicacion": 1, "costo_unitario": "7.90", "id_laboratorio": 2, "motivo_condicion": null, "cantidad_recibida": "300.00", "fecha_fabricacion": "2026-07-12", "fecha_vencimiento": "2029-04-12", "cantidad_disponible": 300}	1	\N	::1	2026-10-12 23:19:52.93-06
14	lotes	4	crear	\N	{"id_lote": 4, "condicion": "disponible", "createdAt": "2026-10-13T05:19:52.932Z", "updatedAt": "2026-10-13T05:19:52.934Z", "id_ingreso": 2, "id_producto": 3, "numero_lote": "PS-1203", "id_ubicacion": 1, "costo_unitario": "0.12", "id_laboratorio": 3, "motivo_condicion": null, "cantidad_recibida": "10000.00", "fecha_fabricacion": "2026-07-12", "fecha_vencimiento": "2029-10-12", "cantidad_disponible": 10000}	1	\N	::1	2026-10-12 23:19:52.938-06
15	ingresos	2	crear	\N	{"estado": "registrado", "createdAt": "2026-10-13T05:19:52.922Z", "updatedAt": "2026-10-13T05:19:52.922Z", "id_ingreso": 2, "id_usuario": 1, "monto_total": "3570.00", "id_proveedor": 2, "fecha_factura": "2026-10-02", "observaciones": null, "serie_factura": "FAC", "numero_factura": "55890", "fecha_recepcion": "2026-10-02"}	1	\N	::1	2026-10-12 23:19:52.94-06
16	lotes	5	crear	\N	{"id_lote": 5, "condicion": "disponible", "createdAt": "2026-10-13T05:19:52.975Z", "updatedAt": "2026-10-13T05:19:52.979Z", "id_ingreso": 3, "id_producto": 1, "numero_lote": "BY24-118", "id_ubicacion": 1, "costo_unitario": "8.50", "id_laboratorio": 1, "motivo_condicion": null, "cantidad_recibida": "150.00", "fecha_fabricacion": "2026-07-12", "fecha_vencimiento": "2028-06-12", "cantidad_disponible": 150}	1	\N	::1	2026-10-12 23:19:52.984-06
17	lotes	6	crear	\N	{"id_lote": 6, "condicion": "disponible", "createdAt": "2026-10-13T05:19:52.986Z", "updatedAt": "2026-10-13T05:19:52.989Z", "id_ingreso": 3, "id_producto": 4, "numero_lote": "MK-G100", "id_ubicacion": 1, "costo_unitario": "0.90", "id_laboratorio": 2, "motivo_condicion": null, "cantidad_recibida": "3000.00", "fecha_fabricacion": "2026-07-12", "fecha_vencimiento": "2030-10-12", "cantidad_disponible": 3000}	1	\N	::1	2026-10-12 23:19:52.993-06
18	ingresos	3	crear	\N	{"estado": "registrado", "createdAt": "2026-10-13T05:19:52.973Z", "updatedAt": "2026-10-13T05:19:52.973Z", "id_ingreso": 3, "id_usuario": 1, "monto_total": "3975.00", "id_proveedor": 1, "fecha_factura": "2026-10-10", "observaciones": null, "serie_factura": "A", "numero_factura": "1042", "fecha_recepcion": "2026-10-11"}	1	\N	::1	2026-10-12 23:19:52.995-06
19	instituciones	1	crear	\N	{"nit": "3456789-1", "email": null, "activo": true, "nombre": "Hospital Nacional de Chiquimula", "contacto": null, "telefono": null, "createdAt": "2026-10-13T05:19:53.002Z", "direccion": null, "updatedAt": "2026-10-13T05:19:53.002Z", "departamento": "Chiquimula", "id_institucion": 1, "unidad_ejecutora": null, "id_tipo_institucion": 1}	1	\N	::1	2026-10-12 23:19:53.013-06
20	instituciones	2	crear	\N	{"nit": "2345678-9", "email": null, "activo": true, "nombre": "Hospital Roosevelt", "contacto": null, "telefono": null, "createdAt": "2026-10-13T05:19:53.028Z", "direccion": null, "updatedAt": "2026-10-13T05:19:53.028Z", "departamento": "Guatemala", "id_institucion": 2, "unidad_ejecutora": null, "id_tipo_institucion": 1}	1	\N	::1	2026-10-12 23:19:53.03-06
21	contratos	1	crear	\N	{"nog": "21458796", "estado": "vigente", "createdAt": "2026-10-13T05:19:53.049Z", "fecha_fin": "2027-04-12", "updatedAt": "2026-10-13T05:19:53.049Z", "id_usuario": 1, "id_contrato": 1, "monto_total": "10700.00", "fecha_inicio": "2026-09-12", "id_modalidad": 3, "observaciones": null, "id_institucion": 1, "numero_contrato": "HNCH-012-2026", "DetalleContratos": [{"activo": true, "Producto": {"codigo": "MED-001", "nombre": "Lidocaína", "id_producto": 1, "UnidadMedida": {"nombre": "Vial"}, "concentracion": "2%"}, "subtotal": "7500.00", "createdAt": "2026-10-13T05:19:53.055Z", "updatedAt": "2026-10-13T05:19:53.055Z", "id_contrato": 1, "id_producto": 1, "numero_renglon": 1, "precio_unitario": "12.50", "cantidad_contratada": "600.00", "id_detalle_contrato": 1}, {"activo": true, "Producto": {"codigo": "MED-002", "nombre": "Amoxicilina", "id_producto": 2, "UnidadMedida": {"nombre": "Cápsula"}, "concentracion": "500 mg"}, "subtotal": "1800.00", "createdAt": "2026-10-13T05:19:53.059Z", "updatedAt": "2026-10-13T05:19:53.059Z", "id_contrato": 1, "id_producto": 2, "numero_renglon": 2, "precio_unitario": "0.60", "cantidad_contratada": "3000.00", "id_detalle_contrato": 2}, {"activo": true, "Producto": {"codigo": "MQ-001", "nombre": "Gasa estéril", "id_producto": 4, "UnidadMedida": {"nombre": "Unidad"}, "concentracion": "10 x 10 cm"}, "subtotal": "1400.00", "createdAt": "2026-10-13T05:19:53.067Z", "updatedAt": "2026-10-13T05:19:53.067Z", "id_contrato": 1, "id_producto": 4, "numero_renglon": 3, "precio_unitario": "1.40", "cantidad_contratada": "1000.00", "id_detalle_contrato": 3}], "vigencia_minima_meses": 12}	1	\N	::1	2026-10-12 23:19:53.098-06
22	contratos	2	crear	\N	{"nog": "21503344", "estado": "vigente", "createdAt": "2026-10-13T05:19:53.128Z", "fecha_fin": "2026-11-01", "updatedAt": "2026-10-13T05:19:53.128Z", "id_usuario": 1, "id_contrato": 2, "monto_total": "2000.00", "fecha_inicio": "2026-08-13", "id_modalidad": 5, "observaciones": null, "id_institucion": 2, "numero_contrato": "HR-088-2026", "DetalleContratos": [{"activo": true, "Producto": {"codigo": "MED-003", "nombre": "Acetaminofén", "id_producto": 3, "UnidadMedida": {"nombre": "Tableta"}, "concentracion": "500 mg"}, "subtotal": "2000.00", "createdAt": "2026-10-13T05:19:53.130Z", "updatedAt": "2026-10-13T05:19:53.130Z", "id_contrato": 2, "id_producto": 3, "numero_renglon": 1, "precio_unitario": "0.25", "cantidad_contratada": "8000.00", "id_detalle_contrato": 4}], "vigencia_minima_meses": 12}	1	\N	::1	2026-10-12 23:19:53.138-06
23	pedidos	1	crear	\N	{"estado": "pendiente", "Usuario": {"nombre": "Gerardo", "apellido": "García"}, "Contrato": {"nog": "21458796", "estado": "vigente", "fecha_fin": "2027-04-12", "Institucion": {"nombre": "Hospital Nacional de Chiquimula", "departamento": "Chiquimula", "id_institucion": 1}, "id_contrato": 1, "numero_contrato": "HNCH-012-2026", "vigencia_minima_meses": 12}, "createdAt": "2026-10-13T05:19:53.175Z", "id_pedido": 1, "updatedAt": "2026-10-13T05:19:53.175Z", "id_usuario": 1, "id_contrato": 1, "monto_total": "3750.00", "fecha_pedido": "2026-10-12", "numero_pedido": "PED-2026-00001", "observaciones": null, "DetallePedidos": [{"Producto": {"codigo": "MED-001", "nombre": "Lidocaína", "id_producto": 1, "UnidadMedida": {"nombre": "Vial"}, "concentracion": "2%"}, "cantidad": "300.00", "subtotal": "3750.00", "createdAt": "2026-10-13T05:19:53.178Z", "id_pedido": 1, "updatedAt": "2026-10-13T05:19:53.178Z", "id_producto": 1, "AsignacionLotes": [], "DetalleContrato": {"numero_renglon": 1}, "precio_unitario": "12.50", "id_detalle_pedido": 1, "id_detalle_contrato": 1}], "fecha_programada": "2026-10-17", "SeguimientoPedidos": [{"fecha": "2026-10-13T05:19:53.180Z", "estado": "pendiente", "Usuario": {"nombre": "Gerardo", "apellido": "García"}, "id_pedido": 1, "id_usuario": 1, "observacion": "Pedido registrado", "id_seguimiento": 1}], "fecha_real_entrega": null}	1	\N	::1	2026-10-12 23:19:53.194-06
24	lotes	7	crear	\N	{"id_lote": 7, "condicion": "disponible", "createdAt": "2026-10-15T01:28:52.390Z", "updatedAt": "2026-10-15T01:28:52.398Z", "id_ingreso": 4, "id_producto": 9, "numero_lote": "BN-M330", "id_ubicacion": 1, "costo_unitario": "0.30", "id_laboratorio": 5, "motivo_condicion": null, "cantidad_recibida": "3000.00", "fecha_fabricacion": "2025-06-01", "fecha_vencimiento": "2026-09-24", "cantidad_disponible": 3000}	2	\N	\N	2025-08-20 08:30:00-06
25	lotes	8	crear	\N	{"id_lote": 8, "condicion": "disponible", "createdAt": "2026-10-15T01:28:52.419Z", "updatedAt": "2026-10-15T01:28:52.420Z", "id_ingreso": 4, "id_producto": 8, "numero_lote": "PS-S7712", "id_ubicacion": 1, "costo_unitario": "6.00", "id_laboratorio": 3, "motivo_condicion": null, "cantidad_recibida": "2500.00", "fecha_fabricacion": "2025-07-21", "fecha_vencimiento": "2027-05-02", "cantidad_disponible": 2500}	2	\N	\N	2025-08-20 08:30:00-06
26	ingresos	4	crear	\N	{"estado": "registrado", "createdAt": "2026-10-15T01:28:52.385Z", "updatedAt": "2026-10-15T01:28:52.385Z", "id_ingreso": 4, "id_usuario": 2, "monto_total": "15900.00", "id_proveedor": 4, "fecha_factura": "2025-08-19", "observaciones": null, "serie_factura": "FV", "numero_factura": "1120", "fecha_recepcion": "2025-08-20"}	2	\N	\N	2025-08-20 08:31:00-06
27	contratos	3	crear	\N	{"nog": "21554870", "estado": "completado", "createdAt": "2026-10-15T01:28:52.428Z", "fecha_fin": "2026-09-14", "updatedAt": "2026-10-15T01:28:52.428Z", "id_usuario": 3, "id_contrato": 3, "monto_total": "14900.00", "fecha_inicio": "2025-09-09", "id_modalidad": 5, "observaciones": null, "id_institucion": 4, "numero_contrato": "IGSS-CA-118-2025", "vigencia_minima_meses": 6}	3	\N	\N	2025-09-09 09:00:00-06
28	contratos	4	crear	\N	{"nog": "20981123", "estado": "vencido", "createdAt": "2026-10-15T01:28:52.436Z", "fecha_fin": "2026-09-29", "updatedAt": "2026-10-15T01:28:52.436Z", "id_usuario": 3, "id_contrato": 4, "monto_total": "5640.00", "fecha_inicio": "2025-11-18", "id_modalidad": 1, "observaciones": null, "id_institucion": 5, "numero_contrato": "DASJ-BC-044-2025", "vigencia_minima_meses": 6}	3	\N	\N	2025-11-18 09:00:00-06
29	lotes	9	crear	\N	{"id_lote": 9, "condicion": "disponible", "createdAt": "2026-10-15T01:28:52.444Z", "updatedAt": "2026-10-15T01:28:52.445Z", "id_ingreso": 5, "id_producto": 7, "numero_lote": "LP-D0457", "id_ubicacion": 1, "costo_unitario": "1.80", "id_laboratorio": 6, "motivo_condicion": null, "cantidad_recibida": "2000.00", "fecha_fabricacion": "2025-02-21", "fecha_vencimiento": "2026-12-28", "cantidad_disponible": 2000}	2	\N	\N	2025-11-28 08:30:00-06
30	lotes	10	crear	\N	{"id_lote": 10, "condicion": "disponible", "createdAt": "2026-10-15T01:28:52.452Z", "updatedAt": "2026-10-15T01:28:52.453Z", "id_ingreso": 5, "id_producto": 10, "numero_lote": "LP-I2210", "id_ubicacion": 1, "costo_unitario": "0.25", "id_laboratorio": 6, "motivo_condicion": null, "cantidad_recibida": "4000.00", "fecha_fabricacion": "2025-08-20", "fecha_vencimiento": "2027-03-13", "cantidad_disponible": 4000}	2	\N	\N	2025-11-28 08:30:00-06
31	ingresos	5	crear	\N	{"estado": "registrado", "createdAt": "2026-10-15T01:28:52.442Z", "updatedAt": "2026-10-15T01:28:52.442Z", "id_ingreso": 5, "id_usuario": 2, "monto_total": "4600.00", "id_proveedor": 1, "fecha_factura": "2025-11-27", "observaciones": null, "serie_factura": "A", "numero_factura": "0890", "fecha_recepcion": "2025-11-28"}	2	\N	\N	2025-11-28 08:31:00-06
32	pedidos	2	crear	\N	{"estado": "entregado", "createdAt": "2026-10-15T01:28:52.465Z", "id_pedido": 2, "updatedAt": "2026-10-15T01:28:52.465Z", "id_usuario": 3, "id_contrato": 4, "monto_total": "2820.00", "fecha_pedido": "2025-12-18", "numero_pedido": "PED-2025-00002", "observaciones": "Primera entrega del contrato", "fecha_programada": "2025-12-28", "fecha_real_entrega": "2026-01-03"}	3	\N	\N	2025-12-18 09:15:00-06
33	lotes	11	crear	\N	{"id_lote": 11, "condicion": "disponible", "createdAt": "2026-10-15T01:28:52.498Z", "updatedAt": "2026-10-15T01:28:52.499Z", "id_ingreso": 6, "id_producto": 5, "numero_lote": "SN-C2231", "id_ubicacion": 1, "costo_unitario": "14.50", "id_laboratorio": 4, "motivo_condicion": null, "cantidad_recibida": "2000.00", "fecha_fabricacion": "2025-12-18", "fecha_vencimiento": "2028-02-26", "cantidad_disponible": 2000}	2	\N	\N	2026-02-16 08:30:00-06
34	lotes	12	crear	\N	{"id_lote": 12, "condicion": "disponible", "createdAt": "2026-10-15T01:28:52.503Z", "updatedAt": "2026-10-15T01:28:52.504Z", "id_ingreso": 6, "id_producto": 6, "numero_lote": "BN-O118", "id_ubicacion": 1, "costo_unitario": "0.45", "id_laboratorio": 5, "motivo_condicion": null, "cantidad_recibida": "20000.00", "fecha_fabricacion": "2026-01-27", "fecha_vencimiento": "2027-12-08", "cantidad_disponible": 20000}	2	\N	\N	2026-02-16 08:30:00-06
35	ingresos	6	crear	\N	{"estado": "registrado", "createdAt": "2026-10-15T01:28:52.497Z", "updatedAt": "2026-10-15T01:28:52.497Z", "id_ingreso": 6, "id_usuario": 2, "monto_total": "38000.00", "id_proveedor": 3, "fecha_factura": "2026-02-15", "observaciones": null, "serie_factura": "B", "numero_factura": "3301", "fecha_recepcion": "2026-02-16"}	2	\N	\N	2026-02-16 08:31:00-06
36	pedidos	3	crear	\N	{"estado": "entregado", "createdAt": "2026-10-15T01:28:52.510Z", "id_pedido": 3, "updatedAt": "2026-10-15T01:28:52.510Z", "id_usuario": 3, "id_contrato": 3, "monto_total": "7450.00", "fecha_pedido": "2026-02-26", "numero_pedido": "PED-2026-00003", "observaciones": null, "fecha_programada": "2026-03-08", "fecha_real_entrega": "2026-03-07"}	3	\N	\N	2026-02-26 09:15:00-06
37	contratos	5	crear	\N	{"nog": "22109876", "estado": "vigente", "createdAt": "2026-10-15T01:28:52.530Z", "fecha_fin": "2027-01-02", "updatedAt": "2026-10-15T01:28:52.530Z", "id_usuario": 3, "id_contrato": 5, "monto_total": "107250.00", "fecha_inicio": "2026-03-28", "id_modalidad": 4, "observaciones": null, "id_institucion": 2, "numero_contrato": "HR-LP-007-2026", "vigencia_minima_meses": 6}	3	\N	\N	2026-03-28 09:00:00-06
38	pedidos	4	crear	\N	{"estado": "entregado", "createdAt": "2026-10-15T01:28:52.536Z", "id_pedido": 4, "updatedAt": "2026-10-15T01:28:52.536Z", "id_usuario": 3, "id_contrato": 5, "monto_total": "22100.00", "fecha_pedido": "2026-04-07", "numero_pedido": "PED-2026-00004", "observaciones": null, "fecha_programada": "2026-04-17", "fecha_real_entrega": "2026-04-17"}	3	\N	\N	2026-04-07 09:15:00-06
39	contratos	6	crear	\N	{"nog": "22340551", "estado": "vigente", "createdAt": "2026-10-15T01:28:52.558Z", "fecha_fin": "2026-10-26", "updatedAt": "2026-10-15T01:28:52.558Z", "id_usuario": 3, "id_contrato": 6, "monto_total": "33740.00", "fecha_inicio": "2026-05-17", "id_modalidad": 3, "observaciones": null, "id_institucion": 3, "numero_contrato": "HRZ-COT-031-2026", "vigencia_minima_meses": null}	3	\N	\N	2026-05-17 09:00:00-06
40	pedidos	5	crear	\N	{"estado": "entregado", "createdAt": "2026-10-15T01:28:52.566Z", "id_pedido": 5, "updatedAt": "2026-10-15T01:28:52.566Z", "id_usuario": 3, "id_contrato": 6, "monto_total": "13740.00", "fecha_pedido": "2026-05-27", "numero_pedido": "PED-2026-00005", "observaciones": null, "fecha_programada": "2026-06-06", "fecha_real_entrega": "2026-06-06"}	3	\N	\N	2026-05-27 09:15:00-06
41	lotes	13	crear	\N	{"id_lote": 13, "condicion": "disponible", "createdAt": "2026-10-15T01:28:52.584Z", "updatedAt": "2026-10-15T01:28:52.585Z", "id_ingreso": 7, "id_producto": 5, "numero_lote": "SN-C2410", "id_ubicacion": 2, "costo_unitario": "14.20", "id_laboratorio": 4, "motivo_condicion": null, "cantidad_recibida": "1200.00", "fecha_fabricacion": "2026-05-17", "fecha_vencimiento": "2029-06-25", "cantidad_disponible": 1200}	2	\N	\N	2026-06-16 08:30:00-06
42	lotes	14	crear	\N	{"id_lote": 14, "condicion": "disponible", "createdAt": "2026-10-15T01:28:52.588Z", "updatedAt": "2026-10-15T01:28:52.589Z", "id_ingreso": 7, "id_producto": 7, "numero_lote": "LP-D0612", "id_ubicacion": 1, "costo_unitario": "1.75", "id_laboratorio": 6, "motivo_condicion": null, "cantidad_recibida": "2500.00", "fecha_fabricacion": "2026-06-06", "fecha_vencimiento": "2028-06-05", "cantidad_disponible": 2500}	2	\N	\N	2026-06-16 08:30:00-06
43	lotes	15	crear	\N	{"id_lote": 15, "condicion": "disponible", "createdAt": "2026-10-15T01:28:52.592Z", "updatedAt": "2026-10-15T01:28:52.593Z", "id_ingreso": 7, "id_producto": 9, "numero_lote": "BN-M412", "id_ubicacion": 1, "costo_unitario": "0.30", "id_laboratorio": 5, "motivo_condicion": null, "cantidad_recibida": "1500.00", "fecha_fabricacion": "2026-05-27", "fecha_vencimiento": "2028-04-26", "cantidad_disponible": 1500}	2	\N	\N	2026-06-16 08:30:00-06
44	ingresos	7	crear	\N	{"estado": "registrado", "createdAt": "2026-10-15T01:28:52.583Z", "updatedAt": "2026-10-15T01:28:52.583Z", "id_ingreso": 7, "id_usuario": 2, "monto_total": "21865.00", "id_proveedor": 1, "fecha_factura": "2026-06-15", "observaciones": null, "serie_factura": "A", "numero_factura": "0951", "fecha_recepcion": "2026-06-16"}	2	\N	\N	2026-06-16 08:31:00-06
45	pedidos	6	crear	\N	{"estado": "entregado", "createdAt": "2026-10-15T01:28:52.597Z", "id_pedido": 6, "updatedAt": "2026-10-15T01:28:52.597Z", "id_usuario": 3, "id_contrato": 4, "monto_total": "1200.00", "fecha_pedido": "2026-06-26", "numero_pedido": "PED-2026-00006", "observaciones": null, "fecha_programada": "2026-07-06", "fecha_real_entrega": "2026-07-08"}	3	\N	\N	2026-06-26 09:15:00-06
46	lotes	13	editar	{"id_lote": 13, "condicion": "disponible", "createdAt": "2026-10-15T01:28:52.584Z", "updatedAt": "2026-10-15T01:28:52.585Z", "id_ingreso": 7, "id_producto": 5, "numero_lote": "SN-C2410", "id_ubicacion": 2, "costo_unitario": "14.20", "id_laboratorio": 4, "motivo_condicion": null, "cantidad_recibida": "1200.00", "fecha_fabricacion": "2026-05-17", "fecha_vencimiento": "2029-06-25", "cantidad_disponible": 1200}	{"id_lote": 13, "condicion": "disponible", "createdAt": "2026-10-15T01:28:52.584Z", "updatedAt": "2026-10-15T01:28:52.608Z", "id_ingreso": 7, "id_producto": 5, "numero_lote": "SN-C2410", "id_ubicacion": 2, "costo_unitario": "14.20", "id_laboratorio": 4, "motivo_condicion": null, "cantidad_recibida": "1200.00", "fecha_fabricacion": "2026-05-17", "fecha_vencimiento": "2028-06-25", "cantidad_disponible": 1200}	1	Error de digitación: el empaque indica un vencimiento un año antes del registrado.	\N	2026-07-01 11:20:00-06
47	pedidos	7	crear	\N	{"estado": "entregado", "createdAt": "2026-10-15T01:28:52.610Z", "id_pedido": 7, "updatedAt": "2026-10-15T01:28:52.610Z", "id_usuario": 3, "id_contrato": 3, "monto_total": "7450.00", "fecha_pedido": "2026-07-06", "numero_pedido": "PED-2026-00007", "observaciones": null, "fecha_programada": "2026-07-16", "fecha_real_entrega": "2026-07-16"}	3	\N	\N	2026-07-06 09:15:00-06
48	contratos	3	cambio_estado	\N	{"nog": "21554870", "estado": "completado", "createdAt": "2026-10-15T01:28:52.428Z", "fecha_fin": "2026-09-14", "updatedAt": "2026-10-15T01:28:52.428Z", "id_usuario": 3, "id_contrato": 3, "monto_total": "14900.00", "fecha_inicio": "2025-09-09", "id_modalidad": 5, "observaciones": null, "id_institucion": 4, "numero_contrato": "IGSS-CA-118-2025", "vigencia_minima_meses": 6}	3	Todos los renglones fueron entregados	\N	2026-07-16 15:31:00-06
49	pedidos	8	crear	\N	{"estado": "entregado", "createdAt": "2026-10-15T01:28:52.625Z", "id_pedido": 8, "updatedAt": "2026-10-15T01:28:52.625Z", "id_usuario": 3, "id_contrato": 5, "monto_total": "20750.00", "fecha_pedido": "2026-07-26", "numero_pedido": "PED-2026-00008", "observaciones": "El transporte se retrasó por un desperfecto mecánico", "fecha_programada": "2026-08-05", "fecha_real_entrega": "2026-08-09"}	3	\N	\N	2026-07-26 09:15:00-06
50	lotes	16	crear	\N	{"id_lote": 16, "condicion": "disponible", "createdAt": "2026-10-15T01:28:52.648Z", "updatedAt": "2026-10-15T01:28:52.650Z", "id_ingreso": 8, "id_producto": 8, "numero_lote": "PS-S7790", "id_ubicacion": 1, "costo_unitario": "5.80", "id_laboratorio": 3, "motivo_condicion": null, "cantidad_recibida": "3000.00", "fecha_fabricacion": "2026-07-16", "fecha_vencimiento": "2028-09-13", "cantidad_disponible": 3000}	2	\N	\N	2026-08-15 08:30:00-06
51	lotes	17	crear	\N	{"id_lote": 17, "condicion": "disponible", "createdAt": "2026-10-15T01:28:52.654Z", "updatedAt": "2026-10-15T01:28:52.655Z", "id_ingreso": 8, "id_producto": 6, "numero_lote": "BN-O205", "id_ubicacion": 1, "costo_unitario": "0.44", "id_laboratorio": 5, "motivo_condicion": null, "cantidad_recibida": "15000.00", "fecha_fabricacion": "2026-07-26", "fecha_vencimiento": "2028-07-15", "cantidad_disponible": 15000}	2	\N	\N	2026-08-15 08:30:00-06
52	ingresos	8	crear	\N	{"estado": "registrado", "createdAt": "2026-10-15T01:28:52.646Z", "updatedAt": "2026-10-15T01:28:52.646Z", "id_ingreso": 8, "id_usuario": 2, "monto_total": "24000.00", "id_proveedor": 4, "fecha_factura": "2026-08-14", "observaciones": null, "serie_factura": "FV", "numero_factura": "1187", "fecha_recepcion": "2026-08-15"}	2	\N	\N	2026-08-15 08:31:00-06
53	lotes	8	ajuste_inventario	\N	{"id_lote": 8, "condicion": "disponible", "createdAt": "2026-10-15T01:28:52.419Z", "updatedAt": "2026-10-15T01:28:52.659Z", "id_ingreso": 4, "id_producto": 8, "numero_lote": "PS-S7712", "id_ubicacion": 1, "costo_unitario": "6.00", "id_laboratorio": 3, "motivo_condicion": null, "cantidad_recibida": "2500.00", "fecha_fabricacion": "2025-07-21", "fecha_vencimiento": "2027-05-02", "cantidad_disponible": 280}	2	Merma o daño: frascos rotos al reacomodar la estantería	\N	2026-09-04 14:10:00-06
54	lotes	18	crear	\N	{"id_lote": 18, "condicion": "disponible", "createdAt": "2026-10-15T01:28:52.667Z", "updatedAt": "2026-10-15T01:28:52.668Z", "id_ingreso": 9, "id_producto": 10, "numero_lote": "LP-I2388", "id_ubicacion": 1, "costo_unitario": "0.24", "id_laboratorio": 6, "motivo_condicion": null, "cantidad_recibida": "6000.00", "fecha_fabricacion": "2026-08-15", "fecha_vencimiento": "2028-09-13", "cantidad_disponible": 6000}	2	\N	\N	2026-09-19 08:30:00-06
55	lotes	19	crear	\N	{"id_lote": 19, "condicion": "disponible", "createdAt": "2026-10-15T01:28:52.671Z", "updatedAt": "2026-10-15T01:28:52.672Z", "id_ingreso": 9, "id_producto": 8, "numero_lote": "PS-S7790", "id_ubicacion": 1, "costo_unitario": "5.80", "id_laboratorio": 3, "motivo_condicion": null, "cantidad_recibida": "3000.00", "fecha_fabricacion": "2026-07-16", "fecha_vencimiento": "2028-09-13", "cantidad_disponible": 3000}	2	\N	\N	2026-09-19 08:30:00-06
56	ingresos	9	crear	\N	{"estado": "registrado", "createdAt": "2026-10-15T01:28:52.666Z", "updatedAt": "2026-10-15T01:28:52.666Z", "id_ingreso": 9, "id_usuario": 2, "monto_total": "18840.00", "id_proveedor": 3, "fecha_factura": "2026-09-18", "observaciones": null, "serie_factura": "B", "numero_factura": "3378", "fecha_recepcion": "2026-09-19"}	2	\N	\N	2026-09-19 08:31:00-06
57	lotes	19	anular	{"id_lote": 19, "condicion": "disponible", "createdAt": "2026-10-15T01:28:52.671Z", "updatedAt": "2026-10-15T01:28:52.672Z", "id_ingreso": 9, "id_producto": 8, "numero_lote": "PS-S7790", "id_ubicacion": 1, "costo_unitario": "5.80", "id_laboratorio": 3, "motivo_condicion": null, "cantidad_recibida": "3000.00", "fecha_fabricacion": "2026-07-16", "fecha_vencimiento": "2028-09-13", "cantidad_disponible": 3000}	{"id_lote": 19, "condicion": "anulado", "createdAt": "2026-10-15T01:28:52.671Z", "updatedAt": "2026-10-15T01:28:52.680Z", "id_ingreso": 9, "id_producto": 8, "numero_lote": "PS-S7790", "id_ubicacion": 1, "costo_unitario": "5.80", "id_laboratorio": 3, "motivo_condicion": "Lote registrado dos veces: ya había ingresado con la factura FV-1187.", "cantidad_recibida": "3000.00", "fecha_fabricacion": "2026-07-16", "fecha_vencimiento": "2028-09-13", "cantidad_disponible": 0}	1	Lote registrado dos veces: ya había ingresado con la factura FV-1187.	\N	2026-09-20 09:05:00-06
58	lotes	7	cambio_estado	{"id_lote": 7, "condicion": "disponible", "createdAt": "2026-10-15T01:28:52.390Z", "updatedAt": "2026-10-15T01:28:52.482Z", "id_ingreso": 4, "id_producto": 9, "numero_lote": "BN-M330", "id_ubicacion": 1, "costo_unitario": "0.30", "id_laboratorio": 5, "motivo_condicion": null, "cantidad_recibida": "3000.00", "fecha_fabricacion": "2025-06-01", "fecha_vencimiento": "2026-09-24", "cantidad_disponible": 2000}	{"id_lote": 7, "condicion": "vencido", "createdAt": "2026-10-15T01:28:52.390Z", "updatedAt": "2026-10-15T01:28:52.684Z", "id_ingreso": 4, "id_producto": 9, "numero_lote": "BN-M330", "id_ubicacion": 1, "costo_unitario": "0.30", "id_laboratorio": 5, "motivo_condicion": "Vencimiento automático por fecha", "cantidad_recibida": "3000.00", "fecha_fabricacion": "2025-06-01", "fecha_vencimiento": "2026-09-24", "cantidad_disponible": 2000}	\N	Vencimiento automático por fecha	\N	2026-09-25 16:00:00-06
59	lotes	7	ajuste_inventario	\N	{"id_lote": 7, "condicion": "vencido", "createdAt": "2026-10-15T01:28:52.390Z", "updatedAt": "2026-10-15T01:28:52.686Z", "id_ingreso": 4, "id_producto": 9, "numero_lote": "BN-M330", "id_ubicacion": 1, "costo_unitario": "0.30", "id_laboratorio": 5, "motivo_condicion": "Vencimiento automático por fecha", "cantidad_recibida": "3000.00", "fecha_fabricacion": "2025-06-01", "fecha_vencimiento": "2026-09-24", "cantidad_disponible": 800}	2	Destrucción por vencimiento: acta 014-2026	\N	2026-10-04 10:00:00-06
60	pedidos	9	crear	\N	{"estado": "empacado", "createdAt": "2026-10-15T01:28:52.691Z", "id_pedido": 9, "updatedAt": "2026-10-15T01:28:52.691Z", "id_usuario": 3, "id_contrato": 5, "monto_total": "9675.00", "fecha_pedido": "2026-10-02", "numero_pedido": "PED-2026-00009", "observaciones": "Esperando transporte disponible", "fecha_programada": "2026-10-11", "fecha_real_entrega": null}	3	\N	\N	2026-10-02 09:15:00-06
61	pedidos	10	crear	\N	{"estado": "en_transporte", "createdAt": "2026-10-15T01:28:52.703Z", "id_pedido": 10, "updatedAt": "2026-10-15T01:28:52.703Z", "id_usuario": 3, "id_contrato": 6, "monto_total": "10010.00", "fecha_pedido": "2026-10-06", "numero_pedido": "PED-2026-00010", "observaciones": null, "fecha_programada": "2026-10-15", "fecha_real_entrega": null}	3	\N	\N	2026-10-06 09:15:00-06
62	pedidos	11	crear	\N	{"estado": "pendiente", "createdAt": "2026-10-15T01:28:52.716Z", "id_pedido": 11, "updatedAt": "2026-10-15T01:28:52.716Z", "id_usuario": 3, "id_contrato": 5, "monto_total": "5100.00", "fecha_pedido": "2026-10-12", "numero_pedido": "PED-2026-00011", "observaciones": null, "fecha_programada": "2026-10-16", "fecha_real_entrega": null}	3	\N	\N	2026-10-12 09:15:00-06
63	pedidos	12	crear	\N	{"estado": "pendiente", "createdAt": "2026-10-15T01:28:52.719Z", "id_pedido": 12, "updatedAt": "2026-10-15T01:28:52.719Z", "id_usuario": 3, "id_contrato": 5, "monto_total": "5200.00", "fecha_pedido": "2026-10-13", "numero_pedido": "PED-2026-00012", "observaciones": null, "fecha_programada": "2026-11-03", "fecha_real_entrega": null}	3	\N	\N	2026-10-13 09:15:00-06
64	lotes	17	cambio_estado	{"id_lote": 17, "condicion": "disponible", "createdAt": "2026-10-15T01:28:52.654Z", "updatedAt": "2026-10-15T01:28:52.655Z", "id_ingreso": 8, "id_producto": 6, "numero_lote": "BN-O205", "id_ubicacion": 1, "costo_unitario": "0.44", "id_laboratorio": 5, "motivo_condicion": null, "cantidad_recibida": "15000.00", "fecha_fabricacion": "2026-07-26", "fecha_vencimiento": "2028-07-15", "cantidad_disponible": 15000}	{"id_lote": 17, "condicion": "cuarentena", "createdAt": "2026-10-15T01:28:52.654Z", "updatedAt": "2026-10-15T01:28:52.723Z", "id_ingreso": 8, "id_producto": 6, "numero_lote": "BN-O205", "id_ubicacion": 3, "costo_unitario": "0.44", "id_laboratorio": 5, "motivo_condicion": "Reclamo de calidad: cápsulas adheridas en varios blísteres. Se espera dictamen del laboratorio.", "cantidad_recibida": "15000.00", "fecha_fabricacion": "2026-07-26", "fecha_vencimiento": "2028-07-15", "cantidad_disponible": 15000}	2	Reclamo de calidad: cápsulas adheridas en varios blísteres. Se espera dictamen del laboratorio.	\N	2026-10-09 16:00:00-06
65	lotes	11	cambio_estado	{"id_lote": 11, "condicion": "disponible", "createdAt": "2026-10-15T01:28:52.498Z", "updatedAt": "2026-10-15T01:28:52.706Z", "id_ingreso": 6, "id_producto": 5, "numero_lote": "SN-C2231", "id_ubicacion": 1, "costo_unitario": "14.50", "id_laboratorio": 4, "motivo_condicion": null, "cantidad_recibida": "2000.00", "fecha_fabricacion": "2025-12-18", "fecha_vencimiento": "2028-02-26", "cantidad_disponible": 100}	{"id_lote": 11, "condicion": "bloqueado", "createdAt": "2026-10-15T01:28:52.498Z", "updatedAt": "2026-10-15T01:28:52.725Z", "id_ingreso": 6, "id_producto": 5, "numero_lote": "SN-C2231", "id_ubicacion": 1, "costo_unitario": "14.50", "id_laboratorio": 4, "motivo_condicion": "Retiro voluntario del lote notificado por Sanofi (alerta sanitaria). Avisar a las instituciones que lo recibieron.", "cantidad_recibida": "2000.00", "fecha_fabricacion": "2025-12-18", "fecha_vencimiento": "2028-02-26", "cantidad_disponible": 100}	1	Retiro voluntario del lote notificado por Sanofi (alerta sanitaria). Avisar a las instituciones que lo recibieron.	\N	2026-10-11 16:00:00-06
66	pedidos	13	crear	\N	{"estado": "pendiente", "Usuario": {"nombre": "Gerardo", "apellido": "García"}, "Contrato": {"nog": "22109876", "estado": "vigente", "fecha_fin": "2027-01-02", "Institucion": {"nombre": "Hospital Roosevelt", "departamento": "Guatemala", "id_institucion": 2}, "id_contrato": 5, "numero_contrato": "HR-LP-007-2026", "vigencia_minima_meses": 6}, "createdAt": "2026-10-15T02:05:32.330Z", "id_pedido": 13, "updatedAt": "2026-10-15T02:05:32.330Z", "id_usuario": 1, "id_contrato": 5, "monto_total": "4165.00", "fecha_pedido": "2026-10-14", "numero_pedido": "PED-2026-00013", "observaciones": null, "DetallePedidos": [{"Producto": {"codigo": "MED-010", "nombre": "Ceftriaxona", "id_producto": 5, "UnidadMedida": {"nombre": "Vial"}, "concentracion": "1 g"}, "cantidad": "100.00", "subtotal": "2600.00", "createdAt": "2026-10-15T02:05:32.341Z", "id_pedido": 13, "updatedAt": "2026-10-15T02:05:32.341Z", "id_producto": 5, "AsignacionLotes": [], "DetalleContrato": {"numero_renglon": 1}, "precio_unitario": "26.00", "id_detalle_pedido": 26, "id_detalle_contrato": 10}, {"Producto": {"codigo": "MED-012", "nombre": "Diclofenaco sódico", "id_producto": 7, "UnidadMedida": {"nombre": "Ampolla"}, "concentracion": "75 mg/3 ml"}, "cantidad": "100.00", "subtotal": "375.00", "createdAt": "2026-10-15T02:05:32.342Z", "id_pedido": 13, "updatedAt": "2026-10-15T02:05:32.342Z", "id_producto": 7, "AsignacionLotes": [], "DetalleContrato": {"numero_renglon": 2}, "precio_unitario": "3.75", "id_detalle_pedido": 27, "id_detalle_contrato": 11}, {"Producto": {"codigo": "MED-013", "nombre": "Cloruro de sodio", "id_producto": 8, "UnidadMedida": {"nombre": "Frasco"}, "concentracion": "0.9% 500 ml"}, "cantidad": "100.00", "subtotal": "1100.00", "createdAt": "2026-10-15T02:05:32.343Z", "id_pedido": 13, "updatedAt": "2026-10-15T02:05:32.343Z", "id_producto": 8, "AsignacionLotes": [], "DetalleContrato": {"numero_renglon": 3}, "precio_unitario": "11.00", "id_detalle_pedido": 28, "id_detalle_contrato": 12}, {"Producto": {"codigo": "MED-011", "nombre": "Omeprazol", "id_producto": 6, "UnidadMedida": {"nombre": "Cápsula"}, "concentracion": "20 mg"}, "cantidad": "100.00", "subtotal": "90.00", "createdAt": "2026-10-15T02:05:32.344Z", "id_pedido": 13, "updatedAt": "2026-10-15T02:05:32.344Z", "id_producto": 6, "AsignacionLotes": [], "DetalleContrato": {"numero_renglon": 4}, "precio_unitario": "0.90", "id_detalle_pedido": 29, "id_detalle_contrato": 13}], "fecha_programada": "2026-10-21", "SeguimientoPedidos": [{"fecha": "2026-10-15T02:05:32.346Z", "estado": "pendiente", "Usuario": {"nombre": "Gerardo", "apellido": "García"}, "id_pedido": 13, "id_usuario": 1, "observacion": "Pedido registrado", "id_seguimiento": 46}], "fecha_real_entrega": null}	1	\N	::1	2026-10-14 20:05:32.364-06
67	pedidos	12	cambio_estado	{"estado": "pendiente", "Contrato": {"nog": "22109876", "estado": "vigente", "fecha_fin": "2027-01-02", "Institucion": {"nombre": "Hospital Roosevelt", "departamento": "Guatemala", "id_institucion": 2}, "id_contrato": 5, "numero_contrato": "HR-LP-007-2026", "vigencia_minima_meses": 6}, "createdAt": "2026-10-15T01:28:52.719Z", "id_pedido": 12, "updatedAt": "2026-10-15T01:28:52.719Z", "id_usuario": 3, "id_contrato": 5, "monto_total": "5200.00", "fecha_pedido": "2026-10-13", "numero_pedido": "PED-2026-00012", "observaciones": null, "DetallePedidos": [{"Producto": {"nombre": "Ceftriaxona"}, "cantidad": "200.00", "subtotal": "5200.00", "createdAt": "2026-10-15T01:28:52.721Z", "id_pedido": 12, "updatedAt": "2026-10-15T01:28:52.721Z", "id_producto": 5, "precio_unitario": "26.00", "id_detalle_pedido": 25, "id_detalle_contrato": 10}], "fecha_programada": "2026-11-03", "fecha_real_entrega": null}	{"estado": "en_preparacion", "Contrato": {"nog": "22109876", "estado": "vigente", "fecha_fin": "2027-01-02", "Institucion": {"nombre": "Hospital Roosevelt", "departamento": "Guatemala", "id_institucion": 2}, "id_contrato": 5, "numero_contrato": "HR-LP-007-2026", "vigencia_minima_meses": 6}, "createdAt": "2026-10-15T01:28:52.719Z", "id_pedido": 12, "updatedAt": "2026-10-15T02:06:08.907Z", "id_usuario": 3, "id_contrato": 5, "monto_total": "5200.00", "fecha_pedido": "2026-10-13", "numero_pedido": "PED-2026-00012", "observaciones": null, "DetallePedidos": [{"Producto": {"nombre": "Ceftriaxona"}, "cantidad": "200.00", "subtotal": "5200.00", "createdAt": "2026-10-15T01:28:52.721Z", "id_pedido": 12, "updatedAt": "2026-10-15T01:28:52.721Z", "id_producto": 5, "precio_unitario": "26.00", "id_detalle_pedido": 25, "id_detalle_contrato": 10}], "fecha_programada": "2026-11-03", "fecha_real_entrega": null}	1	Preparación del despacho (FEFO)	::1	2026-10-14 20:06:08.911-06
68	pedidos	12	cambio_estado	{"estado": "en_preparacion", "createdAt": "2026-10-15T01:28:52.719Z", "id_pedido": 12, "updatedAt": "2026-10-15T02:06:08.907Z", "id_usuario": 3, "id_contrato": 5, "monto_total": "5200.00", "fecha_pedido": "2026-10-13", "numero_pedido": "PED-2026-00012", "observaciones": null, "fecha_programada": "2026-11-03", "fecha_real_entrega": null}	{"estado": "empacado", "createdAt": "2026-10-15T01:28:52.719Z", "id_pedido": 12, "updatedAt": "2026-10-15T02:07:15.685Z", "id_usuario": 3, "id_contrato": 5, "monto_total": "5200.00", "fecha_pedido": "2026-10-13", "numero_pedido": "PED-2026-00012", "observaciones": null, "fecha_programada": "2026-11-03", "fecha_real_entrega": null}	1	Se empacó la factura en tal tal tal en doble caja sellado con tal tal	::1	2026-10-14 20:07:15.69-06
69	pedidos	12	cambio_estado	{"estado": "empacado", "createdAt": "2026-10-15T01:28:52.719Z", "id_pedido": 12, "updatedAt": "2026-10-15T02:07:15.685Z", "id_usuario": 3, "id_contrato": 5, "monto_total": "5200.00", "fecha_pedido": "2026-10-13", "numero_pedido": "PED-2026-00012", "observaciones": null, "fecha_programada": "2026-11-03", "fecha_real_entrega": null}	{"estado": "en_transporte", "createdAt": "2026-10-15T01:28:52.719Z", "id_pedido": 12, "updatedAt": "2026-10-15T02:07:39.769Z", "id_usuario": 3, "id_contrato": 5, "monto_total": "5200.00", "fecha_pedido": "2026-10-13", "numero_pedido": "PED-2026-00012", "observaciones": null, "fecha_programada": "2026-11-03", "fecha_real_entrega": null}	1	Se enviocon numero de guia 14000 por cargo express	::1	2026-10-14 20:07:39.774-06
70	pedidos	12	cambio_estado	{"estado": "en_transporte", "createdAt": "2026-10-15T01:28:52.719Z", "id_pedido": 12, "updatedAt": "2026-10-15T02:07:39.769Z", "id_usuario": 3, "id_contrato": 5, "monto_total": "5200.00", "fecha_pedido": "2026-10-13", "numero_pedido": "PED-2026-00012", "observaciones": null, "fecha_programada": "2026-11-03", "fecha_real_entrega": null}	{"estado": "entregado", "createdAt": "2026-10-15T01:28:52.719Z", "id_pedido": 12, "updatedAt": "2026-10-15T02:07:47.441Z", "id_usuario": 3, "id_contrato": 5, "monto_total": "5200.00", "fecha_pedido": "2026-10-13", "numero_pedido": "PED-2026-00012", "observaciones": null, "fecha_programada": "2026-11-03", "fecha_real_entrega": "2026-10-14"}	1	Recibio conforme	::1	2026-10-14 20:07:47.443-06
\.


--
-- Data for Name: contratos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.contratos (id_contrato, id_institucion, id_usuario, numero_contrato, nog, id_modalidad, fecha_inicio, fecha_fin, vigencia_minima_meses, monto_total, estado, observaciones, "createdAt", "updatedAt") FROM stdin;
1	1	1	HNCH-012-2026	21458796	3	2026-09-12	2027-04-12	12	10700.00	vigente	\N	2026-10-12 23:19:53.049-06	2026-10-12 23:19:53.049-06
2	2	1	HR-088-2026	21503344	5	2026-08-13	2026-11-01	12	2000.00	vigente	\N	2026-10-12 23:19:53.128-06	2026-10-12 23:19:53.128-06
3	4	3	IGSS-CA-118-2025	21554870	5	2025-09-09	2026-09-14	6	14900.00	completado	\N	2026-10-14 19:28:52.428-06	2026-10-14 19:28:52.428-06
4	5	3	DASJ-BC-044-2025	20981123	1	2025-11-18	2026-09-29	6	5640.00	vencido	\N	2026-10-14 19:28:52.436-06	2026-10-14 19:28:52.436-06
5	2	3	HR-LP-007-2026	22109876	4	2026-03-28	2027-01-02	6	107250.00	vigente	\N	2026-10-14 19:28:52.53-06	2026-10-14 19:28:52.53-06
6	3	3	HRZ-COT-031-2026	22340551	3	2026-05-17	2026-10-26	\N	33740.00	vigente	\N	2026-10-14 19:28:52.558-06	2026-10-14 19:28:52.558-06
\.


--
-- Data for Name: detalle_contratos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.detalle_contratos (id_detalle_contrato, id_contrato, numero_renglon, id_producto, cantidad_contratada, precio_unitario, subtotal, activo, "createdAt", "updatedAt") FROM stdin;
1	1	1	1	600.00	12.50	7500.00	t	2026-10-12 23:19:53.055-06	2026-10-12 23:19:53.055-06
2	1	2	2	3000.00	0.60	1800.00	t	2026-10-12 23:19:53.059-06	2026-10-12 23:19:53.059-06
3	1	3	4	1000.00	1.40	1400.00	t	2026-10-12 23:19:53.067-06	2026-10-12 23:19:53.067-06
4	2	1	3	8000.00	0.25	2000.00	t	2026-10-12 23:19:53.13-06	2026-10-12 23:19:53.13-06
5	3	1	6	6000.00	0.95	5700.00	t	2026-10-14 19:28:52.43-06	2026-10-14 19:28:52.43-06
6	3	2	8	800.00	11.50	9200.00	t	2026-10-14 19:28:52.434-06	2026-10-14 19:28:52.434-06
7	4	1	10	3000.00	0.60	1800.00	t	2026-10-14 19:28:52.438-06	2026-10-14 19:28:52.438-06
8	4	2	9	2000.00	0.75	1500.00	t	2026-10-14 19:28:52.438-06	2026-10-14 19:28:52.438-06
9	4	3	7	600.00	3.90	2340.00	t	2026-10-14 19:28:52.44-06	2026-10-14 19:28:52.44-06
10	5	1	5	2500.00	26.00	65000.00	t	2026-10-14 19:28:52.531-06	2026-10-14 19:28:52.531-06
11	5	2	7	3000.00	3.75	11250.00	t	2026-10-14 19:28:52.532-06	2026-10-14 19:28:52.532-06
12	5	3	8	2000.00	11.00	22000.00	t	2026-10-14 19:28:52.533-06	2026-10-14 19:28:52.533-06
13	5	4	6	10000.00	0.90	9000.00	t	2026-10-14 19:28:52.534-06	2026-10-14 19:28:52.534-06
14	6	1	5	1000.00	25.50	25500.00	t	2026-10-14 19:28:52.56-06	2026-10-14 19:28:52.56-06
15	6	2	10	2000.00	0.58	1160.00	t	2026-10-14 19:28:52.562-06	2026-10-14 19:28:52.562-06
16	6	3	8	600.00	11.80	7080.00	t	2026-10-14 19:28:52.563-06	2026-10-14 19:28:52.563-06
\.


--
-- Data for Name: detalle_pedidos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.detalle_pedidos (id_detalle_pedido, id_pedido, id_detalle_contrato, id_producto, cantidad, precio_unitario, subtotal, "createdAt", "updatedAt") FROM stdin;
1	1	1	1	300.00	12.50	3750.00	2026-10-12 23:19:53.178-06	2026-10-12 23:19:53.178-06
2	2	7	10	1500.00	0.60	900.00	2026-10-14 19:28:52.469-06	2026-10-14 19:28:52.469-06
3	2	8	9	1000.00	0.75	750.00	2026-10-14 19:28:52.48-06	2026-10-14 19:28:52.48-06
4	2	9	7	300.00	3.90	1170.00	2026-10-14 19:28:52.486-06	2026-10-14 19:28:52.486-06
5	3	5	6	3000.00	0.95	2850.00	2026-10-14 19:28:52.513-06	2026-10-14 19:28:52.513-06
6	3	6	8	400.00	11.50	4600.00	2026-10-14 19:28:52.519-06	2026-10-14 19:28:52.519-06
7	4	10	5	500.00	26.00	13000.00	2026-10-14 19:28:52.539-06	2026-10-14 19:28:52.539-06
8	4	13	6	4000.00	0.90	3600.00	2026-10-14 19:28:52.544-06	2026-10-14 19:28:52.544-06
9	4	12	8	500.00	11.00	5500.00	2026-10-14 19:28:52.548-06	2026-10-14 19:28:52.548-06
10	5	14	5	400.00	25.50	10200.00	2026-10-14 19:28:52.568-06	2026-10-14 19:28:52.568-06
11	5	16	8	300.00	11.80	3540.00	2026-10-14 19:28:52.574-06	2026-10-14 19:28:52.574-06
12	6	7	10	1000.00	0.60	600.00	2026-10-14 19:28:52.598-06	2026-10-14 19:28:52.598-06
13	6	8	9	800.00	0.75	600.00	2026-10-14 19:28:52.602-06	2026-10-14 19:28:52.602-06
14	7	5	6	3000.00	0.95	2850.00	2026-10-14 19:28:52.612-06	2026-10-14 19:28:52.612-06
15	7	6	8	400.00	11.50	4600.00	2026-10-14 19:28:52.616-06	2026-10-14 19:28:52.616-06
16	8	10	5	400.00	26.00	10400.00	2026-10-14 19:28:52.627-06	2026-10-14 19:28:52.627-06
17	8	11	7	1000.00	3.75	3750.00	2026-10-14 19:28:52.631-06	2026-10-14 19:28:52.631-06
18	8	12	8	600.00	11.00	6600.00	2026-10-14 19:28:52.636-06	2026-10-14 19:28:52.636-06
19	9	10	5	300.00	26.00	7800.00	2026-10-14 19:28:52.693-06	2026-10-14 19:28:52.693-06
20	9	11	7	500.00	3.75	1875.00	2026-10-14 19:28:52.697-06	2026-10-14 19:28:52.697-06
21	10	14	5	300.00	25.50	7650.00	2026-10-14 19:28:52.704-06	2026-10-14 19:28:52.704-06
22	10	16	8	200.00	11.80	2360.00	2026-10-14 19:28:52.708-06	2026-10-14 19:28:52.708-06
23	11	13	6	2000.00	0.90	1800.00	2026-10-14 19:28:52.717-06	2026-10-14 19:28:52.717-06
24	11	12	8	300.00	11.00	3300.00	2026-10-14 19:28:52.718-06	2026-10-14 19:28:52.718-06
25	12	10	5	200.00	26.00	5200.00	2026-10-14 19:28:52.721-06	2026-10-14 19:28:52.721-06
26	13	10	5	100.00	26.00	2600.00	2026-10-14 20:05:32.341-06	2026-10-14 20:05:32.341-06
27	13	11	7	100.00	3.75	375.00	2026-10-14 20:05:32.342-06	2026-10-14 20:05:32.342-06
28	13	12	8	100.00	11.00	1100.00	2026-10-14 20:05:32.343-06	2026-10-14 20:05:32.343-06
29	13	13	6	100.00	0.90	90.00	2026-10-14 20:05:32.344-06	2026-10-14 20:05:32.344-06
\.


--
-- Data for Name: formas_farmaceuticas; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.formas_farmaceuticas (id_forma_farmaceutica, nombre, descripcion, activo, "createdAt", "updatedAt") FROM stdin;
1	Tableta	\N	t	2026-10-12 23:19:47.267-06	2026-10-12 23:19:47.267-06
2	Cápsula	\N	t	2026-10-12 23:19:47.272-06	2026-10-12 23:19:47.272-06
3	Solución inyectable	\N	t	2026-10-12 23:19:47.275-06	2026-10-12 23:19:47.275-06
4	Polvo para reconstituir	\N	t	2026-10-12 23:19:47.278-06	2026-10-12 23:19:47.278-06
5	Jarabe	\N	t	2026-10-12 23:19:47.281-06	2026-10-12 23:19:47.281-06
6	Suspensión	\N	t	2026-10-12 23:19:47.284-06	2026-10-12 23:19:47.284-06
7	Solución oral	\N	t	2026-10-12 23:19:47.288-06	2026-10-12 23:19:47.288-06
8	Gotas	\N	t	2026-10-12 23:19:47.291-06	2026-10-12 23:19:47.291-06
9	Crema	\N	t	2026-10-12 23:19:47.294-06	2026-10-12 23:19:47.294-06
10	Ungüento	\N	t	2026-10-12 23:19:47.296-06	2026-10-12 23:19:47.296-06
11	Gel	\N	t	2026-10-12 23:19:47.299-06	2026-10-12 23:19:47.299-06
12	Óvulo	\N	t	2026-10-12 23:19:47.302-06	2026-10-12 23:19:47.302-06
13	Supositorio	\N	t	2026-10-12 23:19:47.305-06	2026-10-12 23:19:47.305-06
14	Material médico quirúrgico	\N	t	2026-10-12 23:19:47.308-06	2026-10-12 23:19:47.308-06
\.


--
-- Data for Name: ingresos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ingresos (id_ingreso, id_proveedor, serie_factura, numero_factura, fecha_factura, fecha_recepcion, id_usuario, monto_total, estado, observaciones, "createdAt", "updatedAt") FROM stdin;
1	1	A	1001	2026-09-22	2026-09-23	1	3450.00	registrado	\N	2026-10-12 23:19:52.872-06	2026-10-12 23:19:52.872-06
2	2	FAC	55890	2026-10-02	2026-10-02	1	3570.00	registrado	\N	2026-10-12 23:19:52.922-06	2026-10-12 23:19:52.922-06
3	1	A	1042	2026-10-10	2026-10-11	1	3975.00	registrado	\N	2026-10-12 23:19:52.973-06	2026-10-12 23:19:52.973-06
4	4	FV	1120	2025-08-19	2025-08-20	2	15900.00	registrado	\N	2026-10-14 19:28:52.385-06	2026-10-14 19:28:52.385-06
5	1	A	0890	2025-11-27	2025-11-28	2	4600.00	registrado	\N	2026-10-14 19:28:52.442-06	2026-10-14 19:28:52.442-06
6	3	B	3301	2026-02-15	2026-02-16	2	38000.00	registrado	\N	2026-10-14 19:28:52.497-06	2026-10-14 19:28:52.497-06
7	1	A	0951	2026-06-15	2026-06-16	2	21865.00	registrado	\N	2026-10-14 19:28:52.583-06	2026-10-14 19:28:52.583-06
8	4	FV	1187	2026-08-14	2026-08-15	2	24000.00	registrado	\N	2026-10-14 19:28:52.646-06	2026-10-14 19:28:52.646-06
9	3	B	3378	2026-09-18	2026-09-19	2	18840.00	registrado	\N	2026-10-14 19:28:52.666-06	2026-10-14 19:28:52.666-06
\.


--
-- Data for Name: instituciones; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.instituciones (id_institucion, nombre, id_tipo_institucion, nit, unidad_ejecutora, departamento, direccion, telefono, email, contacto, activo, "createdAt", "updatedAt") FROM stdin;
1	Hospital Nacional de Chiquimula	1	3456789-1	\N	Chiquimula	\N	\N	\N	\N	t	2026-10-12 23:19:53.002-06	2026-10-12 23:19:53.002-06
2	Hospital Roosevelt	1	2345678-9	\N	Guatemala	\N	2321-7400	farmacia@hospitalroosevelt.gob.gt	Licda. Marta Girón (farmacia interna)	t	2026-10-12 23:19:53.028-06	2026-10-14 19:28:52.356-06
3	Hospital Regional de Zacapa	2	3344556-7	\N	Zacapa	\N	7941-0250	compras@hrzacapa.gob.gt	Lic. Pedro Orellana	t	2026-10-14 19:28:52.362-06	2026-10-14 19:28:52.362-06
4	IGSS — Hospital General de Enfermedad Común	6	1122334-5	\N	Guatemala	\N	2412-1224	abastecimiento@igssgt.org	Licda. Rosa Herrera	t	2026-10-14 19:28:52.366-06	2026-10-14 19:28:52.366-06
5	Dirección de Área de Salud de Jalapa	5	9988776-5	\N	Jalapa	\N	7922-4410	das.jalapa@mspas.gob.gt	Ing. Hugo Monterroso	t	2026-10-14 19:28:52.369-06	2026-10-14 19:28:52.369-06
\.


--
-- Data for Name: laboratorios; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.laboratorios (id_laboratorio, nombre, pais, activo, "createdAt", "updatedAt") FROM stdin;
1	Bayer	Alemania	t	2026-10-12 23:19:52.632-06	2026-10-12 23:19:52.632-06
2	MK (Tecnoquímicas)	Colombia	t	2026-10-12 23:19:52.685-06	2026-10-12 23:19:52.685-06
3	Laboratorios PiSA	México	t	2026-10-12 23:19:52.701-06	2026-10-12 23:19:52.701-06
4	Sanofi	Francia	t	2026-10-14 19:28:52.26-06	2026-10-14 19:28:52.26-06
5	Laboratorios Bonin	Guatemala	t	2026-10-14 19:28:52.264-06	2026-10-14 19:28:52.264-06
6	Laprin	Guatemala	t	2026-10-14 19:28:52.273-06	2026-10-14 19:28:52.273-06
\.


--
-- Data for Name: lotes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.lotes (id_lote, id_ingreso, id_producto, id_laboratorio, numero_lote, fecha_fabricacion, fecha_vencimiento, cantidad_recibida, cantidad_disponible, costo_unitario, id_ubicacion, condicion, motivo_condicion, "createdAt", "updatedAt") FROM stdin;
1	1	1	1	BY24-001	2026-07-12	2027-12-12	200.00	200.00	8.50	1	disponible	\N	2026-10-12 23:19:52.879-06	2026-10-12 23:19:52.89-06
2	1	2	3	PS-7781	2026-07-12	2028-10-12	5000.00	5000.00	0.35	1	disponible	\N	2026-10-12 23:19:52.899-06	2026-10-12 23:19:52.901-06
3	2	1	2	MK-L2290	2026-07-12	2029-04-12	300.00	300.00	7.90	1	disponible	\N	2026-10-12 23:19:52.924-06	2026-10-12 23:19:52.926-06
4	2	3	3	PS-1203	2026-07-12	2029-10-12	10000.00	10000.00	0.12	1	disponible	\N	2026-10-12 23:19:52.932-06	2026-10-12 23:19:52.934-06
5	3	1	1	BY24-118	2026-07-12	2028-06-12	150.00	150.00	8.50	1	disponible	\N	2026-10-12 23:19:52.975-06	2026-10-12 23:19:52.979-06
6	3	4	2	MK-G100	2026-07-12	2030-10-12	3000.00	3000.00	0.90	1	disponible	\N	2026-10-12 23:19:52.986-06	2026-10-12 23:19:52.989-06
9	5	7	6	LP-D0457	2025-02-21	2026-12-28	2000.00	1700.00	1.80	1	disponible	\N	2026-10-14 19:28:52.444-06	2026-10-14 19:28:52.488-06
10	5	10	6	LP-I2210	2025-08-20	2027-03-13	4000.00	1500.00	0.25	1	disponible	\N	2026-10-14 19:28:52.452-06	2026-10-14 19:28:52.599-06
15	7	9	5	BN-M412	2026-05-27	2028-04-26	1500.00	700.00	0.30	1	disponible	\N	2026-10-14 19:28:52.592-06	2026-10-14 19:28:52.603-06
12	6	6	5	BN-O118	2026-01-27	2027-12-08	20000.00	10000.00	0.45	1	disponible	\N	2026-10-14 19:28:52.503-06	2026-10-14 19:28:52.613-06
8	4	8	3	PS-S7712	2025-07-21	2027-05-02	2500.00	280.00	6.00	1	disponible	\N	2026-10-14 19:28:52.419-06	2026-10-14 19:28:52.659-06
18	9	10	6	LP-I2388	2026-08-15	2028-09-13	6000.00	6000.00	0.24	1	disponible	\N	2026-10-14 19:28:52.667-06	2026-10-14 19:28:52.668-06
19	9	8	3	PS-S7790	2026-07-16	2028-09-13	3000.00	0.00	5.80	1	anulado	Lote registrado dos veces: ya había ingresado con la factura FV-1187.	2026-10-14 19:28:52.671-06	2026-10-14 19:28:52.68-06
7	4	9	5	BN-M330	2025-06-01	2026-09-24	3000.00	800.00	0.30	1	vencido	Vencimiento automático por fecha	2026-10-14 19:28:52.39-06	2026-10-14 19:28:52.686-06
14	7	7	6	LP-D0612	2026-06-06	2028-06-05	2500.00	1000.00	1.75	1	disponible	\N	2026-10-14 19:28:52.588-06	2026-10-14 19:28:52.698-06
16	8	8	3	PS-S7790	2026-07-16	2028-09-13	3000.00	2800.00	5.80	1	disponible	\N	2026-10-14 19:28:52.648-06	2026-10-14 19:28:52.71-06
17	8	6	5	BN-O205	2026-07-26	2028-07-15	15000.00	15000.00	0.44	3	cuarentena	Reclamo de calidad: cápsulas adheridas en varios blísteres. Se espera dictamen del laboratorio.	2026-10-14 19:28:52.654-06	2026-10-14 19:28:52.723-06
11	6	5	4	SN-C2231	2025-12-18	2028-02-26	2000.00	100.00	14.50	1	bloqueado	Retiro voluntario del lote notificado por Sanofi (alerta sanitaria). Avisar a las instituciones que lo recibieron.	2026-10-14 19:28:52.498-06	2026-10-14 19:28:52.725-06
13	7	5	4	SN-C2410	2026-05-17	2028-06-25	1200.00	1000.00	14.20	2	disponible	\N	2026-10-14 19:28:52.584-06	2026-10-14 20:06:08.845-06
\.


--
-- Data for Name: modalidades_compra; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.modalidades_compra (id_modalidad, nombre, descripcion, activo, "createdAt", "updatedAt") FROM stdin;
1	Baja cuantía	\N	t	2026-10-12 23:19:47.392-06	2026-10-12 23:19:47.392-06
2	Compra directa	\N	t	2026-10-12 23:19:47.4-06	2026-10-12 23:19:47.4-06
3	Cotización	\N	t	2026-10-12 23:19:47.405-06	2026-10-12 23:19:47.405-06
4	Licitación pública	\N	t	2026-10-12 23:19:47.411-06	2026-10-12 23:19:47.411-06
5	Contrato abierto	\N	t	2026-10-12 23:19:47.419-06	2026-10-12 23:19:47.419-06
6	Procedimiento de excepción	\N	t	2026-10-12 23:19:47.425-06	2026-10-12 23:19:47.425-06
7	Subasta electrónica inversa	\N	t	2026-10-12 23:19:47.43-06	2026-10-12 23:19:47.43-06
\.


--
-- Data for Name: motivos_movimiento; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.motivos_movimiento (id_motivo, codigo, nombre, tipo, sistema, activo, "createdAt", "updatedAt") FROM stdin;
1	COMPRA	Ingreso por compra	entrada	t	t	2026-10-12 23:19:47.443-06	2026-10-12 23:19:47.443-06
2	DESPACHO	Despacho de pedido	salida	t	t	2026-10-12 23:19:47.452-06	2026-10-12 23:19:47.452-06
3	ANULACION_PEDIDO	Reingreso por anulación de pedido	entrada	t	t	2026-10-12 23:19:47.456-06	2026-10-12 23:19:47.456-06
4	ANULACION_INGRESO	Salida por anulación de ingreso	salida	t	t	2026-10-12 23:19:47.459-06	2026-10-12 23:19:47.459-06
5	RESTAURACION_INGRESO	Reingreso por restauración de ingreso	entrada	t	t	2026-10-12 23:19:47.462-06	2026-10-12 23:19:47.462-06
6	AJUSTE_POSITIVO	Ajuste por inventario físico (sobrante)	entrada	f	t	2026-10-12 23:19:47.465-06	2026-10-12 23:19:47.465-06
7	DEVOLUCION_CLIENTE	Devolución de institución	entrada	f	t	2026-10-12 23:19:47.468-06	2026-10-12 23:19:47.468-06
8	AJUSTE_NEGATIVO	Ajuste por inventario físico (faltante)	salida	f	t	2026-10-12 23:19:47.472-06	2026-10-12 23:19:47.472-06
9	MERMA	Merma o daño	salida	f	t	2026-10-12 23:19:47.475-06	2026-10-12 23:19:47.475-06
10	DESTRUCCION	Destrucción por vencimiento	salida	f	t	2026-10-12 23:19:47.48-06	2026-10-12 23:19:47.48-06
11	DEVOLUCION_PROVEEDOR	Devolución a proveedor	salida	f	t	2026-10-12 23:19:47.483-06	2026-10-12 23:19:47.483-06
12	ANULACION_LOTE	Salida por anulación de lote	salida	t	t	2026-10-14 19:25:13.814-06	2026-10-14 19:25:13.814-06
13	RESTAURACION_LOTE	Reingreso por restauración de lote	entrada	t	t	2026-10-14 19:25:13.997-06	2026-10-14 19:25:13.997-06
\.


--
-- Data for Name: movimientos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.movimientos (id_movimiento, id_lote, id_usuario, tipo_movimiento, id_motivo, cantidad, saldo, fecha_movimiento, id_ingreso, id_pedido, observacion, "createdAt", "updatedAt") FROM stdin;
1	1	1	entrada	1	200.00	200.00	2026-10-12 23:19:52.892-06	1	\N	Factura A-1001	2026-10-12 23:19:52.893-06	2026-10-12 23:19:52.893-06
2	2	1	entrada	1	5000.00	5000.00	2026-10-12 23:19:52.902-06	1	\N	Factura A-1001	2026-10-12 23:19:52.902-06	2026-10-12 23:19:52.902-06
3	3	1	entrada	1	300.00	300.00	2026-10-12 23:19:52.928-06	2	\N	Factura FAC-55890	2026-10-12 23:19:52.928-06	2026-10-12 23:19:52.928-06
4	4	1	entrada	1	10000.00	10000.00	2026-10-12 23:19:52.936-06	2	\N	Factura FAC-55890	2026-10-12 23:19:52.936-06	2026-10-12 23:19:52.936-06
5	5	1	entrada	1	150.00	150.00	2026-10-12 23:19:52.981-06	3	\N	Factura A-1042	2026-10-12 23:19:52.981-06	2026-10-12 23:19:52.981-06
6	6	1	entrada	1	3000.00	3000.00	2026-10-12 23:19:52.99-06	3	\N	Factura A-1042	2026-10-12 23:19:52.991-06	2026-10-12 23:19:52.991-06
7	7	2	entrada	1	3000.00	3000.00	2025-08-20 08:30:00-06	4	\N	Factura FV-1120	2026-10-14 19:28:52.4-06	2026-10-14 19:28:52.405-06
8	8	2	entrada	1	2500.00	2500.00	2025-08-20 08:30:00-06	4	\N	Factura FV-1120	2026-10-14 19:28:52.421-06	2026-10-14 19:28:52.423-06
9	9	2	entrada	1	2000.00	2000.00	2025-11-28 08:30:00-06	5	\N	Factura A-0890	2026-10-14 19:28:52.447-06	2026-10-14 19:28:52.448-06
10	10	2	entrada	1	4000.00	4000.00	2025-11-28 08:30:00-06	5	\N	Factura A-0890	2026-10-14 19:28:52.454-06	2026-10-14 19:28:52.455-06
11	10	2	salida	2	1500.00	2500.00	2025-12-25 10:30:00-06	\N	2	PED-2025-00002 · Contrato DASJ-BC-044-2025	2026-10-14 19:28:52.478-06	2026-10-14 19:28:52.479-06
12	7	2	salida	2	1000.00	2000.00	2025-12-25 10:30:00-06	\N	2	PED-2025-00002 · Contrato DASJ-BC-044-2025	2026-10-14 19:28:52.483-06	2026-10-14 19:28:52.484-06
13	9	2	salida	2	300.00	1700.00	2025-12-25 10:30:00-06	\N	2	PED-2025-00002 · Contrato DASJ-BC-044-2025	2026-10-14 19:28:52.489-06	2026-10-14 19:28:52.49-06
14	11	2	entrada	1	2000.00	2000.00	2026-02-16 08:30:00-06	6	\N	Factura B-3301	2026-10-14 19:28:52.5-06	2026-10-14 19:28:52.501-06
15	12	2	entrada	1	20000.00	20000.00	2026-02-16 08:30:00-06	6	\N	Factura B-3301	2026-10-14 19:28:52.505-06	2026-10-14 19:28:52.506-06
16	12	2	salida	2	3000.00	17000.00	2026-03-04 10:30:00-06	\N	3	PED-2026-00003 · Contrato IGSS-CA-118-2025	2026-10-14 19:28:52.516-06	2026-10-14 19:28:52.518-06
17	8	2	salida	2	400.00	2100.00	2026-03-04 10:30:00-06	\N	3	PED-2026-00003 · Contrato IGSS-CA-118-2025	2026-10-14 19:28:52.522-06	2026-10-14 19:28:52.523-06
18	11	2	salida	2	500.00	1500.00	2026-04-13 10:30:00-06	\N	4	PED-2026-00004 · Contrato HR-LP-007-2026	2026-10-14 19:28:52.542-06	2026-10-14 19:28:52.543-06
19	12	2	salida	2	4000.00	13000.00	2026-04-13 10:30:00-06	\N	4	PED-2026-00004 · Contrato HR-LP-007-2026	2026-10-14 19:28:52.546-06	2026-10-14 19:28:52.547-06
20	8	2	salida	2	500.00	1600.00	2026-04-13 10:30:00-06	\N	4	PED-2026-00004 · Contrato HR-LP-007-2026	2026-10-14 19:28:52.549-06	2026-10-14 19:28:52.55-06
21	11	2	salida	2	400.00	1100.00	2026-06-02 10:30:00-06	\N	5	PED-2026-00005 · Contrato HRZ-COT-031-2026	2026-10-14 19:28:52.572-06	2026-10-14 19:28:52.573-06
22	8	2	salida	2	300.00	1300.00	2026-06-02 10:30:00-06	\N	5	PED-2026-00005 · Contrato HRZ-COT-031-2026	2026-10-14 19:28:52.577-06	2026-10-14 19:28:52.577-06
23	13	2	entrada	1	1200.00	1200.00	2026-06-16 08:30:00-06	7	\N	Factura A-0951	2026-10-14 19:28:52.586-06	2026-10-14 19:28:52.587-06
24	14	2	entrada	1	2500.00	2500.00	2026-06-16 08:30:00-06	7	\N	Factura A-0951	2026-10-14 19:28:52.59-06	2026-10-14 19:28:52.591-06
25	15	2	entrada	1	1500.00	1500.00	2026-06-16 08:30:00-06	7	\N	Factura A-0951	2026-10-14 19:28:52.593-06	2026-10-14 19:28:52.594-06
26	10	2	salida	2	1000.00	1500.00	2026-07-02 10:30:00-06	\N	6	PED-2026-00006 · Contrato DASJ-BC-044-2025	2026-10-14 19:28:52.6-06	2026-10-14 19:28:52.601-06
27	15	2	salida	2	800.00	700.00	2026-07-02 10:30:00-06	\N	6	PED-2026-00006 · Contrato DASJ-BC-044-2025	2026-10-14 19:28:52.603-06	2026-10-14 19:28:52.604-06
28	12	2	salida	2	3000.00	10000.00	2026-07-12 10:30:00-06	\N	7	PED-2026-00007 · Contrato IGSS-CA-118-2025	2026-10-14 19:28:52.614-06	2026-10-14 19:28:52.615-06
29	8	2	salida	2	400.00	900.00	2026-07-12 10:30:00-06	\N	7	PED-2026-00007 · Contrato IGSS-CA-118-2025	2026-10-14 19:28:52.619-06	2026-10-14 19:28:52.619-06
30	11	2	salida	2	400.00	700.00	2026-08-03 10:30:00-06	\N	8	PED-2026-00008 · Contrato HR-LP-007-2026	2026-10-14 19:28:52.629-06	2026-10-14 19:28:52.63-06
31	14	2	salida	2	1000.00	1500.00	2026-08-03 10:30:00-06	\N	8	PED-2026-00008 · Contrato HR-LP-007-2026	2026-10-14 19:28:52.634-06	2026-10-14 19:28:52.635-06
32	8	2	salida	2	600.00	300.00	2026-08-03 10:30:00-06	\N	8	PED-2026-00008 · Contrato HR-LP-007-2026	2026-10-14 19:28:52.64-06	2026-10-14 19:28:52.641-06
33	16	2	entrada	1	3000.00	3000.00	2026-08-15 08:30:00-06	8	\N	Factura FV-1187	2026-10-14 19:28:52.651-06	2026-10-14 19:28:52.652-06
34	17	2	entrada	1	15000.00	15000.00	2026-08-15 08:30:00-06	8	\N	Factura FV-1187	2026-10-14 19:28:52.656-06	2026-10-14 19:28:52.657-06
35	8	2	salida	9	20.00	280.00	2026-09-04 14:10:00-06	\N	\N	Frascos rotos al reacomodar la estantería	2026-10-14 19:28:52.66-06	2026-10-14 19:28:52.661-06
36	18	2	entrada	1	6000.00	6000.00	2026-09-19 08:30:00-06	9	\N	Factura B-3378	2026-10-14 19:28:52.669-06	2026-10-14 19:28:52.669-06
37	19	2	entrada	1	3000.00	3000.00	2026-09-19 08:30:00-06	9	\N	Factura B-3378	2026-10-14 19:28:52.673-06	2026-10-14 19:28:52.674-06
38	19	1	salida	12	3000.00	0.00	2026-09-20 09:05:00-06	9	\N	Lote registrado dos veces: ya había ingresado con la factura FV-1187.	2026-10-14 19:28:52.677-06	2026-10-14 19:28:52.678-06
39	7	2	salida	10	1200.00	800.00	2026-10-04 10:00:00-06	\N	\N	Acta de destrucción 014-2026 con supervisión del MSPAS	2026-10-14 19:28:52.688-06	2026-10-14 19:28:52.689-06
40	11	2	salida	2	300.00	400.00	2026-10-04 10:30:00-06	\N	9	PED-2026-00009 · Contrato HR-LP-007-2026	2026-10-14 19:28:52.695-06	2026-10-14 19:28:52.696-06
41	14	2	salida	2	500.00	1000.00	2026-10-04 10:30:00-06	\N	9	PED-2026-00009 · Contrato HR-LP-007-2026	2026-10-14 19:28:52.699-06	2026-10-14 19:28:52.699-06
42	11	2	salida	2	300.00	100.00	2026-10-08 10:30:00-06	\N	10	PED-2026-00010 · Contrato HRZ-COT-031-2026	2026-10-14 19:28:52.706-06	2026-10-14 19:28:52.707-06
43	16	2	salida	2	200.00	2800.00	2026-10-08 10:30:00-06	\N	10	PED-2026-00010 · Contrato HRZ-COT-031-2026	2026-10-14 19:28:52.711-06	2026-10-14 19:28:52.712-06
44	13	1	salida	2	200.00	1000.00	2026-10-14 20:06:08.896-06	\N	12	PED-2026-00012 · Hospital Roosevelt · Contrato HR-LP-007-2026	2026-10-14 20:06:08.897-06	2026-10-14 20:06:08.897-06
\.


--
-- Data for Name: parametros; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.parametros (clave, valor, descripcion, "createdAt", "updatedAt") FROM stdin;
VIGENCIA_MINIMA_INGRESO_MESES	12	Meses de vida útil mínima que debe tener un lote para poder ingresarlo.	2026-10-12 23:19:47.488-06	2026-10-12 23:19:47.488-06
VIGENCIA_MINIMA_DESPACHO_MESES	12	Meses de vida útil mínima al despachar, si el contrato no indica otra.	2026-10-12 23:19:47.492-06	2026-10-12 23:19:47.492-06
DIAS_SEMAFORO_ROJO	90	Días antes del vencimiento en que un lote pasa a estado crítico (rojo).	2026-10-12 23:19:47.495-06	2026-10-12 23:19:47.495-06
DIAS_SEMAFORO_AMARILLO	180	Días antes del vencimiento en que un lote pasa a alerta (amarillo).	2026-10-12 23:19:47.499-06	2026-10-12 23:19:47.499-06
DIAS_ALERTA_CONTRATO	30	Días antes de su fin en que un contrato con saldo pendiente aparece en alertas.	2026-10-12 23:19:47.503-06	2026-10-12 23:19:47.503-06
DIAS_ALERTA_PEDIDO	5	Días antes de la fecha programada en que un pedido que no ha salido de bodega aparece en alertas.	2026-10-14 19:25:14.031-06	2026-10-14 19:25:14.031-06
\.


--
-- Data for Name: pedidos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.pedidos (id_pedido, id_contrato, id_usuario, numero_pedido, fecha_pedido, fecha_programada, fecha_real_entrega, estado, monto_total, observaciones, "createdAt", "updatedAt") FROM stdin;
1	1	1	PED-2026-00001	2026-10-12	2026-10-17	\N	pendiente	3750.00	\N	2026-10-12 23:19:53.175-06	2026-10-12 23:19:53.175-06
2	4	3	PED-2025-00002	2025-12-18	2025-12-28	2026-01-03	entregado	2820.00	Primera entrega del contrato	2026-10-14 19:28:52.465-06	2026-10-14 19:28:52.465-06
3	3	3	PED-2026-00003	2026-02-26	2026-03-08	2026-03-07	entregado	7450.00	\N	2026-10-14 19:28:52.51-06	2026-10-14 19:28:52.51-06
4	5	3	PED-2026-00004	2026-04-07	2026-04-17	2026-04-17	entregado	22100.00	\N	2026-10-14 19:28:52.536-06	2026-10-14 19:28:52.536-06
5	6	3	PED-2026-00005	2026-05-27	2026-06-06	2026-06-06	entregado	13740.00	\N	2026-10-14 19:28:52.566-06	2026-10-14 19:28:52.566-06
6	4	3	PED-2026-00006	2026-06-26	2026-07-06	2026-07-08	entregado	1200.00	\N	2026-10-14 19:28:52.597-06	2026-10-14 19:28:52.597-06
7	3	3	PED-2026-00007	2026-07-06	2026-07-16	2026-07-16	entregado	7450.00	\N	2026-10-14 19:28:52.61-06	2026-10-14 19:28:52.61-06
8	5	3	PED-2026-00008	2026-07-26	2026-08-05	2026-08-09	entregado	20750.00	El transporte se retrasó por un desperfecto mecánico	2026-10-14 19:28:52.625-06	2026-10-14 19:28:52.625-06
9	5	3	PED-2026-00009	2026-10-02	2026-10-11	\N	empacado	9675.00	Esperando transporte disponible	2026-10-14 19:28:52.691-06	2026-10-14 19:28:52.691-06
10	6	3	PED-2026-00010	2026-10-06	2026-10-15	\N	en_transporte	10010.00	\N	2026-10-14 19:28:52.703-06	2026-10-14 19:28:52.703-06
11	5	3	PED-2026-00011	2026-10-12	2026-10-16	\N	pendiente	5100.00	\N	2026-10-14 19:28:52.716-06	2026-10-14 19:28:52.716-06
13	5	1	PED-2026-00013	2026-10-14	2026-10-21	\N	pendiente	4165.00	\N	2026-10-14 20:05:32.33-06	2026-10-14 20:05:32.33-06
12	5	3	PED-2026-00012	2026-10-13	2026-11-03	2026-10-14	entregado	5200.00	\N	2026-10-14 19:28:52.719-06	2026-10-14 20:07:47.441-06
\.


--
-- Data for Name: productos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.productos (id_producto, codigo, nombre, descripcion, id_forma_farmaceutica, concentracion, id_unidad_medida, stock_minimo, activo, "createdAt", "updatedAt") FROM stdin;
1	MED-001	Lidocaína	\N	3	2%	5	200	t	2026-10-12 23:19:52.768-06	2026-10-12 23:19:52.768-06
2	MED-002	Amoxicilina	\N	2	500 mg	3	1000	t	2026-10-12 23:19:52.789-06	2026-10-12 23:19:52.789-06
3	MED-003	Acetaminofén	\N	1	500 mg	2	2000	t	2026-10-12 23:19:52.815-06	2026-10-12 23:19:52.815-06
4	MQ-001	Gasa estéril	\N	14	10 x 10 cm	1	500	t	2026-10-12 23:19:52.837-06	2026-10-12 23:19:52.837-06
5	MED-010	Ceftriaxona	\N	4	1 g	5	300	t	2026-10-14 19:28:52.314-06	2026-10-14 19:28:52.314-06
6	MED-011	Omeprazol	\N	2	20 mg	3	2000	t	2026-10-14 19:28:52.326-06	2026-10-14 19:28:52.326-06
7	MED-012	Diclofenaco sódico	\N	3	75 mg/3 ml	4	500	t	2026-10-14 19:28:52.333-06	2026-10-14 19:28:52.333-06
8	MED-013	Cloruro de sodio	\N	3	0.9% 500 ml	6	400	t	2026-10-14 19:28:52.337-06	2026-10-14 19:28:52.337-06
9	MED-014	Metformina	\N	1	850 mg	2	3000	t	2026-10-14 19:28:52.343-06	2026-10-14 19:28:52.343-06
10	MED-015	Ibuprofeno	\N	1	400 mg	2	1000	t	2026-10-14 19:28:52.348-06	2026-10-14 19:28:52.348-06
\.


--
-- Data for Name: proveedores; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.proveedores (id_proveedor, nombre, nit, direccion, telefono, email, contacto, activo, "createdAt", "updatedAt") FROM stdin;
1	Distribuidora Farmacéutica Centroamericana, S.A.	1234567-8	\N	2222-0000	\N	\N	t	2026-10-12 23:19:52.728-06	2026-10-12 23:19:52.728-06
2	Droguería Nacional, S.A.	7654321-0	\N	2222-0000	\N	\N	t	2026-10-12 23:19:52.744-06	2026-10-12 23:19:52.744-06
3	Comercializadora Médica de Occidente, S.A.	4567890-1	\N	7761-2040	\N	Sofía Ramírez	t	2026-10-14 19:28:52.288-06	2026-10-14 19:28:52.288-06
4	Farmacéutica del Valle, S.A.	5678901-2	\N	2433-8810	\N	Jorge Aldana	t	2026-10-14 19:28:52.295-06	2026-10-14 19:28:52.295-06
\.


--
-- Data for Name: seguimiento_pedidos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.seguimiento_pedidos (id_seguimiento, id_pedido, estado, id_usuario, observacion, fecha) FROM stdin;
1	1	pendiente	1	Pedido registrado	2026-10-12 23:19:53.18-06
2	2	pendiente	3	Pedido registrado	2025-12-18 09:15:00-06
3	2	en_preparacion	2	Lotes asignados por FEFO	2025-12-25 10:30:00-06
4	2	empacado	2	\N	2025-12-26 11:45:00-06
5	2	en_transporte	2	Transporte propio, guía de envío adjunta	2026-01-01 13:00:00-06
6	2	entregado	3	Recibido conforme por farmacia de la institución	2026-01-03 15:30:00-06
7	3	pendiente	3	Pedido registrado	2026-02-26 09:15:00-06
8	3	en_preparacion	2	Lotes asignados por FEFO	2026-03-04 10:30:00-06
9	3	empacado	2	\N	2026-03-05 11:45:00-06
10	3	en_transporte	2	Transporte propio, guía de envío adjunta	2026-03-06 13:00:00-06
11	3	entregado	3	Recibido conforme por farmacia de la institución	2026-03-07 15:30:00-06
12	4	pendiente	3	Pedido registrado	2026-04-07 09:15:00-06
13	4	en_preparacion	2	Lotes asignados por FEFO	2026-04-13 10:30:00-06
14	4	empacado	2	\N	2026-04-14 11:45:00-06
15	4	en_transporte	2	Transporte propio, guía de envío adjunta	2026-04-16 13:00:00-06
16	4	entregado	3	Recibido conforme por farmacia de la institución	2026-04-17 15:30:00-06
17	5	pendiente	3	Pedido registrado	2026-05-27 09:15:00-06
18	5	en_preparacion	2	Lotes asignados por FEFO	2026-06-02 10:30:00-06
19	5	empacado	2	\N	2026-06-03 11:45:00-06
20	5	en_transporte	2	Transporte propio, guía de envío adjunta	2026-06-05 13:00:00-06
21	5	entregado	3	Recibido conforme por farmacia de la institución	2026-06-06 15:30:00-06
22	6	pendiente	3	Pedido registrado	2026-06-26 09:15:00-06
23	6	en_preparacion	2	Lotes asignados por FEFO	2026-07-02 10:30:00-06
24	6	empacado	2	\N	2026-07-03 11:45:00-06
25	6	en_transporte	2	Transporte propio, guía de envío adjunta	2026-07-07 13:00:00-06
26	6	entregado	3	Recibido conforme por farmacia de la institución	2026-07-08 15:30:00-06
27	7	pendiente	3	Pedido registrado	2026-07-06 09:15:00-06
28	7	en_preparacion	2	Lotes asignados por FEFO	2026-07-12 10:30:00-06
29	7	empacado	2	\N	2026-07-13 11:45:00-06
30	7	en_transporte	2	Transporte propio, guía de envío adjunta	2026-07-15 13:00:00-06
31	7	entregado	3	Recibido conforme por farmacia de la institución	2026-07-16 15:30:00-06
32	8	pendiente	3	Pedido registrado	2026-07-26 09:15:00-06
33	8	en_preparacion	2	Lotes asignados por FEFO	2026-08-03 10:30:00-06
34	8	empacado	2	\N	2026-08-04 11:45:00-06
35	8	en_transporte	2	Transporte propio, guía de envío adjunta	2026-08-08 13:00:00-06
36	8	entregado	3	Recibido conforme por farmacia de la institución	2026-08-09 15:30:00-06
37	9	pendiente	3	Pedido registrado	2026-10-02 09:15:00-06
38	9	en_preparacion	2	Lotes asignados por FEFO	2026-10-04 10:30:00-06
39	9	empacado	2	\N	2026-10-10 11:45:00-06
40	10	pendiente	3	Pedido registrado	2026-10-06 09:15:00-06
41	10	en_preparacion	2	Lotes asignados por FEFO	2026-10-08 10:30:00-06
42	10	empacado	2	\N	2026-10-08 11:45:00-06
43	10	en_transporte	2	Transporte propio, guía de envío adjunta	2026-10-13 13:00:00-06
44	11	pendiente	3	Pedido registrado	2026-10-12 09:15:00-06
45	12	pendiente	3	Pedido registrado	2026-10-13 09:15:00-06
46	13	pendiente	1	Pedido registrado	2026-10-14 20:05:32.346-06
47	12	en_preparacion	1	Lotes asignados por FEFO	2026-10-14 20:06:08.909-06
48	12	empacado	1	Se empacó la factura en tal tal tal en doble caja sellado con tal tal	2026-10-14 20:07:15.686-06
49	12	en_transporte	1	Se enviocon numero de guia 14000 por cargo express	2026-10-14 20:07:39.77-06
50	12	entregado	1	Recibio conforme	2026-10-14 20:07:47.442-06
\.


--
-- Data for Name: tipos_institucion; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tipos_institucion (id_tipo_institucion, nombre, descripcion, activo, "createdAt", "updatedAt") FROM stdin;
1	Hospital nacional	\N	t	2026-10-12 23:19:47.361-06	2026-10-12 23:19:47.361-06
2	Hospital regional	\N	t	2026-10-12 23:19:47.366-06	2026-10-12 23:19:47.366-06
3	Centro de salud	\N	t	2026-10-12 23:19:47.369-06	2026-10-12 23:19:47.369-06
4	Puesto de salud	\N	t	2026-10-12 23:19:47.373-06	2026-10-12 23:19:47.373-06
5	Dirección de Área de Salud	\N	t	2026-10-12 23:19:47.376-06	2026-10-12 23:19:47.376-06
6	IGSS	\N	t	2026-10-12 23:19:47.379-06	2026-10-12 23:19:47.379-06
7	Institución privada	\N	t	2026-10-12 23:19:47.382-06	2026-10-12 23:19:47.382-06
8	Otra	\N	t	2026-10-12 23:19:47.385-06	2026-10-12 23:19:47.385-06
\.


--
-- Data for Name: ubicaciones; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ubicaciones (id_ubicacion, nombre, descripcion, activo, "createdAt", "updatedAt") FROM stdin;
1	Bodega general	\N	t	2026-10-12 23:19:47.225-06	2026-10-12 23:19:47.225-06
2	Cadena de frío	\N	t	2026-10-12 23:19:47.247-06	2026-10-12 23:19:47.247-06
3	Área de cuarentena	\N	t	2026-10-12 23:19:47.252-06	2026-10-12 23:19:47.252-06
4	Área de empaque	\N	t	2026-10-12 23:19:47.256-06	2026-10-12 23:19:47.256-06
5	Área de despacho	\N	t	2026-10-12 23:19:47.261-06	2026-10-12 23:19:47.261-06
\.


--
-- Data for Name: unidades_medida; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.unidades_medida (id_unidad_medida, nombre, descripcion, activo, "createdAt", "updatedAt") FROM stdin;
1	Unidad	\N	t	2026-10-12 23:19:47.314-06	2026-10-12 23:19:47.314-06
2	Tableta	\N	t	2026-10-12 23:19:47.319-06	2026-10-12 23:19:47.319-06
3	Cápsula	\N	t	2026-10-12 23:19:47.323-06	2026-10-12 23:19:47.323-06
4	Ampolla	\N	t	2026-10-12 23:19:47.327-06	2026-10-12 23:19:47.327-06
5	Vial	\N	t	2026-10-12 23:19:47.331-06	2026-10-12 23:19:47.331-06
6	Frasco	\N	t	2026-10-12 23:19:47.334-06	2026-10-12 23:19:47.334-06
7	Caja	\N	t	2026-10-12 23:19:47.338-06	2026-10-12 23:19:47.338-06
8	Blíster	\N	t	2026-10-12 23:19:47.342-06	2026-10-12 23:19:47.342-06
9	Sobre	\N	t	2026-10-12 23:19:47.345-06	2026-10-12 23:19:47.345-06
10	Tubo	\N	t	2026-10-12 23:19:47.349-06	2026-10-12 23:19:47.349-06
11	Rollo	\N	t	2026-10-12 23:19:47.352-06	2026-10-12 23:19:47.352-06
12	Galón	\N	t	2026-10-12 23:19:47.355-06	2026-10-12 23:19:47.355-06
\.


--
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.usuarios (id_usuario, nombre, apellido, email, password, rol, activo, "createdAt", "updatedAt") FROM stdin;
1	Gerardo	García	admin@asiafarma.com	$2b$10$.Bni9ykNfnGsSnzcZr4NVuH74Z1FfaZvNggOS79bPx4LydbiJ89nC	administrador	t	2026-10-12 23:19:47.615-06	2026-10-12 23:19:47.615-06
2	Luis	Pérez	bodega@asiafarma.com	$2b$10$SxFKm0onuyQkf1gpei10nOs1sPTTtQIh9jFZHOBNfIFiUPE9tiwly	bodeguero	t	2026-10-14 19:28:52.073-06	2026-10-14 19:28:52.073-06
3	Ana	López	contratos@asiafarma.com	$2b$10$qyF16KlwyEg1Qb/k.eYtJ.RSq6WnbTc9dFv3.4hwOuSlWlUwghgNW	encargado_contratos	t	2026-10-14 19:28:52.175-06	2026-10-14 19:28:52.175-06
4	Carlos	Méndez	gerencia@asiafarma.com	$2b$10$ZGG3b2UlnSt8lKtfhJiN4OaEGcCWR2do.AsleySjdu7R2y9ZGKjCG	gerente	t	2026-10-14 19:28:52.254-06	2026-10-14 19:28:52.254-06
\.


--
-- Name: adjuntos_id_adjunto_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.adjuntos_id_adjunto_seq', 1, false);


--
-- Name: asignaciones_lote_id_asignacion_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.asignaciones_lote_id_asignacion_seq', 22, true);


--
-- Name: auditoria_id_auditoria_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.auditoria_id_auditoria_seq', 70, true);


--
-- Name: contratos_id_contrato_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.contratos_id_contrato_seq', 6, true);


--
-- Name: detalle_contratos_id_detalle_contrato_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.detalle_contratos_id_detalle_contrato_seq', 16, true);


--
-- Name: detalle_pedidos_id_detalle_pedido_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.detalle_pedidos_id_detalle_pedido_seq', 29, true);


--
-- Name: formas_farmaceuticas_id_forma_farmaceutica_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.formas_farmaceuticas_id_forma_farmaceutica_seq', 14, true);


--
-- Name: ingresos_id_ingreso_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.ingresos_id_ingreso_seq', 9, true);


--
-- Name: instituciones_id_institucion_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.instituciones_id_institucion_seq', 5, true);


--
-- Name: laboratorios_id_laboratorio_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.laboratorios_id_laboratorio_seq', 6, true);


--
-- Name: lotes_id_lote_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.lotes_id_lote_seq', 19, true);


--
-- Name: modalidades_compra_id_modalidad_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.modalidades_compra_id_modalidad_seq', 7, true);


--
-- Name: motivos_movimiento_id_motivo_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.motivos_movimiento_id_motivo_seq', 13, true);


--
-- Name: movimientos_id_movimiento_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.movimientos_id_movimiento_seq', 44, true);


--
-- Name: pedidos_id_pedido_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.pedidos_id_pedido_seq', 13, true);


--
-- Name: productos_id_producto_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.productos_id_producto_seq', 10, true);


--
-- Name: proveedores_id_proveedor_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.proveedores_id_proveedor_seq', 4, true);


--
-- Name: seguimiento_pedidos_id_seguimiento_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.seguimiento_pedidos_id_seguimiento_seq', 50, true);


--
-- Name: tipos_institucion_id_tipo_institucion_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tipos_institucion_id_tipo_institucion_seq', 8, true);


--
-- Name: ubicaciones_id_ubicacion_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.ubicaciones_id_ubicacion_seq', 5, true);


--
-- Name: unidades_medida_id_unidad_medida_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.unidades_medida_id_unidad_medida_seq', 12, true);


--
-- Name: usuarios_id_usuario_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.usuarios_id_usuario_seq', 4, true);


--
-- Name: adjuntos adjuntos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.adjuntos
    ADD CONSTRAINT adjuntos_pkey PRIMARY KEY (id_adjunto);


--
-- Name: asignaciones_lote asignaciones_lote_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asignaciones_lote
    ADD CONSTRAINT asignaciones_lote_pkey PRIMARY KEY (id_asignacion);


--
-- Name: auditoria auditoria_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auditoria
    ADD CONSTRAINT auditoria_pkey PRIMARY KEY (id_auditoria);


--
-- Name: contratos contratos_numero_contrato_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contratos
    ADD CONSTRAINT contratos_numero_contrato_key UNIQUE (numero_contrato);


--
-- Name: contratos contratos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contratos
    ADD CONSTRAINT contratos_pkey PRIMARY KEY (id_contrato);


--
-- Name: detalle_contratos detalle_contratos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detalle_contratos
    ADD CONSTRAINT detalle_contratos_pkey PRIMARY KEY (id_detalle_contrato);


--
-- Name: detalle_pedidos detalle_pedidos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detalle_pedidos
    ADD CONSTRAINT detalle_pedidos_pkey PRIMARY KEY (id_detalle_pedido);


--
-- Name: formas_farmaceuticas formas_farmaceuticas_nombre_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.formas_farmaceuticas
    ADD CONSTRAINT formas_farmaceuticas_nombre_key UNIQUE (nombre);


--
-- Name: formas_farmaceuticas formas_farmaceuticas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.formas_farmaceuticas
    ADD CONSTRAINT formas_farmaceuticas_pkey PRIMARY KEY (id_forma_farmaceutica);


--
-- Name: ingresos ingresos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ingresos
    ADD CONSTRAINT ingresos_pkey PRIMARY KEY (id_ingreso);


--
-- Name: instituciones instituciones_nit_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instituciones
    ADD CONSTRAINT instituciones_nit_key UNIQUE (nit);


--
-- Name: instituciones instituciones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instituciones
    ADD CONSTRAINT instituciones_pkey PRIMARY KEY (id_institucion);


--
-- Name: laboratorios laboratorios_nombre_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.laboratorios
    ADD CONSTRAINT laboratorios_nombre_key UNIQUE (nombre);


--
-- Name: laboratorios laboratorios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.laboratorios
    ADD CONSTRAINT laboratorios_pkey PRIMARY KEY (id_laboratorio);


--
-- Name: lotes lotes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lotes
    ADD CONSTRAINT lotes_pkey PRIMARY KEY (id_lote);


--
-- Name: modalidades_compra modalidades_compra_nombre_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modalidades_compra
    ADD CONSTRAINT modalidades_compra_nombre_key UNIQUE (nombre);


--
-- Name: modalidades_compra modalidades_compra_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.modalidades_compra
    ADD CONSTRAINT modalidades_compra_pkey PRIMARY KEY (id_modalidad);


--
-- Name: motivos_movimiento motivos_movimiento_codigo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.motivos_movimiento
    ADD CONSTRAINT motivos_movimiento_codigo_key UNIQUE (codigo);


--
-- Name: motivos_movimiento motivos_movimiento_nombre_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.motivos_movimiento
    ADD CONSTRAINT motivos_movimiento_nombre_key UNIQUE (nombre);


--
-- Name: motivos_movimiento motivos_movimiento_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.motivos_movimiento
    ADD CONSTRAINT motivos_movimiento_pkey PRIMARY KEY (id_motivo);


--
-- Name: movimientos movimientos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimientos
    ADD CONSTRAINT movimientos_pkey PRIMARY KEY (id_movimiento);


--
-- Name: parametros parametros_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parametros
    ADD CONSTRAINT parametros_pkey PRIMARY KEY (clave);


--
-- Name: pedidos pedidos_numero_pedido_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pedidos
    ADD CONSTRAINT pedidos_numero_pedido_key UNIQUE (numero_pedido);


--
-- Name: pedidos pedidos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pedidos
    ADD CONSTRAINT pedidos_pkey PRIMARY KEY (id_pedido);


--
-- Name: productos productos_codigo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.productos
    ADD CONSTRAINT productos_codigo_key UNIQUE (codigo);


--
-- Name: productos productos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.productos
    ADD CONSTRAINT productos_pkey PRIMARY KEY (id_producto);


--
-- Name: proveedores proveedores_nit_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proveedores
    ADD CONSTRAINT proveedores_nit_key UNIQUE (nit);


--
-- Name: proveedores proveedores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proveedores
    ADD CONSTRAINT proveedores_pkey PRIMARY KEY (id_proveedor);


--
-- Name: seguimiento_pedidos seguimiento_pedidos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seguimiento_pedidos
    ADD CONSTRAINT seguimiento_pedidos_pkey PRIMARY KEY (id_seguimiento);


--
-- Name: tipos_institucion tipos_institucion_nombre_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipos_institucion
    ADD CONSTRAINT tipos_institucion_nombre_key UNIQUE (nombre);


--
-- Name: tipos_institucion tipos_institucion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipos_institucion
    ADD CONSTRAINT tipos_institucion_pkey PRIMARY KEY (id_tipo_institucion);


--
-- Name: ubicaciones ubicaciones_nombre_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ubicaciones
    ADD CONSTRAINT ubicaciones_nombre_key UNIQUE (nombre);


--
-- Name: ubicaciones ubicaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ubicaciones
    ADD CONSTRAINT ubicaciones_pkey PRIMARY KEY (id_ubicacion);


--
-- Name: unidades_medida unidades_medida_nombre_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unidades_medida
    ADD CONSTRAINT unidades_medida_nombre_key UNIQUE (nombre);


--
-- Name: unidades_medida unidades_medida_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unidades_medida
    ADD CONSTRAINT unidades_medida_pkey PRIMARY KEY (id_unidad_medida);


--
-- Name: usuarios usuarios_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key UNIQUE (email);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id_usuario);


--
-- Name: adjuntos_entidad_id_registro; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX adjuntos_entidad_id_registro ON public.adjuntos USING btree (entidad, id_registro);


--
-- Name: auditoria_fecha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX auditoria_fecha ON public.auditoria USING btree (fecha);


--
-- Name: auditoria_tabla_id_registro; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX auditoria_tabla_id_registro ON public.auditoria USING btree (tabla, id_registro);


--
-- Name: detalle_contratos_id_contrato_id_producto; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX detalle_contratos_id_contrato_id_producto ON public.detalle_contratos USING btree (id_contrato, id_producto);


--
-- Name: ingresos_id_proveedor_serie_factura_numero_factura; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ingresos_id_proveedor_serie_factura_numero_factura ON public.ingresos USING btree (id_proveedor, serie_factura, numero_factura);


--
-- Name: lotes_id_producto_fecha_vencimiento; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX lotes_id_producto_fecha_vencimiento ON public.lotes USING btree (id_producto, fecha_vencimiento);


--
-- Name: lotes_numero_lote; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX lotes_numero_lote ON public.lotes USING btree (numero_lote);


--
-- Name: adjuntos adjuntos_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.adjuntos
    ADD CONSTRAINT adjuntos_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.usuarios(id_usuario) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: asignaciones_lote asignaciones_lote_id_detalle_pedido_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asignaciones_lote
    ADD CONSTRAINT asignaciones_lote_id_detalle_pedido_fkey FOREIGN KEY (id_detalle_pedido) REFERENCES public.detalle_pedidos(id_detalle_pedido) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: asignaciones_lote asignaciones_lote_id_lote_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.asignaciones_lote
    ADD CONSTRAINT asignaciones_lote_id_lote_fkey FOREIGN KEY (id_lote) REFERENCES public.lotes(id_lote) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: auditoria auditoria_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auditoria
    ADD CONSTRAINT auditoria_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.usuarios(id_usuario) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: contratos contratos_id_institucion_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contratos
    ADD CONSTRAINT contratos_id_institucion_fkey FOREIGN KEY (id_institucion) REFERENCES public.instituciones(id_institucion) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: contratos contratos_id_modalidad_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contratos
    ADD CONSTRAINT contratos_id_modalidad_fkey FOREIGN KEY (id_modalidad) REFERENCES public.modalidades_compra(id_modalidad) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: contratos contratos_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contratos
    ADD CONSTRAINT contratos_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.usuarios(id_usuario) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: detalle_contratos detalle_contratos_id_contrato_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detalle_contratos
    ADD CONSTRAINT detalle_contratos_id_contrato_fkey FOREIGN KEY (id_contrato) REFERENCES public.contratos(id_contrato) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: detalle_contratos detalle_contratos_id_producto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detalle_contratos
    ADD CONSTRAINT detalle_contratos_id_producto_fkey FOREIGN KEY (id_producto) REFERENCES public.productos(id_producto) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: detalle_pedidos detalle_pedidos_id_detalle_contrato_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detalle_pedidos
    ADD CONSTRAINT detalle_pedidos_id_detalle_contrato_fkey FOREIGN KEY (id_detalle_contrato) REFERENCES public.detalle_contratos(id_detalle_contrato) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: detalle_pedidos detalle_pedidos_id_pedido_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detalle_pedidos
    ADD CONSTRAINT detalle_pedidos_id_pedido_fkey FOREIGN KEY (id_pedido) REFERENCES public.pedidos(id_pedido) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: detalle_pedidos detalle_pedidos_id_producto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.detalle_pedidos
    ADD CONSTRAINT detalle_pedidos_id_producto_fkey FOREIGN KEY (id_producto) REFERENCES public.productos(id_producto) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ingresos ingresos_id_proveedor_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ingresos
    ADD CONSTRAINT ingresos_id_proveedor_fkey FOREIGN KEY (id_proveedor) REFERENCES public.proveedores(id_proveedor) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ingresos ingresos_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ingresos
    ADD CONSTRAINT ingresos_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.usuarios(id_usuario) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: instituciones instituciones_id_tipo_institucion_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.instituciones
    ADD CONSTRAINT instituciones_id_tipo_institucion_fkey FOREIGN KEY (id_tipo_institucion) REFERENCES public.tipos_institucion(id_tipo_institucion) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: lotes lotes_id_ingreso_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lotes
    ADD CONSTRAINT lotes_id_ingreso_fkey FOREIGN KEY (id_ingreso) REFERENCES public.ingresos(id_ingreso) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: lotes lotes_id_laboratorio_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lotes
    ADD CONSTRAINT lotes_id_laboratorio_fkey FOREIGN KEY (id_laboratorio) REFERENCES public.laboratorios(id_laboratorio) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: lotes lotes_id_producto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lotes
    ADD CONSTRAINT lotes_id_producto_fkey FOREIGN KEY (id_producto) REFERENCES public.productos(id_producto) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: lotes lotes_id_ubicacion_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lotes
    ADD CONSTRAINT lotes_id_ubicacion_fkey FOREIGN KEY (id_ubicacion) REFERENCES public.ubicaciones(id_ubicacion) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: movimientos movimientos_id_ingreso_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimientos
    ADD CONSTRAINT movimientos_id_ingreso_fkey FOREIGN KEY (id_ingreso) REFERENCES public.ingresos(id_ingreso) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: movimientos movimientos_id_lote_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimientos
    ADD CONSTRAINT movimientos_id_lote_fkey FOREIGN KEY (id_lote) REFERENCES public.lotes(id_lote) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: movimientos movimientos_id_motivo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimientos
    ADD CONSTRAINT movimientos_id_motivo_fkey FOREIGN KEY (id_motivo) REFERENCES public.motivos_movimiento(id_motivo) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: movimientos movimientos_id_pedido_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimientos
    ADD CONSTRAINT movimientos_id_pedido_fkey FOREIGN KEY (id_pedido) REFERENCES public.pedidos(id_pedido) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: movimientos movimientos_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movimientos
    ADD CONSTRAINT movimientos_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.usuarios(id_usuario) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: pedidos pedidos_id_contrato_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pedidos
    ADD CONSTRAINT pedidos_id_contrato_fkey FOREIGN KEY (id_contrato) REFERENCES public.contratos(id_contrato) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: pedidos pedidos_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pedidos
    ADD CONSTRAINT pedidos_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.usuarios(id_usuario) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: productos productos_id_forma_farmaceutica_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.productos
    ADD CONSTRAINT productos_id_forma_farmaceutica_fkey FOREIGN KEY (id_forma_farmaceutica) REFERENCES public.formas_farmaceuticas(id_forma_farmaceutica) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: productos productos_id_unidad_medida_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.productos
    ADD CONSTRAINT productos_id_unidad_medida_fkey FOREIGN KEY (id_unidad_medida) REFERENCES public.unidades_medida(id_unidad_medida) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: seguimiento_pedidos seguimiento_pedidos_id_pedido_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seguimiento_pedidos
    ADD CONSTRAINT seguimiento_pedidos_id_pedido_fkey FOREIGN KEY (id_pedido) REFERENCES public.pedidos(id_pedido) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: seguimiento_pedidos seguimiento_pedidos_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seguimiento_pedidos
    ADD CONSTRAINT seguimiento_pedidos_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.usuarios(id_usuario) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

