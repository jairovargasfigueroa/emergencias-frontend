import { createSystemFont, createV5Theme, defaultConfig } from '@tamagui/config/v5'
import { animations } from '@tamagui/config/v5-css'
import { createTamagui } from 'tamagui'
import { coloresClaro, coloresOscuro } from './tema/colores'

const PLEX_SANS = '"IBM Plex Sans", system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif'
const PLEX_MONO = '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'

const fonts = {
  body: createSystemFont({ font: { family: PLEX_SANS } }),
  heading: createSystemFont({
    font: { family: PLEX_SANS, weight: { 0: '600' } },
    sizeLineHeight: (tamano) => Math.round(tamano * 1.12 + 5),
  }),
  mono: createSystemFont({ font: { family: PLEX_MONO } }),
}

// Escala de 12 pasos que usa la plantilla v5 para $background, $borderColor, $color y los temas de Button e Input.
// Los colores de marca exactos llegan aparte por getTheme.
const paletaClara = [
  '#FFFFFF', '#F7F7F8', '#EFEFF1', '#E7E7EA', '#D4D4D8', '#BDBDC4',
  '#A1A1AA', '#8B8B94', '#71717A', '#52525B', '#3F3F46', '#18181B',
]
const paletaOscura = [
  '#0B0B0E', '#111114', '#1A1A1F', '#2A2A31', '#3F3F46', '#52525B',
  '#71717A', '#8B8B94', '#A1A1AA', '#D4D4D8', '#E4E4E7', '#F4F4F5',
]

const themes = createV5Theme({
  lightPalette: paletaClara,
  darkPalette: paletaOscura,
  getTheme: ({ scheme }) => (scheme === 'dark' ? coloresOscuro : coloresClaro),
})

export const config = createTamagui({
  ...defaultConfig,
  animations,
  fonts,
  themes,
  settings: {
    ...defaultConfig.settings,
    disableSSR: true,
    onlyAllowShorthands: false,
  },
})

export type ConfigTamagui = typeof config

declare module 'tamagui' {
  interface TamaguiCustomConfig extends ConfigTamagui {}
}

export default config
