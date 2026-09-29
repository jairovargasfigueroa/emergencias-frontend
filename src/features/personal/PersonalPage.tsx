import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Button, Text, XStack, YStack, useToastController } from 'tamagui'
import { mensajeDeError } from '../../shared/api/cliente'
import { fechaHoraCorta } from '../../shared/formato/fechas'
import { BotonPrimario } from '../../shared/ui/botones'
import { DialogoConfirmacion } from '../../shared/ui/DialogoConfirmacion'
import { EncabezadoPagina } from '../../shared/ui/EncabezadoPagina'
import { Cargando, ErrorAlCargar } from '../../shared/ui/EstadosDeCarga'
import {
  IconoApagar,
  IconoAsignar,
  IconoEditar,
  IconoFinDeTurno,
  IconoHistorial,
  IconoMas,
  IconoQuitar,
  IconoReactivar,
  IconoReasignar,
} from '../../shared/ui/iconos'
import { Insignia } from '../../shared/ui/Insignia'
import { MenuAcciones, type AccionDeMenu } from '../../shared/ui/MenuAcciones'
import { FilaTabla, Tabla, TablaVacia, type ColumnaTabla } from '../../shared/ui/Tabla'
import { AsignarAmbulanciaDialog } from '../asignaciones/AsignarAmbulanciaDialog'
import { HistorialAsignacionesDialog, type SujetoHistorial } from '../asignaciones/HistorialAsignacionesDialog'
import { quitarDeLaUnidadMutation } from '../asignaciones/queries'
import type { Paramedico } from './api'
import { DialogoCerrarTurno, type TurnoPorCerrar } from './DialogoCerrarTurno'
import { EditarParamedicoDialog } from './EditarParamedicoDialog'
import { activarParamedicoMutation, desactivarParamedicoMutation, paramedicosQuery } from './queries'
import { RegistrarParamedicoDialog } from './RegistrarParamedicoDialog'

const COLUMNAS: ColumnaTabla[] = [
  { titulo: 'Nombre' },
  { titulo: 'Teléfono', ancho: 130 },
  { titulo: 'Ambulancia asignada', ancho: 210 },
  { titulo: 'Registro', ancho: 110 },
  { titulo: 'Acciones', ancho: 96, alinearDerecha: true },
]

/** Las tres acciones que se confirman antes de correr, porque cambian de golpe lo que la persona puede hacer. */
type Confirmacion = { tipo: 'desactivar' | 'quitar' | 'activar'; paramedico: Paramedico }

function iniciales(nombreCompleto: string) {
  return nombreCompleto
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join('')
}

function textosDe(confirmacion: Confirmacion) {
  const { nombreCompleto, asignacionVigente } = confirmacion.paramedico
  switch (confirmacion.tipo) {
    case 'desactivar':
      return {
        titulo: `¿Desactivar a ${nombreCompleto}?`,
        descripcion: 'No estará disponible para la operación. Sus asignaciones se conservan.',
        textoConfirmar: 'Desactivar',
        tono: 'peligro' as const,
        exito: 'Paramédico desactivado',
        fallo: 'No se pudo desactivar',
        detalle: `${nombreCompleto} ya no está disponible para la operación.`,
      }
    case 'quitar':
      return {
        titulo: `¿Quitar a ${nombreCompleto} de la ambulancia ${asignacionVigente?.placa ?? ''}?`,
        descripcion: 'Se queda sin ambulancia y no podrá abrir turno hasta que se le asigne otra.',
        textoConfirmar: 'Quitar',
        tono: 'aviso' as const,
        exito: 'Paramédico sin ambulancia',
        fallo: 'No se pudo quitar de la unidad',
        detalle: `${nombreCompleto} ya no opera ninguna unidad.`,
      }
    case 'activar':
      return {
        titulo: `¿Activar a ${nombreCompleto}?`,
        descripcion: 'Vuelve a estar disponible para la operación y a entrar a su app.',
        textoConfirmar: 'Activar',
        tono: 'aviso' as const,
        exito: 'Paramédico activado',
        fallo: 'No se pudo activar',
        detalle: `${nombreCompleto} vuelve a estar disponible para la operación.`,
      }
  }
}

/** PB-01: personal de la flota y la ambulancia que opera cada uno. No existe borrado: solo baja lógica (R4). */
export function PersonalPage() {
  const queryClient = useQueryClient()
  const toast = useToastController()
  const paramedicos = useQuery(paramedicosQuery())
  const desactivar = useMutation(desactivarParamedicoMutation(queryClient))
  const activar = useMutation(activarParamedicoMutation(queryClient))
  const quitarDeLaUnidad = useMutation(quitarDeLaUnidadMutation(queryClient))

  const [registrarAbierto, setRegistrarAbierto] = useState(false)
  const [porAsignar, setPorAsignar] = useState<Paramedico | null>(null)
  const [porEditar, setPorEditar] = useState<Paramedico | null>(null)
  const [confirmacion, setConfirmacion] = useState<Confirmacion | null>(null)
  const [turnoPorCerrar, setTurnoPorCerrar] = useState<TurnoPorCerrar | null>(null)
  const [historial, setHistorial] = useState<SujetoHistorial | null>(null)

  const textos = confirmacion ? textosDe(confirmacion) : null
  const confirmando = desactivar.isPending || activar.isPending || quitarDeLaUnidad.isPending

  function confirmar() {
    if (!confirmacion || !textos) {
      return
    }
    const { tipo, paramedico } = confirmacion
    const accion = tipo === 'desactivar' ? desactivar : tipo === 'activar' ? activar : quitarDeLaUnidad
    accion.mutate(paramedico.id, {
      onSuccess: () => {
        setConfirmacion(null)
        toast.show(textos.exito, { message: textos.detalle })
      },
      onError: (error) => {
        // El backend explica en el mensaje qué hacer (salir de turno, liberar el teléfono): se muestra tal cual.
        setConfirmacion(null)
        toast.show(textos.fallo, { message: mensajeDeError(error) })
      },
    })
  }

  /** El menú de cada fila lleva lo que esa persona puede hacer hoy, y apagado lo que va a poder al salir de turno. */
  function accionesDe(paramedico: Paramedico): AccionDeMenu[] {
    const historialDeAsignaciones: AccionDeMenu = {
      etiqueta: 'Historial',
      icono: <IconoHistorial size={16} />,
      onElegir: () => setHistorial({ tipo: 'paramedico', id: paramedico.id, nombre: paramedico.nombreCompleto }),
    }

    if (!paramedico.activo) {
      return [
        {
          etiqueta: 'Activar',
          icono: <IconoReactivar size={16} />,
          onElegir: () => setConfirmacion({ tipo: 'activar', paramedico }),
        },
        historialDeAsignaciones,
      ]
    }

    // Con el turno abierto no se lo puede dar de baja ni cambiar o bajar de su unidad: se quedaría trabajando en algo
    // que el sistema ya no le reconoce. Se ven apagadas, con el motivo, hasta que se le cierre el turno.
    const motivoEnTurno = paramedico.enTurno ? 'Está en turno: ciérrale el turno primero' : undefined

    return [
      paramedico.asignacionVigente
        ? {
            etiqueta: 'Reasignar',
            icono: <IconoReasignar size={16} />,
            motivo: motivoEnTurno,
            onElegir: () => setPorAsignar(paramedico),
          }
        : {
            etiqueta: 'Asignar',
            icono: <IconoAsignar size={16} />,
            motivo: motivoEnTurno,
            onElegir: () => setPorAsignar(paramedico),
          },
      { etiqueta: 'Editar', icono: <IconoEditar size={16} />, onElegir: () => setPorEditar(paramedico) },
      // Para quien se fue sin cerrarlo. Solo aparece con el turno abierto: a los demás no hay nada que cerrarles.
      ...(paramedico.enTurno
        ? [
            {
              etiqueta: 'Cerrar turno',
              icono: <IconoFinDeTurno size={16} />,
              onElegir: () =>
                setTurnoPorCerrar({
                  paramedicoId: paramedico.id,
                  nombre: paramedico.nombreCompleto,
                  placa: paramedico.asignacionVigente?.placa ?? null,
                }),
            },
          ]
        : []),
      ...(paramedico.asignacionVigente
        ? [
            {
              etiqueta: 'Quitar de la unidad',
              icono: <IconoQuitar size={16} />,
              motivo: motivoEnTurno,
              onElegir: () => setConfirmacion({ tipo: 'quitar', paramedico }),
            },
          ]
        : []),
      {
        etiqueta: 'Desactivar',
        icono: <IconoApagar size={16} color="var(--primarioPresionado)" />,
        tono: 'peligro',
        motivo: motivoEnTurno,
        onElegir: () => setConfirmacion({ tipo: 'desactivar', paramedico }),
      },
      historialDeAsignaciones,
    ]
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
                    {/* El turno se abre en la unidad asignada: la marca va al lado de su placa. */}
                    <XStack items="center" gap={8}>
                      <Text fontFamily="$mono" fontSize={13} fontWeight="500" color={paramedico.activo ? '$texto' : '$textoSecundario'}>
                        {paramedico.asignacionVigente.placa}
                      </Text>
                      {paramedico.enTurno ? (
                        <Insignia tono="verde" conPunto>
                          En turno
                        </Insignia>
                      ) : null}
                    </XStack>
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
                  <Insignia tono="contorno">Inactivo</Insignia>
                )}
                <MenuAcciones etiqueta={`Acciones de ${paramedico.nombreCompleto}`} acciones={accionesDe(paramedico)} />
              </FilaTabla>
            ))
          )}
        </Tabla>
      )}

      <RegistrarParamedicoDialog abierto={registrarAbierto} onCambiarAbierto={setRegistrarAbierto} />

      <AsignarAmbulanciaDialog paramedico={porAsignar} onCerrar={() => setPorAsignar(null)} />

      {porEditar ? <EditarParamedicoDialog paramedico={porEditar} onCerrar={() => setPorEditar(null)} /> : null}

      <DialogoConfirmacion
        abierto={confirmacion !== null}
        onCambiarAbierto={(abierto) => (abierto ? undefined : setConfirmacion(null))}
        titulo={textos?.titulo ?? ''}
        descripcion={textos?.descripcion ?? ''}
        textoConfirmar={textos?.textoConfirmar ?? ''}
        tono={textos?.tono}
        pendiente={confirmando}
        onConfirmar={confirmar}
      />

      <DialogoCerrarTurno turno={turnoPorCerrar} onCerrar={() => setTurnoPorCerrar(null)} />

      <HistorialAsignacionesDialog sujeto={historial} onCerrar={() => setHistorial(null)} />
    </>
  )
}
