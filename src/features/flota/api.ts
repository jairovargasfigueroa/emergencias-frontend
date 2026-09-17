import { api } from '../../shared/api/cliente'

export type EstadoAmbulancia = 'DISPONIBLE' | 'EN_ATENCION' | 'FUERA_DE_SERVICIO'

/** `AmbulanciaResponse` del backend. */
export type Ambulancia = {
  id: number
  placa: string
  tipoUnidad: string
  estado: EstadoAmbulancia
  activa: boolean
}

/** `RegistrarAmbulanciaRequest` del backend. */
export type RegistrarAmbulancia = {
  placa: string
  tipoUnidad: string
}

export const ambulanciasApi = {
  listar: (signal?: AbortSignal) => api.get<Ambulancia[]>('/ambulancias', signal),
  registrar: (datos: RegistrarAmbulancia) => api.post<Ambulancia>('/ambulancias', datos),
  marcarFueraDeServicio: (id: number) => api.post<Ambulancia>(`/ambulancias/${id}/fuera-de-servicio`),
  reactivar: (id: number) => api.post<Ambulancia>(`/ambulancias/${id}/reactivar`),
  desactivar: (id: number) => api.post<Ambulancia>(`/ambulancias/${id}/desactivar`),
}
