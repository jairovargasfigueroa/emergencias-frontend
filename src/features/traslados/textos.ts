import type { EstadoTraslado, Movilidad } from './api'

export const TEXTO_ESTADO_TRASLADO: Record<EstadoTraslado, string> = {
  PROGRAMADO: 'Programado',
  BUSCANDO_UNIDAD: 'Sin unidad',
  ASIGNADO: 'En curso',
  COMPLETADO: 'Completado',
  NO_REALIZADO: 'No realizado',
  NO_CUBIERTO: 'No cubierto',
  CANCELADO: 'Cancelado',
}

export const TEXTO_MOVILIDAD: Record<Movilidad, string> = {
  CAMINA_CON_AYUDA: 'Camina con ayuda',
  SILLA_DE_RUEDAS: 'Silla de ruedas',
  CAMILLA: 'Camilla',
}

/** Por qué cada estado terminal terminó así, para el detalle. */
export const EXPLICACION_ESTADO: Partial<Record<EstadoTraslado, string>> = {
  BUSCANDO_UNIDAD: 'Se sigue buscando una unidad que sirva. Pasada la hora límite, el pedido se cierra.',
  NO_REALIZADO: 'Fue una unidad pero nadie viajó. El motivo está en la atención.',
  NO_CUBIERTO: 'Se pasó la última salida posible sin conseguir unidad.',
}
