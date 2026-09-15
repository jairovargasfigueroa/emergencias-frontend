import { createRoute } from '@tanstack/react-router'
import { H1, Paragraph, YStack } from 'tamagui'
import { rutaRaiz } from './raiz'

export const rutaInicio = createRoute({
  getParentRoute: () => rutaRaiz,
  path: '/',
  component: Inicio,
})

function Inicio() {
  return (
    <YStack gap={4}>
      <H1 color="$texto" fontSize={24} lineHeight={32}>
        Panel de administración
      </H1>
      <Paragraph color="$textoSecundario" fontSize={14}>
        Sistema de Gestión de Ambulancias.
      </Paragraph>
    </YStack>
  )
}
