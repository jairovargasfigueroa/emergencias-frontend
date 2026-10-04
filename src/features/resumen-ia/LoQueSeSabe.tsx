import type { ReactNode } from 'react'
import { Paragraph, Text, XStack, YStack } from 'tamagui'
import { fechaHoraCorta, hora } from '../../shared/formato/fechas'
import { Insignia, type TonoInsignia } from '../../shared/ui/Insignia'
import type { AlertaDeIncidente } from '../incidentes/api'
import { Dato, Nota, Tarjeta, Valor } from '../incidentes/PiezasDelDetalle'
import type {
  Afirmacion,
  EvidenciaDelIncidente,
  NivelDeGravedad,
  PeligroConEstado,
  PuntoClave,
  ResumenDelIncidente,
  ResumenIa,
} from './api'
import {
  TEXTO_FUNDAMENTO,
  TEXTO_GRAVEDAD,
  TEXTO_MODALIDAD,
  TEXTO_PELIGRO,
  TEXTO_TIPO_DE_EVENTO,
  TEXTO_TIPO_DE_PUNTO_CLAVE,
  textoCorroboracion,
  textoDe,
  textoPeligroResuelto,
  textoPeligroSinConfirmar,
  textoPersonas,
} from './textos'

/**
 * Sin determinar va en gris, como lo que no tiene estado: nunca en verde, que se leería como "es leve". Que la IA no
 * pueda estimar la gravedad no dice nada de cuán grave es.
 */
const TONO_GRAVEDAD: Record<NivelDeGravedad, TonoInsignia> = {
  low: 'verde',
  moderate: 'ambar',
  high: 'rojo',
  undetermined: 'gris',
}

/** Las fuentes que cita una afirmación o un peligro resuelto. */
type Citas = Pick<Afirmacion, 'evidenceIds' | 'alertIds'>

type Props = {
  /** Con `version` y `resumen` presentes: sin resumen no se llega acá. */
  datos: ResumenDelIncidente & { resumen: ResumenIa; version: number }
  /** Las del incidente, para nombrar las fuentes por quién avisó y a qué hora y no por un id que no se ve en pantalla. */
  alertas: AlertaDeIncidente[]
}

/**
 * Lo que la IA saca en limpio de las alertas y las evidencias. Es preliminar y así se presenta: cada afirmación dice
 * de dónde sale y cuántas alertas distintas la respaldan, y las contradicciones y limitaciones se muestran siempre,
 * también cuando no hay, porque saber que no se encontró ninguna es parte de leer bien el resumen.
 *
 * Arriba van los puntos clave, para entender la emergencia de un vistazo; el resumen completo y sus fuentes siguen
 * debajo. Un resumen v1 no los trae y se ve como antes.
 */
export function LoQueSeSabe({ datos, alertas }: Props) {
  const { resumen } = datos
  const fuentes = (citas: Citas) => nombrarFuentes(citas, alertas, datos.evidencias)
  const personas = textoPersonas(resumen.people)
  const puntosClave = resumen.keyPoints ?? []

  return (
    <Tarjeta>
      <YStack gap={20}>
        <YStack gap={12}>
          <Gravedad nivel={resumen.severity.level} razon={resumen.severity.basis[0]} />
          {puntosClave.length > 0 ? <PuntosClave puntos={puntosClave} /> : null}
          <Paragraph fontSize={15} lineHeight={23} color="$texto">
            {resumen.summary}
          </Paragraph>
        </YStack>

        <XStack flexWrap="wrap" rowGap={16} columnGap={48}>
          <Dato etiqueta="Qué pasó">
            {resumen.eventType === 'undetermined' ? (
              <Valor tenue>Sin determinar</Valor>
            ) : (
              <Valor>{textoDe(TEXTO_TIPO_DE_EVENTO, resumen.eventType)}</Valor>
            )}
          </Dato>
          <Dato etiqueta="Personas">{personas ? <Valor>{personas}</Valor> : <Valor tenue>Sin determinar</Valor>}</Dato>
          <Dato etiqueta="Peligros en el lugar">
            <PeligrosEnElLugar resumen={resumen} fuentes={fuentes} />
          </Dato>
        </XStack>

        {resumen.findings.length > 0 ? (
          <Bloque titulo="Hallazgos">
            {resumen.findings.map((hallazgo, indice) => (
              <LineaAfirmacion key={indice} afirmacion={hallazgo} fuentes={fuentes(hallazgo)} />
            ))}
          </Bloque>
        ) : null}

        {resumen.risks.length > 0 ? (
          <Bloque titulo="Riesgos">
            {resumen.risks.map((riesgo, indice) => (
              <LineaAfirmacion key={indice} afirmacion={riesgo} fuentes={fuentes(riesgo)} />
            ))}
          </Bloque>
        ) : null}

        {/* Una contradicción es lo que más conviene ver antes de decidir: va resaltada cuando la hay. */}
        <Bloque titulo="Contradicciones" resaltado={resumen.conflicts.length > 0}>
          {resumen.conflicts.length === 0 ? (
            <Valor tenue>No se encontraron contradicciones entre las fuentes.</Valor>
          ) : (
            resumen.conflicts.map((contradiccion, indice) => (
              <LineaAfirmacion key={indice} afirmacion={contradiccion} fuentes={fuentes(contradiccion)} />
            ))
          )}
        </Bloque>

        <Bloque titulo="Limitaciones">
          {resumen.limitations.length === 0 ? (
            <Valor tenue>La IA no informó limitaciones.</Valor>
          ) : (
            resumen.limitations.map((limitacion, indice) => (
              <Linea key={indice}>
                <Paragraph fontSize={14} lineHeight={20} color="$texto">
                  {limitacion}
                </Paragraph>
              </Linea>
            ))
          )}
        </Bloque>

        <YStack gap={4} pt={16} borderTopWidth={1} borderColor="$borde">
          <Nota>{textoVersion(datos)}</Nota>
          <Nota>
            Lo arma la IA con lo que mandaron quienes avisaron: puede equivocarse y no reemplaza lo que vea la unidad en
            el lugar.
          </Nota>
        </YStack>
      </YStack>
    </Tarjeta>
  )
}

/** El color dice el nivel; al lado, la razón principal, para que el nivel nunca se lea solo. */
function Gravedad({ nivel, razon }: { nivel: NivelDeGravedad; razon: string | undefined }) {
  return (
    <XStack items="center" columnGap={10} rowGap={6} flexWrap="wrap">
      <Insignia tono={TONO_GRAVEDAD[nivel] ?? 'gris'} conPunto={nivel !== 'undetermined'}>
        {textoDe(TEXTO_GRAVEDAD, nivel)}
      </Insignia>
      <Text flex={1} minW={200} fontSize={13} lineHeight={18} color="$textoSecundario">
        {razon ?? 'No hay lo suficiente para estimarla.'}
      </Text>
    </XStack>
  )
}

/**
 * Los activos, en una línea. Los que la última versión no volvió a nombrar siguen a la vista con la hora de su último
 * reporte, y los que una fuente dio por terminados dicen cuál: un peligro no desaparece del resumen sin motivo.
 */
function PeligrosEnElLugar({ resumen, fuentes }: { resumen: ResumenIa; fuentes: (citas: Citas) => string[] }) {
  const peligros = peligrosConEstado(resumen)
  const sinConfirmar = peligros.filter((peligro) => peligro.status === 'unconfirmed')
  const activos = peligros.filter((peligro) => peligro.status !== 'unconfirmed')
  const resueltos = resumen.resolvedHazards ?? []

  return (
    <YStack gap={2}>
      {activos.length > 0 ? (
        <Valor>{activos.map((peligro) => textoDe(TEXTO_PELIGRO, peligro.type)).join(', ')}</Valor>
      ) : sinConfirmar.length === 0 ? (
        <Valor tenue>{resueltos.length > 0 ? 'Ninguno activo' : 'Ninguno identificado'}</Valor>
      ) : null}
      {sinConfirmar.map((peligro) => (
        <Valor key={peligro.type}>
          {textoPeligroSinConfirmar(
            textoDe(TEXTO_PELIGRO, peligro.type),
            peligro.lastReportedAt ? hora(peligro.lastReportedAt) : null,
          )}
        </Valor>
      ))}
      {resueltos.map((peligro) => (
        <Nota key={peligro.type}>{textoPeligroResuelto(textoDe(TEXTO_PELIGRO, peligro.type), fuentes(peligro))}</Nota>
      ))}
    </YStack>
  )
}

/** v2 trae el estado de cada peligro; un resumen v1 solo la lista, y se toman todos como activos y sin hora. */
function peligrosConEstado(resumen: ResumenIa): PeligroConEstado[] {
  return (
    resumen.hazardStates ??
    resumen.hazards.map((peligro) => ({ type: peligro, status: 'active' as const, lastReportedAt: null }))
  )
}

/** Una línea por punto, con lo que trata al lado. Lo crítico va en el color de lo que pide atención. */
function PuntosClave({ puntos }: { puntos: PuntoClave[] }) {
  return (
    <YStack gap={6} px={16} py={14} rounded={10} bg="$fondo">
      {puntos.map((punto, indice) => {
        const critico = punto.kind === 'critical'
        return (
          <XStack key={indice} columnGap={12} rowGap={2} flexWrap="wrap">
            <Text
              width={72}
              fontSize={12}
              lineHeight={22}
              fontWeight="500"
              color={critico ? '$enAtencionTexto' : '$textoSecundario'}
            >
              {textoDe(TEXTO_TIPO_DE_PUNTO_CLAVE, punto.kind)}
            </Text>
            <Text
              flex={1}
              minW={200}
              fontSize={15}
              lineHeight={22}
              fontWeight={critico ? '600' : '500'}
              color={critico ? '$enAtencionTexto' : '$texto'}
            >
              {punto.text}
            </Text>
          </XStack>
        )
      })}
    </YStack>
  )
}

function Bloque({ titulo, resaltado = false, children }: { titulo: string; resaltado?: boolean; children: ReactNode }) {
  return (
    <YStack
      gap={10}
      {...(resaltado ? { px: 16, py: 14, rounded: 10, bg: '$enAtencionTinte' } : null)}
    >
      <Text fontSize={13} lineHeight={18} fontWeight="600" color={resaltado ? '$enAtencionTexto' : '$texto'}>
        {titulo}
      </Text>
      {children}
    </YStack>
  )
}

function Linea({ children }: { children: ReactNode }) {
  return (
    <YStack gap={2} pl={12} borderLeftWidth={2} borderColor="$bordeFuerte">
      {children}
    </YStack>
  )
}

function LineaAfirmacion({ afirmacion, fuentes }: { afirmacion: Afirmacion; fuentes: string[] }) {
  const detalle = [
    afirmacion.basis ? textoDe(TEXTO_FUNDAMENTO, afirmacion.basis) : null,
    textoCorroboracion(afirmacion.corroboratingAlerts),
    fuentes.length > 0 ? `según ${fuentes.join(', ')}` : null,
  ]
    .filter((parte): parte is string => parte !== null)
    .join(' · ')

  return (
    <Linea>
      <Paragraph fontSize={14} lineHeight={20} color="$texto">
        {afirmacion.text}
      </Paragraph>
      <Nota>{detalle.charAt(0).toUpperCase() + detalle.slice(1)}</Nota>
    </Linea>
  )
}

/**
 * Las fuentes que cita una afirmación o un peligro resuelto, dichas como las ve la central: "la foto de Ana Pérez
 * (10:32)". La tabla de alertas no muestra ids, así que nombrarlas por id no serviría para encontrarlas.
 */
function nombrarFuentes(citas: Citas, alertas: AlertaDeIncidente[], evidencias: EvidenciaDelIncidente[]) {
  const quien = (alertaId: number) => {
    const alerta = alertas.find((una) => una.id === alertaId)
    return alerta ? `${alerta.emisor.nombreCompleto} (${hora(alerta.fechaHora)})` : `la alerta #${alertaId}`
  }
  const deEvidencias = citas.evidenceIds.map((evidenciaId) => {
    const evidencia = evidencias.find((una) => una.evidenciaId === evidenciaId)
    return evidencia
      ? `${evidencia.modalidad === 'IMAGEN' ? 'la' : 'el'} ${textoDe(TEXTO_MODALIDAD, evidencia.modalidad).toLowerCase()} de ${quien(evidencia.alertaId)}`
      : `la evidencia #${evidenciaId}`
  })
  const deAlertas = citas.alertIds.map((alertaId) => `lo que contó ${quien(alertaId)}`)
  return [...deEvidencias, ...deAlertas]
}

/** "Versión 3 · actualizado 12 sep, 10:32 · con 2 alertas y 3 evidencias". */
function textoVersion(datos: ResumenDelIncidente & { version: number }) {
  const alertas = datos.alertasUsadas.length
  const evidencias = datos.evidenciasUsadas.length
  return [
    `Versión ${datos.version}`,
    datos.generadoEn ? `actualizado ${fechaHoraCorta(datos.generadoEn)}` : null,
    `con ${alertas} ${alertas === 1 ? 'alerta' : 'alertas'} y ${evidencias} ${evidencias === 1 ? 'evidencia' : 'evidencias'}`,
    datos.metodo === 'single_evidence' ? 'sale de una sola evidencia' : null,
  ]
    .filter((parte): parte is string => parte !== null)
    .join(' · ')
}
