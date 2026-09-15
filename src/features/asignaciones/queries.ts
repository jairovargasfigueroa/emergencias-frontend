import { mutationOptions, queryOptions, type QueryClient } from '@tanstack/react-query'
import { personalKeys } from '../personal/queries'
import { asignacionesApi, type AsignarParamedico } from './api'

export const asignacionesKeys = {
  todas: ['asignaciones'] as const,
  deAmbulancia: (ambulanciaId: number) => [...asignacionesKeys.todas, 'ambulancia', ambulanciaId] as const,
  deParamedico: (paramedicoId: number) => [...asignacionesKeys.todas, 'paramedico', paramedicoId] as const,
}

export const historialDeAmbulanciaQuery = (ambulanciaId: number) =>
  queryOptions({
    queryKey: asignacionesKeys.deAmbulancia(ambulanciaId),
    queryFn: ({ signal }) => asignacionesApi.historialDeAmbulancia(ambulanciaId, signal),
  })

export const historialDeParamedicoQuery = (paramedicoId: number) =>
  queryOptions({
    queryKey: asignacionesKeys.deParamedico(paramedicoId),
    queryFn: ({ signal }) => asignacionesApi.historialDeParamedico(paramedicoId, signal),
  })

/**
 * Si el paramédico ya tiene una asignación vigente con otra ambulancia, falla con 409
 * `REASIGNACION_REQUIERE_CONFIRMACION`; la pantalla pide confirmar y reintenta con `confirmarReasignacion`.
 */
export const asignarParamedicoMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationFn: (datos: AsignarParamedico) => asignacionesApi.asignar(datos),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: personalKeys.todos }),
        queryClient.invalidateQueries({ queryKey: asignacionesKeys.todas }),
      ]),
  })
