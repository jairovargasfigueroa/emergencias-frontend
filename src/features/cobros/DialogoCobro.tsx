import { useForm } from '@tanstack/react-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Dialog, Input, Label, Paragraph, Spinner, TextArea, XStack, YStack, useToastController } from 'tamagui'
import { z } from 'zod'
import { mensajeDeError } from '../../shared/api/cliente'
import { BotonPrimario } from '../../shared/ui/botones'
import { MensajeDeCampo, textoDeErrores } from '../../shared/ui/EstadosDeCarga'
import { OpcionElegible } from '../../shared/ui/OpcionElegible'
import { ESTADOS_ELEGIBLES, MODALIDADES_PAGO, type CobroDeServicio, type ModalidadPago } from './api'
import { ajustarCobroMutation, registrarCobroMutation } from './queries'
import { bolivianos, DETALLE_MODALIDAD, TEXTO_ESTADO_COBRO, TEXTO_MODALIDAD } from './textos'

function esquemaPara(ajustando: boolean) {
  return z.object({
    modalidad: z.enum(MODALIDADES_PAGO, { message: 'Elige quién paga.' }),
    importe: z
      .string()
      .trim()
      .regex(/^\d{1,8}([.,]\d{1,2})?$/, 'Escribe el importe en bolivianos, con dos decimales como mucho.'),
    estado: z.enum(ESTADOS_ELEGIBLES, { message: 'Elige el estado.' }),
    motivo: ajustando
      ? z.string().trim().min(1, 'Escribe por qué se corrige: queda en el historial.').max(1000, 'Demasiado largo.')
      : z.string(),
  })
}

type Props = {
  servicio: CobroDeServicio
  onCerrar: () => void
}

/**
 * PB-29: registrar el cobro de un servicio terminado o, si ya lo tiene, ajustarlo. El ajuste pide motivo, y el
 * backend guarda lo que había. Se monta solo al abrirlo.
 */
export function DialogoCobro({ servicio, onCerrar }: Props) {
  const queryClient = useQueryClient()
  const toast = useToastController()
  const registrar = useMutation(registrarCobroMutation(queryClient))
  const ajustar = useMutation(ajustarCobroMutation(queryClient))
  const { cobro, tarifaDeReferencia } = servicio
  const ajustando = cobro !== null
  const esquema = esquemaPara(ajustando)

  const form = useForm({
    defaultValues: {
      modalidad: (cobro?.modalidad ?? '') as ModalidadPago,
      importe: cobro ? String(cobro.importe) : tarifaDeReferencia ? String(tarifaDeReferencia.monto) : '',
      estado: (cobro?.estado === 'PAGADO' ? 'PAGADO' : 'PENDIENTE') as 'PENDIENTE' | 'PAGADO',
      motivo: '',
    },
    validators: { onSubmit: esquema },
    onSubmit: async ({ value }) => {
      const v = esquema.parse(value)
      const datos = { modalidad: v.modalidad, importe: Number(v.importe.replace(',', '.')), estado: v.estado }
      try {
        if (cobro) {
          await ajustar.mutateAsync({ cobroId: cobro.id, datos: { ...datos, motivo: v.motivo } })
        } else {
          await registrar.mutateAsync({ atencionId: servicio.atencionId, datos })
        }
        toast.show(ajustando ? 'Cobro ajustado' : 'Cobro registrado', {
          message: `${bolivianos(datos.importe)} · ${TEXTO_ESTADO_COBRO[datos.estado].toLowerCase()}.`,
        })
        onCerrar()
      } catch (error) {
        toast.show('No se pudo guardar el cobro', { message: mensajeDeError(error) })
      }
    },
  })

  return (
    <Dialog modal open onOpenChange={(abierto) => (abierto ? undefined : onCerrar())}>
      <Dialog.Portal>
        <Dialog.Overlay key="overlay" bg="$velo" transition="quick" enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} />
        <Dialog.Content
          key="content"
          width={500}
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
              {ajustando ? 'Ajustar el cobro' : 'Registrar el cobro'}
            </Dialog.Title>
            <Dialog.Description color="$textoSecundario" fontSize={14} lineHeight={20}>
              {tarifaDeReferencia
                ? `Tarifa de referencia del día del servicio: ${bolivianos(tarifaDeReferencia.monto)}.`
                : 'No había tarifa de referencia cargada para el día del servicio.'}{' '}
              El cobro no cambia cómo terminó el servicio.
            </Dialog.Description>
          </YStack>

          <form.Field name="modalidad">
            {(campo) => (
              <YStack gap={6}>
                <Label color="$texto" fontSize={13} fontWeight="500">
                  Quién paga
                </Label>
                <YStack role="radiogroup" aria-label="Quién paga" gap={6}>
                  {MODALIDADES_PAGO.map((modalidad) => (
                    <OpcionElegible
                      key={modalidad}
                      titulo={TEXTO_MODALIDAD[modalidad]}
                      detalle={DETALLE_MODALIDAD[modalidad]}
                      elegida={campo.state.value === modalidad}
                      onElegir={() => campo.handleChange(modalidad)}
                    />
                  ))}
                </YStack>
                <MensajeDeCampo texto={textoDeErrores(campo.state.meta.errors)} />
              </YStack>
            )}
          </form.Field>

          <XStack gap={12} items="flex-start">
            <form.Field name="importe">
              {(campo) => (
                <YStack gap={6} flex={1}>
                  <Label htmlFor="importe" color="$texto" fontSize={13} fontWeight="500">
                    Importe (Bs)
                  </Label>
                  <Input
                    id="importe"
                    size="$4"
                    fontFamily="$mono"
                    inputMode="decimal"
                    value={campo.state.value}
                    onChange={(e) => campo.handleChange(e.currentTarget.value)}
                    onBlur={campo.handleBlur}
                    borderColor={campo.state.meta.isValid ? '$bordeFuerte' : '$primario'}
                  />
                  <MensajeDeCampo texto={textoDeErrores(campo.state.meta.errors)} />
                </YStack>
              )}
            </form.Field>
            <form.Field name="estado">
              {(campo) => (
                <YStack gap={6} flex={1}>
                  <Label color="$texto" fontSize={13} fontWeight="500">
                    Estado
                  </Label>
                  <YStack role="radiogroup" aria-label="Estado del cobro" gap={6}>
                    {ESTADOS_ELEGIBLES.map((estado) => (
                      <OpcionElegible
                        key={estado}
                        titulo={TEXTO_ESTADO_COBRO[estado]}
                        elegida={campo.state.value === estado}
                        onElegir={() => campo.handleChange(estado)}
                      />
                    ))}
                  </YStack>
                </YStack>
              )}
            </form.Field>
          </XStack>

          {ajustando ? (
            <form.Field name="motivo">
              {(campo) => (
                <YStack gap={6}>
                  <Label htmlFor="motivo-ajuste" color="$texto" fontSize={13} fontWeight="500">
                    Motivo del ajuste
                  </Label>
                  <TextArea
                    id="motivo-ajuste"
                    size="$4"
                    rows={2}
                    placeholder="Ej.: el seguro reconoció un importe menor"
                    value={campo.state.value}
                    onChangeText={campo.handleChange}
                    onBlur={campo.handleBlur}
                    borderColor={campo.state.meta.isValid ? '$bordeFuerte' : '$primario'}
                  />
                  <Paragraph fontSize={12} color="$textoSecundario">
                    Queda guardado lo que había, con el motivo, la fecha y tu nombre.
                  </Paragraph>
                  <MensajeDeCampo texto={textoDeErrores(campo.state.meta.errors)} />
                </YStack>
              )}
            </form.Field>
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
                  <Button.Text color="$primarioTexto">{ajustando ? 'Guardar el ajuste' : 'Registrar'}</Button.Text>
                </BotonPrimario>
              </XStack>
            )}
          </form.Subscribe>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
