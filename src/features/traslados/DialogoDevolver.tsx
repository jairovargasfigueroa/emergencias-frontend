import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToastController } from 'tamagui'
import { mensajeDeError } from '../../shared/api/cliente'
import { DialogoConfirmacion } from '../../shared/ui/DialogoConfirmacion'
import type { TrasladoDelPanel } from './api'
import { devolverTrasladoMutation } from './queries'

type Props = {
  /** El traslado con la unidad que lo tiene. Null con el diálogo cerrado. */
  fila: TrasladoDelPanel | null
  onCerrar: () => void
}

/**
 * Sacarle el traslado a la unidad que viene en camino y devolverlo a la búsqueda, primero en la fila. Es lo que hace
 * un despachador cuando una unidad no llega: la llama y, si hace falta, manda otra. Se confirma porque no tiene
 * vuelta atrás: la tripulación se entera en el momento y la unidad queda libre para salir a otra cosa.
 */
export function DialogoDevolver({ fila, onCerrar }: Props) {
  const queryClient = useQueryClient()
  const toast = useToastController()
  const devolver = useMutation(devolverTrasladoMutation(queryClient))
  const unidad = fila?.placa ? `La unidad ${fila.placa}` : 'La unidad'

  function confirmar() {
    if (!fila) {
      return
    }
    devolver.mutate(fila.traslado.id, {
      onSuccess: () => {
        onCerrar()
        toast.show('Traslado devuelto a la búsqueda', {
          message: `${unidad} quedó libre y el traslado de ${fila.traslado.pasajero} va primero en la fila.`,
        })
      },
      onError: (error) => {
        onCerrar()
        toast.show('No se pudo devolver el traslado', { message: mensajeDeError(error) })
      },
    })
  }

  return (
    <DialogoConfirmacion
      abierto={fila !== null}
      onCambiarAbierto={(abierto) => (abierto ? undefined : onCerrar())}
      titulo="¿Devolver el traslado a la búsqueda?"
      descripcion={
        fila
          ? `${unidad} queda libre y su tripulación recibe el aviso de que ya no va. El traslado de ${fila.traslado.pasajero} vuelve a buscar unidad, primero en la fila.`
          : ''
      }
      textoConfirmar="Devolver a la búsqueda"
      tono="aviso"
      pendiente={devolver.isPending}
      onConfirmar={confirmar}
    />
  )
}
