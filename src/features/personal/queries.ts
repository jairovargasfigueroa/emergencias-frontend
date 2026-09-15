import { mutationOptions, queryOptions, type QueryClient } from '@tanstack/react-query'
import { personalApi, type RegistrarParamedico } from './api'

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

export const desactivarParamedicoMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationFn: (paramedicoId: number) => personalApi.desactivar(paramedicoId),
    onSuccess: () => refrescarPersonal(queryClient),
  })
