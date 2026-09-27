import { useForm } from '@tanstack/react-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Button, Dialog, Form, Input, Label, Spinner, XStack, YStack, useToastController } from 'tamagui'
import { z } from 'zod'
import { codigoDeError, mensajeDeError } from '../../shared/api/cliente'
import { BotonPrimario } from '../../shared/ui/botones'
import { MensajeDeCampo, textoDeErrores } from '../../shared/ui/EstadosDeCarga'
import { TIPOS_UNIDAD, type Ambulancia } from './api'
import { editarAmbulanciaMutation } from './queries'
import { SelectorTipoUnidad } from './SelectorTipoUnidad'

// Las mismas reglas que al registrar: la placa y el tipo se piden igual se esté creando o corrigiendo.
const esquema = z.object({
  placa: z.string().trim().min(1, 'La placa es obligatoria.'),
  tipoUnidad: z.enum(TIPOS_UNIDAD, { message: 'Elegí el tipo de unidad.' }),
})

const MOTIVO_TIPO_BLOQUEADO =
  'El tipo no se puede cambiar con una atención en curso: es lo que decide qué traslados toma la unidad, y cambiarlo a mitad de viaje dejaría a ese paciente con una ambulancia que no le corresponde.'

type Props = {
  ambulancia: Ambulancia
  onCerrar: () => void
}

/**
 * Corrige la placa o el tipo de una ambulancia. Se monta solo cuando hay una ambulancia que editar, así el
 * formulario siempre arranca con los datos de esa fila.
 */
export function EditarAmbulanciaDialog({ ambulancia, onCerrar }: Props) {
  const queryClient = useQueryClient()
  const toast = useToastController()
  const editar = useMutation(editarAmbulanciaMutation(queryClient))
  const [errorPlaca, setErrorPlaca] = useState<string | null>(null)

  const enAtencion = ambulancia.estado === 'EN_ATENCION'

  const form = useForm({
    defaultValues: { placa: ambulancia.placa, tipoUnidad: ambulancia.tipoUnidad },
    validators: { onSubmit: esquema },
    onSubmit: async ({ value }) => {
      setErrorPlaca(null)
      try {
        const actualizada = await editar.mutateAsync({ id: ambulancia.id, datos: esquema.parse(value) })
        toast.show('Ambulancia actualizada', { message: `Se guardaron los datos de ${actualizada.placa}.` })
        onCerrar()
      } catch (error) {
        // La placa repetida es un problema de ese campo: se muestra a su lado para corregirla ahí mismo, en vez
        // de un aviso que tapa el dato que hay que cambiar.
        if (codigoDeError(error) === 'PLACA_DUPLICADA') {
          setErrorPlaca(mensajeDeError(error))
          return
        }
        // `AMBULANCIA_EN_ATENCION` llega si la unidad salió a atender mientras el diálogo estaba abierto: el
        // selector se bloquea con lo que se sabía al abrirlo, así que el backend es el que tiene la última
        // palabra. Su mensaje ya explica qué pasó.
        toast.show('No se pudo guardar', { message: mensajeDeError(error) })
      }
    },
  })

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
          <YStack gap={6}>
            <Dialog.Title color="$texto" fontSize={18} lineHeight={26} fontWeight="600">
              Editar ambulancia
            </Dialog.Title>
            <Dialog.Description color="$textoSecundario" fontSize={14} lineHeight={21}>
              Corregí la placa o el tipo con que quedó registrada.
            </Dialog.Description>
          </YStack>

          <Form gap={20} onSubmit={() => form.handleSubmit().catch(() => {})}>
            <YStack gap={16}>
              <form.Field name="placa">
                {(field) => (
                  <YStack gap={6}>
                    <Label htmlFor="editarPlaca" color="$texto" fontSize={13} fontWeight="500">
                      Placa
                    </Label>
                    <Input
                      id="editarPlaca"
                      size="$4"
                      fontFamily="$mono"
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
                    <Label color="$texto" fontSize={13} fontWeight="500">
                      Tipo de unidad
                    </Label>
                    <SelectorTipoUnidad
                      valor={field.state.value}
                      onElegir={field.handleChange}
                      motivoBloqueado={enAtencion ? MOTIVO_TIPO_BLOQUEADO : undefined}
                    />
                    <MensajeDeCampo texto={textoDeErrores(field.state.meta.errors)} />
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
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
