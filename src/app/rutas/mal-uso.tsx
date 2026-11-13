import { createRoute } from '@tanstack/react-router'
import { HistorialCiudadanoPage } from '../../features/mal-uso/HistorialCiudadanoPage'
import { MalUsoPage } from '../../features/mal-uso/MalUsoPage'
import { rutaProtegida } from './protegida'

export const rutaMalUso = createRoute({
  getParentRoute: () => rutaProtegida,
  path: '/mal-uso',
  component: MalUsoPage,
})

export const rutaHistorialCiudadano = createRoute({
  getParentRoute: () => rutaProtegida,
  path: '/mal-uso/$ciudadanoId',
  // En la URL el id es texto; la página lo recibe como número (NaN si no lo es) y avisa que no existe.
  params: {
    parse: ({ ciudadanoId }) => ({ ciudadanoId: Number(ciudadanoId) }),
    stringify: ({ ciudadanoId }) => ({ ciudadanoId: String(ciudadanoId) }),
  },
  component: HistorialCiudadanoPage,
})
