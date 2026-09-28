import { mutationOptions, queryOptions, type QueryClient } from '@tanstack/react-query'
import { codigoDeError } from '../../shared/api/cliente'
import { flotaKeys } from '../flota/queries'
import { operacionKeys } from '../monitoreo/queries'
import { personalApi, type EditarParamedico, type RegistrarParamedico } from './api'

export const personalKeys = {
  todos: ['paramedicos'] as const,
  lista: () => [...personalKeys.todos, 'lista'] as const,
}

export const paramedicosQuery = () =>
  queryOptions({
    queryKey: personalKeys.lista(),
    queryFn: ({ signal }) => personalApi.listar(signal),
  })

function refrescarPersonal(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: personalKeys.todos })
}

export const registrarParamedicoMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationFn: (datos: RegistrarParamedico) => personalApi.registrar(datos),
    onSuccess: () => refrescarPersonal(queryClient),
  })

/** Puede fallar con 409 `TELEFONO_DUPLICADO` si otro paramédico activo ya usa ese número. */
export const editarParamedicoMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationFn: ({ id, datos }: { id: number; datos: EditarParamedico }) => personalApi.editar(id, datos),
    onSuccess: () => refrescarPersonal(queryClient),
  })

/** Falla con 409 `PARAMEDICO_EN_TURNO` si está en turno: primero hay que cerrárselo. */
export const desactivarParamedicoMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationFn: (paramedicoId: number) => personalApi.desactivar(paramedicoId),
    onSuccess: () => refrescarPersonal(queryClient),
  })

/**
 * Deshace la baja. Puede fallar con 409 `TELEFONO_DUPLICADO`: mientras estuvo de baja su número quedó libre y
 * alguien más pudo quedárselo.
 */
export const activarParamedicoMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationFn: (paramedicoId: number) => personalApi.activar(paramedicoId),
    onSuccess: () => refrescarPersonal(queryClient),
  })

/**
 * Cerrarle el turno a alguien también cambia su unidad: deja de tenerlo a bordo y, si era el único, se queda sin
 * tripulación. Se recargan el personal, la flota y el centro de control, que muestra quién va en cada unidad.
 *
 * Falla con 409 `TRANSICION_INVALIDA` si su unidad tiene una atención en curso o si ya no tenía el turno abierto,
 * por ejemplo porque lo acaba de cerrar él: lo que muestra la pantalla quedó viejo y se recarga.
 */
export const cerrarTurnoMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationFn: (paramedicoId: number) => personalApi.cerrarTurno(paramedicoId),
    onSuccess: () => refrescarTurnos(queryClient),
    onError: (error) => {
      if (codigoDeError(error) === 'TRANSICION_INVALIDA') {
        void refrescarTurnos(queryClient)
      }
    },
  })

function refrescarTurnos(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: personalKeys.todos }),
    queryClient.invalidateQueries({ queryKey: flotaKeys.todas }),
    queryClient.invalidateQueries({ queryKey: operacionKeys.todo }),
  ])
}
