import { Text, XStack } from 'tamagui'
import { IconoResumenIa } from '../../shared/ui/iconos'

/**
 * Avisa en una lista que el incidente tiene resumen de la IA. Va en gris a propósito: la gravedad se lee en el
 * detalle, con su justificación al lado, y no suelta en una fila donde se confundiría con el estado.
 */
export function MarcaResumenIa() {
  return (
    <XStack items="center" gap={4} aria-label="Tiene resumen de la IA">
      <IconoResumenIa size={13} color="var(--textoSecundario)" />
      <Text fontSize={12} lineHeight={16} color="$textoSecundario">
        Resumen IA
      </Text>
    </XStack>
  )
}
