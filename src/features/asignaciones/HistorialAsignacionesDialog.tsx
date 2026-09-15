import { useQuery } from '@tanstack/react-query'
import { Button, Dialog, ScrollView, Text, XStack, YStack } from 'tamagui'
import { fechaHora } from '../../shared/formato/fechas'
import { Cargando, ErrorAlCargar } from '../../shared/ui/EstadosDeCarga'
import { IconoCerrar } from '../../shared/ui/iconos'
import { Insignia } from '../../shared/ui/Insignia'
import { FilaTabla, Tabla, TablaVacia, type ColumnaTabla } from '../../shared/ui/Tabla'
import type { Asignacion } from './api'
import { historialDeAmbulanciaQuery, historialDeParamedicoQuery } from './queries'

export type SujetoHistorial =
  | { tipo: 'ambulancia'; id: number; placa: string }
  | { tipo: 'paramedico'; id: number; nombre: string }

type Props = {
  sujeto: SujetoHistorial | null
  onCerrar: () => void
}

/** PB-01 CA-04: las asignaciones se ven desde la ambulancia y desde el paramédico, con el historial completo. */
export function HistorialAsignacionesDialog({ sujeto, onCerrar }: Props) {
  const esAmbulancia = sujeto?.tipo === 'ambulancia'
  const consultaAmbulancia = useQuery({
    ...historialDeAmbulanciaQuery(sujeto?.id ?? 0),
    enabled: sujeto?.tipo === 'ambulancia',
  })
  const consultaParamedico = useQuery({
    ...historialDeParamedicoQuery(sujeto?.id ?? 0),
    enabled: sujeto?.tipo === 'paramedico',
  })
  const consulta = esAmbulancia ? consultaAmbulancia : consultaParamedico

  const columnas: ColumnaTabla[] = [
    { titulo: esAmbulancia ? 'Paramédico' : 'Ambulancia' },
    { titulo: 'Inicio', ancho: 190 },
    { titulo: 'Fin', ancho: 190 },
    { titulo: 'Estado', ancho: 110 },
  ]

  return (
    <Dialog modal open={sujeto !== null} onOpenChange={(abierto) => (abierto ? undefined : onCerrar())}>
      <Dialog.Portal>
        <Dialog.Overlay key="overlay" bg="$velo" transition="quick" enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} />
        <Dialog.Content
          key="content"
          width={820}
          maxW="94%"
          p={0}
          rounded={14}
          bg="$superficie"
          borderWidth={1}
          borderColor="$borde"
          overflow="hidden"
          elevate
          transition="quick"
          enterStyle={{ opacity: 0, y: -12, scale: 0.97 }}
          exitStyle={{ opacity: 0, y: 8, scale: 0.97 }}
        >
          <XStack items="center" justify="space-between" gap={16} px={24} py={20} borderBottomWidth={1} borderColor="$borde">
            <YStack gap={2}>
              <Dialog.Title color="$texto" fontSize={18} lineHeight={26} fontWeight="600">
                Historial de asignaciones
              </Dialog.Title>
              <Dialog.Description color="$textoSecundario" fontSize={13} lineHeight={18}>
                {sujeto?.tipo === 'ambulancia' ? `Ambulancia ${sujeto.placa}` : sujeto ? `Paramédico ${sujeto.nombre}` : ''}
              </Dialog.Description>
            </YStack>
            <Dialog.Close asChild>
              <Button size="$3" chromeless circular aria-label="Cerrar" icon={<IconoCerrar size={16} />} />
            </Dialog.Close>
          </XStack>

          <YStack p={16}>
            {consulta.isPending ? (
              <Cargando texto="Cargando historial…" />
            ) : consulta.isError ? (
              <ErrorAlCargar error={consulta.error} onReintentar={() => consulta.refetch()} />
            ) : (
              <ScrollView maxHeight={420}>
                <Tabla columnas={columnas}>
                  {consulta.data.length === 0 ? (
                    <TablaVacia>Todavía no tiene asignaciones.</TablaVacia>
                  ) : (
                    consulta.data.map((asignacion) => (
                      <FilaHistorial key={asignacion.id} asignacion={asignacion} columnas={columnas} esAmbulancia={esAmbulancia} />
                    ))
                  )}
                </Tabla>
              </ScrollView>
            )}
          </YStack>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}

function FilaHistorial({
  asignacion,
  columnas,
  esAmbulancia,
}: {
  asignacion: Asignacion
  columnas: ColumnaTabla[]
  esAmbulancia: boolean
}) {
  return (
    <FilaTabla columnas={columnas} alto={52}>
      {esAmbulancia ? (
        <Text fontSize={14} fontWeight="500" color="$texto">
          {asignacion.paramedicoNombre}
        </Text>
      ) : (
        <Text fontFamily="$mono" fontSize={13} fontWeight="500" color="$texto">
          {asignacion.placa}
        </Text>
      )}
      <Text fontSize={14} color="$texto">
        {fechaHora(asignacion.fechaInicio)}
      </Text>
      <Text fontSize={14} color={asignacion.fechaFin ? '$texto' : '$textoTenue'}>
        {asignacion.fechaFin ? fechaHora(asignacion.fechaFin) : '—'}
      </Text>
      {asignacion.vigente ? <Insignia tono="verde">Vigente</Insignia> : <Insignia tono="contorno">Cerrada</Insignia>}
    </FilaTabla>
  )
}
