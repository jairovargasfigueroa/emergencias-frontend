import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Button, Spinner, Text, ToggleGroup, XStack, YStack } from 'tamagui'
import type { Pagina } from '../../shared/api/cliente'
import { fechaHoraCorta, tiempoTranscurrido } from '../../shared/formato/fechas'
import { EncabezadoPagina } from '../../shared/ui/EncabezadoPagina'
import { Cargando, ErrorAlCargar } from '../../shared/ui/EstadosDeCarga'
import { IconoActualizar, IconoAnterior, IconoSiguiente } from '../../shared/ui/iconos'
import { FilaTabla, Tabla, TablaVacia, type ColumnaTabla } from '../../shared/ui/Tabla'
import { estaAbierto, type FiltroEstadoIncidente, type IncidenteResumen } from './api'
import { InsigniaEstadoIncidente } from './InsigniasDeEstado'
import { incidentesQuery } from './queries'
import { TEXTO_FILTRO } from './textos'

const COLUMNAS: ColumnaTabla[] = [
  { titulo: 'Estado', ancho: 200 },
  { titulo: 'Creación', ancho: 150 },
  { titulo: 'Transcurrido o cierre', ancho: 170 },
  { titulo: 'Afectados', ancho: 120 },
  { titulo: 'Alertas', ancho: 90 },
  { titulo: 'Unidades' },
]

const FILTROS: FiltroEstadoIncidente[] = ['ABIERTOS', 'CERRADOS', 'TODOS']

const SIN_INCIDENTES: Record<FiltroEstadoIncidente, string> = {
  ABIERTOS: 'No hay incidentes abiertos.',
  CERRADOS: 'No hay incidentes cerrados.',
  TODOS: 'Aún no hay incidentes.',
}

/** Cada cuánto se recalcula el tiempo transcurrido de los incidentes abiertos. */
const INTERVALO_RELOJ_MS = 30_000

function esFiltro(valor: string): valor is FiltroEstadoIncidente {
  return (FILTROS as string[]).includes(valor)
}

/**
 * Consulta de incidentes, solo lectura: los incidentes los crea el sistema a partir de las alertas y cambian solo por
 * la máquina de estados. El filtro y la página viven en el estado de la pantalla.
 */
export function IncidentesPage() {
  const [filtro, setFiltro] = useState<FiltroEstadoIncidente>('ABIERTOS')
  const [pagina, setPagina] = useState(0)
  const [ahora, setAhora] = useState(() => Date.now())
  const incidentes = useQuery(incidentesQuery(filtro, pagina))

  useEffect(() => {
    const reloj = setInterval(() => setAhora(Date.now()), INTERVALO_RELOJ_MS)
    return () => clearInterval(reloj)
  }, [])

  // Si la lista se achicó (por ejemplo, porque se cerraron incidentes) y la página ya no existe, se pasa a la última.
  const datos = incidentes.data
  if (datos && !incidentes.isPlaceholderData && pagina > 0 && pagina >= datos.totalPaginas) {
    setPagina(Math.max(datos.totalPaginas - 1, 0))
  }

  function cambiarFiltro(valor: string) {
    if (esFiltro(valor) && valor !== filtro) {
      setFiltro(valor)
      setPagina(0)
    }
  }

  return (
    <>
      <EncabezadoPagina
        titulo="Incidentes"
        descripcion="Incidentes generados a partir de las alertas, del más reciente al más antiguo."
        accion={
          <Button
            size="$4"
            variant="outlined"
            icon={incidentes.isFetching ? <Spinner size="small" color="$textoSecundario" /> : <IconoActualizar size={16} />}
            disabled={incidentes.isFetching}
            onPress={() => incidentes.refetch()}
          >
            Actualizar
          </Button>
        }
      />

      <YStack gap={16}>
        <ToggleGroup
          type="single"
          disableDeactivation
          value={filtro}
          onValueChange={cambiarFiltro}
          aria-label="Filtrar por estado"
          self="flex-start"
          flexDirection="row"
          gap={2}
          p={3}
          rounded={10}
          bg="$superficie"
          borderWidth={1}
          borderColor="$borde"
        >
          {FILTROS.map((opcion) => {
            const elegido = opcion === filtro
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
                  {TEXTO_FILTRO[opcion]}
                </Text>
              </ToggleGroup.Item>
            )
          })}
        </ToggleGroup>

        {incidentes.isPending ? (
          <Cargando texto="Cargando incidentes…" />
        ) : incidentes.isError ? (
          <ErrorAlCargar error={incidentes.error} onReintentar={() => incidentes.refetch()} />
        ) : (
          <YStack gap={12} opacity={incidentes.isPlaceholderData ? 0.6 : 1}>
            <Tabla columnas={COLUMNAS}>
              {incidentes.data.contenido.length === 0 ? (
                <TablaVacia>{SIN_INCIDENTES[filtro]}</TablaVacia>
              ) : (
                incidentes.data.contenido.map((incidente) => (
                  <FilaIncidente key={incidente.id} incidente={incidente} ahora={ahora} />
                ))
              )}
            </Tabla>
            {incidentes.data.totalElementos > 0 ? (
              <Paginacion datos={incidentes.data} bloqueada={incidentes.isPlaceholderData} onIrA={setPagina} />
            ) : null}
          </YStack>
        )}
      </YStack>
    </>
  )
}

/** Toda la fila es un enlace al detalle del incidente. */
function FilaIncidente({ incidente, ahora }: { incidente: IncidenteResumen; ahora: number }) {
  const abierto = estaAbierto(incidente.estado)
  return (
    <Link to="/incidentes/$incidenteId" params={{ incidenteId: incidente.id }} style={{ textDecoration: 'none' }}>
      <FilaTabla columnas={COLUMNAS} alto={64} interactiva>
        <InsigniaEstadoIncidente estado={incidente.estado} />
        <Text fontSize={14} color="$texto">
          {fechaHoraCorta(incidente.fechaHoraCreacion)}
        </Text>
        <YStack>
          <Text fontSize={14} color="$texto">
            {abierto
              ? tiempoTranscurrido(incidente.fechaHoraCreacion, ahora)
              : incidente.fechaHoraCierre
                ? fechaHoraCorta(incidente.fechaHoraCierre)
                : '—'}
          </Text>
          <Text fontSize={12} lineHeight={16} color="$textoSecundario">
            {abierto ? 'abierto' : 'cerrado'}
          </Text>
        </YStack>
        {incidente.cantidadAfectados === null ? (
          <Text fontSize={14} color="$textoTenue">
            Sin reportar
          </Text>
        ) : (
          <Text fontSize={14} color="$texto">
            {incidente.cantidadAfectados}
          </Text>
        )}
        <Text fontSize={14} color="$texto">
          {incidente.cantidadAlertas}
        </Text>
        {incidente.unidades.length === 0 ? (
          <Text fontSize={14} color="$textoTenue">
            Ninguna
          </Text>
        ) : (
          <Text fontFamily="$mono" fontSize={13} fontWeight="500" color="$texto" numberOfLines={1}>
            {incidente.unidades.join(', ')}
          </Text>
        )}
      </FilaTabla>
    </Link>
  )
}

type PropsPaginacion = {
  datos: Pagina<IncidenteResumen>
  /** Mientras llega otra página no se puede seguir avanzando. */
  bloqueada: boolean
  onIrA: (pagina: number) => void
}

function Paginacion({ datos, bloqueada, onIrA }: PropsPaginacion) {
  const desde = datos.pagina * datos.tamano + 1
  const hasta = datos.pagina * datos.tamano + datos.contenido.length
  const total = `${datos.totalElementos} ${datos.totalElementos === 1 ? 'incidente' : 'incidentes'}`
  const sinAnterior = bloqueada || datos.pagina === 0
  const sinSiguiente = bloqueada || datos.pagina + 1 >= datos.totalPaginas

  return (
    <XStack items="center" justify="space-between" gap={16} flexWrap="wrap">
      <Text fontSize={13} color="$textoSecundario">
        {datos.contenido.length > 0 ? `${desde}–${hasta} de ${total}` : total}
      </Text>
      <XStack items="center" gap={8}>
        <Text fontSize={13} color="$textoSecundario" mr={4}>
          Página {datos.pagina + 1} de {Math.max(datos.totalPaginas, 1)}
        </Text>
        <Button
          size="$3"
          variant="outlined"
          icon={<IconoAnterior size={15} />}
          disabled={sinAnterior}
          opacity={sinAnterior ? 0.5 : 1}
          onPress={() => onIrA(datos.pagina - 1)}
        >
          Anterior
        </Button>
        <Button
          size="$3"
          variant="outlined"
          iconAfter={<IconoSiguiente size={15} />}
          disabled={sinSiguiente}
          opacity={sinSiguiente ? 0.5 : 1}
          onPress={() => onIrA(datos.pagina + 1)}
        >
          Siguiente
        </Button>
      </XStack>
    </XStack>
  )
}
