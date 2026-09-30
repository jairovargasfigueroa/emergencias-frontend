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
  /** Tiene un turno abierto ahora, en la unidad que tiene asignada. */
  enTurno: boolean
  /** Ya tiene PIN y un teléfono vinculado: puede entrar a su app. Si no, le falta un código de activación. */
  activado: boolean
  /** Su PIN se bloqueó por intentos fallidos: no entra a su app hasta que se le genere un código nuevo. */
  bloqueado: boolean
}

/**
 * `CodigoActivacionResponse` del backend: el código que la central le entrega en persona al paramédico. Solo viene en
 * la respuesta que lo genera, porque el servidor lo guarda cifrado y no lo puede volver a mostrar.
 */
export type CodigoActivacion = {
  /** Con el formato `XXXX-XXXX`. */
  codigo: string
  /** Instante ISO-8601 en UTC. */
  venceEn: string
}

/** `RegistrarParamedicoRequest` del backend. */
export type RegistrarParamedico = {
  nombreCompleto: string
  telefono: string
}

/** `EditarParamedicoRequest` del backend: lo único que se corrige de un paramédico. */
export type EditarParamedico = {
  nombreCompleto: string
  telefono: string
}

export const personalApi = {
  listar: (signal?: AbortSignal) => api.get<Paramedico[]>('/paramedicos', signal),
  registrar: (datos: RegistrarParamedico) => api.post<Paramedico>('/paramedicos', datos),
  editar: (id: number, datos: EditarParamedico) => api.put<Paramedico>(`/paramedicos/${id}`, datos),
  desactivar: (id: number) => api.post<Paramedico>(`/paramedicos/${id}/desactivar`),
  activar: (id: number) => api.post<Paramedico>(`/paramedicos/${id}/activar`),
  /** Le cierra el turno a quien se fue sin cerrarlo. Responde con el paramédico ya fuera de turno. */
  cerrarTurno: (id: number) => api.post<Paramedico>(`/paramedicos/${id}/turno/cierre`),
  /**
   * El código con que activa su app en un teléfono y crea su PIN. Sirve una sola vez, vence en 24 horas y reemplaza
   * al anterior que no haya usado.
   */
  generarCodigoActivacion: (id: number) => api.post<CodigoActivacion>(`/paramedicos/${id}/activacion`),
}
