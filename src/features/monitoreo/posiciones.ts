import { useSyncExternalStore } from 'react'
import type { EstadoAmbulancia } from '../flota/api'
import {
  escucharIncidentesAbiertos,
  escucharPosiciones,
  type IncidenteAbierto,
  type PosicionesPorAmbulancia,
  type UnidadEnOperacion,
} from './api'

export type Posiciones = {
  cargando: boolean
  error: boolean
  porAmbulancia: PosicionesPorAmbulancia
}

const SIN_POSICIONES: Posiciones = { cargando: true, error: false, porAmbulancia: {} }

let posicionesActuales = SIN_POSICIONES
const oyentesDePosiciones = new Set<() => void>()
let cortarPosiciones: (() => void) | null = null

/**
 * Posiciones en vivo de la flota. Hay un único listener de Firebase compartido por toda la pantalla: el mapa y
 * la tabla miran el mismo dato, y al salir de la pantalla se corta la escucha.
 */
export function usePosiciones() {
  return useSyncExternalStore(suscribirAPosiciones, () => posicionesActuales)
}

function suscribirAPosiciones(oyente: () => void) {
  oyentesDePosiciones.add(oyente)
  if (!cortarPosiciones) {
    cortarPosiciones = escucharPosiciones(
      (porAmbulancia) => publicarPosiciones({ cargando: false, error: false, porAmbulancia }),
      () => publicarPosiciones({ ...posicionesActuales, cargando: false, error: true }),
    )
  }
  return () => {
    oyentesDePosiciones.delete(oyente)
    if (oyentesDePosiciones.size === 0 && cortarPosiciones) {
      cortarPosiciones()
      cortarPosiciones = null
      posicionesActuales = SIN_POSICIONES
    }
  }
}

function publicarPosiciones(siguiente: Posiciones) {
  posicionesActuales = siguiente
  oyentesDePosiciones.forEach((oyente) => oyente())
}

export type IncidentesAbiertos = {
  cargando: boolean
  error: boolean
  /** Todos los incidentes abiertos, no solo los que nadie cubre: al mapa van los dos. */
  lista: IncidenteAbierto[]
  /**
   * Cuántas veces cambió el nodo desde que se abrió la pantalla. La primera respuesta de Firebase es el valor
   * actual, no un cambio, así que queda en cero: sirve para refrescar `/operacion` sin hacerlo al entrar.
   */
  revision: number
}

const SIN_INCIDENTES: IncidentesAbiertos = { cargando: true, error: false, lista: [], revision: 0 }

let incidentesActuales = SIN_INCIDENTES
const oyentesDeIncidentes = new Set<() => void>()
let cortarIncidentes: (() => void) | null = null

/**
 * Incidentes abiertos en vivo. Un solo listener para las dos cosas que se hacen con este nodo: pintarlos en el
 * mapa y enterarse de que algo se movió, que es señal casi segura de que alguna unidad cambió de estado.
 */
export function useIncidentesAbiertos() {
  return useSyncExternalStore(suscribirAIncidentes, () => incidentesActuales)
}

function suscribirAIncidentes(oyente: () => void) {
  oyentesDeIncidentes.add(oyente)
  if (!cortarIncidentes) {
    cortarIncidentes = escucharIncidentesAbiertos(
      (lista) =>
        publicarIncidentes({
          cargando: false,
          error: false,
          lista,
          revision: incidentesActuales.cargando ? 0 : incidentesActuales.revision + 1,
        }),
      () => publicarIncidentes({ ...incidentesActuales, cargando: false, error: true }),
    )
  }
  return () => {
    oyentesDeIncidentes.delete(oyente)
    if (oyentesDeIncidentes.size === 0 && cortarIncidentes) {
      cortarIncidentes()
      cortarIncidentes = null
      incidentesActuales = SIN_INCIDENTES
    }
  }
}

function publicarIncidentes(siguiente: IncidentesAbiertos) {
  incidentesActuales = siguiente
  oyentesDeIncidentes.forEach((oyente) => oyente())
}

/**
 * Estados que salen al mapa. Una unidad sin turno o fuera de servicio no está circulando: aunque el nodo de
 * Firebase todavía guarde dónde estuvo, pintarla sería inventar una unidad en la calle. Va solo en la tabla.
 */
const ESTADOS_EN_EL_MAPA: EstadoAmbulancia[] = ['DISPONIBLE', 'EN_ATENCION']

/** Una posición de cualquiera de las dos fuentes, ya normalizada: Firebase omite `en`, la base lo manda nulo. */
export type PosicionConocida = {
  latitud: number
  longitud: number
  en: string | null
}

export type UnidadMonitoreada = {
  unidad: UnidadEnOperacion
  /** Última posición conocida, o null si esta unidad nunca reportó. */
  posicion: PosicionConocida | null
  /** Segundos desde el último reporte. Null cuando no reportó nunca o el reporte llegó sin hora. */
  segundosDesdeReporte: number | null
  /**
   * Está en turno y hace más del umbral que no se sabe dónde anda. Es distinto de no tener posición: esta
   * unidad sí reportó alguna vez, y lo que se pierde es el seguimiento de ahora.
   */
  sinSenal: boolean
  /** Sale al mapa: está en turno y sabemos dónde estuvo. */
  enElMapa: boolean
}

/**
 * Cruza la operación con las posiciones. Manda la lista de `/operacion`: se recorre esa y a cada unidad se le
 * busca su posición. Una posición de Firebase cuya ambulancia no está en la lista se ignora, porque el nodo
 * guarda también las de unidades que hace rato dejaron de circular y si no aparecerían fantasmas.
 *
 * Las dadas de baja no entran: para el panel esas unidades ya no existen.
 */
export function cruzarConLaOperacion(
  unidades: UnidadEnOperacion[],
  porAmbulancia: PosicionesPorAmbulancia,
  umbralSinSenalSeg: number,
  ahora: number,
): UnidadMonitoreada[] {
  return unidades
    .filter((unidad) => unidad.activa)
    .map((unidad) => {
      const enVivo = porAmbulancia[unidad.ambulanciaId]
      const posicion = laMasNueva(
        enVivo ? { latitud: enVivo.latitud, longitud: enVivo.longitud, en: enVivo.en ?? null } : null,
        unidad.ultimaPosicion,
      )
      const segundosDesdeReporte = posicion?.en ? segundosDesde(posicion.en, ahora) : null
      const enTurno = ESTADOS_EN_EL_MAPA.includes(unidad.estado)
      return {
        unidad,
        posicion,
        segundosDesdeReporte,
        // Sin hora de reporte no hay forma de saber si sigue vigente: se avisa igual que si estuviera vieja.
        sinSenal:
          enTurno &&
          posicion !== null &&
          (segundosDesdeReporte === null || segundosDesdeReporte > umbralSinSenalSeg),
        enElMapa: enTurno && posicion !== null,
      }
    })
}

/** Los contadores de la franja son también los filtros de la tabla: tocar uno deja ver solo esas unidades. */
export type FiltroDeUnidades = 'DISPONIBLE' | 'EN_ATENCION' | 'SIN_TURNO' | 'SIN_SENAL'

export function cumpleFiltro(unidad: UnidadMonitoreada, filtro: FiltroDeUnidades | null): boolean {
  if (filtro === null) {
    return true
  }
  return filtro === 'SIN_SENAL' ? unidad.sinSenal : unidad.unidad.estado === filtro
}

/**
 * Cuál de las dos posiciones vale. La de `/operacion` es la pintada inicial y la de Firebase llega en vivo, pero
 * entre refresco y refresco cualquiera de las dos puede ser la más nueva: gana la que tenga la hora más reciente.
 * Una posición con hora le gana a una sin hora, porque de esa no se puede decir si sigue vigente.
 */
function laMasNueva(enVivo: PosicionConocida | null, guardada: PosicionConocida | null): PosicionConocida | null {
  if (!enVivo) {
    return guardada
  }
  if (!guardada) {
    return enVivo
  }
  const momentoEnVivo = momentoDe(enVivo.en)
  const momentoGuardada = momentoDe(guardada.en)
  if (momentoEnVivo === null) {
    return momentoGuardada === null ? enVivo : guardada
  }
  if (momentoGuardada === null) {
    return enVivo
  }
  return momentoGuardada > momentoEnVivo ? guardada : enVivo
}

function momentoDe(iso: string | null): number | null {
  if (!iso) {
    return null
  }
  const momento = new Date(iso).getTime()
  return Number.isNaN(momento) ? null : momento
}

/** El reloj del navegador puede ir adelantado respecto al del servidor: un "hace -3 s" no se muestra. */
function segundosDesde(iso: string, ahora: number): number | null {
  const momento = momentoDe(iso)
  return momento === null ? null : Math.max(0, Math.round((ahora - momento) / 1000))
}
