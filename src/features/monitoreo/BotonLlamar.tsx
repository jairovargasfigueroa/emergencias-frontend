import { Text, XStack } from 'tamagui'
import { IconoTelefono } from '../../shared/ui/iconos'
import type { Tripulante } from './api'

type Props = {
  tripulante: Tripulante
  /** Con el número a la vista. Sin él queda solo el ícono, para las filas donde no hay lugar. */
  conNumero?: boolean
}

/**
 * Llamar a la tripulación. Es un enlace `tel:` y no un botón: en un teléfono marca solo, y en el escritorio, donde
 * `tel:` casi nunca abre nada, lo que sirve es el número a la vista para marcarlo a mano.
 */
export function BotonLlamar({ tripulante, conNumero = false }: Props) {
  return (
    <a
      href={`tel:${tripulante.telefono}`}
      style={{ textDecoration: 'none' }}
      title={`Llamar a ${tripulante.nombreCompleto}: ${tripulante.telefono}`}
      aria-label={`Llamar a ${tripulante.nombreCompleto}, ${tripulante.telefono}`}
      // Dentro de una fila que se despliega al tocarla: llamar no tiene que abrirla también.
      onClick={(evento) => evento.stopPropagation()}
    >
      <XStack
        items="center"
        justify="center"
        gap={8}
        height={36}
        width={conNumero ? undefined : 36}
        px={conNumero ? 12 : 0}
        rounded={8}
        borderWidth={1}
        borderColor="$bordeFuerte"
        hoverStyle={{ bg: '$fondo' }}
      >
        <IconoTelefono size={16} color="var(--texto)" />
        {conNumero ? (
          <Text fontSize={13} fontFamily="$mono" color="$texto">
            {tripulante.telefono}
          </Text>
        ) : null}
      </XStack>
    </a>
  )
}
