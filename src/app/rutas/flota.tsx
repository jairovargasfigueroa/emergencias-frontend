import { createRoute } from '@tanstack/react-router'
import { FlotaPage } from '../../features/flota/FlotaPage'
import { rutaRaiz } from './raiz'

export const rutaFlota = createRoute({
  getParentRoute: () => rutaRaiz,
  path: '/flota',
  component: FlotaPage,
})
