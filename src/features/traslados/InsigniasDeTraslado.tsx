import { Insignia, type TonoInsignia } from '../../shared/ui/Insignia'
import { esperaUnidad, trasladoVigente, type EstadoTraslado } from './api'
import { TEXTO_ESTADO_TRASLADO } from './textos'

const TONO_TRASLADO: Record<EstadoTraslado, TonoInsignia> = {
  PROGRAMADO: 'gris',
  // El único que pide una decisión: se pasó la hora de salir y todavía no hay unidad.
  BUSCANDO_UNIDAD: 'rojo',
  ASIGNADO: 'ambar',
  COMPLETADO: 'verde',
  NO_REALIZADO: 'gris',
  NO_CUBIERTO: 'rojo',
  CANCELADO: 'gris',
}

/** Lleva punto mientras el pedido siga vivo, y parpadea en rojo cuando está esperando unidad. */
export function InsigniaEstadoTraslado({ estado }: { estado: EstadoTraslado }) {
  return (
    <Insignia tono={TONO_TRASLADO[estado]} conPunto={trasladoVigente(estado) || esperaUnidad(estado)}>
      {TEXTO_ESTADO_TRASLADO[estado]}
    </Insignia>
  )
}
