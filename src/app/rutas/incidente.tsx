import { createRoute } from '@tanstack/react-router'
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
  component: DetalleIncidentePage,
})
