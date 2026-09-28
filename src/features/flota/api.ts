import { api } from '../../shared/api/cliente'

export type EstadoAmbulancia = 'SIN_TURNO' | 'DISPONIBLE' | 'EN_ATENCION' | 'FUERA_DE_SERVICIO'

/**
 * Clasificación de la Norma Nacional de Ambulancias Terrestres (N° 430). En este orden se eligen, que es el de
 * menor a mayor capacidad.
 */
export const TIPOS_UNIDAD = ['IA', 'IB', 'II', 'III'] as const

export type TipoUnidad = (typeof TIPOS_UNIDAD)[number]

export const TEXTO_TIPO_UNIDAD: Record<TipoUnidad, string> = {
  IA: 'Tipo IA · Transporte simple',
  IB: 'Tipo IB · Rescate',
  II: 'Tipo II · Soporte vital básico',
  III: 'Tipo III · Soporte vital avanzado',
}

/** Para tablas y listas, donde no entra el nombre completo. */
export const TIPO_UNIDAD_CORTO: Record<TipoUnidad, string> = {
  IA: 'Tipo IA',
  IB: 'Tipo IB',
  II: 'Tipo II',
  III: 'Tipo III',
}

export const DETALLE_TIPO_UNIDAD: Record<TipoUnidad, string> = {
  IA: 'Paciente estable que camina o va en silla de ruedas, sin atención durante el viaje.',
  IB: 'Rescate y salvataje. No entra en el reparto de traslados.',
  II: 'Camilla, oxígeno y dos paramédicos.',
  III: 'Monitor, medicación y vía, para pacientes inestables.',
}

/** `AmbulanciaResponse` del backend. */
export type Ambulancia = {
  id: number
  placa: string
  tipoUnidad: TipoUnidad
  estado: EstadoAmbulancia
  activa: boolean
}

/** `RegistrarAmbulanciaRequest` del backend. */
export type RegistrarAmbulancia = {
  placa: string
  tipoUnidad: TipoUnidad
}

/** `EditarAmbulanciaRequest` del backend: lo único que se corrige de una ambulancia. */
export type EditarAmbulancia = {
  placa: string
  tipoUnidad: TipoUnidad
}

export const ambulanciasApi = {
  listar: (signal?: AbortSignal) => api.get<Ambulancia[]>('/ambulancias', signal),
  registrar: (datos: RegistrarAmbulancia) => api.post<Ambulancia>('/ambulancias', datos),
  editar: (id: number, datos: EditarAmbulancia) => api.put<Ambulancia>(`/ambulancias/${id}`, datos),
  marcarFueraDeServicio: (id: number) => api.post<Ambulancia>(`/ambulancias/${id}/fuera-de-servicio`),
  reactivar: (id: number) => api.post<Ambulancia>(`/ambulancias/${id}/reactivar`),
  desactivar: (id: number) => api.post<Ambulancia>(`/ambulancias/${id}/desactivar`),
  activar: (id: number) => api.post<Ambulancia>(`/ambulancias/${id}/activar`),
}
