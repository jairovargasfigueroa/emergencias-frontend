import type { MotivoCancelacionAtencion, MotivoSinTraslado } from '../../shared/atencion/api'
import { TEXTO_MOTIVO_CANCELACION_ATENCION, TEXTO_MOTIVO_SIN_TRASLADO } from '../../shared/atencion/textos'
import type { EventoDeOperacion, OrigenAtencion, TipoEvento } from './api'

// Textos en castellano de los valores crudos que llegan de `/operacion`. Se cambian solo acá.

/**
 * Qué hizo la unidad, para la bitácora. Van en tercera persona y sin nombrar el incidente ni el traslado: eso lo
 * pone la línea al lado, que además enlaza al detalle.
 */
export const TEXTO_EVENTO: Record<TipoEvento, string> = {
  TOMA: 'Salió hacia el lugar',
  LLEGADA: 'Llegó al lugar',
  RECOGIDA: 'Recogió al paciente',
  HOSPITAL: 'Llegó al destino',
  ENTREGA: 'Entregó al paciente',
  SIN_TRASLADO: 'Cerró sin trasladar',
  LIBERACION: 'Quedó libre',
  CANCELACION: 'Canceló la atención',
  AVISO_NO_LISTO: 'Avisó que el paciente no está listo',
}

/** El mismo hito, pero como etiqueta de la línea de tiempo: lo más corto que se entienda. */
export const TEXTO_HITO: Record<TipoEvento, string> = {
  TOMA: 'Salida',
  LLEGADA: 'Llegada',
  RECOGIDA: 'Recogida',
  HOSPITAL: 'Destino',
  ENTREGA: 'Entrega',
  SIN_TRASLADO: 'Sin traslado',
  LIBERACION: 'Liberación',
  CANCELACION: 'Cancelación',
  AVISO_NO_LISTO: 'Paciente no listo',
}

export const TEXTO_ORIGEN: Record<OrigenAtencion, string> = {
  INCIDENTE: 'Incidente',
  TRASLADO: 'Traslado',
}

/**
 * El "por qué" o el "dónde" de un evento, ya legible. El backend manda el valor crudo: en la entrega es el
 * nombre del centro de salud o el destino escrito a mano, y en los otros dos es el nombre de un enum. Un motivo
 * que el panel todavía no conoce se omite: el nombre del enum no le dice nada a quien mira la pantalla.
 */
export function detalleDeEvento(evento: EventoDeOperacion): string | null {
  if (!evento.detalle) {
    return null
  }
  switch (evento.tipo) {
    case 'SIN_TRASLADO':
      return TEXTO_MOTIVO_SIN_TRASLADO[evento.detalle as MotivoSinTraslado] ?? null
    case 'CANCELACION':
      return TEXTO_MOTIVO_CANCELACION_ATENCION[evento.detalle as MotivoCancelacionAtencion] ?? null
    default:
      return evento.detalle
  }
}
