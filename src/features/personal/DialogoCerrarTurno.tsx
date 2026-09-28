import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToastController } from 'tamagui'
import { mensajeDeError } from '../../shared/api/cliente'
import { DialogoConfirmacion } from '../../shared/ui/DialogoConfirmacion'
import { cerrarTurnoMutation } from './queries'

/** A quién se le cierra el turno y en qué unidad lo tiene abierto. */
export type TurnoPorCerrar = {
  paramedicoId: number
  nombre: string
  /** Null si no se sabe: en Personal sale de su asignación, en el centro de control de la unidad que se mira. */
  placa: string | null
}

type Props = {
  /** Null con el diálogo cerrado. */
  turno: TurnoPorCerrar | null
  onCerrar: () => void
}

/**
 * Cerrarle el turno a alguien que se fue sin cerrarlo, como hace el despachador de una central: si no, su unidad
 * sigue figurando con gente adentro y a él le siguen llegando avisos. Se confirma porque desde el panel no tiene
 * vuelta atrás: para volver a trabajar, tiene que abrir turno otra vez desde su app.
 */
export function DialogoCerrarTurno({ turno, onCerrar }: Props) {
  const queryClient = useQueryClient()
  const toast = useToastController()
  const cerrar = useMutation(cerrarTurnoMutation(queryClient))
  const unidad = turno?.placa ? `la unidad ${turno.placa}` : 'su unidad'

  function confirmar() {
    if (!turno) {
      return
    }
    cerrar.mutate(turno.paramedicoId, {
      onSuccess: () => {
        onCerrar()
        toast.show('Turno cerrado', { message: `${turno.nombre} ya no está de turno.` })
      },
      onError: (error) => {
        // El backend dice qué lo frena, por ejemplo que su unidad tiene una atención en curso: se muestra tal cual.
        onCerrar()
        toast.show('No se pudo cerrar el turno', { message: mensajeDeError(error) })
      },
    })
  }

  return (
    <DialogoConfirmacion
      abierto={turno !== null}
      onCambiarAbierto={(abierto) => (abierto ? undefined : onCerrar())}
      titulo={turno ? `¿Cerrarle el turno a ${turno.nombre}?` : ''}
      descripcion={
        turno
          ? `Deja de figurar a bordo de ${unidad} y de recibir avisos; si era el único, la unidad se queda sin tripulación. Para volver a trabajar, tiene que abrir turno desde su app.`
          : ''
      }
      textoConfirmar="Cerrar turno"
      tono="aviso"
      pendiente={cerrar.isPending}
      onConfirmar={confirmar}
    />
  )
}
