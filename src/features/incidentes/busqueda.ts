import type { FiltroEstadoIncidente } from './api'

/** Opciones del filtro de la lista, en el orden en que se muestran. */
export const FILTROS: readonly FiltroEstadoIncidente[] = ['ABIERTOS', 'CERRADOS', 'TODOS']

/**
 * Filtro y página de la lista de incidentes en la URL, por ejemplo `?estado=CERRADOS&pagina=2`. Los dos son
 * opcionales: sin filtro se ven los abiertos y sin página, la primera.
 */
export type BusquedaIncidentes = {
  estado?: FiltroEstadoIncidente
  /** Contada desde 1. */
  pagina?: number
}

export function esFiltro(valor: unknown): valor is FiltroEstadoIncidente {
  return FILTROS.some((filtro) => filtro === valor)
}

/** `validateSearch` de la ruta: lo que llega inválido en la URL se descarta, como si no estuviera. */
export function validarBusquedaIncidentes(busqueda: Record<string, unknown>): BusquedaIncidentes {
  const pagina = Number(busqueda.pagina)
  return {
    estado: esFiltro(busqueda.estado) ? busqueda.estado : undefined,
    pagina: Number.isSafeInteger(pagina) && pagina >= 1 ? pagina : undefined,
  }
}
