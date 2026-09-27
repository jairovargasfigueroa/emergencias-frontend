import { queryOptions } from '@tanstack/react-query'
import { operacionApi } from './api'

/**
 * Cada cuánto se vuelve a pedir la operación. Por Firebase solo viajan la posición y los incidentes abiertos: el
 * estado de cada unidad, su tripulación y la bitácora llegan únicamente por REST, así que hay que ir a buscarlos.
 */
const REFRESCO_MS = 20_000

/**
 * Clave propia. Antes esta pantalla reusaba la de la flota porque miraba `/ambulancias`; ahora mira `/operacion`,
 * que es otro endpoint y trae otra cosa: escribir en la clave de la flota dejaría a la pantalla de Flota leyendo
 * unidades que no tienen la forma que espera.
 */
export const operacionKeys = {
  todo: ['operacion'] as const,
  estadoActual: () => [...operacionKeys.todo, 'estado-actual'] as const,
}

export const operacionQuery = () =>
  queryOptions({
    queryKey: operacionKeys.estadoActual(),
    queryFn: ({ signal }) => operacionApi.estadoActual(signal),
    refetchInterval: REFRESCO_MS,
  })
