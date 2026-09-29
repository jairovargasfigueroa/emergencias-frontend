import { createRoute } from '@tanstack/react-router'
import { validarBusquedaTraslados } from '../../features/traslados/busqueda'
import { DetalleTrasladoPage } from '../../features/traslados/DetalleTrasladoPage'
import { rutaProtegida } from './protegida'

export const rutaTraslado = createRoute({
  getParentRoute: () => rutaProtegida,
  path: '/traslados/$trasladoId',
  // En la URL el id es texto; la página lo recibe como número (NaN si no lo es) y avisa que no existe.
  params: {
    parse: ({ trasladoId }) => ({ trasladoId: Number(trasladoId) }),
    stringify: ({ trasladoId }) => ({ trasladoId: String(trasladoId) }),
  },
  // La vista y el día de la lista desde la que se abrió, para volver a ella tal como estaba. Quien entra directo no
  // trae nada y vuelve a los traslados de hoy.
  validateSearch: validarBusquedaTraslados,
  component: DetalleTrasladoPage,
})
