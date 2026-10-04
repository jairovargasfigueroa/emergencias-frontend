# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Principal: el operador de la central** (rol `ADMIN` en el código). Una persona que tiene el panel abierto en escritorio durante todo su turno, vigilando y actuando. Su trabajo: ver qué está sin cubrir, dónde está cada unidad y qué acaba de pasar, e intervenir cuando el sistema solo no alcanza (enviar una unidad a mano, cerrar incidentes o atenciones trabadas, resolver traslados con problemas). También administra la flota y el personal: ambulancias, paramédicos, códigos de activación, asignaciones y turnos.
- **Otros actores**, que usan las apps y no el panel: el ciudadano que pide ayuda o un traslado, y el paramédico de turno que toma incidentes y marca los hitos de la atención.

## Product Purpose

SGA (Sistema de Gestión de Ambulancias) coordina una central de ambulancias privada en Bolivia en dos líneas: emergencias (el ciudadano alerta, el sistema agrupa las alertas en incidentes y una unidad lo toma) y traslados programados. El panel existe para que nada quede sin cubrir sin que la central lo vea. Éxito: cada incidente y cada traslado tiene una unidad, o alguien de la central que decidió qué hacer, y el operador lo ve sin tener que buscarlo.

## Positioning

- Las unidades se autoasignan: la primera de turno que toma un incidente se lo queda. La central interviene por excepción, no despacha todo.
- Las reglas y los estados copian la operación real de una central privada: turnos, liberación de la unidad separada de la entrega, tipos de unidad según la Norma Nacional de Ambulancias Terrestres N° 430.

## Operating Context

- Operación continua. El panel se actualiza solo (Firebase Realtime Database y consulta cada 20 s). No hay sonido ni avisos del navegador, solo toasts.
- Pantalla principal de trabajo: Centro de control (franja de problemas, mapa, tabla de unidades, bitácora). Hoy el panel abre en Flota.
- Estados de ambulancia: `SIN_TURNO`, `DISPONIBLE`, `EN_ATENCION`, `FUERA_DE_SERVICIO`.
- Estados de incidente: `ACTIVO`, `EN_ATENCION`, `ATENDIDO`, `FALSA_ALARMA`, `ATENDIDO_EXTERNAMENTE`, `CANCELADO`.
- Atención: `EN_CAMINO` → `EN_EL_LUGAR` → `PACIENTE_RECOGIDO` → `EN_HOSPITAL` → `PACIENTE_ENTREGADO`, más `SIN_TRASLADO` y `CANCELADA`. La liberación de la unidad es un hito aparte.
- Estados de traslado: `PROGRAMADO`, `BUSCANDO_UNIDAD`, `ASIGNADO`, `COMPLETADO`, `NO_REALIZADO`, `NO_CUBIERTO`, `CANCELADO`.
- Tipos de unidad (Norma 430): IA, IB, II, III. Hora de La Paz; celulares +591 de 8 dígitos.

## Capabilities and Constraints

- Secciones: Flota, Personal, Incidentes (lista y detalle con resumen de IA y evidencias), Traslados (del día y problemas) y Centro de control. Entrada con correo y contraseña, sesión de 12 h, un solo rol.
- Solo escritorio. Modo claro y oscuro automático. Solo en español.
- El resumen de IA orienta: no es triaje, no decide el despacho y puede estar apagado. El sistema no tiene gravedad ni prioridad.
- No hay rutas reales: los tiempos se estiman en línea recta.

## Brand Commitments

- Nombre: SGA, "SGA · Panel de administración". Marca: cuadro rojo con cruz blanca.
- Voz: español neutro con tuteo, frases cortas y concretas, lenguaje operativo sin jerga, sin prometer lo que no es cierto.
- Es un sistema para emergencias: sobriedad. No se usan los comandos `bolder`, `delight`, `overdrive`, `animate` ni `colorize`.

## Evidence on Hand

- No hay clientes, testimonios ni métricas reales: no se inventan.
- No hay datos cargados de centros de salud.

## Product Principles

1. Lo sin cubrir primero: lo que necesita a la central se ve antes que lo que anda bien.
2. La central interviene por excepción; el panel no compite con la autoasignación de las unidades.
3. Las acciones que cambian la operación (enviar, cerrar, liberar) se confirman y dicen qué pasa después.
4. Las reglas copian la vida real.
5. La IA orienta, no decide.
