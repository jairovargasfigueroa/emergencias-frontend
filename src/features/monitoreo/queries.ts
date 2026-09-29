import { mutationOptions, queryOptions, type QueryClient } from '@tanstack/react-query'
import { codigoDeError } from '../../shared/api/cliente'
import { flotaKeys } from '../flota/queries'
import { incidentesKeys } from '../incidentes/queries'
import { trasladosKeys } from '../traslados/queries'
import { operacionApi, type CerrarAtencion } from './api'

/**
 * Cada cuánto se vuelve a pedir la operación. Por Firebase solo viajan la posición y los incidentes abiertos: el
 * estado de cada unidad, su tripulación y la bitácora llegan únicamente por REST, así que hay que ir a buscarlos.
 */
const REFRESCO_MS = 20_000

/**
 * Clave propia. Antes esta pantalla reusaba la de la flota porque miraba `/ambulancias`; ahora mira `/operacion`,
 * que es otro endpoint y trae otra cosa: escribir en la clave de la flota dejaría a la pantalla de Flota leyendo
 * unidades que no tienen la forma que espera.
 */
export const operacionKeys = {
  todo: ['operacion'] as const,
  estadoActual: () => [...operacionKeys.todo, 'estado-actual'] as const,
}

export const operacionQuery = () =>
  queryOptions({
    queryKey: operacionKeys.estadoActual(),
    queryFn: ({ signal }) => operacionApi.estadoActual(signal),
    refetchInterval: REFRESCO_MS,
  })

/**
 * Cerrar una atención trabada mueve todo lo que cuelga de ella: la unidad cambia de estado, el incidente puede volver
 * a buscar unidad o cerrarse, y el traslado vuelve a la fila o queda completado. Se recarga todo eso.
 *
 * Falla con 409 `TRANSICION_INVALIDA` si la atención ya no está en el estado en que se la vio, por ejemplo porque la
 * tripulación recuperó la señal y la movió: lo que muestra la pantalla quedó viejo y se recarga.
 */
export const cerrarAtencionMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationFn: ({ atencionId, datos }: { atencionId: number; datos: CerrarAtencion }) =>
      operacionApi.cerrarAtencion(atencionId, datos),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: operacionKeys.todo })
      void queryClient.invalidateQueries({ queryKey: flotaKeys.todas })
      void queryClient.invalidateQueries({ queryKey: incidentesKeys.todos })
      void queryClient.invalidateQueries({ queryKey: trasladosKeys.todos })
    },
    onError: (error) => {
      if (codigoDeError(error) === 'TRANSICION_INVALIDA') {
        void queryClient.invalidateQueries({ queryKey: operacionKeys.todo })
      }
    },
  })
