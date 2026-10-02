import type { ReactNode } from 'react'
import { H2, Text, YStack } from 'tamagui'

// Las piezas con que se arma el detalle de un incidente. Viven aparte para que las secciones que se suman al detalle
// desde otras features se vean igual que las de la página.

export function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <YStack render="section" gap={12}>
      <H2 color="$texto" fontSize={16} lineHeight={24} fontWeight="600">
        {titulo}
      </H2>
      {children}
    </YStack>
  )
}

export function Tarjeta({ children }: { children: ReactNode }) {
  return (
    <YStack px={24} py={20} bg="$superficie" borderWidth={1} borderColor="$borde" rounded={12}>
      {children}
    </YStack>
  )
}

/** Un dato con su etiqueta encima. */
export function Dato({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <YStack gap={4} items="flex-start" minW={140}>
      <Text fontSize={12} lineHeight={16} fontWeight="500" color="$textoSecundario">
        {etiqueta}
      </Text>
      {children}
    </YStack>
  )
}

export function Valor({ children, tenue = false, mono = false }: { children: ReactNode; tenue?: boolean; mono?: boolean }) {
  return (
    <Text
      fontSize={mono ? 13 : 14}
      lineHeight={20}
      fontFamily={mono ? '$mono' : undefined}
      fontWeight={mono ? '500' : '400'}
      color={tenue ? '$textoTenue' : '$texto'}
    >
      {children}
    </Text>
  )
}

export function Nota({ children }: { children: ReactNode }) {
  return (
    <Text fontSize={12} lineHeight={16} color="$textoSecundario">
      {children}
    </Text>
  )
}
