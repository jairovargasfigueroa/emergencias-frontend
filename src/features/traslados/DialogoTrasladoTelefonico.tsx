import { useForm } from '@tanstack/react-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useState, type ReactNode } from 'react'
import {
  Button,
  Dialog,
  Form,
  Input,
  Label,
  Paragraph,
  ScrollView,
  Spinner,
  Text,
  TextArea,
  XStack,
  YStack,
  useToastController,
} from 'tamagui'
import { z } from 'zod'
import { codigoDeError, mensajeDeError } from '../../shared/api/cliente'
import { BotonPrimario } from '../../shared/ui/botones'
import { MensajeDeCampo, textoDeErrores } from '../../shared/ui/EstadosDeCarga'
import { IconoAviso, IconoCheck } from '../../shared/ui/iconos'
import { OpcionElegible } from '../../shared/ui/OpcionElegible'
import { SelectorDePunto } from '../../shared/ui/SelectorDePunto'
import { centrosSaludQuery } from '../centros-salud/queries'
import type { Movilidad, RegistrarTrasladoCentral } from './api'
import { registrarTrasladoCentralMutation } from './queries'
import { TEXTO_ESTADO_TRASLADO, TEXTO_MOVILIDAD } from './textos'

const MOVILIDADES = ['CAMINA_CON_AYUDA', 'SILLA_DE_RUEDAS', 'CAMILLA'] as const

const punto = z.object({ lat: z.number(), lng: z.number() }).nullable()

const esquema = z
  .object({
    pasajeroNombre: z.string().trim().min(1, 'Escribe quién viaja.').max(255, 'El nombre es demasiado largo.'),
    pasajeroTelefono: z
      .string()
      .trim()
      .regex(/^\+?[0-9][0-9 -]{6,28}$/, 'Escribe un teléfono válido para devolver la llamada.'),
    movilidad: z.enum(MOVILIDADES, { message: 'Elige cómo se moviliza.' }),
    oxigeno: z.boolean(),
    equipo: z.boolean(),
    aislamiento: z.boolean(),
    pesoAproximado: z.string().trim().regex(/^([1-9]\d{0,2})?$/, 'En kilos, solo números.'),
    acompanantes: z.string().trim().regex(/^\d{1,2}$/, 'Cuántos van con el paciente: 0 si nadie.'),
    observaciones: z.string().trim().max(2000, 'Las observaciones son demasiado largas.'),
    origen: punto,
    origenReferencia: z.string().trim().max(255, 'La referencia es demasiado larga.'),
    contactoNombre: z.string().trim().max(255, 'El nombre es demasiado largo.'),
    contactoTelefono: z.string().trim().max(30, 'El teléfono es demasiado largo.'),
    destinoModo: z.enum(['CENTRO', 'OTRO']),
    centroSaludDestinoId: z.number().nullable(),
    destinoPunto: punto,
    destinoDetalle: z.string().trim().max(255, 'El detalle es demasiado largo.'),
    conCita: z.boolean(),
    horaCita: z.string(),
  })
  .superRefine((v, ctx) => {
    if (v.origen === null) {
      ctx.addIssue({ code: 'custom', path: ['origen'], message: 'Marca en el mapa dónde se lo busca.' })
    }
    if (v.destinoModo === 'CENTRO' && v.centroSaludDestinoId === null) {
      ctx.addIssue({ code: 'custom', path: ['centroSaludDestinoId'], message: 'Elige el centro al que va.' })
    }
    if (v.destinoModo === 'OTRO' && v.destinoPunto === null) {
      ctx.addIssue({ code: 'custom', path: ['destinoPunto'], message: 'Marca en el mapa adónde va.' })
    }
    if (Boolean(v.contactoNombre) !== Boolean(v.contactoTelefono)) {
      ctx.addIssue({
        code: 'custom',
        path: ['contactoTelefono'],
        message: 'Pon el nombre y el teléfono de quien lo recibe, o deja los dos vacíos.',
      })
    }
    if (v.conCita) {
      const cita = new Date(v.horaCita).getTime()
      if (!v.horaCita || Number.isNaN(cita)) {
        ctx.addIssue({ code: 'custom', path: ['horaCita'], message: 'Elige la fecha y la hora de la cita.' })
      } else if (cita <= Date.now()) {
        ctx.addIssue({ code: 'custom', path: ['horaCita'], message: 'Esa hora ya pasó.' })
      }
    }
  })

type Valores = z.infer<typeof esquema>

const VACIO: Valores = {
  pasajeroNombre: '',
  pasajeroTelefono: '',
  movilidad: '' as Movilidad,
  oxigeno: false,
  equipo: false,
  aislamiento: false,
  pesoAproximado: '',
  acompanantes: '0',
  observaciones: '',
  origen: null,
  origenReferencia: '',
  contactoNombre: '',
  contactoTelefono: '',
  destinoModo: 'CENTRO',
  centroSaludDestinoId: null,
  destinoPunto: null,
  destinoDetalle: '',
  conCita: false,
  horaCita: '',
}

function comoPedido(v: Valores, confirmarDuplicado: boolean): RegistrarTrasladoCentral {
  const otroLugar = v.destinoModo === 'OTRO'
  return {
    pasajeroNombre: v.pasajeroNombre,
    pasajeroTelefono: v.pasajeroTelefono,
    confirmarDuplicado,
    pedido: {
      movilidad: v.movilidad,
      oxigeno: v.oxigeno,
      equipo: v.equipo,
      aislamiento: v.aislamiento,
      pesoAproximado: v.pesoAproximado ? Number(v.pesoAproximado) : null,
      acompanantes: Number(v.acompanantes),
      observaciones: v.observaciones || null,
      tipoUnidad: null,
      origenLatitud: v.origen!.lat,
      origenLongitud: v.origen!.lng,
      origenReferencia: v.origenReferencia || null,
      contactoNombre: v.contactoNombre || null,
      contactoTelefono: v.contactoTelefono || null,
      centroSaludDestinoId: otroLugar ? null : v.centroSaludDestinoId,
      destinoLatitud: otroLugar ? v.destinoPunto!.lat : null,
      destinoLongitud: otroLugar ? v.destinoPunto!.lng : null,
      destinoDetalle: v.destinoDetalle || null,
      horaCita: v.conCita ? new Date(v.horaCita).toISOString() : null,
    },
  }
}

type Props = {
  abierto: boolean
  onCambiarAbierto: (abierto: boolean) => void
}

/**
 * PB-26: cargar un traslado que alguien pidió por teléfono. Pide lo mismo que la app, más quién viaja, que no tiene
 * cuenta. Si ese teléfono ya tiene un traslado vigente el mismo día, el backend avisa y se confirma acá.
 */
export function DialogoTrasladoTelefonico({ abierto, onCambiarAbierto }: Props) {
  const queryClient = useQueryClient()
  const toast = useToastController()
  const navigate = useNavigate()
  const registrar = useMutation(registrarTrasladoCentralMutation(queryClient))
  const centros = useQuery({ ...centrosSaludQuery(), enabled: abierto })
  /** El aviso del backend cuando el pedido se parece a otro vigente. Mientras está, enviar confirma que es otro. */
  const [posibleDuplicado, setPosibleDuplicado] = useState<string | null>(null)

  const form = useForm({
    defaultValues: VACIO,
    validators: { onSubmit: esquema },
    onSubmit: async ({ value, formApi }) => {
      try {
        const fila = await registrar.mutateAsync(comoPedido(esquema.parse(value), posibleDuplicado !== null))
        const { id, estado } = fila.traslado
        toast.show(`Traslado N.º ${id} registrado`, {
          message: `Quedó ${TEXTO_ESTADO_TRASLADO[estado].toLowerCase()} en la agenda.`,
        })
        formApi.reset()
        setPosibleDuplicado(null)
        onCambiarAbierto(false)
        navigate({ to: '/traslados/$trasladoId', params: { trasladoId: id } })
      } catch (error) {
        if (codigoDeError(error) === 'TRASLADO_POSIBLE_DUPLICADO') {
          setPosibleDuplicado(mensajeDeError(error))
          return
        }
        toast.show('No se pudo registrar el traslado', { message: mensajeDeError(error) })
      }
    },
  })

  function cambiarAbierto(siguiente: boolean) {
    if (!siguiente) {
      form.reset()
      setPosibleDuplicado(null)
    }
    onCambiarAbierto(siguiente)
  }

  return (
    <Dialog modal open={abierto} onOpenChange={cambiarAbierto}>
      <Dialog.Portal>
        <Dialog.Overlay key="overlay" bg="$velo" transition="quick" enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} />
        <Dialog.Content
          key="content"
          width={680}
          maxW="94%"
          maxH="92vh"
          p={0}
          rounded={14}
          bg="$superficie"
          borderWidth={1}
          borderColor="$borde"
          elevate
          transition="quick"
          enterStyle={{ opacity: 0, y: -12, scale: 0.97 }}
          exitStyle={{ opacity: 0, y: 8, scale: 0.97 }}
        >
          <YStack gap={6} px={24} pt={24} pb={16} borderBottomWidth={1} borderColor="$borde">
            <Dialog.Title color="$texto" fontSize={18} lineHeight={26} fontWeight="600">
              Traslado pedido por teléfono
            </Dialog.Title>
            <Dialog.Description color="$textoSecundario" fontSize={14} lineHeight={20}>
              Entra a la misma agenda y a la misma búsqueda de unidad que los pedidos de la app. Queda registrado que lo
              cargaste tú.
            </Dialog.Description>
          </YStack>

          <Form flex={1} minH={0} onSubmit={() => form.handleSubmit().catch(() => {})}>
            <ScrollView flex={1} contentContainerStyle={{ px: 24, py: 20, gap: 24 }}>
              <Bloque titulo="Quién viaja">
                <XStack gap={12} $max-sm={{ flexDirection: 'column' }}>
                  <form.Field name="pasajeroNombre">
                    {(field) => (
                      <Campo id="pasajero-nombre" etiqueta="Nombre del paciente" errores={field.state.meta.errors}>
                        <Input
                          id="pasajero-nombre"
                          size="$4"
                          autoFocus
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.currentTarget.value)}
                          onBlur={field.handleBlur}
                          borderColor={field.state.meta.isValid ? '$bordeFuerte' : '$primario'}
                        />
                      </Campo>
                    )}
                  </form.Field>
                  <form.Field name="pasajeroTelefono">
                    {(field) => (
                      <Campo id="pasajero-telefono" etiqueta="Teléfono para devolver la llamada" errores={field.state.meta.errors}>
                        <Input
                          id="pasajero-telefono"
                          size="$4"
                          fontFamily="$mono"
                          inputMode="tel"
                          placeholder="Ej.: 71234567"
                          value={field.state.value}
                          onChange={(e) => {
                            field.handleChange(e.currentTarget.value)
                            setPosibleDuplicado(null)
                          }}
                          onBlur={field.handleBlur}
                          borderColor={field.state.meta.isValid ? '$bordeFuerte' : '$primario'}
                        />
                      </Campo>
                    )}
                  </form.Field>
                </XStack>

                <form.Field name="movilidad">
                  {(field) => (
                    <YStack gap={6}>
                      <Etiqueta>Cómo se moviliza</Etiqueta>
                      <XStack role="radiogroup" aria-label="Cómo se moviliza" gap={8} $max-sm={{ flexDirection: 'column' }}>
                        {MOVILIDADES.map((movilidad) => (
                          <YStack key={movilidad} flex={1} $max-sm={{ flexBasis: 'auto' }}>
                            <OpcionElegible
                              titulo={TEXTO_MOVILIDAD[movilidad]}
                              elegida={field.state.value === movilidad}
                              onElegir={() => field.handleChange(movilidad)}
                            />
                          </YStack>
                        ))}
                      </XStack>
                      <MensajeDeCampo texto={textoDeErrores(field.state.meta.errors)} />
                    </YStack>
                  )}
                </form.Field>

                <YStack gap={6}>
                  <Etiqueta>Necesita</Etiqueta>
                  <XStack gap={8} flexWrap="wrap">
                    <form.Field name="oxigeno">
                      {(field) => <Casilla texto="Oxígeno" marcada={field.state.value} onCambiar={field.handleChange} />}
                    </form.Field>
                    <form.Field name="equipo">
                      {(field) => <Casilla texto="Equipo médico" marcada={field.state.value} onCambiar={field.handleChange} />}
                    </form.Field>
                    <form.Field name="aislamiento">
                      {(field) => <Casilla texto="Aislamiento" marcada={field.state.value} onCambiar={field.handleChange} />}
                    </form.Field>
                  </XStack>
                </YStack>

                <XStack gap={12}>
                  <form.Field name="acompanantes">
                    {(field) => (
                      <Campo id="acompanantes" etiqueta="Acompañantes" errores={field.state.meta.errors}>
                        <Input
                          id="acompanantes"
                          size="$4"
                          inputMode="numeric"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.currentTarget.value)}
                          onBlur={field.handleBlur}
                          borderColor={field.state.meta.isValid ? '$bordeFuerte' : '$primario'}
                        />
                      </Campo>
                    )}
                  </form.Field>
                  <form.Field name="pesoAproximado">
                    {(field) => (
                      <Campo id="peso" etiqueta="Peso aproximado en kg (opcional)" errores={field.state.meta.errors}>
                        <Input
                          id="peso"
                          size="$4"
                          inputMode="numeric"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.currentTarget.value)}
                          onBlur={field.handleBlur}
                          borderColor={field.state.meta.isValid ? '$bordeFuerte' : '$primario'}
                        />
                      </Campo>
                    )}
                  </form.Field>
                </XStack>

                <form.Field name="observaciones">
                  {(field) => (
                    <Campo id="observaciones" etiqueta="Observaciones (opcional)" errores={field.state.meta.errors}>
                      <TextArea
                        id="observaciones"
                        size="$4"
                        rows={2}
                        placeholder="Ej.: vive en un segundo piso sin ascensor"
                        value={field.state.value}
                        onChangeText={field.handleChange}
                        onBlur={field.handleBlur}
                        borderColor={field.state.meta.isValid ? '$bordeFuerte' : '$primario'}
                      />
                    </Campo>
                  )}
                </form.Field>
              </Bloque>

              <Bloque titulo="Dónde se lo busca">
                <form.Field name="origen">
                  {(field) => (
                    <YStack gap={6}>
                      <SelectorDePunto punto={field.state.value} onElegir={field.handleChange} titulo="Dónde se lo busca" />
                      <MensajeDeCampo texto={textoDeErrores(field.state.meta.errors)} />
                    </YStack>
                  )}
                </form.Field>
                <form.Field name="origenReferencia">
                  {(field) => (
                    <Campo id="referencia" etiqueta="Referencia (opcional)" errores={field.state.meta.errors}>
                      <Input
                        id="referencia"
                        size="$4"
                        placeholder="Ej.: casa verde frente a la farmacia, timbre 2"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.currentTarget.value)}
                        onBlur={field.handleBlur}
                      />
                    </Campo>
                  )}
                </form.Field>
                <XStack gap={12} $max-sm={{ flexDirection: 'column' }}>
                  <form.Field name="contactoNombre">
                    {(field) => (
                      <Campo id="contacto-nombre" etiqueta="Quién recibe a la ambulancia (opcional)" errores={field.state.meta.errors}>
                        <Input
                          id="contacto-nombre"
                          size="$4"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.currentTarget.value)}
                          onBlur={field.handleBlur}
                        />
                      </Campo>
                    )}
                  </form.Field>
                  <form.Field name="contactoTelefono">
                    {(field) => (
                      <Campo id="contacto-telefono" etiqueta="Su teléfono" errores={field.state.meta.errors}>
                        <Input
                          id="contacto-telefono"
                          size="$4"
                          fontFamily="$mono"
                          inputMode="tel"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.currentTarget.value)}
                          onBlur={field.handleBlur}
                          borderColor={field.state.meta.isValid ? '$bordeFuerte' : '$primario'}
                        />
                      </Campo>
                    )}
                  </form.Field>
                </XStack>
              </Bloque>

              <Bloque titulo="Adónde va">
                <form.Field name="destinoModo">
                  {(modo) => (
                    <YStack gap={10}>
                      {modo.state.value === 'CENTRO' ? (
                        <form.Field name="centroSaludDestinoId">
                          {(field) => (
                            <YStack gap={6}>
                              {centros.isPending ? (
                                <Paragraph fontSize={13} color="$textoSecundario">
                                  Cargando los centros de salud…
                                </Paragraph>
                              ) : (
                                <ScrollView maxH={220}>
                                  <YStack role="radiogroup" aria-label="Centro de destino" gap={6}>
                                    {(centros.data ?? []).map((centro) => (
                                      <OpcionElegible
                                        key={centro.id}
                                        titulo={centro.nombre}
                                        detalle={centro.direccion}
                                        elegida={field.state.value === centro.id}
                                        onElegir={() => field.handleChange(centro.id)}
                                      />
                                    ))}
                                  </YStack>
                                </ScrollView>
                              )}
                              <MensajeDeCampo texto={textoDeErrores(field.state.meta.errors)} />
                            </YStack>
                          )}
                        </form.Field>
                      ) : (
                        <form.Field name="destinoPunto">
                          {(field) => (
                            <YStack gap={6}>
                              <SelectorDePunto punto={field.state.value} onElegir={field.handleChange} titulo="Adónde va" />
                              <MensajeDeCampo texto={textoDeErrores(field.state.meta.errors)} />
                            </YStack>
                          )}
                        </form.Field>
                      )}
                      <Button
                        size="$3"
                        chromeless
                        self="flex-start"
                        onPress={() => modo.handleChange(modo.state.value === 'CENTRO' ? 'OTRO' : 'CENTRO')}
                      >
                        <Button.Text fontSize={13} color="$primarioPresionado" fontWeight="600">
                          {modo.state.value === 'CENTRO' ? 'No está en la lista: marcar en el mapa' : 'Elegir un centro de la lista'}
                        </Button.Text>
                      </Button>
                    </YStack>
                  )}
                </form.Field>
                <form.Field name="destinoDetalle">
                  {(field) => (
                    <Campo id="destino-detalle" etiqueta="Área o servicio (opcional)" errores={field.state.meta.errors}>
                      <Input
                        id="destino-detalle"
                        size="$4"
                        placeholder="Ej.: Hemodiálisis, planta baja"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.currentTarget.value)}
                        onBlur={field.handleBlur}
                      />
                    </Campo>
                  )}
                </form.Field>
              </Bloque>

              <Bloque titulo="Cuándo">
                <form.Field name="conCita">
                  {(conCita) => (
                    <YStack gap={10}>
                      <XStack role="radiogroup" aria-label="Cuándo" gap={8} $max-sm={{ flexDirection: 'column' }}>
                        <YStack flex={1} $max-sm={{ flexBasis: 'auto' }}>
                          <OpcionElegible
                            titulo="Lo antes posible"
                            detalle="La búsqueda de unidad empieza ya."
                            elegida={!conCita.state.value}
                            onElegir={() => conCita.handleChange(false)}
                          />
                        </YStack>
                        <YStack flex={1} $max-sm={{ flexBasis: 'auto' }}>
                          <OpcionElegible
                            titulo="Tiene una cita"
                            detalle="La unidad sale con tiempo para llegar a esa hora."
                            elegida={conCita.state.value}
                            onElegir={() => conCita.handleChange(true)}
                          />
                        </YStack>
                      </XStack>
                      {conCita.state.value ? (
                        <form.Field name="horaCita">
                          {(field) => (
                            <Campo id="hora-cita" etiqueta="Fecha y hora de la cita" errores={field.state.meta.errors}>
                              <input
                                id="hora-cita"
                                type="datetime-local"
                                value={field.state.value}
                                onChange={(e) => field.handleChange(e.currentTarget.value)}
                                onBlur={field.handleBlur}
                                style={{
                                  height: 44,
                                  padding: '0 12px',
                                  borderRadius: 8,
                                  border: `1px solid ${field.state.meta.isValid ? 'var(--bordeFuerte)' : 'var(--primario)'}`,
                                  background: 'var(--superficie)',
                                  color: 'var(--texto)',
                                  font: 'inherit',
                                  fontSize: 14,
                                }}
                              />
                            </Campo>
                          )}
                        </form.Field>
                      ) : null}
                    </YStack>
                  )}
                </form.Field>
              </Bloque>
            </ScrollView>

            <YStack gap={12} px={24} py={16} borderTopWidth={1} borderColor="$borde">
              {posibleDuplicado ? (
                <XStack role="alert" gap={10} p={12} rounded={10} bg="$enAtencionTinte" items="flex-start">
                  <IconoAviso size={18} color="var(--enAtencionTexto)" />
                  <Paragraph flex={1} fontSize={13} lineHeight={18} color="$enAtencionTexto">
                    {posibleDuplicado}
                  </Paragraph>
                </XStack>
              ) : null}
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
                      <Button.Text color="$primarioTexto">
                        {posibleDuplicado ? 'Es otro viaje: registrar igual' : 'Registrar traslado'}
                      </Button.Text>
                    </BotonPrimario>
                  </XStack>
                )}
              </form.Subscribe>
            </YStack>
          </Form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}

function Bloque({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <YStack gap={14}>
      <Text fontSize={13} fontWeight="700" color="$textoSecundario" textTransform="uppercase" letterSpacing={0.6}>
        {titulo}
      </Text>
      {children}
    </YStack>
  )
}

function Etiqueta({ children }: { children: ReactNode }) {
  return (
    <Text color="$texto" fontSize={13} fontWeight="500">
      {children}
    </Text>
  )
}

function Campo({
  id,
  etiqueta,
  errores,
  children,
}: {
  id: string
  etiqueta: string
  errores: unknown[]
  children: ReactNode
}) {
  return (
    <YStack gap={6} flex={1} $max-sm={{ flexBasis: 'auto' }}>
      <Label htmlFor={id} color="$texto" fontSize={13} fontWeight="500">
        {etiqueta}
      </Label>
      {children}
      <MensajeDeCampo texto={textoDeErrores(errores)} />
    </YStack>
  )
}

/** Una casilla que se marca y desmarca. Se arma igual que `OpcionElegible`, con su rol de accesibilidad. */
function Casilla({ texto, marcada, onCambiar }: { texto: string; marcada: boolean; onCambiar: (marcada: boolean) => void }) {
  return (
    <XStack
      role="checkbox"
      aria-checked={marcada}
      tabIndex={0}
      items="center"
      gap={8}
      px={12}
      height={36}
      rounded={8}
      cursor="pointer"
      borderWidth={1}
      borderColor={marcada ? '$primario' : '$borde'}
      bg={marcada ? '$primarioTinte' : 'transparent'}
      hoverStyle={{ borderColor: marcada ? '$primario' : '$bordeFuerte' }}
      onPress={() => onCambiar(!marcada)}
      onKeyDown={(evento: { key: string; preventDefault: () => void }) => {
        if (evento.key === ' ' || evento.key === 'Enter') {
          evento.preventDefault()
          onCambiar(!marcada)
        }
      }}
    >
      <YStack
        width={16}
        height={16}
        rounded={4}
        borderWidth={1.5}
        borderColor={marcada ? '$primario' : '$bordeFuerte'}
        bg={marcada ? '$primario' : 'transparent'}
        items="center"
        justify="center"
      >
        {marcada ? <IconoCheck size={12} color="#FFFFFF" /> : null}
      </YStack>
      <Text fontSize={13} fontWeight="500" color="$texto">
        {texto}
      </Text>
    </XStack>
  )
}
