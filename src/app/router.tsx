import { createRouter } from '@tanstack/react-router'
import { queryClient } from './queryClient'
import { rutaFlota } from './rutas/flota'
import { rutaIncidente } from './rutas/incidente'
import { rutaIncidentes } from './rutas/incidentes'
import { rutaInicio } from './rutas/inicio'
import { rutaLogin } from './rutas/login'
import { rutaPersonal } from './rutas/personal'
import { rutaProtegida } from './rutas/protegida'
import { rutaRaiz } from './rutas/raiz'

// Rutas por código: no dependen de un archivo generado al levantar el proyecto. Todo cuelga de la ruta protegida
// menos el login, que es lo único que se puede ver sin sesión.
const arbolDeRutas = rutaRaiz.addChildren([
  rutaLogin,
  rutaProtegida.addChildren([rutaInicio, rutaFlota, rutaPersonal, rutaIncidentes, rutaIncidente]),
])

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
