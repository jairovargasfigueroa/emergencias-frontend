/**
 * Paleta del Sistema de Gestión de Ambulancias. Es la misma en el panel web y en las dos apps: cambiar un color
 * aquí lo cambia en toda la app. Se usa como token de Tamagui, por ejemplo `bg="$primario"`.
 */
export const coloresClaro = {
  primario: '#D92D20',
  primarioPresionado: '#B42318',
  primarioTinte: '#FDECEA',
  primarioTexto: '#FFFFFF',
  /**
   * Rojo para texto sobre la superficie o sobre `primarioTinte`: los avisos que piden una decisión. No es
   * `primarioPresionado` porque ese es también el fondo del botón al presionarlo, y en oscuro este va más claro.
   */
  primarioTinteTexto: '#B42318',

  fondo: '#F7F7F8',
  superficie: '#FFFFFF',
  borde: '#E7E7EA',
  bordeFuerte: '#D4D4D8',
  texto: '#18181B',
  textoSecundario: '#71717A',
  textoTenue: '#A1A1AA',

  disponible: '#16A34A',
  disponibleTinte: '#E8F5EC',
  // Un punto más oscuro que el verde de los pines: sobre su tinte, el #15803D quedaba en 4,47:1 y no llegaba al 4,5.
  disponibleTexto: '#166534',
  enAtencion: '#D97706',
  enAtencionTinte: '#FDF1E3',
  enAtencionTexto: '#B45309',
  fueraServicio: '#6B7280',
  fueraServicioTinte: '#F0F0F2',
  fueraServicioTexto: '#52525B',
  /** Relleno con texto blanco encima, como los pines del mapa: más oscuros que el color de estado para que el blanco se lea. */
  disponibleFuerte: '#15803D',
  enAtencionFuerte: '#B45309',

  velo: 'rgba(17, 17, 20, 0.55)',
}

export const coloresOscuro: typeof coloresClaro = {
  ...coloresClaro,
  primarioTinte: '#3A1614',
  primarioTinteTexto: '#F97066',

  fondo: '#111114',
  superficie: '#1A1A1F',
  borde: '#2A2A31',
  bordeFuerte: '#3F3F46',
  texto: '#F4F4F5',
  textoSecundario: '#A1A1AA',
  textoTenue: '#71717A',

  disponibleTinte: '#0F2E1C',
  disponibleTexto: '#4ADE80',
  enAtencionTinte: '#3A2508',
  enAtencionTexto: '#FBBF24',
  fueraServicioTinte: '#27272A',
  fueraServicioTexto: '#A1A1AA',

  velo: 'rgba(0, 0, 0, 0.6)',
}
