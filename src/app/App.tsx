import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { useSyncExternalStore } from 'react'
import { TamaguiProvider, ToastProvider, ToastViewport } from 'tamagui'
import { ToastActual } from '../shared/ui/ToastActual'
import config from '../tamagui.config'
import { queryClient } from './queryClient'
import { router } from './router'

const CONSULTA_OSCURO = '(prefers-color-scheme: dark)'

function suscribirAlEsquema(avisar: () => void) {
  const consulta = window.matchMedia(CONSULTA_OSCURO)
  consulta.addEventListener('change', avisar)
  return () => consulta.removeEventListener('change', avisar)
}

function leerEsquema(): 'light' | 'dark' {
  return window.matchMedia(CONSULTA_OSCURO).matches ? 'dark' : 'light'
}

export function App() {
  // Tamagui aplica el tema por clase: hay que leer el esquema del sistema y pasárselo.
  const esquema = useSyncExternalStore(suscribirAlEsquema, leerEsquema, () => 'light' as const)

  return (
    <QueryClientProvider client={queryClient}>
      <TamaguiProvider config={config} defaultTheme={esquema}>
        <ToastProvider duration={4000} swipeDirection="horizontal">
          <RouterProvider router={router} />
          <ToastActual />
          <ToastViewport flexDirection="column-reverse" t={16} r={16} />
        </ToastProvider>
      </TamaguiProvider>
    </QueryClientProvider>
  )
}
