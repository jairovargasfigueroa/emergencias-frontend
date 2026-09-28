import { Button, Text } from 'tamagui'
import { hora } from '../../shared/formato/fechas'
import { minutosParaLaUltimaSalida, type Traslado, type TrasladoDelPanel } from './api'
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
}

/** El botón que resuelve el problema de la fila, si hay uno que se resuelva desde ahí. */
export function AccionDelProblema({ fila, onAsignar }: PropsAccion) {
  switch (fila.problema) {
    case 'SIN_UNIDAD':
      return <BotonDeFila texto="Asignar" onPress={() => onAsignar(fila.traslado)} />
    default:
      return null
  }
}

/** Va en filas que son enlaces: sin frenar el toque, además de actuar abriría el detalle. */
function BotonDeFila({ texto, onPress }: { texto: string; onPress: () => void }) {
  return (
    <Button
      size="$3"
      variant="outlined"
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
