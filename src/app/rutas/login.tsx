import { createRoute, redirect } from '@tanstack/react-router'
import { LoginPage } from '../../features/sesion/LoginPage'
import { leerSesion } from '../../shared/sesion/almacen'
import { rutaRaiz } from './raiz'

export const rutaLogin = createRoute({
  getParentRoute: () => rutaRaiz,
  path: '/login',
  beforeLoad: () => {
    // Con sesión abierta el login no tiene nada que hacer.
    if (leerSesion()) {
      throw redirect({ to: '/flota' })
    }
  },
  component: LoginPage,
})
