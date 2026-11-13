import { api } from '../../shared/api/cliente'
import type { EstadoAlerta, EstadoIncidente, MotivoCancelacionAlerta } from '../incidentes/api'

/** `CiudadanoConFalsasAlarmasResponse` del backend: una fila de la lista de mal uso. */
export type CiudadanoConFalsasAlarmas = {
  id: number
  nombre: string
  telefono: string
  activo: boolean
  falsasAlarmas: number
  ultimaFalsaAlarma: string
}

/** Una alerta cuyo incidente la central cerró como falsa alarma, con cómo se verificó. */
export type FalsaAlarma = {
  alertaId: number
  incidenteId: number
  fechaHora: string
  fundamento: string | null
  verificadaPor: string
  fechaCierre: string | null
  /** Si además el propio ciudadano la retiró, con qué motivo. */
  retiradaComo: MotivoCancelacionAlerta | null
}

/** Cualquier otra alerta del ciudadano: atendida, retirada por él o cerrada por otra causa. No es falsa alarma. */
export type OtraAlerta = {
  alertaId: number
  incidenteId: number
  fechaHora: string
  estado: EstadoAlerta
  motivoRetiro: MotivoCancelacionAlerta | null
  estadoIncidente: EstadoIncidente
}

export type TipoSancion = 'DESACTIVACION' | 'REACTIVACION'

export type Sancion = {
  tipo: TipoSancion
  motivo: string
  fechaHora: string
  administrador: string
}

/** `HistorialDeCiudadanoResponse` del backend: lo que se revisa antes de decidir sobre una cuenta. */
export type HistorialDeCiudadano = {
  id: number
  nombre: string
  telefono: string
  activo: boolean
  falsasAlarmas: FalsaAlarma[]
  otrasAlertas: OtraAlerta[]
  /** Lo más reciente primero. */
  sanciones: Sancion[]
}

export const malUsoApi = {
  /** Solo los que tienen al menos una falsa alarma verificada por la central; los que más tienen primero. */
  conFalsasAlarmas: (signal?: AbortSignal) =>
    api.get<CiudadanoConFalsasAlarmas[]>('/ciudadanos/falsas-alarmas', signal),
  historial: (id: number, signal?: AbortSignal) =>
    api.get<HistorialDeCiudadano>(`/ciudadanos/${id}/historial`, signal),
  /** Cierra sus sesiones en el acto. Falla con 409 `TRANSICION_INVALIDA` si ya estaba desactivada. */
  desactivar: (id: number, motivo: string) =>
    api.post<HistorialDeCiudadano>(`/ciudadanos/${id}/desactivacion`, { motivo }),
  /** Falla con 409 `TRANSICION_INVALIDA` si ya estaba activa. */
  reactivar: (id: number, motivo: string) =>
    api.post<HistorialDeCiudadano>(`/ciudadanos/${id}/reactivacion`, { motivo }),
}
