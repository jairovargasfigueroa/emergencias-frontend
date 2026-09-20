import type { QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'

export type ContextoRouter = {
  queryClient: QueryClient
}

/** Solo sostiene el árbol: el marco del panel vive en la ruta protegida, que el login no usa. */
export const rutaRaiz = createRootRouteWithContext<ContextoRouter>()({
  component: Outlet,
})
