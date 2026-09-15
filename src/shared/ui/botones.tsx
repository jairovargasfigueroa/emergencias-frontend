import { Button, styled } from 'tamagui'

/**
 * Botón de la acción principal de cada pantalla o diálogo: rojo de la marca. Su texto va con
 * `<Button.Text color="$primarioTexto">`.
 */
export const BotonPrimario = styled(Button, {
  bg: '$primario',
  borderColor: '$primario',
  hoverStyle: { bg: '$primarioPresionado', borderColor: '$primarioPresionado' },
  pressStyle: { bg: '$primarioPresionado', borderColor: '$primarioPresionado' },
  focusVisibleStyle: { outlineColor: '$primario' },
})
