import { AdvancedMarker, APIProvider, ColorScheme, Map, useMap } from '@vis.gl/react-google-maps'
import { useEffect, useRef, type ReactNode } from 'react'
import { Paragraph, Text, XStack, YStack, type YStackProps } from 'tamagui'
import type { PosicionPublicada } from './api'
import type { UnidadMonitoreada } from './posiciones'

const CLAVE_MAPA = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined
/** Sin `mapId` Google no dibuja los pines nuevos (AdvancedMarker), que son los únicos que no están obsoletos. */
const ID_MAPA = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID as string | undefined

/** Ciudad donde opera el servicio, configurada en .env.local. Sin ella, el mapa abre sobre Bolivia. */
const CIUDAD = coordenadasDeEntorno(import.meta.env.VITE_MAPA_LATITUD, import.meta.env.VITE_MAPA_LONGITUD)

const CENTRO_BOLIVIA = { lat: -16.3, lng: -63.6 }
const ZOOM_BOLIVIA = 5
const ZOOM_CIUDAD = 12
/** Con una sola unidad no hay rectángulo que encuadrar: se centra en ella a la altura de unas cuadras. */
const ZOOM_UNA_UNIDAD = 14
const RELLENO_ENCUADRE = 72

function coordenadasDeEntorno(latitud: string | undefined, longitud: string | undefined) {
  if (!latitud?.trim() || !longitud?.trim()) {
    return null
  }
  const lat = Number(latitud)
  const lng = Number(longitud)
  const validas = Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && !(lat === 0 && lng === 0)
  return validas ? { lat, lng } : null
}

type UnidadEnMapa = UnidadMonitoreada & { posicion: PosicionPublicada }

function vaAlMapa(unidad: UnidadMonitoreada): unidad is UnidadEnMapa {
  return unidad.enElMapa && unidad.posicion !== null
}

type Props = {
  unidades: UnidadMonitoreada[]
  /**
   * Alto del recuadro del mapa. Llega como prop y es obligatorio a propósito: Google Maps no dibuja nada si su
   * contenedor mide cero, que es justo lo que pasa con un `flex` dentro de un padre sin alto definido.
   */
  alto: YStackProps['height']
}

/** Dónde está cada unidad en turno, ahora. Es solo para mirar: no hay nada que tocar en el mapa. */
export function MapaDeFlota({ unidades, alto }: Props) {
  const enElMapa = unidades.filter(vaAlMapa)

  if (!CLAVE_MAPA || !ID_MAPA) {
    return (
      <Recuadro alto={alto}>
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
    <Recuadro alto={alto}>
      <APIProvider apiKey={CLAVE_MAPA}>
        <Map
          mapId={ID_MAPA}
          style={{ width: '100%', height: '100%' }}
          // Sin valor controlado: una vez encuadrado, el mapa es del administrador y nadie se lo mueve.
          defaultCenter={CIUDAD ?? CENTRO_BOLIVIA}
          defaultZoom={CIUDAD ? ZOOM_CIUDAD : ZOOM_BOLIVIA}
          colorScheme={ColorScheme.FOLLOW_SYSTEM}
          // Esta pantalla no tiene acciones: se sacan los controles que llevan a otra cosa.
          clickableIcons={false}
          mapTypeControl={false}
          streetViewControl={false}
        >
          <EncuadreInicial unidades={enElMapa} />
          {enElMapa.map((unidad) => (
            <AdvancedMarker
              key={unidad.ambulancia.id}
              position={{ lat: unidad.posicion.latitud, lng: unidad.posicion.longitud }}
              title={unidad.ambulancia.placa}
            >
              <PinDeUnidad unidad={unidad} />
            </AdvancedMarker>
          ))}
        </Map>
      </APIProvider>
    </Recuadro>
  )
}

function Recuadro({ alto, children }: { alto: YStackProps['height']; children: ReactNode }) {
  return (
    <YStack
      height={alto}
      minW={0}
      flex={1}
      rounded={12}
      overflow="hidden"
      bg="$superficie"
      borderWidth={1}
      borderColor="$borde"
    >
      {children}
    </YStack>
  )
}

/**
 * Encuadra las unidades la primera vez que hay alguna y nunca más. Si se reencuadrara con cada posición que
 * llega, al administrador se le movería el mapa justo mientras lo está mirando.
 */
function EncuadreInicial({ unidades }: { unidades: UnidadEnMapa[] }) {
  const mapa = useMap()
  const yaEncuadro = useRef(false)

  useEffect(() => {
    if (yaEncuadro.current || !mapa || unidades.length === 0) {
      return
    }
    yaEncuadro.current = true

    const primera = unidades[0].posicion
    if (unidades.length === 1) {
      mapa.setCenter({ lat: primera.latitud, lng: primera.longitud })
      mapa.setZoom(ZOOM_UNA_UNIDAD)
      return
    }

    const latitudes = unidades.map((unidad) => unidad.posicion.latitud)
    const longitudes = unidades.map((unidad) => unidad.posicion.longitud)
    mapa.fitBounds(
      {
        north: Math.max(...latitudes),
        south: Math.min(...latitudes),
        east: Math.max(...longitudes),
        west: Math.min(...longitudes),
      },
      RELLENO_ENCUADRE,
    )
  }, [mapa, unidades])

  return null
}

/**
 * Pin de una unidad: el color dice en qué está y la placa dice cuál es, sin tener que tocar nada. Va con
 * componentes de Tamagui, igual que el resto del panel: el mapa los inserta dentro del árbol de la página, así
 * que el tema sigue valiendo.
 */
function PinDeUnidad({ unidad }: { unidad: UnidadEnMapa }) {
  const enAtencion = unidad.ambulancia.estado === 'EN_ATENCION'
  const color = enAtencion ? '$enAtencion' : '$disponible'

  return (
    <YStack items="center" opacity={unidad.desactualizada ? 0.55 : 1}>
      <XStack
        items="center"
        gap={6}
        height={26}
        px={10}
        rounded={999}
        bg={color}
        borderWidth={2}
        // Punteado: la unidad estuvo ahí, pero hace rato que no avisa dónde está.
        borderStyle={unidad.desactualizada ? 'dashed' : 'solid'}
        borderColor="$superficie"
      >
        <Text fontSize={12} fontWeight="600" color="white" numberOfLines={1}>
          {unidad.ambulancia.placa}
        </Text>
      </XStack>
      {/* Punta del pin: marca el punto exacto, que es donde el marcador se ancla. */}
      <YStack width={2} height={8} bg={color} />
      <YStack width={8} height={8} rounded={999} bg={color} borderWidth={2} borderColor="$superficie" />
    </YStack>
  )
}
