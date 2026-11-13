import { mutationOptions, queryOptions, type QueryClient } from '@tanstack/react-query'
import { malUsoApi, type HistorialDeCiudadano } from './api'

export const malUsoKeys = {
  todo: ['mal-uso'] as const,
  lista: () => [...malUsoKeys.todo, 'lista'] as const,
  historial: (id: number) => [...malUsoKeys.todo, 'historial', id] as const,
}

export const ciudadanosConFalsasAlarmasQuery = () =>
  queryOptions({
    queryKey: malUsoKeys.lista(),
    queryFn: ({ signal }) => malUsoApi.conFalsasAlarmas(signal),
  })

export const historialDeCiudadanoQuery = (id: number) =>
  queryOptions({
    queryKey: malUsoKeys.historial(id),
    queryFn: ({ signal }) => malUsoApi.historial(id, signal),
  })

/** La respuesta ya es el historial nuevo: se pone en su lugar y se recarga la lista, que muestra si está activa. */
function actualizar(queryClient: QueryClient, historial: HistorialDeCiudadano) {
  queryClient.setQueryData(malUsoKeys.historial(historial.id), historial)
  void queryClient.invalidateQueries({ queryKey: malUsoKeys.lista() })
}

export const desactivarCuentaMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationFn: ({ id, motivo }: { id: number; motivo: string }) => malUsoApi.desactivar(id, motivo),
    onSuccess: (historial: HistorialDeCiudadano) => actualizar(queryClient, historial),
  })

export const reactivarCuentaMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationFn: ({ id, motivo }: { id: number; motivo: string }) => malUsoApi.reactivar(id, motivo),
    onSuccess: (historial: HistorialDeCiudadano) => actualizar(queryClient, historial),
  })
