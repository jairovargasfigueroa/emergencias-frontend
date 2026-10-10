import { Link } from '@tanstack/react-router'
import { Text, XStack, YStack } from 'tamagui'
import { hora } from '../../shared/formato/fechas'
import { IconoSiguiente } from '../../shared/ui/iconos'
import type { EventoDeOperacion } from './api'
import { detalleDeEvento, TEXTO_EVENTO } from './textos'

type Props = {
  eventos: EventoDeOperacion[]
  /** Plegada deja solo el encabezado y el mapa se queda con el alto. */
  abierta: boolean
  onAlternar: () => void
}

/**
 * Lo que acaba de pasar, del hito más nuevo al más viejo. Es la memoria corta de la pantalla: contesta "¿qué me
 * perdí mientras miraba otra cosa?" sin tener que abrir cada incidente. Ocupa el alto que le deja el contenedor y
 * los eventos scrollean adentro.
 */
export function ActividadReciente({ eventos, abierta, onAlternar }: Props) {
  return (
    <YStack
      // Crece solo cuando hay eventos que mostrar: plegada o vacía, mide lo que mide su contenido.
      flex={abierta && eventos.length > 0 ? 1 : undefined}
      minH={0}
      rounded={12}
      bg="$superficie"
      borderWidth={1}
      borderColor="$borde"
      overflow="hidden"
    >
      <XStack
        render="button"
        aria-expanded={abierta}
        items="center"
        gap={8}
        height={44}
        px={16}
        bg="$fondo"
        borderWidth={0}
        cursor="pointer"
        hoverStyle={{ bg: '$borde' }}
        focusVisibleStyle={{ outlineWidth: 2, outlineStyle: 'solid', outlineColor: '$texto', outlineOffset: -2 }}
        onPress={onAlternar}
      >
        <YStack rotate={abierta ? '90deg' : '0deg'}>
          <IconoSiguiente size={14} color="var(--textoSecundario)" />
        </YStack>
        <Text fontSize={12} lineHeight={16} fontWeight="500" color="$textoSecundario">
          Actividad reciente
        </Text>
      </XStack>

      {!abierta ? null : eventos.length === 0 ? (
        <YStack items="center" py={24} px={24} borderTopWidth={1} borderColor="$borde">
          <Text fontSize={13} lineHeight={18} color="$textoSecundario">
            Todavía no se movió nada en las últimas horas.
          </Text>
        </YStack>
      ) : (
        <YStack flex={1} minH={0} overflowY="auto">
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
      <Text fontSize={13} fontFamily="$mono" color="$textoSecundario" width={44} shrink={0}>
        {hora(evento.hora)}
      </Text>
      <Text fontSize={13} color="$texto" flex={1} minW={0} numberOfLines={1}>
        <Text fontFamily="$mono">{evento.placa}</Text> {TEXTO_EVENTO[evento.tipo]}
        {detalle ? ` · ${detalle}` : ''}
      </Text>
      <EnlaceAlOrigen evento={evento} />
    </XStack>
  )
}

/**
 * De qué venía la unidad cuando hizo esto: el incidente o el traslado del que salió el hito. Subrayado y no en
 * rojo: el rojo queda para lo que pide una decisión.
 */
function EnlaceAlOrigen({ evento }: { evento: EventoDeOperacion }) {
  if (evento.trasladoId !== null) {
    return (
      <Link
        to="/traslados/$trasladoId"
        params={{ trasladoId: evento.trasladoId }}
        style={{ textDecoration: 'none' }}
      >
        <Text fontSize={12} fontWeight="500" color="$textoSecundario" textDecorationLine="underline" shrink={0}>
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
        <Text fontSize={12} fontWeight="500" color="$textoSecundario" textDecorationLine="underline" shrink={0}>
          Incidente #{evento.incidenteId}
        </Text>
      </Link>
    )
  }
  return null
}
