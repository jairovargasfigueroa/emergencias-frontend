import type {
  EstadoAlerta,
  EstadoIncidente,
  FiltroEstadoIncidente,
  MotivoCancelacionAlerta,
  MotivoCierreIncidente,
  OrigenUbicacion,
} from './api'

// Textos en español de los valores que llegan del backend. Se cambian solo aquí.

export const TEXTO_FILTRO: Record<FiltroEstadoIncidente, string> = {
  ABIERTOS: 'Abiertos',
  CERRADOS: 'Cerrados',
  TODOS: 'Todos',
}

export const TEXTO_ESTADO_INCIDENTE: Record<EstadoIncidente, string> = {
  ACTIVO: 'Activo',
  EN_ATENCION: 'En atención',
  ATENDIDO: 'Atendido',
  FALSA_ALARMA: 'Falsa alarma',
  ATENDIDO_EXTERNAMENTE: 'Atendido externamente',
  CANCELADO: 'Cancelado',
}

export const TEXTO_MOTIVO_CIERRE: Record<MotivoCierreIncidente, string> = {
  FALSA_ALARMA_VERIFICADA: 'Falsa alarma verificada',
  ATENDIDO_EXTERNAMENTE: 'Atendido o derivado externamente',
  SIN_COBERTURA: 'Sin cobertura',
  OTRO: 'Otro motivo',
}

/**
 * Los mismos motivos, como se ofrecen al cerrar un incidente a mano: dichos como los diría el despachador y con lo que
 * quiere decir cada uno. Ya cerrado, el detalle lo cuenta con `TEXTO_MOTIVO_CIERRE`.
 */
export const OPCION_MOTIVO_CIERRE: Record<MotivoCierreIncidente, { titulo: string; detalle: string | null }> = {
  FALSA_ALARMA_VERIFICADA: { titulo: 'Falsa alarma', detalle: 'Se comprobó que no había ninguna emergencia.' },
  ATENDIDO_EXTERNAMENTE: {
    titulo: 'Lo atendieron por otro medio',
    detalle: 'Lo llevaron por su cuenta, llegó otra ambulancia o lo derivaron.',
  },
  SIN_COBERTURA: { titulo: 'Sin cobertura', detalle: 'No hay ninguna unidad que pueda ir.' },
  OTRO: { titulo: 'Otro', detalle: null },
}

export const TEXTO_ESTADO_ALERTA: Record<EstadoAlerta, string> = {
  RECIBIDA: 'Recibida',
  VINCULADA: 'Vinculada',
  CANCELADA: 'Cancelada',
  DESCARTADA: 'Descartada',
}

/**
 * Por qué el ciudadano retiró su pedido. Son las opciones de la app ("Ya no hace falta") contadas en tercera persona,
 * como registro de lo que pasó. La app no ofrece falsa alarma, pero el backend la acepta.
 */
export const TEXTO_MOTIVO_CANCELACION_ALERTA: Record<MotivoCancelacionAlerta, string> = {
  YA_FUE_ATENDIDO: 'Ya lo estaban atendiendo',
  FALSA_ALARMA: 'Era una falsa alarma',
  ERROR: 'Pidió ayuda por error',
  OTRO: 'Ya no hacía falta',
}

/** La respuesta a "¿Quién necesitaba la ambulancia?", que la app pregunta al retirar el pedido. */
export function textoEmisorEsPaciente(emisorEsPaciente: boolean): string {
  return emisorEsPaciente ? 'Quien avisó era el paciente' : 'Avisó por otra persona'
}

export const TEXTO_ORIGEN_UBICACION: Record<OrigenUbicacion, string> = {
  GPS: 'GPS',
  MANUAL: 'Marcada en el mapa',
}
