import { api } from '../../shared/api/cliente'

// Los vocabularios cerrados los fija el servicio de análisis (emergencias-mia): el backend guarda su resumen tal cual,
// sin traducir ni renombrar. El texto en castellano lo arma el panel (ver `textos.ts`).

export type TipoDeEvento =
  | 'traffic_accident'
  | 'fire'
  | 'explosion'
  | 'medical_emergency'
  | 'fall_or_injury'
  | 'violence'
  | 'drowning_or_flood'
  | 'structural_collapse'
  | 'hazardous_material'
  | 'other'
  | 'undetermined'

export type Peligro =
  | 'fire'
  | 'smoke'
  | 'traffic'
  | 'electrical'
  | 'gas_or_chemical'
  | 'structural_instability'
  | 'water'
  | 'weapon_or_violence'
  | 'crowd'
  | 'height'
  | 'other'

/**
 * `undetermined` no es "baja": es que no hubo con qué justificar una gravedad. El servicio degrada a esta cualquier
 * gravedad que llegue sin observaciones que la respalden.
 */
export type NivelDeGravedad = 'low' | 'moderate' | 'high' | 'undetermined'

/** Si la afirmación se vio en una evidencia o se dedujo de lo que se vio. */
export type Fundamento = 'observed' | 'inferred'

/**
 * Un hallazgo, riesgo o contradicción, con las fuentes que cita. `corroboratingAlerts` cuenta alertas distintas que
 * lo respaldan, sumando las de las evidencias citadas: lo calcula el servicio, no el modelo, y es la medida de
 * respaldo que se muestra en lugar de una confianza inventada.
 */
export type Afirmacion = {
  text: string
  evidenceIds: number[]
  alertIds: number[]
  corroboratingAlerts: number
  /** Solo en los hallazgos. */
  basis?: Fundamento
}

/** Orientación preliminar, nunca triaje. `basis` son las razones, de la más importante a la menos. */
export type Gravedad = {
  level: NivelDeGravedad
  basis: string[]
}

/** El objeto `summary` del servicio de análisis. */
export type ResumenIa = {
  summary: string
  eventType: TipoDeEvento
  /** Null si no se puede decir cuántas personas hay. */
  people: { min: number; max: number } | null
  hazards: Peligro[]
  findings: Afirmacion[]
  risks: Afirmacion[]
  severity: Gravedad
  conflicts: Afirmacion[]
  limitations: string[]
}

export type Modalidad = 'IMAGEN' | 'AUDIO' | 'VIDEO'

/**
 * El backend solo devuelve las que ya llegaron al almacén: SUBIDA (esperando o en análisis), ANALIZADA y FALLIDA.
 * Las que no terminaron de subirse o se descartaron no aparecen.
 */
export type EstadoEvidencia = 'SUBIDA' | 'ANALIZADA' | 'FALLIDA'

/** `EvidenciaResponse` del backend. */
export type EvidenciaDelIncidente = {
  evidenciaId: number
  alertaId: number
  modalidad: Modalidad
  estado: EstadoEvidencia
}

/**
 * `ResumenIncidenteResponse` del backend: la versión vigente del resumen y las evidencias del incidente. Mientras no
 * haya ningún resumen, `version`, `resumen` y `generadoEn` vienen nulos, y las evidencias se pueden ver igual.
 */
export type ResumenDelIncidente = {
  incidenteId: number
  version: number | null
  resumen: ResumenIa | null
  /** Las evidencias y alertas que se tuvieron en cuenta para esta versión. */
  evidenciasUsadas: number[]
  alertasUsadas: number[]
  /** `single_evidence` cuando había una sola evidencia y se armó sin llamar al modelo. */
  metodo: string | null
  modelo: string | null
  versionPrompt: string | null
  generadoEn: string | null
  evidencias: EvidenciaDelIncidente[]
}

/** `LecturaEvidenciaResponse` del backend: una URL firmada que sirve hasta `venceEn`. */
export type LecturaEvidencia = {
  url: string
  venceEn: string
}

export const resumenIaApi = {
  /** 404 si el incidente no existe; si existe y no tiene resumen todavía, responde igual, con el resumen nulo. */
  resumen: (incidenteId: number, signal?: AbortSignal) =>
    api.get<ResumenDelIncidente>(`/incidentes/${incidenteId}/resumen`, signal),
  /** El archivo se lee directo del almacén con esta URL, sin pasar por el backend ni llevar el token. */
  lectura: (evidenciaId: number, signal?: AbortSignal) =>
    api.get<LecturaEvidencia>(`/evidencias/${evidenciaId}/url`, signal),
}
