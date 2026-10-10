import { Navigate, createRoute } from '@tanstack/react-router'
import { rutaProtegida } from './protegida'

/** El panel abre en el Centro de control: es la pantalla que el operador tiene abierta todo el turno. */
export const rutaInicio = createRoute({
  getParentRoute: () => rutaProtegida,
  path: '/',
  component: IrAlCentroDeControl,
})

function IrAlCentroDeControl() {
  return <Navigate to="/centro-de-control" replace />
}
