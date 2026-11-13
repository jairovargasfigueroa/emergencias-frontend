import { createRoute } from '@tanstack/react-router'
import { ReportesPage } from '../../features/reportes/ReportesPage'
import { rutaProtegida } from './protegida'

export const rutaReportes = createRoute({
  getParentRoute: () => rutaProtegida,
  path: '/reportes',
  component: ReportesPage,
})
