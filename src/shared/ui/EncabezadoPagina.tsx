import type { ReactNode } from 'react'
import { H1, Paragraph, XStack, YStack } from 'tamagui'

type Props = {
  titulo: string
  descripcion: string
  accion?: ReactNode
}

export function EncabezadoPagina({ titulo, descripcion, accion }: Props) {
  return (
    <XStack render="header" items="flex-end" justify="space-between" gap={24} flexWrap="wrap">
      <YStack gap={4}>
        <H1 color="$texto" fontSize={24} lineHeight={32} fontWeight="600">
          {titulo}
        </H1>
        <Paragraph color="$textoSecundario" fontSize={14} lineHeight={20}>
          {descripcion}
        </Paragraph>
      </YStack>
      {accion}
    </XStack>
  )
}
