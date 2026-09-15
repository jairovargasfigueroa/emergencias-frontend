import { useForm } from '@tanstack/react-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Button, Dialog, Form, Input, Label, Spinner, XStack, YStack, useToastController } from 'tamagui'
import { z } from 'zod'
import { codigoDeError, mensajeDeError } from '../../shared/api/cliente'
import { BotonPrimario } from '../../shared/ui/botones'
import { MensajeDeCampo, textoDeErrores } from '../../shared/ui/EstadosDeCarga'
import { registrarAmbulanciaMutation } from './queries'

const esquema = z.object({
  placa: z.string().trim().min(1, 'La placa es obligatoria.'),
  tipoUnidad: z.string().trim().min(1, 'El tipo de unidad es obligatorio.'),
})

type Props = {
  abierto: boolean
  onCambiarAbierto: (abierto: boolean) => void
}

/** PB-01 CA-01 y CA-02: registrar una ambulancia; la placa duplicada se muestra en su campo. */
export function RegistrarAmbulanciaDialog({ abierto, onCambiarAbierto }: Props) {
  const queryClient = useQueryClient()
  const toast = useToastController()
  const registrar = useMutation(registrarAmbulanciaMutation(queryClient))
  const [errorPlaca, setErrorPlaca] = useState<string | null>(null)

  const form = useForm({
    defaultValues: { placa: '', tipoUnidad: '' },
    validators: { onSubmit: esquema },
    onSubmit: async ({ value, formApi }) => {
      try {
        const ambulancia = await registrar.mutateAsync(esquema.parse(value))
        toast.show('Ambulancia registrada', { message: `${ambulancia.placa} quedó disponible.` })
        formApi.reset()
        onCambiarAbierto(false)
      } catch (error) {
        if (codigoDeError(error) === 'PLACA_DUPLICADA') {
          setErrorPlaca(mensajeDeError(error))
          return
        }
        toast.show('No se pudo registrar la ambulancia', { message: mensajeDeError(error) })
      }
    },
  })

  function cambiarAbierto(siguiente: boolean) {
    if (!siguiente) {
      form.reset()
      setErrorPlaca(null)
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
              Registrar ambulancia
            </Dialog.Title>
            <Dialog.Description color="$textoSecundario" fontSize={14} lineHeight={20}>
              Queda disponible y activa desde el registro.
            </Dialog.Description>
          </YStack>

          <Form gap={20} onSubmit={() => form.handleSubmit().catch(() => {})}>
            <YStack gap={16}>
              <form.Field name="placa">
                {(field) => (
                  <YStack gap={6}>
                    <Label htmlFor="placa" color="$texto" fontSize={13} fontWeight="500">
                      Placa
                    </Label>
                    <Input
                      id="placa"
                      size="$4"
                      fontFamily="$mono"
                      placeholder="Ej.: 3890-PLM"
                      autoFocus
                      value={field.state.value}
                      onChange={(evento) => {
                        field.handleChange(evento.currentTarget.value)
                        setErrorPlaca(null)
                      }}
                      onBlur={field.handleBlur}
                      borderColor={errorPlaca || !field.state.meta.isValid ? '$primario' : '$bordeFuerte'}
                    />
                    <MensajeDeCampo texto={errorPlaca ?? textoDeErrores(field.state.meta.errors)} />
                  </YStack>
                )}
              </form.Field>

              <form.Field name="tipoUnidad">
                {(field) => (
                  <YStack gap={6}>
                    <Label htmlFor="tipoUnidad" color="$texto" fontSize={13} fontWeight="500">
                      Tipo de unidad
                    </Label>
                    <Input
                      id="tipoUnidad"
                      size="$4"
                      placeholder="Ej.: Soporte vital básico"
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
