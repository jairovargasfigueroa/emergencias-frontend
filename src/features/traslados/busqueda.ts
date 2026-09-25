/** Las dos vistas de la sección, en el orden en que se muestran. */
export const VISTAS = ['DIA', 'PROBLEMAS'] as const

export type VistaTraslados = (typeof VISTAS)[number]

export const TEXTO_VISTA: Record<VistaTraslados, string> = {
  DIA: 'Del día',
  PROBLEMAS: 'Problemas',
}

/**
 * Vista y día en la URL, por ejemplo `?vista=PROBLEMAS` o `?dia=2026-09-29`. Los dos son opcionales: sin vista
 * se ve el día, y sin día, hoy.
 */
export type BusquedaTraslados = {
  vista?: VistaTraslados
  /** Formato `AAAA-MM-DD`. */
  dia?: string
}

export function esVista(valor: unknown): valor is VistaTraslados {
  return VISTAS.some((vista) => vista === valor)
}

function esDia(valor: unknown): valor is string {
  return typeof valor === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(valor)
}

/** `validateSearch` de la ruta: lo que llega inválido en la URL se descarta, como si no estuviera. */
export function validarBusquedaTraslados(busqueda: Record<string, unknown>): BusquedaTraslados {
  return {
    vista: esVista(busqueda.vista) ? busqueda.vista : undefined,
    dia: esDia(busqueda.dia) ? busqueda.dia : undefined,
  }
}
