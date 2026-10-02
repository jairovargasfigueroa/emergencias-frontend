import { useQuery } from '@tanstack/react-query'
import { useRef, useState, type ReactNode, type RefObject, type SyntheticEvent } from 'react'
import { Button, Dialog, ScrollView, Spinner, Text, XStack, YStack } from 'tamagui'
import { hora } from '../../shared/formato/fechas'
import { Insignia, type TonoInsignia } from '../../shared/ui/Insignia'
import type { AlertaDeIncidente } from '../incidentes/api'
import { Nota, Seccion } from '../incidentes/PiezasDelDetalle'
import type { EstadoEvidencia, EvidenciaDelIncidente, LecturaEvidencia, MomentoDelVideo } from './api'
import { lecturaEvidenciaQuery, lecturaVencida } from './queries'
import { TEXTO_ESTADO_EVIDENCIA, TEXTO_MODALIDAD, textoDe } from './textos'

/** Ancho de cada evidencia. Fijo, para que fotos, audios y videos queden en una grilla pareja. */
const ANCHO_EVIDENCIA = 260

/** Alto del recuadro de la foto o el video dentro de la tarjeta. */
const ALTO_MEDIO = 160

/** Hasta dónde crecen la transcripción y la línea de tiempo antes de desplazarse, para no estirar la grilla. */
const ALTO_MAXIMO_TEXTO = 140

const TONO_ESTADO: Record<EstadoEvidencia, TonoInsignia> = {
  SUBIDA: 'contorno',
  ANALIZADA: 'gris',
  FALLIDA: 'ambar',
}

type Props = {
  evidencias: EvidenciaDelIncidente[]
  /** Las que entraron en la versión vigente del resumen. Vacía si todavía no hay resumen. */
  usadas: number[]
  alertas: AlertaDeIncidente[]
}

/**
 * Las fotos, audios y videos que mandaron quienes avisaron, para verlos tal cual y no solo a través del resumen.
 * Cada archivo se pide al almacén con una URL que dura minutos: se pide al mostrarlo y se renueva si vence.
 */
export function EvidenciasDelIncidente({ evidencias, usadas, alertas }: Props) {
  return (
    <Seccion titulo={`Evidencias (${evidencias.length})`}>
      <XStack flexWrap="wrap" gap={12}>
        {evidencias.map((evidencia) => (
          <TarjetaEvidencia
            key={evidencia.evidenciaId}
            evidencia={evidencia}
            usada={usadas.includes(evidencia.evidenciaId)}
            alerta={alertas.find((alerta) => alerta.id === evidencia.alertaId)}
          />
        ))}
      </XStack>
    </Seccion>
  )
}

type PropsTarjeta = {
  evidencia: EvidenciaDelIncidente
  usada: boolean
  alerta: AlertaDeIncidente | undefined
}

function TarjetaEvidencia({ evidencia, usada, alerta }: PropsTarjeta) {
  const titulo = `${textoDe(TEXTO_MODALIDAD, evidencia.modalidad)} de ${
    alerta ? `${alerta.emisor.nombreCompleto} (${hora(alerta.fechaHora)})` : `la alerta #${evidencia.alertaId}`
  }`
  const video = useRef<HTMLVideoElement>(null)
  const momentos = evidencia.modalidad === 'VIDEO' ? (evidencia.lineaDeTiempo ?? []) : []

  /** Lleva el video al momento elegido y lo reproduce desde ahí. */
  function irA(segundo: number) {
    const elemento = video.current
    if (!elemento) {
      return
    }
    elemento.currentTime = segundo
    void elemento.play().catch(() => undefined)
  }

  return (
    <YStack width={ANCHO_EVIDENCIA} gap={10} p={12} bg="$superficie" borderWidth={1} borderColor="$borde" rounded={12}>
      {evidencia.modalidad !== 'IMAGEN' && evidencia.transcripcion ? (
        <Transcripcion texto={evidencia.transcripcion} />
      ) : null}
      <Medio evidencia={evidencia} titulo={titulo} refVideo={video} />
      {momentos.length > 0 ? <LineaDeTiempo momentos={momentos} onElegir={irA} /> : null}
      <YStack gap={6}>
        <Text fontSize={13} lineHeight={18} fontWeight="500" color="$texto" numberOfLines={2}>
          {titulo}
        </Text>
        <XStack gap={6} flexWrap="wrap">
          <Insignia tono={TONO_ESTADO[evidencia.estado] ?? 'contorno'}>
            {textoDe(TEXTO_ESTADO_EVIDENCIA, evidencia.estado)}
          </Insignia>
          {usada ? <Insignia tono="contorno">En el resumen</Insignia> : null}
        </XStack>
        {/* Que el análisis falle no quiere decir que el archivo no sirva: se puede mirar igual. */}
        {evidencia.estado === 'FALLIDA' ? <Nota>La IA no pudo analizarla y no entra en el resumen.</Nota> : null}
      </YStack>
    </YStack>
  )
}

/**
 * El archivo, con la URL firmada. Si el navegador no puede cargarlo, lo más probable es que la URL haya vencido: se
 * pide otra y, en un audio o video, se retoma desde donde iba. Una sola vez por URL vigente, salvo que esté vencida:
 * un archivo que el navegador no sabe reproducir fallaría con cualquier URL, y pedir otra no lo arregla.
 */
type PropsMedio = {
  evidencia: EvidenciaDelIncidente
  titulo: string
  /** El elemento del video, para que la línea de tiempo pueda llevarlo a un momento. */
  refVideo: RefObject<HTMLVideoElement | null>
}

function Medio({ evidencia, titulo, refVideo }: PropsMedio) {
  const lectura = useQuery(lecturaEvidenciaQuery(evidencia.evidenciaId))
  const [renovadaPara, setRenovadaPara] = useState<string | null>(null)
  const [roto, setRoto] = useState(false)
  const [ampliada, setAmpliada] = useState(false)
  const retomarEn = useRef<number | null>(null)

  if (lectura.isPending) {
    return (
      <Recuadro>
        <Spinner size="small" color="$textoSecundario" />
      </Recuadro>
    )
  }

  if (lectura.isError || roto) {
    return (
      <Recuadro>
        <YStack items="center" gap={8} px={12}>
          <Text fontSize={13} lineHeight={18} color="$textoSecundario" text="center">
            No se pudo cargar el archivo.
          </Text>
          <Button
            size="$2"
            variant="outlined"
            onPress={() => {
              setRoto(false)
              setRenovadaPara(null)
              void lectura.refetch()
            }}
          >
            Reintentar
          </Button>
        </YStack>
      </Recuadro>
    )
  }

  const { url, venceEn }: LecturaEvidencia = lectura.data

  function alFallar(evento: SyntheticEvent<HTMLMediaElement | HTMLImageElement>) {
    if (renovadaPara === url && !lecturaVencida(venceEn)) {
      setRoto(true)
      return
    }
    const elemento = evento.currentTarget
    retomarEn.current = 'currentTime' in elemento && elemento.currentTime > 0 ? elemento.currentTime : null
    setRenovadaPara(url)
    void lectura.refetch()
  }

  function alCargar(evento: SyntheticEvent<HTMLMediaElement>) {
    if (retomarEn.current !== null) {
      evento.currentTarget.currentTime = retomarEn.current
      retomarEn.current = null
    }
  }

  switch (evidencia.modalidad) {
    case 'IMAGEN':
      return (
        <>
          <img
            src={url}
            alt={titulo}
            onError={alFallar}
            onClick={() => setAmpliada(true)}
            style={{
              width: '100%',
              height: ALTO_MEDIO,
              objectFit: 'cover',
              borderRadius: 8,
              background: 'var(--fondo)',
              cursor: 'zoom-in',
              display: 'block',
            }}
          />
          <FotoAmpliada url={url} titulo={titulo} abierta={ampliada} onCerrar={() => setAmpliada(false)} onFallar={alFallar} />
        </>
      )
    case 'AUDIO':
      return (
        <audio
          src={url}
          controls
          preload="metadata"
          onError={alFallar}
          onLoadedMetadata={alCargar}
          style={{ width: '100%', display: 'block' }}
        />
      )
    case 'VIDEO':
      return (
        <video
          ref={refVideo}
          src={url}
          controls
          preload="metadata"
          onError={alFallar}
          onLoadedMetadata={alCargar}
          style={{ width: '100%', height: ALTO_MEDIO, borderRadius: 8, background: '#000', display: 'block' }}
        />
      )
    default:
      return null
  }
}

/** Lo que se dice en el audio o el video, para leerlo sin tener que escucharlo. */
function Transcripcion({ texto }: { texto: string }) {
  return (
    <YStack gap={4}>
      <Text fontSize={12} lineHeight={16} fontWeight="500" color="$textoSecundario">
        Lo que se escucha
      </Text>
      <ScrollView maxHeight={ALTO_MAXIMO_TEXTO}>
        <Text fontSize={13} lineHeight={19} color="$texto">
          {texto}
        </Text>
      </ScrollView>
    </YStack>
  )
}

/** Qué pasa en cada momento del video. Elegir uno lleva el video ahí. */
function LineaDeTiempo({ momentos, onElegir }: { momentos: MomentoDelVideo[]; onElegir: (segundo: number) => void }) {
  return (
    <YStack gap={4}>
      <Text fontSize={12} lineHeight={16} fontWeight="500" color="$textoSecundario">
        Lo que pasa en el video
      </Text>
      <ScrollView maxHeight={ALTO_MAXIMO_TEXTO}>
        {momentos.map((momento, indice) => (
          <XStack
            key={indice}
            role="button"
            aria-label={`Ir a ${minutosYSegundos(momento.segundo)}: ${momento.texto}`}
            gap={8}
            px={6}
            py={4}
            rounded={6}
            cursor="pointer"
            hoverStyle={{ bg: '$fondo' }}
            onPress={() => onElegir(momento.segundo)}
          >
            <Text width={40} fontSize={12} lineHeight={18} fontFamily="$mono" fontWeight="500" color="$textoSecundario">
              {minutosYSegundos(momento.segundo)}
            </Text>
            <Text flex={1} fontSize={13} lineHeight={18} color="$texto">
              {momento.texto}
            </Text>
          </XStack>
        ))}
      </ScrollView>
    </YStack>
  )
}

/** "1:05" a partir de los segundos desde el inicio del video. */
function minutosYSegundos(segundos: number): string {
  const enteros = Math.floor(segundos)
  return `${Math.floor(enteros / 60)}:${String(enteros % 60).padStart(2, '0')}`
}

/** Lugar reservado del tamaño del medio, para que la grilla no salte mientras carga o cuando falla. */
function Recuadro({ children }: { children: ReactNode }) {
  return (
    <YStack height={ALTO_MEDIO} items="center" justify="center" rounded={8} bg="$fondo">
      {children}
    </YStack>
  )
}

type PropsAmpliada = {
  url: string
  titulo: string
  abierta: boolean
  onCerrar: () => void
  onFallar: (evento: SyntheticEvent<HTMLImageElement>) => void
}

/** La foto a todo lo que da la pantalla, sin recortar. */
function FotoAmpliada({ url, titulo, abierta, onCerrar, onFallar }: PropsAmpliada) {
  return (
    <Dialog modal open={abierta} onOpenChange={(abierto) => !abierto && onCerrar()}>
      <Dialog.Portal>
        <Dialog.Overlay key="overlay" bg="$velo" transition="quick" enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} />
        <Dialog.Content
          key="content"
          maxW="92%"
          p={16}
          gap={12}
          rounded={14}
          bg="$superficie"
          borderWidth={1}
          borderColor="$borde"
          elevate
          transition="quick"
          enterStyle={{ opacity: 0, scale: 0.97 }}
          exitStyle={{ opacity: 0, scale: 0.97 }}
        >
          <XStack items="center" justify="space-between" gap={16}>
            <Dialog.Title color="$texto" fontSize={15} lineHeight={22} fontWeight="600">
              {titulo}
            </Dialog.Title>
            <Button size="$3" variant="outlined" onPress={onCerrar}>
              Cerrar
            </Button>
          </XStack>
          <img
            src={url}
            alt={titulo}
            onError={onFallar}
            style={{ maxWidth: '100%', maxHeight: '78vh', objectFit: 'contain', display: 'block', margin: '0 auto' }}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
