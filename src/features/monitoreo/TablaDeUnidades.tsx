import { Fragment } from 'react'
import { Button, Text, YStack } from 'tamagui'
import { tiempoDeSegundos, tiempoTranscurrido } from '../../shared/formato/fechas'
import { FilaTabla, Tabla, TablaVacia, type ColumnaTabla } from '../../shared/ui/Tabla'
import { TIPO_UNIDAD_CORTO, type EstadoAmbulancia as Estado } from '../flota/api'
import { EstadoAmbulancia } from '../flota/EstadoAmbulancia'
import { InsigniaEstadoAtencion } from '../traslados/InsigniasDeTraslado'
import { DetalleDeUnidad } from './DetalleDeUnidad'
import { cumpleFiltro, type FiltroDeUnidades, type UnidadMonitoreada } from './posiciones'
import { TEXTO_ORIGEN } from './textos'

const COLUMNAS: ColumnaTabla[] = [
  { titulo: 'Placa', ancho: 110 },
  { titulo: 'Tipo', ancho: 90 },
  { titulo: 'Estado', ancho: 180 },
  { titulo: 'Trabajo' },
  { titulo: 'Hace', ancho: 110 },
  { titulo: '', ancho: 110, alinearDerecha: true },
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
 * en el mapa tiene que tener una explicación a la vista, y no parecer que se perdió.
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
    <Tabla columnas={COLUMNAS}>
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
      <YStack
        role="button"
        aria-expanded={desplegada}
        // Tocar la fila abre el detalle acá mismo y le dice al mapa que centre esta unidad; tocarla de nuevo cierra.
        onPress={() => onSeleccionar(desplegada ? null : ambulanciaId)}
      >
        <FilaTabla columnas={COLUMNAS} interactiva atenuada={desplegada}>
          <Text fontSize={14} fontWeight="600" fontFamily="$mono" color="$texto">
            {placa}
          </Text>

          <Text fontSize={13} color="$textoSecundario">
            {TIPO_UNIDAD_CORTO[tipoUnidad]}
          </Text>

          <YStack gap={4} minW={0}>
            <EstadoAmbulancia estado={estado} />
            <AvisoDeSenal unidad={unidad} />
          </YStack>

          <YStack gap={4} minW={0}>
            {atencion ? (
              <>
                <InsigniaEstadoAtencion estado={atencion.estado} />
                <Text fontSize={12} color="$textoSecundario" numberOfLines={1}>
                  {TEXTO_ORIGEN[atencion.origen]} #{atencion.incidenteId ?? atencion.trasladoId}
                  {atencion.etiqueta ? ` · ${atencion.etiqueta}` : ''}
                </Text>
              </>
            ) : (
              <Text fontSize={13} color="$textoTenue">
                {textoSinTrabajo(estado)}
              </Text>
            )}
          </YStack>

          <TiempoEnElHito unidad={unidad} ahora={ahora} />

          {aLlamar ? (
            <a
              href={`tel:${aLlamar.telefono}`}
              style={{ textDecoration: 'none' }}
              title={`Llamar a ${aLlamar.nombreCompleto}`}
              // La fila entera despliega el detalle: sin esto, llamar también la abriría.
              onClick={(evento) => evento.stopPropagation()}
            >
              <Button size="$3" variant="outlined">
                <Button.Text fontSize={12} fontWeight="600" color="$texto">
                  Llamar
                </Button.Text>
              </Button>
            </a>
          ) : null}
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
      <Text fontSize={12} color="$primarioPresionado" numberOfLines={1}>
        ⚠ Sin señal
        {unidad.segundosDesdeReporte === null ? '' : ` · hace ${tiempoDeSegundos(unidad.segundosDesdeReporte)}`}
      </Text>
    )
  }
  if (unidad.posicion === null && (unidad.unidad.estado === 'DISPONIBLE' || unidad.unidad.estado === 'EN_ATENCION')) {
    return (
      <Text fontSize={12} color="$textoTenue" numberOfLines={1}>
        Sin ubicación
      </Text>
    )
  }
  return null
}

/**
 * Cuánto lleva la unidad en el hito en el que está. Es el dato más valioso de la pantalla: dice si algo se
 * atascó sin tener que abrir nada. Envejece solo con el tic del reloj de la página.
 */
function TiempoEnElHito({ unidad, ahora }: { unidad: UnidadMonitoreada; ahora: number }) {
  const atencion = unidad.unidad.atencion
  if (!atencion) {
    return (
      <Text fontSize={13} color="$textoTenue">
        —
      </Text>
    )
  }

  const minutos = Math.max(0, Math.floor((ahora - new Date(atencion.desde).getTime()) / 60_000))
  const seEstira = minutos >= MINUTOS_PARA_MIRAR

  return (
    <Text fontSize={13} fontWeight={seEstira ? '600' : '400'} color={seEstira ? '$enAtencionTexto' : '$texto'}>
      {tiempoTranscurrido(atencion.desde, ahora)}
    </Text>
  )
}
