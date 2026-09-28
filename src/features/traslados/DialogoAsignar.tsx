import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Dialog, XStack, YStack, useToastController } from 'tamagui'
import { codigoDeError, mensajeDeError } from '../../shared/api/cliente'
import { TIPO_UNIDAD_CORTO, type UnidadCandidata } from '../flota/api'
import { UnidadesCandidatas, type TextosDeCandidatas } from '../flota/UnidadesCandidatas'
import type { Traslado } from './api'
import { asignarTrasladoMutation, unidadesParaTrasladoQuery } from './queries'

const TEXTOS: TextosDeCandidatas = {
  referencia: 'del origen',
  yaLoTuvo: 'Ya lo tuvo',
  sinUnidades:
    'No hay ninguna unidad disponible que sirva para este traslado. Cuando alguna se libere, el sistema la asigna solo.',
  elegir: 'Asignar',
  marcadas: 'El sistema no elegiría las marcadas, pero puedes asignarlas igual si sabes que sirven.',
}

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

  function elegir(unidad: UnidadCandidata) {
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

          <UnidadesCandidatas
            consulta={unidades}
            textos={TEXTOS}
            enviando={asignar.isPending ? asignar.variables.ambulanciaId : null}
            onElegir={elegir}
          />

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
