import type { UseQueryResult } from '@tanstack/react-query'
import { Button, Spinner, Text, XStack, YStack } from 'tamagui'
import { textoDistancia } from '../../shared/formato/distancia'
import { tiempoTranscurrido } from '../../shared/formato/fechas'
import { BotonPrimario } from '../../shared/ui/botones'
import { ErrorAlCargar } from '../../shared/ui/EstadosDeCarga'
import { Insignia } from '../../shared/ui/Insignia'
import { TIPO_UNIDAD_CORTO, type UnidadCandidata } from './api'

/** Lo que cambia según adónde se manda la unidad: a un traslado o a una emergencia. */
export type TextosDeCandidatas = {
  /** Hasta dónde se mide la distancia: "del origen", "del lugar". */
  referencia: string
  /** La marca de la que ya estuvo en el caso y lo dejó. */
  yaLoTuvo: string
  /** Qué decir cuando no hay ninguna. */
  sinUnidades: string
  /** El botón de cada unidad. */
  elegir: string
  /** La nota debajo de la lista, cuando alguna va marcada. */
  marcadas: string
}

type Props = {
  /** La lista la pide quien abre el diálogo, cada uno a su endpoint: acá solo se muestra. */
  consulta: UseQueryResult<UnidadCandidata[]>
  textos: TextosDeCandidatas
  /** La que se está mandando ahora, si hay una: lleva la ruedita y, mientras tanto, no se puede elegir otra. */
  enviando: number | null
  onElegir: (unidad: UnidadCandidata) => void
}

/**
 * Las unidades con que se puede mandar a mano, de la más cercana a la más lejana, con lo que hace falta para elegir.
 * La usan asignar un traslado y enviar una unidad a una emergencia, que solo cambian en los textos. Distingue la
 * lista que no se pudo cargar de la que llegó vacía: no es lo mismo no saber que saber que no hay.
 */
export function UnidadesCandidatas({ consulta, textos, enviando, onElegir }: Props) {
  // Reintentar después de un error no cambia el estado de la consulta hasta que termina: sin esto, el botón de
  // reintentar no daría ninguna señal de que está pidiendo.
  const buscando = consulta.isPending || (consulta.isError && consulta.isFetching)

  if (buscando) {
    return (
      <XStack items="center" gap={8} py={12}>
        <Spinner size="small" color="$textoSecundario" />
        <Text fontSize={14} color="$textoSecundario">
          Buscando unidades…
        </Text>
      </XStack>
    )
  }

  if (consulta.isError) {
    return <ErrorAlCargar error={consulta.error} onReintentar={() => consulta.refetch()} />
  }

  if (consulta.data.length === 0) {
    return (
      <Text fontSize={14} lineHeight={20} color="$textoSecundario">
        {textos.sinUnidades}
      </Text>
    )
  }

  const hayMarcadas = consulta.data.some((unidad) => unidad.yaLoTuvo || !unidad.posicionReciente)

  return (
    <YStack gap={10}>
      <YStack gap={8} maxH={320} overflow="scroll">
        {consulta.data.map((unidad) => (
          <OpcionDeUnidad
            key={unidad.ambulanciaId}
            unidad={unidad}
            textos={textos}
            consultadaEn={consulta.dataUpdatedAt}
            enviandoEsta={enviando === unidad.ambulanciaId}
            bloqueada={enviando !== null}
            onElegir={() => onElegir(unidad)}
          />
        ))}
      </YStack>
      {hayMarcadas ? (
        <Text fontSize={12} lineHeight={16} color="$textoSecundario">
          {textos.marcadas}
        </Text>
      ) : null}
    </YStack>
  )
}

type PropsOpcion = {
  unidad: UnidadCandidata
  textos: TextosDeCandidatas
  /** Cuándo llegó la lista: con eso se dice de hace cuánto es la posición de una unidad sin GPS reciente. */
  consultadaEn: number
  /** Es la que se está mandando ahora: lleva la ruedita. */
  enviandoEsta: boolean
  /** Mientras se manda una, no se puede elegir otra. */
  bloqueada: boolean
  onElegir: () => void
}

/**
 * Una unidad de la lista, con lo que hace falta para elegirla: cuán lejos está y, si las tiene, las marcas por las
 * que el sistema no la elegiría. Con una posición vieja se dice de cuándo es, porque la distancia sale de ahí y la
 * unidad puede estar en otro lado.
 */
function OpcionDeUnidad({ unidad, textos, consultadaEn, enviandoEsta, bloqueada, onElegir }: PropsOpcion) {
  const distancia =
    unidad.distanciaMetros === null
      ? 'Nunca reportó su posición'
      : !unidad.posicionReciente && unidad.posicionEn
        ? `A ${textoDistancia(unidad.distanciaMetros)} ${textos.referencia}, según su posición de hace ${tiempoTranscurrido(unidad.posicionEn, consultadaEn)}`
        : `A ${textoDistancia(unidad.distanciaMetros)} ${textos.referencia}`

  return (
    <XStack
      items="center"
      justify="space-between"
      gap={12}
      px={12}
      py={10}
      rounded={10}
      borderWidth={1}
      borderColor="$borde"
    >
      <YStack gap={4} flex={1} minW={0}>
        <XStack items="baseline" gap={8}>
          <Text fontSize={14} fontWeight="600" color="$texto" fontFamily="$mono">
            {unidad.placa}
          </Text>
          <Text fontSize={12} color="$textoSecundario">
            {TIPO_UNIDAD_CORTO[unidad.tipoUnidad]}
          </Text>
        </XStack>
        <Text fontSize={12} lineHeight={16} color="$textoSecundario">
          {distancia}
        </Text>
        {unidad.yaLoTuvo || !unidad.posicionReciente ? (
          <XStack gap={6} flexWrap="wrap">
            {unidad.yaLoTuvo ? <Insignia tono="ambar">{textos.yaLoTuvo}</Insignia> : null}
            {unidad.posicionReciente ? null : <Insignia tono="ambar">Sin GPS reciente</Insignia>}
          </XStack>
        ) : null}
      </YStack>
      <BotonPrimario
        size="$3"
        disabled={bloqueada}
        opacity={bloqueada && !enviandoEsta ? 0.6 : 1}
        icon={enviandoEsta ? <Spinner size="small" color="$primarioTexto" /> : undefined}
        onPress={onElegir}
      >
        <Button.Text color="$primarioTexto" fontSize={13} fontWeight="600">
          {textos.elegir}
        </Button.Text>
      </BotonPrimario>
    </XStack>
  )
}
