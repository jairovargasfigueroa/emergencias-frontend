import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState, type ReactNode } from 'react'
import { Button, H1, Text, XStack, YStack } from 'tamagui'
import { tiempoDeSegundos } from '../../shared/formato/fechas'
import { useAhora } from '../../shared/reloj/useAhora'
import { Cargando, ErrorAlCargar } from '../../shared/ui/EstadosDeCarga'
import { IconoAviso } from '../../shared/ui/iconos'
import { ActividadReciente } from './ActividadReciente'
import { FranjaDeProblemas } from './FranjaDeProblemas'
import { MapaDeFlota } from './MapaDeFlota'
import {
  cruzarConLaOperacion,
  cumpleFiltro,
  useIncidentesAbiertos,
  usePosiciones,
  type FiltroDeUnidades,
} from './posiciones'
import { operacionKeys, operacionQuery } from './queries'
import { TablaDeUnidades } from './TablaDeUnidades'

/** El margen que el layout del panel deja arriba y abajo de cada pantalla (`py={32}` en `rutas/protegida.tsx`). */
const MARCO_VERTICAL = 64

/**
 * Por debajo de este alto la consola ya no entra y la página vuelve a scrollear: es preferible a aplastar la tabla
 * y el mapa hasta que no se lean.
 */
const ALTO_MINIMO = 600

/** Cada cuánto se recalcula el "hace tanto". Un segundo, que es la unidad más chica que se muestra. */
const TIC_RELOJ_MS = 1000

/** Para decir sobre la tabla qué está mostrando cuando hay un filtro puesto. */
const UNIDADES_SEGUN_FILTRO: Record<FiltroDeUnidades, string> = {
  DISPONIBLE: 'Solo las unidades disponibles',
  EN_ATENCION: 'Solo las unidades en atención',
  FUERA_DE_SERVICIO: 'Solo las unidades fuera de servicio',
  SIN_TURNO: 'Solo las unidades sin turno',
  SIN_SENAL: 'Solo las unidades sin señal',
}

/**
 * Dónde está y en qué está cada unidad, ahora mismo, y qué quedó sin resolver. Es una consola: ocupa justo el alto
 * de la ventana y no scrollea. Arriba lo que está sin resolver, a la izquierda la flota y a la derecha el mapa con
 * la bitácora. La tabla y el mapa van lado a lado porque son dos vistas de las mismas unidades: elegir una en
 * cualquiera de los dos la muestra en el otro.
 */
export function CentroDeControlPage() {
  const queryClient = useQueryClient()
  const operacion = useQuery(operacionQuery())
  const posiciones = usePosiciones()
  const incidentes = useIncidentesAbiertos()
  const ahora = useAhora(TIC_RELOJ_MS)
  const [filtro, setFiltro] = useState<FiltroDeUnidades | null>(null)
  const [seleccionada, setSeleccionada] = useState<number | null>(null)
  const [bitacoraAbierta, setBitacoraAbierta] = useState(true)

  // El estado de las unidades no viaja por Firebase, pero el nodo de incidentes abiertos sí, y que se mueva es
  // señal casi segura de que alguna acaba de cambiar. Se adelanta al refresco periódico en vez de esperarlo.
  useEffect(() => {
    if (incidentes.revision > 0) {
      void queryClient.invalidateQueries({ queryKey: operacionKeys.todo })
    }
  }, [incidentes.revision, queryClient])

  if (operacion.isPending) {
    return (
      <YStack gap={16}>
        <Encabezado />
        <Cargando texto="Cargando la operación…" />
      </YStack>
    )
  }

  // Solo si nunca llegó nada. Si falla un refresco, se sigue mostrando lo último y el encabezado lo avisa: borrar
  // la pantalla entera por un corte de red dejaría al operador a ciegas justo cuando más necesita ver.
  if (operacion.isLoadingError) {
    return (
      <YStack gap={16}>
        <Encabezado />
        <ErrorAlCargar error={operacion.error} onReintentar={() => operacion.refetch()} />
      </YStack>
    )
  }

  const unidades = cruzarConLaOperacion(
    operacion.data.unidades,
    posiciones.porAmbulancia,
    operacion.data.umbralSinSenalSeg,
    ahora,
  )
  // Lo mismo que dice el titular de la franja, para el aviso que lo reemplaza con el mapa en pantalla completa.
  const porResolver = operacion.data.incidentesSinCubrir.length + operacion.data.trasladosSinCubrir.length
  const sinSenal = unidades.filter((unidad) => unidad.sinSenal).length
  const bitacoraCrece = bitacoraAbierta && operacion.data.eventos.length > 0

  const filtrar = (nuevo: FiltroDeUnidades | null) => {
    setFiltro(nuevo)
    // La elegida que el filtro deja afuera no puede seguir centrada en el mapa sin verse en la tabla.
    const elegida = unidades.find((unidad) => unidad.unidad.ambulanciaId === seleccionada)
    if (elegida && !cumpleFiltro(elegida, nuevo)) {
      setSeleccionada(null)
    }
  }

  // Elegirla desde el mapa o desde la franja tiene que mostrarla también en la tabla: si el filtro la esconde, se quita.
  const elegir = (ambulanciaId: number) => {
    const elegida = unidades.find((unidad) => unidad.unidad.ambulanciaId === ambulanciaId)
    if (elegida && !cumpleFiltro(elegida, filtro)) {
      setFiltro(null)
    }
    setSeleccionada(ambulanciaId)
  }

  return (
    <YStack height={`calc(100vh - ${MARCO_VERTICAL}px)`} minH={ALTO_MINIMO} gap={16}>
      <Encabezado>
        <EstadoDeActualizacion
          actualizadoEn={operacion.dataUpdatedAt}
          fallo={operacion.isRefetchError}
          ahora={ahora}
        />
      </Encabezado>

      <FranjaDeProblemas
        unidades={unidades}
        incidentesSinCubrir={operacion.data.incidentesSinCubrir}
        trasladosSinCubrir={operacion.data.trasladosSinCubrir}
        filtro={filtro}
        onFiltrar={filtrar}
        onUbicar={elegir}
        ahora={ahora}
      />

      {posiciones.error || incidentes.error ? (
        <Aviso>
          No está llegando lo que viaja en vivo: las posiciones y los incidentes abiertos. La tabla sigue mostrando el
          estado de cada unidad, que llega por el servidor.
        </Aviso>
      ) : null}

      <XStack flex={1} minH={0} gap={16}>
        <YStack flex={1} minW={0} gap={8}>
          {filtro ? (
            <XStack items="center" justify="space-between" gap={12} shrink={0}>
              <Text fontSize={13} lineHeight={18} color="$textoSecundario">
                {UNIDADES_SEGUN_FILTRO[filtro]}
              </Text>
              <Button size="$2" variant="outlined" onPress={() => filtrar(null)}>
                <Button.Text fontSize={12} fontWeight="600" color="$texto">
                  Quitar el filtro
                </Button.Text>
              </Button>
            </XStack>
          ) : null}
          <TablaDeUnidades
            unidades={unidades}
            filtro={filtro}
            seleccionada={seleccionada}
            onSeleccionar={setSeleccionada}
            ahora={ahora}
          />
        </YStack>

        <YStack width="38%" minW={320} shrink={0} gap={16}>
          <YStack flex={3} minH={220}>
            <MapaDeFlota
              unidades={unidades}
              incidentes={incidentes.lista}
              enfocada={seleccionada}
              onElegirUnidad={elegir}
              avisoEnPantallaCompleta={
                porResolver > 0 ? (
                  <AvisoFlotante>{porResolver} por resolver</AvisoFlotante>
                ) : sinSenal > 0 ? (
                  <AvisoFlotante>{sinSenal === 1 ? '1 unidad sin señal' : `${sinSenal} unidades sin señal`}</AvisoFlotante>
                ) : null
              }
            />
          </YStack>
          {/* Sin eventos la bitácora es una línea: no tiene sentido que le quite alto al mapa. */}
          <YStack flex={bitacoraCrece ? 2 : undefined} minH={bitacoraCrece ? 160 : undefined} shrink={0}>
            <ActividadReciente
              eventos={operacion.data.eventos}
              abierta={bitacoraAbierta}
              onAlternar={() => setBitacoraAbierta((abierta) => !abierta)}
            />
          </YStack>
        </YStack>
      </XStack>
    </YStack>
  )
}

/**
 * Corto y sin descripción: es una pantalla que se tiene abierta todo el turno, y lo que más tiene que pesar es la
 * franja de abajo, no el título. Al costado va cuándo se actualizó por última vez.
 */
function Encabezado({ children }: { children?: ReactNode }) {
  return (
    <XStack render="header" items="center" justify="space-between" gap={16} flexWrap="wrap" shrink={0}>
      <H1 color="$texto" fontSize={20} lineHeight={28} fontWeight="600">
        Centro de control
      </H1>
      {children}
    </XStack>
  )
}

type PropsActualizacion = {
  /** `dataUpdatedAt` de la consulta: cuándo llegó lo que se está mostrando. */
  actualizadoEn: number
  /** Falló el último refresco y lo que se ve es lo anterior. */
  fallo: boolean
  ahora: number
}

/** "Se actualiza sola" no alcanza: un visto bueno con datos viejos es peor que nada. Se dice cuándo y si falló. */
function EstadoDeActualizacion({ actualizadoEn, fallo, ahora }: PropsActualizacion) {
  const segundos = Math.max(0, Math.floor((ahora - actualizadoEn) / 1000))
  const hace = segundos < 2 ? 'recién' : `hace ${tiempoDeSegundos(segundos)}`

  if (fallo) {
    return <Aviso>No se pudo actualizar. Lo que ves es de {hace}.</Aviso>
  }
  return (
    <Text fontSize={13} lineHeight={18} color="$textoSecundario">
      Actualizado {hace}
    </Text>
  )
}

function Aviso({ children }: { children: ReactNode }) {
  return (
    <XStack items="center" gap={6} shrink={0}>
      <IconoAviso size={14} color="var(--primarioTinteTexto)" />
      <Text fontSize={13} lineHeight={18} color="$primarioTinteTexto">
        {children}
      </Text>
    </XStack>
  )
}

/** Lo que se ve sobre el mapa en pantalla completa, donde la franja queda tapada. */
function AvisoFlotante({ children }: { children: ReactNode }) {
  return (
    <XStack
      items="center"
      gap={8}
      height={36}
      px={12}
      rounded={8}
      bg="$primarioTinte"
      borderWidth={1}
      borderColor="$primario"
    >
      <IconoAviso size={16} color="var(--primarioTinteTexto)" />
      <Text fontSize={14} lineHeight={20} fontWeight="600" color="$primarioTinteTexto">
        {children}
      </Text>
    </XStack>
  )
}
