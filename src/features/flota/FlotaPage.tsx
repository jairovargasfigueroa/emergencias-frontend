import { useMutation, useQuery, useQueryClient, type UseMutationResult } from '@tanstack/react-query'
import { useState } from 'react'
import { Button, Paragraph, Text, XStack, useToastController } from 'tamagui'
import { mensajeDeError } from '../../shared/api/cliente'
import { BotonPrimario } from '../../shared/ui/botones'
import { DialogoConfirmacion } from '../../shared/ui/DialogoConfirmacion'
import { EncabezadoPagina } from '../../shared/ui/EncabezadoPagina'
import { Cargando, ErrorAlCargar } from '../../shared/ui/EstadosDeCarga'
import { IconoApagar, IconoHistorial, IconoLlave, IconoMas, IconoReactivar } from '../../shared/ui/iconos'
import { Insignia } from '../../shared/ui/Insignia'
import { FilaTabla, Tabla, TablaVacia, type ColumnaTabla } from '../../shared/ui/Tabla'
import { HistorialAsignacionesDialog, type SujetoHistorial } from '../asignaciones/HistorialAsignacionesDialog'
import type { Ambulancia } from './api'
import { EstadoAmbulancia } from './EstadoAmbulancia'
import {
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
  { titulo: 'Acciones', ancho: 410, alinearDerecha: true },
]

const MOTIVO_EN_ATENCION = 'Tiene una atención en curso'

/** PB-01: flota de ambulancias. No existe borrado: solo baja lógica (R4). */
export function FlotaPage() {
  const queryClient = useQueryClient()
  const toast = useToastController()
  const ambulancias = useQuery(ambulanciasQuery())
  const fueraDeServicio = useMutation(marcarFueraDeServicioMutation(queryClient))
  const reactivar = useMutation(reactivarAmbulanciaMutation(queryClient))
  const desactivar = useMutation(desactivarAmbulanciaMutation(queryClient))

  const [registrarAbierto, setRegistrarAbierto] = useState(false)
  const [porDesactivar, setPorDesactivar] = useState<Ambulancia | null>(null)
  const [historial, setHistorial] = useState<SujetoHistorial | null>(null)

  function ejecutar(accion: UseMutationResult<Ambulancia, Error, number>, ambulancia: Ambulancia, exito: string) {
    accion.mutate(ambulancia.id, {
      onSuccess: () => toast.show(exito, { message: `Ambulancia ${ambulancia.placa}.` }),
      onError: (error) => toast.show('No se pudo completar la acción', { message: mensajeDeError(error) }),
    })
  }

  function confirmarDesactivacion() {
    if (!porDesactivar) {
      return
    }
    const ambulancia = porDesactivar
    desactivar.mutate(ambulancia.id, {
      onSuccess: () => {
        setPorDesactivar(null)
        toast.show('Ambulancia desactivada', { message: `${ambulancia.placa} ya no se ofrece para la operación.` })
      },
      onError: (error) => {
        setPorDesactivar(null)
        toast.show('No se pudo desactivar', { message: mensajeDeError(error) })
      },
    })
  }

  const enCurso = (accion: UseMutationResult<Ambulancia, Error, number>, ambulancia: Ambulancia) =>
    accion.isPending && accion.variables === ambulancia.id

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
            ambulancias.data.map((ambulancia) => {
              const enAtencion = ambulancia.estado === 'EN_ATENCION'
              return (
                <FilaTabla key={ambulancia.id} columnas={COLUMNAS} atenuada={!ambulancia.activa}>
                  <Text fontFamily="$mono" fontSize={13} fontWeight="500" color={ambulancia.activa ? '$texto' : '$textoSecundario'}>
                    {ambulancia.placa}
                  </Text>
                  <Paragraph fontSize={14} color={ambulancia.activa ? '$texto' : '$textoTenue'} numberOfLines={1}>
                    {ambulancia.tipoUnidad}
                  </Paragraph>
                  <XStack opacity={ambulancia.activa ? 1 : 0.55}>
                    <EstadoAmbulancia estado={ambulancia.estado} />
                  </XStack>
                  {ambulancia.activa ? (
                    <Text fontSize={14} color="$texto">
                      Activa
                    </Text>
                  ) : (
                    <Insignia tono="contorno">Desactivada</Insignia>
                  )}
                  <XStack gap={6} justify="flex-end">
                    {ambulancia.activa && ambulancia.estado === 'FUERA_DE_SERVICIO' ? (
                      <Button
                        size="$3"
                        variant="outlined"
                        icon={<IconoReactivar size={15} />}
                        disabled={enCurso(reactivar, ambulancia)}
                        onPress={() => ejecutar(reactivar, ambulancia, 'Ambulancia reactivada')}
                      >
                        Reactivar
                      </Button>
                    ) : null}
                    {ambulancia.activa && ambulancia.estado !== 'FUERA_DE_SERVICIO' ? (
                      <Button
                        size="$3"
                        variant="outlined"
                        icon={<IconoLlave size={15} />}
                        disabled={enAtencion || enCurso(fueraDeServicio, ambulancia)}
                        opacity={enAtencion ? 0.5 : 1}
                        aria-label={enAtencion ? `Fuera de servicio: ${MOTIVO_EN_ATENCION.toLowerCase()}` : undefined}
                        onPress={() => ejecutar(fueraDeServicio, ambulancia, 'Ambulancia fuera de servicio')}
                      >
                        Fuera de servicio
                      </Button>
                    ) : null}
                    <Button
                      size="$3"
                      variant="outlined"
                      icon={<IconoHistorial size={15} />}
                      onPress={() => setHistorial({ tipo: 'ambulancia', id: ambulancia.id, placa: ambulancia.placa })}
                    >
                      Historial
                    </Button>
                    {ambulancia.activa ? (
                      <Button
                        size="$3"
                        chromeless
                        icon={<IconoApagar size={15} color="var(--primarioPresionado)" />}
                        disabled={enAtencion}
                        opacity={enAtencion ? 0.4 : 1}
                        aria-label={enAtencion ? `Desactivar: ${MOTIVO_EN_ATENCION.toLowerCase()}` : undefined}
                        onPress={() => setPorDesactivar(ambulancia)}
                      >
                        <Button.Text color="$primarioPresionado">Desactivar</Button.Text>
                      </Button>
                    ) : null}
                  </XStack>
                </FilaTabla>
              )
            })
          )}
        </Tabla>
      )}

      <RegistrarAmbulanciaDialog abierto={registrarAbierto} onCambiarAbierto={setRegistrarAbierto} />

      <DialogoConfirmacion
        abierto={porDesactivar !== null}
        onCambiarAbierto={(abierto) => (abierto ? undefined : setPorDesactivar(null))}
        titulo={`¿Desactivar la ambulancia ${porDesactivar?.placa ?? ''}?`}
        descripcion="Deja de ofrecerse para la operación. Sus asignaciones y atenciones se conservan."
        textoConfirmar="Desactivar"
        pendiente={desactivar.isPending}
        onConfirmar={confirmarDesactivacion}
      />

      <HistorialAsignacionesDialog sujeto={historial} onCerrar={() => setHistorial(null)} />
    </>
  )
}
