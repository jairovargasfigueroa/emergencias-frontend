import { useQuery } from '@tanstack/react-query'
import { Button, Paragraph, XStack } from 'tamagui'
import { mensajeDeError } from '../../shared/api/cliente'
import { Insignia } from '../../shared/ui/Insignia'
import type { AlertaDeIncidente } from '../incidentes/api'
import { Seccion, Tarjeta } from '../incidentes/PiezasDelDetalle'
import { useAvisoDeResumen } from './avisos'
import { LoQueSeSabe } from './LoQueSeSabe'
import { resumenDelIncidenteQuery } from './queries'

const TITULO = 'Lo que se sabe'

/** Va siempre junto al título: lo que sigue no lo confirmó nadie todavía. */
const ETIQUETA = <Insignia tono="contorno">Preliminar · generado por IA</Insignia>

type Props = {
  incidenteId: number
  alertas: AlertaDeIncidente[]
}

/**
 * La parte del detalle que arma la IA. Se mantiene al día sola: cuando Firebase avisa que hay una versión nueva, se
 * vuelve a pedir.
 *
 * Mientras carga no se muestra nada, y tampoco cuando el incidente no tiene resumen ni evidencias, que es lo más
 * común: una sección vacía en cada incidente sería ruido. Si falla sí se dice, para que nadie crea que no hay nada.
 */
export function ResumenIaDelIncidente({ incidenteId, alertas }: Props) {
  const consulta = useQuery(resumenDelIncidenteQuery(incidenteId))
  useAvisoDeResumen(incidenteId, consulta.data?.version)

  if (consulta.isPending) {
    return null
  }

  if (consulta.isError) {
    return (
      <Seccion titulo={TITULO} etiqueta={ETIQUETA}>
        <Tarjeta>
          <XStack items="center" justify="space-between" gap={16} flexWrap="wrap">
            <Paragraph fontSize={14} lineHeight={20} color="$texto">
              No se pudo cargar el resumen. {mensajeDeError(consulta.error)}
            </Paragraph>
            <Button size="$3" variant="outlined" onPress={() => consulta.refetch()}>
              Reintentar
            </Button>
          </XStack>
        </Tarjeta>
      </Seccion>
    )
  }

  const datos = consulta.data
  if (datos.resumen === null || datos.version === null) {
    if (datos.evidencias.length === 0) {
      return null
    }
    const analizando = datos.evidencias.some((evidencia) => evidencia.estado === 'SUBIDA')
    return (
      <Seccion titulo={TITULO} etiqueta={ETIQUETA}>
        <Tarjeta>
          <Paragraph fontSize={14} lineHeight={20} color="$textoSecundario">
            {analizando
              ? 'Todavía no hay resumen: se está analizando lo que mandaron quienes avisaron y aparece acá apenas esté.'
              : 'Todavía no hay resumen de este incidente.'}
          </Paragraph>
        </Tarjeta>
      </Seccion>
    )
  }

  return (
    <Seccion titulo={TITULO} etiqueta={ETIQUETA}>
      <LoQueSeSabe datos={{ ...datos, resumen: datos.resumen, version: datos.version }} alertas={alertas} />
    </Seccion>
  )
}
