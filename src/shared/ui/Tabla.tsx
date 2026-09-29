import { Children, type ReactNode } from 'react'
import { Text, XStack, YStack } from 'tamagui'

export type ColumnaTabla = {
  titulo: string
  /** Ancho fijo en píxeles. Sin ancho, la columna ocupa el espacio que sobra. */
  ancho?: number
  alinearDerecha?: boolean
}

type PropsTabla = {
  columnas: ColumnaTabla[]
  /**
   * Alto fijo del panel. Con él, el encabezado se queda quieto y las filas scrollean adentro, así la tabla no
   * empuja la página hacia abajo. Sin él, la tabla crece con su contenido, que es lo que quieren las pantallas
   * de listado.
   */
  alto?: number
  children: ReactNode
}

/** Tabla de datos. Tamagui no trae una: se arma con filas y celdas de ancho fijo o flexible. */
export function Tabla({ columnas, alto, children }: PropsTabla) {
  return (
    <YStack role="table" height={alto} bg="$superficie" borderWidth={1} borderColor="$borde" rounded={12} overflow="hidden">
      <XStack role="row" items="center" height={44} px={12} bg="$fondo">
        {columnas.map((columna) => (
          <XStack
            key={columna.titulo}
            role="columnheader"
            px={12}
            width={columna.ancho}
            flex={columna.ancho ? undefined : 1}
            minW={0}
            justify={columna.alinearDerecha ? 'flex-end' : 'flex-start'}
          >
            <Text fontSize={12} lineHeight={16} fontWeight="500" color="$textoSecundario">
              {columna.titulo}
            </Text>
          </XStack>
        ))}
      </XStack>
      {alto ? (
        <YStack flex={1} minH={0} overflow="scroll">
          {children}
        </YStack>
      ) : (
        children
      )}
    </YStack>
  )
}

type PropsFila = {
  columnas: ColumnaTabla[]
  /** Fila de un registro dado de baja: se muestra con menos contraste. */
  atenuada?: boolean
  alto?: number
  /** Fila que abre algo al tocarla, por ejemplo envuelta en un `Link`: se resalta al pasar el puntero. */
  interactiva?: boolean
  /**
   * Lo que no entra en ninguna columna y se lee junto con la fila, como un aviso con su acción. Va debajo de las
   * celdas, a todo el ancho y dentro de la misma fila: se resalta con ella y, si la fila es un enlace, abre lo mismo.
   */
  pie?: ReactNode
  children: ReactNode
}

/** Cada hijo es una celda, en el mismo orden que las columnas. */
export function FilaTabla({ columnas, atenuada = false, alto = 60, interactiva = false, pie, children }: PropsFila) {
  const celdas = Children.toArray(children)
  return (
    <YStack
      role="row"
      borderTopWidth={1}
      borderColor="$borde"
      bg={atenuada ? '$fondo' : '$superficie'}
      cursor={interactiva ? 'pointer' : undefined}
      hoverStyle={interactiva ? { bg: '$fondo' } : undefined}
    >
      <XStack items="center" minH={alto} px={12} py={8}>
        {columnas.map((columna, indice) => (
          <XStack
            key={columna.titulo}
            role="cell"
            px={12}
            width={columna.ancho}
            flex={columna.ancho ? undefined : 1}
            minW={0}
            items="center"
            justify={columna.alinearDerecha ? 'flex-end' : 'flex-start'}
            gap={6}
          >
            {celdas[indice]}
          </XStack>
        ))}
      </XStack>
      {/* Alineado con el texto de la primera celda: el relleno de la fila más el de la celda. */}
      {pie ? (
        <XStack items="center" px={24} pb={12}>
          {pie}
        </XStack>
      ) : null}
    </YStack>
  )
}

/** Mensaje centrado dentro de la tabla cuando no hay filas. */
export function TablaVacia({ children }: { children: ReactNode }) {
  return (
    <YStack items="center" justify="center" py={40} px={24} borderTopWidth={1} borderColor="$borde">
      <Text fontSize={14} color="$textoSecundario">
        {children}
      </Text>
    </YStack>
  )
}
