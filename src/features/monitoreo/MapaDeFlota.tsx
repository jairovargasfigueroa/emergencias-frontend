import { AdvancedMarker, APIProvider, ColorScheme, Map, useMap } from '@vis.gl/react-google-maps'
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { Button, Paragraph, Text, XStack, YStack, type YStackProps } from 'tamagui'
import type { IncidenteAbierto } from './api'
import type { PosicionConocida, UnidadMonitoreada } from './posiciones'

const CLAVE_MAPA = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined
/** Sin `mapId` Google no dibuja los pines nuevos (AdvancedMarker), que son los únicos que no están obsoletos. */
const ID_MAPA = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID as string | undefined

/** Ciudad donde opera el servicio, configurada en .env.local. Sin ella, el mapa abre sobre Bolivia. */
const CIUDAD = coordenadasDeEntorno(import.meta.env.VITE_MAPA_LATITUD, import.meta.env.VITE_MAPA_LONGITUD)

const CENTRO_BOLIVIA = { lat: -16.3, lng: -63.6 }
const ZOOM_BOLIVIA = 5
const ZOOM_CIUDAD = 12
/** Con un solo punto no hay rectángulo que encuadrar: se centra en él a la altura de unas cuadras. */
const ZOOM_UN_PUNTO = 14
const RELLENO_ENCUADRE = 72

/** El mapa sigue en el mismo sitio del árbol al abrirse: si se moviera, Google lo recrearía y perdería el encuadre. */
const ESTILO_EN_LA_PAGINA: CSSProperties = { display: 'flex', width: '100%' }
const ESTILO_PANTALLA_COMPLETA: CSSProperties = { position: 'fixed', inset: 0, zIndex: 1000, display: 'flex' }

function coordenadasDeEntorno(latitud: string | undefined, longitud: string | undefined) {
  if (!latitud?.trim() || !longitud?.trim()) {
    return null
  }
  const lat = Number(latitud)
  const lng = Number(longitud)
  const validas = Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && !(lat === 0 && lng === 0)
  return validas ? { lat, lng } : null
}

type UnidadEnMapa = UnidadMonitoreada & { posicion: PosicionConocida }

function vaAlMapa(unidad: UnidadMonitoreada): unidad is UnidadEnMapa {
  return unidad.enElMapa && unidad.posicion !== null
}

type Props = {
  unidades: UnidadMonitoreada[]
  /** Todos los incidentes abiertos, no solo los que nadie cubre: el mapa muestra dónde está pasando algo. */
  incidentes: IncidenteAbierto[]
  /** Id de la ambulancia elegida en la tabla: el mapa la centra y se acerca. Null si no hay ninguna. */
  enfocada: number | null
  /**
   * Alto del recuadro del mapa. Llega como prop y es obligatorio a propósito: Google Maps no dibuja nada si su
   * contenedor mide cero, que es justo lo que pasa con un `flex` dentro de un padre sin alto definido.
   */
  alto: number
}

/** Dónde está cada unidad en turno y dónde está pasando algo, ahora. */
export function MapaDeFlota({ unidades, incidentes, enfocada, alto }: Props) {
  const [pantallaCompleta, setPantallaCompleta] = useState(false)
  const enElMapa = unidades.filter(vaAlMapa)

  // Escape sale de la pantalla completa, que es lo que cualquiera intenta primero. Mientras dura, el fondo no
  // scrollea: la página sigue ahí abajo y sin esto se movería sola al girar la rueda fuera del mapa.
  useEffect(() => {
    if (!pantallaCompleta) {
      return
    }
    const alTeclear = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') {
        setPantallaCompleta(false)
      }
    }
    const scrollPrevio = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', alTeclear)
    return () => {
      document.body.style.overflow = scrollPrevio
      window.removeEventListener('keydown', alTeclear)
    }
  }, [pantallaCompleta])

  if (!CLAVE_MAPA || !ID_MAPA) {
    return (
      <Recuadro alto={alto} rectangular={false}>
        <YStack flex={1} items="center" justify="center" px={32} gap={6}>
          <Text fontSize={15} fontWeight="600" color="$texto">
            Falta configurar el mapa
          </Text>
          <Paragraph fontSize={13} lineHeight={18} color="$textoSecundario" text="center">
            Completá VITE_GOOGLE_MAPS_API_KEY y VITE_GOOGLE_MAPS_MAP_ID en .env.local y volvé a levantar el panel.
          </Paragraph>
        </YStack>
      </Recuadro>
    )
  }

  return (
    <div style={pantallaCompleta ? ESTILO_PANTALLA_COMPLETA : ESTILO_EN_LA_PAGINA}>
      <Recuadro alto={pantallaCompleta ? '100%' : alto} rectangular={pantallaCompleta}>
        <APIProvider apiKey={CLAVE_MAPA}>
          <Map
            mapId={ID_MAPA}
            style={{ width: '100%', height: '100%' }}
            // Sin valor controlado: una vez encuadrado, el mapa es del administrador y nadie se lo mueve.
            defaultCenter={CIUDAD ?? CENTRO_BOLIVIA}
            defaultZoom={CIUDAD ? ZOOM_CIUDAD : ZOOM_BOLIVIA}
            colorScheme={ColorScheme.FOLLOW_SYSTEM}
            // Los controles que llevan a otra cosa sobran acá, y la pantalla completa es la del panel.
            clickableIcons={false}
            mapTypeControl={false}
            streetViewControl={false}
            fullscreenControl={false}
          >
            <EncuadreInicial unidades={enElMapa} incidentes={incidentes} />
            <EnfoqueDeUnidad unidades={enElMapa} enfocada={enfocada} />

            {incidentes.map((incidente) => (
              <AdvancedMarker
                key={`incidente-${incidente.id}`}
                position={{ lat: incidente.latitud, lng: incidente.longitud }}
                title={tituloDelIncidente(incidente)}
                zIndex={1}
              >
                <PinDeIncidente incidente={incidente} />
              </AdvancedMarker>
            ))}

            {/* Las unidades van encima: tapar una ambulancia con un incidente sería esconder a quien lo atiende. */}
            {enElMapa.map((unidad) => (
              <AdvancedMarker
                key={`unidad-${unidad.unidad.ambulanciaId}`}
                position={{ lat: unidad.posicion.latitud, lng: unidad.posicion.longitud }}
                title={unidad.unidad.placa}
                zIndex={unidad.unidad.ambulanciaId === enfocada ? 3 : 2}
              >
                <PinDeUnidad unidad={unidad} resaltada={unidad.unidad.ambulanciaId === enfocada} />
              </AdvancedMarker>
            ))}
          </Map>
        </APIProvider>

        <XStack position="absolute" top={12} right={12} zIndex={2}>
          <Button
            size="$3"
            bg="$superficie"
            borderColor="$borde"
            hoverStyle={{ bg: '$fondo' }}
            aria-label={pantallaCompleta ? 'Salir de la pantalla completa' : 'Ver el mapa en pantalla completa'}
            onPress={() => setPantallaCompleta((abierta) => !abierta)}
          >
            <Button.Text fontSize={12} fontWeight="600" color="$texto">
              {pantallaCompleta ? 'Salir (Esc)' : 'Pantalla completa'}
            </Button.Text>
          </Button>
        </XStack>
      </Recuadro>
    </div>
  )
}

function tituloDelIncidente(incidente: IncidenteAbierto) {
  const referencia = incidente.descripciones[0]
  return referencia ? `Incidente #${incidente.id} · ${referencia}` : `Incidente #${incidente.id}`
}

type PropsRecuadro = {
  alto: YStackProps['height']
  /** En pantalla completa las esquinas redondeadas dejarían ver el fondo: ahí el mapa va a ras de la ventana. */
  rectangular: boolean
  children: ReactNode
}

function Recuadro({ alto, rectangular, children }: PropsRecuadro) {
  return (
    <YStack
      height={alto}
      minW={0}
      flex={1}
      rounded={rectangular ? 0 : 12}
      overflow="hidden"
      bg="$superficie"
      borderWidth={rectangular ? 0 : 1}
      borderColor="$borde"
    >
      {children}
    </YStack>
  )
}

/**
 * Encuadra todo lo que hay que mirar la primera vez que hay algo, y nunca más. Si se reencuadrara con cada
 * posición que llega, al administrador se le movería el mapa justo mientras lo está mirando.
 */
function EncuadreInicial({ unidades, incidentes }: { unidades: UnidadEnMapa[]; incidentes: IncidenteAbierto[] }) {
  const mapa = useMap()
  const yaEncuadro = useRef(false)

  useEffect(() => {
    // Los incidentes entran en el encuadre: si todavía no salió nadie, lo único que hay para ver son ellos.
    const puntos = [
      ...unidades.map((unidad) => ({ lat: unidad.posicion.latitud, lng: unidad.posicion.longitud })),
      ...incidentes.map((incidente) => ({ lat: incidente.latitud, lng: incidente.longitud })),
    ]
    if (yaEncuadro.current || !mapa || puntos.length === 0) {
      return
    }
    yaEncuadro.current = true

    if (puntos.length === 1) {
      mapa.setCenter(puntos[0])
      mapa.setZoom(ZOOM_UN_PUNTO)
      return
    }

    mapa.fitBounds(
      {
        north: Math.max(...puntos.map((punto) => punto.lat)),
        south: Math.min(...puntos.map((punto) => punto.lat)),
        east: Math.max(...puntos.map((punto) => punto.lng)),
        west: Math.min(...puntos.map((punto) => punto.lng)),
      },
      RELLENO_ENCUADRE,
    )
  }, [mapa, unidades, incidentes])

  return null
}

/**
 * Centra la unidad que el administrador acaba de elegir en la tabla. El efecto depende solo de cuál eligió: las
 * posiciones se leen de una referencia porque cambian todo el tiempo y, si estuvieran en las dependencias, el
 * mapa volvería a centrarse con cada reporte que llega.
 */
function EnfoqueDeUnidad({ unidades, enfocada }: { unidades: UnidadEnMapa[]; enfocada: number | null }) {
  const mapa = useMap()
  const ultimas = useRef(unidades)

  useEffect(() => {
    ultimas.current = unidades
  })

  useEffect(() => {
    if (!mapa || enfocada === null) {
      return
    }
    const elegida = ultimas.current.find((unidad) => unidad.unidad.ambulanciaId === enfocada)
    if (!elegida) {
      return
    }
    mapa.panTo({ lat: elegida.posicion.latitud, lng: elegida.posicion.longitud })
    mapa.setZoom(ZOOM_UN_PUNTO)
  }, [mapa, enfocada])

  return null
}

/**
 * Pin de una unidad: el color dice en qué está y la placa dice cuál es, sin tener que tocar nada. Va con
 * componentes de Tamagui, igual que el resto del panel: el mapa los inserta dentro del árbol de la página, así
 * que el tema sigue valiendo.
 */
function PinDeUnidad({ unidad, resaltada }: { unidad: UnidadEnMapa; resaltada: boolean }) {
  const enAtencion = unidad.unidad.estado === 'EN_ATENCION'
  const color = enAtencion ? '$enAtencion' : '$disponible'

  return (
    <YStack items="center" opacity={unidad.sinSenal ? 0.55 : 1}>
      <XStack
        items="center"
        height={26}
        px={10}
        rounded={999}
        bg={color}
        borderWidth={2}
        // Punteado: la unidad estuvo ahí, pero hace rato que no avisa dónde está.
        borderStyle={unidad.sinSenal ? 'dashed' : 'solid'}
        borderColor={resaltada ? '$texto' : '$superficie'}
      >
        <Text fontSize={12} fontWeight="600" color="$primarioTexto" numberOfLines={1}>
          {unidad.unidad.placa}
        </Text>
      </XStack>
      {/* Punta del pin: marca el punto exacto, que es donde el marcador se ancla. */}
      <YStack width={2} height={8} bg={color} />
      <YStack width={8} height={8} rounded={999} bg={color} borderWidth={2} borderColor="$superficie" />
    </YStack>
  )
}

/**
 * Pin de un incidente abierto. Sale de Firebase, así que aparece y desaparece solo: no hay que esperar al
 * refresco de `/operacion` para ver dónde acaba de pasar algo.
 */
function PinDeIncidente({ incidente }: { incidente: IncidenteAbierto }) {
  const cubierto = incidente.unidadesAcudiendo > 0

  return (
    <YStack items="center">
      <XStack
        items="center"
        justify="center"
        width={26}
        height={26}
        rounded={999}
        bg="$primario"
        borderWidth={2}
        borderColor="$superficie"
        // Con alguien en camino el incidente sigue abierto, pero ya no es de los que reclaman una decisión.
        opacity={cubierto ? 0.7 : 1}
      >
        <Text fontSize={14} lineHeight={18} fontWeight="700" color="$primarioTexto">
          !
        </Text>
      </XStack>
      <YStack width={2} height={6} bg="$primario" />
      <YStack width={6} height={6} rounded={999} bg="$primario" borderWidth={2} borderColor="$superficie" />
    </YStack>
  )
}
