import { Link } from '@tanstack/react-router'
import { Text, XStack, YStack } from 'tamagui'
import { hora } from '../../shared/formato/fechas'
import type { EventoDeOperacion } from './api'
import { detalleDeEvento, TEXTO_EVENTO } from './textos'

/**
 * Lo que acaba de pasar, del hito más nuevo al más viejo. Es la memoria corta de la pantalla: contesta "¿qué me
 * perdí mientras miraba otra cosa?" sin tener que abrir cada incidente.
 */
type Props = {
  eventos: EventoDeOperacion[]
  /** Mismo alto que la tabla de al lado, para que las dos terminen parejas. Los eventos scrollean adentro. */
  alto: number
}

export function ActividadReciente({ eventos, alto }: Props) {
  return (
    <YStack height={alto} rounded={12} bg="$superficie" borderWidth={1} borderColor="$borde" overflow="hidden">
      <XStack items="center" height={44} px={16} bg="$fondo">
        <Text fontSize={12} fontWeight="500" color="$textoSecundario">
          Actividad reciente
        </Text>
      </XStack>

      {eventos.length === 0 ? (
        <YStack items="center" py={32} px={24} borderTopWidth={1} borderColor="$borde">
          <Text fontSize={14} color="$textoSecundario">
            Todavía no se movió nada en las últimas horas.
          </Text>
        </YStack>
      ) : (
        <YStack flex={1} minH={0} overflow="scroll">
          {eventos.map((evento) => (
            // El backend no manda un id por evento: la clave la forma el hito, que es único dentro de su atención.
            <Linea key={`${evento.atencionId}-${evento.tipo}`} evento={evento} />
          ))}
        </YStack>
      )}
    </YStack>
  )
}

function Linea({ evento }: { evento: EventoDeOperacion }) {
  const detalle = detalleDeEvento(evento)

  return (
    <XStack items="center" gap={12} px={16} py={10} borderTopWidth={1} borderColor="$borde">
      <Text fontSize={13} fontFamily="$mono" color="$textoSecundario" width={48} shrink={0}>
        {hora(evento.hora)}
      </Text>
      <Text fontSize={13} fontFamily="$mono" fontWeight="600" color="$texto" width={90} shrink={0}>
        {evento.placa}
      </Text>
      <Text fontSize={13} color="$texto" flex={1} minW={0} numberOfLines={1}>
        {TEXTO_EVENTO[evento.tipo]}
        {detalle ? ` · ${detalle}` : ''}
      </Text>
      <EnlaceAlOrigen evento={evento} />
    </XStack>
  )
}

/** De qué venía la unidad cuando hizo esto: el incidente o el traslado del que salió el hito. */
function EnlaceAlOrigen({ evento }: { evento: EventoDeOperacion }) {
  if (evento.trasladoId !== null) {
    return (
      <Link
        to="/traslados/$trasladoId"
        params={{ trasladoId: evento.trasladoId }}
        style={{ textDecoration: 'none' }}
      >
        <Text fontSize={12} fontWeight="500" color="$primarioPresionado" shrink={0}>
          Traslado #{evento.trasladoId}
        </Text>
      </Link>
    )
  }
  if (evento.incidenteId !== null) {
    return (
      <Link
        to="/incidentes/$incidenteId"
        params={{ incidenteId: evento.incidenteId }}
        style={{ textDecoration: 'none' }}
      >
        <Text fontSize={12} fontWeight="500" color="$primarioPresionado" shrink={0}>
          Incidente #{evento.incidenteId}
        </Text>
      </Link>
    )
  }
  return null
}
