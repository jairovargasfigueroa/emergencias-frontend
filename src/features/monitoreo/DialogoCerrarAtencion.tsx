import { useForm } from '@tanstack/react-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Button,
  Dialog,
  Input,
  Label,
  Paragraph,
  ScrollView,
  Spinner,
  Text,
  XStack,
  YStack,
  useToastController,
} from 'tamagui'
import { z } from 'zod'
import { codigoDeError, mensajeDeError } from '../../shared/api/cliente'
import { TEXTO_ESTADO_ATENCION } from '../../shared/atencion/textos'
import { BotonPrimario } from '../../shared/ui/botones'
import { MensajeDeCampo, textoDeErrores } from '../../shared/ui/EstadosDeCarga'
import { OpcionElegible } from '../../shared/ui/OpcionElegible'
import { centrosSaludQuery } from '../centros-salud/queries'
import type { AtencionEnCurso, CerrarAtencion, CierreDesdeLaCentral, OrigenAtencion } from './api'
import { cerrarAtencionMutation } from './queries'
import { TEXTO_ORIGEN } from './textos'

/** Sin centro ni destino escrito, la atención se queda con el destino que ya tenía. */
const DESTINO_QUE_TENIA = 'que-tenia'

/** Un destino que no está en el catálogo, escrito a mano. */
const OTRO_DESTINO = 'otro'

const esquema = z
  .object({
    destino: z.string(),
    descripcion: z.string().trim().max(255, 'El destino es demasiado largo.'),
    dejarDisponible: z.boolean(),
  })
  .refine((valores) => valores.destino !== OTRO_DESTINO || valores.descripcion.length > 0, {
    message: 'Escribe dónde lo entregó.',
    path: ['descripcion'],
  })

/** El nombre de cada cierre, que es también su botón, y el aviso que queda al terminar. */
const ACCION: Record<CierreDesdeLaCentral, { nombre: string; hecho: string }> = {
  CANCELAR: { nombre: 'Cancelar la atención', hecho: 'Atención cancelada' },
  DAR_POR_ENTREGADA: { nombre: 'Dar por entregada', hecho: 'Atención dada por entregada' },
  LIBERAR: { nombre: 'Liberar la unidad', hecho: 'Unidad liberada' },
}

type Props = {
  atencion: AtencionEnCurso
  /** El que corresponde al estado en que estaba la atención al abrir el diálogo. */
  cierre: CierreDesdeLaCentral
  placa: string
  onCerrar: () => void
}

/**
 * Cerrar desde la central una atención que la tripulación no puede cerrar —se quedó sin batería o sin señal—, como
 * hace un despachador después de hablar con ella por otro medio. Se ofrece solo lo que corresponde a dónde quedó:
 * cancelarla si todavía no tenía al paciente, darla por entregada si lo llevaba a bordo, o liberar la unidad si ya
 * había resuelto. Por defecto la unidad queda fuera de servicio: a una unidad con la que no se habla no hay que
 * mandarle otro trabajo.
 *
 * Se monta solo al abrirlo, así el formulario siempre arranca con las opciones por defecto.
 */
export function DialogoCerrarAtencion({ atencion, cierre, placa, onCerrar }: Props) {
  const queryClient = useQueryClient()
  const toast = useToastController()
  const cerrar = useMutation(cerrarAtencionMutation(queryClient))
  // El catálogo solo hace falta para decir dónde se entregó.
  const centros = useQuery({ ...centrosSaludQuery(), enabled: cierre === 'DAR_POR_ENTREGADA' })

  const form = useForm({
    defaultValues: { destino: DESTINO_QUE_TENIA, descripcion: '', dejarDisponible: false },
    validators: { onSubmit: esquema },
    onSubmit: async ({ value }) => {
      const { destino, descripcion, dejarDisponible } = esquema.parse(value)
      const entregada = cierre === 'DAR_POR_ENTREGADA'
      const datos: CerrarAtencion = {
        cierre,
        dejarDisponible,
        centroSaludId:
          entregada && destino !== DESTINO_QUE_TENIA && destino !== OTRO_DESTINO ? Number(destino) : null,
        destinoDescripcion: entregada && destino === OTRO_DESTINO ? descripcion : null,
      }
      try {
        await cerrar.mutateAsync({ atencionId: atencion.id, datos })
        toast.show(ACCION[cierre].hecho, {
          message: dejarDisponible
            ? `${placa} quedó disponible.`
            : `${placa} quedó fuera de servicio hasta que la tripulación la reactive.`,
        })
        onCerrar()
      } catch (error) {
        toast.show('No se pudo cerrar la atención', { message: mensajeDeError(error) })
        // La atención ya no está como se la vio: la tripulación la movió o alguien más la cerró. Lo que se eligió
        // acá ya no aplica; la pantalla se recarga y, si hace falta, se vuelve a abrir con lo que corresponda.
        if (codigoDeError(error) === 'TRANSICION_INVALIDA') {
          onCerrar()
        }
      }
    },
  })

  const trabajo = `${TEXTO_ORIGEN[atencion.origen]} #${atencion.incidenteId ?? atencion.trasladoId}`
  const queTenia =
    atencion.origen === 'TRASLADO'
      ? { titulo: 'El destino del traslado', detalle: 'El que se pidió al programarlo.' }
      : { titulo: 'Sin indicar', detalle: 'No se registra dónde lo entregó.' }

  return (
    <Dialog modal open onOpenChange={(abierto) => (abierto ? undefined : onCerrar())}>
      <Dialog.Portal>
        <Dialog.Overlay key="overlay" bg="$velo" transition="quick" enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} />
        <Dialog.Content
          key="content"
          width={480}
          maxW="92%"
          // Con el catálogo de centros, el diálogo puede quedar más alto que la ventana: se acota y lo del medio
          // scrollea, así el título y los botones siempre se ven.
          maxH="90vh"
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
              Cerrar la atención de {placa}
            </Dialog.Title>
            <Dialog.Description color="$textoSecundario" fontSize={14} lineHeight={20} numberOfLines={2}>
              {trabajo}
              {atencion.etiqueta ? ` · ${atencion.etiqueta}` : ''} · {TEXTO_ESTADO_ATENCION[atencion.estado]}
            </Dialog.Description>
          </YStack>

          <ScrollView shrink={1}>
            <YStack gap={16}>
              <XStack px={12} py={10} rounded={10} bg="$enAtencionTinte">
                <Paragraph fontSize={13} lineHeight={19} color="$enAtencionTexto">
                  Es para cuando la tripulación no puede cerrarla desde su app, por ejemplo porque se quedó sin batería
                  o sin señal. Queda registrado que la cerraste tú.
                </Paragraph>
              </XStack>

              <YStack gap={4}>
                <Text fontSize={14} fontWeight="600" color="$texto">
                  {ACCION[cierre].nombre}
                </Text>
                <Paragraph fontSize={13} lineHeight={19} color="$textoSecundario">
                  {explicacion(cierre, atencion.origen)}
                </Paragraph>
              </YStack>

              {cierre === 'DAR_POR_ENTREGADA' ? (
                <form.Field name="destino">
                  {(campo) => (
                    <YStack gap={8}>
                      <Label color="$texto" fontSize={13} fontWeight="500">
                        ¿Dónde lo entregó?
                      </Label>
                      <YStack role="radiogroup" aria-label="Dónde lo entregó" gap={6}>
                        <OpcionElegible
                          titulo={queTenia.titulo}
                          detalle={queTenia.detalle}
                          elegida={campo.state.value === DESTINO_QUE_TENIA}
                          onElegir={() => campo.handleChange(DESTINO_QUE_TENIA)}
                        />
                        {(centros.data ?? []).map((centro) => (
                          <OpcionElegible
                            key={centro.id}
                            titulo={centro.nombre}
                            detalle={centro.direccion}
                            elegida={campo.state.value === String(centro.id)}
                            onElegir={() => campo.handleChange(String(centro.id))}
                          />
                        ))}
                        <OpcionElegible
                          titulo="Otro destino"
                          detalle="Uno que no está en la lista: lo escribes."
                          elegida={campo.state.value === OTRO_DESTINO}
                          onElegir={() => campo.handleChange(OTRO_DESTINO)}
                        />
                      </YStack>

                      {/* El catálogo es una ayuda: sin él se puede dar por entregada igual, escribiendo el destino. */}
                      {centros.isPending ? (
                        <XStack items="center" gap={8}>
                          <Spinner size="small" color="$textoSecundario" />
                          <Text fontSize={12} color="$textoSecundario">
                            Cargando los centros de salud…
                          </Text>
                        </XStack>
                      ) : centros.isError ? (
                        <Text fontSize={12} lineHeight={16} color="$textoSecundario">
                          No se pudieron cargar los centros de salud: puedes escribir el destino.
                        </Text>
                      ) : null}

                      {campo.state.value === OTRO_DESTINO ? (
                        <form.Field name="descripcion">
                          {(descripcion) => (
                            <YStack gap={6}>
                              <Input
                                size="$4"
                                autoFocus
                                aria-label="Destino de la entrega"
                                placeholder="Ej.: casa del paciente"
                                value={descripcion.state.value}
                                onChange={(evento) => descripcion.handleChange(evento.currentTarget.value)}
                                onBlur={descripcion.handleBlur}
                                borderColor={descripcion.state.meta.isValid ? '$bordeFuerte' : '$primario'}
                              />
                              <MensajeDeCampo texto={textoDeErrores(descripcion.state.meta.errors)} />
                            </YStack>
                          )}
                        </form.Field>
                      ) : null}
                    </YStack>
                  )}
                </form.Field>
              ) : null}

              <form.Field name="dejarDisponible">
                {(campo) => (
                  <YStack gap={8}>
                    <Label color="$texto" fontSize={13} fontWeight="500">
                      ¿Cómo queda la unidad?
                    </Label>
                    <YStack role="radiogroup" aria-label="Cómo queda la unidad" gap={6}>
                      <OpcionElegible
                        titulo="Fuera de servicio hasta que la tripulación la reactive"
                        detalle="No se le manda nada hasta que la tripulación la vuelva a poner en servicio desde su app."
                        elegida={!campo.state.value}
                        onElegir={() => campo.handleChange(false)}
                      />
                      <OpcionElegible
                        titulo="Disponible (ya hablaste con la tripulación)"
                        detalle="Puede recibir otro trabajo apenas la cierres."
                        elegida={campo.state.value}
                        onElegir={() => campo.handleChange(true)}
                      />
                    </YStack>
                  </YStack>
                )}
              </form.Field>
            </YStack>
          </ScrollView>

          <form.Subscribe selector={(estado) => [estado.isSubmitting] as const}>
            {([enviando]) => (
              <XStack gap={8} justify="flex-end">
                {/* "Volver" y no "Cancelar": al lado de "Cancelar la atención" se leerían como la misma cosa. */}
                <Button size="$4" variant="outlined" disabled={enviando} onPress={onCerrar}>
                  Volver
                </Button>
                {/* Sin `Form` a propósito: un Enter en el destino no tiene que cerrar de golpe algo sin vuelta atrás. */}
                <BotonPrimario
                  size="$4"
                  disabled={enviando}
                  opacity={enviando ? 0.6 : 1}
                  icon={enviando ? <Spinner size="small" color="$primarioTexto" /> : undefined}
                  onPress={() => {
                    form.handleSubmit().catch(() => {})
                  }}
                >
                  <Button.Text color="$primarioTexto">{ACCION[cierre].nombre}</Button.Text>
                </BotonPrimario>
              </XStack>
            )}
          </form.Subscribe>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}

/** Qué va a pasar, en una o dos líneas. Depende de si la unidad venía de un incidente o de un traslado. */
function explicacion(cierre: CierreDesdeLaCentral, origen: OrigenAtencion) {
  switch (cierre) {
    case 'CANCELAR':
      return origen === 'TRASLADO'
        ? 'Todavía no tiene al paciente: la unidad deja el traslado, que vuelve a buscar unidad primero en la fila.'
        : 'Todavía no tiene al paciente: la unidad deja el caso. Si nadie más lo atiende, el incidente vuelve a buscar unidad, o se cancela si ya nadie la pide.'
    case 'DAR_POR_ENTREGADA':
      return origen === 'TRASLADO'
        ? 'Llevaba al paciente a bordo: se registra la entrega con la hora de ahora y el traslado queda completado.'
        : 'Llevaba al paciente a bordo: se registra la entrega con la hora de ahora, en el destino que elijas.'
    case 'LIBERAR':
      return 'Ya había resuelto el caso: solo le faltaba marcar que quedó libre.'
  }
}
