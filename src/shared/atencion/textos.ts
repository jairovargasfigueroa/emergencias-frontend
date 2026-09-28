import type { EstadoAtencion, MotivoCancelacionAtencion, MotivoSinTraslado } from './api'

// Textos de la atención, los mismos en incidentes, traslados y el centro de control. Se cambian solo aquí.

export const TEXTO_ESTADO_ATENCION: Record<EstadoAtencion, string> = {
  EN_CAMINO: 'En camino',
  EN_EL_LUGAR: 'En el lugar',
  PACIENTE_RECOGIDO: 'Paciente a bordo',
  EN_HOSPITAL: 'En el destino',
  PACIENTE_ENTREGADO: 'Paciente entregado',
  SIN_TRASLADO: 'Sin traslado',
  CANCELADA: 'Cancelada',
}

/**
 * Los que elige el paramédico al cancelar llevan el mismo texto que le ofrece su app. Los dos de traslados no salen
 * de esa lista, así que se cuentan como registro de lo que pasó.
 */
export const TEXTO_MOTIVO_CANCELACION_ATENCION: Record<MotivoCancelacionAtencion, string> = {
  AVERIA: 'Avería',
  NO_SE_ENCONTRO_PACIENTE: 'No se encontró al paciente',
  DESVIADA: 'Desviada a otra emergencia',
  OTRO: 'Otro motivo',
  RECHAZADA_POR_PARAMEDICO: 'El paramédico lo devolvió',
  CANCELADA_POR_SOLICITANTE: 'Lo canceló quien lo pidió',
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
  PACIENTE_NO_LISTO: 'El paciente no estaba listo',
  UNIDAD_NO_CORRESPONDE: 'La unidad no correspondía',
}
