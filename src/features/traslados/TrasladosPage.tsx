import { useQuery } from '@tanstack/react-query'
import { getRouteApi, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { Button, Spinner, Text, ToggleGroup, XStack, YStack } from 'tamagui'
import { InsigniaEstadoAtencion } from '../../shared/atencion/InsigniaEstadoAtencion'
import { comoDia, hora } from '../../shared/formato/fechas'
import { EncabezadoPagina } from '../../shared/ui/EncabezadoPagina'
import { Cargando, ErrorAlCargar } from '../../shared/ui/EstadosDeCarga'
import { IconoActualizar, IconoAnterior, IconoSiguiente } from '../../shared/ui/iconos'
import { FilaTabla, Tabla, TablaVacia, type ColumnaTabla } from '../../shared/ui/Tabla'
import { TIPO_UNIDAD_CORTO } from '../flota/api'
import { esperaUnidad, type Traslado, type TrasladoDelPanel } from './api'
import { esVista, TEXTO_VISTA, VISTAS, type BusquedaTraslados } from './busqueda'
import { DialogoAsignar } from './DialogoAsignar'
import { InsigniaEstadoTraslado } from './InsigniasDeTraslado'
import { problemasQuery, trasladosDelDiaQuery } from './queries'

const rutaApi = getRouteApi('/protegida/traslados')

const COLUMNAS: ColumnaTabla[] = [
  { titulo: 'Recojo', ancho: 90 },
  { titulo: 'Paciente', ancho: 180 },
  { titulo: 'Recorrido' },
  { titulo: 'Unidad', ancho: 160 },
  { titulo: 'Estado', ancho: 150 },
  { titulo: '', ancho: 110, alinearDerecha: true },
]

/** Los traslados del día y los que necesitan una decisión, en la misma tabla. */
export function TrasladosPage() {
  const busqueda = rutaApi.useSearch()
  const navigate = rutaApi.useNavigate()
  const vista = busqueda.vista ?? 'DIA'
  const dia = busqueda.dia
  const [aAsignar, setAAsignar] = useState<Traslado | null>(null)

  const delDia = useQuery({ ...trasladosDelDiaQuery(dia), enabled: vista === 'DIA' })
  const problemas = useQuery(problemasQuery())
  const consulta = vista === 'DIA' ? delDia : problemas

  function cambiarVista(valor: string) {
    if (esVista(valor) && valor !== vista) {
      navigate({ search: { vista: valor === 'DIA' ? undefined : valor, dia: valor === 'DIA' ? dia : undefined } })
    }
  }

  function moverDia(dias: number) {
    const base = dia ? new Date(`${dia}T12:00:00`) : new Date()
    base.setDate(base.getDate() + dias)
    const siguiente = comoDia(base)
    navigate({ search: { vista: undefined, dia: siguiente === comoDia(new Date()) ? undefined : siguiente } })
  }

  const cantidadProblemas = problemas.data?.length ?? 0

  return (
    <>
      <EncabezadoPagina
        titulo="Traslados"
        descripcion="Pedidos de traslado y la unidad que los está haciendo. La unidad se asigna cuando llega la hora de salir."
        accion={
          <Button
            size="$4"
            variant="outlined"
            icon={consulta.isFetching ? <Spinner size="small" color="$textoSecundario" /> : <IconoActualizar size={16} />}
            disabled={consulta.isFetching}
            onPress={() => consulta.refetch()}
          >
            Actualizar
          </Button>
        }
      />

      <YStack gap={16}>
        <XStack items="center" justify="space-between" gap={16} flexWrap="wrap">
          <ToggleGroup
            type="single"
            disableDeactivation
            value={vista}
            onValueChange={cambiarVista}
            aria-label="Elegir vista"
            self="flex-start"
            flexDirection="row"
            gap={2}
            p={3}
            rounded={10}
            bg="$superficie"
            borderWidth={1}
            borderColor="$borde"
          >
            {VISTAS.map((opcion) => {
              const elegido = opcion === vista
              return (
                <ToggleGroup.Item
                  key={opcion}
                  value={opcion}
                  width="auto"
                  height={32}
                  px={14}
                  py={0}
                  m={0}
                  rounded={7}
                  borderWidth={0}
                  bg="transparent"
                  cursor="pointer"
                  hoverStyle={{ bg: '$fondo' }}
                  pressStyle={{ bg: '$fondo' }}
                  activeStyle={{ backgroundColor: '$primarioTinte' }}
                >
                  <Text
                    fontSize={13}
                    fontWeight={elegido ? '600' : '500'}
                    color={elegido ? '$primarioPresionado' : '$textoSecundario'}
                  >
                    {opcion === 'PROBLEMAS' && cantidadProblemas > 0
                      ? `${TEXTO_VISTA[opcion]} (${cantidadProblemas})`
                      : TEXTO_VISTA[opcion]}
                  </Text>
                </ToggleGroup.Item>
              )
            })}
          </ToggleGroup>

          {vista === 'DIA' ? (
            <XStack items="center" gap={8}>
              <Button size="$3" variant="outlined" icon={<IconoAnterior size={16} />} onPress={() => moverDia(-1)} />
              <Text fontSize={14} fontWeight="500" color="$texto" minW={140} text="center">
                {etiquetaDelDia(dia)}
              </Text>
              <Button size="$3" variant="outlined" icon={<IconoSiguiente size={16} />} onPress={() => moverDia(1)} />
            </XStack>
          ) : null}
        </XStack>

        {consulta.isPending ? (
          <Cargando texto="Cargando traslados…" />
        ) : consulta.isError ? (
          <ErrorAlCargar error={consulta.error} onReintentar={() => consulta.refetch()} />
        ) : (
          <Tabla columnas={COLUMNAS}>
            {consulta.data.length === 0 ? (
              <TablaVacia>
                {vista === 'PROBLEMAS'
                  ? 'Ningún traslado está esperando unidad.'
                  : 'No hay traslados para este día.'}
              </TablaVacia>
            ) : (
              consulta.data.map((fila) => (
                <FilaTraslado key={fila.traslado.id} fila={fila} busqueda={busqueda} onAsignar={setAAsignar} />
              ))
            )}
          </Tabla>
        )}
      </YStack>

      <DialogoAsignar traslado={aAsignar} onCerrar={() => setAAsignar(null)} />
    </>
  )
}

function etiquetaDelDia(dia: string | undefined) {
  if (!dia) {
    return 'Hoy'
  }
  const fecha = new Date(`${dia}T12:00:00`)
  return fecha.toLocaleDateString('es-BO', { weekday: 'short', day: 'numeric', month: 'short' })
}

type PropsFila = {
  fila: TrasladoDelPanel
  /** La vista y el día de esta lista: el detalle los guarda para volver a ella tal como estaba. */
  busqueda: BusquedaTraslados
  onAsignar: (traslado: Traslado) => void
}

/** Toda la fila lleva al detalle; el botón de asignar se resuelve sin salir de la tabla. */
function FilaTraslado({ fila, busqueda, onAsignar }: PropsFila) {
  const { traslado } = fila
  return (
    <Link
      to="/traslados/$trasladoId"
      params={{ trasladoId: traslado.id }}
      search={busqueda}
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <FilaTabla columnas={COLUMNAS} interactiva>
        <Text fontSize={14} fontFamily="$mono" color="$texto">
          {hora(traslado.horaSalidaEstimada)}
        </Text>

        <YStack gap={2} minW={0}>
          <Text fontSize={14} fontWeight="500" color="$texto" numberOfLines={1}>
            {traslado.pasajero}
          </Text>
          <Text fontSize={12} color="$textoSecundario">
            {TIPO_UNIDAD_CORTO[traslado.tipoUnidad]}
          </Text>
        </YStack>

        <Text fontSize={13} color="$textoSecundario" numberOfLines={2}>
          {traslado.origenReferencia ?? 'Origen en el mapa'} → {traslado.centroSaludDestino ?? 'Destino en el mapa'}
        </Text>

        {fila.placa ? (
          <YStack gap={2} minW={0}>
            <Text fontSize={13} fontFamily="$mono" color="$texto">
              {fila.placa}
            </Text>
            {fila.estadoAtencion ? <InsigniaEstadoAtencion estado={fila.estadoAtencion} /> : null}
          </YStack>
        ) : (
          <Text fontSize={13} color="$textoSecundario">
            Sin asignar
          </Text>
        )}

        <InsigniaEstadoTraslado estado={traslado.estado} />

        {esperaUnidad(traslado.estado) ? (
          <Button
            size="$3"
            variant="outlined"
            onPress={(evento) => {
              // La fila entera es un enlace: sin esto, asignar también abriría el detalle.
              evento.preventDefault()
              evento.stopPropagation()
              onAsignar(traslado)
            }}
          >
            <Button.Text fontSize={12} fontWeight="600" color="$texto">
              Asignar
            </Button.Text>
          </Button>
        ) : null}
      </FilaTabla>
    </Link>
  )
}
