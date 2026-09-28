import { Link } from '@tanstack/react-router'
import { useState, type ReactNode } from 'react'
import { Button, Text, XStack, YStack, type YStackProps } from 'tamagui'
import { tiempoDeSegundos, tiempoTranscurrido } from '../../shared/formato/fechas'
import type { EstadoAmbulancia } from '../flota/api'
import type { Traslado, TrasladoDelPanel } from '../traslados/api'
import { AccionDelProblema, TiempoRestante } from '../traslados/AvisosDeTraslado'
import { DialogoAsignar } from '../traslados/DialogoAsignar'
import { avisoDelProblema } from '../traslados/textos'
import type { IncidenteSinCubrir } from './api'
import type { FiltroDeUnidades, UnidadMonitoreada } from './posiciones'

type Props = {
  unidades: UnidadMonitoreada[]
  incidentesSinCubrir: IncidenteSinCubrir[]
  trasladosSinCubrir: TrasladoDelPanel[]
  filtro: FiltroDeUnidades | null
  onFiltrar: (filtro: FiltroDeUnidades | null) => void
  /** Centrar esa unidad en el mapa y desplegar su fila, que es lo mismo que hace tocarla en la tabla. */
  onUbicar: (ambulanciaId: number) => void
  ahora: number
}

/**
 * Lo primero que se mira al entrar: qué está sin resolver y cómo está repartida la flota. Los problemas y los
 * contadores van en la misma caja porque se leen juntos —"hay dos sin cubrir y tres unidades libres"— y porque
 * cuando no hay nada pendiente la caja se encoge a una línea y el mapa se queda con ese alto.
 */
export function FranjaDeProblemas({
  unidades,
  incidentesSinCubrir,
  trasladosSinCubrir,
  filtro,
  onFiltrar,
  onUbicar,
  ahora,
}: Props) {
  const [aAsignar, setAAsignar] = useState<Traslado | null>(null)

  const sinSenal = unidades.filter((unidad) => unidad.sinSenal)
  const sinCubrir = incidentesSinCubrir.length + trasladosSinCubrir.length
  const hayProblemas = sinCubrir > 0 || sinSenal.length > 0
  const cuantas = (estado: EstadoAmbulancia) => unidades.filter((unidad) => unidad.unidad.estado === estado).length

  return (
    <>
      <YStack rounded={12} bg="$superficie" borderWidth={1} borderColor="$borde" overflow="hidden">
        <XStack items="center" justify="space-between" gap={16} px={16} py={12} flexWrap="wrap">
          <Titular sinCubrir={sinCubrir} sinSenal={sinSenal.length} />

          <XStack items="center" gap={8} flexWrap="wrap">
            <Contador
              etiqueta="Disponibles"
              cantidad={cuantas('DISPONIBLE')}
              color="$disponible"
              activo={filtro === 'DISPONIBLE'}
              onPress={() => onFiltrar(filtro === 'DISPONIBLE' ? null : 'DISPONIBLE')}
            />
            <Contador
              etiqueta="En atención"
              cantidad={cuantas('EN_ATENCION')}
              color="$enAtencion"
              activo={filtro === 'EN_ATENCION'}
              onPress={() => onFiltrar(filtro === 'EN_ATENCION' ? null : 'EN_ATENCION')}
            />
            <Contador
              etiqueta="Sin turno"
              cantidad={cuantas('SIN_TURNO')}
              color="$bordeFuerte"
              activo={filtro === 'SIN_TURNO'}
              onPress={() => onFiltrar(filtro === 'SIN_TURNO' ? null : 'SIN_TURNO')}
            />
            <Contador
              etiqueta="Sin señal"
              cantidad={sinSenal.length}
              color="$primario"
              activo={filtro === 'SIN_SENAL'}
              onPress={() => onFiltrar(filtro === 'SIN_SENAL' ? null : 'SIN_SENAL')}
            />
          </XStack>
        </XStack>

        {hayProblemas ? (
          <YStack>
            {incidentesSinCubrir.map((incidente) => (
              <Problema
                key={`incidente-${incidente.id}`}
                texto={`Incidente #${incidente.id} · ${incidente.referencia ?? 'Sin referencia'} · hace ${tiempoTranscurrido(incidente.desde, ahora)}`}
              >
                <Link
                  to="/incidentes/$incidenteId"
                  params={{ incidenteId: incidente.id }}
                  style={{ textDecoration: 'none' }}
                >
                  <Button size="$3" variant="outlined">
                    <Button.Text fontSize={12} fontWeight="600" color="$texto">
                      Ver
                    </Button.Text>
                  </Button>
                </Link>
              </Problema>
            ))}

            {trasladosSinCubrir.map((fila) => (
              <Problema key={`traslado-${fila.traslado.id}`} texto={<TextoDelTraslado fila={fila} ahora={ahora} />}>
                <Link
                  to="/traslados/$trasladoId"
                  params={{ trasladoId: fila.traslado.id }}
                  style={{ textDecoration: 'none' }}
                >
                  <Button size="$3" variant="outlined">
                    <Button.Text fontSize={12} fontWeight="600" color="$texto">
                      Ver
                    </Button.Text>
                  </Button>
                </Link>
                <AccionDelProblema fila={fila} onAsignar={setAAsignar} />
              </Problema>
            ))}

            {sinSenal.map((unidad) => (
              <Problema
                key={`senal-${unidad.unidad.ambulanciaId}`}
                texto={`${unidad.unidad.placa} · Sin señal${unidad.segundosDesdeReporte === null ? '' : ` desde hace ${tiempoDeSegundos(unidad.segundosDesdeReporte)}`} · ${unidad.unidad.atencion ? 'atendiendo' : 'libre'}`}
              >
                <Button size="$3" variant="outlined" onPress={() => onUbicar(unidad.unidad.ambulanciaId)}>
                  <Button.Text fontSize={12} fontWeight="600" color="$texto">
                    Ver en el mapa
                  </Button.Text>
                </Button>
              </Problema>
            ))}
          </YStack>
        ) : null}
      </YStack>

      <DialogoAsignar traslado={aAsignar} onCerrar={() => setAAsignar(null)} />
    </>
  )
}

/**
 * Lo peor que está pasando, en una línea. Sin nada sin cubrir y con todas las unidades reportando, se queda en
 * el visto bueno y la caja entera ocupa solo esta franja.
 */
function Titular({ sinCubrir, sinSenal }: { sinCubrir: number; sinSenal: number }) {
  if (sinCubrir > 0) {
    return (
      <Text fontSize={15} fontWeight="600" color="$primarioPresionado">
        ⚠ {sinCubrir} sin cubrir
      </Text>
    )
  }
  if (sinSenal > 0) {
    return (
      <Text fontSize={15} fontWeight="600" color="$primarioPresionado">
        ⚠ {sinSenal} sin señal
      </Text>
    )
  }
  return (
    <Text fontSize={15} fontWeight="600" color="$disponibleTexto">
      ✓ Todo cubierto
    </Text>
  )
}

type PropsContador = {
  etiqueta: string
  cantidad: number
  color: YStackProps['backgroundColor']
  activo: boolean
  onPress: () => void
}

/** Cada contador es además el filtro de la tabla: se toca el número que llamó la atención y abajo quedan esas. */
function Contador({ etiqueta, cantidad, color, activo, onPress }: PropsContador) {
  return (
    <XStack
      role="button"
      aria-pressed={activo}
      items="center"
      gap={8}
      px={12}
      py={8}
      rounded={10}
      cursor="pointer"
      borderWidth={1}
      bg={activo ? '$fondo' : 'transparent'}
      borderColor={activo ? '$bordeFuerte' : '$borde'}
      hoverStyle={{ bg: '$fondo' }}
      onPress={onPress}
    >
      <YStack width={8} height={8} rounded={999} bg={color} />
      <Text fontSize={16} lineHeight={20} fontWeight="600" color="$texto">
        {cantidad}
      </Text>
      <Text fontSize={12} lineHeight={16} color="$textoSecundario">
        {etiqueta}
      </Text>
    </XStack>
  )
}

/**
 * Qué le pasa al traslado, con las mismas palabras que la bandeja de Traslados: cuánto le queda si todavía se busca
 * unidad, o lo que hay que hacer.
 */
function TextoDelTraslado({ fila, ahora }: { fila: TrasladoDelPanel; ahora: number }) {
  const { traslado } = fila
  return (
    <>
      Traslado #{traslado.id} · {traslado.pasajero} ·{' '}
      {fila.problema === 'SIN_UNIDAD' ? (
        <>
          Sin unidad · <TiempoRestante traslado={traslado} ahora={ahora} />
        </>
      ) : (
        avisoDelProblema(fila)
      )}
    </>
  )
}

function Problema({ texto, children }: { texto: ReactNode; children: ReactNode }) {
  return (
    <XStack items="center" justify="space-between" gap={16} px={16} py={10} borderTopWidth={1} borderColor="$borde">
      <Text fontSize={13} color="$texto" numberOfLines={1}>
        {texto}
      </Text>
      <XStack items="center" gap={8} shrink={0}>
        {children}
      </XStack>
    </XStack>
  )
}
