import type {
  EstadoEvidencia,
  Fundamento,
  Modalidad,
  NivelDeGravedad,
  Peligro,
  TipoDeEvento,
  TipoDePuntoClave,
} from './api'

// Textos en español de los vocabularios del servicio de análisis. Se cambian solo aquí.

export const TEXTO_TIPO_DE_EVENTO: Record<TipoDeEvento, string> = {
  traffic_accident: 'Accidente de tránsito',
  fire: 'Incendio',
  explosion: 'Explosión',
  medical_emergency: 'Emergencia médica',
  fall_or_injury: 'Caída o lesión',
  violence: 'Hecho violento',
  drowning_or_flood: 'Ahogamiento o inundación',
  structural_collapse: 'Derrumbe',
  hazardous_material: 'Material peligroso',
  other: 'Otro',
  undetermined: 'Sin determinar',
}

export const TEXTO_PELIGRO: Record<Peligro, string> = {
  fire: 'Fuego',
  smoke: 'Humo',
  traffic: 'Tránsito',
  electrical: 'Riesgo eléctrico',
  gas_or_chemical: 'Gas o químicos',
  structural_instability: 'Estructura inestable',
  water: 'Agua',
  weapon_or_violence: 'Armas o violencia',
  crowd: 'Aglomeración',
  height: 'Altura',
  entrapment: 'Persona atrapada',
  other: 'Otro',
}

/** La etiqueta al lado de cada punto clave, para leerlos de un vistazo. */
export const TEXTO_TIPO_DE_PUNTO_CLAVE: Record<TipoDePuntoClave, string> = {
  what: 'Qué pasó',
  people: 'Personas',
  hazard: 'Peligro',
  critical: 'Crítico',
}

export const TEXTO_GRAVEDAD: Record<NivelDeGravedad, string> = {
  low: 'Gravedad baja',
  moderate: 'Gravedad moderada',
  high: 'Gravedad alta',
  undetermined: 'Gravedad sin determinar',
}

export const TEXTO_FUNDAMENTO: Record<Fundamento, string> = {
  observed: 'Observado',
  inferred: 'Deducido',
}

export const TEXTO_MODALIDAD: Record<Modalidad, string> = {
  IMAGEN: 'Foto',
  AUDIO: 'Audio',
  VIDEO: 'Video',
}

export const TEXTO_ESTADO_EVIDENCIA: Record<EstadoEvidencia, string> = {
  SUBIDA: 'En análisis',
  ANALIZADA: 'Analizada',
  FALLIDA: 'No se pudo analizar',
}

/**
 * Un valor fuera de la lista no debería llegar, pero si el servicio suma uno antes que el panel, se muestra tal cual
 * en vez de dejar el lugar vacío.
 */
export function textoDe<T extends string>(textos: Record<T, string>, valor: T): string {
  return textos[valor] ?? valor
}

/** "1 persona", "2 a 4 personas", "Ninguna persona". Null cuando no se puede decir. */
export function textoPersonas(personas: { min: number; max: number } | null): string | null {
  if (!personas) {
    return null
  }
  const { min, max } = personas
  if (max === 0) {
    return 'Ninguna persona'
  }
  if (min === max) {
    return min === 1 ? '1 persona' : `${min} personas`
  }
  return `${min} a ${max} personas`
}

/** "Humo · último reporte 10:20"; "Humo · sin novedades" si no se sabe cuándo se lo mencionó por última vez. */
export function textoPeligroSinConfirmar(peligro: string, ultimoReporte: string | null): string {
  return `${peligro} · ${ultimoReporte ? `último reporte ${ultimoReporte}` : 'sin novedades'}`
}

/** "Resuelto: fuego · según lo que contó Ana Pérez (10:40)". */
export function textoPeligroResuelto(peligro: string, fuentes: string[]): string {
  const resuelto = `Resuelto: ${peligro.toLowerCase()}`
  return fuentes.length > 0 ? `${resuelto} · según ${fuentes.join(', ')}` : resuelto
}

/** "corroborado por 1 alerta", "corroborado por 3 alertas". */
export function textoCorroboracion(alertas: number): string {
  return `corroborado por ${alertas} ${alertas === 1 ? 'alerta' : 'alertas'}`
}
