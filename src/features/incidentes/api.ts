import { api, type Pagina } from '../../shared/api/cliente'

export type EstadoIncidente = 'ACTIVO' | 'EN_ATENCION' | 'ATENDIDO' | 'FALSA_ALARMA' | 'ATENDIDO_EXTERNAMENTE' | 'CANCELADO'

export type MotivoCierreIncidente = 'FALSA_ALARMA_VERIFICADA' | 'ATENDIDO_EXTERNAMENTE' | 'SIN_COBERTURA' | 'OTRO'

export type EstadoAlerta = 'RECIBIDA' | 'VINCULADA' | 'CANCELADA' | 'DESCARTADA'

export type OrigenUbicacion = 'GPS' | 'MANUAL'

export type EstadoAtencion = 'EN_CAMINO' | 'EN_EL_LUGAR' | 'PACIENTE_RECOGIDO' | 'PACIENTE_ENTREGADO' | 'CANCELADA'

export type MotivoCancelacionAtencion = 'AVERIA' | 'NO_SE_ENCONTRO_PACIENTE' | 'DESVIADA' | 'OTRO'

/** `FiltroEstadoIncidente` del backend: ABIERTOS son ACTIVO y EN_ATENCION; CERRADOS, los cuatro estados finales. */
export type FiltroEstadoIncidente = 'ABIERTOS' | 'CERRADOS' | 'TODOS'

/** ME-1: ACTIVO y EN_ATENCION son los estados abiertos del incidente; los demás son finales. */
export function estaAbierto(estado: EstadoIncidente) {
  return estado === 'ACTIVO' || estado === 'EN_ATENCION'
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
  horaEntrega: string | null
  horaCancelacion: string | null
  motivoCancelacion: MotivoCancelacionAtencion | null
  ubicacionLlegada: Ubicacion | null
  ubicacionRecogida: Ubicacion | null
  ubicacionEntrega: Ubicacion | null
  nombrePaciente: string | null
  documentoPaciente: string | null
  centroSalud: {
    id: number
    nombre: string
  } | null
  destinoDescripcion: string | null
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
