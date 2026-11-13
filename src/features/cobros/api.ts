import { api } from '../../shared/api/cliente'
import type { EstadoAtencion } from '../../shared/atencion/api'

export type TipoServicio = 'EMERGENCIA' | 'TRASLADO'

export const MODALIDADES_PAGO = ['SEGURO_MEDICO', 'SOAT', 'PAGO_DIRECTO'] as const
export type ModalidadPago = (typeof MODALIDADES_PAGO)[number]

/** Anulado no se elige: se llega anulando, con su motivo. */
export const ESTADOS_ELEGIBLES = ['PENDIENTE', 'PAGADO'] as const
export type EstadoCobro = (typeof ESTADOS_ELEGIBLES)[number] | 'ANULADO'

/** `TarifaResponse` del backend. */
export type Tarifa = {
  id: number
  tipoServicio: TipoServicio
  monto: number
  /** `AAAA-MM-DD`. */
  vigenteDesde: string
  registradaPor: string
  fechaRegistro: string
}

/** `TarifasResponse` del backend: las que rigen hoy (null si nunca se cargó) y todas las registradas. */
export type Tarifas = {
  emergencia: Tarifa | null
  traslado: Tarifa | null
  historial: Tarifa[]
}

export type Cobro = {
  id: number
  modalidad: ModalidadPago
  importe: number
  estado: EstadoCobro
  registradoPor: string
  fechaRegistro: string
}

export type CambioDeCobro = {
  tipo: 'AJUSTE' | 'ANULACION'
  modalidadAnterior: ModalidadPago
  importeAnterior: number
  estadoAnterior: EstadoCobro
  modalidadNueva: ModalidadPago
  importeNuevo: number
  estadoNuevo: EstadoCobro
  motivo: string
  fechaHora: string
  responsable: string
}

/** `CobroDeServicioResponse` del backend: el cobro de una atención (PB-29). */
export type CobroDeServicio = {
  atencionId: number
  tipoServicio: TipoServicio
  estadoAtencion: EstadoAtencion
  /** Solo una atención terminada (paciente entregado o sin traslado) se cobra. */
  terminado: boolean
  paciente: string | null
  /** La que regía el día del servicio. Null si no había ninguna cargada. */
  tarifaDeReferencia: Tarifa | null
  /** Null mientras no se registró. */
  cobro: Cobro | null
  /** El más reciente primero. */
  cambios: CambioDeCobro[]
}

export type DatosDeCobro = { modalidad: ModalidadPago; importe: number; estado: 'PENDIENTE' | 'PAGADO' }

export const cobrosApi = {
  tarifas: (signal?: AbortSignal) => api.get<Tarifas>('/tarifas', signal),
  registrarTarifa: (datos: { tipoServicio: TipoServicio; monto: number; vigenteDesde: string }) =>
    api.post<Tarifas>('/tarifas', datos),
  delServicio: (atencionId: number, signal?: AbortSignal) =>
    api.get<CobroDeServicio>(`/cobros/servicios/${atencionId}`, signal),
  /** Falla con 409 `SERVICIO_NO_TERMINADO` o `COBRO_YA_REGISTRADO`. */
  registrar: (atencionId: number, datos: DatosDeCobro) =>
    api.post<CobroDeServicio>('/cobros', { atencionId, ...datos }),
  /** Pide motivo. Falla con 409 `COBRO_ANULADO`, o `TRANSICION_INVALIDA` si no cambió nada. */
  ajustar: (cobroId: number, datos: DatosDeCobro & { motivo: string }) =>
    api.put<CobroDeServicio>(`/cobros/${cobroId}`, datos),
  anular: (cobroId: number, motivo: string) => api.post<CobroDeServicio>(`/cobros/${cobroId}/anulacion`, { motivo }),
}
