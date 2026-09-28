import { queryOptions } from '@tanstack/react-query'
import { centrosSaludApi } from './api'

export const centrosSaludKeys = {
  todos: ['centros-salud'] as const,
  lista: () => [...centrosSaludKeys.todos, 'lista'] as const,
}

/** El catálogo casi no cambia: se guarda unos minutos en vez de pedirlo cada vez que se abre un diálogo. */
export const centrosSaludQuery = () =>
  queryOptions({
    queryKey: centrosSaludKeys.lista(),
    queryFn: ({ signal }) => centrosSaludApi.listar(signal),
    staleTime: 5 * 60_000,
  })
