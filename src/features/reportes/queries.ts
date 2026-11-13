import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import { reportesApi } from './api'

export const reportesKeys = {
  todos: ['reportes'] as const,
  operacion: (desde: string, hasta: string) => [...reportesKeys.todos, 'operacion', desde, hasta] as const,
}

/** Al cambiar el período se sigue viendo el reporte anterior hasta que llega el nuevo. */
export const reporteDeOperacionQuery = (desde: string, hasta: string) =>
  queryOptions({
    queryKey: reportesKeys.operacion(desde, hasta),
    queryFn: ({ signal }) => reportesApi.operacion(desde, hasta, signal),
    placeholderData: keepPreviousData,
  })
