import { useQuery } from '@tanstack/react-query'
import { getRouteApi, Link } from '@tanstack/react-router'
import { useEffect, useState, type ReactNode } from 'react'
import { Anchor, Button, H2, Paragraph, Spinner, Text, XStack, YStack } from 'tamagui'
import { ErrorApi } from '../../shared/api/cliente'
import { fechaHora, fechaHoraCorta, tiempoTranscurrido } from '../../shared/formato/fechas'
import { EncabezadoPagina } from '../../shared/ui/EncabezadoPagina'
import { Cargando, ErrorAlCargar } from '../../shared/ui/EstadosDeCarga'
import { IconoActualizar, IconoAnterior } from '../../shared/ui/iconos'
import { FilaTabla, Tabla, TablaVacia, type ColumnaTabla } from '../../shared/ui/Tabla'
import {
  atencionResuelta,
  estaAbierto,
  type AlertaDeIncidente,
  type AtencionDeIncidente,
  type IncidenteDetalle,
  type Ubicacion,
} from './api'
import { InsigniaEstadoAtencion, InsigniaEstadoIncidente } from './InsigniasDeEstado'
import { incidenteQuery } from './queries'
import {
  TEXTO_ESTADO_ALERTA,
  TEXTO_MOTIVO_CANCELACION_ATENCION,
  TEXTO_MOTIVO_CIERRE,
  TEXTO_MOTIVO_SIN_TRASLADO,
  TEXTO_ORIGEN_UBICACION,
} from './textos'

// El id lleva el prefijo de la ruta protegida, que es de la que cuelgan todas las pantallas del panel.
const rutaApi = getRouteApi('/protegida/incidentes/$incidenteId')

/** Cada cuánto se recalcula el tiempo que lleva abierto el incidente. */
const INTERVALO_RELOJ_MS = 30_000

const COLUMNAS_ALERTAS: ColumnaTabla[] = [
  { titulo: 'Hora', ancho: 130 },
  { titulo: 'Quién avisó', ancho: 210 },
  { titulo: 'Qué pasó' },
  { titulo: 'Afectados', ancho: 100 },
  { titulo: 'Ubicación', ancho: 180 },
  { titulo: 'Estado', ancho: 110 },
]

/**
 * Detalle de un incidente, solo lectura: cómo está, las alertas que lo formaron y lo que hizo cada unidad, con la hora
 * de cada hito. En la operación lo que más importa es el tiempo, por eso cada hito dice cuánto tardó.
 */
export function DetalleIncidentePage() {
  const { incidenteId } = rutaApi.useParams()
  const idValido = Number.isInteger(incidenteId) && incidenteId > 0
  const incidente = useQuery({ ...incidenteQuery(incidenteId), enabled: idValido })
  const noExiste = !idValido || (incidente.error instanceof ErrorApi && incidente.error.status === 404)

  return (
    <>
      <Link to="/incidentes" style={{ textDecoration: 'none', alignSelf: 'flex-start', marginBottom: -12 }}>
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
              onPress={() => incidente.refetch()}
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
          <Resumen incidente={incidente.data} />
          <Seccion titulo={`Alertas (${incidente.data.alertas.length})`}>
            <TablaAlertas alertas={incidente.data.alertas} />
          </Seccion>
          <Seccion titulo={`Atenciones (${incidente.data.atenciones.length})`}>
            <Atenciones atenciones={incidente.data.atenciones} abierto={estaAbierto(incidente.data.estado)} />
          </Seccion>
        </>
      )}
    </>
  )
}

function Resumen({ incidente }: { incidente: IncidenteDetalle }) {
  const ahora = useAhora()
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
          <FilaTabla key={alerta.id} columnas={COLUMNAS_ALERTAS} alto={64}>
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
        ))
      )}
    </Tabla>
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
    { nombre: 'Llegó al hospital', hora: atencion.horaLlegadaHospital, ubicacion: atencion.ubicacionLlegadaHospital },
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
          <InsigniaEstadoAtencion atencion={atencion} />
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
          <Dato etiqueta="Paciente">{paciente ? <Valor>{paciente}</Valor> : <Valor tenue>Sin datos</Valor>}</Dato>
          <Dato etiqueta="Destino">
            {destino ? (
              <Valor>{destino}</Valor>
            ) : (
              <Valor tenue>{sinTraslado ? 'No hubo traslado' : atencion.horaEntrega ? 'Sin datos' : 'Todavía no se entrega'}</Valor>
            )}
          </Dato>
        </XStack>
      </YStack>
    </Tarjeta>
  )
}

/** La hora actual, renovada cada 30 s: el tiempo que lleva abierto avanza sin volver a consultar. */
function useAhora() {
  const [ahora, setAhora] = useState(() => Date.now())
  useEffect(() => {
    const reloj = setInterval(() => setAhora(Date.now()), INTERVALO_RELOJ_MS)
    return () => clearInterval(reloj)
  }, [])
  return ahora
}

function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <YStack render="section" gap={12}>
      <H2 color="$texto" fontSize={16} lineHeight={24} fontWeight="600">
        {titulo}
      </H2>
      {children}
    </YStack>
  )
}

function Tarjeta({ children }: { children: ReactNode }) {
  return (
    <YStack px={24} py={20} bg="$superficie" borderWidth={1} borderColor="$borde" rounded={12}>
      {children}
    </YStack>
  )
}

/** Un dato con su etiqueta encima. */
function Dato({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <YStack gap={4} items="flex-start" minW={140}>
      <Text fontSize={12} lineHeight={16} fontWeight="500" color="$textoSecundario">
        {etiqueta}
      </Text>
      {children}
    </YStack>
  )
}

function Valor({ children, tenue = false, mono = false }: { children: ReactNode; tenue?: boolean; mono?: boolean }) {
  return (
    <Text
      fontSize={mono ? 13 : 14}
      lineHeight={20}
      fontFamily={mono ? '$mono' : undefined}
      fontWeight={mono ? '500' : '400'}
      color={tenue ? '$textoTenue' : '$texto'}
    >
      {children}
    </Text>
  )
}

function Nota({ children }: { children: ReactNode }) {
  return (
    <Text fontSize={12} lineHeight={16} color="$textoSecundario">
      {children}
    </Text>
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
