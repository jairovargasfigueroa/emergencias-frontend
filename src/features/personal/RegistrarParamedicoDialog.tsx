import { useForm } from '@tanstack/react-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Dialog, Form, Input, Label, Spinner, XStack, YStack, useToastController } from 'tamagui'
import { z } from 'zod'
import { mensajeDeError } from '../../shared/api/cliente'
import { BotonPrimario } from '../../shared/ui/botones'
import { MensajeDeCampo, textoDeErrores } from '../../shared/ui/EstadosDeCarga'
import { registrarParamedicoMutation } from './queries'

const esquema = z.object({
  nombreCompleto: z.string().trim().min(1, 'El nombre completo es obligatorio.'),
  telefono: z.string().trim().min(1, 'El teléfono es obligatorio.'),
})

type Props = {
  abierto: boolean
  onCambiarAbierto: (abierto: boolean) => void
}

/** PB-01 R1: el administrador registra al personal, que queda activo con rol PARAMEDICO. */
export function RegistrarParamedicoDialog({ abierto, onCambiarAbierto }: Props) {
  const queryClient = useQueryClient()
  const toast = useToastController()
  const registrar = useMutation(registrarParamedicoMutation(queryClient))

  const form = useForm({
    defaultValues: { nombreCompleto: '', telefono: '' },
    validators: { onSubmit: esquema },
    onSubmit: async ({ value, formApi }) => {
      try {
        const paramedico = await registrar.mutateAsync(esquema.parse(value))
        toast.show('Paramédico registrado', { message: `${paramedico.nombreCompleto} ya puede ser asignado.` })
        formApi.reset()
        onCambiarAbierto(false)
      } catch (error) {
        toast.show('No se pudo registrar al paramédico', { message: mensajeDeError(error) })
      }
    },
  })

  function cambiarAbierto(siguiente: boolean) {
    if (!siguiente) {
      form.reset()
    }
    onCambiarAbierto(siguiente)
  }

  return (
    <Dialog modal open={abierto} onOpenChange={cambiarAbierto}>
      <Dialog.Portal>
        <Dialog.Overlay key="overlay" bg="$velo" transition="quick" enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} />
        <Dialog.Content
          key="content"
          width={440}
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
              Registrar paramédico
            </Dialog.Title>
            <Dialog.Description color="$textoSecundario" fontSize={14} lineHeight={20}>
              Con su teléfono se identificará en la app del paramédico.
            </Dialog.Description>
          </YStack>

          <Form gap={20} onSubmit={() => form.handleSubmit().catch(() => {})}>
            <YStack gap={16}>
              <form.Field name="nombreCompleto">
                {(field) => (
                  <YStack gap={6}>
                    <Label htmlFor="nombreCompleto" color="$texto" fontSize={13} fontWeight="500">
                      Nombre completo
                    </Label>
                    <Input
                      id="nombreCompleto"
                      size="$4"
                      autoFocus
                      value={field.state.value}
                      onChange={(evento) => field.handleChange(evento.currentTarget.value)}
                      onBlur={field.handleBlur}
                      borderColor={field.state.meta.isValid ? '$bordeFuerte' : '$primario'}
                    />
                    <MensajeDeCampo texto={textoDeErrores(field.state.meta.errors)} />
                  </YStack>
                )}
              </form.Field>

              <form.Field name="telefono">
                {(field) => (
                  <YStack gap={6}>
                    <Label htmlFor="telefono" color="$texto" fontSize={13} fontWeight="500">
                      Teléfono
                    </Label>
                    <Input
                      id="telefono"
                      size="$4"
                      type="tel"
                      value={field.state.value}
                      onChange={(evento) => field.handleChange(evento.currentTarget.value)}
                      onBlur={field.handleBlur}
                      borderColor={field.state.meta.isValid ? '$bordeFuerte' : '$primario'}
                    />
                    <MensajeDeCampo texto={textoDeErrores(field.state.meta.errors)} />
                  </YStack>
                )}
              </form.Field>
            </YStack>

            <form.Subscribe selector={(estado) => [estado.isSubmitting] as const}>
              {([enviando]) => (
                <XStack gap={8} justify="flex-end">
                  <Button size="$4" variant="outlined" disabled={enviando} onPress={() => cambiarAbierto(false)}>
                    Cancelar
                  </Button>
                  <BotonPrimario
                    size="$4"
                    type="submit"
                    disabled={enviando}
                    opacity={enviando ? 0.6 : 1}
                    icon={enviando ? <Spinner size="small" color="$primarioTexto" /> : undefined}
                  >
                    <Button.Text color="$primarioTexto">Registrar</Button.Text>
                  </BotonPrimario>
                </XStack>
              )}
            </form.Subscribe>
          </Form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
