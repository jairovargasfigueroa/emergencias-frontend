import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createRoute, Navigate, Outlet, redirect } from '@tanstack/react-router'
import { Button, Text, XStack, YStack } from 'tamagui'
import { cerrarSesion, sesionQuery } from '../../features/sesion/queries'
import { leerSesion } from '../../shared/sesion/almacen'
import { MarcaSga } from '../../shared/ui/MarcaSga'
import { Navegacion } from '../Navegacion'
import { rutaRaiz } from './raiz'

/**
 * Todo el panel cuelga de acá: sin sesión no se llega a ninguna pantalla ni se dispara ninguna consulta. No tiene
 * ruta propia, solo envuelve a las demás.
 */
export const rutaProtegida = createRoute({
  getParentRoute: () => rutaRaiz,
  id: 'protegida',
  beforeLoad: () => {
    // Antes de cargar nada: quien entra por la barra de direcciones sin sesión va derecho al login.
    if (!leerSesion()) {
      throw redirect({ to: '/login' })
    }
  },
  component: LayoutPanel,
})

function LayoutPanel() {
  const queryClient = useQueryClient()
  const sesion = useQuery(sesionQuery()).data

  // La sesión también se cierra desde afuera, cuando el servidor responde 401 a cualquier consulta.
  if (!sesion) {
    return <Navigate to="/login" replace />
  }

  return (
    <XStack minH="100vh" bg="$fondo">
      <YStack
        render="aside"
        width={248}
        shrink={0}
        px={16}
        py={20}
        gap={28}
        bg="$superficie"
        borderRightWidth={1}
        borderColor="$borde"
      >
        <MarcaSga />
        <Navegacion />

        <YStack flex={1} justify="flex-end" gap={8}>
          <YStack px={8} gap={1}>
            <Text color="$texto" fontSize={13} fontWeight="500" numberOfLines={1}>
              {sesion.nombreCompleto}
            </Text>
            <Text color="$textoSecundario" fontSize={12} numberOfLines={1}>
              {sesion.correo}
            </Text>
          </YStack>
          <Button size="$3" variant="outlined" justify="flex-start" onPress={() => cerrarSesion(queryClient)}>
            <Button.Text color="$texto" fontSize={13} fontWeight="500">
              Salir
            </Button.Text>
          </Button>
        </YStack>
      </YStack>
      <YStack render="main" flex={1} minW={0} px={40} py={32} gap={24}>
        <Outlet />
      </YStack>
    </XStack>
  )
}
