import { mutationOptions, queryOptions, type QueryClient } from '@tanstack/react-query'
import { cobrosApi, type CobroDeServicio, type DatosDeCobro, type TipoServicio } from './api'

export const cobrosKeys = {
  todo: ['cobros'] as const,
  tarifas: () => [...cobrosKeys.todo, 'tarifas'] as const,
  servicio: (atencionId: number) => [...cobrosKeys.todo, 'servicio', atencionId] as const,
}

export const tarifasQuery = () =>
  queryOptions({ queryKey: cobrosKeys.tarifas(), queryFn: ({ signal }) => cobrosApi.tarifas(signal) })

export const cobroDeServicioQuery = (atencionId: number) =>
  queryOptions({
    queryKey: cobrosKeys.servicio(atencionId),
    queryFn: ({ signal }) => cobrosApi.delServicio(atencionId, signal),
  })

export const registrarTarifaMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationFn: (datos: { tipoServicio: TipoServicio; monto: number; vigenteDesde: string }) =>
      cobrosApi.registrarTarifa(datos),
    // La referencia de cada servicio depende de las tarifas: se recarga todo lo de cobros.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: cobrosKeys.todo }),
  })

/** La respuesta ya es el cobro del servicio como quedó. */
function guardar(queryClient: QueryClient, servicio: CobroDeServicio) {
  queryClient.setQueryData(cobrosKeys.servicio(servicio.atencionId), servicio)
}

export const registrarCobroMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationFn: ({ atencionId, datos }: { atencionId: number; datos: DatosDeCobro }) =>
      cobrosApi.registrar(atencionId, datos),
    onSuccess: (servicio: CobroDeServicio) => guardar(queryClient, servicio),
  })

export const ajustarCobroMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationFn: ({ cobroId, datos }: { cobroId: number; datos: DatosDeCobro & { motivo: string } }) =>
      cobrosApi.ajustar(cobroId, datos),
    onSuccess: (servicio: CobroDeServicio) => guardar(queryClient, servicio),
  })

export const anularCobroMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationFn: ({ cobroId, motivo }: { cobroId: number; motivo: string }) => cobrosApi.anular(cobroId, motivo),
    onSuccess: (servicio: CobroDeServicio) => guardar(queryClient, servicio),
  })
