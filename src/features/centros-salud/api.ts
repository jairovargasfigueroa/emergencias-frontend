import { api } from '../../shared/api/cliente'

/** `CentroSaludResponse` del backend: un centro del catálogo, con su punto para ubicarlo en el mapa. */
export type CentroSalud = {
  id: number
  nombre: string
  direccion: string | null
  latitud: number
  longitud: number
}

export const centrosSaludApi = {
  /** Solo los activos, ordenados por nombre. */
  listar: (signal?: AbortSignal) => api.get<CentroSalud[]>('/centros-salud', signal),
}
