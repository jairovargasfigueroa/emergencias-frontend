import type { ReactNode } from 'react'
import { Text, XStack } from 'tamagui'

export type TonoInsignia = 'verde' | 'ambar' | 'gris' | 'contorno'

const TONOS = {
  verde: { fondo: '$disponibleTinte', texto: '$disponibleTexto', punto: '$disponible' },
  ambar: { fondo: '$enAtencionTinte', texto: '$enAtencionTexto', punto: '$enAtencion' },
  gris: { fondo: '$fueraServicioTinte', texto: '$fueraServicioTexto', punto: '$fueraServicio' },
} as const

type Props = {
  tono: TonoInsignia
  conPunto?: boolean
  children: ReactNode
}

/** Etiqueta de estado. Tamagui no trae una, así que se arma con sus componentes base. */
export function Insignia({ tono, conPunto = false, children }: Props) {
  if (tono === 'contorno') {
    return (
      <XStack self="flex-start" items="center" height={24} px={10} rounded={999} borderWidth={1} borderColor="$bordeFuerte">
        <Text fontSize={12} fontWeight="500" color="$textoSecundario">
          {children}
        </Text>
      </XStack>
    )
  }

  const colores = TONOS[tono]
  return (
    <XStack self="flex-start" items="center" gap={6} height={24} px={10} rounded={999} bg={colores.fondo}>
      {conPunto ? <XStack width={6} height={6} rounded={999} bg={colores.punto} /> : null}
      <Text fontSize={12} fontWeight="500" color={colores.texto}>
        {children}
      </Text>
    </XStack>
  )
}
