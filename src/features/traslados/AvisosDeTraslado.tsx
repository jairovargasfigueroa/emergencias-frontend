import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Spinner, Text, useToastController } from 'tamagui'
import { mensajeDeError } from '../../shared/api/cliente'
import { hora } from '../../shared/formato/fechas'
import { BotonPrimario } from '../../shared/ui/botones'
import { minutosParaLaUltimaSalida, type Traslado, type TrasladoDelPanel } from './api'
import { marcarFamiliaAvisadaMutation } from './queries'
import { avisoDelProblema, textoTiempoRestante } from './textos'

/**
 * Desde cuántos minutos antes de la última salida posible el tiempo que queda se pinta en rojo: a esa altura
 * conviene asignar a mano en vez de esperar a que el sistema consiga una unidad.
 */
const MINUTOS_PARA_APURARSE = 30

type PropsTiempo = {
  traslado: Traslado
  /** El reloj de la pantalla que lo muestra: con él envejece solo, sin volver a consultar. */
  ahora: number
}

/** "Quedan 25 min" hasta la última salida posible, en rojo cuando ya hay que apurarse. */
export function TiempoRestante({ traslado, ahora }: PropsTiempo) {
  const minutos = minutosParaLaUltimaSalida(traslado, ahora)
  const apurado = minutos <= MINUTOS_PARA_APURARSE
  return (
    <Text fontSize={13} fontWeight={apurado ? '600' : '500'} color={apurado ? '$primarioPresionado' : '$texto'}>
      {textoTiempoRestante(minutos)}
    </Text>
  )
}

type PropsAviso = {
  fila: TrasladoDelPanel
  ahora: number
}

/**
 * Qué le pasa al traslado, en una línea: cuánto le queda si todavía se busca unidad, o lo que tiene que hacer el
 * administrador. Null si el traslado no necesita nada.
 */
export function AvisoDelProblema({ fila, ahora }: PropsAviso) {
  if (fila.problema === 'SIN_UNIDAD') {
    return (
      <Text fontSize={13} color="$textoSecundario">
        <TiempoRestante traslado={fila.traslado} ahora={ahora} /> · última salida posible a las{' '}
        {hora(fila.traslado.horaLimiteSalida)}
      </Text>
    )
  }
  const aviso = avisoDelProblema(fila)
  if (!aviso) {
    return null
  }
  return (
    <Text fontSize={13} fontWeight="600" color="$primarioPresionado">
      ⚠ {aviso}
    </Text>
  )
}

type PropsAccion = {
  fila: TrasladoDelPanel
  onAsignar: (traslado: Traslado) => void
  /** Abre la confirmación para sacarle el traslado a la unidad atrasada. */
  onDevolver: (fila: TrasladoDelPanel) => void
}

/** El botón que resuelve el problema de la fila, si hay uno que se resuelva desde ahí. */
export function AccionDelProblema({ fila, onAsignar, onDevolver }: PropsAccion) {
  switch (fila.problema) {
    case 'SIN_UNIDAD':
      return <BotonDeFila texto="Asignar" onPress={() => onAsignar(fila.traslado)} />
    case 'NO_CUBIERTO':
      return <BotonFamiliaAvisada traslado={fila.traslado} />
    case 'UNIDAD_ATRASADA':
      return <BotonDeFila texto="Devolver a la búsqueda" onPress={() => onDevolver(fila)} />
    default:
      return null
  }
}

type PropsFamilia = {
  traslado: Traslado
  /** En el detalle es la acción principal; en las filas va como los demás botones. */
  destacado?: boolean
}

/**
 * Marca que ya se le avisó a la familia de un traslado no cubierto, y con eso sale de la bandeja. No pide
 * confirmación: se toca después de llamar, y el traslado sigue en la tabla del día con la hora del aviso.
 */
export function BotonFamiliaAvisada({ traslado, destacado = false }: PropsFamilia) {
  const queryClient = useQueryClient()
  const toast = useToastController()
  const marcar = useMutation(marcarFamiliaAvisadaMutation(queryClient))

  function marcarAviso() {
    marcar.mutate(traslado.id, {
      onSuccess: () =>
        toast.show('Familia avisada', { message: `El traslado de ${traslado.pasajero} sale de la bandeja.` }),
      onError: (error) => toast.show('No se pudo marcar el aviso', { message: mensajeDeError(error) }),
    })
  }

  if (!destacado) {
    return <BotonDeFila texto="Ya avisé a la familia" pendiente={marcar.isPending} onPress={marcarAviso} />
  }
  return (
    <BotonPrimario
      size="$3"
      disabled={marcar.isPending}
      icon={marcar.isPending ? <Spinner size="small" color="$primarioTexto" /> : undefined}
      onPress={marcarAviso}
    >
      <Button.Text color="$primarioTexto" fontSize={13} fontWeight="600">
        Ya avisé a la familia
      </Button.Text>
    </BotonPrimario>
  )
}

type PropsBotonDeFila = {
  texto: string
  /** Mientras la acción corre: el botón se apaga y muestra la ruedita. */
  pendiente?: boolean
  onPress: () => void
}

/** Va en filas que son enlaces: sin frenar el toque, además de actuar abriría el detalle. */
function BotonDeFila({ texto, pendiente = false, onPress }: PropsBotonDeFila) {
  return (
    <Button
      size="$3"
      variant="outlined"
      disabled={pendiente}
      icon={pendiente ? <Spinner size="small" color="$textoSecundario" /> : undefined}
      onPress={(evento) => {
        evento.preventDefault()
        evento.stopPropagation()
        onPress()
      }}
    >
      <Button.Text fontSize={12} fontWeight="600" color="$texto">
        {texto}
      </Button.Text>
    </Button>
  )
}
