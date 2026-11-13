import type { EstadoCobro, ModalidadPago, TipoServicio } from './api'

export const TEXTO_MODALIDAD: Record<ModalidadPago, string> = {
  SEGURO_MEDICO: 'Seguro médico',
  SOAT: 'SOAT',
  PAGO_DIRECTO: 'Pago directo',
}

export const DETALLE_MODALIDAD: Record<ModalidadPago, string> = {
  SEGURO_MEDICO: 'Lo cubre un seguro o un prepago.',
  SOAT: 'Accidente de tránsito.',
  PAGO_DIRECTO: 'Lo paga el paciente o su familia.',
}

export const TEXTO_ESTADO_COBRO: Record<EstadoCobro, string> = {
  PENDIENTE: 'Pendiente',
  PAGADO: 'Pagado',
  ANULADO: 'Anulado',
}

export const TEXTO_TIPO_SERVICIO: Record<TipoServicio, string> = {
  EMERGENCIA: 'Emergencia',
  TRASLADO: 'Traslado',
}

const FORMATO = new Intl.NumberFormat('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** "Bs 1.250,00". */
export function bolivianos(monto: number) {
  return `Bs ${FORMATO.format(monto)}`
}
