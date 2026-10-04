import { Fragment } from 'react'
import { Text, XStack, YStack } from 'tamagui'
import { InsigniaEstadoAtencion } from '../../shared/atencion/InsigniaEstadoAtencion'
import { tiempoDeSegundos, tiempoTranscurrido } from '../../shared/formato/fechas'
import { IconoAviso } from '../../shared/ui/iconos'
import { FilaTabla, Tabla, TablaVacia, type ColumnaTabla } from '../../shared/ui/Tabla'
import { TIPO_UNIDAD_CORTO, type EstadoAmbulancia as Estado } from '../flota/api'
import { EstadoAmbulancia } from '../flota/EstadoAmbulancia'
import { BotonLlamar } from './BotonLlamar'
import { DetalleDeUnidad } from './DetalleDeUnidad'
import { cumpleFiltro, type FiltroDeUnidades, type UnidadMonitoreada } from './posiciones'
import { TEXTO_ORIGEN } from './textos'

/**
 * Cuatro columnas y no seis: el tipo va debajo de la placa y el tiempo en el paso junto al paso, que es donde se
 * lee. Así la tabla entra al lado del mapa en un monitor de 1280 sin cortar el trabajo, que es la columna que importa.
 */
const COLUMNAS: ColumnaTabla[] = [
  { titulo: 'Unidad', ancho: 124 },
  { titulo: 'Estado', ancho: 172 },
  { titulo: 'Trabajo' },
  { titulo: '', ancho: 64, alinearDerecha: true },
]

/**
 * Orden de la tabla: primero lo que está pasando ahora y al final lo que no circula. Dentro de cada estado, las
 * que perdieron la señal arriba: son las que hay que resolver antes de seguir mirando.
 */
const ORDEN: Record<Estado, number> = {
  EN_ATENCION: 0,
  DISPONIBLE: 1,
  SIN_TURNO: 2,
  FUERA_DE_SERVICIO: 3,
}

/**
 * Cuánto puede quedarse una unidad en el mismo hito antes de que valga la pena mirarla. No es una regla del
 * negocio —los docs no fijan ningún tiempo—, es una ayuda visual: pasado esto, el tiempo se pinta en ámbar.
 */
const MINUTOS_PARA_MIRAR = 20

type Props = {
  unidades: UnidadMonitoreada[]
  filtro: FiltroDeUnidades | null
  /** Ambulancia desplegada, que es también la que el mapa tiene centrada. */
  seleccionada: number | null
  onSeleccionar: (ambulanciaId: number | null) => void
  ahora: number
}

/**
 * Toda la flota en servicio, esté o no en el mapa. Las que no circulan también aparecen: que una unidad no se vea
 * en el mapa tiene que tener una explicación a la vista, y no parecer que se perdió. Ocupa el alto que le deja la
 * pantalla y las filas scrollean adentro.
 */
export function TablaDeUnidades({ unidades, filtro, seleccionada, onSeleccionar, ahora }: Props) {
  const visibles = unidades
    .filter((unidad) => cumpleFiltro(unidad, filtro))
    .sort(
      (una, otra) =>
        ORDEN[una.unidad.estado] - ORDEN[otra.unidad.estado] ||
        Number(otra.sinSenal) - Number(una.sinSenal) ||
        una.unidad.placa.localeCompare(otra.unidad.placa),
    )

  return (
    <Tabla columnas={COLUMNAS} llenar>
      {visibles.length === 0 ? (
        <TablaVacia>
          {filtro === null ? 'No hay unidades en la flota todavía.' : 'Ninguna unidad está en esa situación.'}
        </TablaVacia>
      ) : (
        visibles.map((unidad) => (
          <Fila
            key={unidad.unidad.ambulanciaId}
            unidad={unidad}
            desplegada={unidad.unidad.ambulanciaId === seleccionada}
            onSeleccionar={onSeleccionar}
            ahora={ahora}
          />
        ))
      )}
    </Tabla>
  )
}

type PropsFila = {
  unidad: UnidadMonitoreada
  desplegada: boolean
  onSeleccionar: (ambulanciaId: number | null) => void
  ahora: number
}

function Fila({ unidad, desplegada, onSeleccionar, ahora }: PropsFila) {
  const { placa, tipoUnidad, estado, atencion, ambulanciaId } = unidad.unidad
  const aLlamar = unidad.unidad.tripulacion[0]

  return (
    <Fragment>
      {/* Tocar la fila abre el detalle acá mismo y le dice al mapa que centre esta unidad; tocarla de nuevo cierra. */}
      <YStack onPress={() => onSeleccionar(desplegada ? null : ambulanciaId)}>
        <FilaTabla columnas={COLUMNAS} interactiva atenuada={desplegada}>
          {/* Para el teclado, el que despliega es la placa: un `<button>` de verdad. La fila entera no puede serlo
              porque adentro va el enlace para llamar. Su clic sube hasta la fila, así que no necesita el suyo. */}
          <YStack
            render="button"
            aria-expanded={desplegada}
            aria-label={`${placa}, ${TIPO_UNIDAD_CORTO[tipoUnidad]}: ${desplegada ? 'ocultar' : 'ver'} el detalle`}
            gap={2}
            minW={0}
            items="flex-start"
            p={0}
            bg="transparent"
            borderWidth={0}
            cursor="pointer"
            focusVisibleStyle={{ outlineWidth: 2, outlineStyle: 'solid', outlineColor: '$texto', outlineOffset: 4 }}
          >
            <Text fontSize={14} lineHeight={20} fontFamily="$mono" color="$texto">
              {placa}
            </Text>
            <Text fontSize={12} lineHeight={16} color="$textoSecundario">
              {TIPO_UNIDAD_CORTO[tipoUnidad]}
            </Text>
          </YStack>

          <YStack gap={4} minW={0}>
            <EstadoAmbulancia estado={estado} />
            <AvisoDeSenal unidad={unidad} />
          </YStack>

          <YStack gap={4} minW={0}>
            {atencion ? (
              <>
                <XStack items="center" gap={8}>
                  <InsigniaEstadoAtencion estado={atencion.estado} />
                  <TiempoEnElHito desde={atencion.desde} ahora={ahora} />
                </XStack>
                <Text fontSize={12} lineHeight={16} color="$textoSecundario" numberOfLines={1}>
                  {TEXTO_ORIGEN[atencion.origen]} #{atencion.incidenteId ?? atencion.trasladoId}
                  {atencion.etiqueta ? ` · ${atencion.etiqueta}` : ''}
                </Text>
              </>
            ) : (
              <Text fontSize={13} lineHeight={18} color="$textoSecundario">
                {textoSinTrabajo(estado)}
              </Text>
            )}
          </YStack>

          {aLlamar ? <BotonLlamar tripulante={aLlamar} /> : null}
        </FilaTabla>
      </YStack>

      {desplegada ? <DetalleDeUnidad unidad={unidad} ahora={ahora} /> : null}
    </Fragment>
  )
}

/** Por qué esta unidad no está haciendo nada. Callarlo dejaría la celda vacía sin decir si falta un dato. */
function textoSinTrabajo(estado: Estado): string {
  switch (estado) {
    case 'DISPONIBLE':
      return 'Sin asignación'
    case 'SIN_TURNO':
      return 'Sin tripulación'
    case 'FUERA_DE_SERVICIO':
      return 'Parada'
    default:
      return '—'
  }
}

/** Que no se vea en el mapa tiene dos causas distintas, y conviene no confundirlas. */
function AvisoDeSenal({ unidad }: { unidad: UnidadMonitoreada }) {
  if (unidad.sinSenal) {
    return (
      <XStack items="center" gap={4} minW={0}>
        <IconoAviso size={13} color="var(--primarioTinteTexto)" />
        <Text fontSize={12} lineHeight={16} color="$primarioTinteTexto" numberOfLines={1}>
          Sin señal
          {unidad.segundosDesdeReporte === null ? '' : ` · hace ${tiempoDeSegundos(unidad.segundosDesdeReporte)}`}
        </Text>
      </XStack>
    )
  }
  if (unidad.posicion === null && (unidad.unidad.estado === 'DISPONIBLE' || unidad.unidad.estado === 'EN_ATENCION')) {
    return (
      <Text fontSize={12} lineHeight={16} color="$textoSecundario" numberOfLines={1}>
        Sin ubicación
      </Text>
    )
  }
  return null
}

/**
 * Cuánto lleva la unidad en el hito en el que está. Es el dato más valioso de la tabla: dice si algo se atascó sin
 * tener que abrir nada. Va al lado del hito porque lo mide, y envejece solo con el tic del reloj de la página.
 */
function TiempoEnElHito({ desde, ahora }: { desde: string; ahora: number }) {
  const minutos = Math.max(0, Math.floor((ahora - new Date(desde).getTime()) / 60_000))
  const seEstira = minutos >= MINUTOS_PARA_MIRAR

  return (
    <Text
      fontSize={13}
      lineHeight={18}
      fontFamily="$mono"
      color={seEstira ? '$enAtencionTexto' : '$textoSecundario'}
      numberOfLines={1}
    >
      {tiempoTranscurrido(desde, ahora)}
    </Text>
  )
}
