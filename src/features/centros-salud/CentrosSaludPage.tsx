import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Button, Paragraph, Text, useToastController } from 'tamagui'
import { mensajeDeError } from '../../shared/api/cliente'
import { BotonPrimario } from '../../shared/ui/botones'
import { DialogoConfirmacion } from '../../shared/ui/DialogoConfirmacion'
import { EncabezadoPagina } from '../../shared/ui/EncabezadoPagina'
import { Cargando, ErrorAlCargar } from '../../shared/ui/EstadosDeCarga'
import { IconoApagar, IconoEditar, IconoMas, IconoReactivar } from '../../shared/ui/iconos'
import { Insignia } from '../../shared/ui/Insignia'
import { MenuAcciones, type AccionDeMenu } from '../../shared/ui/MenuAcciones'
import { FilaTabla, Tabla, TablaVacia, type ColumnaTabla } from '../../shared/ui/Tabla'
import type { CentroSalud } from './api'
import { GuardarCentroDialog } from './GuardarCentroDialog'
import { activarCentroSaludMutation, centrosSaludTodosQuery, desactivarCentroSaludMutation } from './queries'

const COLUMNAS: ColumnaTabla[] = [
  { titulo: 'Centro' },
  { titulo: 'Dirección' },
  { titulo: 'Ubicación', ancho: 200 },
  { titulo: 'Registro', ancho: 110 },
  { titulo: 'Acciones', ancho: 96, alinearDerecha: true },
]

type Confirmacion = { tipo: 'desactivar' | 'activar'; centro: CentroSalud }

function textosDe({ tipo, centro }: Confirmacion) {
  return tipo === 'desactivar'
    ? {
        titulo: `¿Dar de baja ${centro.nombre}?`,
        descripcion:
          'Deja de ofrecerse como destino al paramédico y al ciudadano. Las atenciones y los traslados que ya lo usaron lo siguen mostrando.',
        textoConfirmar: 'Dar de baja',
        tono: 'peligro' as const,
        exito: 'Centro dado de baja',
        detalle: `${centro.nombre} ya no se ofrece como destino.`,
      }
    : {
        titulo: `¿Volver a ofrecer ${centro.nombre}?`,
        descripcion: 'Vuelve a aparecer como destino para el paramédico y el ciudadano.',
        textoConfirmar: 'Activar',
        tono: 'aviso' as const,
        exito: 'Centro activado',
        detalle: `${centro.nombre} vuelve a ofrecerse como destino.`,
      }
}

/** PB-24: catálogo de centros de salud. No hay borrado, solo baja: el historial sigue apuntando a cada centro. */
export function CentrosSaludPage() {
  const queryClient = useQueryClient()
  const toast = useToastController()
  const centros = useQuery(centrosSaludTodosQuery())
  const desactivar = useMutation(desactivarCentroSaludMutation(queryClient))
  const activar = useMutation(activarCentroSaludMutation(queryClient))

  /** `undefined`: cerrado; `null`: registrar uno nuevo; un centro: corregirlo. */
  const [enEdicion, setEnEdicion] = useState<CentroSalud | null | undefined>(undefined)
  const [confirmacion, setConfirmacion] = useState<Confirmacion | null>(null)

  const textos = confirmacion ? textosDe(confirmacion) : null

  function confirmar() {
    if (!confirmacion || !textos) {
      return
    }
    const accion = confirmacion.tipo === 'desactivar' ? desactivar : activar
    accion.mutate(confirmacion.centro.id, {
      onSuccess: () => {
        setConfirmacion(null)
        toast.show(textos.exito, { message: textos.detalle })
      },
      onError: (error) => {
        setConfirmacion(null)
        toast.show('No se pudo completar la acción', { message: mensajeDeError(error) })
      },
    })
  }

  function accionesDe(centro: CentroSalud): AccionDeMenu[] {
    const editar: AccionDeMenu = {
      etiqueta: 'Editar',
      icono: <IconoEditar size={16} />,
      onElegir: () => setEnEdicion(centro),
    }
    return centro.activo
      ? [
          editar,
          {
            etiqueta: 'Dar de baja',
            icono: <IconoApagar size={16} color="var(--primarioPresionado)" />,
            tono: 'peligro',
            onElegir: () => setConfirmacion({ tipo: 'desactivar', centro }),
          },
        ]
      : [
          {
            etiqueta: 'Activar',
            icono: <IconoReactivar size={16} />,
            onElegir: () => setConfirmacion({ tipo: 'activar', centro }),
          },
          editar,
        ]
  }

  return (
    <>
      <EncabezadoPagina
        titulo="Centros de salud"
        descripcion="Hospitales, clínicas y postas que el paramédico y el ciudadano eligen como destino."
        accion={
          <BotonPrimario size="$4" icon={<IconoMas size={16} color="#FFFFFF" />} onPress={() => setEnEdicion(null)}>
            <Button.Text color="$primarioTexto">Registrar centro</Button.Text>
          </BotonPrimario>
        }
      />

      {centros.isPending ? (
        <Cargando texto="Cargando los centros de salud…" />
      ) : centros.isError ? (
        <ErrorAlCargar error={centros.error} onReintentar={() => centros.refetch()} />
      ) : (
        <Tabla columnas={COLUMNAS}>
          {centros.data.length === 0 ? (
            <TablaVacia>Aún no hay centros de salud registrados.</TablaVacia>
          ) : (
            centros.data.map((centro) => (
              <FilaTabla key={centro.id} columnas={COLUMNAS} atenuada={!centro.activo}>
                <Text fontSize={14} fontWeight="500" color={centro.activo ? '$texto' : '$textoSecundario'} numberOfLines={1}>
                  {centro.nombre}
                </Text>
                <Paragraph fontSize={14} color={centro.activo ? '$texto' : '$textoTenue'} numberOfLines={1}>
                  {centro.direccion ?? '—'}
                </Paragraph>
                <Text fontFamily="$mono" fontSize={12} color="$textoSecundario">
                  {centro.latitud.toFixed(5)}, {centro.longitud.toFixed(5)}
                </Text>
                {centro.activo ? (
                  <Text fontSize={14} color="$texto">
                    Activo
                  </Text>
                ) : (
                  <Insignia tono="contorno">De baja</Insignia>
                )}
                <MenuAcciones etiqueta={`Acciones de ${centro.nombre}`} acciones={accionesDe(centro)} />
              </FilaTabla>
            ))
          )}
        </Tabla>
      )}

      {enEdicion !== undefined ? <GuardarCentroDialog centro={enEdicion} onCerrar={() => setEnEdicion(undefined)} /> : null}

      <DialogoConfirmacion
        abierto={confirmacion !== null}
        onCambiarAbierto={(abierto) => (abierto ? undefined : setConfirmacion(null))}
        titulo={textos?.titulo ?? ''}
        descripcion={textos?.descripcion ?? ''}
        textoConfirmar={textos?.textoConfirmar ?? ''}
        tono={textos?.tono}
        pendiente={desactivar.isPending || activar.isPending}
        onConfirmar={confirmar}
      />
    </>
  )
}
