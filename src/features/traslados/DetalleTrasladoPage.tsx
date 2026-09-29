import { useQuery } from '@tanstack/react-query'
import { getRouteApi, Link } from '@tanstack/react-router'
import { useState, type ReactNode } from 'react'
import { Button, H2, Paragraph, Spinner, Text, XStack, YStack } from 'tamagui'
import { ErrorApi } from '../../shared/api/cliente'
import { InsigniaEstadoAtencion } from '../../shared/atencion/InsigniaEstadoAtencion'
import { TEXTO_MOTIVO_SIN_TRASLADO } from '../../shared/atencion/textos'
import { fechaHora, fechaHoraCorta, hora } from '../../shared/formato/fechas'
import { useAhora } from '../../shared/reloj/useAhora'
import { BotonPrimario } from '../../shared/ui/botones'
import { EncabezadoPagina } from '../../shared/ui/EncabezadoPagina'
import { Cargando, ErrorAlCargar } from '../../shared/ui/EstadosDeCarga'
import { IconoActualizar, IconoAnterior } from '../../shared/ui/iconos'
import { TEXTO_TIPO_UNIDAD, TIPO_UNIDAD_CORTO } from '../flota/api'
import { TEXTO_HITO } from '../monitoreo/textos'
import { tipoCorregido, type Traslado, type TrasladoDelPanel } from './api'
import { AvisoDelProblema, BotonFamiliaAvisada } from './AvisosDeTraslado'
import { DialogoAsignar } from './DialogoAsignar'
import { DialogoDevolver } from './DialogoDevolver'
import { InsigniaEstadoTraslado } from './InsigniasDeTraslado'
import { trasladoQuery } from './queries'
import { EXPLICACION_ESTADO, TEXTO_MOVILIDAD } from './textos'

const rutaApi = getRouteApi('/protegida/traslados/$trasladoId')

/** Cada cuánto se recalcula lo que le queda si está sin unidad. Se muestra en minutos: alcanza con esto. */
const INTERVALO_RELOJ_MS = 15_000

/** Todo lo que el ciudadano cargó y lo que pasó después, para cuando el administrador necesita mirar de cerca. */
export function DetalleTrasladoPage() {
  const { trasladoId } = rutaApi.useParams()
  // La vista y el día de la lista desde la que se abrió. Vacía si se entró directo: se vuelve a los de hoy.
  const busquedaDeLaLista = rutaApi.useSearch()
  const idValido = Number.isInteger(trasladoId) && trasladoId > 0
  const consulta = useQuery({ ...trasladoQuery(trasladoId), enabled: idValido })
  const noExiste = !idValido || (consulta.error instanceof ErrorApi && consulta.error.status === 404)
  const [aAsignar, setAAsignar] = useState<Traslado | null>(null)
  const [aDevolver, setADevolver] = useState<TrasladoDelPanel | null>(null)

  return (
    <>
      <Link
        to="/traslados"
        search={busquedaDeLaLista}
        style={{ textDecoration: 'none', alignSelf: 'flex-start' }}
      >
        <XStack items="center" gap={6}>
          <IconoAnterior size={16} color="var(--textoSecundario)" />
          <Text fontSize={13} fontWeight="500" color="$textoSecundario">
            Traslados
          </Text>
        </XStack>
      </Link>

      {noExiste ? (
        <EncabezadoPagina titulo="Traslado no encontrado" descripcion="Puede haberse borrado o el enlace está mal." />
      ) : consulta.isPending ? (
        <Cargando texto="Cargando el traslado…" />
      ) : consulta.isError ? (
        <ErrorAlCargar error={consulta.error} onReintentar={() => consulta.refetch()} />
      ) : (
        <Contenido
          fila={consulta.data}
          recargando={consulta.isFetching}
          onRecargar={() => consulta.refetch()}
          onAsignar={setAAsignar}
          onDevolver={setADevolver}
        />
      )}

      <DialogoAsignar traslado={aAsignar} onCerrar={() => setAAsignar(null)} />
      <DialogoDevolver fila={aDevolver} onCerrar={() => setADevolver(null)} />
    </>
  )
}

type PropsContenido = {
  fila: TrasladoDelPanel
  recargando: boolean
  onRecargar: () => void
  onAsignar: (traslado: Traslado) => void
  onDevolver: (fila: TrasladoDelPanel) => void
}

function Contenido({ fila, recargando, onRecargar, onAsignar, onDevolver }: PropsContenido) {
  const { traslado } = fila
  const ahora = useAhora(INTERVALO_RELOJ_MS)
  const explicacion = explicacionDe(fila)
  // Mientras la unidad viene en camino se le puede sacar siempre. Si ya está atrasada, el botón va destacado en el
  // aviso y no se repite acá.
  const devolverAca = fila.estadoAtencion === 'EN_CAMINO' && fila.problema !== 'UNIDAD_ATRASADA'

  return (
    <>
      <EncabezadoPagina
        titulo={`Traslado de ${traslado.pasajero}`}
        descripcion={`Pedido el ${fechaHoraCorta(traslado.fechaHoraCreacion)}.`}
        accion={
          <Button
            size="$4"
            variant="outlined"
            icon={recargando ? <Spinner size="small" color="$textoSecundario" /> : <IconoActualizar size={16} />}
            disabled={recargando}
            onPress={onRecargar}
          >
            Actualizar
          </Button>
        }
      />

      <XStack items="center" gap={12} flexWrap="wrap">
        <InsigniaEstadoTraslado estado={traslado.estado} />
        {devolverAca ? (
          <Button size="$3" variant="outlined" onPress={() => onDevolver(fila)}>
            <Button.Text fontSize={13} fontWeight="600" color="$texto">
              Devolver a la búsqueda
            </Button.Text>
          </Button>
        ) : null}
      </XStack>

      {fila.problema ? (
        <Aviso
          tono={fila.problema === 'SIN_UNIDAD' ? 'neutro' : 'rojo'}
          accion={<AccionDelDetalle fila={fila} onAsignar={onAsignar} onDevolver={onDevolver} />}
        >
          <AvisoDelProblema fila={fila} ahora={ahora} />
        </Aviso>
      ) : null}

      {fila.horaFamiliaAvisada ? (
        <Text fontSize={14} fontWeight="500" color="$disponibleTexto">
          ✓ Familia avisada a las {hora(fila.horaFamiliaAvisada)}
        </Text>
      ) : null}

      {/* Lo corrigió alguien que tuvo al paciente enfrente: cambia qué unidad sirve, así que va bien a la vista. */}
      {tipoCorregido(traslado) ? (
        <Aviso tono="ambar">
          <Text fontSize={13} fontWeight="600" color="$enAtencionTexto">
            Pedido: {TIPO_UNIDAD_CORTO[traslado.tipoUnidadPedido]} · Hace falta: {TIPO_UNIDAD_CORTO[traslado.tipoUnidad]}{' '}
            (lo corrigió la tripulación)
          </Text>
        </Aviso>
      ) : null}

      {explicacion ? (
        <Paragraph fontSize={14} lineHeight={20} color="$textoSecundario">
          {explicacion}
        </Paragraph>
      ) : null}

      {/* La devolución puede venir de la tripulación o del administrador: se cuenta sin decir quién. */}
      {fila.horaDevolucion ? (
        <Paragraph fontSize={14} lineHeight={20} color="$textoSecundario">
          {traslado.estado === 'BUSCANDO_UNIDAD'
            ? `Volvió a la búsqueda a las ${hora(fila.horaDevolucion)}, por eso va primero en la fila.`
            : `Volvió a la búsqueda a las ${hora(fila.horaDevolucion)}.`}
        </Paragraph>
      ) : null}

      <Seccion titulo="Quién viaja">
        <Dato etiqueta="Paciente" valor={traslado.pasajero} />
        <Dato etiqueta="Cómo se moviliza" valor={TEXTO_MOVILIDAD[traslado.movilidad]} />
        <Dato etiqueta="Necesita" valor={necesidades(traslado)} />
        <Dato etiqueta="Peso aproximado" valor={traslado.pesoAproximado ? `${traslado.pesoAproximado} kg` : null} />
        <Dato etiqueta="Acompañantes" valor={String(traslado.acompanantes)} />
        <Dato etiqueta="Observaciones" valor={traslado.observaciones} />
      </Seccion>

      <Seccion titulo="Recorrido">
        <Dato etiqueta="Origen" valor={traslado.origenReferencia ?? coordenadas(traslado.origen)} />
        <Dato
          etiqueta="Recibe a la ambulancia"
          valor={traslado.contactoNombre ? `${traslado.contactoNombre} · ${traslado.contactoTelefono}` : 'Quien pidió el traslado'}
        />
        <Dato etiqueta="Destino" valor={traslado.centroSaludDestino ?? coordenadas(traslado.destino)} />
        <Dato etiqueta="Área del destino" valor={traslado.destinoDetalle} />
      </Seccion>

      <Seccion titulo="Horarios">
        <Dato
          etiqueta="Tiene que estar"
          valor={traslado.horaCita ? fechaHora(traslado.horaCita) : 'Pedido para lo antes posible'}
        />
        <Dato etiqueta="Ventana de recogida" valor={textoDeLaRecogida(traslado)} />
        <Dato etiqueta="Salida estimada" valor={fechaHora(traslado.horaSalidaEstimada)} />
        <Dato etiqueta="Última salida posible" valor={fechaHora(traslado.horaLimiteSalida)} />
      </Seccion>

      <Seccion titulo="Unidad">
        <Dato etiqueta="Tipo que necesita" valor={TEXTO_TIPO_UNIDAD[traslado.tipoUnidad]} />
        <Dato etiqueta="Unidad asignada" valor={fila.placa} />
        <Dato etiqueta="Paramédico" valor={fila.paramedico} />
        {fila.estadoAtencion ? (
          <XStack items="center" gap={12}>
            <Text fontSize={13} color="$textoSecundario" width={180}>
              Estado de la atención
            </Text>
            <InsigniaEstadoAtencion estado={fila.estadoAtencion} />
          </XStack>
        ) : null}
      </Seccion>

      {/* Los hitos de la unidad que lo tiene o lo terminó. Sin unidad no hay nada que contar. */}
      {fila.hitos.length > 0 ? (
        <Seccion titulo="Lo que hizo la unidad">
          {fila.hitos.map((hito) => (
            <Dato key={hito.clave} etiqueta={TEXTO_HITO[hito.clave]} valor={hora(hito.hora)} />
          ))}
        </Seccion>
      ) : null}
    </>
  )
}

type PropsAccion = {
  fila: TrasladoDelPanel
  onAsignar: (traslado: Traslado) => void
  onDevolver: (fila: TrasladoDelPanel) => void
}

/**
 * Lo que resuelve el problema del traslado, al lado del aviso. Lo que pide una decisión va destacado; asignar a mano
 * no, porque mientras queda tiempo el sistema sigue buscando solo.
 */
function AccionDelDetalle({ fila, onAsignar, onDevolver }: PropsAccion) {
  switch (fila.problema) {
    case 'SIN_UNIDAD':
      return (
        <Button size="$3" variant="outlined" onPress={() => onAsignar(fila.traslado)}>
          <Button.Text fontSize={13} fontWeight="600" color="$texto">
            Asignar una unidad
          </Button.Text>
        </Button>
      )
    case 'NO_CUBIERTO':
      return <BotonFamiliaAvisada traslado={fila.traslado} destacado />
    case 'UNIDAD_ATRASADA':
      return (
        <BotonPrimario size="$3" onPress={() => onDevolver(fila)}>
          <Button.Text color="$primarioTexto" fontSize={13} fontWeight="600">
            Devolver a la búsqueda
          </Button.Text>
        </BotonPrimario>
      )
    default:
      return null
  }
}

/** Por qué está como está. Si fue una unidad y nadie viajó, el motivo que dio la tripulación completa la frase. */
function explicacionDe(fila: TrasladoDelPanel): string | null {
  const explicacion = EXPLICACION_ESTADO[fila.traslado.estado] ?? null
  if (explicacion && fila.traslado.estado === 'NO_REALIZADO' && fila.motivoSinTraslado) {
    return `${explicacion} ${TEXTO_MOTIVO_SIN_TRASLADO[fila.motivoSinTraslado]}.`
  }
  return explicacion
}

/** "Recoger entre 10:05 y 10:25": lo que se le prometió a la familia. Null en los pedidos anteriores a la ventana. */
function textoDeLaRecogida(traslado: Traslado) {
  if (!traslado.horaRecogidaDesde || !traslado.horaRecogidaHasta) {
    return null
  }
  return `Recoger entre ${hora(traslado.horaRecogidaDesde)} y ${hora(traslado.horaRecogidaHasta)}`
}

function necesidades(traslado: Traslado) {
  const marcadas = [
    traslado.oxigeno ? 'oxígeno' : null,
    traslado.equipo ? 'vía, sonda o monitoreo' : null,
    traslado.aislamiento ? 'aislamiento' : null,
  ].filter((texto): texto is string => texto !== null)
  return marcadas.length === 0 ? 'Nada en particular' : marcadas.join(' · ')
}

function coordenadas({ latitud, longitud }: { latitud: number; longitud: number }) {
  return `${latitud.toFixed(5)}, ${longitud.toFixed(5)}`
}

type PropsAviso = {
  /** Rojo para lo que pide una decisión; ámbar para lo que conviene saber; neutro mientras el sistema sigue solo. */
  tono: 'rojo' | 'ambar' | 'neutro'
  /** El botón que lo resuelve, al lado del texto. */
  accion?: ReactNode
  children: ReactNode
}

/** Un aviso a todo el ancho, arriba de las secciones: es lo primero que hay que ver al abrir el traslado. */
function Aviso({ tono, accion, children }: PropsAviso) {
  return (
    <XStack
      items="center"
      justify="space-between"
      gap={16}
      flexWrap="wrap"
      px={16}
      py={12}
      rounded={12}
      bg={tono === 'rojo' ? '$primarioTinte' : tono === 'ambar' ? '$enAtencionTinte' : '$superficie'}
      borderWidth={1}
      borderColor={tono === 'neutro' ? '$borde' : 'transparent'}
    >
      <YStack flex={1} minW={240}>
        {children}
      </YStack>
      {accion}
    </XStack>
  )
}

function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <YStack gap={12} bg="$superficie" borderWidth={1} borderColor="$borde" rounded={12} p={20}>
      <H2 color="$texto" fontSize={16} lineHeight={22} fontWeight="600">
        {titulo}
      </H2>
      <YStack gap={8}>{children}</YStack>
    </YStack>
  )
}

/** Sin valor, el dato no se muestra: una lista llena de guiones no dice nada. */
function Dato({ etiqueta, valor }: { etiqueta: string; valor: string | null }) {
  if (!valor) {
    return null
  }
  return (
    <XStack gap={12} flexWrap="wrap">
      <Text fontSize={13} color="$textoSecundario" width={180}>
        {etiqueta}
      </Text>
      <Text fontSize={14} color="$texto" flex={1} minW={200}>
        {valor}
      </Text>
    </XStack>
  )
}
