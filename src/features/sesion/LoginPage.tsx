import { useForm } from '@tanstack/react-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Button, Form, Input, Label, Paragraph, Spinner, Text, YStack } from 'tamagui'
import { z } from 'zod'
import { ErrorApi, mensajeDeError } from '../../shared/api/cliente'
import { BotonPrimario } from '../../shared/ui/botones'
import { MensajeDeCampo, textoDeErrores } from '../../shared/ui/EstadosDeCarga'
import { MarcaSga } from '../../shared/ui/MarcaSga'
import { ingresarMutation } from './queries'

const esquema = z.object({
  correo: z.string().trim().min(1, 'El correo es obligatorio.').email('Escribe un correo válido.'),
  clave: z.string().min(1, 'La contraseña es obligatoria.'),
})

/** Entrada al panel. Es la única pantalla que se ve sin sesión. */
export function LoginPage() {
  const queryClient = useQueryClient()
  const navegar = useNavigate()
  const ingresar = useMutation(ingresarMutation(queryClient))

  const form = useForm({
    defaultValues: { correo: '', clave: '' },
    validators: { onSubmit: esquema },
    onSubmit: async ({ value }) => {
      await ingresar.mutateAsync(esquema.parse(value))
      await navegar({ to: '/flota', replace: true })
    },
  })

  // Credenciales equivocadas es lo esperable acá y se dice en el formulario, no en un toast que se va solo.
  const aviso = ingresar.isError
    ? ingresar.error instanceof ErrorApi && ingresar.error.status === 401
      ? 'El correo o la contraseña no coinciden.'
      : mensajeDeError(ingresar.error)
    : null

  return (
    <YStack flex={1} minH="100vh" bg="$fondo" items="center" justify="center" p={24}>
      <YStack width={400} maxW="100%" gap={24}>
        <YStack items="center">
          <MarcaSga />
        </YStack>

        <YStack gap={20} p={28} rounded={16} bg="$superficie" borderWidth={1} borderColor="$borde">
          <YStack gap={6}>
            <Text color="$texto" fontSize={20} lineHeight={28} fontWeight="600">
              Entrar al panel
            </Text>
            <Paragraph color="$textoSecundario" fontSize={14} lineHeight={20}>
              Con la cuenta de administrador del sistema.
            </Paragraph>
          </YStack>

          <Form gap={20} onSubmit={() => form.handleSubmit().catch(() => {})}>
            <YStack gap={16}>
              <form.Field name="correo">
                {(field) => (
                  <YStack gap={6}>
                    <Label htmlFor="correo" color="$texto" fontSize={13} fontWeight="500">
                      Correo
                    </Label>
                    <Input
                      id="correo"
                      size="$4"
                      autoFocus
                      type="email"
                      autoComplete="username"
                      value={field.state.value}
                      onChange={(evento) => field.handleChange(evento.currentTarget.value)}
                      onBlur={field.handleBlur}
                      borderColor={field.state.meta.isValid ? '$bordeFuerte' : '$primario'}
                    />
                    <MensajeDeCampo texto={textoDeErrores(field.state.meta.errors)} />
                  </YStack>
                )}
              </form.Field>

              <form.Field name="clave">
                {(field) => (
                  <YStack gap={6}>
                    <Label htmlFor="clave" color="$texto" fontSize={13} fontWeight="500">
                      Contraseña
                    </Label>
                    <Input
                      id="clave"
                      size="$4"
                      secureTextEntry
                      autoComplete="current-password"
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

            <MensajeDeCampo texto={aviso} />

            <form.Subscribe selector={(estado) => [estado.isSubmitting] as const}>
              {([enviando]) => (
                <BotonPrimario
                  size="$4"
                  type="submit"
                  disabled={enviando}
                  opacity={enviando ? 0.6 : 1}
                  icon={enviando ? <Spinner size="small" color="$primarioTexto" /> : undefined}
                >
                  <Button.Text color="$primarioTexto">Entrar</Button.Text>
                </BotonPrimario>
              )}
            </form.Subscribe>
          </Form>
        </YStack>
      </YStack>
    </YStack>
  )
}
