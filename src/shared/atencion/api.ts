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

/** Por qué se cortó la salida. */
export type MotivoCancelacionAtencion =
  | 'AVERIA'
  | 'NO_SE_ENCONTRO_PACIENTE'
  | 'DESVIADA'
  /** Solo en traslados: el paramédico devolvió el traslado que se le asignó. */
  | 'RECHAZADA_POR_PARAMEDICO'
  /** Solo en traslados: quien lo pidió lo retiró con la unidad ya en camino. */
  | 'CANCELADA_POR_SOLICITANTE'
  /** Solo en traslados: la unidad no llegaba y el administrador se lo sacó para dárselo a otra. */
  | 'REASIGNADA'
  /** La tripulación no podía cerrarla desde su app y la cerró la central, para que el caso siga con otra unidad. */
  | 'CERRADA_POR_CENTRAL'
  | 'OTRO'

/** Con qué se encontró la unidad cuando la salida terminó sin llevar a nadie. */
export type MotivoSinTraslado =
  | 'ATENDIDO_EN_EL_LUGAR'
  | 'PACIENTE_RECHAZO'
  | 'NO_HABIA_PACIENTE'
  | 'TRASLADO_POR_OTRO_MEDIO'
  | 'FALLECIDO'
  /** Solo en traslados: la unidad llegó y el paciente no estaba listo. */
  | 'PACIENTE_NO_LISTO'
  /** Solo en traslados: el paciente necesitaba más de lo que la unidad podía darle. */
  | 'UNIDAD_NO_CORRESPONDE'
