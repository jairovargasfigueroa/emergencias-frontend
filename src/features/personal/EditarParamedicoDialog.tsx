import { useForm } from '@tanstack/react-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Button, Dialog, Form, Input, Label, Paragraph, Spinner, Text, XStack, YStack, useToastController } from 'tamagui'
import { z } from 'zod'
import { codigoDeError, mensajeDeError } from '../../shared/api/cliente'
import { BotonPrimario } from '../../shared/ui/botones'
import { MensajeDeCampo, textoDeErrores } from '../../shared/ui/EstadosDeCarga'
import { IconoAviso } from '../../shared/ui/iconos'
import type { EditarParamedico, Paramedico } from './api'
import { editarParamedicoMutation } from './queries'

// Las mismas reglas que al registrar: el nombre y el teléfono se piden igual se esté creando o corrigiendo.
const esquema = z.object({
  nombreCompleto: z.string().trim().min(1, 'El nombre completo es obligatorio.'),
  telefono: z.string().trim().min(1, 'El teléfono es obligatorio.'),
})

type Paso = { tipo: 'editar' } | { tipo: 'confirmarTelefono'; datos: EditarParamedico }

type Props = {
  paramedico: Paramedico
  onCerrar: () => void
}

/**
 * Corrige el nombre y el teléfono de un paramédico. El teléfono no es solo un dato de contacto: junto con su PIN, es
 * con lo que entra a su app. Por eso se avisa debajo del campo y se confirma aparte antes de cambiarlo.
 *
 * Se monta solo cuando hay un paramédico que editar, así el formulario siempre arranca con los datos de esa fila.
 */
export function EditarParamedicoDialog({ paramedico, onCerrar }: Props) {
  const queryClient = useQueryClient()
  const toast = useToastController()
  const editar = useMutation(editarParamedicoMutation(queryClient))

  const [paso, setPaso] = useState<Paso>({ tipo: 'editar' })
  const [errorDeTelefono, setErrorDeTelefono] = useState<string | null>(null)

  const form = useForm({
    defaultValues: { nombreCompleto: paramedico.nombreCompleto, telefono: paramedico.telefono },
    validators: { onSubmit: esquema },
    onSubmit: async ({ value }) => {
      const datos = esquema.parse(value)
      if (datos.telefono !== paramedico.telefono) {
        setPaso({ tipo: 'confirmarTelefono', datos })
        return
      }
      await guardar(datos)
    },
  })

  async function guardar(datos: EditarParamedico) {
    setErrorDeTelefono(null)
    try {
      const actualizado = await editar.mutateAsync({ id: paramedico.id, datos })
      toast.show('Paramédico actualizado', { message: `Se guardaron los datos de ${actualizado.nombreCompleto}.` })
      onCerrar()
    } catch (error) {
      // El número repetido es un problema de ese campo: se muestra a su lado y se vuelve al formulario para
      // corregirlo, en vez de un aviso que tapa el dato que hay que cambiar.
      setPaso({ tipo: 'editar' })
      if (codigoDeError(error) === 'TELEFONO_DUPLICADO') {
        setErrorDeTelefono(mensajeDeError(error))
        return
      }
      toast.show('No se pudo guardar', { message: mensajeDeError(error) })
    }
  }

  const primerNombre = paramedico.nombreCompleto.split(/\s+/)[0] ?? paramedico.nombreCompleto

  return (
    <Dialog modal open onOpenChange={(abierto) => (abierto ? undefined : onCerrar())}>
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
          {paso.tipo === 'confirmarTelefono' ? (
            <XStack width={40} height={40} rounded={999} items="center" justify="center" bg="$enAtencionTinte">
              <IconoAviso size={20} color="var(--enAtencionTexto)" />
            </XStack>
          ) : null}

          <YStack gap={6}>
            <Dialog.Title color="$texto" fontSize={18} lineHeight={26} fontWeight="600">
              {paso.tipo === 'confirmarTelefono'
                ? `Cambiar el teléfono de ${paramedico.nombreCompleto}`
                : 'Editar paramédico'}
            </Dialog.Title>
            <Dialog.Description color="$textoSecundario" fontSize={14} lineHeight={21}>
              {paso.tipo === 'confirmarTelefono'
                ? `${primerNombre} va a entrar a su app con el número nuevo y su mismo PIN. Con el anterior ya no va a poder.`
                : 'Corrige el nombre o el teléfono con que quedó registrado.'}
            </Dialog.Description>
          </YStack>

          {paso.tipo === 'confirmarTelefono' ? (
            <XStack items="center" gap={12} px={14} py={12} rounded={10} bg="$fondo">
              <Text fontFamily="$mono" fontSize={14} color="$textoSecundario">
                {paramedico.telefono}
              </Text>
              <Text fontSize={14} color="$textoTenue">
                →
              </Text>
              <Text fontFamily="$mono" fontSize={14} fontWeight="600" color="$texto">
                {paso.datos.telefono}
              </Text>
            </XStack>
          ) : null}

          {paso.tipo === 'confirmarTelefono' ? (
            <XStack gap={8} justify="flex-end">
              <Button size="$4" variant="outlined" disabled={editar.isPending} onPress={() => setPaso({ tipo: 'editar' })}>
                Cancelar
              </Button>
              <BotonPrimario
                size="$4"
                disabled={editar.isPending}
                opacity={editar.isPending ? 0.6 : 1}
                icon={editar.isPending ? <Spinner size="small" color="$primarioTexto" /> : undefined}
                onPress={() => {
                  guardar(paso.datos).catch(() => {})
                }}
              >
                <Button.Text color="$primarioTexto">Cambiar</Button.Text>
              </BotonPrimario>
            </XStack>
          ) : (
            <Form gap={20} onSubmit={() => form.handleSubmit().catch(() => {})}>
              <YStack gap={16}>
                <form.Field name="nombreCompleto">
                  {(field) => (
                    <YStack gap={6}>
                      <Label htmlFor="editarNombreCompleto" color="$texto" fontSize={13} fontWeight="500">
                        Nombre completo
                      </Label>
                      <Input
                        id="editarNombreCompleto"
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
                      <Label htmlFor="editarTelefono" color="$texto" fontSize={13} fontWeight="500">
                        Teléfono
                      </Label>
                      <Input
                        id="editarTelefono"
                        size="$4"
                        type="tel"
                        value={field.state.value}
                        onChange={(evento) => {
                          setErrorDeTelefono(null)
                          field.handleChange(evento.currentTarget.value)
                        }}
                        onBlur={field.handleBlur}
                        borderColor={field.state.meta.isValid && !errorDeTelefono ? '$bordeFuerte' : '$primario'}
                      />
                      <Paragraph color="$textoSecundario" fontSize={12} lineHeight={16}>
                        Con este número y su PIN entra a su app. Si lo cambias, avísale que use el número nuevo.
                      </Paragraph>
                      <MensajeDeCampo texto={errorDeTelefono ?? textoDeErrores(field.state.meta.errors)} />
                    </YStack>
                  )}
                </form.Field>
              </YStack>

              <form.Subscribe selector={(estado) => [estado.isSubmitting] as const}>
                {([enviando]) => (
                  <XStack gap={8} justify="flex-end">
                    <Button size="$4" variant="outlined" disabled={enviando} onPress={onCerrar}>
                      Cancelar
                    </Button>
                    <BotonPrimario
                      size="$4"
                      type="submit"
                      disabled={enviando}
                      opacity={enviando ? 0.6 : 1}
                      icon={enviando ? <Spinner size="small" color="$primarioTexto" /> : undefined}
                    >
                      <Button.Text color="$primarioTexto">Guardar</Button.Text>
                    </BotonPrimario>
                  </XStack>
                )}
              </form.Subscribe>
            </Form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
