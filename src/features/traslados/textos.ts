import { hora } from '../../shared/formato/fechas'
import type { EstadoTraslado, Movilidad, Traslado, TrasladoDelPanel } from './api'

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

/**
 * "10:05–10:25": la ventana de recogida, que es lo que se le prometió a la familia y no la hora de salida. Null en
 * los traslados pedidos antes de que existiera.
 */
export function ventanaDeRecogida(traslado: Traslado): string | null {
  if (!traslado.horaRecogidaDesde || !traslado.horaRecogidaHasta) {
    return null
  }
  return `${hora(traslado.horaRecogidaDesde)}–${hora(traslado.horaRecogidaHasta)}`
}

/**
 * Lo que le queda a un traslado sin unidad hasta la última salida posible: "Quedan 25 min", "Queda 1 min",
 * "Quedan 1 h 10 min". Con el tiempo cumplido, el sistema lo da por no cubierto en su próxima vuelta.
 */
export function textoTiempoRestante(minutos: number): string {
  if (minutos < 0) {
    return 'Ya no queda tiempo'
  }
  if (minutos === 0) {
    return 'Queda menos de 1 min'
  }
  if (minutos === 1) {
    return 'Queda 1 min'
  }
  if (minutos < 60) {
    return `Quedan ${minutos} min`
  }
  const horas = Math.floor(minutos / 60)
  return minutos % 60 === 0 ? `Quedan ${horas} h` : `Quedan ${horas} h ${minutos % 60} min`
}

/**
 * Qué tiene que hacer el administrador con un traslado, dicho igual en la bandeja, en el centro de control y en el
 * detalle. El que está sin unidad no lleva aviso: el sistema sigue buscando, y lo que importa es cuánto le queda.
 */
export function avisoDelProblema(fila: TrasladoDelPanel): string | null {
  switch (fila.problema) {
    case 'NO_CUBIERTO':
      return 'No se consiguió unidad: avisa a la familia'
    case 'UNIDAD_ATRASADA':
      return `La unidad ${fila.placa ?? 'asignada'} no llegó y ya pasó la ventana de recogida`
    default:
      return null
  }
}
