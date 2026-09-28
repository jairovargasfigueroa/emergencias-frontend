import { useForm } from '@tanstack/react-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Dialog, Label, Paragraph, Spinner, XStack, YStack, useToastController } from 'tamagui'
import { z } from 'zod'
import { codigoDeError, mensajeDeError } from '../../shared/api/cliente'
import { BotonPrimario } from '../../shared/ui/botones'
import { MensajeDeCampo, textoDeErrores } from '../../shared/ui/EstadosDeCarga'
import { OpcionElegible } from '../../shared/ui/OpcionElegible'
import { MOTIVOS_CIERRE_INCIDENTE, type MotivoCierreIncidente } from './api'
import { cerrarIncidenteMutation } from './queries'
import { OPCION_MOTIVO_CIERRE } from './textos'

const esquema = z.object({
  motivo: z.enum(MOTIVOS_CIERRE_INCIDENTE, { message: 'Elige por qué lo cierras.' }),
})

type Props = {
  incidenteId: number
  onCerrar: () => void
}

/**
 * Cerrar a mano un incidente que no se va a atender: era una falsa alarma, lo atendieron por otro medio, no hay
 * unidad que pueda ir u otro motivo. Es lo que hace el despachador cuando confirma que no hay nada que mandar. Se
 * confirma en el mismo diálogo porque no tiene vuelta atrás: a quienes pidieron la ambulancia les llega el aviso.
 *
 * Se monta solo al abrirlo, así el motivo siempre arranca sin elegir.
 */
export function DialogoCerrarIncidente({ incidenteId, onCerrar }: Props) {
  const queryClient = useQueryClient()
  const toast = useToastController()
  const cerrar = useMutation(cerrarIncidenteMutation(queryClient))

  const form = useForm({
    defaultValues: { motivo: '' as MotivoCierreIncidente },
    validators: { onSubmit: esquema },
    onSubmit: async ({ value }) => {
      const { motivo } = esquema.parse(value)
      try {
        await cerrar.mutateAsync({ id: incidenteId, motivo })
        toast.show('Incidente cerrado', {
          message: `El incidente #${incidenteId} quedó cerrado y se les avisó a quienes pidieron la ambulancia.`,
        })
        onCerrar()
      } catch (error) {
        toast.show('No se pudo cerrar el incidente', { message: mensajeDeError(error) })
        // Cambió mientras se lo miraba: una unidad lo tomó, o ya estaba cerrado. El detalle se recarga y lo muestra.
        const codigo = codigoDeError(error)
        if (codigo === 'TRANSICION_INVALIDA' || codigo === 'INCIDENTE_CERRADO') {
          onCerrar()
        }
      }
    },
  })

  return (
    <Dialog modal open onOpenChange={(abierto) => (abierto ? undefined : onCerrar())}>
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
              Cerrar el incidente #{incidenteId}
            </Dialog.Title>
            <Dialog.Description color="$textoSecundario" fontSize={14} lineHeight={20}>
              Para cuando no se va a atender. Queda cerrado con el motivo que elijas y sale del mapa de las unidades.
            </Dialog.Description>
          </YStack>

          <form.Field name="motivo">
            {(campo) => (
              <YStack gap={8}>
                <Label color="$texto" fontSize={13} fontWeight="500">
                  ¿Por qué lo cierras?
                </Label>
                <YStack role="radiogroup" aria-label="Por qué lo cierras" gap={6}>
                  {MOTIVOS_CIERRE_INCIDENTE.map((motivo) => (
                    <OpcionElegible
                      key={motivo}
                      titulo={OPCION_MOTIVO_CIERRE[motivo].titulo}
                      detalle={OPCION_MOTIVO_CIERRE[motivo].detalle}
                      elegida={campo.state.value === motivo}
                      onElegir={() => campo.handleChange(motivo)}
                    />
                  ))}
                </YStack>
                <MensajeDeCampo texto={textoDeErrores(campo.state.meta.errors)} />
              </YStack>
            )}
          </form.Field>

          <XStack px={12} py={10} rounded={10} bg="$enAtencionTinte">
            <Paragraph fontSize={13} lineHeight={19} color="$enAtencionTexto">
              A quienes pidieron la ambulancia les llega un aviso de que su pedido se cerró, para que la vuelvan a pedir
              si todavía la necesitan.
            </Paragraph>
          </XStack>

          <form.Subscribe selector={(estado) => [estado.isSubmitting] as const}>
            {([enviando]) => (
              <XStack gap={8} justify="flex-end">
                <Button size="$4" variant="outlined" disabled={enviando} onPress={onCerrar}>
                  Cancelar
                </Button>
                <BotonPrimario
                  size="$4"
                  disabled={enviando}
                  opacity={enviando ? 0.6 : 1}
                  icon={enviando ? <Spinner size="small" color="$primarioTexto" /> : undefined}
                  onPress={() => {
                    form.handleSubmit().catch(() => {})
                  }}
                >
                  <Button.Text color="$primarioTexto">Cerrar el incidente</Button.Text>
                </BotonPrimario>
              </XStack>
            )}
          </form.Subscribe>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
