import { useForm } from '@tanstack/react-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Button, Dialog, Input, Label, Spinner, Text, XStack, YStack, useToastController } from 'tamagui'
import { z } from 'zod'
import { mensajeDeError } from '../../shared/api/cliente'
import { comoDia, fechaHoraCorta } from '../../shared/formato/fechas'
import { BotonPrimario } from '../../shared/ui/botones'
import { EncabezadoPagina } from '../../shared/ui/EncabezadoPagina'
import { Cargando, ErrorAlCargar, MensajeDeCampo, textoDeErrores } from '../../shared/ui/EstadosDeCarga'
import { IconoMas } from '../../shared/ui/iconos'
import { OpcionElegible } from '../../shared/ui/OpcionElegible'
import { FilaTabla, Tabla, TablaVacia, type ColumnaTabla } from '../../shared/ui/Tabla'
import type { Tarifa, TipoServicio } from './api'
import { registrarTarifaMutation, tarifasQuery } from './queries'
import { bolivianos, TEXTO_TIPO_SERVICIO } from './textos'

const COLUMNAS: ColumnaTabla[] = [
  { titulo: 'Servicio', ancho: 140 },
  { titulo: 'Monto', ancho: 150, alinearDerecha: true },
  { titulo: 'Rige desde', ancho: 140 },
  { titulo: 'Registró' },
  { titulo: 'Cuándo', ancho: 150, ocultarEnPantallaChica: true },
]

/** PB-29: tarifas de referencia por tipo de servicio, con su vigencia y su historial. */
export function TarifasPage() {
  const tarifas = useQuery(tarifasQuery())
  const [nueva, setNueva] = useState(false)

  return (
    <>
      <EncabezadoPagina
        titulo="Tarifas"
        descripcion="Lo que se cobra de referencia por cada tipo de servicio. Una tarifa nueva rige desde su día; las anteriores quedan en el historial."
        accion={
          <BotonPrimario size="$4" icon={<IconoMas size={16} color="#FFFFFF" />} onPress={() => setNueva(true)}>
            <Button.Text color="$primarioTexto">Nueva tarifa</Button.Text>
          </BotonPrimario>
        }
      />

      {tarifas.isPending ? (
        <Cargando texto="Cargando las tarifas…" />
      ) : tarifas.isError ? (
        <ErrorAlCargar error={tarifas.error} onReintentar={() => tarifas.refetch()} />
      ) : (
        <YStack gap={16}>
          <XStack gap={12} flexWrap="wrap">
            <Vigente tipo="EMERGENCIA" tarifa={tarifas.data.emergencia} />
            <Vigente tipo="TRASLADO" tarifa={tarifas.data.traslado} />
          </XStack>
          <Tabla columnas={COLUMNAS}>
            {tarifas.data.historial.length === 0 ? (
              <TablaVacia>Todavía no se cargó ninguna tarifa.</TablaVacia>
            ) : (
              tarifas.data.historial.map((tarifa) => (
                <FilaTabla key={tarifa.id} columnas={COLUMNAS} alto={48}>
                  <Text fontSize={14} color="$texto">
                    {TEXTO_TIPO_SERVICIO[tarifa.tipoServicio]}
                  </Text>
                  <Text fontFamily="$mono" fontSize={14} color="$texto" text="right">
                    {bolivianos(tarifa.monto)}
                  </Text>
                  <Text fontFamily="$mono" fontSize={13} color="$texto">
                    {tarifa.vigenteDesde}
                  </Text>
                  <Text fontSize={14} color="$texto" numberOfLines={1}>
                    {tarifa.registradaPor}
                  </Text>
                  <Text fontSize={13} color="$textoSecundario">
                    {fechaHoraCorta(tarifa.fechaRegistro)}
                  </Text>
                </FilaTabla>
              ))
            )}
          </Tabla>
        </YStack>
      )}

      {nueva ? <DialogoNuevaTarifa onCerrar={() => setNueva(false)} /> : null}
    </>
  )
}

function Vigente({ tipo, tarifa }: { tipo: TipoServicio; tarifa: Tarifa | null }) {
  return (
    <YStack flex={1} minW={220} gap={4} p={16} rounded={12} bg="$superficie" borderWidth={1} borderColor="$borde">
      <Text fontSize={12} fontWeight="500" color="$textoSecundario">
        {TEXTO_TIPO_SERVICIO[tipo]}, hoy
      </Text>
      <Text fontSize={26} lineHeight={32} fontWeight="700" color={tarifa ? '$texto' : '$textoTenue'}>
        {tarifa ? bolivianos(tarifa.monto) : 'Sin tarifa'}
      </Text>
      <Text fontSize={12} color="$textoSecundario">
        {tarifa ? `Desde el ${tarifa.vigenteDesde}` : 'Carga una para tenerla de referencia al cobrar.'}
      </Text>
    </YStack>
  )
}

const esquema = z.object({
  tipoServicio: z.enum(['EMERGENCIA', 'TRASLADO'], { message: 'Elige el tipo de servicio.' }),
  monto: z
    .string()
    .trim()
    .regex(/^\d{1,8}([.,]\d{1,2})?$/, 'Escribe el monto en bolivianos, con dos decimales como mucho.'),
  vigenteDesde: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Elige desde qué día rige.'),
})

function DialogoNuevaTarifa({ onCerrar }: { onCerrar: () => void }) {
  const queryClient = useQueryClient()
  const toast = useToastController()
  const registrar = useMutation(registrarTarifaMutation(queryClient))

  const form = useForm({
    defaultValues: { tipoServicio: '' as TipoServicio, monto: '', vigenteDesde: comoDia(new Date()) },
    validators: { onSubmit: esquema },
    onSubmit: async ({ value }) => {
      const v = esquema.parse(value)
      const monto = Number(v.monto.replace(',', '.'))
      try {
        await registrar.mutateAsync({ tipoServicio: v.tipoServicio, monto, vigenteDesde: v.vigenteDesde })
        toast.show('Tarifa registrada', {
          message: `${TEXTO_TIPO_SERVICIO[v.tipoServicio]}: ${bolivianos(monto)} desde el ${v.vigenteDesde}.`,
        })
        onCerrar()
      } catch (error) {
        toast.show('No se pudo registrar la tarifa', { message: mensajeDeError(error) })
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
              Nueva tarifa de referencia
            </Dialog.Title>
            <Dialog.Description color="$textoSecundario" fontSize={14} lineHeight={20}>
              No reemplaza a la anterior: rige desde el día que elijas y la otra queda en el historial.
            </Dialog.Description>
          </YStack>

          <form.Field name="tipoServicio">
            {(campo) => (
              <YStack gap={6}>
                <Label color="$texto" fontSize={13} fontWeight="500">
                  Servicio
                </Label>
                <XStack role="radiogroup" aria-label="Servicio" gap={8}>
                  {(['EMERGENCIA', 'TRASLADO'] as const).map((tipo) => (
                    <YStack key={tipo} flex={1}>
                      <OpcionElegible
                        titulo={TEXTO_TIPO_SERVICIO[tipo]}
                        elegida={campo.state.value === tipo}
                        onElegir={() => campo.handleChange(tipo)}
                      />
                    </YStack>
                  ))}
                </XStack>
                <MensajeDeCampo texto={textoDeErrores(campo.state.meta.errors)} />
              </YStack>
            )}
          </form.Field>

          <XStack gap={12} items="flex-start">
            <form.Field name="monto">
              {(campo) => (
                <YStack gap={6} flex={1}>
                  <Label htmlFor="monto-tarifa" color="$texto" fontSize={13} fontWeight="500">
                    Monto (Bs)
                  </Label>
                  <Input
                    id="monto-tarifa"
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
            <form.Field name="vigenteDesde">
              {(campo) => (
                <YStack gap={6} flex={1}>
                  <Label htmlFor="vigente-desde" color="$texto" fontSize={13} fontWeight="500">
                    Rige desde
                  </Label>
                  <input
                    id="vigente-desde"
                    type="date"
                    value={campo.state.value}
                    onChange={(e) => campo.handleChange(e.currentTarget.value)}
                    style={{
                      height: 44,
                      padding: '0 10px',
                      borderRadius: 8,
                      border: '1px solid var(--bordeFuerte)',
                      background: 'var(--superficie)',
                      color: 'var(--texto)',
                      font: 'inherit',
                      fontSize: 14,
                    }}
                  />
                  <MensajeDeCampo texto={textoDeErrores(campo.state.meta.errors)} />
                </YStack>
              )}
            </form.Field>
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
                  <Button.Text color="$primarioTexto">Registrar</Button.Text>
                </BotonPrimario>
              </XStack>
            )}
          </form.Subscribe>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
