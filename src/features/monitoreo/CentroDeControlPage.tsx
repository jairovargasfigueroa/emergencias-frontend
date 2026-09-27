import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useState } from 'react'
import { Text, YStack, type TamaguiElement } from 'tamagui'
import { EncabezadoPagina } from '../../shared/ui/EncabezadoPagina'
import { Cargando, ErrorAlCargar } from '../../shared/ui/EstadosDeCarga'
import { ActividadReciente } from './ActividadReciente'
import { FranjaDeProblemas } from './FranjaDeProblemas'
import { MapaDeFlota } from './MapaDeFlota'
import { cruzarConLaOperacion, useIncidentesAbiertos, usePosiciones, type FiltroDeUnidades } from './posiciones'
import { operacionKeys, operacionQuery } from './queries'
import { TablaDeUnidades } from './TablaDeUnidades'

/** Debajo de esto el mapa deja de ser un mapa y pasa a ser una franja: mejor que la página scrollee. */
const ALTO_MINIMO_MAPA = 380

/**
 * Lo que se le deja al resto de la página debajo del mapa. Es a propósito que sea poco y no cero: el mapa se
 * queda con casi toda la ventana, pero asomando el arranque de la tabla se ve que la página sigue más abajo.
 */
const ASOMO_DE_LA_TABLA = 120

/** Cada cuánto se recalcula el "hace tanto". Un segundo, que es la unidad más chica que se muestra. */
const TIC_RELOJ_MS = 1000

/** Dónde está y en qué está cada unidad, ahora mismo, y qué quedó sin resolver. */
export function CentroDeControlPage() {
  const queryClient = useQueryClient()
  const operacion = useQuery(operacionQuery())
  const posiciones = usePosiciones()
  const incidentes = useIncidentesAbiertos()
  const ahora = useAhora()
  const mapa = useAltoDelMapa()
  const [filtro, setFiltro] = useState<FiltroDeUnidades | null>(null)
  const [seleccionada, setSeleccionada] = useState<number | null>(null)

  // El estado de las unidades no viaja por Firebase, pero el nodo de incidentes abiertos sí, y que se mueva es
  // señal casi segura de que alguna acaba de cambiar. Se adelanta al refresco periódico en vez de esperarlo.
  useEffect(() => {
    if (incidentes.revision > 0) {
      void queryClient.invalidateQueries({ queryKey: operacionKeys.todo })
    }
  }, [incidentes.revision, queryClient])

  if (operacion.isPending) {
    return (
      <>
        <Encabezado />
        <Cargando texto="Cargando la operación…" />
      </>
    )
  }

  if (operacion.isError) {
    return (
      <>
        <Encabezado />
        <ErrorAlCargar error={operacion.error} onReintentar={() => operacion.refetch()} />
      </>
    )
  }

  const unidades = cruzarConLaOperacion(
    operacion.data.unidades,
    posiciones.porAmbulancia,
    operacion.data.umbralSinSenalSeg,
    ahora,
  )

  return (
    <>
      <Encabezado />

      <FranjaDeProblemas
        unidades={unidades}
        incidentesSinCubrir={operacion.data.incidentesSinCubrir}
        trasladosSinCubrir={operacion.data.trasladosSinCubrir}
        filtro={filtro}
        onFiltrar={setFiltro}
        onUbicar={setSeleccionada}
        ahora={ahora}
      />

      {posiciones.error || incidentes.error ? (
        <Text fontSize={13} color="$primarioPresionado">
          No está llegando lo que viaja en vivo: las posiciones y los incidentes abiertos. La tabla sigue
          mostrando el estado de cada unidad, que llega por el servidor.
        </Text>
      ) : null}

      {/* El alto del mapa se mide sobre este contenedor: ver `useAltoDelMapa`. */}
      <YStack ref={mapa.medir}>
        <MapaDeFlota
          unidades={unidades}
          incidentes={incidentes.lista}
          enfocada={seleccionada}
          alto={mapa.alto}
        />
      </YStack>

      <TablaDeUnidades
        unidades={unidades}
        filtro={filtro}
        seleccionada={seleccionada}
        onSeleccionar={setSeleccionada}
        ahora={ahora}
      />

      <ActividadReciente eventos={operacion.data.eventos} />
    </>
  )
}

function Encabezado() {
  return (
    <EncabezadoPagina
      titulo="Centro de control"
      descripcion="Qué está sin cubrir, dónde está cada unidad y qué acaba de pasar. Se actualiza sola."
    />
  )
}

/**
 * El mapa de Google no dibuja nada si su contenedor mide cero, y eso es justo lo que pasa con un `flex` dentro
 * de un padre sin alto definido. Así que el alto va explícito, pero medido y no restado a mano: un número fijo
 * queda atado a que nadie toque el encabezado ni la franja, y se desfasa en silencio el día que alguien lo haga.
 * Midiendo dónde arranca el mapa, el resto de la ventana es suyo salga lo que salga arriba.
 */
function useAltoDelMapa() {
  // La referencia va por estado y no por `useRef`: el contenedor recién existe cuando llegó la operación, y hay
  // que enterarse de ese momento para medir. Un `useRef` se llena sin avisar.
  const [contenedor, setContenedor] = useState<HTMLElement | null>(null)
  const [alto, setAlto] = useState(ALTO_MINIMO_MAPA)

  // Tamagui tipa la referencia como `HTMLElement | View` porque el mismo componente sirve en React Native.
  // Acá siempre es un nodo del DOM, pero se comprueba en vez de forzar el tipo.
  const medir = useCallback((nodo: TamaguiElement | null) => {
    setContenedor(nodo instanceof HTMLElement ? nodo : null)
  }, [])

  useEffect(() => {
    if (!contenedor) {
      return
    }
    const recalcular = () => {
      const libre = window.innerHeight - contenedor.getBoundingClientRect().top - ASOMO_DE_LA_TABLA
      setAlto(Math.max(ALTO_MINIMO_MAPA, Math.round(libre)))
    }
    recalcular()
    window.addEventListener('resize', recalcular)
    // La franja de arriba crece y se encoge según lo que haya sin cubrir: sin esto el mapa quedaría con la
    // medida vieja justo cuando cambia lo único que la mueve.
    const observador = new ResizeObserver(recalcular)
    if (contenedor.parentElement) {
      observador.observe(contenedor.parentElement)
    }
    return () => {
      window.removeEventListener('resize', recalcular)
      observador.disconnect()
    }
  }, [contenedor])

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
