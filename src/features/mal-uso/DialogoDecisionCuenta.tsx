import { useForm } from '@tanstack/react-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Dialog, Label, Paragraph, Spinner, TextArea, XStack, YStack, useToastController } from 'tamagui'
import { z } from 'zod'
import { mensajeDeError } from '../../shared/api/cliente'
import { BotonPrimario } from '../../shared/ui/botones'
import { MensajeDeCampo, textoDeErrores } from '../../shared/ui/EstadosDeCarga'
import type { HistorialDeCiudadano } from './api'
import { desactivarCuentaMutation, reactivarCuentaMutation } from './queries'

const esquema = z.object({
  motivo: z
    .string()
    .trim()
    .min(1, 'Escribe el motivo: queda registrado en la cuenta.')
    .max(1000, 'El motivo es demasiado largo.'),
})

type Props = {
  ciudadano: HistorialDeCiudadano
  onCerrar: () => void
}

/**
 * PB-23: desactivar o reactivar la cuenta, según cómo esté. Las dos llevan su motivo, y quedan con la fecha y quién
 * lo hizo. Se monta solo al abrirlo.
 */
export function DialogoDecisionCuenta({ ciudadano, onCerrar }: Props) {
  const queryClient = useQueryClient()
  const toast = useToastController()
  const desactivar = useMutation(desactivarCuentaMutation(queryClient))
  const reactivar = useMutation(reactivarCuentaMutation(queryClient))
  const desactivando = ciudadano.activo

  const form = useForm({
    defaultValues: { motivo: '' },
    validators: { onSubmit: esquema },
    onSubmit: async ({ value }) => {
      const { motivo } = esquema.parse(value)
      try {
        await (desactivando ? desactivar : reactivar).mutateAsync({ id: ciudadano.id, motivo })
        toast.show(desactivando ? 'Cuenta desactivada' : 'Cuenta reactivada', {
          message: desactivando
            ? `${ciudadano.nombre} ya no puede entrar a la app ni pedir ambulancias.`
            : `${ciudadano.nombre} puede volver a entrar a la app.`,
        })
        onCerrar()
      } catch (error) {
        toast.show('No se pudo guardar la decisión', { message: mensajeDeError(error) })
      }
    },
  })

  return (
    <Dialog modal open onOpenChange={(abierto) => (abierto ? undefined : onCerrar())}>
      <Dialog.Portal>
        <Dialog.Overlay key="overlay" bg="$velo" transition="quick" enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} />
        <Dialog.Content
          key="content"
          width={480}
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
              {desactivando ? `¿Desactivar la cuenta de ${ciudadano.nombre}?` : `¿Reactivar la cuenta de ${ciudadano.nombre}?`}
            </Dialog.Title>
            <Dialog.Description color="$textoSecundario" fontSize={14} lineHeight={20}>
              {desactivando
                ? 'Se le cierra la sesión en el acto y no puede volver a entrar ni pedir ambulancias o traslados. Su historial se conserva.'
                : 'Vuelve a poder entrar a la app con su número y pedir ambulancias. La desactivación anterior queda en el historial.'}
            </Dialog.Description>
          </YStack>

          <form.Field name="motivo">
            {(campo) => (
              <YStack gap={6}>
                <Label htmlFor="motivo-decision" color="$texto" fontSize={13} fontWeight="500">
                  Motivo
                </Label>
                <TextArea
                  id="motivo-decision"
                  size="$4"
                  rows={3}
                  autoFocus
                  placeholder={
                    desactivando
                      ? 'Ej.: tres falsas alarmas verificadas en una semana'
                      : 'Ej.: el teléfono lo usaba otra persona'
                  }
                  value={campo.state.value}
                  onChangeText={campo.handleChange}
                  onBlur={campo.handleBlur}
                  borderColor={campo.state.meta.isValid ? '$bordeFuerte' : '$primario'}
                />
                <MensajeDeCampo texto={textoDeErrores(campo.state.meta.errors)} />
              </YStack>
            )}
          </form.Field>

          {desactivando ? (
            <XStack px={12} py={10} rounded={10} bg="$enAtencionTinte">
              <Paragraph fontSize={13} lineHeight={19} color="$enAtencionTexto">
                Si intenta entrar, la app le dice que su cuenta fue desactivada por la central y que ante una emergencia
                llame al 160.
              </Paragraph>
            </XStack>
          ) : null}

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
                  <Button.Text color="$primarioTexto">{desactivando ? 'Desactivar la cuenta' : 'Reactivar la cuenta'}</Button.Text>
                </BotonPrimario>
              </XStack>
            )}
          </form.Subscribe>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
