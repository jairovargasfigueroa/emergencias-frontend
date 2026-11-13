import { createRoute } from '@tanstack/react-router'
import { CentrosSaludPage } from '../../features/centros-salud/CentrosSaludPage'
import { rutaProtegida } from './protegida'

export const rutaCentrosSalud = createRoute({
  getParentRoute: () => rutaProtegida,
  path: '/centros-salud',
  component: CentrosSaludPage,
})
