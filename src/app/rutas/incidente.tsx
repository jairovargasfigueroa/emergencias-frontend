import { createRoute } from '@tanstack/react-router'
import { validarBusquedaIncidentes } from '../../features/incidentes/busqueda'
import { DetalleIncidentePage } from '../../features/incidentes/DetalleIncidentePage'
import { rutaProtegida } from './protegida'

export const rutaIncidente = createRoute({
  getParentRoute: () => rutaProtegida,
  path: '/incidentes/$incidenteId',
  // En la URL el id es texto; la página lo recibe como número (NaN si no lo es) y avisa que no existe.
  params: {
    parse: ({ incidenteId }) => ({ incidenteId: Number(incidenteId) }),
    stringify: ({ incidenteId }) => ({ incidenteId: String(incidenteId) }),
  },
  // El filtro y la página de la lista desde la que se abrió, para volver a ella tal como estaba. Quien entra directo
  // no trae nada y vuelve a la lista de siempre.
  validateSearch: validarBusquedaIncidentes,
  component: DetalleIncidentePage,
})
