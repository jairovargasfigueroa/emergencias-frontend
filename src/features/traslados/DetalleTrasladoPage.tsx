import { useQuery } from '@tanstack/react-query'
import { getRouteApi, Link } from '@tanstack/react-router'
import { useState, type ReactNode } from 'react'
import { Button, H2, Paragraph, Spinner, Text, XStack, YStack } from 'tamagui'
import { ErrorApi } from '../../shared/api/cliente'
import { InsigniaEstadoAtencion } from '../../shared/atencion/InsigniaEstadoAtencion'
import { fechaHora, fechaHoraCorta } from '../../shared/formato/fechas'
import { EncabezadoPagina } from '../../shared/ui/EncabezadoPagina'
import { Cargando, ErrorAlCargar } from '../../shared/ui/EstadosDeCarga'
import { IconoActualizar, IconoAnterior } from '../../shared/ui/iconos'
import { TEXTO_TIPO_UNIDAD } from '../flota/api'
import { esperaUnidad, tipoCorregido, type Traslado, type TrasladoDelPanel } from './api'
import { DialogoAsignar } from './DialogoAsignar'
import { InsigniaEstadoTraslado } from './InsigniasDeTraslado'
import { trasladoQuery } from './queries'
import { EXPLICACION_ESTADO, TEXTO_MOVILIDAD } from './textos'

const rutaApi = getRouteApi('/protegida/traslados/$trasladoId')

/** Todo lo que el ciudadano cargó y lo que pasó después, para cuando el administrador necesita mirar de cerca. */
export function DetalleTrasladoPage() {
  const { trasladoId } = rutaApi.useParams()
  // La vista y el día de la lista desde la que se abrió. Vacía si se entró directo: se vuelve a los de hoy.
  const busquedaDeLaLista = rutaApi.useSearch()
  const idValido = Number.isInteger(trasladoId) && trasladoId > 0
  const consulta = useQuery({ ...trasladoQuery(trasladoId), enabled: idValido })
  const noExiste = !idValido || (consulta.error instanceof ErrorApi && consulta.error.status === 404)
  const [aAsignar, setAAsignar] = useState<Traslado | null>(null)

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
        />
      )}

      <DialogoAsignar traslado={aAsignar} onCerrar={() => setAAsignar(null)} />
    </>
  )
}

type PropsContenido = {
  fila: TrasladoDelPanel
  recargando: boolean
  onRecargar: () => void
  onAsignar: (traslado: Traslado) => void
}

function Contenido({ fila, recargando, onRecargar, onAsignar }: PropsContenido) {
  const { traslado } = fila
  const explicacion = EXPLICACION_ESTADO[traslado.estado]

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
        {esperaUnidad(traslado.estado) ? (
          <Button size="$3" variant="outlined" onPress={() => onAsignar(traslado)}>
            <Button.Text fontSize={13} fontWeight="600" color="$texto">
              Asignar una unidad
            </Button.Text>
          </Button>
        ) : null}
      </XStack>

      {explicacion ? (
        <Paragraph fontSize={14} lineHeight={20} color="$textoSecundario">
          {explicacion}
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
        <Dato etiqueta="Salida estimada" valor={fechaHora(traslado.horaSalidaEstimada)} />
        <Dato etiqueta="Última salida posible" valor={fechaHora(traslado.horaLimiteSalida)} />
      </Seccion>

      <Seccion titulo="Unidad">
        <Dato
          etiqueta="Tipo que necesita"
          valor={
            tipoCorregido(traslado)
              ? `${TEXTO_TIPO_UNIDAD[traslado.tipoUnidad]} (corregido; se pidió ${TEXTO_TIPO_UNIDAD[traslado.tipoUnidadPedido]})`
              : TEXTO_TIPO_UNIDAD[traslado.tipoUnidad]
          }
        />
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
    </>
  )
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
