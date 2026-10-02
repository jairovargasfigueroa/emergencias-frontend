import { onValue, type Unsubscribe } from 'firebase/database'
import { api } from '../../shared/api/cliente'
import type { EstadoAtencion } from '../../shared/atencion/api'
import { referenciaA, SIN_ESCUCHA } from '../../shared/firebase/baseDatos'
import type { EstadoAmbulancia, TipoUnidad } from '../flota/api'
import type { EstadoIncidente } from '../incidentes/api'
import type { TrasladoDelPanel } from '../traslados/api'

/** Nodo que publica el servidor: un hijo por ambulancia que alguna vez reportó, con su id como clave. */
const NODO_POSICIONES = 'posiciones'

/** Nodo de los incidentes abiertos: un hijo por incidente, con su id como clave. */
const NODO_INCIDENTES_ABIERTOS = 'incidentes-abiertos'

// --- REST: la foto completa de la operación ---------------------------------------------------------------

export type OrigenAtencion = 'INCIDENTE' | 'TRASLADO'

/**
 * Los hitos de una atención vistos como lo que le pasó a la unidad. El backend los manda crudos; el texto en
 * castellano lo arma el panel (ver `textos.ts`).
 */
export type TipoEvento =
  | 'TOMA'
  | 'LLEGADA'
  | 'RECOGIDA'
  | 'HOSPITAL'
  | 'ENTREGA'
  | 'SIN_TRASLADO'
  | 'LIBERACION'
  | 'CANCELACION'
  | 'AVISO_NO_LISTO'

/** `UnidadEnOperacionResponse.Tripulante`: lleva el teléfono porque el despacho a veces necesita llamarlo. */
export type Tripulante = {
  id: number
  nombreCompleto: string
  telefono: string
}

/** `AtencionEnCursoResponse.Hito` del backend. El traslado del panel trae la misma lista de su unidad. */
export type Hito = {
  clave: TipoEvento
  hora: string
}

/** `AtencionEnCursoResponse` del backend: qué está haciendo la unidad y desde cuándo. */
export type AtencionEnCurso = {
  id: number
  estado: EstadoAtencion
  /** Hora del hito que dejó la atención en este estado, no la del comienzo: es "desde cuándo está así". */
  desde: string
  origen: OrigenAtencion
  /** Exactamente uno de los dos tiene valor, según el origen. */
  incidenteId: number | null
  trasladoId: number | null
  /** Con qué nombrarla en pantalla: el pasajero del traslado o lo que contó quien avisó. Puede faltar. */
  etiqueta: string | null
  /** Solo los hitos que ya ocurrieron, del más viejo al más nuevo. */
  hitos: Hito[]
}

/** `UnidadEnOperacionResponse.Posicion` del backend: la última guardada en la base, no la de Firebase. */
export type PosicionGuardada = {
  latitud: number
  longitud: number
  en: string | null
}

/** `UnidadEnOperacionResponse` del backend. */
export type UnidadEnOperacion = {
  ambulanciaId: number
  placa: string
  tipoUnidad: TipoUnidad
  estado: EstadoAmbulancia
  activa: boolean
  /** Quiénes tienen turno abierto en esta unidad. Vacía si no hay nadie adentro. */
  tripulacion: Tripulante[]
  /** El más viejo de los turnos abiertos, o null si no hay ninguno. */
  turnoDesde: string | null
  /** Null cuando la unidad no está atendiendo nada. */
  atencion: AtencionEnCurso | null
  /**
   * Solo la pintada inicial del mapa: es la última posición que alcanzó a guardarse en la base y puede estar
   * vieja. Firebase la pisa apenas llega la primera posición en vivo.
   */
  ultimaPosicion: PosicionGuardada | null
}

/** `IncidenteSinCubrirResponse` del backend: un incidente al que todavía no va nadie. */
export type IncidenteSinCubrir = {
  id: number
  latitud: number
  longitud: number
  estado: EstadoIncidente
  /** Desde cuándo existe el incidente, que para el despacho es "cuánto hace que nadie va". */
  desde: string
  referencia: string | null
}

/** `EventoDeOperacionResponse` del backend: una línea de la bitácora. */
export type EventoDeOperacion = {
  hora: string
  ambulanciaId: number
  placa: string
  tipo: TipoEvento
  atencionId: number
  incidenteId: number | null
  trasladoId: number | null
  /** El motivo del cierre o de la cancelación, o el destino de la entrega. Null en los demás. */
  detalle: string | null
}

/** `OperacionResponse` del backend: toda la pantalla en una sola llamada. */
export type Operacion = {
  unidades: UnidadEnOperacion[]
  incidentesSinCubrir: IncidenteSinCubrir[]
  /**
   * Los traslados que necesitan que el administrador haga algo, cada uno con su `problema`. Es la misma lista de
   * `/traslados/problemas` y en el mismo orden: las unidades atrasadas, los que esperan unidad (primero los
   * devueltos) y los no cubiertos que todavía no se le avisaron a la familia.
   */
  trasladosSinCubrir: TrasladoDelPanel[]
  /** Del evento más nuevo al más viejo. */
  eventos: EventoDeOperacion[]
  /** Segundos sin reportar posición a partir de los cuales la unidad se marca sin señal. */
  umbralSinSenalSeg: number
}

/** `CierreDesdeLaCentral` del backend: cómo cierra la central una atención que la tripulación no puede cerrar. */
export type CierreDesdeLaCentral = 'CANCELAR' | 'DAR_POR_ENTREGADA' | 'LIBERAR'

/** `CierreDesdeLaCentralRequest` del backend. El destino solo se usa al darla por entregada. */
export type CerrarAtencion = {
  cierre: CierreDesdeLaCentral
  /** Con `false`, la unidad queda fuera de servicio hasta que la tripulación la reactive desde su app. */
  dejarDisponible: boolean
  /** Sin centro ni destino escrito, queda el que ya tenía, que en un traslado es el del pedido. */
  centroSaludId?: number | null
  destinoDescripcion?: string | null
}

/**
 * El único cierre que admite cada estado, según dónde quedó la unidad: si todavía no tenía al paciente, deja el caso;
 * si lo llevaba a bordo, el viaje terminó en el destino; y si ya había resuelto, solo le faltaba quedar libre. Una
 * cancelada ya no ocupa la unidad, así que no hay nada que cerrar.
 */
export function cierreSegunEstado(estado: EstadoAtencion): CierreDesdeLaCentral | null {
  switch (estado) {
    case 'EN_CAMINO':
    case 'EN_EL_LUGAR':
      return 'CANCELAR'
    case 'PACIENTE_RECOGIDO':
    case 'EN_HOSPITAL':
      return 'DAR_POR_ENTREGADA'
    case 'PACIENTE_ENTREGADO':
    case 'SIN_TRASLADO':
      return 'LIBERAR'
    default:
      return null
  }
}

export const operacionApi = {
  estadoActual: (signal?: AbortSignal) => api.get<Operacion>('/operacion', signal),
  /** Responde sin cuerpo: el cambio se ve al volver a pedir la operación. */
  cerrarAtencion: (atencionId: number, datos: CerrarAtencion) =>
    api.post<void>(`/operacion/atenciones/${atencionId}/cierre`, datos),
}

// --- Firebase: lo que cambia entre refresco y refresco -----------------------------------------------------

/**
 * Lo que el servidor escribe en `posiciones/{ambulanciaId}`. `en` es ISO-8601 y puede faltar: la publicación
 * lo omite cuando la posición llegó sin momento.
 */
export type PosicionPublicada = {
  latitud: number
  longitud: number
  en?: string
}

/** Última posición conocida de cada ambulancia, por su id. */
export type PosicionesPorAmbulancia = Record<number, PosicionPublicada>

/**
 * Escucha el nodo completo de posiciones.
 *
 * Ojo: el nodo guarda la última posición de toda ambulancia que alguna vez reportó. Se agregó el borrado al
 * cerrar turno, pero los datos viejos siguen ahí, así que lo que sale de acá no se pinta tal cual: manda la
 * lista de `/operacion` y esto solo responde "dónde estaba la unidad tal" (ver `cruzarConLaOperacion`).
 */
export function escucharPosiciones(
  alRecibir: (posiciones: PosicionesPorAmbulancia) => void,
  alFallar: () => void,
): Unsubscribe {
  const nodo = referenciaA(NODO_POSICIONES)
  if (!nodo) {
    alFallar()
    return SIN_ESCUCHA
  }

  return onValue(
    nodo,
    (snapshot) => {
      const posiciones: PosicionesPorAmbulancia = {}
      // Los hijos tienen ids numéricos como clave: se recorren con forEach para no recibir un arreglo con huecos.
      snapshot.forEach((hijo) => {
        const id = Number(hijo.key)
        const valor = hijo.val() as Partial<PosicionPublicada> | null
        if (Number.isInteger(id) && esPosicion(valor)) {
          posiciones[id] = valor
        }
      })
      alRecibir(posiciones)
    },
    alFallar,
  )
}

/** Un hijo a medio escribir o de una versión vieja no debe terminar como un pin en el medio del océano. */
function esPosicion(valor: Partial<PosicionPublicada> | null): valor is PosicionPublicada {
  return (
    valor !== null &&
    typeof valor.latitud === 'number' &&
    typeof valor.longitud === 'number' &&
    Math.abs(valor.latitud) <= 90 &&
    Math.abs(valor.longitud) <= 180
  )
}

/** Un hijo de `incidentes-abiertos`, tal como lo escribe el servidor. */
export type IncidenteAbierto = {
  id: number
  latitud: number
  longitud: number
  estado: EstadoIncidente
  fechaHoraCreacion: string | null
  /** Lo que contó cada quien que avisó, en orden. Vacío si nadie escribió nada. */
  descripciones: string[]
  unidadesAcudiendo: number
  cantidadAfectados: number | null
}

/**
 * Escucha los incidentes abiertos y entrega su contenido.
 *
 * Que el nodo se mueva es además la señal de que alguna unidad cambió de estado, y el estado no viaja por
 * Firebase: quien escucha aprovecha cada cambio para adelantarse al refresco periódico de `/operacion`.
 */
export function escucharIncidentesAbiertos(
  alRecibir: (incidentes: IncidenteAbierto[]) => void,
  alFallar: () => void,
): Unsubscribe {
  const nodo = referenciaA(NODO_INCIDENTES_ABIERTOS)
  if (!nodo) {
    alFallar()
    return SIN_ESCUCHA
  }

  return onValue(
    nodo,
    (snapshot) => {
      const incidentes: IncidenteAbierto[] = []
      // Igual que las posiciones: forEach y nunca `.val()` del padre, que con ids numéricos devuelve un arreglo
      // con huecos y se pierde de vista cuál incidente es cuál.
      snapshot.forEach((hijo) => {
        const incidente = comoIncidente(hijo.key, hijo.val())
        if (incidente) {
          incidentes.push(incidente)
        }
      })
      alRecibir(incidentes)
    },
    alFallar,
  )
}

/** Lo que llega de Firebase no está tipado: un hijo a medio escribir se descarta en vez de pintarse mal. */
function comoIncidente(clave: string | null, valor: unknown): IncidenteAbierto | null {
  const id = Number(clave)
  if (!Number.isInteger(id) || valor === null || typeof valor !== 'object') {
    return null
  }
  const datos = valor as Record<string, unknown>
  const latitud = datos.latitud
  const longitud = datos.longitud
  if (typeof latitud !== 'number' || typeof longitud !== 'number') {
    return null
  }
  if (Math.abs(latitud) > 90 || Math.abs(longitud) > 180) {
    return null
  }
  return {
    id,
    latitud,
    longitud,
    estado: typeof datos.estado === 'string' ? (datos.estado as EstadoIncidente) : 'ACTIVO',
    fechaHoraCreacion: typeof datos.fechaHoraCreacion === 'string' ? datos.fechaHoraCreacion : null,
    descripciones: Array.isArray(datos.descripciones)
      ? datos.descripciones.filter((texto): texto is string => typeof texto === 'string')
      : [],
    unidadesAcudiendo: typeof datos.unidadesAcudiendo === 'number' ? datos.unidadesAcudiendo : 0,
    // El servidor omite el campo cuando nadie dijo a cuántos afectó: no es cero, es que no se sabe.
    cantidadAfectados: typeof datos.cantidadAfectados === 'number' ? datos.cantidadAfectados : null,
  }
}
