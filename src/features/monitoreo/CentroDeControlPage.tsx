import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useState } from 'react'
import { Text, XStack, YStack, type TamaguiElement, type YStackProps } from 'tamagui'
import { EncabezadoPagina } from '../../shared/ui/EncabezadoPagina'
import { Cargando, ErrorAlCargar } from '../../shared/ui/EstadosDeCarga'
import type { EstadoAmbulancia } from '../flota/api'
import { flotaKeys } from '../flota/queries'
import { escucharAvisoDeIncidentes } from './api'
import { ListaDeUnidades } from './ListaDeUnidades'
import { MapaDeFlota } from './MapaDeFlota'
import { cruzarConLaFlota, usePosiciones } from './posiciones'
import { flotaEnVivoQuery } from './queries'

/** Debajo de esto el mapa deja de ser un mapa y pasa a ser una franja: mejor que la página scrollee. */
const ALTO_MINIMO = 420

/** Aire que queda abajo de las dos columnas, el mismo que el espacio inferior del marco del panel. */
const MARGEN_INFERIOR = 32

/** Cada cuánto se recalcula el "hace tanto". Un segundo, que es la unidad más chica que se muestra. */
const TIC_RELOJ_MS = 1000

/** Dónde está y en qué está cada unidad, ahora mismo. Es una pantalla de mirar: no hay nada que decidir acá. */
export function CentroDeControlPage() {
  const queryClient = useQueryClient()
  const flota = useQuery(flotaEnVivoQuery())
  const posiciones = usePosiciones()
  const ahora = useAhora()
  const columnas = useAltoDeLasColumnas()

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
          No están llegando las posiciones en vivo. La lista sigue mostrando el estado de cada unidad.
        </Text>
      ) : null}

      <XStack ref={columnas.medir} gap={16} items="flex-start">
        <MapaDeFlota unidades={unidades} alto={columnas.alto} />
        <ListaDeUnidades unidades={unidades} alto={columnas.alto} />
      </XStack>
    </>
  )
}

function Encabezado() {
  return (
    <EncabezadoPagina
      titulo="Centro de control"
      descripcion="Dónde está cada unidad y en qué estado, en vivo. Se actualiza sola."
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

/**
 * El mapa de Google no dibuja nada si su contenedor mide cero, y eso es justo lo que pasa con un `flex` dentro
 * de un padre sin alto definido. Así que el alto va explícito, pero medido y no restado a mano: un número fijo
 * queda atado a que nadie toque el encabezado ni los contadores, y se desfasa en silencio el día que alguien
 * lo haga. Midiendo dónde arranca la fila, el resto de la ventana es suyo salga lo que salga arriba.
 */
function useAltoDeLasColumnas() {
  // La referencia va por estado y no por `useRef`: la fila recién existe cuando llegó la flota, y hay que
  // enterarse de ese momento para medir. Un `useRef` se llena sin avisar.
  const [fila, setFila] = useState<HTMLElement | null>(null)
  const [alto, setAlto] = useState(ALTO_MINIMO)

  // Tamagui tipa la referencia como `HTMLElement | View` porque el mismo componente sirve en React Native.
  // Acá siempre es un nodo del DOM, pero se comprueba en vez de forzar el tipo.
  const medir = useCallback((nodo: TamaguiElement | null) => {
    setFila(nodo instanceof HTMLElement ? nodo : null)
  }, [])

  useEffect(() => {
    if (!fila) {
      return
    }
    const recalcular = () => {
      const libre = window.innerHeight - fila.getBoundingClientRect().top - MARGEN_INFERIOR
      setAlto(Math.max(ALTO_MINIMO, Math.round(libre)))
    }
    recalcular()
    window.addEventListener('resize', recalcular)
    // El aviso de Firebase aparece y desaparece arriba de la fila: sin esto el alto quedaría con la medida vieja.
    const observador = new ResizeObserver(recalcular)
    if (fila.parentElement) {
      observador.observe(fila.parentElement)
    }
    return () => {
      window.removeEventListener('resize', recalcular)
      observador.disconnect()
    }
  }, [fila])

  return { medir, alto }
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
