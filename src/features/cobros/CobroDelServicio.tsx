import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Button, Paragraph, Spinner, Text, XStack, YStack } from 'tamagui'
import { fechaHoraCorta } from '../../shared/formato/fechas'
import { Insignia, type TonoInsignia } from '../../shared/ui/Insignia'
import type { CambioDeCobro, EstadoCobro } from './api'
import { DialogoAnularCobro } from './DialogoAnularCobro'
import { DialogoCobro } from './DialogoCobro'
import { cobroDeServicioQuery } from './queries'
import { bolivianos, TEXTO_ESTADO_COBRO, TEXTO_MODALIDAD } from './textos'

const TONO_ESTADO: Record<EstadoCobro, TonoInsignia> = {
  PENDIENTE: 'ambar',
  PAGADO: 'verde',
  ANULADO: 'gris',
}

function resumen(importe: number, estado: EstadoCobro, modalidad: string) {
  return `${bolivianos(importe)}, ${TEXTO_ESTADO_COBRO[estado].toLowerCase()} (${modalidad})`
}

function textoDelCambio(cambio: CambioDeCobro) {
  const antes = resumen(cambio.importeAnterior, cambio.estadoAnterior, TEXTO_MODALIDAD[cambio.modalidadAnterior])
  if (cambio.tipo === 'ANULACION') {
    return `Anulado. Era ${antes}.`
  }
  return `${antes} → ${resumen(cambio.importeNuevo, cambio.estadoNuevo, TEXTO_MODALIDAD[cambio.modalidadNueva])}.`
}

/**
 * PB-29: el cobro de un servicio (una atención terminada), en el detalle del incidente o del traslado. Se consulta
 * aparte del servicio: cobrar no cambia cómo terminó.
 */
export function CobroDelServicio({ atencionId }: { atencionId: number }) {
  const consulta = useQuery(cobroDeServicioQuery(atencionId))
  const [editando, setEditando] = useState(false)
  const [anulando, setAnulando] = useState(false)

  if (consulta.isPending) {
    return <Spinner size="small" color="$textoSecundario" self="flex-start" />
  }
  if (consulta.isError) {
    return (
      <Text fontSize={13} color="$textoSecundario">
        No se pudo cargar el cobro.
      </Text>
    )
  }

  const servicio = consulta.data
  const { cobro, tarifaDeReferencia } = servicio
  const referencia = tarifaDeReferencia
    ? `Tarifa de referencia: ${bolivianos(tarifaDeReferencia.monto)}`
    : 'Sin tarifa de referencia para ese día'

  return (
    <YStack gap={10}>
      <XStack items="center" gap={12} flexWrap="wrap" justify="space-between">
        <YStack gap={4} flex={1} minW={220}>
          {cobro ? (
            <XStack items="center" gap={10} flexWrap="wrap">
              <Insignia tono={TONO_ESTADO[cobro.estado]}>{TEXTO_ESTADO_COBRO[cobro.estado]}</Insignia>
              <Text fontFamily="$mono" fontSize={15} fontWeight="600" color="$texto">
                {bolivianos(cobro.importe)}
              </Text>
              <Text fontSize={14} color="$texto">
                {TEXTO_MODALIDAD[cobro.modalidad]}
              </Text>
            </XStack>
          ) : (
            <Text fontSize={14} fontWeight="500" color="$texto">
              {servicio.terminado ? 'Sin cobro registrado' : 'Se cobra cuando el servicio termine'}
            </Text>
          )}
          <Text fontSize={12} color="$textoSecundario">
            {cobro ? `Registró ${cobro.registradoPor}, ${fechaHoraCorta(cobro.fechaRegistro)} · ${referencia}` : referencia}
          </Text>
        </YStack>
        {servicio.terminado && cobro?.estado !== 'ANULADO' ? (
          <XStack gap={8}>
            <Button size="$3" variant="outlined" onPress={() => setEditando(true)}>
              {cobro ? 'Ajustar' : 'Registrar cobro'}
            </Button>
            {cobro ? (
              <Button size="$3" chromeless onPress={() => setAnulando(true)}>
                <Button.Text fontSize={13} color="$primarioPresionado" fontWeight="600">
                  Anular
                </Button.Text>
              </Button>
            ) : null}
          </XStack>
        ) : null}
      </XStack>

      {servicio.cambios.length > 0 ? (
        <YStack gap={6} pl={12} borderLeftWidth={2} borderColor="$borde">
          {servicio.cambios.map((cambio) => (
            <YStack key={`${cambio.fechaHora}-${cambio.tipo}`} gap={2}>
              <Text fontSize={12} color="$textoSecundario">
                {fechaHoraCorta(cambio.fechaHora)} · {cambio.tipo === 'ANULACION' ? 'Anulación' : 'Ajuste'} de{' '}
                {cambio.responsable}
              </Text>
              <Paragraph fontSize={13} lineHeight={18} color="$texto">
                {textoDelCambio(cambio)} Motivo: {cambio.motivo}
              </Paragraph>
            </YStack>
          ))}
        </YStack>
      ) : null}

      {editando ? <DialogoCobro servicio={servicio} onCerrar={() => setEditando(false)} /> : null}
      {anulando && cobro ? <DialogoAnularCobro cobro={cobro} onCerrar={() => setAnulando(false)} /> : null}
    </YStack>
  )
}
