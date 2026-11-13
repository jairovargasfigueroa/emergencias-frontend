import { useForm } from '@tanstack/react-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Dialog, Form, Input, Label, Spinner, XStack, YStack, useToastController } from 'tamagui'
import { z } from 'zod'
import { mensajeDeError } from '../../shared/api/cliente'
import { BotonPrimario } from '../../shared/ui/botones'
import { MensajeDeCampo, textoDeErrores } from '../../shared/ui/EstadosDeCarga'
import type { CentroSalud } from './api'
import { corregirCentroSaludMutation, registrarCentroSaludMutation } from './queries'
import { SelectorDePunto } from './SelectorDePunto'

function coordenada(limite: number, nombre: string) {
  return z
    .string()
    .trim()
    .min(1, `Marca el punto en el mapa o escribe la ${nombre}.`)
    .refine((texto) => Number.isFinite(Number(texto)) && Math.abs(Number(texto)) <= limite, {
      message: `La ${nombre} va de -${limite} a ${limite}.`,
    })
}

const esquema = z.object({
  nombre: z.string().trim().min(1, 'El nombre del centro es obligatorio.').max(255, 'El nombre es demasiado largo.'),
  direccion: z.string().trim().max(255, 'La dirección es demasiado larga.'),
  latitud: coordenada(90, 'latitud'),
  longitud: coordenada(180, 'longitud'),
})

type Props = {
  /** El centro a corregir, o null para registrar uno nuevo. */
  centro: CentroSalud | null
  onCerrar: () => void
}

/**
 * PB-24: registrar o corregir un centro de salud. Se monta solo mientras está abierto, así el formulario siempre
 * arranca con los datos del centro elegido (o vacío).
 */
export function GuardarCentroDialog({ centro, onCerrar }: Props) {
  const queryClient = useQueryClient()
  const toast = useToastController()
  const registrar = useMutation(registrarCentroSaludMutation(queryClient))
  const corregir = useMutation(corregirCentroSaludMutation(queryClient))

  const form = useForm({
    defaultValues: {
      nombre: centro?.nombre ?? '',
      direccion: centro?.direccion ?? '',
      latitud: centro ? String(centro.latitud) : '',
      longitud: centro ? String(centro.longitud) : '',
    },
    validators: { onSubmit: esquema },
    onSubmit: async ({ value }) => {
      const valores = esquema.parse(value)
      const datos = {
        nombre: valores.nombre,
        direccion: valores.direccion || null,
        latitud: Number(valores.latitud),
        longitud: Number(valores.longitud),
      }
      try {
        const guardado = centro
          ? await corregir.mutateAsync({ id: centro.id, datos })
          : await registrar.mutateAsync(datos)
        toast.show(centro ? 'Centro actualizado' : 'Centro registrado', {
          message: centro
            ? `Se guardaron los datos de ${guardado.nombre}.`
            : `${guardado.nombre} ya se ofrece como destino.`,
        })
        onCerrar()
      } catch (error) {
        toast.show('No se pudo guardar el centro', { message: mensajeDeError(error) })
      }
    },
  })

  return (
    <Dialog modal open onOpenChange={(abierto) => (abierto ? undefined : onCerrar())}>
      <Dialog.Portal>
        <Dialog.Overlay key="overlay" bg="$velo" transition="quick" enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} />
        <Dialog.Content
          key="content"
          width={540}
          maxW="94%"
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
              {centro ? 'Editar centro de salud' : 'Registrar centro de salud'}
            </Dialog.Title>
            <Dialog.Description color="$textoSecundario" fontSize={14} lineHeight={20}>
              {centro
                ? 'Lo que ya se entregó en este centro sigue apuntándolo con los datos nuevos.'
                : 'Queda activo: el paramédico y el ciudadano lo ven como destino desde ya.'}
            </Dialog.Description>
          </YStack>

          <Form gap={20} onSubmit={() => form.handleSubmit().catch(() => {})}>
            <YStack gap={16}>
              <form.Field name="nombre">
                {(field) => (
                  <YStack gap={6}>
                    <Label htmlFor="nombre-centro" color="$texto" fontSize={13} fontWeight="500">
                      Nombre
                    </Label>
                    <Input
                      id="nombre-centro"
                      size="$4"
                      placeholder="Ej.: Hospital de Niños Mario Ortiz"
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

              <form.Field name="direccion">
                {(field) => (
                  <YStack gap={6}>
                    <Label htmlFor="direccion-centro" color="$texto" fontSize={13} fontWeight="500">
                      Dirección (opcional)
                    </Label>
                    <Input
                      id="direccion-centro"
                      size="$4"
                      placeholder="Ej.: Av. Irala esq. Ejército Nacional"
                      value={field.state.value}
                      onChange={(evento) => field.handleChange(evento.currentTarget.value)}
                      onBlur={field.handleBlur}
                      borderColor={field.state.meta.isValid ? '$bordeFuerte' : '$primario'}
                    />
                    <MensajeDeCampo texto={textoDeErrores(field.state.meta.errors)} />
                  </YStack>
                )}
              </form.Field>

              <YStack gap={8}>
                <Label color="$texto" fontSize={13} fontWeight="500">
                  Ubicación: toca el mapa donde está la entrada del centro
                </Label>
                <form.Subscribe selector={(estado) => [estado.values.latitud, estado.values.longitud] as const}>
                  {([latitud, longitud]) => {
                    const lat = Number(latitud)
                    const lng = Number(longitud)
                    const punto =
                      latitud.trim() && longitud.trim() && Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null
                    return (
                      <SelectorDePunto
                        punto={punto}
                        onElegir={({ lat: nuevaLat, lng: nuevaLng }) => {
                          form.setFieldValue('latitud', nuevaLat.toFixed(6))
                          form.setFieldValue('longitud', nuevaLng.toFixed(6))
                        }}
                      />
                    )
                  }}
                </form.Subscribe>

                <XStack gap={12}>
                  {(['latitud', 'longitud'] as const).map((nombre) => (
                    <form.Field key={nombre} name={nombre}>
                      {(field) => (
                        <YStack gap={6} flex={1}>
                          <Label htmlFor={`${nombre}-centro`} color="$textoSecundario" fontSize={12} fontWeight="500">
                            {nombre === 'latitud' ? 'Latitud' : 'Longitud'}
                          </Label>
                          <Input
                            id={`${nombre}-centro`}
                            size="$3"
                            fontFamily="$mono"
                            inputMode="decimal"
                            placeholder={nombre === 'latitud' ? '-17.783300' : '-63.182100'}
                            value={field.state.value}
                            onChange={(evento) => field.handleChange(evento.currentTarget.value)}
                            onBlur={field.handleBlur}
                            borderColor={field.state.meta.isValid ? '$bordeFuerte' : '$primario'}
                          />
                          <MensajeDeCampo texto={textoDeErrores(field.state.meta.errors)} />
                        </YStack>
                      )}
                    </form.Field>
                  ))}
                </XStack>
              </YStack>
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
                    <Button.Text color="$primarioTexto">{centro ? 'Guardar' : 'Registrar'}</Button.Text>
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
