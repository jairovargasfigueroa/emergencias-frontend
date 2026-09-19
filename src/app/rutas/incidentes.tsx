import { createRoute } from '@tanstack/react-router'
import { validarBusquedaIncidentes } from '../../features/incidentes/busqueda'
import { IncidentesPage } from '../../features/incidentes/IncidentesPage'
import { rutaProtegida } from './protegida'

export const rutaIncidentes = createRoute({
  getParentRoute: () => rutaProtegida,
  path: '/incidentes',
  // El filtro y la página van en la URL: al volver del detalle con el botón atrás se ve lo mismo que antes.
  validateSearch: validarBusquedaIncidentes,
  component: IncidentesPage,
})
