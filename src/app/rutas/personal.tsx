import { createRoute } from '@tanstack/react-router'
import { PersonalPage } from '../../features/personal/PersonalPage'
import { rutaRaiz } from './raiz'

export const rutaPersonal = createRoute({
  getParentRoute: () => rutaRaiz,
  path: '/personal',
  component: PersonalPage,
})
