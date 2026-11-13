import { AdvancedMarker, APIProvider, ColorScheme, Map } from '@vis.gl/react-google-maps'
import { Paragraph, YStack } from 'tamagui'

const CLAVE_MAPA = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined
const ID_MAPA = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID as string | undefined

const LATITUD_CIUDAD = Number(import.meta.env.VITE_MAPA_LATITUD)
const LONGITUD_CIUDAD = Number(import.meta.env.VITE_MAPA_LONGITUD)
const CIUDAD =
  import.meta.env.VITE_MAPA_LATITUD && import.meta.env.VITE_MAPA_LONGITUD && Number.isFinite(LATITUD_CIUDAD + LONGITUD_CIUDAD)
    ? { lat: LATITUD_CIUDAD, lng: LONGITUD_CIUDAD }
    : { lat: -16.3, lng: -63.6 }

type Punto = { lat: number; lng: number }

type Props = {
  /** El punto marcado, o null si todavía no hay ninguno. */
  punto: Punto | null
  onElegir: (punto: Punto) => void
  /** Lo que marca el pin, para quien pasa el mouse: "Ubicación del centro", "Dónde se lo busca". */
  titulo: string
}

/**
 * Un mapa chico donde un clic marca un punto. Sin la clave de Google se avisa: quien lo usa tiene que ofrecer otra
 * forma de cargarlo.
 */
export function SelectorDePunto({ punto, onElegir, titulo }: Props) {
  if (!CLAVE_MAPA || !ID_MAPA) {
    return (
      <Paragraph fontSize={13} lineHeight={18} color="$textoSecundario">
        El mapa no está configurado: completa VITE_GOOGLE_MAPS_API_KEY y VITE_GOOGLE_MAPS_MAP_ID en .env.local.
      </Paragraph>
    )
  }

  return (
    <YStack height={240} rounded={10} overflow="hidden" borderWidth={1} borderColor="$borde" position="relative">
      <APIProvider apiKey={CLAVE_MAPA}>
        <Map
          mapId={ID_MAPA}
          style={{ position: 'absolute', inset: 0 }}
          defaultCenter={punto ?? CIUDAD}
          defaultZoom={punto ? 15 : 12}
          colorScheme={ColorScheme.FOLLOW_SYSTEM}
          clickableIcons={false}
          mapTypeControl={false}
          streetViewControl={false}
          fullscreenControl={false}
          onClick={(evento) => {
            const latLng = evento.detail.latLng
            if (latLng) {
              onElegir({ lat: latLng.lat, lng: latLng.lng })
            }
          }}
        >
          {punto ? <AdvancedMarker position={punto} title={titulo} /> : null}
        </Map>
      </APIProvider>
    </YStack>
  )
}
