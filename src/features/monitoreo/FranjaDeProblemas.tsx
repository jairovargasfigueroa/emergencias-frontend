import { Link } from '@tanstack/react-router'
import { useState, type ReactNode } from 'react'
import { Button, Text, XStack, YStack, type YStackProps } from 'tamagui'
import { tiempoDeSegundos, tiempoTranscurrido } from '../../shared/formato/fechas'
import { IconoAviso, IconoCheck } from '../../shared/ui/iconos'
import { DialogoEnviarUnidad, type IncidenteParaEnviar } from '../incidentes/DialogoEnviarUnidad'
import { useResumenesPublicados } from '../resumen-ia/avisos'
import { minutosParaLaUltimaSalida, type Traslado, type TrasladoDelPanel } from '../traslados/api'
import { AccionDelProblema, MINUTOS_PARA_APURARSE } from '../traslados/AvisosDeTraslado'
import { DialogoAsignar } from '../traslados/DialogoAsignar'
import { DialogoDevolver } from '../traslados/DialogoDevolver'
import { avisoDelProblema, textoTiempoRestante } from '../traslados/textos'
import type { IncidenteSinCubrir } from './api'
import { BotonLlamar } from './BotonLlamar'
import { cumpleFiltro, type FiltroDeUnidades, type UnidadMonitoreada } from './posiciones'

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

type Contador = {
  filtro: FiltroDeUnidades
  singular: string
  plural: string
  color: YStackProps['backgroundColor']
}

/**
 * Cómo está repartida la flota. "Disponible" cuenta solo las que se pueden enviar: una disponible que perdió la
 * señal va en "Sin señal", porque no se sabe dónde está.
 */
const CONTADORES: Contador[] = [
  { filtro: 'DISPONIBLE', singular: 'Disponible', plural: 'Disponibles', color: '$disponible' },
  { filtro: 'EN_ATENCION', singular: 'En atención', plural: 'En atención', color: '$enAtencion' },
  { filtro: 'FUERA_DE_SERVICIO', singular: 'Fuera de servicio', plural: 'Fuera de servicio', color: '$fueraServicio' },
  { filtro: 'SIN_TURNO', singular: 'Sin turno', plural: 'Sin turno', color: '$bordeFuerte' },
  { filtro: 'SIN_SENAL', singular: 'Sin señal', plural: 'Sin señal', color: '$primario' },
]

/** Cuántas filas de problemas se ven sin scrollear. Más que esto empujaría la tabla y el mapa fuera de la pantalla. */
const ALTO_MAXIMO_PROBLEMAS = 4 * 57

/**
 * Lo primero que se mira: qué está sin resolver y cómo está repartida la flota. Con algo por resolver la franja
 * entera cambia de aspecto, para que se note de reojo y no haya que leerla. Cada problema empieza por qué es y
 * cuánto lleva, que es lo que decide por cuál empezar.
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
  const [aDevolver, setADevolver] = useState<TrasladoDelPanel | null>(null)
  const [aEnviar, setAEnviar] = useState<IncidenteParaEnviar | null>(null)
  const resumenes = useResumenesPublicados()

  const sinCubrir = incidentesSinCubrir.length + trasladosSinCubrir.length
  const enAlarma = sinCubrir > 0
  const cuantas = (filtroDelContador: FiltroDeUnidades) =>
    unidades.filter((unidad) => cumpleFiltro(unidad, filtroDelContador)).length

  // Del que más espera al que menos. Los traslados ya llegan en el orden de su bandeja, que es el de urgencia.
  const incidentes = [...incidentesSinCubrir].sort(
    (uno, otro) => new Date(uno.desde).getTime() - new Date(otro.desde).getTime(),
  )
  const sinSenal = unidades
    .filter((unidad) => unidad.sinSenal)
    .sort((una, otra) => segundosSinReportar(otra) - segundosSinReportar(una))
  const hayFilas = sinCubrir > 0 || sinSenal.length > 0

  return (
    <>
      <YStack
        shrink={0}
        rounded={12}
        borderWidth={1}
        borderColor={enAlarma ? '$primario' : '$borde'}
        bg="$superficie"
        overflow="hidden"
      >
        <XStack
          items="center"
          justify="space-between"
          gap={16}
          px={16}
          py={12}
          flexWrap="wrap"
          bg={enAlarma ? '$primarioTinte' : '$superficie'}
        >
          <Titular sinCubrir={sinCubrir} sinSenal={sinSenal.length} disponibles={cuantas('DISPONIBLE')} />

          {/* Puede achicarse para que los contadores bajen de línea en vez de salirse por el borde. */}
          <XStack items="center" gap={8} flexWrap="wrap" shrink={1} minW={0}>
            {CONTADORES.map((contador) => {
              const cantidad = cuantas(contador.filtro)
              return (
                <BotonContador
                  key={contador.filtro}
                  etiqueta={cantidad === 1 ? contador.singular : contador.plural}
                  cantidad={cantidad}
                  color={contador.color}
                  activo={filtro === contador.filtro}
                  onPress={() => onFiltrar(filtro === contador.filtro ? null : contador.filtro)}
                />
              )
            })}
          </XStack>
        </XStack>

        {hayFilas ? (
          <YStack maxH={ALTO_MAXIMO_PROBLEMAS} overflowY="auto">
            {incidentes.map((incidente) => (
              <Problema
                key={`incidente-${incidente.id}`}
                tipo="Incidente"
                tiempo={`Hace ${tiempoTranscurrido(incidente.desde, ahora)}`}
                descripcion={`#${incidente.id} · ${incidente.referencia ?? 'Sin referencia'}${resumenes.versiones.has(incidente.id) ? ' · resumen IA' : ''}`}
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
                {/* Sin cubrir quiere decir que todavía no va nadie: la que se envíe es la primera. */}
                <Button
                  size="$3"
                  variant="outlined"
                  onPress={() => setAEnviar({ id: incidente.id, unidadesAcudiendo: 0 })}
                >
                  <Button.Text fontSize={12} fontWeight="600" color="$texto">
                    Enviar unidad
                  </Button.Text>
                </Button>
              </Problema>
            ))}

            {trasladosSinCubrir.map((fila) => (
              <ProblemaDeTraslado
                key={`traslado-${fila.traslado.id}`}
                fila={fila}
                ahora={ahora}
                onAsignar={setAAsignar}
                onDevolver={setADevolver}
              />
            ))}

            {sinSenal.map((unidad) => (
              <Problema
                key={`senal-${unidad.unidad.ambulanciaId}`}
                tipo="Sin señal"
                tiempo={
                  unidad.segundosDesdeReporte === null ? '—' : `Hace ${tiempoDeSegundos(unidad.segundosDesdeReporte)}`
                }
                descripcion={`${unidad.unidad.placa} · ${unidad.unidad.estado === 'EN_ATENCION' ? 'En atención' : 'Disponible'}`}
              >
                {unidad.unidad.tripulacion[0] ? (
                  <BotonLlamar tripulante={unidad.unidad.tripulacion[0]} conNumero />
                ) : null}
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
      <DialogoDevolver fila={aDevolver} onCerrar={() => setADevolver(null)} />
      <DialogoEnviarUnidad incidente={aEnviar} onCerrar={() => setAEnviar(null)} />
    </>
  )
}

/** Una unidad que nunca dijo cuándo reportó va primero: de esa no se sabe nada. */
function segundosSinReportar(unidad: UnidadMonitoreada): number {
  return unidad.segundosDesdeReporte ?? Number.MAX_SAFE_INTEGER
}

type PropsTitular = { sinCubrir: number; sinSenal: number; disponibles: number }

/**
 * Lo peor que está pasando, en una línea. Se anuncia a los lectores de pantalla cuando cambia: un incidente nuevo
 * sin cubrir no puede depender de que alguien esté mirando.
 *
 * "Por resolver" y no "sin cubrir": además de lo que no tiene unidad, cuenta los traslados cuya unidad no llega y
 * los no cubiertos que esperan que alguien le avise a la familia.
 */
function Titular({ sinCubrir, sinSenal, disponibles }: PropsTitular) {
  let contenido: ReactNode
  if (sinCubrir > 0) {
    contenido = (
      <>
        <IconoAviso size={20} color="var(--primarioTinteTexto)" />
        <Text fontSize={18} lineHeight={24} fontWeight="600" color="$primarioTinteTexto">
          {sinCubrir} por resolver
        </Text>
      </>
    )
  } else if (sinSenal > 0) {
    contenido = (
      <>
        <IconoAviso size={20} color="var(--primarioTinteTexto)" />
        <Text fontSize={18} lineHeight={24} fontWeight="600" color="$primarioTinteTexto">
          {sinSenal === 1 ? '1 unidad sin señal' : `${sinSenal} unidades sin señal`}
        </Text>
      </>
    )
  } else {
    // Que no haya nada pendiente no es lo mismo que estar cubiertos: sin unidades para enviar, se dice.
    contenido = (
      <>
        <IconoCheck size={20} color="var(--disponibleTexto)" />
        <Text fontSize={18} lineHeight={24} fontWeight="600" color="$disponibleTexto">
          {disponibles > 0 ? 'Todo cubierto' : 'Nada por resolver'}
        </Text>
        {disponibles > 0 ? null : (
          <Text fontSize={14} lineHeight={20} color="$textoSecundario">
            · ninguna unidad disponible
          </Text>
        )}
      </>
    )
  }

  return (
    <XStack role="status" aria-live="polite" items="center" gap={8}>
      {contenido}
    </XStack>
  )
}

type PropsContador = {
  etiqueta: string
  cantidad: number
  color: YStackProps['backgroundColor']
  activo: boolean
  onPress: () => void
}

/**
 * Cada contador es además el filtro de la tabla: se toca el número que llamó la atención y abajo quedan esas. Es un
 * `<button>` de verdad para que se alcance con el teclado. El activo va invertido: tiene que notarse de lejos que
 * la tabla está filtrada.
 */
function BotonContador({ etiqueta, cantidad, color, activo, onPress }: PropsContador) {
  return (
    <XStack
      render="button"
      aria-pressed={activo}
      items="center"
      gap={8}
      height={36}
      px={12}
      rounded={8}
      cursor="pointer"
      borderWidth={1}
      bg={activo ? '$texto' : '$superficie'}
      borderColor={activo ? '$texto' : '$borde'}
      hoverStyle={{ borderColor: activo ? '$texto' : '$bordeFuerte' }}
      focusVisibleStyle={{ outlineWidth: 2, outlineStyle: 'solid', outlineColor: '$texto', outlineOffset: 2 }}
      onPress={onPress}
    >
      <YStack width={8} height={8} rounded={999} bg={color} />
      <Text fontSize={15} lineHeight={20} fontWeight="600" color={activo ? '$superficie' : '$texto'}>
        {cantidad}
      </Text>
      <Text fontSize={12} lineHeight={16} color={activo ? '$superficie' : '$textoSecundario'}>
        {etiqueta}
      </Text>
    </XStack>
  )
}

type PropsTraslado = {
  fila: TrasladoDelPanel
  ahora: number
  onAsignar: (traslado: Traslado) => void
  onDevolver: (fila: TrasladoDelPanel) => void
}

/**
 * Un traslado no espera: tiene una hora límite. Por eso su tiempo es lo que queda para la última salida posible, y
 * se pinta en rojo con el mismo margen que usa la bandeja de Traslados.
 */
function ProblemaDeTraslado({ fila, ahora, onAsignar, onDevolver }: PropsTraslado) {
  const { traslado } = fila
  const buscaUnidad = fila.problema === 'SIN_UNIDAD'
  const minutos = minutosParaLaUltimaSalida(traslado, ahora)

  return (
    <Problema
      tipo="Traslado"
      tiempo={buscaUnidad ? textoTiempoRestante(minutos) : '—'}
      tiempoUrgente={buscaUnidad && minutos <= MINUTOS_PARA_APURARSE}
      descripcion={`#${traslado.id} · ${traslado.pasajero} · ${buscaUnidad ? 'Sin unidad' : avisoDelProblema(fila)}`}
    >
      <Link to="/traslados/$trasladoId" params={{ trasladoId: traslado.id }} style={{ textDecoration: 'none' }}>
        <Button size="$3" variant="outlined">
          <Button.Text fontSize={12} fontWeight="600" color="$texto">
            Ver
          </Button.Text>
        </Button>
      </Link>
      <AccionDelProblema fila={fila} onAsignar={onAsignar} onDevolver={onDevolver} />
    </Problema>
  )
}

type PropsProblema = {
  tipo: string
  tiempo: string
  tiempoUrgente?: boolean
  descripcion: string
  children: ReactNode
}

/**
 * Qué es, cuánto lleva y de qué se trata, siempre en ese orden y en columnas fijas: así se recorre la lista con la
 * vista sin leerla. La descripción es lo único que se corta si no entra.
 */
function Problema({ tipo, tiempo, tiempoUrgente = false, descripcion, children }: PropsProblema) {
  // Por debajo de 1024 px, si las acciones no entran, bajan a una segunda línea en vez de cortarse en el borde.
  return (
    <XStack
      items="center"
      gap={12}
      rowGap={8}
      px={16}
      py={10}
      borderTopWidth={1}
      borderColor="$borde"
      $max-lg={{ flexWrap: 'wrap' }}
    >
      <Text width={76} shrink={0} fontSize={12} lineHeight={16} fontWeight="500" color="$textoSecundario">
        {tipo}
      </Text>
      <Text
        width={152}
        shrink={0}
        fontSize={13}
        lineHeight={18}
        fontFamily="$mono"
        color={tiempoUrgente ? '$primarioTinteTexto' : '$texto'}
        numberOfLines={1}
      >
        {tiempo}
      </Text>
      <Text flex={1} minW={0} fontSize={13} lineHeight={18} color="$texto" numberOfLines={1}>
        {descripcion}
      </Text>
      <XStack items="center" gap={8} shrink={0} $max-lg={{ ml: 'auto' }}>
        {children}
      </XStack>
    </XStack>
  )
}
