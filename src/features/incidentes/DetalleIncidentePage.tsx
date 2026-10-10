import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getRouteApi, Link } from '@tanstack/react-router'
import { Fragment, useState } from 'react'
import { Anchor, Button, Paragraph, Spinner, Text, XStack, YStack } from 'tamagui'
import { ErrorApi } from '../../shared/api/cliente'
import { InsigniaEstadoAtencion } from '../../shared/atencion/InsigniaEstadoAtencion'
import { TEXTO_MOTIVO_CANCELACION_ATENCION, TEXTO_MOTIVO_SIN_TRASLADO } from '../../shared/atencion/textos'
import { fechaHora, fechaHoraCorta, tiempoTranscurrido } from '../../shared/formato/fechas'
import { useAhora } from '../../shared/reloj/useAhora'
import { BotonPrimario } from '../../shared/ui/botones'
import { EncabezadoPagina } from '../../shared/ui/EncabezadoPagina'
import { Cargando, ErrorAlCargar } from '../../shared/ui/EstadosDeCarga'
import { IconoActualizar, IconoAnterior } from '../../shared/ui/iconos'
import { resumenIaKeys } from '../resumen-ia/queries'
import { ResumenIaDelIncidente } from '../resumen-ia/ResumenIaDelIncidente'
import { FilaTabla, Tabla, TablaVacia, type ColumnaTabla } from '../../shared/ui/Tabla'
import {
  atencionResuelta,
  estaAbierto,
  ocupaLaUnidad,
  type AlertaDeIncidente,
  type AtencionDeIncidente,
  type IncidenteDetalle,
  type Ubicacion,
} from './api'
import { DialogoCerrarIncidente } from './DialogoCerrarIncidente'
import { DialogoEnviarUnidad, type IncidenteParaEnviar } from './DialogoEnviarUnidad'
import { InsigniaEstadoIncidente } from './InsigniasDeEstado'
import { Dato, Nota, Seccion, Tarjeta, Valor } from './PiezasDelDetalle'
import { incidenteQuery } from './queries'
import {
  TEXTO_ESTADO_ALERTA,
  TEXTO_MOTIVO_CANCELACION_ALERTA,
  TEXTO_MOTIVO_CIERRE,
  TEXTO_ORIGEN_UBICACION,
  textoEmisorEsPaciente,
} from './textos'

// El id lleva el prefijo de la ruta protegida, que es de la que cuelgan todas las pantallas del panel.
const rutaApi = getRouteApi('/protegida/incidentes/$incidenteId')

/** Cada cuánto se recalcula el tiempo que lleva abierto el incidente, sin volver a consultar. */
const INTERVALO_RELOJ_MS = 30_000

const COLUMNAS_ALERTAS: ColumnaTabla[] = [
  { titulo: 'Hora', ancho: 130 },
  { titulo: 'Quién avisó', ancho: 210 },
  { titulo: 'Qué pasó' },
  // Debajo de 1280 px se esconde: arriba está la del incidente, que es el máximo de lo que reportó cada alerta.
  { titulo: 'Afectados', ancho: 100, ocultarEnPantallaChica: true },
  { titulo: 'Ubicación', ancho: 180 },
  { titulo: 'Estado', ancho: 110 },
]

/**
 * Detalle de un incidente: cómo está, las alertas que lo formaron y lo que hizo cada unidad, con la hora de cada hito.
 * En la operación lo que más importa es el tiempo, por eso cada hito dice cuánto tardó. Mientras está abierto, la
 * central puede mandarle una unidad o, si no se va a atender, cerrarlo.
 */
export function DetalleIncidentePage() {
  const { incidenteId } = rutaApi.useParams()
  const queryClient = useQueryClient()
  // El filtro y la página de la lista desde la que se abrió. Vacía si se entró directo: se vuelve a la de siempre.
  const busquedaDeLaLista = rutaApi.useSearch()
  const idValido = Number.isInteger(incidenteId) && incidenteId > 0
  const incidente = useQuery({ ...incidenteQuery(incidenteId), enabled: idValido })
  const noExiste = !idValido || (incidente.error instanceof ErrorApi && incidente.error.status === 404)
  const [aEnviar, setAEnviar] = useState<IncidenteParaEnviar | null>(null)
  const [cerrando, setCerrando] = useState(false)

  return (
    <>
      <Link
        to="/incidentes"
        search={busquedaDeLaLista}
        style={{ textDecoration: 'none', alignSelf: 'flex-start', marginBottom: -12 }}
      >
        <XStack items="center" gap={4} height={28} hoverStyle={{ opacity: 0.75 }}>
          <IconoAnterior size={16} color="var(--textoSecundario)" />
          <Text fontSize={13} fontWeight="500" color="$textoSecundario">
            Incidentes
          </Text>
        </XStack>
      </Link>

      <EncabezadoPagina
        titulo={idValido ? `Incidente #${incidenteId}` : 'Incidente'}
        descripcion="Las alertas que lo formaron y lo que hizo cada unidad, con la hora de cada paso."
        accion={
          noExiste ? undefined : (
            <Button
              size="$4"
              variant="outlined"
              icon={incidente.isFetching ? <Spinner size="small" color="$textoSecundario" /> : <IconoActualizar size={16} />}
              disabled={incidente.isFetching}
              onPress={() => {
                void incidente.refetch()
                // El resumen de la IA se actualiza solo con el aviso de Firebase, pero sin Firebase este es el camino.
                void queryClient.invalidateQueries({ queryKey: resumenIaKeys.delIncidente(incidenteId) })
              }}
            >
              Actualizar
            </Button>
          )
        }
      />

      {noExiste ? (
        <Tarjeta>
          <Paragraph color="$texto" fontSize={15} fontWeight="500" text="center" py={24}>
            {idValido ? `No existe el incidente #${incidenteId}.` : 'Esta dirección no corresponde a ningún incidente.'}
          </Paragraph>
        </Tarjeta>
      ) : incidente.isPending ? (
        <Cargando texto="Cargando el incidente…" />
      ) : incidente.isError ? (
        <ErrorAlCargar error={incidente.error} onReintentar={() => incidente.refetch()} />
      ) : (
        <>
          {estaAbierto(incidente.data.estado) ? (
            <AccionesDelIncidente
              incidente={incidente.data}
              onEnviar={() => setAEnviar(incidente.data)}
              onCerrar={() => setCerrando(true)}
            />
          ) : null}
          <Resumen incidente={incidente.data} />
          <ResumenIaDelIncidente incidenteId={incidenteId} alertas={incidente.data.alertas} />
          <Seccion titulo={`Alertas (${incidente.data.alertas.length})`}>
            <TablaAlertas alertas={incidente.data.alertas} />
          </Seccion>
          <Seccion titulo={`Atenciones (${incidente.data.atenciones.length})`}>
            <Atenciones atenciones={incidente.data.atenciones} abierto={estaAbierto(incidente.data.estado)} />
          </Seccion>
        </>
      )}

      <DialogoEnviarUnidad incidente={aEnviar} onCerrar={() => setAEnviar(null)} />
      {cerrando ? <DialogoCerrarIncidente incidenteId={incidenteId} onCerrar={() => setCerrando(false)} /> : null}
    </>
  )
}

type PropsAcciones = {
  incidente: IncidenteDetalle
  onEnviar: () => void
  onCerrar: () => void
}

/**
 * Lo que la central puede hacer con un incidente abierto, antes que el resto del detalle. Enviar una unidad va
 * destacado cuando nadie lo está atendiendo, que es cuando hace falta que alguien decida.
 *
 * Con unidades trabajando, cerrarlo se ve apagado y con el motivo al lado: lo cierran ellas con lo que encuentren, y
 * si alguna quedó trabada, se destraba desde el centro de control.
 */
function AccionesDelIncidente({ incidente, onEnviar, onCerrar }: PropsAcciones) {
  const trabajando = incidente.unidadesAcudiendo > 0

  return (
    <XStack items="center" gap={12} flexWrap="wrap">
      {trabajando ? (
        <Button size="$3" variant="outlined" onPress={onEnviar}>
          <Button.Text fontSize={13} fontWeight="600" color="$texto">
            Enviar una unidad
          </Button.Text>
        </Button>
      ) : (
        <BotonPrimario size="$3" onPress={onEnviar}>
          <Button.Text color="$primarioTexto" fontSize={13} fontWeight="600">
            Enviar una unidad
          </Button.Text>
        </BotonPrimario>
      )}
      <Button size="$3" variant="outlined" disabled={trabajando} opacity={trabajando ? 0.5 : 1} onPress={onCerrar}>
        <Button.Text fontSize={13} fontWeight="600" color="$texto">
          Cerrar el incidente
        </Button.Text>
      </Button>
      {trabajando ? (
        <Text fontSize={12} lineHeight={16} color="$textoSecundario">
          Hay unidades trabajando: lo cierran ellas al terminar, o cierra antes sus atenciones en el Centro de control.
        </Text>
      ) : null}
    </XStack>
  )
}

function Resumen({ incidente }: { incidente: IncidenteDetalle }) {
  const ahora = useAhora(INTERVALO_RELOJ_MS)
  const abierto = estaAbierto(incidente.estado)
  const llegadas = incidente.atenciones.flatMap((atencion) =>
    atencion.horaLlegada ? [new Date(atencion.horaLlegada).getTime()] : [],
  )
  const primeraLlegada = llegadas.length > 0 ? Math.min(...llegadas) : null

  return (
    <Tarjeta>
      <XStack flexWrap="wrap" rowGap={20} columnGap={48}>
        <Dato etiqueta="Estado">
          <InsigniaEstadoIncidente estado={incidente.estado} />
        </Dato>
        <Dato etiqueta="Primera alerta">
          <Valor>{fechaHora(incidente.fechaHoraCreacion)}</Valor>
        </Dato>
        {abierto ? (
          <Dato etiqueta="Abierto hace">
            <Valor>{tiempoTranscurrido(incidente.fechaHoraCreacion, ahora)}</Valor>
          </Dato>
        ) : (
          <Dato etiqueta="Cierre">
            <Valor>{incidente.fechaHoraCierre ? fechaHora(incidente.fechaHoraCierre) : '—'}</Valor>
            {incidente.motivoCierre ? <Nota>{TEXTO_MOTIVO_CIERRE[incidente.motivoCierre]}</Nota> : null}
            {/* Solo si lo cerró la central: los que se cierran solos no tienen a quién nombrar. */}
            {incidente.cerradoPor ? <Nota>Lo cerró {incidente.cerradoPor}</Nota> : null}
          </Dato>
        )}
        <Dato etiqueta="Primera unidad en el lugar">
          {primeraLlegada === null ? (
            <Valor tenue>{abierto ? 'Todavía ninguna' : 'Ninguna llegó'}</Valor>
          ) : (
            <Valor>{tiempoTranscurrido(incidente.fechaHoraCreacion, primeraLlegada)} después de la alerta</Valor>
          )}
        </Dato>
        <Dato etiqueta="Personas afectadas">
          {incidente.cantidadAfectados === null ? (
            <Valor tenue>Sin reportar</Valor>
          ) : (
            <Valor>{incidente.cantidadAfectados}</Valor>
          )}
        </Dato>
        <Dato etiqueta="Unidades">
          {incidente.unidades.length === 0 ? <Valor tenue>Ninguna</Valor> : <Valor mono>{incidente.unidades.join(', ')}</Valor>}
          {abierto && incidente.unidadesAcudiendo > 0 ? <Nota>{incidente.unidadesAcudiendo} acudiendo ahora</Nota> : null}
        </Dato>
        <Dato etiqueta="Lugar">
          <Valor mono>
            {incidente.latitud.toFixed(5)}, {incidente.longitud.toFixed(5)}
          </Valor>
          <EnlaceMapa ubicacion={incidente} />
        </Dato>
      </XStack>
    </Tarjeta>
  )
}

function TablaAlertas({ alertas }: { alertas: AlertaDeIncidente[] }) {
  return (
    <Tabla columnas={COLUMNAS_ALERTAS}>
      {alertas.length === 0 ? (
        <TablaVacia>Este incidente no tiene alertas.</TablaVacia>
      ) : (
        alertas.map((alerta) => (
          <Fragment key={alerta.id}>
            <FilaTabla columnas={COLUMNAS_ALERTAS} alto={64}>
              <Valor>{fechaHoraCorta(alerta.fechaHora)}</Valor>
              <YStack flex={1} minW={0}>
                <Valor>{alerta.emisor.nombreCompleto}</Valor>
                <Nota>{alerta.emisor.telefono}</Nota>
              </YStack>
              {alerta.descripcion ? (
                <Paragraph flex={1} minW={0} fontSize={14} lineHeight={20} color="$texto">
                  {alerta.descripcion}
                </Paragraph>
              ) : (
                <Valor tenue>Sin describir</Valor>
              )}
              {alerta.cantidadAfectados === null ? <Valor tenue>—</Valor> : <Valor>{alerta.cantidadAfectados}</Valor>}
              <YStack items="flex-start">
                <Valor>{TEXTO_ORIGEN_UBICACION[alerta.origenUbicacion]}</Valor>
                <EnlaceMapa ubicacion={alerta} />
              </YStack>
              <Valor>{TEXTO_ESTADO_ALERTA[alerta.estado]}</Valor>
            </FilaTabla>
            {alerta.estado === 'CANCELADA' ? <RetiroDeAlerta alerta={alerta} /> : null}
          </Fragment>
        ))
      )}
    </Tabla>
  )
}

/** Cuándo y por qué el ciudadano retiró su pedido. Va debajo de la fila de la alerta, sin borde, como parte de ella. */
function RetiroDeAlerta({ alerta }: { alerta: AlertaDeIncidente }) {
  return (
    <XStack flexWrap="wrap" rowGap={16} columnGap={48} px={24} pb={16}>
      <Dato etiqueta="Se retiró">
        {alerta.horaCancelacion ? (
          <Valor>{fechaHoraCorta(alerta.horaCancelacion)}</Valor>
        ) : (
          <Valor tenue>Sin datos</Valor>
        )}
      </Dato>
      <Dato etiqueta="Motivo">
        {alerta.motivoCancelacion ? (
          <Valor>{TEXTO_MOTIVO_CANCELACION_ALERTA[alerta.motivoCancelacion]}</Valor>
        ) : (
          <Valor tenue>Sin datos</Valor>
        )}
        {alerta.emisorEsPaciente === null ? null : <Nota>{textoEmisorEsPaciente(alerta.emisorEsPaciente)}</Nota>}
      </Dato>
    </XStack>
  )
}

function Atenciones({ atenciones, abierto }: { atenciones: AtencionDeIncidente[]; abierto: boolean }) {
  if (atenciones.length === 0) {
    return (
      <Tarjeta>
        <Text fontSize={14} color="$textoSecundario" text="center" py={12}>
          {abierto ? 'Todavía ninguna unidad tomó este incidente.' : 'Ninguna unidad tomó este incidente.'}
        </Text>
      </Tarjeta>
    )
  }
  return (
    <YStack gap={12}>
      {atenciones.map((atencion) => (
        <TarjetaAtencion key={atencion.id} atencion={atencion} />
      ))}
    </YStack>
  )
}

type Hito = {
  nombre: string
  hora: string | null
  ubicacion?: Ubicacion | null
  nota?: string
  /** Qué decir mientras el hito no ocurrió, cuando "Pendiente" se queda corto. */
  pendiente?: string
}

function TarjetaAtencion({ atencion }: { atencion: AtencionDeIncidente }) {
  const cancelada = atencion.estado === 'CANCELADA'
  const sinTraslado = atencion.estado === 'SIN_TRASLADO'
  const hitos: Hito[] = [
    { nombre: 'Llegó al lugar', hora: atencion.horaLlegada, ubicacion: atencion.ubicacionLlegada },
    { nombre: 'Paciente a bordo', hora: atencion.horaRecogida, ubicacion: atencion.ubicacionRecogida },
    { nombre: 'Llegó al destino', hora: atencion.horaLlegadaHospital, ubicacion: atencion.ubicacionLlegadaHospital },
    { nombre: 'Entregó al paciente', hora: atencion.horaEntrega, ubicacion: atencion.ubicacionEntrega },
  ]
  // Una salida que se cortó ya no tiene hitos pendientes: quedan los que ocurrieron y cómo terminó.
  const visibles = cancelada || sinTraslado ? hitos.filter((hito) => hito.hora !== null) : hitos
  if (sinTraslado) {
    visibles.push({
      nombre: 'Terminó sin traslado',
      hora: atencion.horaSinTraslado,
      ubicacion: atencion.ubicacionSinTraslado,
      nota: atencion.motivoSinTraslado ? TEXTO_MOTIVO_SIN_TRASLADO[atencion.motivoSinTraslado] : undefined,
    })
  }
  if (cancelada) {
    visibles.push({
      nombre: 'Cancelada',
      hora: atencion.horaCancelacion,
      nota: atencion.motivoCancelacion ? TEXTO_MOTIVO_CANCELACION_ATENCION[atencion.motivoCancelacion] : undefined,
    })
  }
  // Terminar la salida no desocupa la ambulancia: hasta que se libera no puede recibir otra emergencia.
  if (atencionResuelta(atencion.estado)) {
    visibles.push({ nombre: 'Unidad liberada', hora: atencion.horaLiberacion, pendiente: 'La unidad sigue ocupada' })
  }
  const paciente = [atencion.nombrePaciente, atencion.documentoPaciente].filter(Boolean).join(' · ')
  const destino = [atencion.centroSalud?.nombre, atencion.destinoDescripcion].filter(Boolean).join(' · ')

  return (
    <Tarjeta>
      <YStack gap={18}>
        <XStack items="center" gap={12} flexWrap="wrap">
          <Text fontFamily="$mono" fontSize={15} fontWeight="600" color="$texto">
            {atencion.placa}
          </Text>
          {/* El punto dice que la ambulancia sigue tomada, aunque ya haya entregado al paciente. */}
          <InsigniaEstadoAtencion estado={atencion.estado} conPunto={ocupaLaUnidad(atencion)} />
          {/* El último paso lo marcó la central y no la tripulación: su hora es la del cierre, no la real, y así se
              sabe a quién preguntarle. */}
          {atencion.cerradaPor ? (
            <Text fontSize={13} color="$textoSecundario">
              La cerró la central ({atencion.cerradaPor})
            </Text>
          ) : null}
        </XStack>

        <XStack flexWrap="wrap" rowGap={16} columnGap={48}>
          <Dato etiqueta="Tomó el caso">
            <Valor>{fechaHoraCorta(atencion.horaToma)}</Valor>
          </Dato>
          {visibles.map((hito) => (
            <Dato key={hito.nombre} etiqueta={hito.nombre}>
              {hito.hora ? (
                <>
                  <Valor>{fechaHoraCorta(hito.hora)}</Valor>
                  <Nota>{tiempoTranscurrido(atencion.horaToma, new Date(hito.hora).getTime())} después de tomarlo</Nota>
                </>
              ) : (
                <Valor tenue>{hito.pendiente ?? 'Pendiente'}</Valor>
              )}
              {hito.nota ? <Nota>{hito.nota}</Nota> : null}
              {hito.ubicacion ? <EnlaceMapa ubicacion={hito.ubicacion} /> : null}
            </Dato>
          ))}
        </XStack>

        <XStack flexWrap="wrap" rowGap={16} columnGap={48} pt={16} borderTopWidth={1} borderColor="$borde">
          {atencion.paramedicoResponsable ? (
            <Dato etiqueta="Paramédico responsable">
              <Valor>{atencion.paramedicoResponsable.nombreCompleto}</Valor>
              <Nota>{atencion.paramedicoResponsable.telefono}</Nota>
            </Dato>
          ) : null}
          <Dato etiqueta="Paciente">{paciente ? <Valor>{paciente}</Valor> : <Valor tenue>Sin datos</Valor>}</Dato>
          {/* Una cancelada no va a entregar a nadie: la línea de la cancelación, con su motivo, ya dice cómo terminó. */}
          {cancelada ? null : (
            <Dato etiqueta="Destino">
              {destino ? (
                <Valor>{destino}</Valor>
              ) : (
                <Valor tenue>
                  {sinTraslado ? 'No hubo traslado' : atencion.horaEntrega ? 'Sin datos' : 'Todavía no se entrega'}
                </Valor>
              )}
            </Dato>
          )}
        </XStack>
      </YStack>
    </Tarjeta>
  )
}

/** Abre el punto en Google Maps, en otra pestaña. */
function EnlaceMapa({ ubicacion }: { ubicacion: Ubicacion }) {
  return (
    <Anchor
      href={`https://www.google.com/maps/search/?api=1&query=${ubicacion.latitud},${ubicacion.longitud}`}
      target="_blank"
      rel="noopener noreferrer"
      fontSize={13}
      lineHeight={20}
      fontWeight="500"
      color="$primarioPresionado"
      hoverStyle={{ textDecorationLine: 'underline' }}
    >
      Ver en Google Maps
    </Anchor>
  )
}
