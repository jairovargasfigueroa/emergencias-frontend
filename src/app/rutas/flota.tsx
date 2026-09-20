import { createRoute } from '@tanstack/react-router'
import { FlotaPage } from '../../features/flota/FlotaPage'
import { rutaProtegida } from './protegida'

export const rutaFlota = createRoute({
  getParentRoute: () => rutaProtegida,
  path: '/flota',
  component: FlotaPage,
})
