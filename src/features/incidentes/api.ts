import { api, type Pagina } from '../../shared/api/cliente'

export type EstadoIncidente = 'ACTIVO' | 'EN_ATENCION' | 'ATENDIDO' | 'FALSA_ALARMA' | 'ATENDIDO_EXTERNAMENTE' | 'CANCELADO'

export type MotivoCierreIncidente = 'FALSA_ALARMA_VERIFICADA' | 'ATENDIDO_EXTERNAMENTE' | 'SIN_COBERTURA' | 'OTRO'

export type EstadoAlerta = 'RECIBIDA' | 'VINCULADA' | 'CANCELADA' | 'DESCARTADA'

export type OrigenUbicacion = 'GPS' | 'MANUAL'

export type EstadoAtencion =
  | 'EN_CAMINO'
  | 'EN_EL_LUGAR'
  | 'PACIENTE_RECOGIDO'
  | 'EN_HOSPITAL'
  | 'PACIENTE_ENTREGADO'
  | 'SIN_TRASLADO'
  | 'CANCELADA'

export type MotivoCancelacionAtencion = 'AVERIA' | 'NO_SE_ENCONTRO_PACIENTE' | 'DESVIADA' | 'OTRO'

/** Con qué se encontró la unidad cuando la salida terminó sin llevar a nadie. */
export type MotivoSinTraslado =
  | 'ATENDIDO_EN_EL_LUGAR'
  | 'PACIENTE_RECHAZO'
  | 'NO_HABIA_PACIENTE'
  | 'TRASLADO_POR_OTRO_MEDIO'
  | 'FALLECIDO'

/** `FiltroEstadoIncidente` del backend: ABIERTOS son ACTIVO y EN_ATENCION; CERRADOS, los cuatro estados finales. */
export type FiltroEstadoIncidente = 'ABIERTOS' | 'CERRADOS' | 'TODOS'

/** ME-1: ACTIVO y EN_ATENCION son los estados abiertos del incidente; los demás son finales. */
export function estaAbierto(estado: EstadoIncidente) {
  return estado === 'ACTIVO' || estado === 'EN_ATENCION'
}

/** ME-1: la unidad sigue trabajando en el incidente. */
export function atencionActiva(estado: EstadoAtencion) {
  return estado === 'EN_CAMINO' || estado === 'EN_EL_LUGAR' || estado === 'PACIENTE_RECOGIDO' || estado === 'EN_HOSPITAL'
}

/** ME-1: la unidad fue y resolvió, haya trasladado al paciente o no. */
export function atencionResuelta(estado: EstadoAtencion) {
  return estado === 'PACIENTE_ENTREGADO' || estado === 'SIN_TRASLADO'
}

/** `IncidenteResumenResponse` del backend. `unidades` son placas sin repetir, en orden de toma. */
export type IncidenteResumen = {
  id: number
  estado: EstadoIncidente
  fechaHoraCreacion: string
  fechaHoraCierre: string | null
  motivoCierre: MotivoCierreIncidente | null
  latitud: number
  longitud: number
  cantidadAfectados: number | null
  cantidadAlertas: number
  unidades: string[]
  unidadesAcudiendo: number
}

/** `UbicacionResponse` del backend. */
export type Ubicacion = {
  latitud: number
  longitud: number
}

/** `AlertaDeIncidenteResponse` del backend. La ubicación es la efectiva: la ajustada si existe; si no, la original. */
export type AlertaDeIncidente = {
  id: number
  fechaHora: string
  estado: EstadoAlerta
  origenUbicacion: OrigenUbicacion
  latitud: number
  longitud: number
  cantidadAfectados: number | null
  descripcion: string | null
  emisor: {
    id: number
    nombreCompleto: string
    telefono: string
  }
}

/** `AtencionDeIncidenteResponse` del backend. Cada hito trae su hora y su ubicación, `null` si no ocurrió. */
export type AtencionDeIncidente = {
  id: number
  ambulanciaId: number
  placa: string
  estado: EstadoAtencion
  horaToma: string
  horaLlegada: string | null
  horaRecogida: string | null
  horaLlegadaHospital: string | null
  horaEntrega: string | null
  horaSinTraslado: string | null
  motivoSinTraslado: MotivoSinTraslado | null
  horaLiberacion: string | null
  horaCancelacion: string | null
  motivoCancelacion: MotivoCancelacionAtencion | null
  ubicacionLlegada: Ubicacion | null
  ubicacionRecogida: Ubicacion | null
  ubicacionLlegadaHospital: Ubicacion | null
  ubicacionEntrega: Ubicacion | null
  ubicacionSinTraslado: Ubicacion | null
  nombrePaciente: string | null
  documentoPaciente: string | null
  centroSalud: {
    id: number
    nombre: string
  } | null
  destinoDescripcion: string | null
}

/**
 * La unidad sigue tomada por esta atención: trabajando, o ya resuelta pero todavía sin liberarse. Entregar al
 * paciente no libera nada: entre dejarlo en el hospital y poder salir de nuevo pasan el papeleo y la limpieza.
 */
export function ocupaLaUnidad(atencion: AtencionDeIncidente) {
  return atencionActiva(atencion.estado) || (atencionResuelta(atencion.estado) && atencion.horaLiberacion === null)
}

/** `IncidenteDetalleResponse` del backend: los campos del resumen, sus alertas y sus atenciones. */
export type IncidenteDetalle = IncidenteResumen & {
  alertas: AlertaDeIncidente[]
  atenciones: AtencionDeIncidente[]
}

export const incidentesApi = {
  listar: (filtro: FiltroEstadoIncidente, pagina: number, tamano: number, signal?: AbortSignal) => {
    const parametros = new URLSearchParams({ estado: filtro, pagina: String(pagina), tamano: String(tamano) })
    return api.get<Pagina<IncidenteResumen>>(`/incidentes?${parametros}`, signal)
  },
  detalle: (id: number, signal?: AbortSignal) => api.get<IncidenteDetalle>(`/incidentes/${id}`, signal),
}
