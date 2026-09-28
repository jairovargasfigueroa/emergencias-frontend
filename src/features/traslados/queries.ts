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

/**
 * Cada cuánto se vuelven a pedir la lista del día, la bandeja y el detalle. Los tres se refrescan solos: el barrido
 * del servidor puede asignar una unidad en cualquier momento, la unidad avanza sin que nadie toque el panel, y el
 * problema de cada traslado lo calcula el servidor al responder, así que envejece con la hora.
 */
const REFRESCO_MS = 30_000

export const trasladosDelDiaQuery = (dia: string | undefined) =>
  queryOptions({
    queryKey: trasladosKeys.dia(dia),
    queryFn: ({ signal }) => trasladosApi.delDia(dia, signal),
    refetchInterval: REFRESCO_MS,
  })

/** El administrador está mirando la bandeja justamente para enterarse de lo que cambia. */
export const problemasQuery = () =>
  queryOptions({
    queryKey: trasladosKeys.problemas(),
    queryFn: ({ signal }) => trasladosApi.problemas(signal),
    refetchInterval: REFRESCO_MS,
  })

export const trasladoQuery = (id: number) =>
  queryOptions({
    queryKey: trasladosKeys.detalle(id),
    queryFn: ({ signal }) => trasladosApi.detalle(id, signal),
    refetchInterval: REFRESCO_MS,
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
