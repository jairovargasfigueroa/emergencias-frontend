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
  children: ReactNode
}

/** Tabla de datos. Tamagui no trae una: se arma con filas y celdas de ancho fijo o flexible. */
export function Tabla({ columnas, children }: PropsTabla) {
  return (
    <YStack role="table" bg="$superficie" borderWidth={1} borderColor="$borde" rounded={12} overflow="hidden">
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
      {children}
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
  children: ReactNode
}

/** Cada hijo es una celda, en el mismo orden que las columnas. */
export function FilaTabla({ columnas, atenuada = false, alto = 60, interactiva = false, children }: PropsFila) {
  const celdas = Children.toArray(children)
  return (
    <XStack
      role="row"
      items="center"
      minH={alto}
      px={12}
      py={8}
      borderTopWidth={1}
      borderColor="$borde"
      bg={atenuada ? '$fondo' : '$superficie'}
      cursor={interactiva ? 'pointer' : undefined}
      hoverStyle={interactiva ? { bg: '$fondo' } : undefined}
    >
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
