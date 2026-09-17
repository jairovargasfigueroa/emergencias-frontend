import type { QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { XStack, YStack } from 'tamagui'
import { MarcaSga } from '../../shared/ui/MarcaSga'

export type ContextoRouter = {
  queryClient: QueryClient
}

export const rutaRaiz = createRootRouteWithContext<ContextoRouter>()({
  component: LayoutPanel,
})

function LayoutPanel() {
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
      </YStack>
      <YStack render="main" flex={1} minW={0} px={40} py={32} gap={24}>
        <Outlet />
      </YStack>
    </XStack>
  )
}
