import { api } from '../../shared/api/cliente'
import type { AsignacionVigente } from '../personal/api'

/** `AsignacionResponse` del backend. */
export type Asignacion = {
  id: number
  paramedicoId: number
  paramedicoNombre: string
  ambulanciaId: number
  placa: string
  fechaInicio: string
  fechaFin: string | null
  vigente: boolean
}

/** `AsignarParamedicoRequest` del backend. */
export type AsignarParamedico = {
  paramedicoId: number
  ambulanciaId: number
  confirmarReasignacion?: boolean
}

/** Cuerpo del 409 `REASIGNACION_REQUIERE_CONFIRMACION`: trae la asignación vigente. */
export type ContextoReasignacion = {
  asignacionVigente: AsignacionVigente
}

export const asignacionesApi = {
  asignar: (datos: AsignarParamedico) => api.post<Asignacion>('/asignaciones', datos),
  historialDeAmbulancia: (ambulanciaId: number, signal?: AbortSignal) =>
    api.get<Asignacion[]>(`/ambulancias/${ambulanciaId}/asignaciones`, signal),
  historialDeParamedico: (paramedicoId: number, signal?: AbortSignal) =>
    api.get<Asignacion[]>(`/paramedicos/${paramedicoId}/asignaciones`, signal),
}
