import { useSyncExternalStore } from 'react'
import type { Ambulancia, EstadoAmbulancia } from '../flota/api'
import { escucharPosiciones, type PosicionPublicada, type PosicionesPorAmbulancia } from './api'

export type Posiciones = {
  cargando: boolean
  error: boolean
  porAmbulancia: PosicionesPorAmbulancia
}

const SIN_DATOS: Posiciones = { cargando: true, error: false, porAmbulancia: {} }

let actual = SIN_DATOS
const oyentes = new Set<() => void>()
let dejarDeEscuchar: (() => void) | null = null

/**
 * Posiciones en vivo de la flota. Hay un único listener de Firebase compartido por toda la pantalla: el mapa y
 * la lista miran el mismo dato, y al salir de la pantalla se corta la escucha.
 */
export function usePosiciones() {
  return useSyncExternalStore(suscribir, () => actual)
}

function suscribir(oyente: () => void) {
  oyentes.add(oyente)
  if (!dejarDeEscuchar) {
    dejarDeEscuchar = escucharPosiciones(
      (porAmbulancia) => publicar({ cargando: false, error: false, porAmbulancia }),
      () => publicar({ ...actual, cargando: false, error: true }),
    )
  }
  return () => {
    oyentes.delete(oyente)
    if (oyentes.size === 0 && dejarDeEscuchar) {
      dejarDeEscuchar()
      dejarDeEscuchar = null
      actual = SIN_DATOS
    }
  }
}

function publicar(siguiente: Posiciones) {
  actual = siguiente
  oyentes.forEach((oyente) => oyente())
}

const UMBRAL_POR_DEFECTO_SEG = 60

/** A partir de cuántos segundos sin reportar la posición deja de ser "de ahora". Se ajusta en .env.local. */
export const UMBRAL_POSICION_SEG = umbralDeEntorno(import.meta.env.VITE_UMBRAL_POSICION_SEG)

function umbralDeEntorno(valor: string | undefined): number {
  const segundos = Number(valor)
  return Number.isFinite(segundos) && segundos > 0 ? segundos : UMBRAL_POR_DEFECTO_SEG
}

/**
 * Estados que salen al mapa. Una unidad sin turno o fuera de servicio no está circulando: aunque el nodo de
 * Firebase todavía guarde dónde estuvo, pintarla sería inventar una unidad en la calle. Va solo en la lista.
 */
const ESTADOS_EN_EL_MAPA: EstadoAmbulancia[] = ['DISPONIBLE', 'EN_ATENCION']

export type UnidadMonitoreada = {
  ambulancia: Ambulancia
  /** Última posición conocida, o null si esta unidad nunca reportó. */
  posicion: PosicionPublicada | null
  /** Segundos desde el último reporte. Null cuando no reportó nunca o el reporte llegó sin hora. */
  segundosDesdeReporte: number | null
  /** Hay posición, pero vieja: se sigue mostrando donde estuvo, avisando que ya no es de ahora. */
  desactualizada: boolean
  /** Sale al mapa: está en turno y sabemos dónde estuvo. */
  enElMapa: boolean
}

/**
 * Cruza la flota con las posiciones. Manda la lista de `/ambulancias`: se recorre esa y a cada unidad se le
 * busca su posición. Una posición de Firebase cuya ambulancia no está en la lista se ignora, porque el nodo
 * nunca se limpia y si no aparecerían fantasmas de unidades que hace rato dejaron de circular.
 *
 * Las dadas de baja no entran: para el panel esas unidades ya no existen.
 */
export function cruzarConLaFlota(
  ambulancias: Ambulancia[],
  porAmbulancia: PosicionesPorAmbulancia,
  ahora: number,
): UnidadMonitoreada[] {
  return ambulancias
    .filter((ambulancia) => ambulancia.activa)
    .map((ambulancia) => {
      const posicion = porAmbulancia[ambulancia.id] ?? null
      const segundosDesdeReporte = posicion?.en ? segundosDesde(posicion.en, ahora) : null
      // Sin hora de reporte no hay forma de saber si sigue vigente: se avisa igual que si estuviera vieja.
      const desactualizada = posicion !== null && (segundosDesdeReporte === null || segundosDesdeReporte > UMBRAL_POSICION_SEG)
      return {
        ambulancia,
        posicion,
        segundosDesdeReporte,
        desactualizada,
        enElMapa: posicion !== null && ESTADOS_EN_EL_MAPA.includes(ambulancia.estado),
      }
    })
}

/** El reloj del navegador puede ir adelantado respecto al del servidor: un "hace -3 s" no se muestra. */
function segundosDesde(iso: string, ahora: number): number | null {
  const momento = new Date(iso).getTime()
  return Number.isNaN(momento) ? null : Math.max(0, Math.round((ahora - momento) / 1000))
}
