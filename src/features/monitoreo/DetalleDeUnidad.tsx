import { Link } from '@tanstack/react-router'
import { Fragment, useState } from 'react'
import { Button, Text, XStack, YStack } from 'tamagui'
import { hora, tiempoTranscurrido } from '../../shared/formato/fechas'
import { DialogoCerrarTurno, type TurnoPorCerrar } from '../personal/DialogoCerrarTurno'
import { cierreSegunEstado, type AtencionEnCurso, type CierreDesdeLaCentral } from './api'
import { DialogoCerrarAtencion } from './DialogoCerrarAtencion'
import type { UnidadMonitoreada } from './posiciones'
import { TEXTO_HITO, TEXTO_ORIGEN } from './textos'

type Props = {
  unidad: UnidadMonitoreada
  ahora: number
}

/**
 * La atención que se va a cerrar y el cierre que le corresponde, tomados al abrir el diálogo: si la unidad avanza
 * mientras está abierto, el diálogo no cambia de acción bajo el cursor, y el servidor rechaza lo que quedó viejo.
 */
type AtencionPorCerrar = { atencion: AtencionEnCurso; cierre: CierreDesdeLaCentral }

/**
 * Lo que no entra en la fila y hace falta para decidir: a quién llamar, cuánto tardó en cada paso y por dónde
 * seguir. Se despliega debajo de la fila y no en un diálogo, para no tapar el resto de la flota.
 */
export function DetalleDeUnidad({ unidad, ahora }: Props) {
  const { placa, tripulacion, turnoDesde, atencion } = unidad.unidad
  const [porCerrar, setPorCerrar] = useState<AtencionPorCerrar | null>(null)
  const [turnoPorCerrar, setTurnoPorCerrar] = useState<TurnoPorCerrar | null>(null)
  const cierre = atencion ? cierreSegunEstado(atencion.estado) : null

  return (
    <YStack gap={16} px={24} py={16} bg="$fondo" borderTopWidth={1} borderColor="$borde">
      <XStack gap={32} flexWrap="wrap">
        <YStack gap={8} minW={260}>
          <Text fontSize={12} fontWeight="500" color="$textoSecundario">
            {tripulacion.length === 1 ? 'A bordo' : `A bordo (${tripulacion.length})`}
          </Text>
          {tripulacion.length === 0 ? (
            <Text fontSize={13} color="$textoTenue">
              Nadie abrió turno en esta unidad.
            </Text>
          ) : (
            tripulacion.map((tripulante) => (
              <XStack key={tripulante.id} items="center" gap={10} flexWrap="wrap">
                <Text fontSize={13} color="$texto">
                  {tripulante.nombreCompleto}
                </Text>
                <a href={`tel:${tripulante.telefono}`} style={{ textDecoration: 'none' }}>
                  <Text fontSize={13} fontFamily="$mono" color="$primarioPresionado">
                    {tripulante.telefono}
                  </Text>
                </a>
                {/* Para quien se fue sin cerrarlo. Con una atención en curso se ve apagado: el motivo va debajo. */}
                <Button
                  size="$3"
                  variant="outlined"
                  disabled={atencion !== null}
                  opacity={atencion ? 0.5 : 1}
                  onPress={() =>
                    setTurnoPorCerrar({ paramedicoId: tripulante.id, nombre: tripulante.nombreCompleto, placa })
                  }
                >
                  <Button.Text fontSize={12} fontWeight="600" color="$texto">
                    Cerrar turno
                  </Button.Text>
                </Button>
              </XStack>
            ))
          )}
          {/* Una vez, y no en cada tripulante: el motivo es el mismo para todos. */}
          {atencion && tripulacion.length > 0 ? (
            <Text fontSize={12} color="$textoSecundario">
              Para cerrar un turno, primero cierra la atención.
            </Text>
          ) : null}
          {turnoDesde ? (
            <Text fontSize={12} color="$textoSecundario">
              En turno desde las {hora(turnoDesde)}
            </Text>
          ) : null}
        </YStack>

        <YStack gap={8} flex={1} minW={320}>
          <Text fontSize={12} fontWeight="500" color="$textoSecundario">
            Lo que va del trabajo
          </Text>
          {atencion ? (
            <LineaDeTiempo atencion={atencion} ahora={ahora} />
          ) : (
            <Text fontSize={13} color="$textoTenue">
              Esta unidad no está atendiendo nada ahora.
            </Text>
          )}
          {atencion ? (
            <XStack items="center" gap={16} flexWrap="wrap">
              <EnlaceAlTrabajo atencion={atencion} />
              {/* Para cuando la tripulación no puede cerrarla desde su app: la central la destraba. */}
              {cierre ? (
                <Button size="$3" variant="outlined" onPress={() => setPorCerrar({ atencion, cierre })}>
                  <Button.Text fontSize={12} fontWeight="600" color="$texto">
                    Cerrar la atención
                  </Button.Text>
                </Button>
              ) : null}
            </XStack>
          ) : null}
        </YStack>
      </XStack>

      {unidad.posicion === null ? (
        <Text fontSize={12} color="$textoSecundario">
          Esta unidad nunca reportó su posición, así que no está en el mapa.
        </Text>
      ) : null}

      {porCerrar ? (
        <DialogoCerrarAtencion
          atencion={porCerrar.atencion}
          cierre={porCerrar.cierre}
          placa={placa}
          onCerrar={() => setPorCerrar(null)}
        />
      ) : null}
      <DialogoCerrarTurno turno={turnoPorCerrar} onCerrar={() => setTurnoPorCerrar(null)} />
    </YStack>
  )
}

/**
 * Los hitos ocurridos con el tiempo que pasó entre uno y el siguiente, que es lo que se mira para saber dónde se
 * está demorando. El último tramo llega hasta ahora, porque ese paso todavía no terminó.
 */
function LineaDeTiempo({ atencion, ahora }: { atencion: AtencionEnCurso; ahora: number }) {
  if (atencion.hitos.length === 0) {
    return (
      <Text fontSize={13} color="$textoTenue">
        Todavía no hay hitos registrados.
      </Text>
    )
  }

  return (
    <XStack items="center" gap={8} flexWrap="wrap">
      {atencion.hitos.map((hito, indice) => {
        const anterior = indice === 0 ? null : atencion.hitos[indice - 1]
        return (
          <Fragment key={hito.clave}>
            {anterior ? <Separador texto={tiempoEntre(anterior.hora, hito.hora)} /> : null}
            <YStack gap={2}>
              <Text fontSize={12} color="$textoSecundario">
                {TEXTO_HITO[hito.clave]}
              </Text>
              <Text fontSize={13} fontFamily="$mono" color="$texto">
                {hora(hito.hora)}
              </Text>
            </YStack>
          </Fragment>
        )
      })}
      <Separador texto={tiempoTranscurrido(atencion.hitos[atencion.hitos.length - 1].hora, ahora)} />
      <Text fontSize={13} color="$textoSecundario">
        ahora
      </Text>
    </XStack>
  )
}

function Separador({ texto }: { texto: string }) {
  return (
    <XStack items="center" gap={6}>
      <YStack width={16} height={1} bg="$bordeFuerte" />
      <Text fontSize={11} color="$textoTenue">
        {texto}
      </Text>
      <YStack width={16} height={1} bg="$bordeFuerte" />
    </XStack>
  )
}

/** El origen completo, que es donde están el paciente, la dirección y el resto de la historia. */
function EnlaceAlTrabajo({ atencion }: { atencion: AtencionEnCurso }) {
  const etiqueta = `Ver el ${TEXTO_ORIGEN[atencion.origen].toLowerCase()}`

  if (atencion.origen === 'TRASLADO' && atencion.trasladoId !== null) {
    return (
      <Link
        to="/traslados/$trasladoId"
        params={{ trasladoId: atencion.trasladoId }}
        style={{ textDecoration: 'none' }}
      >
        <Text fontSize={13} fontWeight="500" color="$primarioPresionado">
          {etiqueta} #{atencion.trasladoId} →
        </Text>
      </Link>
    )
  }

  if (atencion.incidenteId !== null) {
    return (
      <Link
        to="/incidentes/$incidenteId"
        params={{ incidenteId: atencion.incidenteId }}
        style={{ textDecoration: 'none' }}
      >
        <Text fontSize={13} fontWeight="500" color="$primarioPresionado">
          {etiqueta} #{atencion.incidenteId} →
        </Text>
      </Link>
    )
  }

  return null
}

/** Cuánto pasó entre dos hitos. Se escribe sin "hace", que acá no aplica: es un tramo, no una antigüedad. */
function tiempoEntre(desde: string, hasta: string): string {
  return tiempoTranscurrido(desde, new Date(hasta).getTime())
}
