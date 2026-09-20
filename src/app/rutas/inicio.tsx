import { Navigate, createRoute } from '@tanstack/react-router'
import { rutaProtegida } from './protegida'

/** El panel abre en la flota. */
export const rutaInicio = createRoute({
  getParentRoute: () => rutaProtegida,
  path: '/',
  component: IrAFlota,
})

function IrAFlota() {
  return <Navigate to="/flota" replace />
}
