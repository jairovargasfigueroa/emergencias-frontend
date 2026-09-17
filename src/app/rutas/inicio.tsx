import { Navigate, createRoute } from '@tanstack/react-router'
import { rutaRaiz } from './raiz'

/** El panel abre en la flota. */
export const rutaInicio = createRoute({
  getParentRoute: () => rutaRaiz,
  path: '/',
  component: IrAFlota,
})

function IrAFlota() {
  return <Navigate to="/flota" replace />
}
