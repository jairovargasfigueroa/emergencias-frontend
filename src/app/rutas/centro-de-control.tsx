import { createRoute } from '@tanstack/react-router'
import { CentroDeControlPage } from '../../features/monitoreo/CentroDeControlPage'
import { rutaProtegida } from './protegida'

export const rutaCentroDeControl = createRoute({
  getParentRoute: () => rutaProtegida,
  path: '/centro-de-control',
  component: CentroDeControlPage,
})
