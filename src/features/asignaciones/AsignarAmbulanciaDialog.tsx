import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Button, Dialog, Paragraph, ScrollView, Spinner, Text, XStack, YStack, useToastController } from 'tamagui'
import { ErrorApi, codigoDeError, mensajeDeError } from '../../shared/api/cliente'
import { fechaHoraCorta } from '../../shared/formato/fechas'
import { BotonPrimario } from '../../shared/ui/botones'
import { Cargando, ErrorAlCargar, MensajeDeCampo } from '../../shared/ui/EstadosDeCarga'
import { IconoAviso } from '../../shared/ui/iconos'
import { Insignia } from '../../shared/ui/Insignia'
import { ambulanciasQuery } from '../flota/queries'
import type { Paramedico } from '../personal/api'
import type { ContextoReasignacion } from './api'
import { asignarParamedicoMutation } from './queries'

type Props = {
  paramedico: Paramedico | null
  onCerrar: () => void
}

type Paso = { tipo: 'elegir' } | { tipo: 'confirmar'; contexto: ContextoReasignacion; ambulanciaId: number }

/**
 * PB-01 CA-04 a CA-06. Si el paramédico ya tiene una asignación vigente, el backend responde 409
 * `REASIGNACION_REQUIERE_CONFIRMACION` sin cambiar nada; el diálogo pide confirmar y reintenta confirmando.
 */
export function AsignarAmbulanciaDialog({ paramedico, onCerrar }: Props) {
  const queryClient = useQueryClient()
  const toast = useToastController()
  const ambulancias = useQuery({ ...ambulanciasQuery(), enabled: paramedico !== null })
  const asignar = useMutation(asignarParamedicoMutation(queryClient))

  const [seleccionada, setSeleccionada] = useState<number | null>(null)
  const [paso, setPaso] = useState<Paso>({ tipo: 'elegir' })
  const [error, setError] = useState<string | null>(null)

  const activas = (ambulancias.data ?? []).filter((ambulancia) => ambulancia.activa)
  const placaDe = (id: number) => activas.find((ambulancia) => ambulancia.id === id)?.placa ?? ''

  function cerrar() {
    setSeleccionada(null)
    setPaso({ tipo: 'elegir' })
    setError(null)
    onCerrar()
  }

  function enviar(ambulanciaId: number, confirmarReasignacion: boolean) {
    if (!paramedico) {
      return
    }
    setError(null)
    asignar.mutate(
      { paramedicoId: paramedico.id, ambulanciaId, confirmarReasignacion },
      {
        onSuccess: (asignacion) => {
          toast.show('Asignación registrada', {
            message: `${paramedico.nombreCompleto} opera la ambulancia ${asignacion.placa}.`,
          })
          cerrar()
        },
        onError: (falla) => {
          if (codigoDeError(falla) === 'REASIGNACION_REQUIERE_CONFIRMACION' && falla instanceof ErrorApi) {
            setPaso({ tipo: 'confirmar', contexto: falla.cuerpo as unknown as ContextoReasignacion, ambulanciaId })
            return
          }
          setError(mensajeDeError(falla))
        },
      },
    )
  }

  const titulo =
    paso.tipo === 'confirmar' ? `¿Reasignar a ${paramedico?.nombreCompleto ?? ''}?` : 'Asignar ambulancia'

  return (
    <Dialog modal open={paramedico !== null} onOpenChange={(abierto) => (abierto ? undefined : cerrar())}>
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
          {paso.tipo === 'confirmar' ? (
            <XStack width={40} height={40} rounded={999} items="center" justify="center" bg="$enAtencionTinte">
              <IconoAviso size={20} color="var(--enAtencionTexto)" />
            </XStack>
          ) : null}

          <YStack gap={6}>
            <Dialog.Title color="$texto" fontSize={18} lineHeight={26} fontWeight="600">
              {titulo}
            </Dialog.Title>
            <Dialog.Description color="$textoSecundario" fontSize={14} lineHeight={21}>
              {paso.tipo === 'confirmar'
                ? `Hoy opera la ambulancia ${paso.contexto.asignacionVigente.placa} desde el ${fechaHoraCorta(
                    paso.contexto.asignacionVigente.fechaInicio,
                  )}. Si confirmas, esa asignación se cierra y empieza una nueva con ${placaDe(paso.ambulanciaId)}.`
                : paramedico?.asignacionVigente
                  ? `${paramedico.nombreCompleto} opera hoy la ambulancia ${paramedico.asignacionVigente.placa}.`
                  : `${paramedico?.nombreCompleto ?? ''} no tiene una ambulancia asignada.`}
            </Dialog.Description>
          </YStack>

          {paso.tipo === 'elegir' ? (
            ambulancias.isPending ? (
              <Cargando texto="Cargando ambulancias…" />
            ) : ambulancias.isError ? (
              <ErrorAlCargar error={ambulancias.error} onReintentar={() => ambulancias.refetch()} />
            ) : (
              <YStack gap={8}>
                <Text color="$texto" fontSize={13} fontWeight="500">
                  Ambulancia
                </Text>
                {activas.length === 0 ? (
                  <Paragraph color="$textoSecundario" fontSize={14}>
                    No hay ambulancias activas.
                  </Paragraph>
                ) : (
                  <ScrollView maxHeight={280}>
                    <YStack role="radiogroup" gap={8}>
                      {activas.map((ambulancia) => {
                        const elegida = seleccionada === ambulancia.id
                        const actual = paramedico?.asignacionVigente?.ambulanciaId === ambulancia.id
                        return (
                          <XStack
                            key={ambulancia.id}
                            role="radio"
                            aria-checked={elegida}
                            items="center"
                            gap={12}
                            px={14}
                            py={12}
                            rounded={10}
                            borderWidth={elegida ? 2 : 1}
                            borderColor={elegida ? '$primario' : '$borde'}
                            bg="$superficie"
                            cursor="pointer"
                            hoverStyle={{ borderColor: elegida ? '$primario' : '$bordeFuerte' }}
                            onPress={() => setSeleccionada(ambulancia.id)}
                          >
                            <XStack
                              width={18}
                              height={18}
                              rounded={999}
                              borderWidth={elegida ? 5 : 2}
                              borderColor={elegida ? '$primario' : '$bordeFuerte'}
                            />
                            <Text fontFamily="$mono" fontSize={13} fontWeight="500" color="$texto">
                              {ambulancia.placa}
                            </Text>
                            <Text fontSize={14} color="$textoSecundario" flex={1} numberOfLines={1}>
                              {ambulancia.tipoUnidad}
                            </Text>
                            {actual ? <Insignia tono="contorno">Actual</Insignia> : null}
                          </XStack>
                        )
                      })}
                    </YStack>
                  </ScrollView>
                )}
              </YStack>
            )
          ) : null}

          <MensajeDeCampo texto={error} />

          <XStack gap={8} justify="flex-end">
            <Button size="$4" variant="outlined" disabled={asignar.isPending} onPress={cerrar}>
              Cancelar
            </Button>
            <BotonPrimario
              size="$4"
              disabled={asignar.isPending || (paso.tipo === 'elegir' && seleccionada === null)}
              opacity={asignar.isPending || (paso.tipo === 'elegir' && seleccionada === null) ? 0.6 : 1}
              icon={asignar.isPending ? <Spinner size="small" color="$primarioTexto" /> : undefined}
              onPress={() => {
                if (paso.tipo === 'confirmar') {
                  enviar(paso.ambulanciaId, true)
                } else if (seleccionada !== null) {
                  enviar(seleccionada, false)
                }
              }}
            >
              <Button.Text color="$primarioTexto">{paso.tipo === 'confirmar' ? 'Reasignar' : 'Asignar'}</Button.Text>
            </BotonPrimario>
          </XStack>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
