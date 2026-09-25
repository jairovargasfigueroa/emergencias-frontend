import { api } from '../../shared/api/cliente'
import type { TipoUnidad } from '../flota/api'

export type EstadoTraslado =
  | 'PROGRAMADO'
  | 'BUSCANDO_UNIDAD'
  | 'ASIGNADO'
  | 'COMPLETADO'
  | 'NO_REALIZADO'
  | 'NO_CUBIERTO'
  | 'CANCELADO'

export type ModoHorario = 'INMEDIATO' | 'PROGRAMADO'

export type Movilidad = 'CAMINA_CON_AYUDA' | 'SILLA_DE_RUEDAS' | 'CAMILLA'

export type EstadoAtencion =
  | 'EN_CAMINO'
  | 'EN_EL_LUGAR'
  | 'PACIENTE_RECOGIDO'
  | 'EN_HOSPITAL'
  | 'PACIENTE_ENTREGADO'
  | 'SIN_TRASLADO'
  | 'CANCELADA'

export type Ubicacion = {
  latitud: number
  longitud: number
}

/** `TrasladoResponse` del backend. */
export type Traslado = {
  id: number
  estado: EstadoTraslado
  modoHorario: ModoHorario
  horaCita: string | null
  horaSalidaEstimada: string
  horaLimiteSalida: string
  pasajero: string
  movilidad: Movilidad
  oxigeno: boolean
  equipo: boolean
  aislamiento: boolean
  pesoAproximado: number | null
  acompanantes: number
  observaciones: string | null
  tipoUnidad: TipoUnidad
  tipoUnidadPedido: TipoUnidad
  origen: Ubicacion
  origenReferencia: string | null
  contactoNombre: string | null
  contactoTelefono: string | null
  destino: Ubicacion
  centroSaludDestino: string | null
  destinoDetalle: string | null
  fechaHoraCreacion: string
}

/** `TrasladoDelPanelResponse` del backend: el pedido más la unidad que lo está haciendo, si ya tiene una. */
export type TrasladoDelPanel = {
  traslado: Traslado
  atencionId: number | null
  placa: string | null
  estadoAtencion: EstadoAtencion | null
  paramedico: string | null
}

/** El pedido sigue vivo: espera su día, espera unidad, o la unidad está en camino. */
export function trasladoVigente(estado: EstadoTraslado) {
  return estado === 'PROGRAMADO' || estado === 'BUSCANDO_UNIDAD' || estado === 'ASIGNADO'
}

/** Los que necesitan que alguien decida algo: se les pasó la hora de salir y no hay unidad. */
export function esperaUnidad(estado: EstadoTraslado) {
  return estado === 'BUSCANDO_UNIDAD'
}

/** El tipo pedido se corrigió porque el paciente no estaba como decía la ficha. */
export function tipoCorregido(traslado: Traslado) {
  return traslado.tipoUnidad !== traslado.tipoUnidadPedido
}

export const trasladosApi = {
  /** Sin fecha, el backend devuelve el día de hoy en la zona de la empresa. */
  delDia: (dia: string | undefined, signal?: AbortSignal) =>
    api.get<TrasladoDelPanel[]>(dia ? `/traslados?dia=${dia}` : '/traslados', signal),
  problemas: (signal?: AbortSignal) => api.get<TrasladoDelPanel[]>('/traslados/problemas', signal),
  detalle: (id: number, signal?: AbortSignal) => api.get<TrasladoDelPanel>(`/traslados/${id}`, signal),
  asignar: (id: number, ambulanciaId: number) =>
    api.post<TrasladoDelPanel>(`/traslados/${id}/asignar`, { ambulanciaId }),
}
