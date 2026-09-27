import type { ReactNode } from 'react'
import { Menu, XStack, YStack } from 'tamagui'
import { IconoAcciones } from './iconos'

export type AccionDeMenu = {
  etiqueta: string
  icono: ReactNode
  /** `peligro` para las bajas: se pintan en rojo para que no se elijan de paso. */
  tono?: 'normal' | 'peligro'
  /**
   * Por qué la acción no se puede hacer *ahora*. Con motivo, la acción se muestra apagada y con el motivo debajo,
   * en vez de dejarse afuera de la lista. Es para lo que sí se va a poder en otro momento: si quedara oculta, el
   * administrador buscaría una acción que sabe que existe y no la encontraría. Lo que no aplica nunca a esa fila
   * directamente no se pasa.
   */
  motivo?: string
  onElegir: () => void
}

type Props = {
  /**
   * Lo que oye quien usa un lector de pantalla al llegar al botón, por ejemplo "Acciones de Ana Quispe": con una
   * fila por persona, "Acciones" a secas no distingue una de otra.
   */
  etiqueta: string
  acciones: AccionDeMenu[]
}

/**
 * Menú "⋯" con las acciones de una fila. Quien lo usa arma la lista según la fila: lo que no aplica a esa fila no
 * se pasa, y lo que no se puede hacer todavía se pasa con `motivo` para que se vea apagado y explicado.
 *
 * `modal={false}` a propósito: el menú es un accesorio de la tabla, no una capa que tape la página. Así no se
 * bloquea el scroll ni se pelea el foco con los diálogos que abren estas mismas acciones.
 */
export function MenuAcciones({ etiqueta, acciones }: Props) {
  return (
    <Menu modal={false} placement="bottom-end" offset={6}>
      <Menu.Trigger
        width={32}
        height={32}
        items="center"
        justify="center"
        rounded={999}
        cursor="pointer"
        aria-label={etiqueta}
        hoverStyle={{ bg: '$fondo' }}
        pressStyle={{ bg: '$fondo' }}
      >
        <IconoAcciones size={18} />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Content
          key="content"
          minW={216}
          maxW={280}
          p={6}
          gap={2}
          rounded={12}
          bg="$superficie"
          borderWidth={1}
          borderColor="$borde"
          // `elevate` es una variante de `Dialog.Content`, no de `Menu.Content`: acá se escapaba al DOM y React
          // avisaba por consola. La sombra va a mano, con un negro translúcido que funciona sobre los dos temas
          // porque el tema no tiene token de sombra.
          shadowColor="rgba(15, 23, 42, 0.18)"
          shadowRadius={16}
          shadowOffset={{ width: 0, height: 4 }}
          transition="quick"
          enterStyle={{ opacity: 0, y: -6, scale: 0.97 }}
          exitStyle={{ opacity: 0, y: -6, scale: 0.97 }}
        >
          {acciones.map((accion) => {
            const apagada = accion.motivo !== undefined
            // Sin resaltado ni cursor de mano: lo que no se puede elegir tampoco tiene que parecer elegible. Se
            // pone en transparente en vez de omitirlo, porque omitirlo devolvería el resaltado que Tamagui trae
            // de fábrica en `Menu.Item`.
            const resaltado = { bg: apagada ? 'transparent' : '$fondo' } as const
            return (
              <Menu.Item
                key={accion.etiqueta}
                textValue={accion.etiqueta}
                disabled={apagada}
                onSelect={accion.onElegir}
                minH={36}
                py={apagada ? 8 : 0}
                px={10}
                gap={10}
                rounded={8}
                opacity={apagada ? 0.55 : 1}
                cursor={apagada ? 'default' : 'pointer'}
                hoverStyle={resaltado}
                focusStyle={resaltado}
                pressStyle={resaltado}
              >
                <XStack width={16} height={16} items="center" justify="center" shrink={0}>
                  {accion.icono}
                </XStack>
                <YStack flex={1} minW={0} gap={2}>
                  <Menu.ItemTitle
                    fontSize={14}
                    fontWeight="500"
                    color={accion.tono === 'peligro' ? '$primarioPresionado' : '$texto'}
                  >
                    {accion.etiqueta}
                  </Menu.ItemTitle>
                  {accion.motivo ? (
                    <Menu.ItemSubtitle fontSize={12} lineHeight={16} color="$textoSecundario">
                      {accion.motivo}
                    </Menu.ItemSubtitle>
                  ) : null}
                </YStack>
              </Menu.Item>
            )
          })}
        </Menu.Content>
      </Menu.Portal>
    </Menu>
  )
}
