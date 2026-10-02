import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState, useSyncExternalStore } from 'react'
import { escucharResumen, escucharResumenes, type VersionesDeResumen } from './api'
import { resumenIaKeys } from './queries'

/**
 * Mantiene al día el resumen de un incidente: escucha su aviso en Firebase y, cuando la versión publicada es más
 * nueva que la que se está mostrando, vuelve a pedirlo por REST.
 *
 * Se compara contra la versión mostrada, y no solo se reacciona al cambio, porque el aviso puede llegar mientras la
 * primera consulta todavía está en camino y traer una versión que esa consulta no alcanzó a ver.
 *
 * Sin Firebase configurado no hay avisos: el resumen se ve igual, y se actualiza con el botón de la página.
 */
export function useAvisoDeResumen(incidenteId: number, versionMostrada: number | null | undefined) {
  const queryClient = useQueryClient()
  const [publicada, setPublicada] = useState<{ incidenteId: number; version: number | null } | null>(null)

  useEffect(() => {
    return escucharResumen(
      incidenteId,
      (version) => setPublicada({ incidenteId, version }),
      () => {},
    )
  }, [incidenteId])

  const version = publicada?.incidenteId === incidenteId ? publicada.version : null
  useEffect(() => {
    // `undefined` es que la consulta todavía no respondió: cuando lo haga ya trae lo último.
    if (version !== null && versionMostrada !== undefined && version > (versionMostrada ?? 0)) {
      void queryClient.invalidateQueries({ queryKey: resumenIaKeys.delIncidente(incidenteId) })
    }
  }, [version, versionMostrada, incidenteId, queryClient])
}

export type ResumenesPublicados = {
  cargando: boolean
  error: boolean
  versiones: VersionesDeResumen
}

const SIN_RESUMENES: ResumenesPublicados = { cargando: true, error: false, versiones: new Map() }

let resumenesActuales = SIN_RESUMENES
const oyentes = new Set<() => void>()
let cortarEscucha: (() => void) | null = null

/**
 * Qué incidentes tienen resumen, en vivo. Un solo listener de Firebase para todas las listas que lo muestran, que se
 * corta cuando ninguna está en pantalla. Si Firebase no está, no se marca ninguno: es un dato de más, no uno que
 * haga falta para trabajar.
 */
export function useResumenesPublicados() {
  return useSyncExternalStore(suscribir, () => resumenesActuales)
}

function suscribir(oyente: () => void) {
  oyentes.add(oyente)
  if (!cortarEscucha) {
    cortarEscucha = escucharResumenes(
      (versiones) => publicar({ cargando: false, error: false, versiones }),
      () => publicar({ ...resumenesActuales, cargando: false, error: true }),
    )
  }
  return () => {
    oyentes.delete(oyente)
    if (oyentes.size === 0 && cortarEscucha) {
      cortarEscucha()
      cortarEscucha = null
      resumenesActuales = SIN_RESUMENES
    }
  }
}

function publicar(siguiente: ResumenesPublicados) {
  resumenesActuales = siguiente
  oyentes.forEach((oyente) => oyente())
}
