import { QueryClient } from '@tanstack/react-query'
import { ErrorApi } from '../shared/api/cliente'

/** Un 4xx es una respuesta definitiva del backend: reintentarla no cambia nada. */
function esErrorDefinitivo(error: unknown) {
  return error instanceof ErrorApi && error.status >= 400 && error.status < 500
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10_000,
      retry: (fallos, error) => !esErrorDefinitivo(error) && fallos < 2,
    },
  },
})
