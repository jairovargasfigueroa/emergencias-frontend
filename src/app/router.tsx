import { createRouter } from '@tanstack/react-router'
import { queryClient } from './queryClient'
import { rutaInicio } from './rutas/inicio'
import { rutaRaiz } from './rutas/raiz'

// Rutas por código: no dependen de un archivo generado al levantar el proyecto.
const arbolDeRutas = rutaRaiz.addChildren([rutaInicio])

export const router = createRouter({
  routeTree: arbolDeRutas,
  context: { queryClient },
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
  scrollRestoration: true,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
