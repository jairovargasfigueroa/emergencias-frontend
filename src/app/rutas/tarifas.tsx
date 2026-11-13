import { createRoute } from '@tanstack/react-router'
import { TarifasPage } from '../../features/cobros/TarifasPage'
import { rutaProtegida } from './protegida'

export const rutaTarifas = createRoute({
  getParentRoute: () => rutaProtegida,
  path: '/tarifas',
  component: TarifasPage,
})
