import { createRoute } from '@tanstack/react-router'
import { validarBusquedaTraslados } from '../../features/traslados/busqueda'
import { TrasladosPage } from '../../features/traslados/TrasladosPage'
import { rutaProtegida } from './protegida'

export const rutaTraslados = createRoute({
  getParentRoute: () => rutaProtegida,
  path: '/traslados',
  // La vista y el día van en la URL: al volver del detalle se ve lo mismo que antes.
  validateSearch: validarBusquedaTraslados,
  component: TrasladosPage,
})
