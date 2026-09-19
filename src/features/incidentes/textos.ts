import type {
  EstadoAlerta,
  EstadoAtencion,
  EstadoIncidente,
  FiltroEstadoIncidente,
  MotivoCancelacionAtencion,
  MotivoCierreIncidente,
  MotivoSinTraslado,
  OrigenUbicacion,
} from './api'

// Textos en español de los valores que llegan del backend. Se cambian solo aquí.

export const TEXTO_FILTRO: Record<FiltroEstadoIncidente, string> = {
  ABIERTOS: 'Abiertos',
  CERRADOS: 'Cerrados',
  TODOS: 'Todos',
}

export const TEXTO_ESTADO_INCIDENTE: Record<EstadoIncidente, string> = {
  ACTIVO: 'Activo',
  EN_ATENCION: 'En atención',
  ATENDIDO: 'Atendido',
  FALSA_ALARMA: 'Falsa alarma',
  ATENDIDO_EXTERNAMENTE: 'Atendido externamente',
  CANCELADO: 'Cancelado',
}

export const TEXTO_MOTIVO_CIERRE: Record<MotivoCierreIncidente, string> = {
  FALSA_ALARMA_VERIFICADA: 'Falsa alarma verificada',
  ATENDIDO_EXTERNAMENTE: 'Atendido o derivado externamente',
  SIN_COBERTURA: 'Sin cobertura',
  OTRO: 'Otro motivo',
}

export const TEXTO_ESTADO_ALERTA: Record<EstadoAlerta, string> = {
  RECIBIDA: 'Recibida',
  VINCULADA: 'Vinculada',
  CANCELADA: 'Cancelada',
  DESCARTADA: 'Descartada',
}

export const TEXTO_ORIGEN_UBICACION: Record<OrigenUbicacion, string> = {
  GPS: 'GPS',
  MANUAL: 'Marcada en el mapa',
}

export const TEXTO_ESTADO_ATENCION: Record<EstadoAtencion, string> = {
  EN_CAMINO: 'En camino',
  EN_EL_LUGAR: 'En el lugar',
  PACIENTE_RECOGIDO: 'Paciente recogido',
  EN_HOSPITAL: 'En el hospital',
  PACIENTE_ENTREGADO: 'Paciente entregado',
  SIN_TRASLADO: 'Sin traslado',
  CANCELADA: 'Cancelada',
}

/** Los mismos textos con los que la app del paramédico ofrece cada motivo. */
export const TEXTO_MOTIVO_CANCELACION_ATENCION: Record<MotivoCancelacionAtencion, string> = {
  AVERIA: 'Avería',
  NO_SE_ENCONTRO_PACIENTE: 'No se encontró al paciente',
  DESVIADA: 'Desviada a otra emergencia',
  OTRO: 'Otro motivo',
}

/**
 * Cómo terminó una salida que no trasladó a nadie. En la app el paramédico los elige en primera persona ("Lo atendí
 * acá"); acá se lee un registro de lo que pasó, así que van contados en tercera.
 */
export const TEXTO_MOTIVO_SIN_TRASLADO: Record<MotivoSinTraslado, string> = {
  ATENDIDO_EN_EL_LUGAR: 'Se lo atendió en el lugar',
  PACIENTE_RECHAZO: 'El paciente rechazó el traslado',
  NO_HABIA_PACIENTE: 'No había nadie en el lugar',
  TRASLADO_POR_OTRO_MEDIO: 'Ya se lo habían llevado por otro medio',
  FALLECIDO: 'Falleció en el lugar',
}
