import { createRoute } from '@tanstack/react-router'
import { IncidentesPage } from '../../features/incidentes/IncidentesPage'
import { rutaRaiz } from './raiz'

export const rutaIncidentes = createRoute({
  getParentRoute: () => rutaRaiz,
  path: '/incidentes',
  component: IncidentesPage,
})
