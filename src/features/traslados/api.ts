import { api } from '../../shared/api/cliente'
import type { EstadoAtencion, MotivoSinTraslado } from '../../shared/atencion/api'
import type { TipoUnidad } from '../flota/api'
import type { Hito } from '../monitoreo/api'

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

export type Ubicacion = {
  latitud: number
  longitud: number
}

/** `TrasladoResponse` del backend. */
export type Traslado = {
  id: number
  estado: EstadoTraslado
  /** En qué va la unidad que lo tiene. Solo viene si está ASIGNADO, COMPLETADO o NO_REALIZADO. */
  estadoUnidad: EstadoAtencion | null
  modoHorario: ModoHorario
  horaCita: string | null
  horaSalidaEstimada: string
  /** La última salida que todavía llega: pasada esa hora sin unidad, el traslado queda no cubierto. */
  horaLimiteSalida: string
  /** La ventana que se le promete a la familia: cuándo pasa la unidad por el origen. No es la hora de salida. */
  horaRecogidaDesde: string | null
  horaRecogidaHasta: string | null
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
  /** El centro del catálogo, si el destino es uno. */
  centroSaludDestinoId: number | null
  centroSaludDestino: string | null
  destinoDetalle: string | null
  fechaHoraCreacion: string
}

/**
 * `ProblemaDeTraslado` del backend: por qué el traslado necesita que el administrador haga algo. No se guarda, lo
 * calcula el servidor al responder.
 * - `SIN_UNIDAD`: está buscando unidad; el sistema reintenta hasta la última salida posible.
 * - `NO_CUBIERTO`: se venció sin unidad y todavía nadie le avisó a la familia.
 * - `UNIDAD_ATRASADA`: la unidad sigue en camino y ya pasó la ventana de recogida.
 */
export type ProblemaDeTraslado = 'SIN_UNIDAD' | 'NO_CUBIERTO' | 'UNIDAD_ATRASADA'

/** `TrasladoDelPanelResponse` del backend: el pedido más la unidad que lo está haciendo, si ya tiene una. */
export type TrasladoDelPanel = {
  traslado: Traslado
  /** Null si el traslado no necesita nada del administrador. */
  problema: ProblemaDeTraslado | null
  /** Cuándo el administrador marcó que le avisó a la familia. Solo en los no cubiertos. */
  horaFamiliaAvisada: string | null
  /** La última vez que volvió a la búsqueda. Mientras esté puesta, el traslado va primero en la fila. */
  horaDevolucion: string | null
  atencionId: number | null
  placa: string | null
  estadoAtencion: EstadoAtencion | null
  paramedico: string | null
  /** Los hitos de la unidad que lo tiene o lo terminó, del más viejo al más nuevo. Vacío si no hay unidad. */
  hitos: Hito[]
  /** Por qué no viajó nadie, cuando la unidad lo cerró sin traslado. */
  motivoSinTraslado: MotivoSinTraslado | null
}

/**
 * `UnidadParaTrasladoResponse` del backend: una unidad disponible, activa y de un tipo que alcanza, con la que se
 * puede asignar a mano. Vienen también las que el barrido no usaría, marcadas: quien asigna a mano puede saber algo
 * que el sistema no.
 */
export type UnidadParaTraslado = {
  ambulanciaId: number
  placa: string
  tipoUnidad: TipoUnidad
  /** En línea recta hasta el origen del traslado. Null si la unidad nunca reportó su posición. */
  distanciaMetros: number | null
  /** Cuándo reportó su posición por última vez. */
  posicionEn: string | null
  /** Reportó su posición en los últimos minutos. Sin eso el barrido no le asigna nada. */
  posicionReciente: boolean
  /** Ya tuvo este traslado y lo dejó. El barrido no se lo vuelve a ofrecer. */
  yaLoTuvo: boolean
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

/**
 * Minutos enteros que le quedan hasta la última salida posible, contados desde `ahora`. Negativo si ya pasó: el
 * sistema lo da por no cubierto en su próxima vuelta.
 */
export function minutosParaLaUltimaSalida(traslado: Traslado, ahora: number) {
  return Math.floor((new Date(traslado.horaLimiteSalida).getTime() - ahora) / 60_000)
}

export const trasladosApi = {
  /** Sin fecha, el backend devuelve el día de hoy en la zona de la empresa. */
  delDia: (dia: string | undefined, signal?: AbortSignal) =>
    api.get<TrasladoDelPanel[]>(dia ? `/traslados?dia=${dia}` : '/traslados', signal),
  problemas: (signal?: AbortSignal) => api.get<TrasladoDelPanel[]>('/traslados/problemas', signal),
  detalle: (id: number, signal?: AbortSignal) => api.get<TrasladoDelPanel>(`/traslados/${id}`, signal),
  /** De la más cercana al origen a la más lejana; las que nunca reportaron posición, al final. */
  unidades: (id: number, signal?: AbortSignal) =>
    api.get<UnidadParaTraslado[]>(`/traslados/${id}/unidades`, signal),
  asignar: (id: number, ambulanciaId: number) =>
    api.post<TrasladoDelPanel>(`/traslados/${id}/asignar`, { ambulanciaId }),
}
