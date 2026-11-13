import { api } from '../../shared/api/cliente'
import type { EstadoIncidente } from '../incidentes/api'
import type { EstadoTraslado } from '../traslados/api'

/** Promedio y mediana en segundos sobre `medidos` casos. Null si no hubo ninguno: no se inventa un tiempo. */
export type Medida = {
  medidos: number
  promedioSegundos: number | null
  medianaSegundos: number | null
}

export type Servicios<E extends string> = {
  total: number
  porEstado: Record<E, number>
}

/** `ReporteDeOperacionResponse` del backend (PB-22). */
export type ReporteDeOperacion = {
  /** `AAAA-MM-DD`, los dos incluidos. */
  desde: string
  hasta: string
  zona: string
  generadoEn: string
  emergencias: Servicios<EstadoIncidente>
  traslados: Servicios<EstadoTraslado>
  tiemposDeEmergencia: {
    /** Desde que se abrió el incidente hasta que una unidad lo tomó. */
    hastaLaToma: Medida
    /** Tiempo de respuesta: desde que se abrió hasta que llegó la primera unidad. */
    hastaLaLlegada: Medida
    /** Sin ninguna unidad: no entran en los tiempos. */
    sinUnidad: number
    /** Con unidad pero sin la llegada registrada: dato incompleto. */
    sinLlegada: number
  }
  puntualidadDeTraslados: { aTiempo: number; tarde: number; sinDato: number }
  porDia: { dia: string; emergencias: number; traslados: number }[]
  porUnidad: { placa: string; emergencias: number; traslados: number; hastaLaLlegada: Medida }[]
  /** Cómo se contó cada cosa, en frases: va también en el archivo exportado. */
  criterio: string[]
}

export const reportesApi = {
  /** Falla con 400 `VALIDACION` si el período está al revés o pasa de un año. */
  operacion: (desde: string, hasta: string, signal?: AbortSignal) =>
    api.get<ReporteDeOperacion>(`/reportes/operacion?desde=${desde}&hasta=${hasta}`, signal),
}
