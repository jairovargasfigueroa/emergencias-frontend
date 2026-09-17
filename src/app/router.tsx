import { createRouter } from '@tanstack/react-router'
import { queryClient } from './queryClient'
import { rutaFlota } from './rutas/flota'
import { rutaIncidentes } from './rutas/incidentes'
import { rutaInicio } from './rutas/inicio'
import { rutaPersonal } from './rutas/personal'
import { rutaRaiz } from './rutas/raiz'

// Rutas por código: no dependen de un archivo generado al levantar el proyecto.
const arbolDeRutas = rutaRaiz.addChildren([rutaInicio, rutaFlota, rutaPersonal, rutaIncidentes])

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
