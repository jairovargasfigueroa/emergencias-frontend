import { mutationOptions, queryOptions, type QueryClient } from '@tanstack/react-query'
import { flotaKeys } from '../flota/queries'
import { operacionKeys } from '../monitoreo/queries'
import { trasladosApi, type TrasladoDelPanel } from './api'

export const trasladosKeys = {
  todos: ['traslados'] as const,
  dia: (dia: string | undefined) => [...trasladosKeys.todos, 'dia', dia ?? 'hoy'] as const,
  problemas: () => [...trasladosKeys.todos, 'problemas'] as const,
  detalle: (id: number) => [...trasladosKeys.todos, 'detalle', id] as const,
}

export const trasladosDelDiaQuery = (dia: string | undefined) =>
  queryOptions({
    queryKey: trasladosKeys.dia(dia),
    queryFn: ({ signal }) => trasladosApi.delDia(dia, signal),
  })

/**
 * La bandeja se refresca sola: el barrido del servidor puede asignar una unidad en cualquier momento, y el
 * administrador está mirando esta pantalla justamente para enterarse.
 */
export const problemasQuery = () =>
  queryOptions({
    queryKey: trasladosKeys.problemas(),
    queryFn: ({ signal }) => trasladosApi.problemas(signal),
    refetchInterval: 30_000,
  })

export const trasladoQuery = (id: number) =>
  queryOptions({
    queryKey: trasladosKeys.detalle(id),
    queryFn: ({ signal }) => trasladosApi.detalle(id, signal),
  })

/**
 * Asignar a mano cambia la unidad y el estado: se recarga todo lo de traslados y también la flota. Y el centro
 * de control, que se asigna desde su franja de problemas y esperaría al refresco para sacarlo de la lista.
 */
export const asignarTrasladoMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationFn: ({ id, ambulanciaId }: { id: number; ambulanciaId: number }) =>
      trasladosApi.asignar(id, ambulanciaId),
    onSuccess: (fila: TrasladoDelPanel) => {
      queryClient.setQueryData(trasladosKeys.detalle(fila.traslado.id), fila)
      void queryClient.invalidateQueries({ queryKey: trasladosKeys.todos })
      void queryClient.invalidateQueries({ queryKey: flotaKeys.todas })
      void queryClient.invalidateQueries({ queryKey: operacionKeys.todo })
    },
  })
