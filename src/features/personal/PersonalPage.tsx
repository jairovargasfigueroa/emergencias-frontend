import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Button, Text, XStack, YStack, useToastController } from 'tamagui'
import { mensajeDeError } from '../../shared/api/cliente'
import { fechaHoraCorta } from '../../shared/formato/fechas'
import { BotonPrimario } from '../../shared/ui/botones'
import { DialogoConfirmacion } from '../../shared/ui/DialogoConfirmacion'
import { EncabezadoPagina } from '../../shared/ui/EncabezadoPagina'
import { Cargando, ErrorAlCargar } from '../../shared/ui/EstadosDeCarga'
import { IconoApagar, IconoAsignar, IconoHistorial, IconoMas, IconoReasignar } from '../../shared/ui/iconos'
import { Insignia } from '../../shared/ui/Insignia'
import { FilaTabla, Tabla, TablaVacia, type ColumnaTabla } from '../../shared/ui/Tabla'
import { AsignarAmbulanciaDialog } from '../asignaciones/AsignarAmbulanciaDialog'
import { HistorialAsignacionesDialog, type SujetoHistorial } from '../asignaciones/HistorialAsignacionesDialog'
import type { Paramedico } from './api'
import { desactivarParamedicoMutation, paramedicosQuery } from './queries'
import { RegistrarParamedicoDialog } from './RegistrarParamedicoDialog'

const COLUMNAS: ColumnaTabla[] = [
  { titulo: 'Nombre' },
  { titulo: 'Teléfono', ancho: 130 },
  { titulo: 'Ambulancia asignada', ancho: 210 },
  { titulo: 'Registro', ancho: 110 },
  { titulo: 'Acciones', ancho: 360, alinearDerecha: true },
]

function iniciales(nombreCompleto: string) {
  return nombreCompleto
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join('')
}

/** PB-01: personal de la flota y la ambulancia que opera cada uno. No existe borrado: solo baja lógica (R4). */
export function PersonalPage() {
  const queryClient = useQueryClient()
  const toast = useToastController()
  const paramedicos = useQuery(paramedicosQuery())
  const desactivar = useMutation(desactivarParamedicoMutation(queryClient))

  const [registrarAbierto, setRegistrarAbierto] = useState(false)
  const [porAsignar, setPorAsignar] = useState<Paramedico | null>(null)
  const [porDesactivar, setPorDesactivar] = useState<Paramedico | null>(null)
  const [historial, setHistorial] = useState<SujetoHistorial | null>(null)

  function confirmarDesactivacion() {
    if (!porDesactivar) {
      return
    }
    const paramedico = porDesactivar
    desactivar.mutate(paramedico.id, {
      onSuccess: () => {
        setPorDesactivar(null)
        toast.show('Paramédico desactivado', { message: `${paramedico.nombreCompleto} ya no está disponible para la operación.` })
      },
      onError: (error) => {
        setPorDesactivar(null)
        toast.show('No se pudo desactivar', { message: mensajeDeError(error) })
      },
    })
  }

  return (
    <>
      <EncabezadoPagina
        titulo="Personal"
        descripcion="Paramédicos y la ambulancia que opera cada uno."
        accion={
          <BotonPrimario size="$4" icon={<IconoMas size={16} color="#FFFFFF" />} onPress={() => setRegistrarAbierto(true)}>
            <Button.Text color="$primarioTexto">Registrar paramédico</Button.Text>
          </BotonPrimario>
        }
      />

      {paramedicos.isPending ? (
        <Cargando texto="Cargando el personal…" />
      ) : paramedicos.isError ? (
        <ErrorAlCargar error={paramedicos.error} onReintentar={() => paramedicos.refetch()} />
      ) : (
        <Tabla columnas={COLUMNAS}>
          {paramedicos.data.length === 0 ? (
            <TablaVacia>Aún no hay paramédicos registrados.</TablaVacia>
          ) : (
            paramedicos.data.map((paramedico) => (
              <FilaTabla key={paramedico.id} columnas={COLUMNAS} atenuada={!paramedico.activo} alto={64}>
                <XStack items="center" gap={12} minW={0}>
                  <XStack width={32} height={32} shrink={0} rounded={999} bg="$fondo" items="center" justify="center">
                    <Text fontSize={12} fontWeight="600" color={paramedico.activo ? '$textoSecundario' : '$textoTenue'}>
                      {iniciales(paramedico.nombreCompleto)}
                    </Text>
                  </XStack>
                  <Text fontSize={14} fontWeight="500" color={paramedico.activo ? '$texto' : '$textoSecundario'} numberOfLines={1}>
                    {paramedico.nombreCompleto}
                  </Text>
                </XStack>
                <Text fontSize={14} color={paramedico.activo ? '$texto' : '$textoTenue'}>
                  {paramedico.telefono}
                </Text>
                {paramedico.asignacionVigente ? (
                  <YStack>
                    <Text fontFamily="$mono" fontSize={13} fontWeight="500" color={paramedico.activo ? '$texto' : '$textoSecundario'}>
                      {paramedico.asignacionVigente.placa}
                    </Text>
                    <Text fontSize={12} lineHeight={16} color="$textoSecundario">
                      desde {fechaHoraCorta(paramedico.asignacionVigente.fechaInicio)}
                    </Text>
                  </YStack>
                ) : (
                  <Text fontSize={13} color="$textoTenue">
                    Sin asignar
                  </Text>
                )}
                {paramedico.activo ? (
                  <Text fontSize={14} color="$texto">
                    Activo
                  </Text>
                ) : (
                  <Insignia tono="contorno">Desactivado</Insignia>
                )}
                <XStack gap={6} justify="flex-end">
                  {paramedico.activo ? (
                    paramedico.asignacionVigente ? (
                      <Button size="$3" variant="outlined" icon={<IconoReasignar size={15} />} onPress={() => setPorAsignar(paramedico)}>
                        Reasignar
                      </Button>
                    ) : (
                      <Button
                        size="$3"
                        bg="$primarioTinte"
                        borderColor="$primarioTinte"
                        icon={<IconoAsignar size={15} color="var(--primarioPresionado)" />}
                        onPress={() => setPorAsignar(paramedico)}
                      >
                        <Button.Text color="$primarioPresionado">Asignar</Button.Text>
                      </Button>
                    )
                  ) : null}
                  <Button
                    size="$3"
                    variant="outlined"
                    icon={<IconoHistorial size={15} />}
                    onPress={() => setHistorial({ tipo: 'paramedico', id: paramedico.id, nombre: paramedico.nombreCompleto })}
                  >
                    Historial
                  </Button>
                  {paramedico.activo ? (
                    <Button
                      size="$3"
                      chromeless
                      icon={<IconoApagar size={15} color="var(--primarioPresionado)" />}
                      onPress={() => setPorDesactivar(paramedico)}
                    >
                      <Button.Text color="$primarioPresionado">Desactivar</Button.Text>
                    </Button>
                  ) : null}
                </XStack>
              </FilaTabla>
            ))
          )}
        </Tabla>
      )}

      <RegistrarParamedicoDialog abierto={registrarAbierto} onCambiarAbierto={setRegistrarAbierto} />

      <AsignarAmbulanciaDialog paramedico={porAsignar} onCerrar={() => setPorAsignar(null)} />

      <DialogoConfirmacion
        abierto={porDesactivar !== null}
        onCambiarAbierto={(abierto) => (abierto ? undefined : setPorDesactivar(null))}
        titulo={`¿Desactivar a ${porDesactivar?.nombreCompleto ?? ''}?`}
        descripcion="No estará disponible para la operación. Sus asignaciones se conservan."
        textoConfirmar="Desactivar"
        pendiente={desactivar.isPending}
        onConfirmar={confirmarDesactivacion}
      />

      <HistorialAsignacionesDialog sujeto={historial} onCerrar={() => setHistorial(null)} />
    </>
  )
}
