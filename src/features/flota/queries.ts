import { mutationOptions, queryOptions, type QueryClient } from '@tanstack/react-query'
import { personalKeys } from '../personal/queries'
import { ambulanciasApi, type RegistrarAmbulancia } from './api'

export const flotaKeys = {
  todas: ['ambulancias'] as const,
  lista: () => [...flotaKeys.todas, 'lista'] as const,
}

export const ambulanciasQuery = () =>
  queryOptions({
    queryKey: flotaKeys.lista(),
    queryFn: ({ signal }) => ambulanciasApi.listar(signal),
  })

/** Cualquier cambio en la flota refresca la lista y el personal, que muestra la ambulancia asignada. */
function refrescarFlota(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: flotaKeys.todas }),
    queryClient.invalidateQueries({ queryKey: personalKeys.todos }),
  ])
}

export const registrarAmbulanciaMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationFn: (datos: RegistrarAmbulancia) => ambulanciasApi.registrar(datos),
    onSuccess: () => refrescarFlota(queryClient),
  })

export const marcarFueraDeServicioMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationFn: (ambulanciaId: number) => ambulanciasApi.marcarFueraDeServicio(ambulanciaId),
    onSuccess: () => refrescarFlota(queryClient),
  })

export const reactivarAmbulanciaMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationFn: (ambulanciaId: number) => ambulanciasApi.reactivar(ambulanciaId),
    onSuccess: () => refrescarFlota(queryClient),
  })

export const desactivarAmbulanciaMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationFn: (ambulanciaId: number) => ambulanciasApi.desactivar(ambulanciaId),
    onSuccess: () => refrescarFlota(queryClient),
  })
