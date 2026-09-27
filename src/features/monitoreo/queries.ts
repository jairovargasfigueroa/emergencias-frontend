import { queryOptions } from '@tanstack/react-query'
import { ambulanciasQuery } from '../flota/queries'

/**
 * Cada cuánto se vuelve a pedir la flota. Por Firebase solo viaja la posición: el estado de cada unidad
 * (disponible, en atención, sin turno) llega únicamente por REST, así que hay que ir a buscarlo.
 */
const REFRESCO_MS = 20_000

/**
 * La flota tal como la mira el Centro de control. Comparte clave con la pantalla de flota a propósito: es el
 * mismo dato, y así un cambio hecho allá se ve acá sin pedirlo de nuevo. Lo único propio es el refresco, que
 * en TanStack Query es por observador y no le afecta a la otra pantalla.
 */
export const flotaEnVivoQuery = () =>
  queryOptions({
    ...ambulanciasQuery(),
    refetchInterval: REFRESCO_MS,
  })
