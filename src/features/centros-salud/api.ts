import { api } from '../../shared/api/cliente'

/** `CentroSaludResponse` del backend: un centro del catálogo, con su punto para ubicarlo en el mapa. */
export type CentroSalud = {
  id: number
  nombre: string
  direccion: string | null
  latitud: number
  longitud: number
  /** Dado de baja deja de ofrecerse como destino, pero lo que ya se entregó ahí sigue apuntándolo. */
  activo: boolean
}

/** `GuardarCentroSaludRequest` del backend: lo mismo sirve para registrar y para corregir. */
export type GuardarCentroSalud = {
  nombre: string
  direccion: string | null
  latitud: number
  longitud: number
}

export const centrosSaludApi = {
  /** Solo los activos, ordenados por nombre. */
  listar: (signal?: AbortSignal) => api.get<CentroSalud[]>('/centros-salud', signal),
  /** Todos, también los dados de baja: primero los activos y por nombre. */
  listarTodos: (signal?: AbortSignal) => api.get<CentroSalud[]>('/centros-salud/todos', signal),
  registrar: (datos: GuardarCentroSalud) => api.post<CentroSalud>('/centros-salud', datos),
  corregir: (id: number, datos: GuardarCentroSalud) => api.put<CentroSalud>(`/centros-salud/${id}`, datos),
  desactivar: (id: number) => api.post<CentroSalud>(`/centros-salud/${id}/desactivar`),
  activar: (id: number) => api.post<CentroSalud>(`/centros-salud/${id}/activar`),
}
