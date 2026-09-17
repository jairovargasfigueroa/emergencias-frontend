import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import { incidentesApi, type FiltroEstadoIncidente } from './api'

/** La lista se pide de a 20 incidentes. */
export const TAMANO_PAGINA = 20

export const incidentesKeys = {
  todos: ['incidentes'] as const,
  lista: (filtro: FiltroEstadoIncidente, pagina: number) => [...incidentesKeys.todos, 'lista', filtro, pagina] as const,
  detalle: (id: number) => [...incidentesKeys.todos, 'detalle', id] as const,
}

/** Al cambiar de página o de filtro se sigue viendo la lista anterior hasta que llega la nueva. */
export const incidentesQuery = (filtro: FiltroEstadoIncidente, pagina: number) =>
  queryOptions({
    queryKey: incidentesKeys.lista(filtro, pagina),
    queryFn: ({ signal }) => incidentesApi.listar(filtro, pagina, TAMANO_PAGINA, signal),
    placeholderData: keepPreviousData,
  })

export const incidenteQuery = (id: number) =>
  queryOptions({
    queryKey: incidentesKeys.detalle(id),
    queryFn: ({ signal }) => incidentesApi.detalle(id, signal),
  })
