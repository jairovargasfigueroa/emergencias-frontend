import { api } from '../../shared/api/cliente'

/** `AsignacionVigenteResponse` del backend. */
export type AsignacionVigente = {
  asignacionId: number
  ambulanciaId: number
  placa: string
  fechaInicio: string
}

/** `ParamedicoResponse` del backend. */
export type Paramedico = {
  id: number
  nombreCompleto: string
  telefono: string
  activo: boolean
  asignacionVigente: AsignacionVigente | null
}

/** `RegistrarParamedicoRequest` del backend. */
export type RegistrarParamedico = {
  nombreCompleto: string
  telefono: string
}

export const personalApi = {
  listar: (signal?: AbortSignal) => api.get<Paramedico[]>('/paramedicos', signal),
  registrar: (datos: RegistrarParamedico) => api.post<Paramedico>('/paramedicos', datos),
  desactivar: (id: number) => api.post<Paramedico>(`/paramedicos/${id}/desactivar`),
}
