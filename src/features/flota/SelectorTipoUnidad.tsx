import { Paragraph, Text, XStack, YStack } from 'tamagui'
import { DETALLE_TIPO_UNIDAD, TEXTO_TIPO_UNIDAD, TIPOS_UNIDAD, type TipoUnidad } from './api'

type Props = {
  valor: TipoUnidad
  onElegir: (tipo: TipoUnidad) => void
  /**
   * Por qué el tipo no se puede cambiar ahora. Con motivo, la lista queda apagada y lo explica debajo: si solo se
   * bloqueara, el administrador no sabría si es una regla o una falla de la pantalla.
   */
  motivoBloqueado?: string
}

/**
 * Elige el tipo de unidad de la Norma 430. Cada opción va con su descripción porque la sigla sola no dice qué
 * puede hacer la unidad, y de ahí sale qué traslados va a poder tomar.
 *
 * Tamagui trae `RadioGroup`, pero pinta el círculo y la etiqueta en una línea: acá cada opción es una tarjeta con
 * título y descripción, así que se arma con sus componentes base y se conservan los roles de accesibilidad.
 */
export function SelectorTipoUnidad({ valor, onElegir, motivoBloqueado }: Props) {
  const bloqueado = motivoBloqueado !== undefined

  return (
    <YStack gap={6}>
      <YStack role="radiogroup" aria-label="Tipo de unidad" gap={6}>
        {TIPOS_UNIDAD.map((tipo) => {
          const elegido = valor === tipo
          return (
            <XStack
              key={tipo}
              role="radio"
              aria-checked={elegido}
              aria-disabled={bloqueado || undefined}
              tabIndex={bloqueado ? -1 : 0}
              items="flex-start"
              gap={10}
              px={12}
              py={10}
              rounded={10}
              cursor={bloqueado ? 'default' : 'pointer'}
              borderWidth={1}
              borderColor={elegido ? '$primario' : '$borde'}
              bg={elegido ? '$primarioTinte' : 'transparent'}
              // El elegido se ve igual de nítido aunque esté bloqueado: es el dato que el administrador vino a
              // consultar. Los que no puede elegir son los que se apagan.
              opacity={bloqueado && !elegido ? 0.45 : 1}
              hoverStyle={bloqueado ? undefined : { borderColor: '$bordeFuerte' }}
              onPress={bloqueado ? undefined : () => onElegir(tipo)}
            >
              <YStack gap={2} flex={1} minW={0}>
                <Text fontSize={13} fontWeight="600" color="$texto">
                  {TEXTO_TIPO_UNIDAD[tipo]}
                </Text>
                <Text fontSize={12} color="$textoSecundario">
                  {DETALLE_TIPO_UNIDAD[tipo]}
                </Text>
              </YStack>
            </XStack>
          )
        })}
      </YStack>
      {motivoBloqueado ? (
        <Paragraph color="$textoSecundario" fontSize={12} lineHeight={16}>
          {motivoBloqueado}
        </Paragraph>
      ) : null}
    </YStack>
  )
}
