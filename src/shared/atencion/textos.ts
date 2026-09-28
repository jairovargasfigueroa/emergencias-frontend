import type { EstadoAtencion } from './api'

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
