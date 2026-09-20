import { mutationOptions, queryOptions, type QueryClient } from '@tanstack/react-query'
import { borrarSesion, guardarSesion, leerSesion } from '../../shared/sesion/almacen'
import { sesionApi, type Credenciales } from './api'

export const sesionKeys = {
  actual: ['sesion'] as const,
}

/** Administrador con sesión abierta, o `null`. Sale del navegador: no depende de la conexión. */
export const sesionQuery = () =>
  queryOptions({
    queryKey: sesionKeys.actual,
    queryFn: () => leerSesion(),
    staleTime: Infinity,
    gcTime: Infinity,
  })

export const ingresarMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationFn: async (credenciales: Credenciales) => {
      const sesion = await sesionApi.ingresar(credenciales)
      guardarSesion(sesion)
      return sesion
    },
    onSuccess: (sesion) => {
      queryClient.setQueryData(sesionKeys.actual, sesion)
    },
  })

/** Cierra la sesión y descarta lo consultado con ella: el guard del router lleva al login. */
export function cerrarSesion(queryClient: QueryClient) {
  borrarSesion()
  queryClient.setQueryData(sesionKeys.actual, null)
  queryClient.removeQueries({ predicate: (consulta) => consulta.queryKey[0] !== sesionKeys.actual[0] })
}
