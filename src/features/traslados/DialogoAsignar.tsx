import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Dialog, Spinner, Text, XStack, YStack, useToastController } from 'tamagui'
import { mensajeDeError } from '../../shared/api/cliente'
import { BotonPrimario } from '../../shared/ui/botones'
import { cubreA, TIPO_UNIDAD_CORTO } from '../flota/api'
import { ambulanciasQuery } from '../flota/queries'
import type { Traslado } from './api'
import { asignarTrasladoMutation } from './queries'

type Props = {
  traslado: Traslado | null
  onCerrar: () => void
}

/**
 * Asignar a mano, para cuando el sistema no encontró unidad. Solo se ofrecen las que están disponibles y cuyo
 * tipo alcanza: mandar una que no corresponde es mandar al paramédico a un viaje que no va a poder hacer.
 */
export function DialogoAsignar({ traslado, onCerrar }: Props) {
  const queryClient = useQueryClient()
  const toast = useToastController()
  const ambulancias = useQuery(ambulanciasQuery())
  const asignar = useMutation(asignarTrasladoMutation(queryClient))

  const candidatas = (ambulancias.data ?? []).filter(
    (ambulancia) =>
      ambulancia.activa &&
      ambulancia.estado === 'DISPONIBLE' &&
      traslado !== null &&
      cubreA(ambulancia.tipoUnidad, traslado.tipoUnidad),
  )

  function elegir(ambulanciaId: number, placa: string) {
    if (!traslado) {
      return
    }
    asignar.mutate(
      { id: traslado.id, ambulanciaId },
      {
        onSuccess: () => {
          toast.show('Unidad asignada', { message: `${placa} va al traslado de ${traslado.pasajero}.` })
          onCerrar()
        },
        onError: (error) => toast.show('No se pudo asignar', { message: mensajeDeError(error) }),
      },
    )
  }

  return (
    <Dialog modal open={traslado !== null} onOpenChange={(abierto) => !abierto && onCerrar()}>
      <Dialog.Portal>
        <Dialog.Overlay key="overlay" bg="$velo" transition="quick" enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} />
        <Dialog.Content
          key="content"
          width={460}
          maxW="92%"
          p={24}
          gap={20}
          rounded={14}
          bg="$superficie"
          borderWidth={1}
          borderColor="$borde"
          elevate
          transition="quick"
          enterStyle={{ opacity: 0, y: -12, scale: 0.97 }}
          exitStyle={{ opacity: 0, y: 8, scale: 0.97 }}
        >
          <YStack gap={6}>
            <Dialog.Title color="$texto" fontSize={18} lineHeight={26} fontWeight="600">
              Asignar una unidad
            </Dialog.Title>
            <Dialog.Description color="$textoSecundario" fontSize={14} lineHeight={20}>
              {traslado
                ? `Traslado de ${traslado.pasajero}. Necesita ${TIPO_UNIDAD_CORTO[traslado.tipoUnidad]} o superior.`
                : ''}
            </Dialog.Description>
          </YStack>

          {ambulancias.isPending ? (
            <XStack items="center" gap={8} py={12}>
              <Spinner size="small" color="$textoSecundario" />
              <Text fontSize={14} color="$textoSecundario">
                Cargando la flota…
              </Text>
            </XStack>
          ) : candidatas.length === 0 ? (
            <Text fontSize={14} lineHeight={20} color="$textoSecundario">
              No hay ninguna unidad disponible que sirva para este traslado. Cuando alguna se libere, el sistema la
              asigna solo.
            </Text>
          ) : (
            <YStack gap={8} maxH={280} overflow="scroll">
              {candidatas.map((ambulancia) => (
                <XStack
                  key={ambulancia.id}
                  items="center"
                  justify="space-between"
                  gap={12}
                  px={12}
                  py={10}
                  rounded={10}
                  borderWidth={1}
                  borderColor="$borde"
                >
                  <YStack gap={2} minW={0}>
                    <Text fontSize={14} fontWeight="600" color="$texto" fontFamily="$mono">
                      {ambulancia.placa}
                    </Text>
                    <Text fontSize={12} color="$textoSecundario">
                      {TIPO_UNIDAD_CORTO[ambulancia.tipoUnidad]}
                    </Text>
                  </YStack>
                  <BotonPrimario
                    size="$3"
                    disabled={asignar.isPending}
                    onPress={() => elegir(ambulancia.id, ambulancia.placa)}
                  >
                    <Button.Text color="$primarioTexto" fontSize={13} fontWeight="600">
                      Asignar
                    </Button.Text>
                  </BotonPrimario>
                </XStack>
              ))}
            </YStack>
          )}

          <XStack justify="flex-end">
            <Button size="$4" variant="outlined" disabled={asignar.isPending} onPress={onCerrar}>
              Cerrar
            </Button>
          </XStack>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
