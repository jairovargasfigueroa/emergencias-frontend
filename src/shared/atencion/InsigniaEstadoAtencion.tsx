import { Insignia, type TonoInsignia } from '../ui/Insignia'
import type { EstadoAtencion } from './api'
import { TEXTO_ESTADO_ATENCION } from './textos'

/**
 * Mismo criterio que las insignias del incidente y del traslado: ámbar mientras la unidad trabaja, verde si terminó
 * entregando al paciente y gris si terminó sin entregar a nadie. El rojo queda para lo que pide una decisión, y
 * ningún estado de la atención la pide.
 */
const TONO_ESTADO_ATENCION: Record<EstadoAtencion, TonoInsignia> = {
  EN_CAMINO: 'ambar',
  EN_EL_LUGAR: 'ambar',
  PACIENTE_RECOGIDO: 'ambar',
  EN_HOSPITAL: 'ambar',
  PACIENTE_ENTREGADO: 'verde',
  // Terminar sin traslado es un final normal, pero no una entrega: va en neutro, como la cancelada.
  SIN_TRASLADO: 'gris',
  CANCELADA: 'gris',
}

type Props = {
  estado: EstadoAtencion
  /** Qué quiere decir el punto lo decide cada pantalla. Sin él, la insignia dice solo el estado. */
  conPunto?: boolean
}

/** El estado de una atención, con el mismo texto y el mismo color en todo el panel. */
export function InsigniaEstadoAtencion({ estado, conPunto = false }: Props) {
  return (
    <Insignia tono={TONO_ESTADO_ATENCION[estado]} conPunto={conPunto}>
      {TEXTO_ESTADO_ATENCION[estado]}
    </Insignia>
  )
}
