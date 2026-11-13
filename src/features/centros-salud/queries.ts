import { mutationOptions, queryOptions, type QueryClient } from '@tanstack/react-query'
import { centrosSaludApi, type GuardarCentroSalud } from './api'

export const centrosSaludKeys = {
  todos: ['centros-salud'] as const,
  lista: () => [...centrosSaludKeys.todos, 'lista'] as const,
  administracion: () => [...centrosSaludKeys.todos, 'administracion'] as const,
}

/** El catálogo casi no cambia: se guarda unos minutos en vez de pedirlo cada vez que se abre un diálogo. */
export const centrosSaludQuery = () =>
  queryOptions({
    queryKey: centrosSaludKeys.lista(),
    queryFn: ({ signal }) => centrosSaludApi.listar(signal),
    staleTime: 5 * 60_000,
  })

/** PB-24: el catálogo completo para administrarlo, con los dados de baja. */
export const centrosSaludTodosQuery = () =>
  queryOptions({
    queryKey: centrosSaludKeys.administracion(),
    queryFn: ({ signal }) => centrosSaludApi.listarTodos(signal),
  })

/** Cualquier cambio refresca también la lista de destinos que usan los diálogos de traslado y de entrega. */
function refrescarCentros(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: centrosSaludKeys.todos })
}

export const registrarCentroSaludMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationFn: (datos: GuardarCentroSalud) => centrosSaludApi.registrar(datos),
    onSuccess: () => refrescarCentros(queryClient),
  })

export const corregirCentroSaludMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationFn: ({ id, datos }: { id: number; datos: GuardarCentroSalud }) => centrosSaludApi.corregir(id, datos),
    onSuccess: () => refrescarCentros(queryClient),
  })

export const desactivarCentroSaludMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationFn: (id: number) => centrosSaludApi.desactivar(id),
    onSuccess: () => refrescarCentros(queryClient),
  })

export const activarCentroSaludMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationFn: (id: number) => centrosSaludApi.activar(id),
    onSuccess: () => refrescarCentros(queryClient),
  })
