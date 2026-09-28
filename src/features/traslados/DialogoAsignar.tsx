import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Dialog, Spinner, Text, XStack, YStack, useToastController } from 'tamagui'
import { codigoDeError, mensajeDeError } from '../../shared/api/cliente'
import { textoDistancia } from '../../shared/formato/distancia'
import { tiempoTranscurrido } from '../../shared/formato/fechas'
import { BotonPrimario } from '../../shared/ui/botones'
import { ErrorAlCargar } from '../../shared/ui/EstadosDeCarga'
import { Insignia } from '../../shared/ui/Insignia'
import { TIPO_UNIDAD_CORTO } from '../flota/api'
import type { Traslado, UnidadParaTraslado } from './api'
import { asignarTrasladoMutation, unidadesParaTrasladoQuery } from './queries'

type Props = {
  traslado: Traslado | null
  onCerrar: () => void
}

/**
 * Asignar a mano, para cuando el sistema no encontró unidad o el administrador sabe algo que el sistema no. Solo se
 * ofrecen las disponibles cuyo tipo alcanza, de la más cercana al origen a la más lejana: mandar una que no
 * corresponde es mandar al paramédico a un viaje que no va a poder hacer. Las que el barrido no elegiría —sin GPS
 * reciente, o que ya lo tuvieron y lo dejaron— aparecen igual, marcadas, y se pueden elegir.
 */
export function DialogoAsignar({ traslado, onCerrar }: Props) {
  const queryClient = useQueryClient()
  const toast = useToastController()
  // Activa solo con el diálogo abierto: la lista se pide al abrirlo y se descarta al cerrarlo.
  const unidades = useQuery({ ...unidadesParaTrasladoQuery(traslado?.id ?? 0), enabled: traslado !== null })
  const asignar = useMutation(asignarTrasladoMutation(queryClient))

  function elegir(unidad: UnidadParaTraslado) {
    if (!traslado) {
      return
    }
    asignar.mutate(
      { id: traslado.id, ambulanciaId: unidad.ambulanciaId },
      {
        onSuccess: () => {
          toast.show('Unidad asignada', { message: `${unidad.placa} va al traslado de ${traslado.pasajero}.` })
          onCerrar()
        },
        onError: (error) => {
          toast.show('No se pudo asignar', { message: mensajeDeError(error) })
          if (codigoDeError(error) === 'TRANSICION_INVALIDA') {
            // Ya no espera unidad: el sistema se la dio recién, o se venció. No queda nada que elegir.
            onCerrar()
          } else {
            // Lo más probable es que la unidad se haya ocupado mientras el diálogo estaba abierto.
            void unidades.refetch()
          }
        },
      },
    )
  }

  // Reintentar después de un error no cambia el estado de la consulta hasta que termina: sin esto, el botón de
  // reintentar no daría ninguna señal de que está pidiendo.
  const buscando = unidades.isPending || (unidades.isError && unidades.isFetching)
  const hayMarcadas = (unidades.data ?? []).some((unidad) => unidad.yaLoTuvo || !unidad.posicionReciente)

  return (
    <Dialog modal open={traslado !== null} onOpenChange={(abierto) => !abierto && onCerrar()}>
      <Dialog.Portal>
        <Dialog.Overlay key="overlay" bg="$velo" transition="quick" enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} />
        <Dialog.Content
          key="content"
          width={460}
          maxW="92%"
          p={24}
          gap={20}
          rounded={14}
          bg="$superficie"
          borderWidth={1}
          borderColor="$borde"
          elevate
          transition="quick"
          enterStyle={{ opacity: 0, y: -12, scale: 0.97 }}
          exitStyle={{ opacity: 0, y: 8, scale: 0.97 }}
        >
          <YStack gap={6}>
            <Dialog.Title color="$texto" fontSize={18} lineHeight={26} fontWeight="600">
              Asignar una unidad
            </Dialog.Title>
            <Dialog.Description color="$textoSecundario" fontSize={14} lineHeight={20}>
              {traslado
                ? `Traslado de ${traslado.pasajero}. Necesita ${TIPO_UNIDAD_CORTO[traslado.tipoUnidad]} o superior; van de la más cercana al origen a la más lejana.`
                : ''}
            </Dialog.Description>
          </YStack>

          {buscando ? (
            <XStack items="center" gap={8} py={12}>
              <Spinner size="small" color="$textoSecundario" />
              <Text fontSize={14} color="$textoSecundario">
                Buscando unidades…
              </Text>
            </XStack>
          ) : unidades.isError ? (
            <ErrorAlCargar error={unidades.error} onReintentar={() => unidades.refetch()} />
          ) : unidades.data.length === 0 ? (
            <Text fontSize={14} lineHeight={20} color="$textoSecundario">
              No hay ninguna unidad disponible que sirva para este traslado. Cuando alguna se libere, el sistema la
              asigna solo.
            </Text>
          ) : (
            <YStack gap={10}>
              <YStack gap={8} maxH={320} overflow="scroll">
                {unidades.data.map((unidad) => (
                  <OpcionDeUnidad
                    key={unidad.ambulanciaId}
                    unidad={unidad}
                    consultadaEn={unidades.dataUpdatedAt}
                    asignando={asignar.isPending && asignar.variables.ambulanciaId === unidad.ambulanciaId}
                    bloqueada={asignar.isPending}
                    onElegir={() => elegir(unidad)}
                  />
                ))}
              </YStack>
              {hayMarcadas ? (
                <Text fontSize={12} lineHeight={16} color="$textoSecundario">
                  El sistema no elegiría las marcadas, pero puedes asignarlas igual si sabes que sirven.
                </Text>
              ) : null}
            </YStack>
          )}

          <XStack justify="flex-end">
            <Button size="$4" variant="outlined" disabled={asignar.isPending} onPress={onCerrar}>
              Cerrar
            </Button>
          </XStack>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}

type PropsOpcion = {
  unidad: UnidadParaTraslado
  /** Cuándo llegó la lista: con eso se dice de hace cuánto es la posición de una unidad sin GPS reciente. */
  consultadaEn: number
  /** Es la que se está asignando ahora: lleva la ruedita. */
  asignando: boolean
  /** Mientras se asigna una, no se puede elegir otra. */
  bloqueada: boolean
  onElegir: () => void
}

/**
 * Una unidad de la lista, con lo que hace falta para elegirla: cuán lejos está del origen y, si las tiene, las
 * marcas por las que el barrido no la elegiría. Con una posición vieja se dice de cuándo es, porque la distancia
 * sale de ahí y la unidad puede estar en otro lado.
 */
function OpcionDeUnidad({ unidad, consultadaEn, asignando, bloqueada, onElegir }: PropsOpcion) {
  const distancia =
    unidad.distanciaMetros === null
      ? 'Nunca reportó su posición'
      : !unidad.posicionReciente && unidad.posicionEn
        ? `A ${textoDistancia(unidad.distanciaMetros)} del origen, según su posición de hace ${tiempoTranscurrido(unidad.posicionEn, consultadaEn)}`
        : `A ${textoDistancia(unidad.distanciaMetros)} del origen`

  return (
    <XStack
      items="center"
      justify="space-between"
      gap={12}
      px={12}
      py={10}
      rounded={10}
      borderWidth={1}
      borderColor="$borde"
    >
      <YStack gap={4} flex={1} minW={0}>
        <XStack items="baseline" gap={8}>
          <Text fontSize={14} fontWeight="600" color="$texto" fontFamily="$mono">
            {unidad.placa}
          </Text>
          <Text fontSize={12} color="$textoSecundario">
            {TIPO_UNIDAD_CORTO[unidad.tipoUnidad]}
          </Text>
        </XStack>
        <Text fontSize={12} lineHeight={16} color="$textoSecundario">
          {distancia}
        </Text>
        {unidad.yaLoTuvo || !unidad.posicionReciente ? (
          <XStack gap={6} flexWrap="wrap">
            {unidad.yaLoTuvo ? <Insignia tono="ambar">Ya lo tuvo</Insignia> : null}
            {unidad.posicionReciente ? null : <Insignia tono="ambar">Sin GPS reciente</Insignia>}
          </XStack>
        ) : null}
      </YStack>
      <BotonPrimario
        size="$3"
        disabled={bloqueada}
        opacity={bloqueada && !asignando ? 0.6 : 1}
        icon={asignando ? <Spinner size="small" color="$primarioTexto" /> : undefined}
        onPress={onElegir}
      >
        <Button.Text color="$primarioTexto" fontSize={13} fontWeight="600">
          Asignar
        </Button.Text>
      </BotonPrimario>
    </XStack>
  )
}
