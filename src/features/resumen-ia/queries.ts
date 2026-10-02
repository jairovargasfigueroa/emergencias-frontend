import { queryOptions } from '@tanstack/react-query'
import { resumenIaApi } from './api'

/**
 * Margen antes del vencimiento de una URL firmada a partir del cual ya no se usa: un video que empieza a cargarse con
 * una URL a punto de vencer puede cortarse a mitad de camino.
 */
const MARGEN_VENCIMIENTO_MS = 60_000

export const resumenIaKeys = {
  todo: ['resumen-ia'] as const,
  delIncidente: (incidenteId: number) => [...resumenIaKeys.todo, 'incidente', incidenteId] as const,
  lectura: (evidenciaId: number) => [...resumenIaKeys.todo, 'lectura', evidenciaId] as const,
}

/**
 * El resumen no se refresca solo: cuando hay una versión nueva, Firebase lo avisa y se invalida esta consulta (ver
 * `avisos.ts`). El contenido llega siempre por acá, nunca por Firebase.
 */
export const resumenDelIncidenteQuery = (incidenteId: number) =>
  queryOptions({
    queryKey: resumenIaKeys.delIncidente(incidenteId),
    queryFn: ({ signal }) => resumenIaApi.resumen(incidenteId, signal),
  })

/**
 * La URL firmada de una evidencia. Se pide al mostrar la evidencia y se descarta apenas deja de verse: dura minutos y
 * guardarla es guardar algo que va a dejar de servir. Mientras se ve, vale hasta poco antes de vencer; después, quien
 * la necesite de nuevo pide otra.
 */
export const lecturaEvidenciaQuery = (evidenciaId: number) =>
  queryOptions({
    queryKey: resumenIaKeys.lectura(evidenciaId),
    queryFn: ({ signal }) => resumenIaApi.lectura(evidenciaId, signal),
    staleTime: (consulta) => {
      const lectura = consulta.state.data
      return lectura ? Math.max(0, new Date(lectura.venceEn).getTime() - Date.now() - MARGEN_VENCIMIENTO_MS) : 0
    },
    gcTime: 0,
    // Volver a la pestaña no tiene por qué cambiar la URL de un video que se está mirando: se renueva al fallar.
    refetchOnWindowFocus: false,
  })

/** La URL ya venció o está por vencer: no conviene empezar a cargar nada con ella. */
export function lecturaVencida(venceEn: string, ahora = Date.now()) {
  return new Date(venceEn).getTime() - MARGEN_VENCIMIENTO_MS <= ahora
}
