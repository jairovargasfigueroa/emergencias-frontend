import { createRoute } from '@tanstack/react-router'
import { PersonalPage } from '../../features/personal/PersonalPage'
import { rutaProtegida } from './protegida'

export const rutaPersonal = createRoute({
  getParentRoute: () => rutaProtegida,
  path: '/personal',
  component: PersonalPage,
})
