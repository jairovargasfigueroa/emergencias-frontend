import { keepPreviousData, mutationOptions, queryOptions, type QueryClient } from '@tanstack/react-query'
import { codigoDeError } from '../../shared/api/cliente'
import { flotaKeys } from '../flota/queries'
import { operacionKeys } from '../monitoreo/queries'
import { incidentesApi, type FiltroEstadoIncidente, type MotivoCierreIncidente } from './api'

/** La lista se pide de a 20 incidentes. */
export const TAMANO_PAGINA = 20

export const incidentesKeys = {
  todos: ['incidentes'] as const,
  lista: (filtro: FiltroEstadoIncidente, pagina: number) => [...incidentesKeys.todos, 'lista', filtro, pagina] as const,
  detalle: (id: number) => [...incidentesKeys.todos, 'detalle', id] as const,
  unidades: (id: number) => [...incidentesKeys.todos, 'unidades', id] as const,
}

/** Al cambiar de página o de filtro se sigue viendo la lista anterior hasta que llega la nueva. */
export const incidentesQuery = (filtro: FiltroEstadoIncidente, pagina: number) =>
  queryOptions({
    queryKey: incidentesKeys.lista(filtro, pagina),
    queryFn: ({ signal }) => incidentesApi.listar(filtro, pagina, TAMANO_PAGINA, signal),
    placeholderData: keepPreviousData,
  })

export const incidenteQuery = (id: number) =>
  queryOptions({
    queryKey: incidentesKeys.detalle(id),
    queryFn: ({ signal }) => incidentesApi.detalle(id, signal),
  })

/**
 * Con qué unidades se puede enviar a mano. Como en los traslados, se pide cada vez que se abre el diálogo y no se
 * guarda al cerrarlo: qué unidades están libres y dónde anda cada una cambia de un minuto a otro, y ofrecer una lista
 * vieja es ofrecer unidades que ya salieron a otra cosa.
 */
export const unidadesParaIncidenteQuery = (id: number) =>
  queryOptions({
    queryKey: incidentesKeys.unidades(id),
    queryFn: ({ signal }) => incidentesApi.unidades(id, signal),
    staleTime: 0,
    gcTime: 0,
  })

/**
 * Lo que hace la central con un incidente le cambia el estado o las unidades: se recargan los incidentes y el centro
 * de control, que lo muestra en su franja y en el mapa.
 */
function recargarIncidentes(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: incidentesKeys.todos })
  void queryClient.invalidateQueries({ queryKey: operacionKeys.todo })
}

/**
 * Enviar una unidad además la ocupa: también se recarga la flota.
 *
 * Puede fallar con 409 `AMBULANCIA_NO_DISPONIBLE` si la unidad se ocupó o no tiene a nadie de turno, o
 * `INCIDENTE_CERRADO` si el incidente se cerró mientras se elegía: entonces lo que se ve quedó viejo y se recarga.
 */
export const despacharUnidadMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationFn: ({ id, ambulanciaId }: { id: number; ambulanciaId: number }) =>
      incidentesApi.despachar(id, ambulanciaId),
    onSuccess: () => {
      recargarIncidentes(queryClient)
      void queryClient.invalidateQueries({ queryKey: flotaKeys.todas })
    },
    onError: (error) => {
      if (codigoDeError(error) === 'INCIDENTE_CERRADO') {
        recargarIncidentes(queryClient)
      }
    },
  })

/**
 * Cerrar a mano un incidente que no se va a atender.
 *
 * Falla con 409 `TRANSICION_INVALIDA` si alguna unidad lo está trabajando, o `INCIDENTE_CERRADO` si ya se había
 * cerrado: en los dos casos cambió mientras se lo miraba, y se recarga.
 */
export const cerrarIncidenteMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationFn: ({ id, motivo }: { id: number; motivo: MotivoCierreIncidente }) => incidentesApi.cerrar(id, motivo),
    onSuccess: () => recargarIncidentes(queryClient),
    onError: (error) => {
      const codigo = codigoDeError(error)
      if (codigo === 'TRANSICION_INVALIDA' || codigo === 'INCIDENTE_CERRADO') {
        recargarIncidentes(queryClient)
      }
    },
  })
