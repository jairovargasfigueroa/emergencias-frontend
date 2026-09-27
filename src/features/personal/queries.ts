import { mutationOptions, queryOptions, type QueryClient } from '@tanstack/react-query'
import { personalApi, type EditarParamedico, type RegistrarParamedico } from './api'

export const personalKeys = {
  todos: ['paramedicos'] as const,
  lista: () => [...personalKeys.todos, 'lista'] as const,
}

export const paramedicosQuery = () =>
  queryOptions({
    queryKey: personalKeys.lista(),
    queryFn: ({ signal }) => personalApi.listar(signal),
  })

function refrescarPersonal(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: personalKeys.todos })
}

export const registrarParamedicoMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationFn: (datos: RegistrarParamedico) => personalApi.registrar(datos),
    onSuccess: () => refrescarPersonal(queryClient),
  })

/** Puede fallar con 409 `TELEFONO_DUPLICADO` si otro paramédico activo ya usa ese número. */
export const editarParamedicoMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationFn: ({ id, datos }: { id: number; datos: EditarParamedico }) => personalApi.editar(id, datos),
    onSuccess: () => refrescarPersonal(queryClient),
  })

export const desactivarParamedicoMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationFn: (paramedicoId: number) => personalApi.desactivar(paramedicoId),
    onSuccess: () => refrescarPersonal(queryClient),
  })

/**
 * Deshace la baja. Puede fallar con 409 `TELEFONO_DUPLICADO`: mientras estuvo de baja su número quedó libre y
 * alguien más pudo quedárselo.
 */
export const activarParamedicoMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationFn: (paramedicoId: number) => personalApi.activar(paramedicoId),
    onSuccess: () => refrescarPersonal(queryClient),
  })
