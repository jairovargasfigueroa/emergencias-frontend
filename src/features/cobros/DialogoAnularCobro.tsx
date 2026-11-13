import { useForm } from '@tanstack/react-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Dialog, Label, Spinner, TextArea, XStack, YStack, useToastController } from 'tamagui'
import { z } from 'zod'
import { mensajeDeError } from '../../shared/api/cliente'
import { BotonPrimario } from '../../shared/ui/botones'
import { MensajeDeCampo, textoDeErrores } from '../../shared/ui/EstadosDeCarga'
import type { Cobro } from './api'
import { anularCobroMutation } from './queries'
import { bolivianos } from './textos'

const esquema = z.object({
  motivo: z.string().trim().min(1, 'Escribe por qué se anula.').max(1000, 'El motivo es demasiado largo.'),
})

/** PB-29: anular un cobro. Es final; queda el importe que tenía, con el motivo. Se monta solo al abrirlo. */
export function DialogoAnularCobro({ cobro, onCerrar }: { cobro: Cobro; onCerrar: () => void }) {
  const queryClient = useQueryClient()
  const toast = useToastController()
  const anular = useMutation(anularCobroMutation(queryClient))

  const form = useForm({
    defaultValues: { motivo: '' },
    validators: { onSubmit: esquema },
    onSubmit: async ({ value }) => {
      try {
        await anular.mutateAsync({ cobroId: cobro.id, motivo: esquema.parse(value).motivo })
        toast.show('Cobro anulado', { message: `Queda registrado que era de ${bolivianos(cobro.importe)}.` })
        onCerrar()
      } catch (error) {
        toast.show('No se pudo anular el cobro', { message: mensajeDeError(error) })
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
          gap={18}
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
              ¿Anular el cobro de {bolivianos(cobro.importe)}?
            </Dialog.Title>
            <Dialog.Description color="$textoSecundario" fontSize={14} lineHeight={20}>
              El servicio deja de cobrarse y el cobro ya no se puede modificar. Queda el importe que tenía, con el motivo.
            </Dialog.Description>
          </YStack>

          <form.Field name="motivo">
            {(campo) => (
              <YStack gap={6}>
                <Label htmlFor="motivo-anulacion" color="$texto" fontSize={13} fontWeight="500">
                  Motivo
                </Label>
                <TextArea
                  id="motivo-anulacion"
                  size="$4"
                  rows={3}
                  autoFocus
                  placeholder="Ej.: servicio sin costo por convenio"
                  value={campo.state.value}
                  onChangeText={campo.handleChange}
                  onBlur={campo.handleBlur}
                  borderColor={campo.state.meta.isValid ? '$bordeFuerte' : '$primario'}
                />
                <MensajeDeCampo texto={textoDeErrores(campo.state.meta.errors)} />
              </YStack>
            )}
          </form.Field>

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
                  <Button.Text color="$primarioTexto">Anular el cobro</Button.Text>
                </BotonPrimario>
              </XStack>
            )}
          </form.Subscribe>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
