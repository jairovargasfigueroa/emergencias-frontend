import { Insignia, type TonoInsignia } from '../../shared/ui/Insignia'
import { esperaUnidad, trasladoVigente, type EstadoAtencion, type EstadoTraslado } from './api'
import { TEXTO_ESTADO_ATENCION, TEXTO_ESTADO_TRASLADO } from './textos'

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

const TONO_ATENCION: Record<EstadoAtencion, TonoInsignia> = {
  EN_CAMINO: 'ambar',
  EN_EL_LUGAR: 'ambar',
  PACIENTE_RECOGIDO: 'ambar',
  EN_HOSPITAL: 'ambar',
  PACIENTE_ENTREGADO: 'verde',
  SIN_TRASLADO: 'gris',
  CANCELADA: 'gris',
}

/** Lleva punto mientras el pedido siga vivo, y parpadea en rojo cuando está esperando unidad. */
export function InsigniaEstadoTraslado({ estado }: { estado: EstadoTraslado }) {
  return (
    <Insignia tono={TONO_TRASLADO[estado]} conPunto={trasladoVigente(estado) || esperaUnidad(estado)}>
      {TEXTO_ESTADO_TRASLADO[estado]}
    </Insignia>
  )
}

export function InsigniaEstadoAtencion({ estado }: { estado: EstadoAtencion }) {
  return <Insignia tono={TONO_ATENCION[estado]}>{TEXTO_ESTADO_ATENCION[estado]}</Insignia>
}
