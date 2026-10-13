# ASIAFARMA — Modelo de datos y flujos

Referencia para actualizar los diagramas del proyecto (entidad-relación, flujo de inventario y trazabilidad). Los diagramas están en Mermaid: GitHub y VS Code (extensión "Markdown Preview Mermaid Support") los dibujan directamente.

## Diagrama entidad-relación

```mermaid
erDiagram
    PROVEEDOR ||--o{ INGRESO : "emite factura"
    USUARIO ||--o{ INGRESO : registra
    INGRESO ||--|{ LOTE : "cada línea crea un"
    PRODUCTO ||--o{ LOTE : "tiene"
    LABORATORIO ||--o{ LOTE : fabrica
    UBICACION ||--o{ LOTE : "almacena"
    FORMA_FARMACEUTICA ||--o{ PRODUCTO : ""
    UNIDAD_MEDIDA ||--o{ PRODUCTO : ""

    LOTE ||--o{ MOVIMIENTO : "kárdex"
    MOTIVO_MOVIMIENTO ||--o{ MOVIMIENTO : ""
    USUARIO ||--o{ MOVIMIENTO : registra
    INGRESO ||--o{ MOVIMIENTO : "origen (entrada)"
    PEDIDO ||--o{ MOVIMIENTO : "destino (salida)"

    TIPO_INSTITUCION ||--o{ INSTITUCION : ""
    INSTITUCION ||--o{ CONTRATO : adjudica
    MODALIDAD_COMPRA ||--o{ CONTRATO : ""
    CONTRATO ||--|{ DETALLE_CONTRATO : "renglones"
    PRODUCTO ||--o{ DETALLE_CONTRATO : ""

    CONTRATO ||--o{ PEDIDO : "se entrega en"
    PEDIDO ||--|{ DETALLE_PEDIDO : ""
    DETALLE_CONTRATO ||--o{ DETALLE_PEDIDO : "descuenta saldo"
    DETALLE_PEDIDO ||--|{ ASIGNACION_LOTE : "FEFO"
    LOTE ||--o{ ASIGNACION_LOTE : "sale de"
    PEDIDO ||--|{ SEGUIMIENTO_PEDIDO : "etapas"

    USUARIO ||--o{ AUDITORIA : "hizo el cambio"

    PROVEEDOR { string nit UK }
    INGRESO { string serie_factura string numero_factura date fecha_factura date fecha_recepcion enum estado }
    LOTE { string numero_lote date fecha_fabricacion date fecha_vencimiento decimal cantidad_recibida decimal cantidad_disponible decimal costo_unitario enum condicion }
    PRODUCTO { string codigo UK string nombre string concentracion int stock_minimo bool activo }
    MOVIMIENTO { enum tipo decimal cantidad decimal saldo datetime fecha }
    CONTRATO { string nog string numero_contrato UK date fecha_inicio date fecha_fin int vigencia_minima_meses enum estado }
    DETALLE_CONTRATO { int numero_renglon decimal cantidad_contratada decimal precio_unitario }
    PEDIDO { string numero_pedido UK date fecha_programada date fecha_real_entrega enum estado }
    ASIGNACION_LOTE { decimal cantidad }
    AUDITORIA { string tabla string id_registro string accion json datos_antes json datos_despues string motivo }
```

## Reglas principales

| Regla | Dónde se aplica |
|---|---|
| Un producto existe una sola vez (nombre + concentración + forma). Su existencia es la suma de sus lotes. | `productoController` |
| Un lote solo nace de un ingreso de compra (factura de un proveedor). Nunca se suma cantidad a un lote existente. | `ingresoController` |
| Vencimiento posterior a fabricación; fabricación no futura; vida útil mínima al ingresar (parámetro). | `services/inventario.js` y validación del modelo `Lote` |
| Las cantidades no se editan: toda entrada o salida es un movimiento con motivo de catálogo y saldo. | `services/inventario.js` |
| Las salidas por venta las decide el sistema por FEFO (vence primero, sale primero), respetando la vida útil mínima del contrato. | `proponerFEFO` |
| Un pedido no puede exceder el saldo del renglón del contrato. | `pedidoController.createPedido` |
| Nada se borra: se anula y se puede restaurar. Todo cambio queda en la auditoría con usuario, fecha, motivo, antes y después. | `utils/auditoria.js` |
| Cambiar fechas de un lote: solo administrador y con motivo obligatorio. | `loteController.updateLote` |
| Lotes vencidos y contratos con plazo terminado cambian de estado solos (cada hora). | `services/vencimientos.js` |

## Flujo de inventario

```mermaid
flowchart LR
    A[Factura del proveedor] -->|Ingreso de compra| B[Lote nuevo<br/>laboratorio, fechas, costo]
    B --> C{Condición}
    C -->|disponible| D[Existencia del producto]
    C -->|cuarentena / bloqueado / vencido| E[Existencia retenida]
    F[Contrato GUATECOMPRAS<br/>NOG + renglones] --> G[Pedido]
    G -->|Preparar: FEFO| H[Asignación de lotes<br/>+ movimiento de salida]
    D --> H
    H --> I[Empacado] --> J[En transporte] --> K[Entregado]
```

## Trazabilidad

```mermaid
flowchart LR
    L[Laboratorio] --> LO[Lote]
    P[Proveedor + factura] --> LO
    LO --> AS[Asignación FEFO] --> PE[Pedido] --> CO[Contrato / NOG] --> IN[Institución]
    PE --> SE[Seguimiento: etapas con fecha y usuario]
```

Búsqueda: laboratorio → producto → lote o rango de fechas de compra → instituciones que lo recibieron (pantalla Trazabilidad e informe "Distribución de lotes").

## Estados

- **Lote (condición):** disponible · cuarentena · bloqueado · agotado · vencido · anulado
- **Pedido:** pendiente → en_preparacion → empacado → en_transporte → entregado (o anulado). El retraso se calcula.
- **Contrato:** vigente · completado · vencido · cancelado · anulado
- **Ingreso:** registrado · anulado
