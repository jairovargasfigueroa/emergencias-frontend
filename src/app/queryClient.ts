import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import { sesionKeys } from '../features/sesion/queries'
import { ErrorApi } from '../shared/api/cliente'
import { borrarSesion } from '../shared/sesion/almacen'

/** Un 4xx es una respuesta definitiva del backend: reintentarla no cambia nada. */
function esErrorDefinitivo(error: unknown) {
  return error instanceof ErrorApi && error.status >= 400 && error.status < 500
}

/**
 * Un 401 es el token vencido o una sesión que el servidor ya no reconoce: se cierra acá, en un solo lugar, y el marco
 * del panel lleva al login.
 */
function alFallarPeticion(error: unknown) {
  if (error instanceof ErrorApi && error.status === 401) {
    borrarSesion()
    queryClient.setQueryData(sesionKeys.actual, null)
  }
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: alFallarPeticion }),
  mutationCache: new MutationCache({ onError: alFallarPeticion }),
  defaultOptions: {
    queries: {
      staleTime: 10_000,
      retry: (fallos, error) => !esErrorDefinitivo(error) && fallos < 2,
    },
  },
})
