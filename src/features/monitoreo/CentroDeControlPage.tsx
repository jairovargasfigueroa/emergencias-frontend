import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Text, XStack, YStack } from 'tamagui'
import { EncabezadoPagina } from '../../shared/ui/EncabezadoPagina'
import { Cargando, ErrorAlCargar } from '../../shared/ui/EstadosDeCarga'
import { ActividadReciente } from './ActividadReciente'
import { FranjaDeProblemas } from './FranjaDeProblemas'
import { MapaDeFlota } from './MapaDeFlota'
import { cruzarConLaOperacion, useIncidentesAbiertos, usePosiciones, type FiltroDeUnidades } from './posiciones'
import { operacionKeys, operacionQuery } from './queries'
import { TablaDeUnidades } from './TablaDeUnidades'

/**
 * El mapa tiene alto fijo y no medido. Medirlo contra la ventana parece más prolijo, pero el alto disponible se
 * calculaba con `getBoundingClientRect().top`, que es relativo a la ventana y por lo tanto cambia al scrollear:
 * el mapa crecía, la página se hacía más alta, se podía scrollear más, y el mapa volvía a crecer. Con un número
 * fijo no hay nada que se retroalimente.
 */
const ALTO_MAPA = 340

/** Lo que ocupa todo lo que va arriba de los paneles: el marco de la página, el encabezado, la franja y el mapa. */
const MARCO_SOBRE_LOS_PANELES = 640

/** Piso para que la tabla siga siendo legible en pantallas bajas, y techo para que no se estire en monitores grandes. */
const ALTO_MINIMO_PANELES = 260
const ALTO_MAXIMO_PANELES = 520

/** Cada cuánto se recalcula el "hace tanto". Un segundo, que es la unidad más chica que se muestra. */
const TIC_RELOJ_MS = 1000

/** Dónde está y en qué está cada unidad, ahora mismo, y qué quedó sin resolver. */
export function CentroDeControlPage() {
  const queryClient = useQueryClient()
  const operacion = useQuery(operacionQuery())
  const posiciones = usePosiciones()
  const incidentes = useIncidentesAbiertos()
  const ahora = useAhora()
  const altoPaneles = useAltoDeLosPaneles()
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

      <MapaDeFlota
        unidades={unidades}
        incidentes={incidentes.lista}
        enfocada={seleccionada}
        alto={ALTO_MAPA}
      />

      {/* Juntas y a la misma altura: la tabla es ancha porque tiene seis columnas, la actividad angosta porque
          sus líneas son cortas. Verlas al mismo tiempo es lo que las hace útiles. */}
      <XStack gap={16} items="stretch">
        <YStack flex={1} minW={0}>
          <TablaDeUnidades
            unidades={unidades}
            filtro={filtro}
            seleccionada={seleccionada}
            onSeleccionar={setSeleccionada}
            ahora={ahora}
            alto={altoPaneles}
          />
        </YStack>
        <YStack width={340} shrink={0}>
          <ActividadReciente eventos={operacion.data.eventos} alto={altoPaneles} />
        </YStack>
      </XStack>
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
 * Alto de los dos paneles de abajo, calculado sobre `window.innerHeight` y **solo** sobre eso. Es la diferencia
 * que importa con la versión anterior: `innerHeight` no cambia al scrollear, así que el alto no puede crecer
 * porque la página creció. Medir la posición del elemento sí dependía del scroll, y por eso el mapa se agrandaba
 * solo cada vez que se desplegaba una fila.
 */
function useAltoDeLosPaneles() {
  const calcular = () =>
    Math.min(ALTO_MAXIMO_PANELES, Math.max(ALTO_MINIMO_PANELES, window.innerHeight - MARCO_SOBRE_LOS_PANELES))

  const [alto, setAlto] = useState(calcular)

  useEffect(() => {
    const recalcular = () => setAlto(calcular())
    window.addEventListener('resize', recalcular)
    return () => window.removeEventListener('resize', recalcular)
  }, [])

  return alto
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
