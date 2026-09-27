import type { ReactNode } from 'react'
import { Button, Menu, XStack } from 'tamagui'
import { IconoAcciones } from './iconos'

export type AccionDeMenu = {
  etiqueta: string
  icono: ReactNode
  /** `peligro` para las bajas: se pintan en rojo para que no se elijan de paso. */
  tono?: 'normal' | 'peligro'
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
 * Menú "⋯" con las acciones de una fila. Quien lo usa arma la lista según la fila: una acción que no se puede
 * hacer no se pasa, en vez de mostrarse apagada.
 *
 * `modal={false}` a propósito: el menú es un accesorio de la tabla, no una capa que tape la página. Así no se
 * bloquea el scroll ni se pelea el foco con los diálogos que abren estas mismas acciones.
 */
export function MenuAcciones({ etiqueta, acciones }: Props) {
  return (
    <Menu modal={false} placement="bottom-end" offset={6}>
      <Menu.Trigger asChild>
        <Button size="$3" circular chromeless aria-label={etiqueta} icon={<IconoAcciones size={18} />} />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Content
          key="content"
          minW={216}
          p={6}
          gap={2}
          rounded={12}
          bg="$superficie"
          borderWidth={1}
          borderColor="$borde"
          elevate
          transition="quick"
          enterStyle={{ opacity: 0, y: -6, scale: 0.97 }}
          exitStyle={{ opacity: 0, y: -6, scale: 0.97 }}
        >
          {acciones.map((accion) => (
            <Menu.Item
              key={accion.etiqueta}
              textValue={accion.etiqueta}
              onSelect={accion.onElegir}
              height={36}
              px={10}
              gap={10}
              rounded={8}
              cursor="pointer"
              hoverStyle={{ bg: '$fondo' }}
              focusStyle={{ bg: '$fondo' }}
              pressStyle={{ bg: '$fondo' }}
            >
              <XStack width={16} height={16} items="center" justify="center" shrink={0}>
                {accion.icono}
              </XStack>
              <Menu.ItemTitle
                fontSize={14}
                fontWeight="500"
                color={accion.tono === 'peligro' ? '$primarioPresionado' : '$texto'}
              >
                {accion.etiqueta}
              </Menu.ItemTitle>
            </Menu.Item>
          ))}
        </Menu.Content>
      </Menu.Portal>
    </Menu>
  )
}
