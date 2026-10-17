# Entrevista sobre la gestión de contratos: necesidades y cómo las cumple el sistema

**Objetivo de la entrevista:** conocer cómo se controlan los vencimientos, las entregas pendientes y el cumplimiento por tipo de contrato, para definir las necesidades del sistema.

Cada fila resume lo que respondió el entrevistado, la necesidad que se deriva para la droguería (el proveedor) y dónde se resuelve en el sistema. Estado al 16/10/2026.

## 1. Contratos vencidos con saldo pendiente

| Pregunta | Lo que respondió | Necesidad del sistema | Cómo se cumple |
|---|---|---|---|
| 1. Cómo se identifican | Hay dos tipos: **contrato abierto** (el proveedor administra sus entregas y el comprador no asume responsabilidad) y **licitación** (más de Q900 mil) o **cotización** (menos de Q900 mil). | Distinguir el tipo de contrato y si el saldo obliga a la institución. | Cada modalidad indica si es *contrato abierto*. El informe *Contratos vencidos con saldo pendiente* separa el saldo que la institución debía adquirir del saldo de contratos abiertos. |
| 2. Quién da seguimiento | El personal de la institución compradora. | Del lado de la droguería, el encargado de contratos. | Rol *Encargado de contratos*: registra pedidos, entregas, prórrogas y oficios. |
| 3. Cómo se verifican productos y cantidades pendientes | En licitación o cotización se debe comprar la cantidad exacta; en contrato abierto el comprador no ve el saldo salvo que el proveedor lo informe. | Llevar el saldo por renglón. | Avance por renglón (contratado, pedido, entregado, devuelto, saldo). |
| 4. Qué se hace con un contrato vencido con saldo | Si no se renueva, la institución compra por compra directa. | Indicar que el saldo ya no se puede entregar. | El informe muestra *Qué sigue*: ya no se entrega; se cierra o se negocia un contrato nuevo. |
| 5. Entregas después del vencimiento | **No.** La renovación debe ser antes del vencimiento; sin contrato vigente no hay presupuesto para pagar. | Bloquear entregas y compromisos después del fin del contrato. | No se crean pedidos de contratos vencidos ni con fecha posterior al fin; la carta de compromiso tampoco puede pasar del fin; la prórroga solo se solicita mientras el contrato está vigente. |
| 6. Prórrogas | El proveedor la solicita por medio de abogado y representante legal, con documentos de respaldo, para evitar sanción o la ejecución de la fianza. | Registrar la prórroga con causa, documento y resolución. | **Prórrogas** en el detalle del contrato: causa, número de expediente, nueva fecha y resolución. Al aprobarse cambia la fecha de fin; se adjuntan los documentos al contrato. |
| 8. Cuándo un contrato está cerrado | Se verifica en GUATECOMPRAS, donde se publica el estado. | Mantener el NOG y el estado. | Cada contrato tiene su NOG; el estado pasa a *completado* cuando se entrega todo o a *vencido* por fecha. |

## 2. Contratos próximos a vencer con productos pendientes

| Pregunta | Lo que respondió | Necesidad del sistema | Cómo se cumple |
|---|---|---|---|
| 9. Cómo se identifican | La unidad compradora revisa en GUATECOMPRAS si el contrato sigue vigente antes de comprar. | Alertar los contratos por vencer con saldo. | Alerta del panel e informe *Contratos próximos a vencer sin cumplir* (parámetro `DIAS_ALERTA_CONTRATO`). |
| 10. Con cuánta anticipación | Se puede pedir hasta el mismo día del vencimiento, pero no conviene: el proveedor tiene de 1 a 3 días para entregar, luego viene el ingreso a bodega y el trámite de pago. | Calcular el último día útil para recibir pedidos. | **Último día recomendado para pedir** = fin del contrato menos el plazo de entrega en días hábiles. Aparece en el contrato, en el panel y en el informe. |
| 11. Quién revisa y con qué frecuencia | Compras, casi a diario. | Información a la vista. | Panel con alertas para el encargado de contratos. |
| 12. Productos y cantidades que faltan | Compras, bodega, farmacia o administración llevan su control; el proveedor el suyo. | El control propio de la droguería. | Avance por renglón y por pedido. |
| 13. Acciones antes del vencimiento | Si el contrato está por vencer, las órdenes se agilizan (por ejemplo cada 30 días en vez de cada 3 meses). | Avisar con tiempo para pedir que se agilicen las órdenes. | El contrato por vencer muestra cuánto falta y la fecha límite para pedir. |
| 14. Prioridad entre varios contratos | El proveedor llama a compras para que envíen las órdenes. | Ordenar por urgencia. | El informe y el panel se ordenan por fecha de fin. |
| 15. Si no se podrá entregar a tiempo | El proveedor solicita prórroga con los motivos (materia prima, producción, importación) y documentos. | Causas de fuerza mayor en la prórroga. | Causas del catálogo: falta de materia prima, producción, importación, otra fuerza mayor. |

## 3. Cumplimiento por tipo de contrato

| Pregunta | Lo que respondió | Necesidad del sistema | Cómo se cumple |
|---|---|---|---|
| 17. Modalidades | Baja cuantía (Q1 a Q25 mil), compra directa (Q25 mil a Q90 mil), cotización (Q90 mil a Q900 mil), licitación pública (más de Q900 mil). | Rango de monto por modalidad. | Catálogo *Modalidades de compra* con monto mínimo y máximo; el formulario de contrato avisa si el monto no corresponde (no lo impide, porque el contrato puede ser parte del evento). |
| 18. Quién controla las entregas | Bodega, cuando son insumos. | Recepción registrada por pedido. | Recorrido del pedido hasta *entregado*, con fecha real. |
| 19. Fecha de referencia | Cualquier fecha; por lo general antes de fin de mes. | Una fecha comprometida por pedido. | Fecha programada de cada pedido. |
| 20. Días de retraso con entregas parciales | El proveedor envía una **carta de compromiso** con el tiempo que necesita; si no cumple, el retraso se cuenta **desde el día hábil siguiente** a la fecha indicada. | Carta de compromiso y retraso en días hábiles. | Botón *Carta de compromiso* en el pedido (antes de que se atrase y sin pasar del fin del contrato). El retraso se calcula en **días hábiles** (sin fines de semana ni asuetos) desde el día hábil siguiente a la fecha límite. |
| 21. Contrato cerrado y cumplido | Pedidos, entregas y pagos en el tiempo comprometido. | Indicador de contratos cumplidos. | Un contrato cerrado está cumplido si se entregó lo que la institución estaba obligada a adquirir y ningún pedido llegó tarde. Los **pagos** no se registran en el sistema (queda fuera del alcance). |
| 22. Prórrogas al evaluar cumplimiento | Las de fuerza mayor se aprueban rápido, sobre todo si la empresa tiene buen récord. | Que la prórroga aprobada no castigue. | La prórroga aprobada mueve el fin del contrato; el informe *Cumplimiento por tipo de contrato* muestra cuántos cerrados tuvieron prórroga. |
| 24. Qué comparar entre modalidades | Baja cuantía y compra directa: entrega de 1 a 3 días hábiles o anulan la orden y adjudican al segundo proveedor. En contrato abierto, si el proveedor no puede abastecer pide una **nota técnica** (30 días) y las unidades compran por baja cuantía o compra directa. | Plazo de entrega por modalidad y notas técnicas. | Cada modalidad tiene su plazo en días hábiles (parámetro `DIAS_HABILES_ENTREGA` si no lo tiene). Al crear un pedido se sugiere la fecha y se avisa si se pasa del plazo. **Notas técnicas** solo para contratos abiertos, por renglón; mientras están vigentes se avisa en el pedido. |
| 25. Retrasos frecuentes | La institución envía oficios de advertencia; después de 3 puede dejar de comprar (salvo contrato abierto). | Registrar oficios y alertar antes del límite. | **Oficios** en el detalle del contrato; alerta en el panel y en el contrato con uno antes del límite (parámetro `LIMITE_OFICIOS`); informe *Oficios de advertencia por institución*. |

## Informes nuevos o cambiados

- *Contratos vencidos con saldo pendiente*: días vencido, unidades sin entregar, si obligaba a la institución, prórroga y qué sigue.
- *Contratos próximos a vencer sin cumplir*: último día recomendado para pedir, obligación y prórroga.
- *Cumplimiento por tipo de contrato*: tipo (abierto o cantidad exacta), plazo de entrega y contratos cerrados con prórroga.
- *Prórrogas y notas técnicas* (nuevo).
- *Oficios de advertencia por institución* (nuevo).
- Los días de retraso de todos los informes ahora son **días hábiles**.

## Lo que queda fuera

- **Pagos** (P21): el sistema no registra el trámite de pago; un contrato se considera cumplido por pedidos y entregas.
- **Consulta automática en GUATECOMPRAS** (P8, P9): el estado del contrato se registra a mano con su NOG; la integración sería una fase futura.
- **Asuetos locales**: los días hábiles excluyen los asuetos nacionales (1 ene, Jueves y Viernes Santo, 1 may, 30 jun, 15 sep, 20 oct, 1 nov, 25 dic); los asuetos departamentales no se consideran.
