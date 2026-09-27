import { ScrollView, Text, XStack, YStack, type YStackProps } from 'tamagui'
import { TIPO_UNIDAD_CORTO, type EstadoAmbulancia as Estado } from '../flota/api'
import { EstadoAmbulancia } from '../flota/EstadoAmbulancia'
import type { UnidadMonitoreada } from './posiciones'

const ANCHO = 320

/**
 * Orden de la lista: primero lo que está pasando ahora y al final lo que no circula. Así el administrador no
 * tiene que buscar entre las unidades quietas las que sí están en la calle.
 */
const ORDEN: Record<Estado, number> = {
  EN_ATENCION: 0,
  DISPONIBLE: 1,
  SIN_TURNO: 2,
  FUERA_DE_SERVICIO: 3,
}

type Props = {
  unidades: UnidadMonitoreada[]
  /** Mismo alto que el mapa, para que las dos columnas terminen a la misma altura. */
  alto: YStackProps['height']
}

/**
 * Toda la flota en servicio, esté o no en el mapa. Las que no circulan también aparecen: que una unidad no se
 * vea en el mapa tiene que tener una explicación a la vista, y no parecer que se perdió.
 */
export function ListaDeUnidades({ unidades, alto }: Props) {
  const ordenadas = [...unidades].sort(
    (una, otra) =>
      ORDEN[una.ambulancia.estado] - ORDEN[otra.ambulancia.estado] ||
      una.ambulancia.placa.localeCompare(otra.ambulancia.placa),
  )

  return (
    <YStack
      width={ANCHO}
      shrink={0}
      height={alto}
      rounded={12}
      overflow="hidden"
      bg="$superficie"
      borderWidth={1}
      borderColor="$borde"
    >
      <XStack items="center" justify="space-between" height={44} px={16} bg="$fondo" shrink={0}>
        <Text fontSize={12} fontWeight="500" color="$textoSecundario">
          Unidades
        </Text>
        <Text fontSize={12} fontWeight="500" color="$textoSecundario">
          {ordenadas.length}
        </Text>
      </XStack>

      {ordenadas.length === 0 ? (
        <YStack flex={1} items="center" justify="center" px={24}>
          <Text fontSize={14} color="$textoSecundario" text="center">
            No hay unidades en la flota todavía.
          </Text>
        </YStack>
      ) : (
        <ScrollView flex={1}>
          {ordenadas.map((unidad) => (
            <Fila key={unidad.ambulancia.id} unidad={unidad} />
          ))}
        </ScrollView>
      )}
    </YStack>
  )
}

function Fila({ unidad }: { unidad: UnidadMonitoreada }) {
  const { ambulancia, desactualizada } = unidad

  return (
    <YStack gap={6} px={16} py={12} borderTopWidth={1} borderColor="$borde">
      <XStack items="center" justify="space-between" gap={12}>
        <Text fontSize={14} fontWeight="600" color="$texto" numberOfLines={1}>
          {ambulancia.placa}
        </Text>
        <EstadoAmbulancia estado={ambulancia.estado} />
      </XStack>
      <XStack items="center" gap={6}>
        <Text fontSize={12} color="$textoSecundario">
          {TIPO_UNIDAD_CORTO[ambulancia.tipoUnidad]}
        </Text>
        <Text fontSize={12} color="$textoTenue">
          ·
        </Text>
        <Text fontSize={12} color={desactualizada ? '$primarioPresionado' : '$textoSecundario'} numberOfLines={1}>
          {textoDeReporte(unidad)}
        </Text>
      </XStack>
    </YStack>
  )
}

/** Qué se sabe de la posición de esta unidad y desde cuándo. */
function textoDeReporte({ posicion, segundosDesdeReporte }: UnidadMonitoreada): string {
  if (!posicion) {
    return 'Sin posición'
  }
  if (segundosDesdeReporte === null) {
    return 'Reportó sin hora'
  }
  return `Reportó ${haceCuanto(segundosDesdeReporte)}`
}

/** "hace 5 s", "hace 4 min", "hace 2 h", "hace 3 d". */
function haceCuanto(segundos: number): string {
  if (segundos < 60) {
    return `hace ${segundos} s`
  }
  const minutos = Math.floor(segundos / 60)
  if (minutos < 60) {
    return `hace ${minutos} min`
  }
  const horas = Math.floor(minutos / 60)
  if (horas < 24) {
    return `hace ${horas} h`
  }
  return `hace ${Math.floor(horas / 24)} d`
}
