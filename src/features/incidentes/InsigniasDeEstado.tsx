import { Insignia, type TonoInsignia } from '../../shared/ui/Insignia'
import { estaAbierto, type EstadoIncidente } from './api'
import { TEXTO_ESTADO_INCIDENTE } from './textos'

const TONO_INCIDENTE: Record<EstadoIncidente, TonoInsignia> = {
  ACTIVO: 'rojo',
  EN_ATENCION: 'ambar',
  ATENDIDO: 'verde',
  FALSA_ALARMA: 'gris',
  ATENDIDO_EXTERNAMENTE: 'gris',
  CANCELADO: 'gris',
}

/** Los estados abiertos llevan punto: el incidente sigue en curso. */
export function InsigniaEstadoIncidente({ estado }: { estado: EstadoIncidente }) {
  return (
    <Insignia tono={TONO_INCIDENTE[estado]} conPunto={estaAbierto(estado)}>
      {TEXTO_ESTADO_INCIDENTE[estado]}
    </Insignia>
  )
}
