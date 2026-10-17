# Cómo cumple el sistema el documento "Casos y lo que falta"

Relación entre lo que pide el documento (casos, reglas, informes, conclusiones y recomendaciones) y dónde se resuelve en el sistema. Estado al 14/10/2026.

## Las cuatro preguntas (en menos de un minuto)

| Pregunta | Dónde se contesta |
|---|---|
| ¿Qué lotes tengo, cuánto me queda y cuándo vencen? | **Lotes**, informe *Existencias por lote*, buscador del panel (acepta lector de código de barras) |
| Si se retira un lote, ¿cuánto queda y a quién se entregó? | **Trazabilidad**, informe *Instituciones que recibieron un lote* (con contacto de cada institución) |
| ¿Cómo voy con cada contrato? | **Contratos** (avance por renglón), informe *Avance de contratos por renglón* |
| ¿Quién registró, cambió o anuló un dato y cuánto valía antes? | **Auditoría**, informes *Bitácora* y *Registros anulados* |

El panel de control tiene la tarjeta "Respuestas en un minuto" con un acceso directo a cada una.

## Casos de uso

| Caso | Estado |
|---|---|
| 1. Lidocaína de dos casas farmacéuticas | Cumplido: cada ingreso crea un lote nuevo con casa farmacéutica, proveedor y factura; el producto muestra sus lotes agrupados. |
| 2. Proveedor con poca vigencia | Cumplido: vida útil mínima validada en el navegador y en el servidor. El "ingreso con excepción" queda pendiente de la decisión del ingeniero. |
| 3. Fecha de vencimiento mal digitada | Cumplido: solo el administrador cambia fechas, con motivo obligatorio y valor anterior/nuevo en la bitácora. |
| 4. Pedido de 400 unidades (FEFO) | Cumplido: el sistema elige los lotes, excluye vencidos, en cuarentena y los que no cumplen la vida útil del contrato. **Nuevo:** si falta mercadería, "Ajustar el pedido a lo disponible" reduce el pedido y devuelve el resto al saldo del contrato. **Nuevo:** informe y alerta *Lotes por vencer sin destino*. |
| 5. Contrato sin saldo | Cumplido: el pedido no puede exceder el saldo de cada renglón; el precio sale del contrato. |
| 6. Pedido atrasado | Cumplido: el retraso se calcula solo, aparece en rojo en el panel y en los informes; reprogramar exige motivo. **Nuevo:** el encargado de contratos registra la entrega, como dice el documento. |
| 9. Lote registrado por error | **Nuevo:** botón "Anular" por lote (solo administrador, con motivo, sin salidas) y "Restaurar". Antes solo se podía anular la factura completa. |

## Conclusiones y recomendaciones

| Punto | Cómo se atiende |
|---|---|
| Objetivo 1, trazabilidad por lote | Kárdex por lote ligado a factura, pedido, contrato, institución y usuario; seguimiento por etapa del despacho. |
| Objetivo 2, alertas de contratos y % de avance | Alerta de contratos por vencer con saldo; avance calculado contra lo entregado. |
| Objetivo 3, fecha programada contra fecha real | Días de retraso por pedido; clasificación a tiempo / con retraso / pendiente; indicadores en el panel. |
| Recomendación: lector de código de barras | El buscador del panel acepta la lectura del lector (escribe el número y Enter) y abre la trazabilidad del lote. |
| Recomendación: revisión diaria de vencimientos | El panel muestra al bodeguero "Lo que tienes pendiente", con lotes en alerta y lotes sin destino. |
| Recomendación: métricas de cumplimiento | Panel: % de entregas a tiempo, retraso promedio y % de contratos cerrados cumplidos (últimos 12 meses). Informes *Cumplimiento de entregas por institución* y *Cumplimiento por tipo de contrato*; después de la entrevista de contratos: *Prórrogas y notas técnicas*, *Oficios de advertencia por institución* y *Devoluciones de instituciones*. |
| Recomendación: alerta preventiva de 5 días | Parámetro `DIAS_ALERTA_PEDIDO` (5 por defecto): pedidos que siguen en bodega y se entregan en 5 días o menos aparecen en el panel, en la lista de pedidos y en el informe *Entregas próximas sin despachar*. |
| Recomendación: integración con MSPAS / otras sucursales | Fase futura, fuera del alcance actual. |

## Informes (30)

Cada informe muestra la pregunta que contesta. Los 19 del documento están cubiertos; se agregaron *Ventas por producto*, *Existencias por lote*, *Existencias por casa farmacéutica*, *Lotes por vencer sin destino*, *Lotes vencidos y dados de baja*, *Instituciones que recibieron un lote*, *Registros anulados*, *Entregas próximas sin despachar* y *Cumplimiento por tipo de contrato*; después de la entrevista de contratos: *Prórrogas y notas técnicas*, *Oficios de advertencia por institución* y *Devoluciones de instituciones*.

## Documento "Cosas por mejorar" (pruebas del 15 y 16/10/2026)

| Caso | Cómo se resolvió |
|---|---|
| Al elegir un informe que está abajo en la lista, la pantalla no regresaba | Al elegir un informe la vista sube hasta él, y al generarlo baja hasta el resultado. |
| La institución devolvió los 400 de un pedido: el kárdex lo mostraba, pero el pedido seguía como entregado y no se sabía de qué lote ni de qué pedido venía | La devolución ya no es un ajuste manual: se registra desde el pedido entregado (**Registrar devolución**), lote por lote, con causa y acta. El producto regresa al lote del que salió, el movimiento del kárdex queda ligado al pedido, el pedido muestra *Devolución parcial* o *Devuelto completo* y la cantidad vuelve al saldo del contrato. Se puede poner el lote en cuarentena para revisarlo. |
| ¿Y si la devolución fue por error? | El administrador **anula la devolución**: el producto vuelve a salir del lote y cuenta otra vez como entregado. |
| Contrato vencido con saldo (baja cuantía) | El informe muestra días vencido en positivo, unidades sin entregar, si el saldo obligaba a la institución, la prórroga y qué sigue (ya no se puede entregar). Ver `entrevista-gestion-contratos.md`. |
| Con 10,000 disponibles se pudieron pedir 10,500 en dos pedidos | Al crear un pedido no se puede pedir más de la existencia apta (con la vida útil del contrato) menos lo ya comprometido en otros pedidos pendientes. El formulario muestra *Disponible en bodega* por renglón. |

## Entrevista sobre la gestión de contratos

Prórrogas, notas técnicas, oficios de advertencia, carta de compromiso, días hábiles, rango de monto y plazo de entrega por modalidad: ver `entrevista-gestion-contratos.md`.

## Pendiente de decidir

- **Ajustes de inventario del bodeguero.** La tabla de roles del documento indica que el bodeguero no ajusta inventario, pero hoy puede registrar ajustes (merma, devoluciones). No se cambió: hay que confirmarlo con el ingeniero.
- **Ingreso con excepción** (caso 2): pendiente de autorización del ingeniero.

## Datos de demostración

`npm run seed:historial` (en `backend/`) carga unos 10 meses de operación y un usuario por rol:
`bodega@asiafarma.com / bodega123`, `contratos@asiafarma.com / contratos123`, `gerencia@asiafarma.com / gerencia123`.
