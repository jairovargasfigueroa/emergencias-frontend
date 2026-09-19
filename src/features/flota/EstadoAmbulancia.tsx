import { Insignia, type TonoInsignia } from '../../shared/ui/Insignia'
import type { EstadoAmbulancia as Estado } from './api'

const PRESENTACION: Record<Estado, { etiqueta: string; tono: TonoInsignia }> = {
  // Sana pero sin tripulación: no es una falla, es que falta cubrir esa franja. Por eso no va en el tono de avería.
  SIN_TURNO: { etiqueta: 'Sin turno', tono: 'contorno' },
  DISPONIBLE: { etiqueta: 'Disponible', tono: 'verde' },
  EN_ATENCION: { etiqueta: 'En atención', tono: 'ambar' },
  FUERA_DE_SERVICIO: { etiqueta: 'Fuera de servicio', tono: 'gris' },
}

export function EstadoAmbulancia({ estado }: { estado: Estado }) {
  const { etiqueta, tono } = PRESENTACION[estado]
  return (
    <Insignia tono={tono} conPunto>
      {etiqueta}
    </Insignia>
  )
}
