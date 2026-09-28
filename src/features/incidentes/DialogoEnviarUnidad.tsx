import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Dialog, Paragraph, XStack, YStack, useToastController } from 'tamagui'
import { codigoDeError, mensajeDeError } from '../../shared/api/cliente'
import type { UnidadCandidata } from '../flota/api'
import { UnidadesCandidatas, type TextosDeCandidatas } from '../flota/UnidadesCandidatas'
import type { IncidenteResumen } from './api'
import { despacharUnidadMutation, unidadesParaIncidenteQuery } from './queries'

const TEXTOS: TextosDeCandidatas = {
  referencia: 'del lugar',
  yaLoTuvo: 'Ya estuvo en este caso',
  sinUnidades:
    'No hay ninguna unidad disponible ahora: las que están atendiendo, sin turno o fuera de servicio no se ofrecen.',
  elegir: 'Enviar',
  marcadas: 'Las marcadas se pueden enviar igual si sabes que sirven.',
}

/** El incidente al que se manda la unidad, con cuántas lo están atendiendo ahora. */
export type IncidenteParaEnviar = Pick<IncidenteResumen, 'id' | 'unidadesAcudiendo'>

type Props = {
  /** Null con el diálogo cerrado. */
  incidente: IncidenteParaEnviar | null
  onCerrar: () => void
}

/**
 * Mandar una unidad a una emergencia, como hace el despachador de una central: en el día a día las unidades toman los
 * incidentes solas, y esto es para cuando nadie lo toma o hace falta una más. Se ofrecen las disponibles de la más
 * cercana al lugar a la más lejana. Las que ya estuvieron en el caso o no reportan su posición hace rato aparecen
 * igual, marcadas: quien manda a mano puede saber algo que el sistema no.
 */
export function DialogoEnviarUnidad({ incidente, onCerrar }: Props) {
  const queryClient = useQueryClient()
  const toast = useToastController()
  // Activa solo con el diálogo abierto: la lista se pide al abrirlo y se descarta al cerrarlo.
  const unidades = useQuery({ ...unidadesParaIncidenteQuery(incidente?.id ?? 0), enabled: incidente !== null })
  const despachar = useMutation(despacharUnidadMutation(queryClient))
  const trabajando = incidente?.unidadesAcudiendo ?? 0

  function elegir(unidad: UnidadCandidata) {
    if (!incidente) {
      return
    }
    despachar.mutate(
      { id: incidente.id, ambulanciaId: unidad.ambulanciaId },
      {
        onSuccess: () => {
          toast.show('Unidad enviada', {
            message: `${unidad.placa} va al incidente #${incidente.id}. Su tripulación recibe el aviso en su app.`,
          })
          onCerrar()
        },
        onError: (error) => {
          toast.show('No se pudo enviar la unidad', { message: mensajeDeError(error) })
          if (codigoDeError(error) === 'INCIDENTE_CERRADO') {
            // Se cerró mientras se elegía: ya no hay adónde mandarla.
            onCerrar()
          } else {
            // Lo más probable es que la unidad se haya ocupado, o que su tripulación haya cerrado el turno.
            void unidades.refetch()
          }
        },
      },
    )
  }

  return (
    <Dialog modal open={incidente !== null} onOpenChange={(abierto) => !abierto && onCerrar()}>
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
              Enviar una unidad
            </Dialog.Title>
            <Dialog.Description color="$textoSecundario" fontSize={14} lineHeight={20}>
              {incidente
                ? `Incidente #${incidente.id}. Van de la más cercana al lugar a la más lejana, y la tripulación de la que elijas recibe el aviso en su app.`
                : ''}
            </Dialog.Description>
          </YStack>

          {/* Que ya haya una trabajando no impide mandar otra, pero conviene saber que no se la reemplaza. */}
          {trabajando > 0 ? (
            <XStack px={12} py={10} rounded={10} bg="$enAtencionTinte">
              <Paragraph fontSize={13} lineHeight={19} color="$enAtencionTexto">
                {trabajando === 1
                  ? 'Ya hay una unidad trabajando en este caso: la que envíes se suma, no la reemplaza.'
                  : `Ya hay ${trabajando} unidades trabajando en este caso: la que envíes se suma, no las reemplaza.`}
              </Paragraph>
            </XStack>
          ) : null}

          <UnidadesCandidatas
            consulta={unidades}
            textos={TEXTOS}
            enviando={despachar.isPending ? despachar.variables.ambulanciaId : null}
            onElegir={elegir}
          />

          <XStack justify="flex-end">
            <Button size="$4" variant="outlined" disabled={despachar.isPending} onPress={onCerrar}>
              Cerrar
            </Button>
          </XStack>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
