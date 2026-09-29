import { Text, XStack, YStack } from 'tamagui'

type Props = {
  titulo: string
  /** Lo que quiere decir elegirla, debajo del título. Sin él, la opción lleva solo el título. */
  detalle?: string | null
  elegida: boolean
  onElegir: () => void
}

/**
 * Una opción de una lista de la que se elige una sola, como tarjeta con título y explicación. Va dentro de un
 * contenedor con `role="radiogroup"`.
 *
 * Tamagui trae `RadioGroup`, pero pinta el círculo y la etiqueta en una línea: como en el selector de tipo de unidad,
 * cada opción se arma con sus componentes base y se conservan los roles de accesibilidad.
 */
export function OpcionElegible({ titulo, detalle, elegida, onElegir }: Props) {
  return (
    <XStack
      role="radio"
      aria-checked={elegida}
      tabIndex={0}
      items="flex-start"
      gap={10}
      px={12}
      py={10}
      rounded={10}
      cursor="pointer"
      borderWidth={1}
      borderColor={elegida ? '$primario' : '$borde'}
      bg={elegida ? '$primarioTinte' : 'transparent'}
      hoverStyle={{ borderColor: elegida ? '$primario' : '$bordeFuerte' }}
      onPress={onElegir}
    >
      <YStack gap={2} flex={1} minW={0}>
        <Text fontSize={13} fontWeight="600" color="$texto">
          {titulo}
        </Text>
        {detalle ? (
          <Text fontSize={12} color="$textoSecundario">
            {detalle}
          </Text>
        ) : null}
      </YStack>
    </XStack>
  )
}
