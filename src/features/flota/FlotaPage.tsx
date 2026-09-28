import { useMutation, useQuery, useQueryClient, type UseMutationResult } from '@tanstack/react-query'
import { useState } from 'react'
import { Button, Paragraph, Text, XStack, useToastController } from 'tamagui'
import { mensajeDeError } from '../../shared/api/cliente'
import { BotonPrimario } from '../../shared/ui/botones'
import { DialogoConfirmacion } from '../../shared/ui/DialogoConfirmacion'
import { EncabezadoPagina } from '../../shared/ui/EncabezadoPagina'
import { Cargando, ErrorAlCargar } from '../../shared/ui/EstadosDeCarga'
import { IconoApagar, IconoEditar, IconoHistorial, IconoLlave, IconoMas, IconoReactivar } from '../../shared/ui/iconos'
import { Insignia } from '../../shared/ui/Insignia'
import { MenuAcciones, type AccionDeMenu } from '../../shared/ui/MenuAcciones'
import { FilaTabla, Tabla, TablaVacia, type ColumnaTabla } from '../../shared/ui/Tabla'
import { HistorialAsignacionesDialog, type SujetoHistorial } from '../asignaciones/HistorialAsignacionesDialog'
import { TIPO_UNIDAD_CORTO, type Ambulancia } from './api'
import { EditarAmbulanciaDialog } from './EditarAmbulanciaDialog'
import { EstadoAmbulancia } from './EstadoAmbulancia'
import {
  activarAmbulanciaMutation,
  ambulanciasQuery,
  desactivarAmbulanciaMutation,
  marcarFueraDeServicioMutation,
  reactivarAmbulanciaMutation,
} from './queries'
import { RegistrarAmbulanciaDialog } from './RegistrarAmbulanciaDialog'

const COLUMNAS: ColumnaTabla[] = [
  { titulo: 'Placa', ancho: 140 },
  { titulo: 'Tipo de unidad' },
  { titulo: 'Estado', ancho: 170 },
  { titulo: 'Registro', ancho: 120 },
  { titulo: 'Acciones', ancho: 96, alinearDerecha: true },
]

/** Las dos acciones que se confirman antes de correr, porque cambian de golpe si la unidad se ofrece o no. */
type Confirmacion = { tipo: 'desactivar' | 'activar'; ambulancia: Ambulancia }

function textosDe(confirmacion: Confirmacion) {
  const { placa } = confirmacion.ambulancia
  switch (confirmacion.tipo) {
    case 'desactivar':
      return {
        titulo: `¿Desactivar la ambulancia ${placa}?`,
        descripcion: 'Deja de ofrecerse para la operación. Sus asignaciones y atenciones se conservan.',
        textoConfirmar: 'Desactivar',
        tono: 'peligro' as const,
        exito: 'Ambulancia desactivada',
        fallo: 'No se pudo desactivar',
        detalle: `${placa} ya no se ofrece para la operación.`,
      }
    case 'activar':
      return {
        titulo: `¿Activar la ambulancia ${placa}?`,
        descripcion: 'Vuelve a ofrecerse para la operación, con el estado operativo que tenía al darla de baja.',
        textoConfirmar: 'Activar',
        tono: 'aviso' as const,
        exito: 'Ambulancia activada',
        fallo: 'No se pudo activar',
        detalle: `${placa} vuelve a estar en la operación.`,
      }
  }
}

/** PB-01: flota de ambulancias. No existe borrado: solo baja lógica (R4). */
export function FlotaPage() {
  const queryClient = useQueryClient()
  const toast = useToastController()
  const ambulancias = useQuery(ambulanciasQuery())
  const fueraDeServicio = useMutation(marcarFueraDeServicioMutation(queryClient))
  const reactivar = useMutation(reactivarAmbulanciaMutation(queryClient))
  const desactivar = useMutation(desactivarAmbulanciaMutation(queryClient))
  const activar = useMutation(activarAmbulanciaMutation(queryClient))

  const [registrarAbierto, setRegistrarAbierto] = useState(false)
  const [porEditar, setPorEditar] = useState<Ambulancia | null>(null)
  const [confirmacion, setConfirmacion] = useState<Confirmacion | null>(null)
  const [historial, setHistorial] = useState<SujetoHistorial | null>(null)

  const textos = confirmacion ? textosDe(confirmacion) : null
  const confirmando = desactivar.isPending || activar.isPending

  /** Los dos cambios de estado operativo se corren derecho: son reversibles y no se pierde nada al equivocarse. */
  function ejecutar(accion: UseMutationResult<Ambulancia, Error, number>, ambulancia: Ambulancia, exito: string) {
    accion.mutate(ambulancia.id, {
      onSuccess: () => toast.show(exito, { message: `Ambulancia ${ambulancia.placa}.` }),
      onError: (error) => toast.show('No se pudo completar la acción', { message: mensajeDeError(error) }),
    })
  }

  function confirmar() {
    if (!confirmacion || !textos) {
      return
    }
    const { tipo, ambulancia } = confirmacion
    const accion = tipo === 'desactivar' ? desactivar : activar
    accion.mutate(ambulancia.id, {
      onSuccess: () => {
        setConfirmacion(null)
        toast.show(textos.exito, { message: textos.detalle })
      },
      onError: (error) => {
        setConfirmacion(null)
        toast.show(textos.fallo, { message: mensajeDeError(error) })
      },
    })
  }

  /** El menú de cada fila lleva lo que esa unidad puede hacer hoy, y apagado lo que va a poder al terminar. */
  function accionesDe(ambulancia: Ambulancia): AccionDeMenu[] {
    const historialDeAsignaciones: AccionDeMenu = {
      etiqueta: 'Historial',
      icono: <IconoHistorial size={16} />,
      onElegir: () => setHistorial({ tipo: 'ambulancia', id: ambulancia.id, placa: ambulancia.placa }),
    }

    // Dada de baja no está en la operación: sacarla de servicio o volver a darla de baja no significan nada para
    // ella, así que no se ofrecen ni apagadas. Lo único que cabe es deshacer la baja.
    if (!ambulancia.activa) {
      return [
        {
          etiqueta: 'Activar',
          icono: <IconoReactivar size={16} />,
          onElegir: () => setConfirmacion({ tipo: 'activar', ambulancia }),
        },
        historialDeAsignaciones,
      ]
    }

    // Mientras atiende no se la puede sacar de servicio ni dar de baja, y con gente de turno adentro tampoco darla de
    // baja. Las dos se van a poder más tarde: se muestran apagadas con el motivo, que dice además cómo destrabarlas,
    // para que no parezca que la pantalla las perdió.
    const atendiendo = ambulancia.estado === 'EN_ATENCION'
    const motivoFueraDeServicio = atendiendo
      ? 'Está atendiendo: que la tripulación cancele por avería o cierra la atención en el Centro de control'
      : undefined
    const motivoDesactivar = atendiendo
      ? 'Está atendiendo'
      : ambulancia.tripulantesEnTurno > 0
        ? 'Tiene gente de turno: ciérrales el turno primero'
        : undefined

    return [
      { etiqueta: 'Editar', icono: <IconoEditar size={16} />, onElegir: () => setPorEditar(ambulancia) },
      ambulancia.estado === 'FUERA_DE_SERVICIO'
        ? {
            etiqueta: 'Volver a servicio',
            icono: <IconoReactivar size={16} />,
            onElegir: () => ejecutar(reactivar, ambulancia, 'Ambulancia de vuelta en servicio'),
          }
        : {
            etiqueta: 'Fuera de servicio',
            icono: <IconoLlave size={16} />,
            motivo: motivoFueraDeServicio,
            onElegir: () => ejecutar(fueraDeServicio, ambulancia, 'Ambulancia fuera de servicio'),
          },
      {
        etiqueta: 'Desactivar',
        icono: <IconoApagar size={16} color="var(--primarioPresionado)" />,
        tono: 'peligro',
        motivo: motivoDesactivar,
        onElegir: () => setConfirmacion({ tipo: 'desactivar', ambulancia }),
      },
      historialDeAsignaciones,
    ]
  }

  return (
    <>
      <EncabezadoPagina
        titulo="Flota"
        descripcion="Ambulancias registradas y su estado operativo."
        accion={
          <BotonPrimario size="$4" icon={<IconoMas size={16} color="#FFFFFF" />} onPress={() => setRegistrarAbierto(true)}>
            <Button.Text color="$primarioTexto">Registrar ambulancia</Button.Text>
          </BotonPrimario>
        }
      />

      {ambulancias.isPending ? (
        <Cargando texto="Cargando la flota…" />
      ) : ambulancias.isError ? (
        <ErrorAlCargar error={ambulancias.error} onReintentar={() => ambulancias.refetch()} />
      ) : (
        <Tabla columnas={COLUMNAS}>
          {ambulancias.data.length === 0 ? (
            <TablaVacia>Aún no hay ambulancias registradas.</TablaVacia>
          ) : (
            ambulancias.data.map((ambulancia) => (
              <FilaTabla key={ambulancia.id} columnas={COLUMNAS} atenuada={!ambulancia.activa}>
                <Text fontFamily="$mono" fontSize={13} fontWeight="500" color={ambulancia.activa ? '$texto' : '$textoSecundario'}>
                  {ambulancia.placa}
                </Text>
                <Paragraph fontSize={14} color={ambulancia.activa ? '$texto' : '$textoTenue'} numberOfLines={1}>
                  {TIPO_UNIDAD_CORTO[ambulancia.tipoUnidad]}
                </Paragraph>
                <XStack opacity={ambulancia.activa ? 1 : 0.55}>
                  <EstadoAmbulancia estado={ambulancia.estado} />
                </XStack>
                {ambulancia.activa ? (
                  <Text fontSize={14} color="$texto">
                    Activa
                  </Text>
                ) : (
                  <Insignia tono="contorno">Inactiva</Insignia>
                )}
                <MenuAcciones etiqueta={`Acciones de la ambulancia ${ambulancia.placa}`} acciones={accionesDe(ambulancia)} />
              </FilaTabla>
            ))
          )}
        </Tabla>
      )}

      <RegistrarAmbulanciaDialog abierto={registrarAbierto} onCambiarAbierto={setRegistrarAbierto} />

      {porEditar ? <EditarAmbulanciaDialog ambulancia={porEditar} onCerrar={() => setPorEditar(null)} /> : null}

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

      <HistorialAsignacionesDialog sujeto={historial} onCerrar={() => setHistorial(null)} />
    </>
  )
}
