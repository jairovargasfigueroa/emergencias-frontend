import { Children, type ReactNode } from 'react'
import { Text, XStack, YStack } from 'tamagui'

export type ColumnaTabla = {
  titulo: string
  /** Ancho fijo en píxeles. Sin ancho, la columna ocupa el espacio que sobra. */
  ancho?: number
  /**
   * Para una columna sin ancho fijo: por debajo de esto no se aplasta, y si la tabla ya no entra, scrollea de
   * costado. Sin él, 160 px.
   */
  anchoMinimo?: number
  alinearDerecha?: boolean
  /**
   * Se esconde por debajo de 1280 px, donde el menú se pliega y la tabla pierde ancho. Solo para columnas que se
   * deducen de otra o que se pueden consultar en el detalle: nunca la que identifica la fila.
   */
  ocultarEnPantallaChica?: boolean
}

/** Lo que mide como mínimo una columna sin ancho fijo antes de que la tabla pase a scrollear de costado. */
const ANCHO_MINIMO_FLEXIBLE = 160

/** El relleno de cada fila, a los dos lados (`px={12}`). */
const RELLENO_FILA = 24

/**
 * Lo mínimo que necesita la tabla para que ninguna columna se aplaste. Si el contenedor es más angosto, la tabla
 * scrollea de costado en vez de cortar las celdas, que es lo que hacía antes: los datos desaparecían sin aviso.
 */
function anchoMinimoDeLaTabla(columnas: ColumnaTabla[], compacta: boolean): number {
  return columnas
    .filter((columna) => !(compacta && columna.ocultarEnPantallaChica))
    .reduce((suma, columna) => suma + (columna.ancho ?? columna.anchoMinimo ?? ANCHO_MINIMO_FLEXIBLE), RELLENO_FILA)
}

/** Las propiedades que comparten el encabezado y las celdas de una misma columna, para que nunca se desalineen. */
function propsDeColumna(columna: ColumnaTabla) {
  return {
    width: columna.ancho,
    flex: columna.ancho ? undefined : 1,
    minW: columna.ancho ? 0 : (columna.anchoMinimo ?? ANCHO_MINIMO_FLEXIBLE),
    justify: columna.alinearDerecha ? ('flex-end' as const) : ('flex-start' as const),
    '$max-xl': columna.ocultarEnPantallaChica ? { display: 'none' as const } : undefined,
  }
}

type PropsTabla = {
  columnas: ColumnaTabla[]
  /**
   * Alto fijo del panel. Con él, el encabezado se queda quieto y las filas scrollean adentro, así la tabla no
   * empuja la página hacia abajo. Sin él, la tabla crece con su contenido, que es lo que quieren las pantallas
   * de listado.
   */
  alto?: number
  /** Ocupa el alto que le da el contenedor, con el encabezado quieto y las filas scrolleando adentro. */
  llenar?: boolean
  children: ReactNode
}

/**
 * Tabla de datos. Tamagui no trae una: se arma con filas y celdas de ancho fijo o flexible. Cuando no entra en su
 * contenedor scrollea de costado, con el encabezado y las filas juntos.
 */
export function Tabla({ columnas, alto, llenar = false, children }: PropsTabla) {
  const filasAdentro = alto !== undefined || llenar
  return (
    <YStack
      role="table"
      height={alto}
      flex={llenar ? 1 : undefined}
      minH={llenar ? 0 : undefined}
      bg="$superficie"
      borderWidth={1}
      borderColor="$borde"
      rounded={12}
      overflow="hidden"
    >
      {/* `auto` y no `scroll`: en Windows `scroll` deja la barra siempre a la vista, haya o no qué desplazar. */}
      <YStack flex={filasAdentro ? 1 : undefined} minH={filasAdentro ? 0 : undefined} overflowX="auto">
        <YStack
          flex={filasAdentro ? 1 : undefined}
          minH={filasAdentro ? 0 : undefined}
          minW={anchoMinimoDeLaTabla(columnas, false)}
          $max-xl={{ minW: anchoMinimoDeLaTabla(columnas, true) }}
        >
          <XStack role="row" items="center" height={44} px={12} bg="$fondo">
            {columnas.map((columna) => (
              <XStack key={columna.titulo} role="columnheader" px={12} {...propsDeColumna(columna)}>
                <Text fontSize={12} lineHeight={16} fontWeight="500" color="$textoSecundario">
                  {columna.titulo}
                </Text>
              </XStack>
            ))}
          </XStack>
          {filasAdentro ? (
            <YStack flex={1} minH={0} overflowY="auto">
              {children}
            </YStack>
          ) : (
            children
          )}
        </YStack>
      </YStack>
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
          <XStack key={columna.titulo} role="cell" px={12} items="center" gap={6} {...propsDeColumna(columna)}>
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
