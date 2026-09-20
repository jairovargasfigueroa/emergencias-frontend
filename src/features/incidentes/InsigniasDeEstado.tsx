import { Insignia, type TonoInsignia } from '../../shared/ui/Insignia'
import { estaAbierto, ocupaLaUnidad, type AtencionDeIncidente, type EstadoAtencion, type EstadoIncidente } from './api'
import { TEXTO_ESTADO_ATENCION, TEXTO_ESTADO_INCIDENTE } from './textos'

const TONO_INCIDENTE: Record<EstadoIncidente, TonoInsignia> = {
  ACTIVO: 'rojo',
  EN_ATENCION: 'ambar',
  ATENDIDO: 'verde',
  FALSA_ALARMA: 'gris',
  ATENDIDO_EXTERNAMENTE: 'gris',
  CANCELADO: 'gris',
}

const TONO_ATENCION: Record<EstadoAtencion, TonoInsignia> = {
  EN_CAMINO: 'ambar',
  EN_EL_LUGAR: 'ambar',
  PACIENTE_RECOGIDO: 'ambar',
  EN_HOSPITAL: 'ambar',
  PACIENTE_ENTREGADO: 'verde',
  // Terminar sin traslado no es un fallo ni una cancelación: la unidad fue y resolvió, por eso va en verde.
  SIN_TRASLADO: 'verde',
  CANCELADA: 'gris',
}

/** Los estados abiertos llevan punto: el incidente sigue en curso. */
export function InsigniaEstadoIncidente({ estado }: { estado: EstadoIncidente }) {
  return (
    <Insignia tono={TONO_INCIDENTE[estado]} conPunto={estaAbierto(estado)}>
      {TEXTO_ESTADO_INCIDENTE[estado]}
    </Insignia>
  )
}

/** El punto acá dice que la ambulancia sigue tomada, aunque ya haya entregado al paciente. */
export function InsigniaEstadoAtencion({ atencion }: { atencion: AtencionDeIncidente }) {
  return (
    <Insignia tono={TONO_ATENCION[atencion.estado]} conPunto={ocupaLaUnidad(atencion)}>
      {TEXTO_ESTADO_ATENCION[atencion.estado]}
    </Insignia>
  )
}
