/**
 * `EstadoAtencion` del backend (ME-1). Una atención es la salida de una unidad, venga de un incidente o de un
 * traslado, así que la usan incidentes, traslados y el centro de control.
 */
export type EstadoAtencion =
  | 'EN_CAMINO'
  | 'EN_EL_LUGAR'
  | 'PACIENTE_RECOGIDO'
  | 'EN_HOSPITAL'
  | 'PACIENTE_ENTREGADO'
  | 'SIN_TRASLADO'
  | 'CANCELADA'
