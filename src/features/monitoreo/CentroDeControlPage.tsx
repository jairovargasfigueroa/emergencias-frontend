import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Text, XStack, YStack, type YStackProps } from 'tamagui'
import { EncabezadoPagina } from '../../shared/ui/EncabezadoPagina'
import { Cargando, ErrorAlCargar } from '../../shared/ui/EstadosDeCarga'
import type { EstadoAmbulancia } from '../flota/api'
import { flotaKeys } from '../flota/queries'
import { escucharAvisoDeIncidentes } from './api'
import { ListaDeUnidades } from './ListaDeUnidades'
import { MapaDeFlota } from './MapaDeFlota'
import { cruzarConLaFlota, usePosiciones } from './posiciones'
import { flotaEnVivoQuery } from './queries'

/**
 * Alto de las dos columnas. Es explícito porque el mapa de Google no dibuja nada si su contenedor mide cero, y
 * eso es justo lo que pasa con un `flex` dentro de un padre sin alto. Lo que se resta es el marco de la
 * página: los 32 de arriba y de abajo, los 56 del encabezado, los 68 de los contadores y los dos espacios de
 * 24 entre medio. El mínimo es para que en una pantalla baja el mapa siga siendo un mapa y no una franja.
 */
const ALTO_PANEL = 'max(420px, calc(100vh - 240px))'

/** Cada cuánto se recalcula el "hace tanto". Un segundo, que es la unidad más chica que se muestra. */
const TIC_RELOJ_MS = 1000

/** Dónde está y en qué está cada unidad, ahora mismo. Es una pantalla de mirar: no hay nada que decidir acá. */
export function CentroDeControlPage() {
  const queryClient = useQueryClient()
  const flota = useQuery(flotaEnVivoQuery())
  const posiciones = usePosiciones()
  const ahora = useAhora()

  // El estado de las unidades no viaja por Firebase, pero el nodo de incidentes abiertos sí, y que se mueva es
  // señal casi segura de que alguna acaba de cambiar. Se adelanta al refresco periódico en vez de esperarlo.
  useEffect(
    () => escucharAvisoDeIncidentes(() => void queryClient.invalidateQueries({ queryKey: flotaKeys.lista() })),
    [queryClient],
  )

  if (flota.isPending) {
    return (
      <>
        <Encabezado />
        <Cargando texto="Cargando la flota…" />
      </>
    )
  }

  if (flota.isError) {
    return (
      <>
        <Encabezado />
        <ErrorAlCargar error={flota.error} onReintentar={() => flota.refetch()} />
      </>
    )
  }

  const unidades = cruzarConLaFlota(flota.data, posiciones.porAmbulancia, ahora)
  const cuantas = (estado: EstadoAmbulancia) => unidades.filter((unidad) => unidad.ambulancia.estado === estado).length

  return (
    <>
      <Encabezado />

      <XStack gap={12} flexWrap="wrap">
        <Contador etiqueta="Disponibles" cantidad={cuantas('DISPONIBLE')} color="$disponible" />
        <Contador etiqueta="En atención" cantidad={cuantas('EN_ATENCION')} color="$enAtencion" />
        <Contador etiqueta="Sin turno" cantidad={cuantas('SIN_TURNO')} color="$bordeFuerte" />
      </XStack>

      {posiciones.error ? (
        <Text fontSize={13} color="$primarioPresionado">
          No están llegando las posiciones en vivo. La lista sigue mostrando en qué está cada unidad.
        </Text>
      ) : null}

      <XStack gap={16} items="flex-start">
        <MapaDeFlota unidades={unidades} alto={ALTO_PANEL} />
        <ListaDeUnidades unidades={unidades} alto={ALTO_PANEL} />
      </XStack>
    </>
  )
}

function Encabezado() {
  return (
    <EncabezadoPagina
      titulo="Centro de control"
      descripcion="Las unidades en turno sobre el mapa y en qué está cada una. Se actualiza sola."
    />
  )
}

type PropsContador = {
  etiqueta: string
  cantidad: number
  color: YStackProps['backgroundColor']
}

function Contador({ etiqueta, cantidad, color }: PropsContador) {
  return (
    <XStack
      items="center"
      gap={12}
      minW={160}
      px={16}
      py={12}
      rounded={12}
      bg="$superficie"
      borderWidth={1}
      borderColor="$borde"
    >
      <YStack width={8} height={8} rounded={999} bg={color} />
      <YStack gap={2}>
        <Text fontSize={20} lineHeight={24} fontWeight="600" color="$texto">
          {cantidad}
        </Text>
        <Text fontSize={12} lineHeight={16} color="$textoSecundario">
          {etiqueta}
        </Text>
      </YStack>
    </XStack>
  )
}

/** El "hace tanto" tiene que envejecer solo: sin esto se quedaría clavado hasta la próxima posición. */
function useAhora() {
  const [ahora, setAhora] = useState(() => Date.now())

  useEffect(() => {
    const tic = window.setInterval(() => setAhora(Date.now()), TIC_RELOJ_MS)
    return () => window.clearInterval(tic)
  }, [])

  return ahora
}
